import pytest
from fastapi import Response

import main


@pytest.mark.asyncio
async def test_health_check_reports_connected_database(monkeypatch):
    async def healthy_db():
        return True, None

    monkeypatch.setattr(main, "check_db_health", healthy_db)
    response = Response()

    payload = await main.health_check(response)

    assert response.status_code == 200
    assert payload == {
        "status": "healthy",
        "services": {
            "api": "operational",
            "vertex_ai": "ready",
            "database": "connected",
        },
    }


@pytest.mark.asyncio
async def test_health_check_reports_unreachable_database(monkeypatch):
    async def unhealthy_db():
        return False, "db down"

    monkeypatch.setattr(main, "check_db_health", unhealthy_db)
    response = Response()

    payload = await main.health_check(response)

    assert response.status_code == 503
    assert payload == {
        "status": "unhealthy",
        "services": {
            "api": "operational",
            "vertex_ai": "ready",
            "database": "unreachable",
        },
        "error": "db down",
    }
