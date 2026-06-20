# 개발 시작 가이드 — Claude Code CLI

---

## 1단계: 사전 설치 (로컬 PC)

아래를 순서대로 설치하세요. 이미 있으면 버전만 확인하세요.

```bash
# Python 3.12+ 확인
python --version      # 3.12 이상이어야 함

# Node.js 20+ 확인
node --version        # v20 이상이어야 함

# Docker Desktop 실행 중인지 확인
docker ps

# Claude Code CLI 설치
npm install -g @anthropic-ai/claude-code
```

**설치 확인:**
```bash
claude --version
```

---

## 2단계: Claude Code 실행

```bash
# 프로젝트 폴더로 이동
cd D:\code\samsung\k8sol\k8solution

# Claude Code 시작
claude
```

Claude Code는 시작하면서 `CLAUDE.md`를 자동으로 읽습니다.
이미 모든 설계가 문서화되어 있어서 컨텍스트 설정 없이 바로 개발을 시작할 수 있습니다.

---

## 3단계: Phase별 개발 프롬프트

### Phase 1 — 백엔드 뼈대

Claude Code에 아래를 순서대로 입력하세요.

**[1-1] 프로젝트 초기 구조 생성:**
```
docs/DIRECTORY_STRUCTURE.md 를 참고해서 backend/ 폴더 구조를 생성해줘.
빈 __init__.py 파일들과 기본 파일들을 만들어줘.
```

**[1-2] 설정 모듈:**
```
docs/AGENTS_ARCHITECTURE.md 의 "8. 설정 모델" 섹션을 참고해서
backend/config.py 를 구현해줘.
pydantic-settings 기반으로, .env.example 파일도 같이 만들어줘.
```

**[1-3] K8s 클라이언트:**
```
backend/services/k8s_client.py 를 구현해줘.
kubernetes Python 클라이언트를 사용하고,
Namespace 생성, ResourceQuota, NetworkPolicy, RBAC(Role/RoleBinding),
ServiceAccount, Secret 조회/생성/삭제를 async 래퍼로 구현해줘.
K8S_IN_CLUSTER=false 일 때는 kubeconfig 파일을 사용하도록 해줘.
```

**[1-4] GitHub 클라이언트:**
```
backend/services/github_client.py 를 구현해줘.
github.samsungds.net Enterprise 환경에서
레포지토리 생성, 파일 Push, Branch Protection 설정,
Repository Secrets 등록 기능을 httpx 비동기로 구현해줘.
docs/AGENTS_ARCHITECTURE.md 의 STACK_DOCKERFILE_TEMPLATES 내용도 포함해줘.
```

**[1-5] Harbor 클라이언트:**
```
backend/services/harbor_client.py 를 구현해줘.
Harbor API v2 (harbor.foundrymtc.samsungds.net) 기반으로
프로젝트 생성, 사용자 권한 설정, 프로젝트 삭제를 httpx 비동기로 구현해줘.
```

**[1-6] 오케스트레이터 상태 + 스텝들:**
```
docs/AGENTS_ARCHITECTURE.md 를 참고해서 아래 파일들을 구현해줘:
1. backend/orchestrator/state.py (ProjectState Pydantic 모델)
2. backend/orchestrator/steps/validate.py
3. backend/orchestrator/steps/github_step.py
4. backend/orchestrator/steps/harbor_step.py
5. backend/orchestrator/steps/k8s_step.py (Namespace + RBAC + NetworkPolicy)
```

**[1-7] 오케스트레이터 Runner + Rollback:**
```
backend/orchestrator/runner.py 와 backend/orchestrator/rollback.py 를 구현해줘.
docs/AGENTS_ARCHITECTURE.md 의 "4. 오케스트레이터 Runner" 섹션을 그대로 따라줘.
Redis에 상태 저장, BackgroundTask 비동기 실행, 실패 시 rollback 호출.
```

**[1-8] FastAPI 엔드포인트 + SSE:**
```
backend/main.py 와 backend/api/projects.py, backend/api/tasks.py 를 구현해줘.
docs/API_SPEC.md 기준으로:
- POST /api/v1/projects (BackgroundTask로 오케스트레이터 실행)
- GET /api/v1/tasks/{tracking_id} (Redis에서 상태 조회)
- GET /api/v1/tasks/{tracking_id}/stream (SSE 실시간 상태 스트리밍)
CORS는 localhost:3000 허용.
```

**[1-9] docker-compose + 실행 테스트:**
```
docker-compose.dev.yml 을 만들어줘.
backend, redis, postgres 서비스 포함.
backend는 볼륨 마운트로 코드 변경 시 자동 재시작(uvicorn --reload).
그 다음 실제로 실행해서 /health 엔드포인트가 200 응답하는지 확인해줘.
```

---

### Phase 2 — Helm Chart & GitOps 구조

```
gitops/helm/base-service/ Helm Chart를 만들어줘.
다음 템플릿 파일들을 포함해줘:
- deployment.yaml (readinessProbe, livenessProbe, resources 포함)
- service.yaml (ClusterIP)
- hpa.yaml
- networkpolicy.yaml (default-deny + DNS 허용)
- serviceaccount.yaml
- virtualservice.yaml (Istio)
values.yaml에는 CLAUDE.md의 리소스 사이즈 매핑 테이블 기반 기본값.
```

---

### Phase 3 — 프론트엔드

```
frontend/ 폴더에 Next.js 15 App Router 프로젝트를 초기화해줘.
TypeScript strict mode, Tailwind CSS, shadcn/ui 포함.
docs/DIRECTORY_STRUCTURE.md 의 frontend 구조대로 폴더와 빈 파일들을 만들어줘.
```

```
frontend/components/layout/Sidebar.tsx 와 TopBar.tsx 를 구현해줘.
docs/UI_FLOW.md 의 레이아웃 설계를 참고해서.
Zustand store (useAppStore)에서 currentTenant를 읽어서 표시.
```

```
Service Wizard 4단계를 구현해줘.
docs/UI_FLOW.md 의 2.2 섹션 와이어프레임을 그대로 따라줘.
Step4는 Manifest Preview (생성될 리소스 목록 표시).
완료 후 ProvisioningProgress 컴포넌트 (SSE로 실시간 진행 상황).
```

---

### Phase 4 — 네트워크 정책 편집기 + RBAC

```
backend/services/network_policy_service.py 를 구현해줘.
docs/AGENTS_ARCHITECTURE.md 의 "9. NetworkPolicy Service" 섹션 그대로.
도메인 → IP 변환, NetworkPolicy YAML 생성, K8s 적용, 연결 테스트.
```

```
frontend/app/(dashboard)/projects/[name]/network/page.tsx 와
NetworkPolicyEditor 컴포넌트를 구현해줘.
docs/UI_FLOW.md 의 2.3 와이어프레임 참고.
Ingress/Egress 규칙 목록 + 추가 모달 + 실시간 YAML 미리보기.
```

```
RBAC 매트릭스 UI를 구현해줘.
backend/services/rbac_service.py + frontend의 RbacMatrix 컴포넌트.
docs/UI_FLOW.md 의 2.4 와이어프레임 참고.
체크박스 테이블 변경 → Role/RoleBinding 자동 업데이트.
```

---

### Phase 5 — ARC Runner 연동

```
docs/ARC_SETUP.md 를 전부 읽고,
/admin/arc 페이지의 GitHub App 설정 가이드 Wizard를 구현해줘.
6단계 가이드 모달 (3.1~3.4 섹션 와이어프레임 참고).
각 단계별 자동 처리와 수동 입력 구분 명확히.
```

```
backend/orchestrator/steps/arc_step.py 를 구현해줘.
docs/ARC_SETUP.md 의 "4. 테넌트 생성 시 ARC 자동 프로비저닝" 섹션 참고.
arc-runners-{tenant} 네임스페이스 + AutoscalingRunnerSet CRD 생성.
```

---

## 4단계: 유용한 Claude Code 명령어

개발 중 자주 쓸 명령어들:

```bash
# 특정 파일 집중 작업
claude "backend/services/k8s_client.py 의 create_namespace 함수에
       ResourceQuota 생성 로직이 빠져있어. CLAUDE.md 참고해서 추가해줘."

# 에러 디버깅
claude "docker-compose up 했더니 이런 에러가 나. 고쳐줘:
       [에러 메시지 붙여넣기]"

# 테스트 작성
claude "backend/orchestrator/steps/k8s_step.py 의 단위 테스트를
       pytest-asyncio로 작성해줘. K8s API는 mock 처리."

# 타입 체크
claude "frontend/ 에서 TypeScript 에러 전부 고쳐줘."
```

---

## 5단계: 로컬 개발 환경 세팅 체크리스트

```
□ .env 파일 생성 (.env.example 복사 후 값 채우기)
  - 사내 K8s 접근: kubeconfig 설정
  - GitHub Enterprise Token
  - Harbor 계정
  - LLM_ENABLED=false (처음엔 끄고 시작)

□ Docker Desktop 실행

□ docker-compose -f docker-compose.dev.yml up -d
  (backend, redis, postgres 실행)

□ http://localhost:8000/health → {"status": "healthy"} 확인

□ cd frontend && npm run dev
  http://localhost:3000 확인
```

---

## 참고: 실제 K8s 없이 개발하는 법

사내 K8s에 접근이 안 될 때:

```bash
# .env 에 설정
K8S_IN_CLUSTER=false
# K8S_KUBECONFIG 는 비워두면 Mock 모드로 동작

# k8s_client.py 에 Mock 모드 추가를 Claude Code에 요청:
# "K8S_IN_CLUSTER=false 이고 kubeconfig도 없으면
#  K8s API 호출을 mock으로 처리해서 개발할 수 있게 해줘."
```

또는 **Minikube / Kind** 로컬 클러스터 사용:
```bash
# Kind 설치 후
kind create cluster --name gitops-dev
kubectl config use-context kind-gitops-dev
```
