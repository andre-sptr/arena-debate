import agents


def test_agents_all_exports_existing_symbols():
    for name in agents.__all__:
        assert hasattr(agents, name), f"{name} is listed in __all__ but not exported"


def test_agents_all_omits_legacy_agent_names():
    assert "DevilsAdvocateAgent" not in agents.__all__
    assert "OptimistAgent" not in agents.__all__
    assert "DataAnalystAgent" not in agents.__all__
    assert "MediatorAgent" not in agents.__all__
