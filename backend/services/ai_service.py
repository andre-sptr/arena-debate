"""
AI Service for managing Gemini API interactions
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from typing import List, Dict, Any, AsyncIterator, Optional, Union
import os
from config import get_settings


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
    """Service for interacting with Google Gemini API"""
    
    def __init__(self):
        """Initialize AI service with Gemini models"""
        settings = get_settings()
        
        # Set API key from settings
        os.environ["GOOGLE_API_KEY"] = settings.google_api_key
        
        # Initialize default model for agents
        self.default_model = ChatGoogleGenerativeAI(
            model=settings.default_model,
            temperature=settings.temperature,
            max_tokens=4096,  # Removed token limit, give agents freedom
        )
        
        # Initialize consensus model (note: thinking features not available in langchain-google-genai 2.0.5)
        self.consensus_model = ChatGoogleGenerativeAI(
            model=settings.consensus_model,
            temperature=settings.temperature,
            max_tokens=4096,  # Significantly more tokens for consensus as thinking models need a large budget
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
        """
        previous_arguments = previous_arguments or []
        is_team_a_opening = agent_name in {"optimist_1", "optimist_2"} and not previous_arguments

        prompt = f"Debate Topic (the claim to debate): {topic}\n\n"
        prompt += (
            "CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the debate topic above. "
            "If the topic is in Indonesian, you MUST respond entirely in Indonesian. "
            "If the topic is in English, respond in English. Match the topic's language exactly.\n\n"
        )
        prompt += (
            "Debate Format: PRO vs CONTRA\n"
            "- Team A (PRO): Nova and Forge defend and support the topic's claim\n"
            "- Team B (CONTRA): Silas and Vance challenge and oppose the topic's claim\n"
            "- Judge: Andre evaluates both sides\n\n"
        )
        prompt += (
            "Debate rules:\n"
            "- FOCUS ON THE TOPIC ITSELF: Is the claim true or false? Valid or invalid?\n"
            "- Team A (PRO) must present evidence, reasoning, and examples that the topic IS TRUE/VALID\n"
            "- Team B (CONTRA) must present evidence, reasoning, and examples that the topic IS FALSE/INVALID or present the opposite position\n"
            "- Write 2-4 concise sentences with clear claim, reasoning, and evidence\n"
            "- Use historical precedent, real-world cases, or known facts when relevant\n"
            "- Do not invent statistics; use cautious qualitative evidence if exact data is uncertain\n"
            "- Stay focused on debating the VALIDITY OF THE TOPIC, not side issues\n\n"
        )

        if is_team_a_opening:
            prompt += (
                "Opening constraint for Team A (PRO): Do not name Team B in your opening. "
                "Simply present your strongest case for WHY THE TOPIC IS TRUE with clear evidence and reasoning.\n\n"
            )
        else:
            prompt += (
                "Debate guidance: Directly address the core arguments about the topic's validity. "
                "Answer the strongest version of the opposing position.\n\n"
            )

        if context:
            prompt += f"Context for this round: {context}\n\n"

        if previous_arguments:
            prompt += "Previous arguments in this debate:\n"
            for arg in previous_arguments:
                name = arg.get("agent_display_name", arg.get("agent_name", "Unknown"))
                prompt += f"- {name} ({arg['agent_role']}): {arg['content']}\n"
            prompt += "\n"

        prompt += (
            f"As {agent_display_name} ({agent_role}), provide your argument about the topic's validity. "
            "Stay focused on whether the topic's claim is true or false."
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
        
        Returns:
            True if consensus reached, False otherwise.
        """
        system_prompt = """You are Andre, the Judge. Your task is to evaluate if a PRO vs CONTRA debate has reached a TRUE consensus or if it has become genuinely redundant.

Evaluation Process:
1. Briefly analyze if both teams have addressed the core question: Is the topic's claim true/valid?
2. Check if any SIGNIFICANT new evidence or reasoning was introduced in the latest round.
3. Determine if the debate is starting to go in circles.

Decision Guidelines:
- Round 1-2: Almost NEVER end unless the topic is trivial.
- Round 3-4: End if the core validity question has been thoroughly explored and both sides are repeating themselves.
- Round 5-6: End if no new ground is being broken. We want to avoid fatigue.

Format your response as follows:
ANALYSIS: [1-2 sentences of your reasoning]
DECISION: [YES or NO]"""
        
        prompt = f"Debate Topic: {topic}\nRound: {round_number}\n\nArguments so far:\n"
        for arg in all_arguments:
            prompt += f"- {arg['agent_role']}: {arg['content']}\n"
        
        prompt += f"\nWe are currently at the end of Round {round_number}. Provide your analysis and then your DECISION (YES or NO)."
        
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
        Generate consensus from all arguments using thinking model.
        
        Args:
            topic: The debate topic
            all_arguments: All arguments from all agents
            
        Returns:
            Dictionary with consensus content and key points
        """
        system_prompt = """You are The Mediator, a balanced and diplomatic AI that synthesizes 
        PRO and CONTRA perspectives into a fair consensus. Your role is to:
        1. Acknowledge both the PRO arguments (supporting the topic) and CONTRA arguments (opposing the topic)
        2. Identify what evidence and reasoning each side presented
        3. Present a balanced conclusion about the topic's validity
        4. Highlight key insights from both perspectives"""
        
        # Build prompt with all arguments
        prompt = f"Debate Topic: {topic}\n\n"
        
        # Auto-language instruction
        prompt += ("CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the debate topic above. "
                   "If the topic is in Indonesian, you MUST respond entirely in Indonesian. "
                   "If the topic is in English, respond in English. Match the topic's language exactly.\n\n")
        
        prompt += "Arguments from PRO side (supporting the topic):\n"
        for arg in all_arguments:
            if arg['agent_name'] in ['optimist_1', 'optimist_2']:
                prompt += f"{arg['agent_role']}: {arg['content']}\n"
        
        prompt += "\nArguments from CONTRA side (opposing the topic):\n"
        for arg in all_arguments:
            if arg['agent_name'] in ['devil_1', 'devil_2']:
                prompt += f"{arg['agent_role']}: {arg['content']}\n"
        
        prompt += """
Based on these PRO and CONTRA perspectives, provide:
        1. A balanced consensus that acknowledges both sides' strongest points (3-4 sentences)
        2. 3-5 key insights that emerged from the debate
        
        Format your response as:
        CONSENSUS: [your balanced synthesis here]
        
        KEY POINTS:
        - [point 1]
        - [point 2]
        - [point 3]
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        
        # Generate consensus with thinking
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
