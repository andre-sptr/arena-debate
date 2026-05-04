import pytest

from agents.devil_1 import Devil1Agent
from agents.devil_2 import Devil2Agent
from agents.judge import JudgeAgent
from agents.optimist_1 import Optimist1Agent
from agents.optimist_2 import Optimist2Agent
from services.ai_service import AIService


def make_service_without_model():
    return AIService.__new__(AIService)


def test_team_a_round_one_prompt_builds_affirmative_case_without_opponent_mentions():
    service = make_service_without_model()

    prompt = service._build_argument_prompt(
        agent_name="optimist_1",
        agent_display_name="Nova",
        agent_role="The Visionary Architect (Team A)",
        topic="Should cities ban cars?",
        context=Optimist1Agent.format_context(1, []),
        previous_arguments=[],
    )

    assert "Do not name or directly address Team B, Silas, or Vance in this opening" in prompt
    assert "build Team A's affirmative case first" in prompt
    assert "Silas pointed out" not in prompt
    assert "Vance warned" not in prompt


def test_team_a_later_round_prompt_allows_direct_rebuttal_and_opponent_references():
    service = make_service_without_model()

    prompt = service._build_argument_prompt(
        agent_name="optimist_2",
        agent_display_name="Forge",
        agent_role="The Pragmatic Idealist (Team A)",
        topic="Should cities ban cars?",
        context=Optimist2Agent.format_context(2, []),
        previous_arguments=[
            {
                "agent_name": "devil_1",
                "agent_display_name": "Silas",
                "agent_role": "The Logical Critic (Team B)",
                "content": "The plan overpromises.",
            }
        ],
    )

    assert "You may directly reference Silas, Vance, Nova, or Forge when it strengthens clash" in prompt
    assert "Silas" in prompt
    assert "The plan overpromises." in prompt


@pytest.mark.parametrize(
    "agent_name,display_name,role",
    [
        ("optimist_1", "Nova", "The Visionary Architect (Team A)"),
        ("optimist_2", "Forge", "The Pragmatic Idealist (Team A)"),
        ("devil_1", "Silas", "The Logical Critic (Team B)"),
        ("devil_2", "Vance", "The Risk Analyst (Team B)"),
    ],
)
def test_argument_prompt_requires_natural_structure_and_evidence(agent_name, display_name, role):
    service = make_service_without_model()

    prompt = service._build_argument_prompt(
        agent_name=agent_name,
        agent_display_name=display_name,
        agent_role=role,
        topic="Should cities ban cars?",
        context="Round context",
        previous_arguments=[],
    )

    assert "2-4 concise sentences" in prompt
    assert "claim, reason or evidence, and impact" in prompt
    assert "historical precedent, real-world cases, or known data" in prompt
    assert "Do not invent statistics" in prompt


@pytest.mark.asyncio
async def test_generate_argument_and_stream_argument_use_same_prompt_builder(monkeypatch):
    service = make_service_without_model()
    prompts = []

    def fake_build_prompt(**kwargs):
        return "SHARED PROMPT"

    class FakeModel:
        async def ainvoke(self, messages):
            prompts.append(("generate", messages[-1].content))
            return type("Response", (), {"content": "generated"})()

        async def astream(self, messages):
            prompts.append(("stream", messages[-1].content))
            yield type("Chunk", (), {"content": "streamed"})()

    service.default_model = FakeModel()
    monkeypatch.setattr(service, "_build_argument_prompt", fake_build_prompt)

    generated = await service.generate_argument(
        agent_name="devil_1",
        agent_display_name="Silas",
        agent_role="The Logical Critic (Team B)",
        system_prompt="system",
        topic="Topic",
    )
    streamed = [
        chunk
        async for chunk in service.stream_argument(
            agent_name="devil_1",
            agent_display_name="Silas",
            agent_role="The Logical Critic (Team B)",
            system_prompt="system",
            topic="Topic",
        )
    ]

    assert generated == "generated"
    assert streamed == ["streamed"]
    assert prompts == [("generate", "SHARED PROMPT"), ("stream", "SHARED PROMPT")]


@pytest.mark.parametrize(
    "agent_cls,keywords",
    [
        (Optimist1Agent, ["historical progress", "evidence", "2-4 sentences"]),
        (Optimist2Agent, ["implementation examples", "measurable impact", "2-4 sentences"]),
        (Devil1Agent, ["burden of proof", "tradeoff", "evidence", "2-4 sentences"]),
        (Devil2Agent, ["historical failures", "unintended consequences", "2-4 sentences"]),
    ],
)
def test_active_agent_personas_require_evidence_and_concise_debate_style(agent_cls, keywords):
    prompt = agent_cls.get_system_prompt().lower()

    for keyword in keywords:
        assert keyword.lower() in prompt


def test_judge_prompt_evaluates_evidence_quality_and_clash():
    prompt = JudgeAgent.get_system_prompt().lower()

    assert "evidence quality" in prompt
    assert "clash" in prompt
    assert "consensus is justified" in prompt
