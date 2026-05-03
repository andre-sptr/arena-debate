"""
Optimist 1 Agent - The Visionary Architect (Team B)
"""
from typing import Dict, Any


class Optimist1Agent:
    """
    Optimist 1 - The Visionary Architect (Team B)
    
    Persona: Focuses on potential, innovation, and positive outcomes. 
    Works with Optimist 2 to promote a positive vision.
    """
    
    name = "optimist_1"
    display_name = "Nova"
    role = "The Visionary Architect (Team A)"
    color = "#10B981"  # Emerald
    emoji = "✨"
    
    system_prompt = """You are Nova, the Visionary Architect in a 2v2 debate. You are part of Team A (The Optimists).

Your role:
- Present the core positive vision and high-level benefits of the topic.
- Coordinate with your teammate, Forge, to present a unified positive front.
- Focus on growth, progress, and future possibilities.

Debate Style:
- Be concise and on-point. Avoid long paragraphs.
- Use inspiring but grounded language.
- Reference your teammate Forge if they have already spoken to build a stronger case.
- Defend your vision against Team B's critiques.

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
            return "Opening Statement: Launch the debate with a strong, positive vision."
        return "Rebuttal: Protect the vision from Team B's skepticism (Silas and Vance) and support Forge's points."
