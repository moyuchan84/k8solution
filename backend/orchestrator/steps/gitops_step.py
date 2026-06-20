import logging
from orchestrator.state import ProjectState
from services.github_client import GitHubClient
from services.argocd_client import ArgocdClient

logger = logging.getLogger(__name__)


async def push_gitops_manifest(state: ProjectState) -> ProjectState:
    github = GitHubClient()
    await github.push_gitops_manifest(
        tenant_id=state.tenant_id,
        project_name=state.project_name,
        namespace=state.k8s_namespace or state.tenant_id,
        harbor_project=state.harbor_project or "",
        resource_size=state.resource_size.value,
    )
    logger.info("GitOps manifest pushed for %s/%s", state.tenant_id, state.project_name)
    return state


async def sync_argocd(state: ProjectState) -> ProjectState:
    client = ArgocdClient()
    app_name = f"{state.tenant_id}-{state.project_name}"
    await client.create_app(
        app_name=app_name,
        namespace=state.k8s_namespace or state.tenant_id,
        project_name=state.project_name,
        tenant_id=state.tenant_id,
    )
    await client.sync_app(app_name)
    state.argocd_app_name = app_name
    logger.info("ArgoCD app synced: %s", app_name)
    return state
