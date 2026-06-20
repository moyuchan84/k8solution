import pytest
from unittest.mock import AsyncMock, patch
from orchestrator.state import ProjectState, ResourceSize, WorkflowStatus
from orchestrator.runner import run_workflow


def _make_state() -> ProjectState:
    return ProjectState(
        tracking_id="test-123",
        project_name="test-svc",
        tenant_id="team-a",
        resource_size=ResourceSize.small,
    )


@pytest.mark.asyncio
async def test_run_workflow_completes(mock_redis):
    state = _make_state()
    mock_step = AsyncMock(return_value=state, __name__="mock_step")

    with patch("orchestrator.runner.STEPS", [mock_step]):
        result = await run_workflow(state)

    assert result.status == WorkflowStatus.completed
    mock_step.assert_called_once()


@pytest.mark.asyncio
async def test_run_workflow_fails_and_rollbacks(mock_redis):
    state = _make_state()
    failing_step = AsyncMock(side_effect=Exception("K8s error"), __name__="failing_step")

    # runner.py가 `from orchestrator.rollback import rollback`로 직접 임포트하므로
    # 해당 모듈 네임스페이스에서 패치해야 함
    with patch("orchestrator.runner.rollback", new_callable=AsyncMock) as mock_rollback:
        mock_rollback.return_value = state
        with patch("orchestrator.runner.STEPS", [failing_step]):
            result = await run_workflow(state)

    assert result.status == WorkflowStatus.failed
    assert result.error == "K8s error"
    mock_rollback.assert_called_once()
