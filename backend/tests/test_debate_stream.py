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


class HangingAIService:
    async def generate_argument(
        self,
        agent_name,
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
        agent_role,
        system_prompt,
        topic,
        context="",
        previous_arguments=None,
    ):
        time.sleep(0.2)
        return "unreachable"

    async def generate_consensus(self, topic, all_arguments):
        return {
            "content": "unreachable",
            "key_points": [],
            "usage_metadata": None,
        }


def make_orchestrator(ai_service=None):
    orchestrator = DebateOrchestrator.__new__(DebateOrchestrator)
    orchestrator.ai_service = ai_service or FakeAIService()
    orchestrator.agent_order = [
        "devils_advocate",
        "optimist",
        "data_analyst",
        "mediator",
    ]
    orchestrator.max_retries = 1
    orchestrator.retry_delay = 0
    orchestrator.generation_timeout = 30
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


@pytest.mark.asyncio
async def test_run_debate_stream_yields_incremental_events_and_stores_final_state():
    orchestrator = make_orchestrator()
    stored = {}

    async def store_debate_results(state, db_session):
        stored["state"] = state
        stored["db_session"] = db_session

    orchestrator._store_debate_results = store_debate_results
    db_session = object()

    events = [
        event
        async for event in orchestrator.run_debate_stream(
            topic="Should cities ban cars?",
            debate_id="debate-1",
            db_session=db_session,
        )
    ]

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "round_end",
        "round_start",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "round_end",
        "round_start",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "agent_start",
        "argument",
        "round_end",
        "consensus",
        "complete",
    ]
    assert events[0]["round"] == 1
    assert events[10]["round"] == 2
    assert events[20]["round"] == 3
    assert events[-1]["debate_id"] == "debate-1"

    argument_events = [event for event in events if event["type"] == "argument"]
    agent_start_events = [event for event in events if event["type"] == "agent_start"]
    assert len(agent_start_events) == 12
    assert agent_start_events[0] == {
        "type": "agent_start",
        "agent_name": "devils_advocate",
        "round": 1,
    }
    assert agent_start_events[-1] == {
        "type": "agent_start",
        "agent_name": "mediator",
        "round": 3,
    }
    assert len(argument_events) == 12
    assert argument_events[0]["data"]["agent_name"] == "devils_advocate"
    assert argument_events[0]["data"]["round_number"] == 1
    assert argument_events[-1]["data"]["agent_name"] == "mediator"
    assert argument_events[-1]["data"]["round_number"] == 3
    assert argument_events[-1]["data"]["timestamp"]

    consensus_event = events[-2]
    assert consensus_event["data"]["content"] == "Consensus for Should cities ban cars?"
    assert consensus_event["data"]["key_points"] == ["First point", "Second point"]

    assert stored["db_session"] is db_session
    assert stored["state"]["status"] == "completed"
    assert stored["state"]["debate_id"] == "debate-1"
    assert len(stored["state"]["arguments"]) == 12
    assert stored["state"]["consensus"]["content"] == "Consensus for Should cities ban cars?"


@pytest.mark.asyncio
async def test_run_debate_stream_yields_error_when_agent_generation_times_out():
    orchestrator = make_orchestrator(HangingAIService())
    orchestrator.generation_timeout = 0.01

    events = await asyncio.wait_for(
        _collect_stream_events(
            orchestrator.run_debate_stream(
                topic="Will this timeout?",
                debate_id="debate-timeout",
                db_session=None,
            )
        ),
        timeout=1,
    )

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "error",
    ]
    assert events[-1]["message"] == (
        "devils_advocate generation timed out after 0.01 seconds"
    )


@pytest.mark.asyncio
async def test_run_debate_stream_times_out_when_ai_call_blocks_event_loop():
    orchestrator = make_orchestrator(BlockingAIService())
    orchestrator.generation_timeout = 0.01

    events = await asyncio.wait_for(
        _collect_stream_events(
            orchestrator.run_debate_stream(
                topic="Will this blocking call timeout?",
                debate_id="debate-blocking-timeout",
                db_session=None,
            )
        ),
        timeout=1,
    )

    assert [event["type"] for event in events] == [
        "round_start",
        "agent_start",
        "error",
    ]
    assert events[-1]["message"] == (
        "devils_advocate generation timed out after 0.01 seconds"
    )


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
