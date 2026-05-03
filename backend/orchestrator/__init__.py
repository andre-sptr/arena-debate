"""
Orchestrator module for managing multi-agent debate workflows

This module provides the LangGraph-based orchestrator for coordinating
debates between multiple AI agents through structured rounds.
"""
from .debate_orchestrator import DebateOrchestrator, get_orchestrator
from .state import (
    DebateState,
    ArgumentDict,
    ConsensusDict,
    create_initial_state,
    get_arguments_for_round,
    get_previous_arguments,
    is_debate_complete,
    has_error,
)

__all__ = [
    # Main orchestrator
    "DebateOrchestrator",
    "get_orchestrator",
    # State types
    "DebateState",
    "ArgumentDict",
    "ConsensusDict",
    # State utilities
    "create_initial_state",
    "get_arguments_for_round",
    "get_previous_arguments",
    "is_debate_complete",
    "has_error",
]

# Made with Bob