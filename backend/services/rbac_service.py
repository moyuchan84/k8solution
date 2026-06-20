import logging
from typing import Any
from kubernetes import client
from services.k8s_client import K8sClient

logger = logging.getLogger(__name__)

# 역할별 기본 권한 매트릭스
ROLE_RULES: dict[str, list[dict[str, Any]]] = {
    "developer": [
        {"apiGroups": [""], "resources": ["pods", "services", "configmaps"], "verbs": ["get", "list", "watch"]},
        {"apiGroups": ["apps"], "resources": ["deployments"], "verbs": ["get", "list", "watch", "update", "patch"]},
    ],
    "tenant-admin": [
        {"apiGroups": ["", "apps", "networking.k8s.io"], "resources": ["*"], "verbs": ["*"]},
    ],
    "read-only": [
        {"apiGroups": ["", "apps"], "resources": ["*"], "verbs": ["get", "list", "watch"]},
    ],
}


class RbacService:
    def __init__(self):
        self._k8s = K8sClient()

    async def bind_user(self, namespace: str, username: str, role: str) -> None:
        rules = ROLE_RULES.get(role)
        if not rules:
            raise ValueError(f"Unknown role: {role}")

        role_name = f"{username}-{role}"
        k8s_role = client.V1Role(
            metadata=client.V1ObjectMeta(name=role_name, namespace=namespace),
            rules=[client.V1PolicyRule(**r) for r in rules],
        )
        self._k8s._rbac.create_namespaced_role(namespace, k8s_role)

        binding = client.V1RoleBinding(
            metadata=client.V1ObjectMeta(name=f"{role_name}-binding", namespace=namespace),
            role_ref=client.V1RoleRef(api_group="rbac.authorization.k8s.io", kind="Role", name=role_name),
            subjects=[client.V1Subject(kind="User", name=username)],
        )
        self._k8s._rbac.create_namespaced_role_binding(namespace, binding)
        logger.info("User %s bound to role %s in namespace %s", username, role, namespace)

    async def get_matrix(self, namespace: str) -> list[dict[str, Any]]:
        bindings = self._k8s._rbac.list_namespaced_role_binding(namespace)
        return [b.to_dict() for b in bindings.items]
