import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock
from api.main import app
from api.schemas import GeminiQueryOutput
from api.gemini_service import get_gemini_service

@pytest.fixture
def mock_gemini():
    service = MagicMock()
    service.generate_query.return_value = GeminiQueryOutput(
        sql="SELECT id, first_name, email FROM employees",
        explanation="Lists all employee ids, first names, and emails."
    )
    return service

@pytest.mark.asyncio
async def test_query_successful_execution(mock_gemini):
    app.dependency_overrides[get_gemini_service] = lambda: mock_gemini

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/query", json={"question": "Show all employees"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["sql"] == "SELECT id, first_name, email FROM employees LIMIT 1000"
    assert data["explanation"] == "Lists all employee ids, first names, and emails."
    assert len(data["columns"]) == 3
    assert [col["name"] for col in data["columns"]] == ["id", "first_name", "email"]
    assert len(data["rows"]) == 10
    assert data["total_count"] == 10

@pytest.mark.asyncio
async def test_query_preserves_explicit_limit(mock_gemini):
    mock_gemini.generate_query.return_value = GeminiQueryOutput(
        sql="SELECT id FROM employees LIMIT 3",
        explanation="Lists first 3 employee ids."
    )
    app.dependency_overrides[get_gemini_service] = lambda: mock_gemini

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/query", json={"question": "Show first 3 employees"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["sql"] == "SELECT id FROM employees LIMIT 3"
    assert len(data["rows"]) == 3
    assert data["total_count"] == 3

@pytest.mark.asyncio
async def test_query_validation_empty_question():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/query", json={"question": ""})

    assert response.status_code == 422

