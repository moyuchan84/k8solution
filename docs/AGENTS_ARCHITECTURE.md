# AGENTS_ARCHITECTURE.md — 오케스트레이터 & 백엔드 서비스 설계

## 1. 아키텍처 결정 요약

| 항목 | 결정 | 이유 |
|------|------|------|
| 핵심 워크플로우 | **순수 async Python** (LangGraph 없음) | 결정론적 API 호출 체인, LLM 판단 불필요 |
| 추가 기능 백엔드 | **독립 서비스 모듈** (NetworkPolicy, RBAC, CRD 등) | Wizard와 별개로 실시간 편집 가능 |
| LLM 연동 | **3개 지점 선택적 연결** | 실질 가치가 있는 곳만 사용 |
| LLM 전환 | **환경변수로 로컬↔사내 전환** | 코드 변경 없이 모델 교체 |
| 프레임워크 | **langchain-openai** (OpenAI 호환 인터페이스) | Ollama·사내 LLM 동일 코드로 사용 |

---

## 2. 전체 구조

```
┌──────────────────────────────────────────────────────────────────┐
│                       FastAPI Router                             │
│                                                                  │
│  POST /projects          → Orchestrator (프로비저닝 워크플로우)  │
│  POST /tenants           → TenantOrchestrator (테넌트+ARC 생성) │
│  GET  /projects/:n/network/rules  → NetworkPolicyService         │
│  POST /projects/:n/network/rules  → NetworkPolicyService         │
│  POST /projects/:n/network/preview→ ManifestPreviewService       │
│  PUT  /projects/:n/rbac/matrix    → RbacService                  │
│  POST /projects/:n/resources/apply→ ManifestApplyService         │
│  GET  /projects/:n/secrets        → SecretService                │
│  POST /projects/:n/secrets        → SecretService                │
│  POST /admin/arc/setup            → ArcSetupService              │
│  POST /webhooks/github            → WebhookHandler               │
└──────┬───────────────────┬────────────────────────┬─────────────┘
       │                   │                        │
       ▼                   ▼                        ▼
┌─────────────┐  ┌──────────────────┐   ┌──────────────────────┐
│Orchestrator │  │ NetworkPolicy    │   │  Manifest Preview    │
│  Runner     │  │ Service          │   │  Service             │
│             │  │ (실시간 편집)    │   │  (변경 전 YAML diff) │
│ validate    │  │                  │   │                      │
│ → github    │  │ - 규칙 CRUD      │   │ - YAML 생성          │
│ → harbor    │  │ - DNS→IP 변환    │   │ - before/after diff  │
│ → k8s_ns   │  │ - 연결 테스트    │   │ - schema 검증        │
│ → rbac      │  │ - GitOps 커밋   │   └──────────────────────┘
│ → netpolicy │  └──────────────────┘
│ → envoy     │  ┌──────────────────┐   ┌──────────────────────┐
│ → gitops    │  │  RBAC Service    │   │  Secret Service      │
│ → argocd    │  │                  │   │                      │
│             │  │ - 매트릭스 → Role│   │ - K8s Secret CRUD    │
│ 실패→rollbk │  │ - RoleBinding    │   │ - 환경변수 계층 관리 │
└─────────────┘  │ - SA 관리        │   │ - 값 마스킹          │
                 └──────────────────┘   └──────────────────────┘
       │
       ▼ (선택적)
┌──────────────┐
│ LLM Service  │
│ (Ollama/내부)│
└──────────────┘
```
           │ 선택적 호출 (LLM_ENABLED=true 일 때만)
           ▼
┌──────────────────────────┐
│     LLM Service          │
│  (langchain-openai)      │
│                          │
│  로컬:  Ollama           │
│  사내:  내부 LLM API     │
└──────────────────────────┘
```

---

## 3. 상태 모델

```python
# backend/orchestrator/state.py

from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum
from uuid import uuid4

class ProjectStatus(str, Enum):
    PENDING      = "pending"
    IN_PROGRESS  = "in_progress"
    COMPLETED    = "completed"
    FAILED       = "failed"
    ROLLED_BACK  = "rolled_back"

class DbConnection(BaseModel):
    type: str           # "postgresql", "mysql", "redis", "mongodb"
    host: str
    port: int
    database: str
    secret_name: str    # K8s Secret 이름 (크리덴셜 직접 저장 안 함)

class ProjectState(BaseModel):
    # ── 입력 ──────────────────────────────────────
    tracking_id: str = Field(default_factory=lambda: str(uuid4()))
    project_name: str
    tenant_id: str
    stack: str              # "java-spring" | "nodejs" | "python-fastapi" | "go"
    resource_size: str      # "small" | "medium" | "large"
    env: str                # "dev" | "staging" | "prod"
    service_port: int = 8080
    health_check_path: str = "/health"
    description: str = ""
    db_connections: list[DbConnection] = []
    requested_by: str

    # ── 처리 중 생성되는 데이터 ────────────────────
    github_repo_url: Optional[str] = None
    harbor_project_name: Optional[str] = None
    k8s_namespace: Optional[str] = None
    service_url: Optional[str] = None
    argocd_app_name: Optional[str] = None

    # ── 진행 상태 ──────────────────────────────────
    status: ProjectStatus = ProjectStatus.PENDING
    current_step: str = ""
    completed_steps: list[str] = []
    error: Optional[str] = None

    # ── LLM 생성 콘텐츠 (선택적) ──────────────────
    llm_resource_suggestion: Optional[str] = None   # 리소스 추천 근거
    llm_completion_summary: Optional[str] = None    # 완료 요약
    llm_error_diagnosis: Optional[str] = None       # 에러 진단
```

---

## 4. 오케스트레이터 Runner

```python
# backend/orchestrator/runner.py

import asyncio
from .state import ProjectState, ProjectStatus
from .steps import (
    validate_request, create_github_repo, create_harbor_project,
    provision_k8s_namespace, apply_rbac, apply_network_policy,
    configure_envoy_routing, push_gitops_manifest, sync_argocd,
)
from .rollback import rollback
from ..services.redis_client import redis
from ..services.llm_service import llm_service
from ..config import settings

# 실행 순서 (변경 시 이 리스트만 수정)
WORKFLOW_STEPS = [
    validate_request,
    create_github_repo,
    create_harbor_project,
    provision_k8s_namespace,
    apply_rbac,
    apply_network_policy,
    configure_envoy_routing,
    push_gitops_manifest,
    sync_argocd,
]

async def run_workflow(state: ProjectState) -> ProjectState:
    state.status = ProjectStatus.IN_PROGRESS
    await _save_state(state)

    for step in WORKFLOW_STEPS:
        state.current_step = step.__name__
        await _save_state(state)

        try:
            state = await step(state)
            state.completed_steps.append(step.__name__)
            await _save_state(state)

        except Exception as e:
            state.status = ProjectStatus.FAILED
            state.error = str(e)

            # LLM 에러 진단 (선택적)
            if settings.LLM_ENABLED:
                state.llm_error_diagnosis = await llm_service.diagnose_error(
                    step=step.__name__,
                    error=str(e),
                    context=state.model_dump(),
                )

            await _save_state(state)
            await rollback(state)
            return state

    # 완료
    state.status = ProjectStatus.COMPLETED
    state.service_url = f"https://{state.project_name}.{settings.DOMAIN_SUFFIX}"

    # LLM 완료 요약 (선택적)
    if settings.LLM_ENABLED:
        state.llm_completion_summary = await llm_service.summarize_completion(state)

    await _save_state(state)
    return state


async def _save_state(state: ProjectState) -> None:
    await redis.set(
        f"task:{state.tracking_id}",
        state.model_dump_json(),
        ex=3600,  # 1시간 TTL
    )
```

---

## 5. 각 Step 구현 명세

### validate_request

```python
# backend/orchestrator/steps/validate.py

async def validate_request(state: ProjectState) -> ProjectState:
    """
    검증 항목:
    1. project_name: 소문자·하이픈만, 3~30자, 숫자로 시작 금지
    2. 동일 namespace 내 project_name 중복 → K8s API 조회
    3. tenant_id 존재 여부 확인
    4. requested_by 사용자가 해당 tenant 접근 권한 보유 여부
    5. 추가 시 ResourceQuota 초과 여부 계산
    
    실패 시: raise ValueError("구체적인 한국어 에러 메시지")
    """
```

### create_github_repo

```python
# backend/orchestrator/steps/github_step.py

async def create_github_repo(state: ProjectState) -> ProjectState:
    """
    1. github.samsungds.net API로 레포 생성
       - org: {tenant_id}, name: {project_name}, visibility: private
    
    2. 스택별 초기 파일 1회 Push:
       ├── Dockerfile           (스택별 멀티스테이지)
       ├── .github/workflows/ci.yml  (이미지 빌드 → Harbor Push)
       ├── helm/                (서비스용 Helm Chart 스켈레톤)
       │   ├── Chart.yaml
       │   └── values.yaml
       ├── .gitignore
       └── README.md           (서비스 URL, 배포 방법 안내)
    
    3. Branch Protection:
       - main: PR 리뷰 1명 필수, 직접 Push 금지
    
    반환: state.github_repo_url 설정
    """
```

### provision_k8s_namespace

```python
# backend/orchestrator/steps/k8s_step.py

RESOURCE_SIZE_MAP = {
    "small":  {"cpu_req": "100m", "cpu_lim": "500m",  "mem_req": "128Mi", "mem_lim": "512Mi",  "replicas": 1},
    "medium": {"cpu_req": "500m", "cpu_lim": "1000m", "mem_req": "512Mi", "mem_lim": "1Gi",    "replicas": 2},
    "large":  {"cpu_req": "1",    "cpu_lim": "2",     "mem_req": "1Gi",   "mem_lim": "2Gi",    "replicas": 3},
}

async def provision_k8s_namespace(state: ProjectState) -> ProjectState:
    """
    생성 리소스:
    1. Namespace: {project_name}
       labels: team={tenant_id}, env={env}, managed-by=gitops-platform
    
    2. ResourceQuota: {project_name}-quota
       (RESOURCE_SIZE_MAP 기반 CPU/MEM 제한)
    
    3. LimitRange: {project_name}-limits
       (컨테이너 기본값 설정 - requests 미지정 시 자동 적용)
    
    4. ImagePullSecret: harbor-credentials
       (Harbor 레지스트리 접근용, 테넌트 공용 Secret 복사)
    """
```

### apply_network_policy

```python
async def apply_network_policy(state: ProjectState) -> ProjectState:
    """
    생성 NetworkPolicy 목록:
    
    1. default-deny-all
       - 모든 ingress/egress 차단 (기본 격리)
    
    2. allow-dns
       - egress → kube-system:53 (UDP/TCP) 허용
    
    3. allow-same-namespace
       - 같은 namespace Pod 간 통신 허용
    
    4. allow-from-ingress
       - ingress-nginx namespace → 앱 포트 허용
    
    5. allow-from-prometheus
       - monitoring namespace → /metrics 포트 허용
    
    DB 연결이 있는 경우 자동 추가:
    6. allow-egress-{db_type}-{n}
       - 특정 host:port egress 허용
       - host를 DNS 조회하여 IP 기반 규칙 생성
    """
```

### configure_envoy_routing

```python
async def configure_envoy_routing(state: ProjectState) -> ProjectState:
    """
    생성 리소스:
    
    1. VirtualService
       - host: {project_name}.{DOMAIN_SUFFIX}
       - gateway: istio-system/global-gateway (이미 존재, TLS 처리함)
       - route → {project_name} Service:{service_port}
       - timeout: 30s, retry: 3회
    
    2. DestinationRule
       - 로드밸런싱: ROUND_ROBIN
       - connectionPool: tcp.maxConnections=100
    
    TLS: *.{DOMAIN_SUFFIX} 와일드카드 인증서는 Gateway 레벨에서 처리
         VirtualService는 인증서 설정 불필요
    
    반환: state.service_url = "https://{project_name}.{DOMAIN_SUFFIX}"
    """
```

### push_gitops_manifest & sync_argocd

```python
async def push_gitops_manifest(state: ProjectState) -> ProjectState:
    """
    gitops-manifests 레포 ({K8S_GITOPS_REPO}) 에 Push:
    
    tenants/{tenant_id}/{project_name}/
    ├── values.yaml           # Helm 값 (이미지, 리소스, 포트, 도메인)
    └── argocd-app.yaml       # ArgoCD Application CRD
    
    argocd-app.yaml 핵심 설정:
    - source.repoURL: github_repo_url
    - source.path: helm/
    - destination.namespace: {project_name}
    - syncPolicy.automated: prune=true, selfHeal=true
    """

async def sync_argocd(state: ProjectState) -> ProjectState:
    """
    1. ArgoCD API로 Application 등록 확인 (30초 폴링)
    2. 수동 Sync 1회 트리거 (초기 배포 가속)
    3. Sync 완료 대기 (최대 5분, 10초 간격 폴링)
    4. 타임아웃 시 → 경고만 (배포는 백그라운드 계속 진행)
    """
```

---

## 6. Rollback

```python
# backend/orchestrator/rollback.py

ROLLBACK_HANDLERS = {
    "sync_argocd":             _rollback_argocd,
    "push_gitops_manifest":    _rollback_gitops,
    "configure_envoy_routing": _rollback_envoy,
    "apply_network_policy":    _rollback_network_policy,
    "apply_rbac":              _rollback_rbac,
    "provision_k8s_namespace": _rollback_namespace,      # 포함 리소스 전체 삭제
    "create_harbor_project":   _rollback_harbor,
    "create_github_repo":      _rollback_github,         # archive 처리 (삭제 대신)
}

async def rollback(state: ProjectState) -> None:
    for step_name in reversed(state.completed_steps):
        handler = ROLLBACK_HANDLERS.get(step_name)
        if handler:
            try:
                await handler(state)
            except Exception as e:
                # 롤백 실패는 로깅만, 계속 진행 (best-effort)
                logger.error(f"Rollback failed at {step_name}: {e}")
    
    state.status = ProjectStatus.ROLLED_BACK
    await _save_state(state)
```

---

## 7. LLM Service

```python
# backend/services/llm_service.py

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from ..config import settings

class LLMService:
    def __init__(self):
        # 로컬(Ollama)이든 사내 LLM이든 동일 코드
        self._llm = ChatOpenAI(
            base_url=settings.LLM_BASE_URL,
            model=settings.LLM_MODEL,
            api_key=settings.LLM_API_KEY,
            temperature=0.3,
            timeout=30,
        ) if settings.LLM_ENABLED else None

    async def suggest_resource_size(self, description: str) -> str:
        """Wizard Step 2: 서비스 설명 → S/M/L 추천"""
        if not self._llm:
            return ""
        response = await self._llm.ainvoke([
            SystemMessage(content="당신은 K8s 리소스 설계 전문가입니다. 한국어로 답변하세요."),
            HumanMessage(content=f"""
다음 서비스 설명을 보고 적합한 리소스 사이즈를 추천해주세요.

서비스 설명: {description}

선택지:
- small:  CPU 100m~500m, MEM 128Mi~512Mi, 파드 1개 (단순 CRUD, 트래픽 적음)
- medium: CPU 500m~1000m, MEM 512Mi~1Gi, 파드 2개 (일반적인 API 서버)
- large:  CPU 1~2, MEM 1Gi~2Gi, 파드 3개 (고트래픽, 복잡한 처리)

추천 사이즈와 이유를 2~3문장으로 설명해주세요.
"""),
        ])
        return response.content

    async def diagnose_error(self, step: str, error: str, context: dict) -> str:
        """배포 실패 시 에러 원인 한국어 진단"""
        if not self._llm:
            return ""
        step_names = {
            "create_github_repo":      "GitHub 레포지토리 생성",
            "create_harbor_project":   "Harbor 프로젝트 생성",
            "provision_k8s_namespace": "K8s 네임스페이스 생성",
            "apply_rbac":              "RBAC 권한 설정",
            "apply_network_policy":    "네트워크 정책 적용",
            "configure_envoy_routing": "Envoy 라우팅 설정",
            "push_gitops_manifest":    "GitOps 매니페스트 등록",
            "sync_argocd":             "ArgoCD 배포 동기화",
        }
        response = await self._llm.ainvoke([
            SystemMessage(content="당신은 K8s/DevOps 전문가입니다. 개발자가 이해하기 쉽게 한국어로 설명하세요."),
            HumanMessage(content=f"""
배포 단계: {step_names.get(step, step)}
에러 메시지: {error}
프로젝트명: {context.get('project_name')}
테넌트: {context.get('tenant_id')}

이 에러의 원인과 해결 방법을 3~5문장으로 설명해주세요.
"""),
        ])
        return response.content

    async def summarize_completion(self, state) -> str:
        """프로비저닝 완료 자연어 요약"""
        if not self._llm:
            return ""
        response = await self._llm.ainvoke([
            HumanMessage(content=f"""
다음 서비스가 성공적으로 배포되었습니다. 개발자에게 친절하게 안내해주세요. (한국어, 3~4문장)

서비스명: {state.project_name}
기술 스택: {state.stack}
서비스 URL: {state.service_url}
GitHub 레포: {state.github_repo_url}
리소스 사이즈: {state.resource_size}
DB 연결 수: {len(state.db_connections)}개
"""),
        ])
        return response.content

llm_service = LLMService()
```

---

## 8. 설정 모델

```python
# backend/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 사내 인프라
    GITHUB_BASE_URL: str = "https://github.samsungds.net"
    GITHUB_TOKEN: str
    HARBOR_URL: str = "https://harbor.foundrymtc.samsungds.net"
    HARBOR_USERNAME: str
    HARBOR_PASSWORD: str
    ARGOCD_SERVER: str = "https://argocd.swsol.samsungds.net"
    ARGOCD_TOKEN: str
    DOMAIN_SUFFIX: str = "swsol.samsungds.net"
    GITOPS_REPO: str

    # K8s
    K8S_IN_CLUSTER: bool = True

    # LLM (선택적)
    LLM_ENABLED: bool = False      # 기본 off, 필요 시 true
    LLM_BASE_URL: str = "http://localhost:11434/v1"   # Ollama 기본값
    LLM_MODEL: str = "llama3.2:3b"
    LLM_API_KEY: str = "ollama"

    # 인증
    JWT_SECRET_KEY: str
    OIDC_ISSUER: str = ""

    # 인프라
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 9. NetworkPolicy Service (실시간 편집 API)

```python
# backend/services/network_policy_service.py

import socket
import yaml
from kubernetes import client

class NetworkPolicyService:

    async def get_rules(self, namespace: str) -> list[dict]:
        """네임스페이스의 NetworkPolicy 목록을 사람이 읽기 쉬운 형태로 변환"""
        api = client.NetworkingV1Api()
        policies = api.list_namespaced_network_policy(namespace)
        return [self._parse_policy(p) for p in policies.items]

    async def preview_rule(self, namespace: str, rule: dict) -> str:
        """규칙 → YAML 문자열 반환 (적용하지 않음)"""
        manifest = self._build_manifest(namespace, rule)
        return yaml.dump(manifest, allow_unicode=True)

    async def apply_rule(self, namespace: str, rule: dict, project_name: str) -> None:
        """
        1. NetworkPolicy K8s 직접 적용
        2. GitOps 레포에도 커밋 (ArgoCD가 drift 없이 관리하도록)
        """
        manifest = self._build_manifest(namespace, rule)
        # K8s 즉시 적용
        api = client.NetworkingV1Api()
        api.create_namespaced_network_policy(namespace, manifest)
        # GitOps 동기화
        await self._commit_to_gitops(project_name, manifest)

    async def test_connection(self, namespace: str, pod_name: str, target_host: str, port: int) -> dict:
        """
        대상 Pod에서 nc/curl 실행 → 연결 성공 여부 반환
        kubectl exec {pod} -- nc -zv {host} {port}
        """
        from ..services.k8s_client import k8s_exec
        result = await k8s_exec(
            namespace=namespace,
            pod_name=pod_name,
            command=["nc", "-zv", "-w", "3", target_host, str(port)]
        )
        return {"success": result.returncode == 0, "output": result.stdout}

    def _resolve_domain_to_ip(self, domain: str) -> str:
        """도메인 → IP 변환 (NetworkPolicy는 IP 기반)"""
        return socket.gethostbyname(domain)

    def _build_manifest(self, namespace: str, rule: dict) -> dict:
        """
        rule: {
          "direction": "egress",
          "target_type": "domain",   # "domain" | "ip" | "namespace" | "service"
          "target": "db.internal.samsungds.net",
          "port": 5432,
          "protocol": "TCP"
        }
        """
        if rule["target_type"] == "domain":
            ip = self._resolve_domain_to_ip(rule["target"])
            peer = {"ipBlock": {"cidr": f"{ip}/32"}}
        elif rule["target_type"] == "namespace":
            peer = {"namespaceSelector": {"matchLabels": {"name": rule["target"]}}}
        elif rule["target_type"] == "service":
            peer = {"podSelector": {"matchLabels": {"app": rule["target"]}}}
        else:
            peer = {"ipBlock": {"cidr": rule["target"]}}

        port_entry = {"port": rule["port"], "protocol": rule.get("protocol", "TCP")}
        policy_name = f"allow-{rule['direction']}-{rule['target'].replace('.', '-')}-{rule['port']}"

        if rule["direction"] == "egress":
            spec = {"egress": [{"to": [peer], "ports": [port_entry]}], "policyTypes": ["Egress"]}
        else:
            spec = {"ingress": [{"from": [peer], "ports": [port_entry]}], "policyTypes": ["Ingress"]}

        return {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "NetworkPolicy",
            "metadata": {"name": policy_name, "namespace": namespace,
                         "labels": {"managed-by": "gitops-platform"}},
            "spec": {"podSelector": {}, **spec}
        }
```

---

## 10. RBAC Service (매트릭스 UI 연동)

```python
# backend/services/rbac_service.py

from kubernetes import client

class RbacService:

    RESOURCE_GROUPS = {
        "pods":        ("", "v1"),
        "deployments": ("apps", "v1"),
        "secrets":     ("", "v1"),
        "configmaps":  ("", "v1"),
        "jobs":        ("batch", "v1"),
        "services":    ("", "v1"),
    }

    async def get_matrix(self, namespace: str) -> list[dict]:
        """
        현재 Role/RoleBinding을 파싱 → 매트릭스 형태로 반환
        [{"subject": "dev-team", "type": "Group", "permissions": {"pods": ["get","list"], ...}}]
        """
        rbac_api = client.RbacAuthorizationV1Api()
        bindings = rbac_api.list_namespaced_role_binding(namespace)
        roles    = rbac_api.list_namespaced_role(namespace)
        return self._build_matrix(bindings.items, roles.items)

    async def update_matrix(self, namespace: str, entries: list[dict]) -> None:
        """
        매트릭스 항목 → Role + RoleBinding 생성/업데이트
        entries: [{"subject": "dev-team", "type": "Group", "permissions": {"pods": ["get","list"]}}]
        
        전략: 플랫폼 관리 Role 전체 재생성 (prefix: gitops-platform-)
        수동 생성 Role/RoleBinding은 건드리지 않음 (label selector로 구분)
        """
        rbac_api = client.RbacAuthorizationV1Api()

        # 기존 플랫폼 관리 리소스 삭제
        await self._delete_platform_rbac(namespace)

        for entry in entries:
            role_name = f"gitops-platform-{entry['subject'].replace(' ', '-')}"
            # Role 생성
            role = self._build_role(role_name, namespace, entry["permissions"])
            rbac_api.create_namespaced_role(namespace, role)
            # RoleBinding 생성
            binding = self._build_binding(role_name, namespace, entry)
            rbac_api.create_namespaced_role_binding(namespace, binding)

        # GitOps 레포에도 동기화
        await self._commit_rbac_to_gitops(namespace, entries)
```

---

## 11. Manifest Preview Service

```python
# backend/services/manifest_preview_service.py

import yaml
import difflib

class ManifestPreviewService:

    async def preview_project_changes(
        self,
        project_name: str,
        changes: dict,   # {"resource_size": "large", "replicas": 3, ...}
    ) -> dict:
        """
        현재 배포된 값 vs 변경 후 값을 YAML diff로 반환
        
        반환:
        {
          "files": [
            {
              "path": "tenants/{tenant}/values.yaml",
              "before": "...",
              "after":  "...",
              "diff":   "..."      # unified diff 형식
            }
          ]
        }
        """
        current = await self._get_current_values(project_name)
        updated = {**current, **changes}

        before_yaml = yaml.dump(current,  allow_unicode=True, sort_keys=True)
        after_yaml  = yaml.dump(updated,  allow_unicode=True, sort_keys=True)

        diff = "\n".join(difflib.unified_diff(
            before_yaml.splitlines(),
            after_yaml.splitlines(),
            fromfile="현재",
            tofile="변경 후",
            lineterm="",
        ))

        return {
            "files": [{
                "path": f"tenants/{current['tenant_id']}/{project_name}/values.yaml",
                "before": before_yaml,
                "after":  after_yaml,
                "diff":   diff,
            }]
        }

    async def validate_yaml(self, yaml_str: str) -> dict:
        """
        Raw YAML 편집기에서 [검증] 버튼 클릭 시 호출
        1. YAML 파싱 검증
        2. K8s API 서버 dry-run (실제 적용 없이 검증)
        반환: {"valid": bool, "errors": [str]}
        """
        try:
            manifest = yaml.safe_load(yaml_str)
        except yaml.YAMLError as e:
            return {"valid": False, "errors": [f"YAML 파싱 오류: {e}"]}

        # K8s dry-run
        errors = await self._k8s_dry_run(manifest)
        return {"valid": len(errors) == 0, "errors": errors}
```

---

## 12. Branch Preview 환경 자동화

```python
# backend/api/webhooks.py

@router.post("/webhooks/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    event = request.headers.get("X-GitHub-Event")

    if event == "pull_request":
        action = payload["action"]
        pr_number = payload["pull_request"]["number"]
        repo_name = payload["repository"]["name"]
        tenant_id = payload["organization"]["login"]

        if action in ("opened", "synchronize"):
            # Preview 환경 생성/업데이트
            background_tasks.add_task(
                create_preview_environment,
                tenant_id=tenant_id,
                project_name=repo_name,
                pr_number=pr_number,
                branch=payload["pull_request"]["head"]["ref"],
                commit_sha=payload["pull_request"]["head"]["sha"],
            )

        elif action == "closed":
            # Preview 환경 삭제
            background_tasks.add_task(
                delete_preview_environment,
                tenant_id=tenant_id,
                project_name=repo_name,
                pr_number=pr_number,
            )

async def create_preview_environment(
    tenant_id: str, project_name: str, pr_number: int, branch: str, commit_sha: str
) -> None:
    """
    Preview namespace: {project_name}-pr-{pr_number}
    Preview URL:       pr-{pr_number}-{project_name}.{DOMAIN_SUFFIX}
    
    1. Namespace 생성 (TTL 라벨: 7일 후 자동 삭제 CronJob)
    2. 동일한 Helm Chart 배포, image.tag = commit_sha
    3. VirtualService에 Preview URL 등록
    4. ArgoCD Application 생성 (oneshot: PR 닫힘 시 삭제)
    5. GitHub PR에 댓글: "🚀 Preview: https://pr-42-my-api.swsol..."
    """

async def delete_preview_environment(tenant_id, project_name, pr_number) -> None:
    """Namespace 삭제 → 포함된 모든 리소스(Pod, Service, VS 등) 자동 정리"""
    namespace = f"{project_name}-pr-{pr_number}"
    k8s_client.delete_namespace(namespace)
    # ArgoCD Application 삭제 (cascade)
    argocd_client.delete_app(f"{project_name}-pr-{pr_number}")
```

---

## 13. Buildpack 자동감지 (Dockerfile 불필요)

```python
# backend/services/buildpack_service.py

BUILDPACK_DETECTORS = {
    "java-spring": lambda files: "pom.xml" in files or "build.gradle" in files,
    "nodejs":      lambda files: "package.json" in files and "pom.xml" not in files,
    "python":      lambda files: "requirements.txt" in files or "pyproject.toml" in files,
    "go":          lambda files: "go.mod" in files,
}

async def detect_stack(repo_url: str, github_token: str) -> str:
    """
    GitHub 레포 루트 파일 목록을 조회하여 스택 자동 감지
    Dockerfile이 있으면 "custom" 반환 (그대로 사용)
    없으면 BUILDPACK_DETECTORS로 감지
    """
    files = await get_repo_root_files(repo_url, github_token)

    if "Dockerfile" in files:
        return "custom"

    for stack, detector in BUILDPACK_DETECTORS.items():
        if detector(files):
            return stack

    return "unknown"   # Wizard에서 수동 선택 요구

# CI 파이프라인 (스택별 GitHub Actions 템플릿)
PIPELINE_TEMPLATES = {
    "java-spring": """
name: Build & Push
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Build with Gradle
        run: ./gradlew bootJar -x test
      - name: Build & Push Docker image
        run: |
          docker build -t {harbor}/{tenant}/{service}:$GITHUB_SHA .
          docker push {harbor}/{tenant}/{service}:$GITHUB_SHA
      - name: Update GitOps values
        if: github.ref == 'refs/heads/main'
        run: |
          # gitops-manifests 레포의 image.tag 업데이트
          # ArgoCD가 감지 후 자동 배포
""",
}
```
