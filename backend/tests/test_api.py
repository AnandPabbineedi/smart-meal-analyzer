"""Unit and integration tests for Smart Meal Analyzer FastAPI backend."""

from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.schemas.meal import MealAnalysisResponse


def test_health_check(client: TestClient):
    """Verifies that GET / returns 200 with status ok and models list."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "preferredModel" in data
    assert isinstance(data["availableFallbackModels"], list)


def test_analyze_empty_request_rejected(client: TestClient):
    """Verifies that submitting with no photo or text returns 400 Bad Request."""
    response = client.post("/analyze", data={})
    assert response.status_code == 400
    assert "Add a photo or describe your meal." in response.json()["error"]


def test_analyze_excessive_text_rejected(client: TestClient):
    """Verifies that descriptions over 500 characters are rejected."""
    long_desc = "a" * 501
    response = client.post("/analyze", data={"text": long_desc})
    assert response.status_code == 400
    assert "500 characters" in response.json()["error"]


def test_analyze_valid_meal_mocked(client: TestClient):
    """Verifies successful meal analysis with mocked Gemini output."""
    mock_response = MealAnalysisResponse(
        food_name="Grilled Salmon Salad",
        calories="450 kcal",
        protein="38g",
        carbs="12g",
        fat="22g",
        score="92/100",
        suggestions=["Add olive oil dressing"],
        goalTips={"weightLoss": "Great low-carb option"},
        scoreReason="High protein, nutrient dense",
        model_used="gemini-3.5-flash-lite",
    )

    with patch("app.main.analyze_meal", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = (mock_response, "gemini-3.5-flash-lite")

        response = client.post("/analyze", data={"text": "Grilled salmon salad"})
        assert response.status_code == 200
        data = response.json()
        assert data["food_name"] == "Grilled Salmon Salad"
        assert data["calories"] == "450 kcal"
        assert data["score"] == "92/100"
        assert data["_modelUsed"] == "gemini-3.5-flash-lite"
        assert response.headers.get("X-AI-Model-Used") == "gemini-3.5-flash-lite"


def test_analyze_non_food_rejected(client: TestClient):
    """Verifies that non-food photos/texts result in 422 Unprocessable Entity."""
    with patch("app.main.analyze_meal", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.side_effect = HTTPException(
            status_code=422,
            detail="That doesn't look like food. Try a photo of a meal or describe what you ate.",
        )

        response = client.post("/analyze", data={"text": "A picture of a laptop"})
        assert response.status_code == 422
        assert "That doesn't look like food" in response.json()["error"]
