import asyncio
from orchestrator.debate_orchestrator import get_orchestrator
import services.ai_service

class MockAIService:
    async def generate_argument(self, *args, **kwargs):
        return "mocked argument"
    
    async def check_consensus(self, topic, all_arguments, round_number):
        return round_number >= 4  # Never consensus, so it goes to round 7

    async def generate_consensus(self, topic, all_arguments):
        return {"content": "mocked consensus", "key_points": ["mocked"], "usage_metadata": None}

services.ai_service.get_ai_service = lambda: MockAIService()

async def test():
    o = get_orchestrator()
    o.ai_service = MockAIService()
    try:
        async for event in o.run_debate_stream('Apakah AI berbahaya?'):
            if event['type'] in ['round_start', 'round_end', 'error', 'complete']:
                print(event)
    except Exception as e:
        print("Exception:", e)

asyncio.run(test())

