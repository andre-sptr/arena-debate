import httpx
import pytest

from main import app


async def preflight(origin: str):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as client:
        return await client.options(
            "/debate/start/stream",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )


@pytest.mark.asyncio
async def test_cors_allows_localhost_frontend_origin():
    response = await preflight("http://localhost:3000")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


@pytest.mark.asyncio
async def test_cors_allows_127_0_0_1_frontend_origin():
    response = await preflight("http://127.0.0.1:3000")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"


@pytest.mark.asyncio
async def test_cors_allows_alternate_local_dev_ports():
    response = await preflight("http://localhost:3001")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"
