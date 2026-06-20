import re
from orchestrator.state import ProjectState


_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9-]{1,52}[a-z0-9]$")


async def validate_request(state: ProjectState) -> ProjectState:
    if not _NAME_PATTERN.match(state.project_name):
        raise ValueError(
            f"Invalid project name '{state.project_name}'. "
            "Must be lowercase alphanumeric with hyphens, 3-54 characters."
        )
    if not state.tenant_id:
        raise ValueError("tenant_id is required")
    return state
