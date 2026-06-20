from datetime import datetime
from typing import Any
from pydantic import BaseModel
from orchestrator.state import ResourceSize, WorkflowStatus


class ProjectCreate(BaseModel):
    name: str
    tenant_id: str
    service_description: str = ""
    resource_size: ResourceSize = ResourceSize.small
    stack: str = "python"


class Project(BaseModel):
    name: str
    tenant_id: str
    stack: str
    resource_size: ResourceSize
    github_repo_url: str | None = None
    harbor_project: str | None = None
    k8s_namespace: str | None = None
    argocd_app_name: str | None = None
    service_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectStatus(BaseModel):
    tracking_id: str
    project_name: str
    status: WorkflowStatus
    completed_steps: list[str]
    error: str | None = None
    error_diagnosis: str | None = None
    service_url: str | None = None


class ApiResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None
    tracking_id: str | None = None
