import logging
from orchestrator.state import ProjectState, TenantState
from services.k8s_client import K8sClient

logger = logging.getLogger(__name__)

# 리소스 사이즈 매핑
RESOURCE_MAP = {
    "S": {"cpu_request": "100m", "cpu_limit": "500m", "mem_request": "128Mi", "mem_limit": "512Mi", "replicas": 1},
    "M": {"cpu_request": "500m", "cpu_limit": "1000m", "mem_request": "512Mi", "mem_limit": "1Gi", "replicas": 2},
    "L": {"cpu_request": "1000m", "cpu_limit": "2000m", "mem_request": "1Gi", "mem_limit": "2Gi", "replicas": 3},
}


async def provision_k8s_namespace(state: ProjectState | TenantState) -> ProjectState | TenantState:
    client = K8sClient()
    if isinstance(state, ProjectState):
        namespace = f"{state.tenant_id}-{state.project_name}"
        await client.create_namespace(namespace, labels={"team": state.tenant_id, "project": state.project_name})
        state.k8s_namespace = namespace
    else:
        await client.create_namespace(
            state.tenant_id,
            labels={"team": state.tenant_id, "managed-by": "gitops-platform"},
            resource_quota={"cpu": state.resource_quota_cpu, "memory": state.resource_quota_memory, "pods": str(state.resource_quota_pods)},
        )
        state.k8s_namespace = state.tenant_id
    logger.info("Namespace provisioned: %s", state.k8s_namespace)
    return state


async def apply_rbac(state: ProjectState) -> ProjectState:
    client = K8sClient()
    await client.apply_rbac(
        namespace=state.k8s_namespace or state.tenant_id,
        project_name=state.project_name,
    )
    logger.info("RBAC applied for %s", state.project_name)
    return state


async def apply_network_policy(state: ProjectState) -> ProjectState:
    client = K8sClient()
    await client.apply_network_policy(
        namespace=state.k8s_namespace or state.tenant_id,
        project_name=state.project_name,
    )
    logger.info("NetworkPolicy applied for %s", state.project_name)
    return state
