import logging
from typing import Any
from kubernetes import client, config as k8s_config
from config import settings

logger = logging.getLogger(__name__)


class K8sClient:
    def __init__(self):
        if settings.k8s_in_cluster:
            k8s_config.load_incluster_config()
        elif settings.k8s_kubeconfig:
            k8s_config.load_kube_config(config_file=settings.k8s_kubeconfig)
        else:
            k8s_config.load_kube_config()
        self._core = client.CoreV1Api()
        self._apps = client.AppsV1Api()
        self._net = client.NetworkingV1Api()
        self._rbac = client.RbacAuthorizationV1Api()
        self._custom = client.CustomObjectsApi()

    async def create_namespace(
        self,
        name: str,
        labels: dict[str, str] | None = None,
        resource_quota: dict[str, str] | None = None,
    ) -> None:
        ns = client.V1Namespace(
            metadata=client.V1ObjectMeta(name=name, labels=labels or {})
        )
        self._core.create_namespace(ns)

        if resource_quota:
            quota = client.V1ResourceQuota(
                metadata=client.V1ObjectMeta(name=f"{name}-quota", namespace=name),
                spec=client.V1ResourceQuotaSpec(
                    hard={
                        "requests.cpu": resource_quota.get("cpu", "20"),
                        "requests.memory": resource_quota.get("memory", "40Gi"),
                        "count/pods": resource_quota.get("pods", "50"),
                    }
                ),
            )
            self._core.create_namespaced_resource_quota(name, quota)

    async def delete_namespace(self, name: str) -> None:
        self._core.delete_namespace(name)

    async def apply_rbac(self, namespace: str, project_name: str) -> None:
        # ServiceAccount
        sa = client.V1ServiceAccount(
            metadata=client.V1ObjectMeta(name=project_name, namespace=namespace)
        )
        self._core.create_namespaced_service_account(namespace, sa)

        # Role
        role = client.V1Role(
            metadata=client.V1ObjectMeta(name=f"{project_name}-role", namespace=namespace),
            rules=[
                client.V1PolicyRule(
                    api_groups=[""], verbs=["get", "list", "watch"],
                    resources=["pods", "services", "configmaps"]
                )
            ],
        )
        self._rbac.create_namespaced_role(namespace, role)

        # RoleBinding
        binding = client.V1RoleBinding(
            metadata=client.V1ObjectMeta(name=f"{project_name}-binding", namespace=namespace),
            role_ref=client.V1RoleRef(api_group="rbac.authorization.k8s.io", kind="Role", name=f"{project_name}-role"),
            subjects=[client.V1Subject(kind="ServiceAccount", name=project_name, namespace=namespace)],
        )
        self._rbac.create_namespaced_role_binding(namespace, binding)

    async def apply_network_policy(self, namespace: str, project_name: str) -> None:
        policy = client.V1NetworkPolicy(
            metadata=client.V1ObjectMeta(name="default-deny-all", namespace=namespace),
            spec=client.V1NetworkPolicySpec(
                pod_selector=client.V1LabelSelector(),
                policy_types=["Ingress", "Egress"],
                egress=[
                    client.V1NetworkPolicyEgressRule(
                        to=[client.V1NetworkPolicyPeer(
                            namespace_selector=client.V1LabelSelector(
                                match_labels={"name": "kube-system"}
                            )
                        )],
                        ports=[client.V1NetworkPolicyPort(port=53)],
                    )
                ],
            ),
        )
        self._net.create_namespaced_network_policy(namespace, policy)

    async def apply_virtual_service(self, service_name: str, namespace: str, domain_suffix: str) -> None:
        vs = {
            "apiVersion": "networking.istio.io/v1beta1",
            "kind": "VirtualService",
            "metadata": {"name": service_name, "namespace": namespace},
            "spec": {
                "hosts": [f"{service_name}.{domain_suffix}"],
                "gateways": ["istio-system/global-gateway"],
                "http": [{"route": [{"destination": {"host": service_name, "port": {"number": 80}}}]}],
            },
        }
        self._custom.create_namespaced_custom_object(
            group="networking.istio.io", version="v1beta1",
            namespace=namespace, plural="virtualservices", body=vs,
        )

    async def delete_virtual_service(self, service_name: str, namespace: str) -> None:
        self._custom.delete_namespaced_custom_object(
            group="networking.istio.io", version="v1beta1",
            namespace=namespace, plural="virtualservices", name=service_name,
        )
