import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def k8s_client():
    with patch("kubernetes.config.load_incluster_config"), \
         patch("kubernetes.client.CoreV1Api"), \
         patch("kubernetes.client.AppsV1Api"), \
         patch("kubernetes.client.NetworkingV1Api"), \
         patch("kubernetes.client.RbacAuthorizationV1Api"), \
         patch("kubernetes.client.CustomObjectsApi"):
        from services.k8s_client import K8sClient
        return K8sClient()


@pytest.mark.asyncio
async def test_create_namespace_calls_api(k8s_client):
    k8s_client._core.create_namespace = MagicMock()
    await k8s_client.create_namespace("test-ns", labels={"team": "test"})
    k8s_client._core.create_namespace.assert_called_once()


@pytest.mark.asyncio
async def test_delete_namespace_calls_api(k8s_client):
    k8s_client._core.delete_namespace = MagicMock()
    await k8s_client.delete_namespace("test-ns")
    k8s_client._core.delete_namespace.assert_called_once_with("test-ns")
