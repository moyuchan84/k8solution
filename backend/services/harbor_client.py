import logging
from typing import Any
import httpx
from config import settings

logger = logging.getLogger(__name__)


class HarborClient:
    def __init__(self):
        self._base = settings.harbor_url.rstrip("/") + "/api/v2.0"
        self._auth = (settings.harbor_username, settings.harbor_password)

    async def create_project(self, name: str, public: bool = False) -> dict[str, Any]:
        payload = {
            "project_name": name,
            "public": public,
            "metadata": {"public": str(public).lower()},
        }
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.post(f"{self._base}/projects", json=payload, auth=self._auth)
            resp.raise_for_status()
            return {"name": name}

    async def delete_project(self, name: str) -> None:
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.delete(f"{self._base}/projects/{name}", auth=self._auth)
            if resp.status_code != 404:
                resp.raise_for_status()

    async def get_project(self, name: str) -> dict[str, Any] | None:
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.get(f"{self._base}/projects/{name}", auth=self._auth)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
