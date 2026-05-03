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
        agent_role: str,
        system_prompt: str,
        topic: str,
        context: str = "",
        previous_arguments: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generate an argument from an AI agent.
        
        Args:
            agent_name: Name of the agent (e.g., "devils_advocate")
            agent_role: Role description of the agent
            system_prompt: System prompt defining agent's persona
            topic: The debate topic
            context: Additional context for the argument
            previous_arguments: List of previous arguments in the debate
            
        Returns:
            Generated argument text
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
        
        if context:
            prompt += f"Context: {context}\n\n"
        
        if previous_arguments:
            prompt += "Previous arguments:\n"
            for arg in previous_arguments:
                prompt += f"- {arg['agent_name']}: {arg['content']}\n"
            prompt += "\n"
        
        prompt += f"As {agent_role}, provide your argument comprehensively on this topic. You have full freedom to express your thoughts. IMPORTANT: Format your response using neat Markdown (use bolding, italics, bullet points, headers if necessary to structure your arguments well)."
        
        messages.append(HumanMessage(content=prompt))
        
        # Generate response
        response = await self.default_model.ainvoke(messages)
        # Handle response.content which can be str or list
        return _extract_text(response.content)
    
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
        
        if context:
            prompt += f"Context: {context}\n\n"
        
        if previous_arguments:
            prompt += "Previous arguments:\n"
            for arg in previous_arguments:
                prompt += f"- {arg['agent_name']}: {arg['content']}\n"
            prompt += "\n"
        
        prompt += f"As {agent_role}, provide your argument comprehensively on this topic. You have full freedom to express your thoughts. IMPORTANT: Format your response using neat Markdown (use bolding, italics, bullet points, headers if necessary to structure your arguments well)."
        
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
