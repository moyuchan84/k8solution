import logging
from typing import Any
import httpx
from config import settings

logger = logging.getLogger(__name__)


class GitHubClient:
    def __init__(self):
        self._base = settings.github_base_url.rstrip("/") + "/api/v3"
        self._headers = {
            "Authorization": f"token {settings.github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

    async def create_repo(self, name: str, description: str = "", org: str | None = None) -> dict[str, Any]:
        url = f"{self._base}/orgs/{org or settings.github_org}/repos"
        payload = {
            "name": name,
            "description": description,
            "private": True,
            "auto_init": True,
        }
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.post(url, json=payload, headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def delete_repo(self, name: str, org: str | None = None) -> None:
        url = f"{self._base}/repos/{org or settings.github_org}/{name}"
        async with httpx.AsyncClient(verify=False) as http:
            resp = await http.delete(url, headers=self._headers)
            resp.raise_for_status()

    async def push_ci_workflow(self, repo_name: str, tenant_id: str, stack: str) -> None:
        # TODO: Jinja2 템플릿으로 CI YAML 생성 후 GitHub Contents API로 Push
        logger.info("CI workflow push: %s/%s (stack=%s)", tenant_id, repo_name, stack)

    async def push_gitops_manifest(
        self,
        tenant_id: str,
        project_name: str,
        namespace: str,
        harbor_project: str,
        resource_size: str,
    ) -> None:
        # TODO: gitops-manifests 레포에 ArgoCD Application YAML Push
        logger.info("GitOps manifest push: %s/%s", tenant_id, project_name)

    async def set_repo_secret(self, repo_name: str, secret_name: str, secret_value: str) -> None:
        # TODO: GitHub Repository Secrets API
        logger.info("Setting repo secret %s for %s", secret_name, repo_name)
