import logging
from orchestrator.state import ProjectState
from services.github_client import GitHubClient

logger = logging.getLogger(__name__)


async def create_github_repo(state: ProjectState) -> ProjectState:
    client = GitHubClient()
    repo = await client.create_repo(
        name=state.project_name,
        description=state.service_description,
        org=None,
    )
    state.github_repo_url = repo["html_url"]
    logger.info("GitHub repo created: %s", state.github_repo_url)

    await client.push_ci_workflow(
        repo_name=state.project_name,
        tenant_id=state.tenant_id,
        stack=state.stack,
    )
    return state
