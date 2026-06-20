import logging

from services.redis_client import get_redis
from orchestrator.state import ProjectState, WorkflowStatus
from orchestrator.rollback import rollback
from orchestrator.steps.validate import validate_request
from orchestrator.steps.github_step import create_github_repo
from orchestrator.steps.harbor_step import create_harbor_project
from orchestrator.steps.k8s_step import provision_k8s_namespace, apply_rbac, apply_network_policy
from orchestrator.steps.envoy_step import configure_envoy_routing
from orchestrator.steps.gitops_step import push_gitops_manifest, sync_argocd
from config import settings

logger = logging.getLogger(__name__)

STEPS = [
    validate_request,
    create_github_repo,
    create_harbor_project,
    provision_k8s_namespace,
    apply_rbac,
    apply_network_policy,
    configure_envoy_routing,
    push_gitops_manifest,
    sync_argocd,
]


async def _persist_state(state: ProjectState) -> None:
    redis = await get_redis()
    await redis.set(f"task:{state.tracking_id}", state.model_dump_json(), ex=86400)
    await redis.publish(f"task:{state.tracking_id}:events", state.model_dump_json())


async def run_workflow(state: ProjectState) -> ProjectState:
    state.status = WorkflowStatus.running
    await _persist_state(state)

    for step in STEPS:
        try:
            logger.info("Running step: %s [tracking_id=%s]", step.__name__, state.tracking_id)
            state = await step(state)
            state.completed_steps.append(step.__name__)
            await _persist_state(state)
        except Exception as exc:
            logger.exception("Step %s failed: %s", step.__name__, exc)
            state.status = WorkflowStatus.failed
            state.error = str(exc)

            if settings.llm_enabled:
                try:
                    from services.llm_service import diagnose_error
                    state.error_diagnosis = await diagnose_error(str(exc))
                except Exception:
                    pass

            await _persist_state(state)
            await rollback(state)
            return state

    state.status = WorkflowStatus.completed
    await _persist_state(state)
    return state
