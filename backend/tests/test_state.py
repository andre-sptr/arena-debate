from orchestrator.state import MAX_DEBATE_ROUNDS, is_debate_complete


def test_debate_is_complete_when_consensus_exists_at_max_round():
    state = {
        "debate_id": "debate-complete",
        "topic": "Should cities ban cars?",
        "current_round": MAX_DEBATE_ROUNDS,
        "arguments": [],
        "consensus": {
            "content": "Consensus",
            "key_points": ["One"],
            "usage_metadata": None,
        },
        "status": "completed",
        "error": None,
    }

    assert is_debate_complete(state)
