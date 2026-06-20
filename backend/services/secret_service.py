import base64
import logging
from typing import Any
from kubernetes import client
from services.k8s_client import K8sClient

logger = logging.getLogger(__name__)


class SecretService:
    def __init__(self):
        self._k8s = K8sClient()

    async def set_secret(self, namespace: str, secret_name: str, data: dict[str, str]) -> None:
        encoded = {k: base64.b64encode(v.encode()).decode() for k, v in data.items()}
        secret = client.V1Secret(
            metadata=client.V1ObjectMeta(name=secret_name, namespace=namespace),
            data=encoded,
        )
        try:
            self._k8s._core.create_namespaced_secret(namespace, secret)
        except Exception:
            self._k8s._core.replace_namespaced_secret(secret_name, namespace, secret)
        logger.info("Secret '%s' upserted in namespace '%s'", secret_name, namespace)

    async def get_secret(self, namespace: str, secret_name: str) -> dict[str, str]:
        secret = self._k8s._core.read_namespaced_secret(secret_name, namespace)
        return {
            k: base64.b64decode(v).decode()
            for k, v in (secret.data or {}).items()
        }

    async def delete_secret(self, namespace: str, secret_name: str) -> None:
        self._k8s._core.delete_namespaced_secret(secret_name, namespace)

    async def list_secrets(self, namespace: str) -> list[str]:
        secrets = self._k8s._core.list_namespaced_secret(namespace)
        return [s.metadata.name for s in secrets.items]
