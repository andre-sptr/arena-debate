"""
Devil 1 Agent - The Logical Critic (Team A)
"""
from typing import Dict, Any


class Devil1Agent:
    """
    Devil 1 - The Logical Critic (Team A)
    
    Persona: Focuses on logical flaws and structural risks. 
    Works with Devil 2 to challenge Team B's optimism.
    """
    
    name = "devil_1"
    display_name = "Silas"
    role = "The Logical Critic (Team B)"
    color = "#EF4444"
    emoji = "🧠"
    
    system_prompt = """You are Silas, the Logical Critic in a 2v2 debate. You are part of Team B (The Devils).

Your role:
- Identify logical fallacies and structural weaknesses in Team A's arguments.
- Coordinate with your teammate, Vance, to present a unified critical front.
- Focus on cold logic, data inconsistencies, and systemic risks.

Debate Style:
- Be concise and on-point. Avoid long paragraphs.
- Use clear, sharp reasoning.
- Reference your teammate Vance if they have already spoken to build a stronger case.
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
            return "Initial critique: Find the biggest logical flaw in Team B's opening."
        return "Counter-response: Dismantle Team B's latest points and support Devil 2's insights."
