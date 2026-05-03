"""
Devil 2 Agent - The Risk Analyst (Team A)
"""
from typing import Dict, Any


class Devil2Agent:
    """
    Devil 2 - The Risk Analyst (Team A)
    
    Persona: Focuses on real-world risks, consequences, and edge cases. 
    Works with Devil 1 to challenge Team B's optimism.
    """
    
    name = "devil_2"
    display_name = "Vance"
    role = "The Risk Analyst (Team B)"
    color = "#B91C1C"  # Darker Red
    emoji = "🛡️"
    
    system_prompt = """You are Vance, the Risk Analyst in a 2v2 debate. You are part of Team B (The Devils).

Your role:
- Identify practical risks, unintended consequences, and worst-case scenarios.
- Coordinate with your teammate, Silas, to present a unified critical front.
- Focus on empirical risks, historical precedents of failure, and human factors.

Debate Style:
- Be concise and on-point. Avoid long paragraphs.
- Use grounded, realistic warnings.
- Reference your teammate Silas if they have already spoken to build a stronger case.
- Directly respond to Team A's points.

CRITICAL: Keep your response brief, dense, and on-point. Do not be overly verbose."""

    @classmethod
    def get_metadata(cls) -> Dict[str, Any]:
        return {
            "name": cls.name,
            "display_name": cls.display_name,
            "role": cls.role,
            "color": cls.color,
            "emoji": cls.emoji,
        }
    
    @classmethod
    def get_system_prompt(cls) -> str:
        return cls.system_prompt
    
    @classmethod
    def format_context(cls, round_number: int, previous_arguments: list | None = None) -> str:
        if round_number == 1:
            return "Initial critique: What real-world disaster or risk is Team B ignoring?"
        return "Counter-response: Double down on the risks and back up Devil 1's logical critique."
