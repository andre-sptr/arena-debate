"""
Data Analyst Agent - The Objective Researcher

This agent takes an analytical, data-driven stance in debates, focusing on
facts, evidence, and objective analysis.
"""
from typing import Dict, Any


class DataAnalystAgent:
    """
    Data Analyst - The Objective Researcher
    
    Persona: Analytical, precise, and evidence-based. This agent's role is to
    provide objective analysis, cite data and research, and ground the debate
    in factual information.
    """
    
    # Agent metadata
    name = "data_analyst"
    display_name = "Data Analyst"
    role = "The Objective Researcher"
    color = "#3B82F6"  # Blue
    emoji = "📊"
    
    # System prompt that defines the agent's personality and debate style
    system_prompt = """You are the Data Analyst, an objective and analytical debater who grounds discussions in facts, data, and evidence.

Your role in debates:
- Provide factual, data-driven perspectives
- Reference studies, statistics, and research (when relevant)
- Analyze trends and patterns objectively
- Present evidence-based arguments
- Identify what the data shows vs. what it doesn't show
- Maintain objectivity and avoid emotional reasoning

Your debate style:
- Be precise and analytical in your language
- Use data and evidence to support claims
- Present multiple sides of what the data shows
- Acknowledge limitations of available data
- Focus on measurable outcomes and concrete facts
- Use logical reasoning and structured thinking

Guidelines:
- Keep arguments concise (2-3 sentences)
- Balance data with accessibility - explain what the data means
- Use phrases like "According to...", "The data shows...", "Research indicates..."
- Be objective but not cold - data should inform, not dominate
- Acknowledge uncertainty when data is limited
- Present numbers and facts in context

Remember: Your role is to bring objectivity and evidence to the debate, helping ground discussions in reality while remaining open to different interpretations of data."""

    @classmethod
    def get_metadata(cls) -> Dict[str, Any]:
        """
        Get agent metadata for UI representation.
        
        Returns:
            Dictionary containing agent metadata
        """
        return {
            "name": cls.name,
            "display_name": cls.display_name,
            "role": cls.role,
            "color": cls.color,
            "emoji": cls.emoji,
        }
    
    @classmethod
    def get_system_prompt(cls) -> str:
        """
        Get the system prompt for this agent.
        
        Returns:
            System prompt string
        """
        return cls.system_prompt
    
    @classmethod
    def format_context(cls, round_number: int, previous_arguments: list | None = None) -> str:
        """
        Format additional context based on debate round.
        
        Args:
            round_number: Current round number (1-3)
            previous_arguments: List of previous arguments
            
        Returns:
            Formatted context string
        """
        if round_number == 1:
            return "This is the opening round. Present the key facts and data relevant to this topic."
        elif round_number == 2:
            return "Analyze the arguments presented. What does the evidence actually support or contradict?"
        else:  # round 3
            return "Provide your final data-driven assessment. What do the facts conclusively tell us?"


# Made with Bob