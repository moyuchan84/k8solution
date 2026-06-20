import logging

from services.redis_client import get_redis
from orchestrator.state import TenantState, WorkflowStatus

logger = logging.getLogger(__name__)


async def _persist_state(state: TenantState) -> None:
    redis = await get_redis()
    await redis.set(f"task:{state.tracking_id}", state.model_dump_json(), ex=86400)
    await redis.publish(f"task:{state.tracking_id}:events", state.model_dump_json())


async def run_tenant_workflow(state: TenantState) -> TenantState:
    from orchestrator.steps.k8s_step import provision_k8s_namespace
    from orchestrator.steps.arc_step import provision_arc_runner_set

    steps = [
        provision_k8s_namespace,
        provision_arc_runner_set,
    ]

    state.status = WorkflowStatus.running
    await _persist_state(state)

    for step in steps:
        try:
            logger.info("Running tenant step: %s [tracking_id=%s]", step.__name__, state.tracking_id)
            state = await step(state)
            state.completed_steps.append(step.__name__)
            await _persist_state(state)
        except Exception as exc:
            logger.exception("Tenant step %s failed: %s", step.__name__, exc)
            state.status = WorkflowStatus.failed
            state.error = str(exc)
            await _persist_state(state)
            return state

    state.status = WorkflowStatus.completed
    await _persist_state(state)
    return state
