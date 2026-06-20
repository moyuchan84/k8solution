import logging
from kubernetes import client
from services.k8s_client import K8sClient
from config import settings

logger = logging.getLogger(__name__)


class ArcService:
    def __init__(self):
        self._k8s = K8sClient()

    async def create_runner_namespace(self, namespace: str) -> None:
        await self._k8s.create_namespace(
            namespace,
            labels={"managed-by": "gitops-platform", "arc-runners": "true"},
        )
        logger.info("ARC runner namespace created: %s", namespace)

    async def create_runner_set(self, namespace: str, tenant_id: str) -> str:
        runner_set_name = f"{tenant_id}-runner-set"
        # AutoscalingRunnerSet CRD (actions.github.com/v1alpha1)
        runner_set = {
            "apiVersion": "actions.github.com/v1alpha1",
            "kind": "AutoscalingRunnerSet",
            "metadata": {
                "name": runner_set_name,
                "namespace": namespace,
                "labels": {"tenant": tenant_id},
            },
            "spec": {
                "githubConfigUrl": f"{settings.github_base_url}/{settings.github_org}",
                "minRunners": 1,
                "maxRunners": 5,
                "runnerGroup": tenant_id,
                "template": {
                    "spec": {
                        "containers": [{
                            "name": "runner",
                            "image": f"{settings.harbor_url}/arc/actions-runner:latest",
                            "resources": {
                                "requests": {"cpu": "500m", "memory": "512Mi"},
                                "limits": {"cpu": "1", "memory": "1Gi"},
                            },
                        }]
                    }
                },
            },
        }
        custom = self._k8s._custom
        custom.create_namespaced_custom_object(
            group="actions.github.com",
            version="v1alpha1",
            namespace=namespace,
            plural="autoscalingrunnersets",
            body=runner_set,
        )
        logger.info("ARC AutoscalingRunnerSet created: %s", runner_set_name)
        return runner_set_name
