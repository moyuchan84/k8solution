import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_create_project_returns_tracking_id(client, mock_redis):
    with patch("orchestrator.runner.run_workflow", new_callable=AsyncMock):
        resp = await client.post(
            "/api/v1/projects/",
            json={
                "name": "my-service",
                "tenant_id": "sw-platform-team",
                "service_description": "Test service",
                "resource_size": "S",
                "stack": "python",
            },
        )
    assert resp.status_code == 202
    data = resp.json()
    assert "tracking_id" in data
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_list_projects_returns_empty(client):
    resp = await client.get("/api/v1/projects/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_project_not_found(client):
    resp = await client.get("/api/v1/projects/nonexistent")
    assert resp.status_code == 404
