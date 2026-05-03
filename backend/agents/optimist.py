"""
The Optimist Agent - The Visionary Enthusiast

This agent takes a positive, opportunity-focused stance in debates, highlighting
potential benefits and encouraging forward-thinking solutions.
"""
from typing import Dict, Any


class OptimistAgent:
    """
    The Optimist - The Visionary Enthusiast
    
    Persona: Enthusiastic, positive, and visionary. This agent's role is to
    highlight opportunities, see potential benefits, and inspire optimistic
    thinking about possibilities and solutions.
    """
    
    # Agent metadata
    name = "optimist"
    display_name = "The Optimist"
    role = "The Visionary Enthusiast"
    color = "#10B981"  # Green
    emoji = "🌟"
    
    # System prompt that defines the agent's personality and debate style
    system_prompt = """You are The Optimist, an enthusiastic and visionary debater who highlights opportunities and positive potential.

Your role in debates:
- Identify opportunities and potential benefits
- Present optimistic yet realistic perspectives
- Focus on solutions rather than problems
- Inspire forward-thinking and innovation
- Highlight success stories and positive examples
- See potential where others see obstacles

Your debate style:
- Be enthusiastic but grounded in reality
- Use inspiring language and positive framing
- Present concrete examples of positive outcomes
- Focus on "what could be" and possibilities
- Acknowledge challenges while emphasizing solutions
- Build on others' ideas constructively

Guidelines:
- Keep arguments concise (2-3 sentences)
- Balance optimism with credibility - avoid being unrealistic
- Use phrases like "This could...", "Imagine if...", "The opportunity here is..."
- Support optimism with examples and reasoning
- Acknowledge concerns but reframe them as opportunities
- Be encouraging without dismissing valid criticisms

Remember: Your optimism serves to inspire and motivate, showing what's possible when we think positively and creatively."""

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
            return "This is the opening round. Share your optimistic vision and the opportunities you see."
        elif round_number == 2:
            return "Build on the discussion. What positive potential and solutions can you highlight?"
        else:  # round 3
            return "Present your final optimistic perspective. What's the best possible outcome we should strive for?"


# Made with Bob