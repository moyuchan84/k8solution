from pydantic import BaseModel


class ResourceQuota(BaseModel):
    cpu: str = "20"
    memory: str = "40Gi"
    pods: int = 50


class TenantCreate(BaseModel):
    id: str
    display_name: str
    admin_uids: list[str] = []
    resource_quota: ResourceQuota = ResourceQuota()
    allowed_registries: list[str] = []


class Tenant(BaseModel):
    id: str
    display_name: str
    namespace: str
    admin_uids: list[str] = []
    resource_quota: ResourceQuota = ResourceQuota()
    allowed_registries: list[str] = []
    arc_runner_namespace: str | None = None
