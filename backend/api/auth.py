from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    # TODO: LDAP/OIDC 인증 구현
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/logout")
async def logout():
    # TODO: 세션 무효화
    return {"success": True}
