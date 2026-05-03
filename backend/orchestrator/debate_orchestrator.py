"""
Debate Orchestrator using LangGraph

This module implements the multi-agent debate workflow using LangGraph's
StateGraph for managing the debate flow through 3 rounds and consensus generation.
"""
from typing import AsyncIterator, Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import asyncio
from langgraph.graph import StateGraph, END
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from .state import (
    DebateState,
    ArgumentDict,
    ConsensusDict,
    create_initial_state,
    get_previous_arguments,
    is_debate_complete,
    has_error,
)
from services.ai_service import get_ai_service
from agents import get_all_agents, get_agent
from models.debate import Debate, Argument, DebateStatus
from database import AsyncSessionLocal
from config import get_settings


class DebateOrchestrator:
    """
    Orchestrates multi-agent debates using LangGraph state machine.
    
    The orchestrator manages a 3-round debate between 4 agents:
    1. Round 1: Opening arguments from all agents
    2. Round 2: Responses to previous arguments
    3. Round 3: Closing statements
    4. Consensus: Final synthesis of all arguments
    """
    
    def __init__(self):
        """Initialize the debate orchestrator with LangGraph workflow"""
        self.ai_service = get_ai_service()
        self.agents = get_all_agents()
        self.agent_order = ["optimist_1", "optimist_2", "devil_1", "devil_2"]
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        self.generation_timeout = get_settings().ai_request_timeout
        
        # Build the LangGraph workflow
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """
        Build the LangGraph state machine workflow.
        
        Returns:
            Compiled StateGraph workflow
        """
        # Create the graph
        workflow = StateGraph(DebateState)
        
        # Add nodes for each phase
        workflow.add_node("generate_round_arguments", self._generate_round_arguments)
        workflow.add_node("advance_round", self._advance_round)
        workflow.add_node("generate_consensus", self._generate_consensus)
        workflow.add_node("handle_error", self._handle_error)
        
        # Set entry point
        workflow.set_entry_point("generate_round_arguments")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "generate_round_arguments",
            self._should_continue_rounds,
            {
                "continue": "advance_round",
                "consensus": "generate_consensus",
                "error": "handle_error",
            }
        )
        
        workflow.add_edge("advance_round", "generate_round_arguments")
        workflow.add_edge("generate_consensus", END)
        workflow.add_edge("handle_error", END)
        
        # Compile the workflow
        return workflow.compile()
    
    async def _generate_round_arguments(self, state: DebateState) -> Dict[str, Any]:
        """
        Generate arguments from all agents for the current round.
        
        Args:
            state: Current debate state
            
        Returns:
            Updated state with new arguments
        """
        topic = state["topic"]
        current_round = state["current_round"]
        previous_args = get_previous_arguments(state)
        new_arguments: List[ArgumentDict] = []
        
        print(f"[Orchestrator] Generating arguments for Round {current_round}")
        
        # Generate arguments from each agent in order
        for agent_name in self.agent_order:
            try:
                agent_class = get_agent(agent_name)
                agent_metadata = agent_class.get_metadata()
                system_prompt = agent_class.get_system_prompt()
                context = agent_class.format_context(current_round, previous_args)
                
                # Generate argument with retry logic
                content = await self._generate_with_retry(
                    agent_name=agent_name,
                    agent_display_name=agent_metadata["display_name"],
                    agent_role=agent_metadata["role"],
                    system_prompt=system_prompt,
                    topic=topic,
                    context=context,
                    previous_arguments=previous_args,
                )
                
                # Create argument dict
                argument = ArgumentDict(
                    agent_name=agent_name,
                    agent_display_name=agent_metadata["display_name"],
                    agent_role=agent_metadata["role"],
                    content=content,
                    round_number=current_round,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
                
                new_arguments.append(argument)
                previous_args.append(argument) # Update context for next agent in same round
                
            except Exception as e:
                print(f"[Orchestrator] Error generating argument from {agent_name}: {e}")
                return {
                    "error": f"Failed to generate argument from {agent_name}: {str(e)}",
                    "status": "failed",
                }
        
        # Update state with new arguments
        return {
            "arguments": new_arguments,
            "status": "in_progress",
        }
    
    async def _generate_with_retry(
        self,
        agent_name: str,
        agent_display_name: str,
        agent_role: str,
        system_prompt: str,
        topic: str,
        context: str,
        previous_arguments: List[ArgumentDict],
    ) -> str:
        """
        Generate argument with retry logic.
        
        Args:
            agent_name: Name of the agent
            agent_role: Role of the agent
            system_prompt: System prompt for the agent
            topic: Debate topic
            context: Additional context
            previous_arguments: Previous arguments
            
        Returns:
            Generated argument content
            
        Raises:
            Exception: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                content = await asyncio.wait_for(
                    self.ai_service.generate_argument(
                        agent_name=agent_name,
                        agent_display_name=agent_display_name,
                        agent_role=agent_role,
                        system_prompt=system_prompt,
                        topic=topic,
                        context=context,
                        previous_arguments=previous_arguments,
                    ),
                    timeout=self.generation_timeout,
                )
                return content
            except asyncio.TimeoutError:
                timeout = f"{self.generation_timeout:g}"
                message = f"{agent_name} generation timed out after {timeout} seconds"
                print(f"[Orchestrator] {message}")
                last_error = Exception(message)
            except Exception as e:
                print(f"[Orchestrator] Error generating argument for {agent_name} (attempt {attempt + 1}): {e}")
                last_error = e
            
            if attempt < self.max_retries - 1:
                await asyncio.sleep(self.retry_delay)
        
        raise Exception(f"Failed after {self.max_retries} retries: {last_error}")

    # Removed _call_generate_argument as it was causing loop issues
    
    async def _advance_round(self, state: DebateState) -> Dict[str, Any]:
        """
        Advance to the next round.
        
        Args:
            state: Current debate state
            
        Returns:
            Updated state with incremented round number
        """
        current_round = state["current_round"]
        next_round = current_round + 1
        
        print(f"[Orchestrator] Advancing from Round {current_round} to Round {next_round}")
        
        return {
            "current_round": next_round,
        }
    
    async def _generate_consensus(self, state: DebateState) -> Dict[str, Any]:
        """
        Generate final consensus from all arguments.
        
        Args:
            state: Current debate state
            
        Returns:
            Updated state with consensus
        """
        topic = state["topic"]
        all_arguments = state["arguments"]
        
        print(f"[Orchestrator] Generating consensus from {len(all_arguments)} arguments")
        
        try:
            # Generate consensus with retry logic
            # Cast TypedDict to Dict[str, Any] for compatibility
            all_args_dict = [dict(arg) for arg in all_arguments]
            consensus_data = await self._generate_consensus_with_retry(topic, all_args_dict)
            
            consensus = ConsensusDict(
                content=consensus_data["content"],
                key_points=consensus_data["key_points"],
                usage_metadata=consensus_data.get("usage_metadata"),
            )
            
            print("[Orchestrator] Consensus generated successfully")
            
            return {
                "consensus": consensus,
                "status": "completed",
            }
            
        except Exception as e:
            print(f"[Orchestrator] Error generating consensus: {e}")
            return {
                "error": f"Failed to generate consensus: {str(e)}",
                "status": "failed",
            }
    
    async def _generate_consensus_with_retry(
        self,
        topic: str,
        all_arguments: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate consensus with retry logic.
        
        Args:
            topic: Debate topic
            all_arguments: All arguments from the debate
            
        Returns:
            Consensus data
            
        Raises:
            Exception: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Cast TypedDict to Dict[str, Any] for compatibility
                all_args_dict = [dict(arg) for arg in all_arguments]
                consensus_data = await asyncio.wait_for(
                    self.ai_service.generate_consensus(
                        topic=topic,
                        all_arguments=all_args_dict,
                    ),
                    timeout=self.generation_timeout,
                )
                return consensus_data
            except asyncio.TimeoutError:
                timeout = f"{self.generation_timeout:g}"
                message = f"consensus generation timed out after {timeout} seconds"
                print(f"[Orchestrator] {message}")
                raise Exception(message)
            except Exception as e:
                last_error = e
                print(f"[Orchestrator] Consensus retry {attempt + 1}/{self.max_retries}: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
        
        raise Exception(f"Failed after {self.max_retries} retries: {last_error}")

    # Removed _call_generate_consensus as it was causing loop issues
    
    async def _handle_error(self, state: DebateState) -> Dict[str, Any]:
        """
        Handle errors in the debate workflow.
        
        Args:
            state: Current debate state
            
        Returns:
            Updated state with error status
        """
        error = state.get("error", "Unknown error occurred")
        print(f"[Orchestrator] Handling error: {error}")
        
        return {
            "status": "failed",
        }
    
    def _should_continue_rounds(self, state: DebateState) -> str:
        """
        Determine the next step in the workflow.
        
        Args:
            state: Current debate state
            
        Returns:
            Next node to execute: "continue", "consensus", or "error"
        """
        # Check for errors
        if has_error(state):
            return "error"
        
        # Check if we've completed all rounds
        current_round = state["current_round"]
        if current_round > 7:
            return "consensus"
        
        # Continue to next round
        return "continue"
    
    async def run_debate(
        self,
        topic: str,
        debate_id: Optional[str] = None,
        db_session: Optional[AsyncSession] = None,
    ) -> DebateState:
        """
        Run a complete debate workflow.
        
        Args:
            topic: The debate topic
            debate_id: Optional database ID for the debate
            db_session: Optional database session for storing results
            
        Returns:
            Final debate state with all arguments and consensus
        """
        # Create initial state
        if debate_id is None:
            debate_id = str(uuid.uuid4())
        
        initial_state = create_initial_state(topic=topic, debate_id=debate_id)
        
        print(f"[Orchestrator] Starting debate: {debate_id}")
        print(f"[Orchestrator] Topic: {topic}")
        
        # Run the workflow
        final_state = await self.workflow.ainvoke(initial_state)
        
        # Store results in database if session provided
        if db_session is not None:
            await self._store_debate_results(final_state, db_session)
        
        print(f"[Orchestrator] Debate completed with status: {final_state['status']}")
        
        return final_state

    async def run_debate_stream(
        self,
        topic: str,
        debate_id: Optional[str] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Run a debate and yield progress events as each step completes.

        Args:
            topic: The debate topic
            debate_id: Optional database ID for the debate
            db_session: Optional database session for storing results

        Yields:
            JSON-serializable event dictionaries for SSE responses
        """
        if debate_id is None:
            debate_id = str(uuid.uuid4())

        state = create_initial_state(topic=topic, debate_id=debate_id)
        state["status"] = "in_progress"

        # Save initial state to DB immediately so it shows up in history
        # Create a fresh session for DB storage to avoid connection closure issues
        async with AsyncSessionLocal() as session:
            try:
                await self._store_debate_results(state, session)
            except Exception as e:
                print(f"[Orchestrator] Error storing initial debate state: {e}")

        try:
            for round_number in range(1, 8):
                state["current_round"] = round_number
                state["status"] = "in_progress"
                previous_args = get_previous_arguments(state)

                yield {
                    "type": "round_start",
                    "round": round_number,
                }

                # Team turn logic
                for agent_name in self.agent_order:
                    yield {
                        "type": "agent_start",
                        "agent_name": agent_name,
                        "round": round_number,
                    }

                    agent_class = get_agent(agent_name)
                    agent_metadata = agent_class.get_metadata()
                    system_prompt = agent_class.get_system_prompt()
                    context = agent_class.format_context(round_number, previous_args)

                    content = await self._generate_with_retry(
                        agent_name=agent_name,
                        agent_display_name=agent_metadata["display_name"],
                        agent_role=agent_metadata["role"],
                        system_prompt=system_prompt,
                        topic=topic,
                        context=context,
                        previous_arguments=previous_args,
                    )

                    argument = ArgumentDict(
                        agent_name=agent_name,
                        agent_display_name=agent_metadata["display_name"],
                        agent_role=agent_metadata["role"],
                        content=content,
                        round_number=round_number,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                    )
                    state["arguments"].append(argument)
                    previous_args.append(argument) # Update local context immediately for the next agent in same round

                    yield {
                        "type": "argument",
                        "data": dict(argument),
                    }

                yield {
                    "type": "round_end",
                    "round": round_number,
                }

                # Judge Consensus Check after each round
                yield {
                    "type": "agent_start",
                    "agent_name": "judge",
                    "round": round_number,
                }
                
                print(f"[Orchestrator] Round {round_number} complete. Checking consensus...")
                is_consensus = await self.ai_service.check_consensus(topic, state["arguments"], round_number)
                
                if is_consensus:
                    print(f"[Orchestrator] Consensus reached in Round {round_number}!")
                    break
                elif round_number == 7:
                    print(f"[Orchestrator] Max rounds (7) reached. Finalizing.")
                    break

            # Final Consensus Generation
            all_args_dict = [dict(arg) for arg in state["arguments"]]
            consensus_data = await self._generate_consensus_with_retry(topic, all_args_dict)
            consensus = ConsensusDict(
                content=consensus_data["content"],
                key_points=consensus_data["key_points"],
                usage_metadata=consensus_data.get("usage_metadata"),
            )

            state["current_round"] = round_number
            state["consensus"] = consensus
            state["status"] = "completed"

            # Use a fresh session for final storage
            async with AsyncSessionLocal() as session:
                await self._store_debate_results(state, session)

            yield {
                "type": "consensus",
                "data": {
                    "content": consensus["content"],
                    "key_points": consensus["key_points"],
                },
            }
            yield {
                "type": "complete",
                "debate_id": debate_id,
            }

        except Exception as e:
            error_message = str(e)
            state["status"] = "failed"
            state["error"] = error_message
            print(f"[Orchestrator] Streamed debate failed: {error_message}")
            yield {
                "type": "error",
                "message": error_message,
            }
    
    async def _store_debate_results(
        self,
        state: DebateState,
        db_session: AsyncSession,
    ) -> None:
        """
        Store debate results in the database.
        
        Args:
            state: Final debate state
            db_session: Database session
        """
        debate_id = state["debate_id"]
        
        arguments_payload = [dict(arg) for arg in state["arguments"]]
        consensus_payload = dict(state["consensus"]) if state["consensus"] else None
        completed_at = datetime.now(timezone.utc) if state["status"] == "completed" else None

        for attempt in range(3):
            try:
                # Create or update debate record
                result = await db_session.execute(
                    select(Debate).where(Debate.id == debate_id)
                )
                debate = result.scalar_one_or_none()

                if debate is None:
                    debate = Debate(id=debate_id)
                    db_session.add(debate)

                debate.topic = state["topic"]
                debate.status = DebateStatus(state["status"])
                debate.arguments = arguments_payload
                debate.consensus = consensus_payload
                debate.total_rounds = state["current_round"] - 1
                debate.total_arguments = len(arguments_payload)
                debate.completed_at = completed_at

                await db_session.execute(
                    delete(Argument).where(Argument.debate_id == debate_id)
                )

                # Store individual arguments
                for arg in state["arguments"]:
                    argument = Argument(
                        id=str(uuid.uuid4()),
                        debate_id=debate_id,
                        agent_name=arg["agent_name"],
                        agent_role=arg["agent_role"],
                        content=arg["content"],
                        round_number=arg["round_number"],
                    )
                    db_session.add(argument)
                
                await db_session.commit()
                return  # Success!
                
            except Exception as e:
                await db_session.rollback()
                if "locked" in str(e).lower() and attempt < 2:
                    print(f"[Orchestrator] Database locked, retrying {attempt + 1}/3...")
                    await asyncio.sleep(0.5)
                else:
                    print(f"[Orchestrator] Error storing debate results: {e}")
                    raise
    
    async def run_debate_with_db(self, topic: str) -> DebateState:
        """
        Run a debate and automatically store results in database.
        
        Args:
            topic: The debate topic
            
        Returns:
            Final debate state
        """
        async with AsyncSessionLocal() as session:
            debate_id = str(uuid.uuid4())
            return await self.run_debate(
                topic=topic,
                debate_id=debate_id,
                db_session=session,
            )


# Singleton instance
_orchestrator = None


def get_orchestrator() -> DebateOrchestrator:
    """Get or create debate orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DebateOrchestrator()
    return _orchestrator


# Made with Bob
