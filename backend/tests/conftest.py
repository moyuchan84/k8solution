import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock

from main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_redis(monkeypatch):
    redis_mock = AsyncMock()
    redis_mock.get.return_value = None
    redis_mock.set.return_value = True
    redis_mock.publish.return_value = 1

    async def _get_redis():
        return redis_mock

    monkeypatch.setattr("services.redis_client.get_redis", _get_redis)
    return redis_mock
