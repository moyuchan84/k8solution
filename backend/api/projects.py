import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.project import Project, ProjectCreate, ProjectStatus
from orchestrator.runner import run_workflow
from orchestrator.state import ProjectState

router = APIRouter()


@router.get("/", response_model=list[Project])
async def list_projects(tenant_id: str | None = None):
    # TODO: DB 조회
    return []


@router.post("/", status_code=202)
async def create_project(body: ProjectCreate, background_tasks: BackgroundTasks):
    tracking_id = str(uuid.uuid4())
    state = ProjectState(
        tracking_id=tracking_id,
        project_name=body.name,
        tenant_id=body.tenant_id,
        service_description=body.service_description,
        resource_size=body.resource_size,
        stack=body.stack,
    )
    background_tasks.add_task(run_workflow, state)
    return {"tracking_id": tracking_id, "status": "pending"}


@router.get("/{project_name}", response_model=Project)
async def get_project(project_name: str):
    # TODO: DB 조회
    raise HTTPException(status_code=404, detail="Project not found")


@router.get("/{project_name}/status", response_model=ProjectStatus)
async def get_project_status(project_name: str):
    # TODO: Redis에서 상태 조회
    raise HTTPException(status_code=404, detail="Project not found")


@router.delete("/{project_name}", status_code=204)
async def delete_project(project_name: str):
    # TODO: K8s 리소스 정리 + GitOps 매니페스트 삭제
    raise HTTPException(status_code=501, detail="Not implemented")
