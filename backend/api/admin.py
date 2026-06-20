from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/tenants")
async def admin_list_tenants():
    # TODO: 플랫폼 관리자용 전체 테넌트 목록
    return []


@router.post("/arc/setup/verify")
async def verify_arc_setup(body: dict):
    """GitHub App 크리덴셜 검증."""
    # TODO: ARC 설정 검증 구현
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/kyverno/policies")
async def list_kyverno_policies():
    # TODO: Kyverno 정책 목록 조회
    return []
