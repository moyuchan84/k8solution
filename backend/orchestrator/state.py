from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class ResourceSize(str, Enum):
    small = "S"
    medium = "M"
    large = "L"


class WorkflowStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    rolled_back = "rolled_back"


class ProjectState(BaseModel):
    tracking_id: str
    project_name: str
    tenant_id: str
    service_description: str = ""
    resource_size: ResourceSize = ResourceSize.small
    stack: str = "python"

    # 런타임 상태
    status: WorkflowStatus = WorkflowStatus.pending
    completed_steps: list[str] = Field(default_factory=list)
    error: str | None = None
    error_diagnosis: str | None = None

    # 생성된 리소스 참조
    github_repo_url: str | None = None
    harbor_project: str | None = None
    k8s_namespace: str | None = None
    argocd_app_name: str | None = None
    service_url: str | None = None

    # LLM 추천 (선택적)
    llm_suggested_size: ResourceSize | None = None
    llm_summary: str | None = None

    # 메타
    extra: dict[str, Any] = Field(default_factory=dict)


class TenantState(BaseModel):
    tracking_id: str
    tenant_id: str
    display_name: str
    admin_uids: list[str] = Field(default_factory=list)
    resource_quota_cpu: str = "20"
    resource_quota_memory: str = "40Gi"
    resource_quota_pods: int = 50

    status: WorkflowStatus = WorkflowStatus.pending
    completed_steps: list[str] = Field(default_factory=list)
    error: str | None = None

    # ARC
    arc_runner_set_name: str | None = None
    arc_runner_namespace: str | None = None
