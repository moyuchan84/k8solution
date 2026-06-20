import pytest
from orchestrator.state import ProjectState, ResourceSize
from orchestrator.steps.validate import validate_request


def _make_state(**kwargs) -> ProjectState:
    defaults = dict(tracking_id="t1", project_name="my-svc", tenant_id="team-a", resource_size=ResourceSize.small)
    defaults.update(kwargs)
    return ProjectState(**defaults)


@pytest.mark.asyncio
async def test_valid_name_passes():
    state = _make_state(project_name="my-service")
    result = await validate_request(state)
    assert result.project_name == "my-service"


@pytest.mark.asyncio
async def test_invalid_name_raises():
    state = _make_state(project_name="My_Service!")
    with pytest.raises(ValueError, match="Invalid project name"):
        await validate_request(state)


@pytest.mark.asyncio
async def test_missing_tenant_raises():
    state = _make_state(tenant_id="")
    with pytest.raises(ValueError, match="tenant_id"):
        await validate_request(state)
