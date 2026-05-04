import json
import asyncio
import time

import pytest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from database import Base
from models.debate import Argument, Debate, DebateStatus
from orchestrator.debate_orchestrator import DebateOrchestrator
from routers.debate import format_sse_event


class FakeAIService:
    async def generate_argument(
        self,
        agent_name,
        agent_display_name,
        agent_role,
        system_prompt,
        topic,
        context="",
        previous_arguments=None,
    ):
        previous_arguments = previous_arguments or []
        round_number = (len(previous_arguments) // 4) + 1
        return f"{agent_name} argument for round {round_number}"

    async def generate_consensus(self, topic, all_arguments):
        return {
            "content": f"Consensus for {topic}",
            "key_points": ["First point", "Second point"],
            "usage_metadata": None,
        }

    async def check_consensus(self, topic, all_arguments, round_number):
        return round_number >= 3


class HangingAIService:
    async def generate_argument(
        self,
        agent_name,
        agent_display_name,
        agent_role,
        system_prompt,
        topic,
        context="",
        previous_arguments=None,
    ):
        await asyncio.sleep(10)
        return "unreachable"

    async def generate_consensus(self, topic, all_arguments):
        return {
            "content": "unreachable",
            "key_points": [],
            "usage_metadata": None,
        }


class BlockingAIService:
    async def generate_argument(
        self,
        agent_name,
        agent_display_name,
        agent_role,
        system_prompt,
        topic,
        context="",
        previous_arguments=None,
    ):
        await asyncio.to_thread(time.sleep, 0.2)
        return "unreachable"

    async def generate_consensus(self, topic, all_arguments):
        return {
            "content": "unreachable",
            "key_points": [],
            "usage_metadata": None,
        }


class ControlledAIService:
    def __init__(self):
        self.started = asyncio.Event()
        self.release = asyncio.Event()

    async def generate_argument(
        self,
        agent_name,
        agent_display_name,
        agent_role,
        system_prompt,
        topic,
        context="",
        previous_arguments=None,
    ):
        self.started.set()
        await self.release.wait()
        return f"{agent_name} controlled argument"

    async def generate_consensus(self, topic, all_arguments):
        return {
            "content": f"Consensus for {topic}",
            "key_points": ["Controlled point"],
            "usage_metadata": None,
        }

    async def check_consensus(self, topic, all_arguments, round_number):
        return True


def make_orchestrator(ai_service=None):
    orchestrator = DebateOrchestrator.__new__(DebateOrchestrator)
    orchestrator.ai_service = ai_service or FakeAIService()
    orchestrator.agent_order = [
        "optimist_1",
        "optimist_2",
        "devil_1",
        "devil_2",
    ]
    orchestrator.max_retries = 1
    orchestrator.retry_delay = 0
    orchestrator.generation_timeout = 30
    orchestrator.thinking_event_delay = 0
    return orchestrator


def make_completed_state(debate_id, topic, argument_contents):
    return {
        "debate_id": debate_id,
        "topic": topic,
        "current_round": 4,
        "arguments": [
            {
                "agent_name": f"agent_{index}",
                "agent_role": "Tester",
                "content": content,
                "round_number": index,
                "timestamp": f"2026-05-03T00:00:0{index}",
            }
            for index, content in enumerate(argument_contents, start=1)
        ],
        "consensus": {
            "content": f"Consensus for {topic}",
            "key_points": ["stable"],
            "usage_metadata": None,
        },
        "status": "completed",
        "error": None,
    }


def test_thinking_steps_use_safe_streaming_status_language():
    orchestrator = make_orchestrator()

    pro_steps = orchestrator._get_thinking_steps("optimist_1", 1)
    kontra_steps = orchestrator._get_thinking_steps("devil_1", 1)

    assert pro_steps[0]["phase"] == "memahami_topik"
    assert "Memahami topik" in pro_steps[0]["message"]
    assert "Menyusun jawaban pro" in pro_steps[-1]["message"]
    assert kontra_steps[0]["phase"] == "memahami_topik"
    assert "Menguji klaim pro" in " ".join(
        step["message"] for step in kontra_steps
    )


@pytest.mark.asyncio
async def test_run_debate_stream_starts_model_generation_while_streaming_thinking():
    ai_service = ControlledAIService()
    orchestrator = make_orchestrator(ai_service)
    orchestrator._store_debate_results = _noop_store_debate_results

    stream = orchestrator.run_debate_stream(
        topic="Should schools use AI tutors?",
        debate_id="debate-streaming-thinking",
    )

    events = [await anext(stream) for _ in range(3)]

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "thinking",
    ]
    assert ai_service.started.is_set()
    assert events[-1]["message"].startswith("Memahami topik")

    ai_service.release.set()
    await stream.aclose()


@pytest.mark.asyncio
async def test_run_debate_stream_yields_incremental_events_and_stores_final_state():
    orchestrator = make_orchestrator()
    stored = []

    async def store_debate_results(state, db_session):
        stored.append({"state": state, "db_session": db_session})

    orchestrator._store_debate_results = store_debate_results

    events = [
        event
        async for event in orchestrator.run_debate_stream(
            topic="Should cities ban cars?",
            debate_id="debate-1",
        )
    ]

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "round_end",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "round_start",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "round_end",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "round_start",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "argument",
        "round_end",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "consensus",
        "complete",
    ]
    assert events[0]["round"] == 1
    assert events[26]["round"] == 2
    assert events[52]["round"] == 3
    assert events[-1]["debate_id"] == "debate-1"

    argument_events = [event for event in events if event["type"] == "argument"]
    agent_start_events = [event for event in events if event["type"] == "agent_start"]
    assert len(agent_start_events) == 15
    assert agent_start_events[0] == {
        "type": "agent_start",
        "agent_name": "optimist_1",
        "round": 1,
    }
    assert agent_start_events[-1] == {
        "type": "agent_start",
        "agent_name": "judge",
        "round": 3,
    }
    assert len(argument_events) == 12
    assert argument_events[0]["data"]["agent_name"] == "optimist_1"
    assert argument_events[0]["data"]["round_number"] == 1
    assert argument_events[-1]["data"]["agent_name"] == "devil_2"
    assert argument_events[-1]["data"]["round_number"] == 3
    assert argument_events[-1]["data"]["timestamp"]

    consensus_event = events[-2]
    assert consensus_event["data"]["content"] == "Consensus for Should cities ban cars?"
    assert consensus_event["data"]["key_points"] == ["First point", "Second point"]

    first_agent_index = next(
        index
        for index, event in enumerate(events)
        if event == {"type": "agent_start", "agent_name": "optimist_1", "round": 1}
    )
    first_argument_index = next(
        index
        for index, event in enumerate(events)
        if event["type"] == "argument" and event["data"]["agent_name"] == "optimist_1"
    )
    first_thinking_events = events[first_agent_index + 1:first_argument_index]
    first_thinking_text = " ".join(
        event["message"] for event in first_thinking_events
    ).lower()
    assert [event["type"] for event in first_thinking_events] == [
        "thinking",
        "thinking",
        "thinking",
    ]
    assert all(event["agent_name"] == "optimist_1" for event in first_thinking_events)
    assert all(event["round"] == 1 for event in first_thinking_events)
    assert "pro" in first_thinking_text
    assert all("Team B" not in event["message"] for event in first_thinking_events)
    assert all("Silas" not in event["message"] for event in first_thinking_events)
    assert all("Vance" not in event["message"] for event in first_thinking_events)

    first_kontra_index = next(
        index
        for index, event in enumerate(events)
        if event == {"type": "agent_start", "agent_name": "devil_1", "round": 1}
    )
    first_kontra_argument_index = next(
        index
        for index, event in enumerate(events)
        if event["type"] == "argument" and event["data"]["agent_name"] == "devil_1"
    )
    first_kontra_text = " ".join(
        event["message"]
        for event in events[first_kontra_index + 1:first_kontra_argument_index]
    ).lower()
    assert "kontra" in first_kontra_text
    assert "pro" in first_kontra_text

    judge_index = next(
        index
        for index, event in enumerate(events)
        if event == {"type": "agent_start", "agent_name": "judge", "round": 1}
    )
    judge_thinking_events = events[judge_index + 1:judge_index + 4]
    judge_text = " ".join(event["message"] for event in judge_thinking_events).lower()
    assert "pro" in judge_text
    assert "kontra" in judge_text
    assert "kualitas bukti" in judge_text
    assert "benturan klaim" in judge_text
    assert "konsensus" in judge_text

    assert len(stored) == 2
    assert stored[-1]["state"]["status"] == "completed"
    assert stored[-1]["state"]["debate_id"] == "debate-1"
    assert len(stored[-1]["state"]["arguments"]) == 12
    assert stored[-1]["state"]["consensus"]["content"] == "Consensus for Should cities ban cars?"


@pytest.mark.asyncio
async def test_run_debate_stream_yields_error_when_agent_generation_times_out():
    orchestrator = make_orchestrator(HangingAIService())
    orchestrator.generation_timeout = 0.01
    orchestrator._store_debate_results = _noop_store_debate_results

    events = await asyncio.wait_for(
        _collect_stream_events(
            orchestrator.run_debate_stream(
                topic="Will this timeout?",
                debate_id="debate-timeout",
            )
        ),
        timeout=1,
    )

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "error",
    ]
    assert events[-1]["message"] == (
        "Failed after 1 retries: optimist_1 generation timed out after 0.01 seconds"
    )


@pytest.mark.asyncio
async def test_run_debate_stream_times_out_when_ai_call_blocks_event_loop():
    orchestrator = make_orchestrator(BlockingAIService())
    orchestrator.generation_timeout = 0.01
    orchestrator._store_debate_results = _noop_store_debate_results

    events = await asyncio.wait_for(
        _collect_stream_events(
            orchestrator.run_debate_stream(
                topic="Will this blocking call timeout?",
                debate_id="debate-blocking-timeout",
            )
        ),
        timeout=1,
    )

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "thinking",
        "thinking",
        "thinking",
        "error",
    ]
    assert events[-1]["message"] == (
        "Failed after 1 retries: optimist_1 generation timed out after 0.01 seconds"
    )


async def _noop_store_debate_results(state, db_session):
    return None


@pytest.mark.asyncio
async def test_store_debate_results_replaces_existing_debate_and_arguments():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False)
    orchestrator = make_orchestrator()

    try:
        async with Session() as session:
            await orchestrator._store_debate_results(
                make_completed_state("duplicate-id", "Original topic", ["old argument"]),
                session,
            )
            await orchestrator._store_debate_results(
                make_completed_state(
                    "duplicate-id",
                    "Updated topic",
                    ["new first argument", "new second argument"],
                ),
                session,
            )

            debate = (
                await session.execute(
                    select(Debate).where(Debate.id == "duplicate-id")
                )
            ).scalar_one()
            arguments = (
                await session.execute(
                    select(Argument)
                    .where(Argument.debate_id == "duplicate-id")
                    .order_by(Argument.round_number)
                )
            ).scalars().all()

        assert debate.topic == "Updated topic"
        assert debate.status == DebateStatus.COMPLETED
        assert debate.total_arguments == 2
        assert [arg["content"] for arg in debate.arguments] == [
            "new first argument",
            "new second argument",
        ]
        assert debate.consensus["content"] == "Consensus for Updated topic"
        assert [argument.content for argument in arguments] == [
            "new first argument",
            "new second argument",
        ]
    finally:
        await engine.dispose()


async def _collect_stream_events(stream):
    return [event async for event in stream]


def test_format_sse_event_serializes_json_as_single_sse_data_message():
    payload = {
        "type": "argument",
        "data": {
            "agent_name": "optimist",
            "content": "Line one\nLine two",
        },
    }

    encoded = format_sse_event(payload)

    assert encoded.startswith("data: ")
    assert encoded.endswith("\n\n")
    assert json.loads(encoded.removeprefix("data: ").strip()) == payload
