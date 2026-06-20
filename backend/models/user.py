from enum import Enum
from pydantic import BaseModel


class UserRole(str, Enum):
    platform_admin = "platform-admin"
    tenant_admin = "tenant-admin"
    developer = "developer"
    read_only = "read-only"


class User(BaseModel):
    uid: str
    email: str
    display_name: str
    roles: list[UserRole] = []
    tenant_ids: list[str] = []


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    roles: list[str] = []
    tenant_ids: list[str] = []
    exp: int | None = None
