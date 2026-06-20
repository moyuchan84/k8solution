import pytest


@pytest.mark.asyncio
async def test_list_tenants_returns_empty(client):
    resp = await client.get("/api/v1/tenants/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_tenant_not_found(client):
    resp = await client.get("/api/v1/tenants/nonexistent")
    assert resp.status_code == 404
