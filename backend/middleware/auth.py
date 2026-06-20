from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from models.user import TokenPayload, UserRole
from config import settings

_bearer = HTTPBearer()


def _decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        return TokenPayload(**payload)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> TokenPayload:
    return _decode_token(credentials.credentials)


def require_role(*roles: UserRole):
    async def _check(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        if not any(r.value in user.roles for r in roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _check


def require_tenant_access(tenant_id_param: str = "tenant_id"):
    async def _check(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        # platform-admin은 모든 테넌트 접근 가능
        if UserRole.platform_admin.value in user.roles:
            return user
        if tenant_id_param not in user.tenant_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this tenant")
        return user
    return _check
