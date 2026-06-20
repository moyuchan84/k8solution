import logging
from orchestrator.state import ProjectState
from services.harbor_client import HarborClient

logger = logging.getLogger(__name__)


async def create_harbor_project(state: ProjectState) -> ProjectState:
    client = HarborClient()
    project_name = f"{state.tenant_id}-{state.project_name}"
    await client.create_project(project_name)
    state.harbor_project = project_name
    logger.info("Harbor project created: %s", project_name)
    return state
