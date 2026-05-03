from fastapi.testclient import TestClient

from main import app


def preflight(origin: str):
    client = TestClient(app)
    return client.options(
        "/debate/start/stream",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_cors_allows_localhost_frontend_origin():
    response = preflight("http://localhost:3000")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_allows_127_0_0_1_frontend_origin():
    response = preflight("http://127.0.0.1:3000")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"


def test_cors_allows_alternate_local_dev_ports():
    response = preflight("http://localhost:3001")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"
