import logging
from typing import Any
from kubernetes import client
from services.k8s_client import K8sClient

logger = logging.getLogger(__name__)


class NetworkPolicyService:
    def __init__(self):
        self._k8s = K8sClient()

    async def list_policies(self, namespace: str) -> list[dict[str, Any]]:
        policies = self._k8s._net.list_namespaced_network_policy(namespace)
        return [p.to_dict() for p in policies.items]

    async def create_ingress_rule(
        self,
        namespace: str,
        policy_name: str,
        from_namespace: str,
        port: int,
    ) -> None:
        policy = client.V1NetworkPolicy(
            metadata=client.V1ObjectMeta(name=policy_name, namespace=namespace),
            spec=client.V1NetworkPolicySpec(
                pod_selector=client.V1LabelSelector(),
                policy_types=["Ingress"],
                ingress=[
                    client.V1NetworkPolicyIngressRule(
                        _from=[client.V1NetworkPolicyPeer(
                            namespace_selector=client.V1LabelSelector(
                                match_labels={"name": from_namespace}
                            )
                        )],
                        ports=[client.V1NetworkPolicyPort(port=port)],
                    )
                ],
            ),
        )
        self._k8s._net.create_namespaced_network_policy(namespace, policy)

    async def delete_policy(self, namespace: str, policy_name: str) -> None:
        self._k8s._net.delete_namespaced_network_policy(policy_name, namespace)
