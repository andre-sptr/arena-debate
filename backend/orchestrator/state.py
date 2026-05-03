"""
State definitions for LangGraph debate orchestrator

This module defines the state structure used by the LangGraph state machine
to manage the multi-agent debate workflow.
"""
from typing import TypedDict, List, Dict, Any, Optional
from typing_extensions import Annotated
from operator import add


class ArgumentDict(TypedDict):
    """Structure for a single argument in the debate"""
    agent_name: str
    agent_role: str
    content: str
    round_number: int
    timestamp: str


class ConsensusDict(TypedDict):
    """Structure for the final consensus"""
    content: str
    key_points: List[str]
    usage_metadata: Optional[Dict[str, Any]]


class DebateState(TypedDict):
    """
    State for the debate orchestration workflow.
    
    This state is passed through the LangGraph state machine and updated
    at each node. The 'arguments' field uses the add operator to accumulate
    arguments across rounds.
    
    Fields:
        topic: The debate topic
        current_round: Current round number (1-3)
        arguments: List of all arguments generated so far (accumulated)
        consensus: Final consensus after all rounds
        status: Current status of the debate (pending, in_progress, completed, failed)
        error: Error message if debate failed
        debate_id: Database ID for the debate
    """
    topic: str
    current_round: int
    arguments: Annotated[List[ArgumentDict], add]  # Accumulate arguments
    consensus: Optional[ConsensusDict]
    status: str
    error: Optional[str]
    debate_id: Optional[str]


def create_initial_state(topic: str, debate_id: Optional[str] = None) -> DebateState:
    """
    Create initial state for a new debate.
    
    Args:
        topic: The debate topic
        debate_id: Optional database ID for the debate
        
    Returns:
        Initial DebateState
    """
    return DebateState(
        topic=topic,
        current_round=1,
        arguments=[],
        consensus=None,
        status="pending",
        error=None,
        debate_id=debate_id,
    )


def get_arguments_for_round(state: DebateState, round_number: int) -> List[ArgumentDict]:
    """
    Get all arguments for a specific round.
    
    Args:
        state: Current debate state
        round_number: Round number to filter by
        
    Returns:
        List of arguments for the specified round
    """
    return [arg for arg in state["arguments"] if arg["round_number"] == round_number]


def get_previous_arguments(state: DebateState) -> List[ArgumentDict]:
    """
    Get all arguments from previous rounds (before current round).
    
    Args:
        state: Current debate state
        
    Returns:
        List of arguments from previous rounds
    """
    current_round = state["current_round"]
    return [arg for arg in state["arguments"] if arg["round_number"] < current_round]


def is_debate_complete(state: DebateState) -> bool:
    """
    Check if the debate is complete (all 3 rounds done and consensus generated).
    
    Args:
        state: Current debate state
        
    Returns:
        True if debate is complete, False otherwise
    """
    return state["current_round"] > 7 and state["consensus"] is not None


def has_error(state: DebateState) -> bool:
    """
    Check if the debate has encountered an error.
    
    Args:
        state: Current debate state
        
    Returns:
        True if there's an error, False otherwise
    """
    return state["error"] is not None or state["status"] == "failed"


# Made with Bob