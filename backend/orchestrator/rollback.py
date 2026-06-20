import logging
from orchestrator.state import ProjectState, WorkflowStatus

logger = logging.getLogger(__name__)

# 생성된 리소스를 역순으로 정리하기 위한 단계별 롤백 핸들러
_ROLLBACK_HANDLERS: dict[str, str] = {
    "sync_argocd": "_rollback_argocd",
    "push_gitops_manifest": "_rollback_gitops_manifest",
    "configure_envoy_routing": "_rollback_envoy_routing",
    "apply_network_policy": "_rollback_network_policy",
    "apply_rbac": "_rollback_rbac",
    "provision_k8s_namespace": "_rollback_k8s_namespace",
    "create_harbor_project": "_rollback_harbor_project",
    "create_github_repo": "_rollback_github_repo",
}


async def _rollback_argocd(state: ProjectState) -> None:
    from services.argocd_client import ArgocdClient
    if state.argocd_app_name:
        client = ArgocdClient()
        await client.delete_app(state.argocd_app_name)


async def _rollback_gitops_manifest(state: ProjectState) -> None:
    # TODO: GitOps 레포에서 매니페스트 삭제
    logger.info("Rolling back gitops manifest for %s", state.project_name)


async def _rollback_envoy_routing(state: ProjectState) -> None:
    from services.k8s_client import K8sClient
    client = K8sClient()
    await client.delete_virtual_service(state.project_name, state.k8s_namespace or state.tenant_id)


async def _rollback_network_policy(state: ProjectState) -> None:
    logger.info("Rolling back network policy for %s", state.project_name)


async def _rollback_rbac(state: ProjectState) -> None:
    logger.info("Rolling back RBAC for %s", state.project_name)


async def _rollback_k8s_namespace(state: ProjectState) -> None:
    from services.k8s_client import K8sClient
    client = K8sClient()
    if state.k8s_namespace:
        await client.delete_namespace(state.k8s_namespace)


async def _rollback_harbor_project(state: ProjectState) -> None:
    from services.harbor_client import HarborClient
    client = HarborClient()
    if state.harbor_project:
        await client.delete_project(state.harbor_project)


async def _rollback_github_repo(state: ProjectState) -> None:
    from services.github_client import GitHubClient
    client = GitHubClient()
    if state.github_repo_url:
        await client.delete_repo(state.project_name)


async def rollback(state: ProjectState) -> ProjectState:
    logger.info("Starting rollback for tracking_id=%s, completed_steps=%s",
                state.tracking_id, state.completed_steps)

    for step_name in reversed(state.completed_steps):
        handler_name = _ROLLBACK_HANDLERS.get(step_name)
        if not handler_name:
            continue
        handler = globals().get(handler_name)
        if handler is None:
            continue
        try:
            await handler(state)
            logger.info("Rollback succeeded: %s", step_name)
        except Exception as exc:
            logger.error("Rollback failed for step %s: %s", step_name, exc)

    state.status = WorkflowStatus.rolled_back
    return state
