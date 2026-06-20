# DIRECTORY_STRUCTURE.md — 모노레포 폴더 트리 & 구현 순서

## 전체 폴더 트리

```
k8solution/                                  # 모노레포 루트
│
├── CLAUDE.md                                # ← Claude Code 메인 가이드 (필독)
├── docs/                                    # 설계 문서
│   ├── PROJECT_SPECIFICATION.md
│   ├── AGENTS_ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── API_SPEC.md
│   ├── UI_FLOW.md
│   └── DIRECTORY_STRUCTURE.md              # ← 현재 파일
│
├── backend/                                 # FastAPI + LangGraph
│   ├── main.py                              # FastAPI 앱 엔트리포인트
│   ├── config.py                            # 환경변수, 설정 관리
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
│   │
│   ├── api/                                 # 라우터
│   │   ├── __init__.py
│   │   ├── auth.py                          # /auth 엔드포인트
│   │   ├── tenants.py                       # /tenants 엔드포인트
│   │   ├── projects.py                      # /projects 엔드포인트 (핵심)
│   │   ├── tasks.py                         # /tasks 상태 추적 + SSE
│   │   └── admin.py                         # /admin 관리자 API
│   │
│   ├── orchestrator/                        # 순수 async 오케스트레이터
│   │   ├── __init__.py
│   │   ├── state.py                         # ProjectState, TenantState Pydantic 모델
│   │   ├── runner.py                        # 서비스 프로비저닝 워크플로우
│   │   ├── tenant_runner.py                 # 테넌트 프로비저닝 워크플로우 (ARC 포함)
│   │   ├── rollback.py                      # 실패 시 리소스 정리
│   │   └── steps/                           # 각 단계 구현
│   │       ├── __init__.py
│   │       ├── validate.py                  # 입력 검증
│   │       ├── github_step.py               # GitHub 레포 생성 + Secrets 주입
│   │       ├── harbor_step.py               # Harbor 프로젝트 생성
│   │       ├── k8s_step.py                  # K8s NS + RBAC + NetworkPolicy
│   │       ├── arc_step.py                  # ARC RunnerSet + Runner 네임스페이스 ★NEW
│   │       ├── envoy_step.py                # Envoy VirtualService
│   │       └── gitops_step.py               # ArgoCD 매니페스트 Push + Sync
│   │
│   ├── services/                            # 외부 시스템 클라이언트
│   │   ├── __init__.py
│   │   ├── k8s_client.py                    # kubernetes Python 클라이언트 래퍼
│   │   ├── github_client.py                 # GitHub Enterprise API (레포, Secrets, Webhook)
│   │   ├── harbor_client.py                 # Harbor API v2
│   │   ├── argocd_client.py                 # ArgoCD API
│   │   ├── arc_service.py                   # ARC Controller API + RunnerSet 관리 ★NEW
│   │   ├── network_policy_service.py        # NetworkPolicy CRUD + DNS 조회
│   │   ├── rbac_service.py                  # RBAC 매트릭스 → Role/RoleBinding
│   │   ├── manifest_preview_service.py      # YAML diff 생성
│   │   ├── secret_service.py                # K8s Secret + 환경변수 계층 관리
│   │   ├── llm_service.py                   # LLM 선택적 연동
│   │   └── redis_client.py                  # Redis 작업 상태 관리
│   │
│   ├── models/                              # Pydantic 모델
│   │   ├── __init__.py
│   │   ├── project.py                       # Project 관련 모델
│   │   ├── tenant.py                        # Tenant 모델
│   │   └── user.py                          # User, Auth 모델
│   │
│   ├── middleware/
│   │   ├── auth.py                          # JWT 검증, RBAC
│   │   └── audit.py                         # 감사 로그 미들웨어
│   │
│   ├── templates/                           # Jinja2 K8s 매니페스트 템플릿
│   │   ├── namespace.yaml.j2
│   │   ├── resourcequota.yaml.j2
│   │   ├── rbac.yaml.j2
│   │   ├── networkpolicy.yaml.j2
│   │   ├── virtualservice.yaml.j2
│   │   ├── argocd-app.yaml.j2
│   │   └── helm-values.yaml.j2
│   │
│   └── tests/
│       ├── conftest.py                      # pytest fixtures
│       ├── test_api/
│       │   ├── test_projects.py
│       │   └── test_tenants.py
│       ├── test_agents/
│       │   ├── test_validate.py
│       │   ├── test_pipeline_agent.py
│       │   └── test_graph.py
│       └── test_services/
│           ├── test_k8s_client.py
│           └── test_github_client.py
│
├── frontend/                                # Next.js App Router
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── layout.tsx                       # 루트 레이아웃
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                   # 사이드바 레이아웃
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [name]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── logs/page.tsx
│   │   │   │       ├── settings/page.tsx
│   │   │   │       └── connections/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── tenants/page.tsx
│   │   │       └── audit-logs/page.tsx
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── TenantSelector.tsx
│   │   ├── dashboard/
│   │   │   ├── ResourceGauge.tsx
│   │   │   └── ProjectStatusTable.tsx
│   │   ├── wizard/
│   │   │   ├── ServiceWizard.tsx
│   │   │   ├── ProvisioningProgress.tsx
│   │   │   └── steps/
│   │   │       ├── Step1BasicInfo.tsx
│   │   │       ├── Step2Resources.tsx
│   │   │       ├── Step3Connections.tsx
│   │   │       └── Step4Review.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectStatusBadge.tsx
│   │   │   ├── ArgocdStatus.tsx
│   │   │   ├── PodList.tsx
│   │   │   └── DeployHistory.tsx
│   │   ├── logs/
│   │   │   └── LogViewer.tsx
│   │   └── ui/                              # shadcn 래퍼
│   │       ├── StatusDot.tsx
│   │       ├── CopyButton.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── lib/
│   │   ├── api-client.ts                    # 중앙 API 클라이언트
│   │   ├── auth.ts                          # NextAuth 설정
│   │   └── utils.ts                         # 공통 유틸
│   │
│   ├── store/
│   │   ├── useAppStore.ts                   # 전역 상태 (테넌트, 사용자)
│   │   └── useWizardStore.ts                # Wizard 폼 상태
│   │
│   ├── types/
│   │   ├── api.ts                           # API 응답 타입
│   │   ├── project.ts
│   │   └── tenant.ts
│   │
│   └── tests/
│       ├── components/
│       │   └── wizard/
│       │       └── Step1BasicInfo.test.tsx
│       └── lib/
│           └── api-client.test.ts
│
├── gitops/                                  # GitOps 매니페스트 레포 구조
│   ├── platform/                            # 플랫폼 자체 배포
│   │   ├── backend/
│   │   │   └── values.yaml
│   │   ├── frontend/
│   │   │   └── values.yaml
│   │   └── argocd-apps.yaml
│   │
│   ├── helm/
│   │   └── base-service/                    # 개발팀 서비스용 공통 Helm Chart
│   │       ├── Chart.yaml
│   │       ├── values.yaml                  # 기본값
│   │       └── templates/
│   │           ├── deployment.yaml
│   │           ├── service.yaml
│   │           ├── hpa.yaml
│   │           ├── networkpolicy.yaml
│   │           ├── serviceaccount.yaml
│   │           ├── virtualservice.yaml
│   │           └── externalsecret.yaml
│   │
│   └── tenants/                             # 테넌트별 매니페스트 (자동 생성)
│       └── {tenant-id}/
│           └── {project-name}/
│               ├── values.yaml
│               └── argocd-app.yaml
│
├── k8s/                                     # 플랫폼 인프라 K8s 리소스
│   ├── namespace.yaml
│   ├── argocd-applicationset.yaml           # 테넌트 자동 스캔
│   ├── kyverno-policies/
│   │   ├── require-labels.yaml
│   │   ├── restrict-registry.yaml           # Harbor만 허용
│   │   └── default-networkpolicy.yaml
│   └── rbac/
│       ├── platform-admin-role.yaml
│       └── platform-admin-binding.yaml
│
├── .github/
│   └── workflows/
│       └── platform-ci.yml
│
├── docker-compose.dev.yml                   # 로컬 개발 환경
├── .env.example                             # 환경변수 샘플
└── Makefile                                 # 공통 명령어
```

---

## 구현 우선순위 (Claude Code 작업 순서)

### Sprint 1 — 백엔드 기반 (Week 1-2)

```
1.  backend/config.py                        ← 환경변수 Pydantic Settings
2.  backend/services/k8s_client.py           ← K8s API 래퍼 (핵심)
3.  backend/services/github_client.py        ← GitHub Enterprise
4.  backend/services/harbor_client.py        ← Harbor API
5.  backend/services/argocd_client.py        ← ArgoCD API
6.  backend/orchestrator/state.py            ← ProjectState 정의
7.  backend/orchestrator/steps/validate.py   ← 검증 단계
8.  backend/orchestrator/steps/k8s_step.py   ← NS+RBAC+NetworkPolicy
9.  backend/orchestrator/steps/github_step.py ← GitHub+Harbor
10. backend/orchestrator/runner.py           ← 워크플로우 실행기
11. backend/orchestrator/rollback.py         ← 롤백 처리
12. backend/api/projects.py                  ← POST /projects
13. backend/api/tasks.py                     ← 상태 추적 + SSE
```

### Sprint 2 — 나머지 Step + LLM + 프론트 기반 (Week 3-4)

```
14. backend/orchestrator/steps/envoy_step.py  ← Envoy VirtualService
15. backend/orchestrator/steps/gitops_step.py ← ArgoCD 매니페스트
16. backend/services/llm_service.py           ← LLM 선택적 연동
17. backend/middleware/auth.py                ← JWT + RBAC
16. frontend/ Next.js 초기화
17. frontend/lib/api-client.ts
18. frontend/components/layout/Sidebar.tsx
19. frontend/app/(dashboard)/dashboard/page.tsx
20. frontend/components/wizard/ (4단계 Wizard)
```

### Sprint 3 — 통합 + 관리자 + 모니터링 (Week 5-6)

```
21. frontend/app/(dashboard)/projects/[name]/page.tsx
22. frontend/components/logs/LogViewer.tsx (SSE)
23. frontend/app/(dashboard)/admin/ 관리자 페이지
24. gitops/helm/base-service/ Helm Chart
25. k8s/kyverno-policies/ 정책
26. k8s/argocd-applicationset.yaml
27. 통합 테스트
28. docker-compose.dev.yml
```

---

## Makefile 주요 명령어

```makefile
# 로컬 개발 시작
dev:
	docker compose -f docker-compose.dev.yml up

# 백엔드 테스트
test-backend:
	cd backend && pytest --cov=. -v

# 프론트엔드 빌드
build-frontend:
	cd frontend && npm run build

# Helm Chart 검증
lint-helm:
	helm lint gitops/helm/base-service/
	helm unittest gitops/helm/base-service/

# 전체 테스트
test-all: test-backend
	cd frontend && npm test
	make lint-helm
```
