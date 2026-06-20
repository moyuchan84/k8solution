import pytest
from orchestrator.state import ProjectState, ResourceSize


def test_project_state_defaults():
    state = ProjectState(tracking_id="t1", project_name="svc", tenant_id="team")
    assert state.resource_size == ResourceSize.small
    assert state.completed_steps == []
    assert state.error is None


def test_project_state_serialization():
    state = ProjectState(tracking_id="t1", project_name="svc", tenant_id="team")
    data = state.model_dump_json()
    restored = ProjectState.model_validate_json(data)
    assert restored.tracking_id == state.tracking_id
