"""
AI Service for managing Anthropic Claude API interactions
"""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from typing import List, Dict, Any, AsyncIterator, Optional, Union
from config import get_settings


# Maximum number of previous arguments to include in context for debate agents.
# Only the most recent arguments are sent to save input tokens while preserving
# enough context for coherent rebuttals.
_MAX_CONTEXT_ARGS = 4

# Maximum number of recent arguments the judge sees when checking consensus.
# The judge only needs the latest round(s) to decide if the debate is cycling.
_MAX_JUDGE_ARGS = 8


def _extract_text(content: Union[str, List[Union[str, Dict[str, Any]]], Dict[str, Any]]) -> str:
    """Extract text from LangChain message content, which can be str, list of dicts, or dict."""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                text_parts.append(str(item["text"]))
            elif isinstance(item, str):
                text_parts.append(item)
            else:
                text_parts.append(str(item))
        return " ".join(text_parts)
    elif isinstance(content, dict) and "text" in content:
        return str(content["text"])
    return str(content)


class AIService:
    """Service for interacting with Anthropic Claude API"""
    
    def __init__(self):
        """Initialize AI service with Anthropic Claude models"""
        settings = get_settings()
        
        # Initialize default model for agents — capped to max_output_tokens from config.
        # Debate arguments should be 2-4 sentences; no need for a large budget.
        self.default_model = ChatAnthropic(
            model=settings.default_model,
            temperature=settings.temperature,
            max_tokens=settings.max_output_tokens,  # config default: 300
            anthropic_api_key=settings.anthropic_api_key,
        )
        
        # Initialize consensus model — needs more room for synthesis + key points.
        self.consensus_model = ChatAnthropic(
            model=settings.consensus_model,
            temperature=settings.temperature,
            max_tokens=settings.consensus_max_output_tokens,  # config default: 1024
            anthropic_api_key=settings.anthropic_api_key,
        )

    def _build_argument_prompt(
        self,
        agent_name: str,
        agent_display_name: str,
        agent_role: str,
        topic: str,
        context: str = "",
        previous_arguments: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        Build the shared human prompt for normal and streamed arguments.
        Only includes the most recent previous arguments to minimize input tokens.
        """
        previous_arguments = previous_arguments or []
        is_team_a_opening = agent_name in {"optimist_1", "optimist_2"} and not previous_arguments

        prompt = f"Topic: {topic}\n\n"
        prompt += "Respond in the SAME LANGUAGE as the topic.\n\n"
        prompt += (
            "Format: PRO vs CONTRA\n"
            "Team A (PRO): Nova & Forge — defend the claim\n"
            "Team B (CONTRA): Silas & Vance — oppose the claim\n"
            "Judge: Andre\n\n"
        )
        prompt += (
            "Rules: 2-4 concise sentences. Claim + reasoning + evidence. "
            "No invented statistics. Stay on topic.\n\n"
        )

        if is_team_a_opening:
            prompt += "Opening: Present your strongest PRO case without naming Team B.\n\n"
        else:
            prompt += "Directly address the opposing side's core arguments.\n\n"

        if context:
            prompt += f"Context: {context}\n\n"

        # Sliding window — only include the last _MAX_CONTEXT_ARGS arguments
        recent_args = previous_arguments[-_MAX_CONTEXT_ARGS:] if previous_arguments else []
        if recent_args:
            prompt += "Recent arguments:\n"
            for arg in recent_args:
                name = arg.get("agent_display_name", arg.get("agent_name", "Unknown"))
                prompt += f"- {name} ({arg['agent_role']}): {arg['content']}\n"
            prompt += "\n"

        prompt += (
            f"As {agent_display_name} ({agent_role}), give your argument. "
            "2-4 sentences only."
        )
        return prompt
    
    async def generate_argument(
        self,
        agent_name: str,
        agent_display_name: str,
        agent_role: str,
        system_prompt: str,
        topic: str,
        context: str = "",
        previous_arguments: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generate an argument from an AI agent.
        """
        messages: List[BaseMessage] = [
            SystemMessage(content=system_prompt),
        ]
        
        prompt = self._build_argument_prompt(
            agent_name=agent_name,
            agent_display_name=agent_display_name,
            agent_role=agent_role,
            topic=topic,
            context=context,
            previous_arguments=previous_arguments,
        )
        
        messages.append(HumanMessage(content=prompt))
        
        # Generate response
        response = await self.default_model.ainvoke(messages)
        return _extract_text(response.content)

    async def check_consensus(
        self,
        topic: str,
        all_arguments: List[Dict[str, Any]],
        round_number: int
    ) -> bool:
        """
        Ask the Judge to decide if consensus has been reached.
        Only sends the most recent arguments to minimize token usage.
        
        Returns:
            True if consensus reached, False otherwise.
        """
        system_prompt = (
            "You are Andre, the Judge. Decide if the PRO vs CONTRA debate should end.\n"
            "Rules: Round 1-2 almost never end. Round 3-4 end if both sides repeat. "
            "Round 5+ end if no new ground.\n"
            "Reply ONLY: ANALYSIS: [1 sentence] DECISION: [YES or NO]"
        )
        
        # Sliding window — judge only needs recent arguments
        recent_args = all_arguments[-_MAX_JUDGE_ARGS:]
        
        prompt = f"Topic: {topic}\nRound: {round_number}\n\nRecent arguments:\n"
        for arg in recent_args:
            prompt += f"- {arg['agent_role']}: {arg['content']}\n"
        
        prompt += f"\nEnd of Round {round_number}. DECISION?"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        
        response = await self.consensus_model.ainvoke(messages)
        content = _extract_text(response.content).strip().upper()
        
        # Look for DECISION: YES or DECISION: NO
        if "DECISION: YES" in content:
            return True
        elif "DECISION: NO" in content:
            return False
            
        # Fallback to simple YES/NO if format is not strictly followed
        return "YES" in content and "NO" not in content.split("YES")[-1]
    
    async def generate_consensus(
        self,
        topic: str,
        all_arguments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate consensus from all arguments.
        
        Args:
            topic: The debate topic
            all_arguments: All arguments from all agents
            
        Returns:
            Dictionary with consensus content and key points
        """
        system_prompt = (
            "You are The Mediator. Synthesize PRO and CONTRA into a balanced consensus.\n"
            "1. Acknowledge both sides\n"
            "2. Present a balanced conclusion\n"
            "3. List key insights"
        )
        
        # Build prompt with all arguments (consensus needs full picture)
        prompt = f"Topic: {topic}\n\n"
        prompt += "Respond in the SAME LANGUAGE as the topic.\n\n"
        
        prompt += "PRO arguments:\n"
        for arg in all_arguments:
            if arg['agent_name'] in ['optimist_1', 'optimist_2']:
                prompt += f"- {arg['content']}\n"
        
        prompt += "\nCONTRA arguments:\n"
        for arg in all_arguments:
            if arg['agent_name'] in ['devil_1', 'devil_2']:
                prompt += f"- {arg['content']}\n"
        
        prompt += (
            "\nProvide:\n"
            "CONSENSUS: [3-4 sentences balanced synthesis]\n\n"
            "KEY POINTS:\n"
            "- [point 1]\n"
            "- [point 2]\n"
            "- [point 3]"
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        
        # Generate consensus
        response = await self.consensus_model.ainvoke(messages)
        
        # Parse response - handle content which can be str or list
        content = _extract_text(response.content)
        
        consensus_text = ""
        key_points = []
        
        if "CONSENSUS:" in content:
            parts = content.split("KEY POINTS:")
            consensus_text = parts[0].replace("CONSENSUS:", "").strip()
            
            if len(parts) > 1:
                points_text = parts[1].strip()
                key_points = [
                    line.strip().lstrip("-").strip()
                    for line in points_text.split("\n")
                    if line.strip() and line.strip().startswith("-")
                ]
        else:
            # Fallback if format not followed
            consensus_text = content
        
        # Safely access usage_metadata using getattr
        usage_metadata = getattr(response, 'usage_metadata', None)
        
        return {
            "content": consensus_text,
            "key_points": key_points,
            "usage_metadata": usage_metadata
        }
    
    async def stream_argument(
        self,
        agent_name: str,
        agent_display_name: str,
        agent_role: str,
        system_prompt: str,
        topic: str,
        context: str = "",
        previous_arguments: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncIterator[str]:
        """
        Stream an argument generation token by token.
        
        Args:
            Same as generate_argument
            
        Yields:
            Tokens of the generated argument
        """
        messages: List[BaseMessage] = [
            SystemMessage(content=system_prompt),
        ]
        
        prompt = self._build_argument_prompt(
            agent_name=agent_name,
            agent_display_name=agent_display_name,
            agent_role=agent_role,
            topic=topic,
            context=context,
            previous_arguments=previous_arguments,
        )
        
        messages.append(HumanMessage(content=prompt))
        
        # Stream response
        async for chunk in self.default_model.astream(messages):
            if chunk.content:
                extracted = _extract_text(chunk.content)
                if extracted:
                    yield extracted


# Singleton instance
_ai_service = None


def get_ai_service() -> AIService:
    """Get or create AI service singleton"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
