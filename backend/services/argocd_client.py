import logging
from typing import Any
import httpx
from config import settings

logger = logging.getLogger(__name__)


class ArgocdClient:
    def __init__(self):
        self._base = settings.argocd_server.rstrip("/") + "/api/v1"
        self._headers = {"Authorization": f"Bearer {settings.argocd_token}"}

    async def create_app(
        self,
        app_name: str,
        namespace: str,
        project_name: str,
        tenant_id: str,
    ) -> dict[str, Any]:
        payload = {
            "metadata": {"name": app_name},
            "spec": {
                "project": "default",
                "source": {
                    "repoURL": f"https://{settings.gitops_repo}",
                    "targetRevision": settings.gitops_branch,
                    "path": f"tenants/{tenant_id}/{project_name}",
                    "helm": {"valueFiles": ["values.yaml"]},
                },
                "destination": {"server": "https://kubernetes.default.svc", "namespace": namespace},
                "syncPolicy": {"automated": {"prune": True, "selfHeal": True}},
            },
        }
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.post(f"{self._base}/applications", json=payload, headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def sync_app(self, app_name: str) -> None:
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.post(
                f"{self._base}/applications/{app_name}/sync",
                headers=self._headers,
            )
            resp.raise_for_status()

    async def delete_app(self, app_name: str, cascade: bool = True) -> None:
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.delete(
                f"{self._base}/applications/{app_name}",
                params={"cascade": str(cascade).lower()},
                headers=self._headers,
            )
            if resp.status_code != 404:
                resp.raise_for_status()

    async def get_app_status(self, app_name: str) -> dict[str, Any] | None:
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.get(f"{self._base}/applications/{app_name}", headers=self._headers)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
