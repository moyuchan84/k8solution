# 📋 K8s GitOps Self-Service Platform — 작업 체크리스트

**마지막 업데이트**: 2026-06-22  
**전체 진행도**: Phase 1-2 완료, Phase 3 60%, Phase 4-7 0%

---

## Phase 3 — 프론트엔드 (계속) [60% → 100%]

### 3.1 Wizard Step 완성 [80% → 100%]

#### Step 2: 리소스 사이즈 선택
- [ ] LLM 추천 기능 연동
  - [ ] `useWizardStore.fetchLlmSuggestion()` 구현
  - [ ] `apiClient.llm.suggestSize()` 호출
  - [ ] "AI 추천" 버튼 UI
  - [ ] 로딩/에러 상태 처리
- [ ] 리소스 사이즈 커스텀 설정 (CPU/Memory 슬라이더)
- [ ] 테스트: Step 2 전체 로직

#### Step 3: 외부 연결 & NetworkPolicy
- [ ] 외부 DB 연결 설정 폼
  - [ ] PostgreSQL/MySQL/Redis 선택
  - [ ] Host, Port, User, Password 입력
  - [ ] "Test Connection" 버튼
  - [ ] `apiClient.network.testConnection()` 연동
- [ ] NetworkPolicy 미리보기
  - [ ] Ingress 규칙 시각화
  - [ ] Egress 규칙 시각화
  - [ ] YAML 코드 표시
- [ ] 테스트: Step 3 전체 로직

#### Step 4: Manifest Preview
- [ ] `useWizardStore.fetchManifestPreview()` 구현
  - [ ] `apiClient.projects.manifestPreview()` 호출
- [ ] 생성될 K8s 매니페스트 표시
  - [ ] Namespace, Deployment, Service, HPA YAML
  - [ ] NetworkPolicy YAML
  - [ ] ArgoCD Application YAML
- [ ] Syntax highlighting (react-syntax-highlighter)
- [ ] "전체 확인" 탭 UI
- [ ] Copy YAML 버튼
- [ ] 테스트: Step 4 전체 로직

#### Provisioning Progress
- [ ] SSE 연결 (`apiClient.tasks.stream()`)
- [ ] 실시간 진행 상황 표시
  - [ ] Step별 진행률
  - [ ] 현재 실행 중인 Step 표시
  - [ ] 완료 Step 체크마크
  - [ ] 실패 시 에러 메시지
- [ ] ArgoCD 링크 제공
- [ ] 완료 후 프로젝트 상세 페이지로 이동
- [ ] 테스트: SSE 연결 안정성

### 3.2 프로젝트 목록 페이지 (`/projects`)

- [ ] API에서 실제 프로젝트 목록 조회
  - [ ] `apiClient.projects.list()` 연동
  - [ ] 테넌트별 필터링
- [ ] 프로젝트 카드/테이블 표시
  - [ ] 이름, 상태, 리소스 사용량
  - [ ] 배포 환경 배지
- [ ] 검색 & 정렬 기능
- [ ] 페이지네이션
- [ ] 테스트

### 3.3 프로젝트 상세 페이지 (`/projects/[name]`)

#### 기본 정보 & 상태
- [ ] 프로젝트 기본 정보 조회
  - [ ] `apiClient.projects.get()` 연동
- [ ] ArgoCD 상태 실시간 조회
  - [ ] Sync status (Synced/OutOfSync)
  - [ ] Health status (Healthy/Degraded/Unknown)
  - [ ] Last sync 시간
  - [ ] Manual sync 버튼
- [ ] 서비스 토폴로지 표시
  - [ ] Deployment → Service → Pod 관계도
  - [ ] D3.js 또는 Mermaid 다이어그램

#### 파드 모니터링 (`/projects/[name]`)
- [ ] 실시간 파드 목록
  - [ ] `apiClient.projects.get()` 주기적 호출
  - [ ] 파드 상태 (Running/Pending/Failed)
  - [ ] CPU/Memory 사용량
- [ ] 파드 로그 뷰어
  - [ ] 선택한 파드의 실시간 로그
  - [ ] SSE 또는 WebSocket

#### 배포 히스토리 (`/projects/[name]/logs`)
- [ ] ArgoCD Revision 목록
  - [ ] 각 배포의 타임스탬프, 커밋 해시
  - [ ] 이전 버전으로 롤백 버튼
- [ ] 변경 사항 (Diff)
  - [ ] 이전 배포 vs 현재 배포 비교

### 3.4 NetworkPolicy 편집기 (`/projects/[name]/network`)

- [ ] 현재 NetworkPolicy 규칙 조회
  - [ ] `apiClient.network.getRules()` 연동
- [ ] Ingress 규칙 추가/편집/삭제
  - [ ] 소스 Namespace/Pod 선택
  - [ ] 포트 & 프로토콜 선택
  - [ ] "Preview" 버튼으로 YAML 확인
- [ ] Egress 규칙 추가/편집/삭제
  - [ ] 대상 Namespace/DNS/CIDR 선택
  - [ ] 포트 & 프로토콜 선택
  - [ ] DNS 와일드카드 지원
- [ ] 규칙 저장 (`apiClient.network.applyRule()`)
- [ ] 규칙 삭제 (`apiClient.network.deleteRule()`)
- [ ] 테스트 연결
  - [ ] `apiClient.network.testConnection()` 호출
  - [ ] 성공/실패 표시
- [ ] 시각화
  - [ ] 트래픽 흐름 다이어그램
  - [ ] 허용/거부 표식

### 3.5 RBAC 매트릭스 (`/projects/[name]/rbac`)

- [ ] RBAC 매트릭스 조회
  - [ ] `apiClient.rbac.getMatrix()` 연동
- [ ] 사용자/그룹 행, 권한(get/create/update/delete/watch) 열
  - [ ] 체크박스로 권한 선택
  - [ ] 여러 리소스(Deployment, Service, ConfigMap 등) 탭
- [ ] 저장 버튼
  - [ ] `apiClient.rbac.updateMatrix()` 호출
- [ ] 권한 미리보기
  - [ ] 생성될 Role/RoleBinding YAML
- [ ] 테스트

### 3.6 시크릿 & 환경변수 (`/projects/[name]/secrets`)

- [ ] 환경변수 목록 조회
  - [ ] `apiClient.secrets.list()` 연동
- [ ] 환경변수 추가/편집/삭제
  - [ ] 일반 환경변수 vs 시크릿 토글
  - [ ] Key/Value 입력
  - [ ] `apiClient.secrets.set()`, `delete()` 연동
- [ ] ConfigMap/Secret 선택
  - [ ] 어느 리소스에 저장할지 선택
- [ ] 일괄 업로드 (YAML/ENV 파일)
- [ ] 테스트

### 3.7 CRD & 리소스 관리 (`/projects/[name]/resources`)

- [ ] 현재 리소스 목록
  - [ ] Deployment, Service, HPA, PVC, ExternalSecret 등
  - [ ] 각 리소스의 상태
- [ ] Raw YAML 편집
  - [ ] YAML 입력 폼
  - [ ] Syntax highlighting
  - [ ] 저장 & 적용 (`apiClient.resources.applyYaml()`)
- [ ] HPA 편집
  - [ ] Min/Max Replicas
  - [ ] CPU/Memory 타겟
- [ ] ExternalSecret 관리
  - [ ] 외부 Secret Store 선택
  - [ ] 동기화 주기 설정
- [ ] 테스트

### 3.8 Template Gallery (`/templates`)

- [ ] 검증된 스택 템플릿 목록
  - [ ] Spring Boot, Node.js, Python FastAPI, Go 등
  - [ ] 각 템플릿의 기본 정보
- [ ] 템플릿 선택 → Wizard Step 1로 이동
  - [ ] 템플릿 프리셋 값 자동 채우기
- [ ] 각 템플릿의 구조 설명
  - [ ] README, GitHub 레포 링크, 문서 링크
- [ ] 테스트

### 3.9 관리자 페이지 (`/admin`)

#### 테넌트 관리 (`/admin/tenants`)
- [ ] 전체 테넌트 목록
  - [ ] 테넌트 이름, 네임스페이스, 관리자 목록
  - [ ] 리소스 할당량 (CPU, Memory, Pods)
- [ ] 테넌트 추가/편집/삭제
  - [ ] 폼: 이름, 관리자(LDAP), ResourceQuota
  - [ ] 저장 (`apiClient.tenants.create()`)
- [ ] 테넌트별 리소스 사용량 대시보드
- [ ] 테스트

#### Kyverno 정책 관리 (`/admin/policies`)
- [ ] 현재 정책 목록
  - [ ] Require Labels, Restrict Registry, Default NetworkPolicy 등
- [ ] 정책 편집/적용
  - [ ] YAML 입력
  - [ ] 선택 제외 (Namespace 지정)
- [ ] 정책 위반 현황
- [ ] 테스트

#### 감사 로그 (`/admin/audit-logs`)
- [ ] 사용자 작업 로그
  - [ ] 대상, 작업, 시간, 사용자
- [ ] 필터링 & 검색
- [ ] 테스트

### 3.10 공통 UI/UX

- [ ] 로딩 상태 (Skeleton, Spinner)
- [ ] 에러 알림 (Toast)
- [ ] 삭제 확인 모달
- [ ] 페이지 전환 애니메이션
- [ ] 반응형 디자인 검증
- [ ] 다크 모드 (옵션)

---

## Phase 4 — 인증 & 보안 [0% → 100%]

### 4.1 NextAuth.js 설정

- [ ] NextAuth 초기화
  - [ ] `app/api/auth/[...nextauth]/route.ts` 구현
- [ ] OIDC/LDAP 프로바이더 연결
  - [ ] 사내 LDAP 서버 정보 (사내 환경변수)
  - [ ] 또는 OAuth 프로바이더 설정
- [ ] 사용자 정보 저장
  - [ ] 세션 데이터 구조 정의
  - [ ] DB 저장 (옵션)
- [ ] 테스트: 로그인 흐름

### 4.2 JWT & RBAC 미들웨어

- [ ] `backend/middleware/auth.py` 구현
  - [ ] JWT 검증
  - [ ] 사용자 정보 추출
  - [ ] 역할 확인 (Role-based access control)
- [ ] 4가지 역할 정의 및 API 보호
  - [ ] `platform-admin`: 모든 권한
  - [ ] `tenant-admin`: 해당 테넌트만
  - [ ] `developer`: 자신의 서비스만
  - [ ] `read-only`: 조회만
- [ ] 각 엔드포인트에 역할 제한 추가
- [ ] 테스트: 권한별 API 접근 제어

### 4.3 프론트엔드 로그인/로그아웃

- [ ] 로그인 페이지 (`/login`)
  - [ ] LDAP/OAuth 버튼
  - [ ] 로그인 후 대시보드로 리다이렉트
- [ ] TopBar에 사용자 정보 표시
  - [ ] 아바타, 이름
  - [ ] 로그아웃 버튼
- [ ] 보호된 라우트
  - [ ] 미인증 사용자는 `/login`으로 리다이렉트
- [ ] 테스트: 인증 흐름

### 4.4 시크릿 & 자격증명 관리

- [ ] 민감한 정보 환경변수화
  - [ ] GitHub Token, Harbor Password, ArgoCD Token 모두 env 처리
- [ ] K8s Secret으로 자동 주입
- [ ] `.env` 파일 `.gitignore` 확인
- [ ] 테스트

---

## Phase 5 — ARC 연동 (GitHub Actions Runner) [0% → 100%]

### 5.1 ARC 초기 설정 UI (`/admin/arc`)

- [ ] ARC 설정 페이지
  - [ ] GitHub App 생성 가이드 (링크)
  - [ ] App ID, Installation ID, Private Key 입력 폼
  - [ ] "검증" 버튼
- [ ] `apiClient.admin.arc.verifySetup()` 구현
  - [ ] 백엔드에서 GitHub App 검증
- [ ] 저장 & 활성화 토글
- [ ] 테스트: 설정 흐름

### 5.2 테넌트 생성 시 RunnerSet 자동 프로비저닝

- [ ] `backend/orchestrator/steps/arc_step.py` 구현
  - [ ] ARC Controller API 호출
  - [ ] RunnerSet 매니페스트 생성
  - [ ] `arc-runners-{tenant}` 네임스페이스 생성
  - [ ] NetworkPolicy 적용
- [ ] ProjectState에 arc_setup_status 추가
- [ ] Wizard에서 테넌트 선택 시 자동 trigger
- [ ] 테스트: RunnerSet 생성 확인

### 5.3 GitHub Workflow 자동 생성

- [ ] 서비스 생성 시 `.github/workflows/ci.yml` 자동 Push
  - [ ] 템플릿: GitHub Actions 워크플로우
  - [ ] `runs-on: [self-hosted, arc-runner-{tenant}]` 라벨 포함
  - [ ] Docker build & push to Harbor
  - [ ] ArgoCD App update (Git tag)
  - [ ] 알림 (Slack/이메일)
- [ ] GitHub Secrets 자동 주입
  - [ ] HARBOR_USERNAME, HARBOR_PASSWORD
  - [ ] GITOPS_PAT (GitOps 레포 접근)
  - [ ] PLATFORM_TOKEN (내부 API)
- [ ] 테스트: 워크플로우 실행 확인

### 5.4 ARC 모니터링 (`/admin/arc/runners`)

- [ ] Runner 목록 조회
  - [ ] 테넌트별 Runner 상태
  - [ ] 현재 작업 상황
  - [ ] CPU/Memory 사용량
- [ ] Runner 추가/삭제
- [ ] 로그 확인
- [ ] 테스트

---

## Phase 6 — 자동화 고도화 & 모니터링 [0% → 100%]

### 6.1 GitHub Webhook 연동

- [ ] GitHub Webhook 수신
  - [ ] `POST /api/v1/webhooks/github` 엔드포인트
  - [ ] Push/PullRequest 이벤트 처리
- [ ] Branch Preview 환경 자동 생성
  - [ ] PR 생성 시 `preview-{pr-number}` 네임스페이스 생성
  - [ ] 배포 URL 생성 & PR에 댓글 추가
  - [ ] 네임스페이스 자동 정리 조건 설정 (PR 닫힐 때)
- [ ] 테스트: Webhook 이벤트 처리

### 6.2 Buildpack 자동감지

- [ ] 레포의 언어/프레임워크 자동 감지
  - [ ] `go.mod`, `pom.xml`, `package.json` 등 확인
  - [ ] Buildpacks 또는 Dockerfile 생성
- [ ] 지원되는 스택 확장
- [ ] 테스트: 여러 레포 타입에서 감지 확인

### 6.3 ArgoCD Webhook & SSE

- [ ] ArgoCD Webhook 수신
  - [ ] Application sync 이벤트 감지
  - [ ] 프론트엔드로 실시간 알림 (SSE)
- [ ] 프론트엔드 SSE 연결
  - [ ] 배포 상태 실시간 업데이트
  - [ ] 자동 새로고침 제거 → SSE로 전환
- [ ] 테스트: 배포 후 실시간 상태 업데이트

### 6.4 Prometheus 메트릭 수집

- [ ] `GET /metrics` 엔드포인트 구현
  - [ ] FastAPI prometheus-client
  - [ ] 주요 메트릭: 프로비저닝 성공/실패율, 소요 시간
- [ ] K8s 리소스 사용량 조회
  - [ ] `metrics.k8s.io` API (metrics-server)
  - [ ] 파드별, 테넌트별 CPU/Memory 집계
- [ ] Prometheus 크래핑 설정
- [ ] 테스트: 메트릭 수집 확인

### 6.5 서비스 토폴로지 맵

- [ ] 프로젝트별 서비스 관계도
  - [ ] Deployment → Service → Pod 연결
  - [ ] NetworkPolicy로 인한 트래픽 흐름 표시
- [ ] D3.js 또는 Mermaid로 시각화
- [ ] 테넌트별 전체 토폴로지 맵
- [ ] 테스트: 다양한 구성에서 토폴로지 표시

### 6.6 실시간 로그 스트리밍

- [ ] WebSocket 또는 SSE로 파드 로그 스트림
  - [ ] 선택한 파드의 실시간 로그
  - [ ] 로그 필터링 (레벨, 키워드)
  - [ ] 로그 다운로드
- [ ] 테스트: 장시간 스트림 안정성

---

## Phase 7 — K8s 개념 학습 가이드[0% → 100%]

### 7.1 학습 페이지 (`/learn`)

- [ ] 개념 카드 목록
  - [ ] Pod, Deployment, Service, PVC/PV
  - [ ] NetworkPolicy, RBAC, HPA
  - [ ] ConfigMap/Secret, ExternalSecret, CRD, Namespace
  - [ ] 총 11개 개념
- [ ] 각 개념별 상세 페이지
- [ ] SVG 다이어그램 + 애니메이션
- [ ] 테스트

### 7.2 개념별 상세 페이지

- [ ] 각 개념의 정의 & 역할
- [ ] 실제 예시 YAML
- [ ] 시뮬레이션 (애니메이션)
  - [ ] 예: Rolling Update 과정
  - [ ] 예: NetworkPolicy 트래픽 흐름
  - [ ] 예: HPA 스케일링
- [ ] 테스트

### 7.3 ContextHint 컴포넌트

- [ ] UI 곳곳에 `[?]` 버튼 추가
  - [ ] Wizard Step에서 필드별 설명
  - [ ] 대시보드 메트릭 설명
  - [ ] 프로젝트 상세 페이지 리소스 설명
- [ ] 클릭 시 슬라이드오버 패널 열기
  - [ ] 개념 설명 + 다이어그램
  - [ ] 링크: `/learn/{개념}` 페이지로 이동
- [ ] 테스트: 모든 ContextHint 동작 확인

### 7.4 "내 서비스에서 보기" 연동

- [ ] 개념 페이지에서 학습 시
  - [ ] "내 서비스에서 보기" 버튼
  - [ ] 현재 사용자의 프로젝트 선택
  - [ ] 해당 프로젝트의 실제 YAML 표시
  - [ ] 학습 + 실습 동시 진행
- [ ] 테스트: 리소스 YAML 실시간 동기화

---

## 🏁 테스트 & 배포

### 백엔드 테스트
- [ ] 단위 테스트 (pytest) — 80% 커버리지
- [ ] 통합 테스트 — 주요 API 엔드포인트
- [ ] E2E 테스트 — 전체 워크플로우
- [ ] 부하 테스트 (k6) — 동시 프로비저닝

### 프론트엔드 테스트
- [ ] 컴포넌트 테스트 (Vitest)
- [ ] E2E 테스트 (Playwright 또는 Cypress)
- [ ] 성능 테스트 (Lighthouse)

### 배포 준비
- [ ] Docker 이미지 빌드 & 테스트
- [ ] Helm Chart 검증
- [ ] K8s 매니페스트 dry-run
- [ ] 보안 감사 (의존성, 권한)
- [ ] 문서화

---

## 🔗 외부 리소스

| 항목 | 링크 |
|------|------|
| GitHub Enterprise | https://github.samsungds.net |
| Harbor Registry | https://harbor.foundrymtc.samsungds.net |
| ArgoCD | https://argocd.swsol.samsungds.net |
| 기본 설명서 | docs/PROJECT_SPECIFICATION.md |

---

## 📌 Notes

- 모든 환경변수는 `.env.example`에 명시
- LLM 기능은 `LLM_ENABLED=false`가 기본값
- Rollback은 각 Step이 이전 상태를 기록하므로 역순 정리 가능
- 테스트 DB는 docker-compose.dev.yml에서 관리
