import logging
from orchestrator.state import ProjectState
from services.k8s_client import K8sClient
from config import settings

logger = logging.getLogger(__name__)


async def configure_envoy_routing(state: ProjectState) -> ProjectState:
    client = K8sClient()
    service_url = f"https://{state.project_name}.{settings.domain_suffix}"
    await client.apply_virtual_service(
        service_name=state.project_name,
        namespace=state.k8s_namespace or state.tenant_id,
        domain_suffix=settings.domain_suffix,
    )
    state.service_url = service_url
    logger.info("Envoy VirtualService configured: %s", service_url)
    return state
