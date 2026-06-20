import logging
from orchestrator.state import TenantState
from services.arc_service import ArcService
from config import settings

logger = logging.getLogger(__name__)


async def provision_arc_runner_set(state: TenantState) -> TenantState:
    runner_namespace = f"{settings.arc_runner_namespace_prefix}-{state.tenant_id}"
    service = ArcService()
    await service.create_runner_namespace(runner_namespace)
    runner_set_name = await service.create_runner_set(
        namespace=runner_namespace,
        tenant_id=state.tenant_id,
    )
    state.arc_runner_namespace = runner_namespace
    state.arc_runner_set_name = runner_set_name
    logger.info("ARC RunnerSet '%s' provisioned in namespace '%s'", runner_set_name, runner_namespace)
    return state
