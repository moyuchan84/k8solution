from fastapi import APIRouter, HTTPException
from models.tenant import Tenant, TenantCreate

router = APIRouter()


@router.get("/", response_model=list[Tenant])
async def list_tenants():
    # TODO: DB 조회
    return []


@router.post("/", response_model=Tenant, status_code=201)
async def create_tenant(body: TenantCreate):
    # TODO: 테넌트 프로비저닝 워크플로우 실행
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    # TODO: DB 조회
    raise HTTPException(status_code=404, detail="Tenant not found")


@router.delete("/{tenant_id}", status_code=204)
async def delete_tenant(tenant_id: str):
    # TODO: 테넌트 삭제 + K8s 리소스 정리
    raise HTTPException(status_code=501, detail="Not implemented")
