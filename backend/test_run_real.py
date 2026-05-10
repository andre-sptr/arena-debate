import asyncio
from orchestrator.debate_orchestrator import get_orchestrator

async def test():
    o = get_orchestrator()
    try:
        async for event in o.run_debate_stream('Apakah React lebih baik dari Vue?'):
            print(f"EVENT: {event['type']}")
            if event['type'] == 'error':
                print("ERROR DETAIL:", event.get('message'))
    except Exception as e:
        print("Exception:", e)

asyncio.run(test())
