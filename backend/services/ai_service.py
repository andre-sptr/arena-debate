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
        
        # Build the prompt
        prompt = f"Topic: {topic}\n\n"
        
        # Auto-language instruction
        prompt += ("CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the debate topic above. "
                   "If the topic is in Indonesian, you MUST respond entirely in Indonesian. "
                   "If the topic is in English, respond in English. Match the topic's language exactly.\n\n")
        
        # Team context
        team_a = "Nova & Forge"
        team_b = "Silas & Vance"
        
        prompt += f"Debate participants:\n- Team A (Optimists): Nova, Forge\n- Team B (Devils): Silas, Vance\n- Judge: Andre\n\n"
        
        if context:
            prompt += f"Context for this round: {context}\n\n"
        
        if previous_arguments:
            prompt += "Previous arguments in this debate:\n"
            for arg in previous_arguments:
                # Try to get display name from arg if available, else fallback
                name = arg.get('agent_display_name', arg.get('agent_name', 'Unknown'))
                prompt += f"- {name} ({arg['agent_role']}): {arg['content']}\n"
            prompt += "\n"
        
        prompt += (f"As {agent_display_name} ({agent_role}), provide your argument. "
                   "IMPORTANT: Address your teammate and opponents by their NAMES (e.g., 'As Silas pointed out...' or 'Nova mentioned...'). "
                   "Keep your response concise, dense, and on-point. "
                   "Cooperate with your teammate and directly challenge your specific opponents. "
                   "Focus on quality over quantity.")
        
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
        system_prompt = """You are Andre, the Judge. Your task is to evaluate if a 2v2 debate (Team A Optimists vs Team B Devils) has reached a TRUE consensus or if it has become genuinely redundant.

Evaluation Process:
1. Briefly analyze if both teams have addressed each other's core arguments.
2. Check if any SIGNIFICANT new points were introduced in the latest round.
3. Determine if the debate is starting to go in circles.

Decision Guidelines:
- Round 1-2: Almost NEVER end unless the topic is trivial.
- Round 3-4: End if the core conflict has been thoroughly explored and both sides are repeating themselves.
- Round 5-6: End if no new ground is being broken. We want to avoid fatigue.

Format your response as follows:
ANALYSIS: [1-2 sentences of your reasoning]
DECISION: [YES or NO]"""
        
        prompt = f"Topic: {topic}\nRound: {round_number}\n\nArguments so far:\n"
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
        different perspectives into a comprehensive consensus. Your role is to:
        1. Acknowledge all viewpoints fairly
        2. Identify common ground and key insights
        3. Present a balanced conclusion
        4. Highlight actionable takeaways"""
        
        # Build prompt with all arguments
        prompt = f"Topic: {topic}\n\n"
        
        # Auto-language instruction
        prompt += ("CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the debate topic above. "
                   "If the topic is in Indonesian, you MUST respond entirely in Indonesian. "
                   "If the topic is in English, respond in English. Match the topic's language exactly.\n\n")
        
        prompt += "Arguments from all participants:\n\n"
        
        for arg in all_arguments:
            prompt += f"{arg['agent_role']}:\n{arg['content']}\n\n"
        
        prompt += """Based on these diverse perspectives, provide:
        1. A balanced consensus (3-4 sentences)
        2. 3-5 key points that emerged from the debate
        
        Format your response as:
        CONSENSUS: [your consensus here]
        
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
        
        # Build the prompt (same as generate_argument)
        prompt = f"Topic: {topic}\n\n"
        
        # Auto-language instruction
        prompt += ("CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the debate topic above. "
                   "If the topic is in Indonesian, you MUST respond entirely in Indonesian. "
                   "If the topic is in English, respond in English. Match the topic's language exactly.\n\n")
        
        # Team context
        prompt += f"Debate participants:\n- Team A (Optimists): Nova, Forge\n- Team B (Devils): Silas, Vance\n- Judge: Andre\n\n"
        
        if context:
            prompt += f"Context for this round: {context}\n\n"
        
        if previous_arguments:
            prompt += "Previous arguments in this debate:\n"
            for arg in previous_arguments:
                name = arg.get('agent_display_name', arg.get('agent_name', 'Unknown'))
                prompt += f"- {name} ({arg['agent_role']}): {arg['content']}\n"
            prompt += "\n"
        
        prompt += (f"As {agent_display_name} ({agent_role}), provide your argument. "
                   "IMPORTANT: Address your teammate and opponents by their NAMES (e.g., 'As Silas pointed out...' or 'Nova mentioned...'). "
                   "Keep your response concise, dense, and on-point. "
                   "Cooperate with your teammate and directly challenge your specific opponents. "
                   "Focus on quality over quantity.")
        
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

# Made with Bob
