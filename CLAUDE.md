# K8s GitOps Self-Service Platform — Claude Code 가이드

## 프로젝트 한 줄 요약

사내 폐쇄망(VM) K8s + ArgoCD 환경에서, **개발자가 UI만으로** Namespace·RBAC·NetworkPolicy·Deployment·Service·PVC·외부DB 연결을 설정하고 CI/CD까지 완성하는 **GitOps Self-Service 플랫폼**.

---

## 작업 전 필독 — 전체 문서 목록

| 파일 | 내용 |
|------|------|
| `docs/PROJECT_SPECIFICATION.md` | 배경·유즈케이스·UI 흐름 상세 |
| `docs/AGENTS_ARCHITECTURE.md` | Orchestrator & 서브 에이전트 설계 |
| `docs/TECH_STACK.md` | 기술 스택 버전·의존성 |
| `docs/API_SPEC.md` | FastAPI 엔드포인트 전체 명세 |
| `docs/UI_FLOW.md` | Next.js 페이지·컴포넌트 트리 |
| `docs/DIRECTORY_STRUCTURE.md` | 모노레포 폴더 트리 |
| `docs/ARC_SETUP.md` | GitHub ARC Runner 설치·테넌트 자동화 설계 |
| `docs/K8S_CONCEPTS_GUIDE.md` | K8s 개념 학습 가이드 기능 설계 (Phase 7) |

---

## 사내 환경 상수 (변경 금지)

```
GITHUB_BASE_URL=https://github.samsungds.net
HARBOR_REGISTRY=harbor.foundrymtc.samsungds.net
DOMAIN_SUFFIX=swsol.samsungds.net
ARGOCD_SERVER=argocd.swsol.samsungds.net
K8S_GITOPS_REPO=github.samsungds.net/infra-team/gitops-manifests
ARC_NAMESPACE=arc-systems
ARC_RUNNER_NAMESPACE_PREFIX=arc-runners
```

모든 외부 호출은 위 상수를 환경 변수로 참조한다. 하드코딩 금지.

---

## LLM 연동 전략 (아키텍처 결정 사항)

**핵심 워크플로우(GitHub→Harbor→K8s→ArgoCD)는 LLM 없는 순수 async 오케스트레이터로 구현한다.**
LLM은 아래 3개 지점에만 선택적으로 연결한다 (LLM 없이도 시스템 동작).

| 지점 | 기능 | LLM 없을 때 fallback |
|------|------|---------------------|
| Wizard Step 2 | 서비스 설명 → S/M/L 리소스 사이즈 추천 | 사용자 직접 선택 |
| 배포 실패 시 | K8s 에러 메시지 한국어 진단 | 원문 에러 노출 |
| 프로비저닝 완료 | 생성 리소스 자연어 요약 | 기술 URL 목록 노출 |

### LLM 환경별 전환 (환경변수 하나로 전환)

```bash
# 로컬 개발: Ollama (경량 모델)
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2:3b        # 또는 qwen2.5:3b
LLM_API_KEY=ollama            # Ollama는 키 불필요, 더미값

# 사내 배포: 내부 LLM API (OpenAI 호환)
LLM_BASE_URL=https://llm-api.samsungds.net/v1
LLM_MODEL=gpt-oss-12b        # 사내 모델명
LLM_API_KEY=your-internal-api-key
```

`langchain-openai`의 `ChatOpenAI(base_url=..., model=...)`를 사용하면 코드 변경 없이 전환된다.

---

## 구현 순서 (Phase)

### Phase 1 — 백엔드 뼈대 (FastAPI + 순수 async 오케스트레이터)
1. `backend/` FastAPI 앱 초기화 (Uvicorn, CORS, 환경변수 로딩)
2. `backend/orchestrator/runner.py` — 순수 async 단계별 실행기 구현
3. K8s Python 클라이언트(`kubernetes`) 래퍼 서비스 구현
4. GitHub Enterprise REST API 래퍼 구현 (PyGithub or httpx)
5. Harbor API 래퍼 구현 (httpx)
6. 핵심 엔드포인트 구현: `POST /api/v1/projects`, `GET /api/v1/projects/{name}/status`

### Phase 2 — Helm 템플릿 & GitOps 구조
1. `gitops/helm/base-service/` Helm Chart 작성 (Deployment, Service, Ingress, HPA)
2. `gitops/helm/base-service/templates/networkpolicy.yaml` — Kyverno 기본 격리
3. `gitops/helm/base-service/templates/externalsecret.yaml` — 외부 DB 연결 템플릿
4. ArgoCD `ApplicationSet` 매니페스트 작성 (Git 디렉터리 스캔)
5. Envoy `VirtualService` + `Gateway` 자동 생성 템플릿

### Phase 3 — 프론트엔드 (Next.js)
1. `frontend/` Next.js App Router 초기화
2. 레이아웃: Sidebar(테넌트 선택) + TopBar(로그인 사용자)
3. 대시보드 페이지 (`/dashboard`) — 부서 리소스 현황
4. Template Gallery (`/templates`) — 검증된 스택 템플릿 즉시 부트스트랩
5. **Service Wizard** (`/projects/new`) — 4단계 폼
   - Step 1: 기본 정보 (이름, 스택, 담당자) + Template 선택
   - Step 2: 리소스 사이즈 (S/M/L → CPU·Memory 자동 매핑) + LLM 추천
   - Step 3: 외부 연결 + NetworkPolicy 미리보기
   - Step 4: **Manifest Preview** (생성될 전체 YAML 확인) + 배포 요청
6. 프로젝트 상세 페이지 (`/projects/[name]`) — ArgoCD 상태, 파이프라인 로그
7. **Network Policy 편집기** (`/projects/[name]/network`) — 시각적 Ingress/Egress 규칙 관리
8. **RBAC 매트릭스** (`/projects/[name]/rbac`) — 체크박스 권한 테이블
9. **CRD & 리소스 관리** (`/projects/[name]/resources`) — HPA, ExternalSecret, Raw YAML
10. **Secret & 환경변수** (`/projects/[name]/secrets`) — 계층적 환경변수 관리
11. 관리자 페이지 (`/admin`) — 테넌트·Kyverno 정책 관리

### Phase 4 — 인증 & 보안
1. NextAuth.js + OIDC/LDAP SSO 연동
2. 역할(Role): `platform-admin`, `tenant-admin`, `developer`, `read-only`
3. RBAC 미들웨어 (FastAPI Dependency)

### Phase 5 — ARC 연동 (GitHub Actions Self-Hosted Runner)
1. `/admin/arc` 초기 설정 Wizard UI (GitHub App 생성 가이드 + 크리덴셜 입력)
2. `backend/orchestrator/steps/arc_step.py` — 테넌트 생성 시 RunnerSet 자동 프로비저닝
3. GitHub App 검증 API (`POST /admin/arc/setup/verify`)
4. 서비스 생성 시 `.github/workflows/ci.yml` 자동 Push (runs-on 라벨 포함)
5. GitHub Repository Secrets 자동 주입 (Harbor, GitOps PAT, Platform Token)
6. `arc-runners-{tenant}` 네임스페이스 + NetworkPolicy 자동 생성

### Phase 6 — 자동화 고도화
1. GitHub Webhook 수신 → Branch Preview 환경 자동 생성·삭제
2. Buildpack 자동감지 (Dockerfile 없이 스택 감지)
3. ArgoCD Webhook → SSE로 프론트 실시간 상태 전달

### Phase 6 — 모니터링 연동
1. Prometheus metrics 엔드포인트 (`/metrics`)
2. 리소스 사용량 API (K8s metrics-server 연동)
3. 서비스 토폴로지 맵 (D3.js 시각화)

### Phase 7 — K8s 개념 학습 가이드 (후순위)
> 상세 설계: `docs/K8S_CONCEPTS_GUIDE.md` 참조

1. `/learn` 페이지 — 개념 카드 목록 + D3.js 관계 맵
2. 개념별 상세 페이지 (Pod, Deployment, Service, PVC/PV, NetworkPolicy, RBAC, HPA, ConfigMap/Secret, ExternalSecret, CRD, Namespace — 총 11개)
3. `ContextHint` 컴포넌트 — 플랫폼 UI 내 `[?]` 버튼 → 슬라이드오버 설명 패널
4. 개념별 SVG 다이어그램 + 애니메이션 (롤링 업데이트, NetworkPolicy 트래픽 흐름 등)
5. "내 서비스에서 보기" 연동 — 실제 생성된 리소스 YAML을 개념 설명에 바로 표시

---

## 코딩 원칙

### 공통
- **환경 변수 우선**: 모든 설정값은 `.env` / K8s Secret으로 주입. 소스에 하드코딩 없음.
- **타입 안전**: 백엔드 Pydantic v2, 프론트엔드 TypeScript strict mode.
- **에러 처리**: 모든 외부 API 호출은 try/except + 구조화된 에러 응답 반환.
- **비동기**: FastAPI 엔드포인트는 `async def`, K8s·GitHub·Harbor 호출은 모두 비동기.

### 백엔드 (FastAPI)
```python
# 응답 모델 패턴
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    tracking_id: Optional[str] = None
```

### 프론트엔드 (Next.js)
- Server Components 기본, 인터랙션 필요 시만 `"use client"`.
- API 호출: `lib/api-client.ts` 중앙화, 직접 fetch 분산 금지.
- 상태관리: Zustand (전역 슬라이스 단위 분리).

### Helm / K8s 매니페스트
- 모든 리소스에 라벨 필수: `app.kubernetes.io/name`, `app.kubernetes.io/part-of`, `team`, `env`.
- `resources.requests` / `resources.limits` 항상 명시.
- `readinessProbe` / `livenessProbe` 항상 포함.

---

## 리소스 사이즈 매핑 테이블

| 사이즈 | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
|--------|-------------|-----------|----------------|--------------|----------|
| S (small) | 100m | 500m | 128Mi | 512Mi | 1 |
| M (medium) | 500m | 1000m | 512Mi | 1Gi | 2 |
| L (large) | 1000m | 2000m | 1Gi | 2Gi | 3 |

---

## 테넌트 모델

```yaml
# 테넌트 = 부서 단위
Tenant:
  id: string          # 예: "sw-platform-team"
  displayName: string # 예: "SW Platform 팀"
  namespace: string   # K8s namespace (= tenant id)
  admins: [ldap-uid]  # 테넌트 관리자 목록
  resourceQuota:      # 부서 전체 할당량
    cpu: "20"
    memory: "40Gi"
    pods: "50"
  allowedRegistries:  # Harbor 프로젝트 목록
    - harbor.foundrymtc.samsungds.net/sw-platform-team
```

---

## Orchestration 흐름 (순수 async 오케스트레이터)

LangGraph 없음. 단순 Python async 함수 체인으로 구현.

```
[START]
  │
  ▼
[validate_request]          # 입력값 검증, 중복 체크
  │
  ▼                         ※ LLM 선택 지점 ①
[llm_suggest_resources]     # (선택) 서비스 설명 → 리소스 사이즈 추천
  │                         # LLM_ENABLED=false 이면 스킵
  ▼
[create_github_repo]        # GitHub Enterprise에 표준 레포 생성
  │
  ▼
[create_harbor_project]     # Harbor 이미지 레지스트리 프로젝트 생성
  │
  ▼
[provision_k8s_namespace]   # K8s Namespace + ResourceQuota + LimitRange
  │
  ▼
[apply_rbac]                # ServiceAccount, Role, RoleBinding 생성
  │
  ▼
[apply_network_policy]      # Kyverno 기반 격리 정책 적용
  │
  ▼
[configure_envoy_routing]   # VirtualService + Gateway 등록
  │
  ▼
[push_gitops_manifest]      # gitops repo에 ArgoCD Application 매니페스트 Push
  │
  ▼
[sync_argocd]               # ArgoCD App sync 트리거
  │
  ▼                         ※ LLM 선택 지점 ②
[notify_complete]           # 완료 이벤트 발행 (SSE)
  │                         # (선택) LLM이 완료 요약 자연어 생성
  ▼
[END]

실패 시 → rollback() 호출, completed_steps 역순으로 생성된 리소스 정리
         ※ LLM 선택 지점 ③: LLM이 에러 원인 한국어 진단 후 응답에 포함
```

### 오케스트레이터 핵심 패턴

```python
# backend/orchestrator/runner.py

STEPS = [
    validate_request,
    create_github_repo,
    create_harbor_project,
    provision_k8s_namespace,
    apply_rbac,
    apply_network_policy,
    configure_envoy_routing,
    push_gitops_manifest,
    sync_argocd,
    notify_complete,
]

async def run_workflow(state: ProjectState) -> ProjectState:
    for step in STEPS:
        try:
            state = await step(state)
            state.completed_steps.append(step.__name__)
            await redis.set(f"task:{state.tracking_id}", state.model_dump_json())
        except Exception as e:
            state.status = "failed"
            state.error = str(e)
            # LLM 에러 진단 (선택적)
            if settings.LLM_ENABLED:
                state.error_diagnosis = await llm_service.diagnose_error(str(e))
            await rollback(state)
            return state
    return state
```

---

## 주요 K8s 리소스 패턴

### Namespace + ResourceQuota
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.tenantId }}
  labels:
    team: {{ .Values.tenantId }}
    managed-by: gitops-platform
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: {{ .Values.tenantId }}-quota
  namespace: {{ .Values.tenantId }}
spec:
  hard:
    requests.cpu: {{ .Values.quota.cpu }}
    requests.memory: {{ .Values.quota.memory }}
    count/pods: {{ .Values.quota.pods }}
```

### NetworkPolicy (기본 격리)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: {{ .Values.namespace }}
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system     # DNS 허용
    ports:
    - port: 53
```

### Envoy VirtualService
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: {{ .Values.serviceName }}
  namespace: {{ .Values.namespace }}
spec:
  hosts:
  - {{ .Values.serviceName }}.{{ .Values.domainSuffix }}
  gateways:
  - istio-system/global-gateway
  http:
  - route:
    - destination:
        host: {{ .Values.serviceName }}
        port:
          number: {{ .Values.servicePort }}
```

---

## 테스트 전략

| 레이어 | 도구 | 커버리지 목표 |
|--------|------|--------------|
| 백엔드 단위 | pytest + pytest-asyncio | 80% |
| 오케스트레이터 통합 | 각 step 함수 mock + 전체 runner 테스트 | 주요 흐름 100% |
| API E2E | httpx TestClient | 핵심 엔드포인트 100% |
| LLM 연동 | LLM_ENABLED=false 로 off, mock으로 on 테스트 분리 | 3개 지점 100% |
| 프론트엔드 | Vitest + Testing Library | 컴포넌트 70% |
| K8s 매니페스트 | helm unittest, conftest.py | Chart 100% |

---

## 파일 생성 시 금지 사항

- `.env` 파일에 실제 크리덴셜 커밋 금지 → `.env.example`만 커밋
- `kubeconfig` 파일 레포 포함 금지
- Harbor 패스워드 소스코드 내 하드코딩 금지
- `cluster-admin` ClusterRole 직접 바인딩 금지 (최소 권한 원칙)
