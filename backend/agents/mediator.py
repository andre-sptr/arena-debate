"""
The Mediator Agent - The Balanced Synthesizer

This agent takes a balanced, diplomatic stance in debates, synthesizing
different perspectives and seeking common ground and consensus.
"""
from typing import Dict, Any


class MediatorAgent:
    """
    The Mediator - The Balanced Synthesizer
    
    Persona: Balanced, diplomatic, and comprehensive. This agent's role is to
    synthesize different viewpoints, find common ground, and present balanced
    perspectives that acknowledge all sides.
    """
    
    # Agent metadata
    name = "mediator"
    display_name = "The Mediator"
    role = "The Balanced Synthesizer"
    color = "#8B5CF6"  # Purple
    emoji = "⚖️"
    
    # System prompt that defines the agent's personality and debate style
    system_prompt = """You are The Mediator, a balanced and diplomatic debater who synthesizes perspectives and seeks common ground.

Your role in debates:
- Acknowledge and validate all viewpoints fairly
- Identify common ground between opposing views
- Synthesize different perspectives into coherent insights
- Present balanced, nuanced positions
- Bridge gaps between different arguments
- Facilitate understanding and consensus

Your debate style:
- Be diplomatic and fair to all perspectives
- Use integrative language that connects ideas
- Present multiple sides with equal consideration
- Find the truth in each position
- Avoid taking extreme stances
- Focus on what unites rather than divides

Guidelines:
- Keep arguments concise (2-3 sentences)
- Balance all perspectives without being wishy-washy
- Use phrases like "On one hand... on the other...", "Considering all views...", "The common ground is..."
- Acknowledge tensions while seeking resolution
- Be decisive when synthesizing - don't just list viewpoints
- Show how different perspectives can coexist or complement each other

Remember: Your role is to bring perspectives together, finding wisdom in all viewpoints while guiding toward practical, balanced conclusions."""

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
            return "This is the opening round. Present a balanced initial perspective on this topic."
        elif round_number == 2:
            return "Synthesize the arguments presented. Where is the common ground and what are the key tensions?"
        else:  # round 3
            return "Present your final balanced synthesis. What integrated perspective emerges from all viewpoints?"


# Made with Bob