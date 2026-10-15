"""Pytest fixtures for API testing using FastAPI TestClient."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """Yields a TestClient configured with app and lifespan execution."""
    with TestClient(app) as test_client:
        yield test_client
