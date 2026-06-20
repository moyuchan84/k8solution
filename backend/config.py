from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 앱
    environment: str = "development"
    log_level: str = "INFO"

    # 사내 인프라
    github_base_url: str = "https://github.samsungds.net"
    github_token: str = ""
    github_org: str = ""

    harbor_url: str = "https://harbor.foundrymtc.samsungds.net"
    harbor_username: str = ""
    harbor_password: str = ""

    argocd_server: str = "https://argocd.swsol.samsungds.net"
    argocd_token: str = ""

    domain_suffix: str = "swsol.samsungds.net"
    gitops_repo: str = "github.samsungds.net/infra-team/gitops-manifests"
    gitops_branch: str = "main"

    # K8s
    k8s_in_cluster: bool = True
    k8s_kubeconfig: str = ""

    # 인증
    oidc_issuer: str = ""
    oidc_client_id: str = ""
    oidc_client_secret: str = ""
    jwt_secret_key: str = "change-me-in-production"

    ldap_server: str = ""
    ldap_bind_dn: str = ""
    ldap_bind_password: str = ""
    ldap_base_dn: str = ""

    # 데이터베이스
    database_url: str = "postgresql://platform:localdev@localhost:5432/gitops_platform"
    redis_url: str = "redis://localhost:6379/0"

    # LLM (선택적)
    llm_enabled: bool = False
    llm_base_url: str = "http://localhost:11434/v1"
    llm_model: str = "llama3.2:3b"
    llm_api_key: str = "ollama"

    # ARC
    arc_namespace: str = "arc-systems"
    arc_runner_namespace_prefix: str = "arc-runners"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
