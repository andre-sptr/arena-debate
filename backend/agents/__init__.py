"""
AI Agent Definitions for Arena Debate Platform

This module contains the four debate agents, each with unique personas and debate styles:
- Devil's Advocate: Skeptical challenger who questions assumptions
- The Optimist: Visionary enthusiast who highlights opportunities
- Data Analyst: Objective researcher who provides evidence-based analysis
- The Mediator: Balanced synthesizer who seeks common ground

Each agent provides:
- Unique system prompt defining their personality
- Metadata for UI representation (color, emoji, role)
- Context formatting for different debate rounds
"""
from .devil_1 import Devil1Agent
from .devil_2 import Devil2Agent
from .optimist_1 import Optimist1Agent
from .optimist_2 import Optimist2Agent
from .judge import JudgeAgent
from typing import Dict, Type


AGENTS: Dict[str, Type] = {
    "devil_1": Devil1Agent,
    "devil_2": Devil2Agent,
    "optimist_1": Optimist1Agent,
    "optimist_2": Optimist2Agent,
    "judge": JudgeAgent,
}


def get_agent(agent_name: str):
    """
    Get an agent class by name.
    
    Args:
        agent_name: Name of the agent (e.g., "devils_advocate")
        
    Returns:
        Agent class
        
    Raises:
        KeyError: If agent name is not found
    """
    if agent_name not in AGENTS:
        raise KeyError(f"Agent '{agent_name}' not found. Available agents: {list(AGENTS.keys())}")
    return AGENTS[agent_name]


def get_all_agents() -> Dict[str, Type]:
    """
    Get all available agents.
    
    Returns:
        Dictionary mapping agent names to agent classes
    """
    return AGENTS.copy()


def get_agent_metadata(agent_name: str) -> Dict:
    """
    Get metadata for a specific agent.
    
    Args:
        agent_name: Name of the agent
        
    Returns:
        Dictionary containing agent metadata
    """
    agent = get_agent(agent_name)
    return agent.get_metadata()


def get_all_agents_metadata() -> list:
    """
    Get metadata for all agents.
    
    Returns:
        List of dictionaries containing metadata for each agent
    """
    return [agent.get_metadata() for agent in AGENTS.values()]


__all__ = [
    "DevilsAdvocateAgent",
    "OptimistAgent",
    "DataAnalystAgent",
    "MediatorAgent",
    "AGENTS",
    "get_agent",
    "get_all_agents",
    "get_agent_metadata",
    "get_all_agents_metadata",
]
