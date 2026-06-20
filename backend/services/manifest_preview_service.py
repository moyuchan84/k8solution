import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(enabled_extensions=()),
)

RESOURCE_MAP = {
    "S": {"cpu_request": "100m", "cpu_limit": "500m", "mem_request": "128Mi", "mem_limit": "512Mi", "replicas": 1},
    "M": {"cpu_request": "500m", "cpu_limit": "1000m", "mem_request": "512Mi", "mem_limit": "1Gi", "replicas": 2},
    "L": {"cpu_request": "1000m", "cpu_limit": "2000m", "mem_request": "1Gi", "mem_limit": "2Gi", "replicas": 3},
}


def render_manifest_preview(
    project_name: str,
    tenant_id: str,
    namespace: str,
    resource_size: str,
    domain_suffix: str,
    harbor_project: str,
) -> dict[str, str]:
    ctx = {
        "project_name": project_name,
        "tenant_id": tenant_id,
        "namespace": namespace,
        "domain_suffix": domain_suffix,
        "harbor_project": harbor_project,
        **RESOURCE_MAP.get(resource_size, RESOURCE_MAP["S"]),
    }
    return {
        "namespace": _jinja_env.get_template("namespace.yaml.j2").render(**ctx),
        "rbac": _jinja_env.get_template("rbac.yaml.j2").render(**ctx),
        "networkpolicy": _jinja_env.get_template("networkpolicy.yaml.j2").render(**ctx),
        "virtualservice": _jinja_env.get_template("virtualservice.yaml.j2").render(**ctx),
        "argocd_app": _jinja_env.get_template("argocd-app.yaml.j2").render(**ctx),
        "helm_values": _jinja_env.get_template("helm-values.yaml.j2").render(**ctx),
    }
