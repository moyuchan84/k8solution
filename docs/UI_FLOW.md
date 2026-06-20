# UI_FLOW.md — Next.js 페이지 & 컴포넌트 설계

---

## 1. 라우트 구조

```
app/
├── (auth)/
│   └── login/page.tsx                      # SSO 로그인
│
└── (dashboard)/
    ├── layout.tsx                           # Sidebar + TopBar
    │
    ├── dashboard/page.tsx                   # 리소스 현황 대시보드
    │
    ├── templates/page.tsx                   # Template Gallery ★NEW
    │
    ├── projects/
    │   ├── page.tsx                         # 서비스 목록 + 토폴로지 맵
    │   ├── new/page.tsx                     # 서비스 생성 Wizard
    │   └── [name]/
    │       ├── page.tsx                     # 개요 (ArgoCD 상태, 파드)
    │       ├── deployments/page.tsx         # 배포 이력 + 롤백
    │       ├── logs/page.tsx                # 실시간 로그
    │       ├── network/page.tsx             # Network Policy 편집기 ★NEW
    │       ├── rbac/page.tsx                # RBAC 매트릭스 ★NEW
    │       ├── resources/page.tsx           # CRD & 고급 리소스 ★NEW
    │       ├── secrets/page.tsx             # Secret & 환경변수 관리 ★NEW
    │       └── settings/page.tsx            # 서비스 설정 (사이즈, 포트 등)
    │
    └── admin/
        ├── page.tsx                         # 관리자 대시보드
        ├── tenants/
        │   ├── page.tsx
        │   └── [id]/page.tsx
        ├── policies/page.tsx                # Kyverno 정책 관리 ★NEW
        └── audit-logs/page.tsx
```

---

## 2. 핵심 페이지 상세

### 2.1 Template Gallery (`/templates`)

```
┌─────────────────────────────────────────────────────────────┐
│  Template Gallery            [검색...        ] [필터 ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ ☕ Spring Boot│  │ 🟢 Node.js   │  │ 🐍 Python    │  │
│  │  + PostgreSQL │  │  + Redis      │  │  Worker       │  │
│  │               │  │               │  │               │  │
│  │ App(M) + DB   │  │ App(S) +      │  │ App(S) +      │  │
│  │ Secret + NP   │  │ Cache + NP    │  │ CronJob       │  │
│  │               │  │               │  │               │  │
│  │ [사용하기]    │  │ [사용하기]    │  │ [사용하기]    │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │ 🐹 Go         │  │ 🌐 Full-Stack │                      │
│  │ Microservice  │  │ API + Frontend│                      │
│  │               │  │               │                      │
│  │ App(S) +      │  │ 2 Services +  │                      │
│  │ Prometheus    │  │ Ingress Split │                      │
│  │               │  │               │                      │
│  │ [사용하기]    │  │ [사용하기]    │                      │
│  └───────────────┘  └───────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 서비스 Wizard (`/projects/new`)

**Step 1: 기본 정보**
```
서비스 이름 *    [                    ]
                  → {이름}.swsol.samsungds.net

시작 방법 *      ○ Template에서 시작     ← 추천 (Gallery에서 선택)
                 ○ 빈 프로젝트로 시작
                 ○ 기존 GitHub 레포 연결

기술 스택 *      ○ Java (Spring Boot)    ← Buildpack 자동감지
                 ○ Node.js
                 ○ Python
                 ○ Go
                 ○ 기타 (Dockerfile 직접)

환경 *           ○ dev    ○ staging    ○ prod

담당자 *         [LDAP 검색...        ]

[다음 →]
```

**Step 2: 리소스 설정**
```
리소스 사이즈 *
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │    S     │  │    M     │  │    L     │
  │ 0.1CPU   │  │ 0.5CPU   │  │  1CPU    │
  │ 128MiB   │  │ 512MiB   │  │  1GiB    │
  │ Pod × 1  │  │ Pod × 2  │  │ Pod × 3  │
  └──────────┘  └──────────┘  └──────────┘

               💡 AI 추천: 서비스 설명을 입력하면 적합한 사이즈를 추천해드려요
               [서비스 설명 입력...                           ] [추천 받기]

Port           [8080  ]
Health Check   [/health]    Timeout [5s]

[← 이전]  [다음 →]
```

**Step 3: 외부 연결**
```
  [+ DB 연결 추가]  [+ 외부 API 추가]  [+ 클러스터 내 서비스]

  ┌─────────────────────────────────────────────────────────┐
  │ 🗄️ PostgreSQL                                    [삭제]  │
  │                                                         │
  │ Host      [db.internal.samsungds.net            ]       │
  │ Port      [5432]   Database [user_db            ]       │
  │ 크리덴셜  ○ 직접 입력  ● K8s Secret 참조               │
  │           Secret: [db-credentials   ▼] Key: [username]  │
  │                                                         │
  │ 생성될 NetworkPolicy (미리보기):                         │
  │ ┌─────────────────────────────────────────────────────┐ │
  │ │ egress → 10.1.2.3:5432 허용                        │ │
  │ └─────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘

[← 이전]  [다음 →]
```

**Step 4: Manifest Preview + 배포**
```
  ┌─────────────────────────────────────────────────────────┐
  │ 생성될 리소스 목록                    [YAML 전체 보기]  │
  │                                                         │
  │ ✓ Namespace: my-api-service                             │
  │ ✓ ResourceQuota: 0.5CPU / 512MiB                        │
  │ ✓ ServiceAccount: my-api-service-sa                     │
  │ ✓ Role + RoleBinding: sw-platform-team/developer        │
  │ ✓ NetworkPolicy: default-deny + DNS + allow-db          │
  │ ✓ VirtualService: my-api-service.swsol.samsungds.net   │
  │ ✓ ArgoCD Application: my-api-service (auto-sync)        │
  │ ✓ GitHub Repo: github.samsungds.net/sw-team/my-api      │
  │ ✓ Harbor Project: harbor.../sw-team/my-api              │
  └─────────────────────────────────────────────────────────┘

  예상 소요: ~3분
  [← 이전]  [🚀 배포 요청]
```

---

### 2.3 Network Policy 편집기 (`/projects/[name]/network`) ★핵심

```
┌─────────────────────────────────────────────────────────────────┐
│  my-api-service / 네트워크 정책                [+ 규칙 추가]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Ingress 규칙]  [Egress 규칙]  [토폴로지 맵]                  │
│                                                                 │
│  INGRESS (들어오는 트래픽)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 소스                    포트     상태    액션            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🌐 Envoy Gateway       8080    ● 허용   [편집] [삭제]  │   │
│  │ 📊 Prometheus          9090    ● 허용   [편집] [삭제]  │   │
│  │ 🔧 같은 Namespace      ANY     ● 허용   [편집] [삭제]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  EGRESS (나가는 트래픽)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 대상                    포트     상태    액션            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🌐 kube-dns             53      ● 허용   [편집] [삭제]  │   │
│  │ 🗄️ db.internal (PostgreSQL) 5432 ● 허용  [편집] [삭제]  │   │
│  │ ❌ 그 외 모든 트래픽   -       ✗ 차단   (기본값)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [규칙 추가 모달]                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 방향     ● Ingress  ○ Egress                            │   │
│  │ 대상 타입 ○ 클러스터 내 서비스   ○ 네임스페이스         │   │
│  │           ○ IP/CIDR             ● 도메인(DNS 조회)      │   │
│  │ 도메인   [api.external.samsungds.net              ]     │   │
│  │ 포트     [443 ]   프로토콜 [TCP ▼]                      │   │
│  │                                                         │   │
│  │ 생성될 YAML:                                            │   │
│  │ egress:                                                 │   │
│  │ - to:                                                   │   │
│  │   - ipBlock:                                            │   │
│  │       cidr: 10.2.3.4/32   # api.external...            │   │
│  │   ports:                                                │   │
│  │   - port: 443                                           │   │
│  │                            [취소]  [적용]               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**토폴로지 맵 탭** (서비스 간 연결 시각화):
```
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │   [Envoy GW] ──→ [my-api-service] ──→ [user-db]  │
  │                         │                          │
  │                         └──→ [cache-service]       │
  │                                                    │
  │   [Prometheus] ──→ [my-api-service:9090]           │
  │                                                    │
  │   점선: 차단됨   실선: 허용됨                       │
  └────────────────────────────────────────────────────┘
```

---

### 2.4 RBAC 매트릭스 (`/projects/[name]/rbac`) ★핵심

```
┌──────────────────────────────────────────────────────────────────────┐
│  my-api-service / 권한 관리                    [+ 사용자/그룹 추가]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [역할 템플릿 적용 ▼]  developer / reviewer / deployer / read-only  │
│                                                                      │
│  Namespace: my-api-service                                           │
│                                                                      │
│  주체                  pods  deploy  secrets  configmap  jobs  logs  │
│  ──────────────────────────────────────────────────────────────────  │
│  sw-team(LDAP그룹)     R     R       -        R          -     R    │
│  ci-bot(SA)            R     RW      -        R          -     -    │
│  홍길동(개인)          RW    RW      R        RW         R     R    │
│  이팀장(tenant-admin)  RW    RW      RW       RW         RW    R    │
│                                                                      │
│  범례: R=읽기  W=쓰기/수정  RW=읽기+쓰기  -=없음                   │
│                                                                      │
│  [변경 저장]  ← 저장 시 Role + RoleBinding 자동 업데이트           │
│                                                                      │
│  ─────────────────────────────────────────────────────────          │
│  ServiceAccount 관리                           [+ SA 생성]          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ ci-bot    생성일: 2026-01-15    [토큰 재발급] [삭제] │           │
│  └──────────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2.5 CRD & 고급 리소스 (`/projects/[name]/resources`) ★핵심

```
┌─────────────────────────────────────────────────────────────────┐
│  my-api-service / 리소스 관리                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Deployments] [HPA] [ExternalSecrets] [Custom CRD] [Raw YAML] │
│                                                                 │
│  ── HPA (오토스케일) ─────────────────────────────────────────  │
│  현재: 2 pods   범위: 1 ~ 5                                     │
│                                                                 │
│  CPU 기준:    [──────●──────────] 70%                           │
│  메모리 기준: [─────────●───────] 80%                           │
│                                  [저장]                         │
│                                                                 │
│  ── ExternalSecret ──────────────────────────────────────────   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 이름: db-credentials                   상태: ✅ Synced  │   │
│  │ 백엔드: Vault  경로: secret/sw-team/db                   │   │
│  │ 갱신: 1h       마지막 Sync: 3분 전                        │   │
│  │                              [편집] [수동 갱신] [삭제]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [+ ExternalSecret 추가]                                        │
│                                                                 │
│  ── Raw YAML 편집기 (고급) ───────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Monaco Editor — K8s Schema 자동완성 지원]              │   │
│  │                                                         │   │
│  │ apiVersion: apps/v1                                     │   │
│  │ kind: Deployment                                        │   │
│  │ ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [검증]  [Diff 보기]  [적용]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Secret & 환경변수 (`/projects/[name]/secrets`)

```
┌─────────────────────────────────────────────────────────────────┐
│  my-api-service / Secret & 환경변수            [+ 추가]         │
├─────────────────────────────────────────────────────────────────┤
│  [환경변수]  [K8s Secrets]  [계층 오버라이드]                   │
│                                                                 │
│  환경변수 (환경: prod)                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 키                  값                   출처    액션    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ SPRING_PROFILE      prod                 직접   [편집]  │  │
│  │ LOG_LEVEL           INFO                 직접   [편집]  │  │
│  │ DB_HOST             ••••••••             Secret [편집]  │  │
│  │ DB_PASSWORD         ••••••••             Secret [편집]  │  │
│  │ TENANT_ID           sw-platform-team     상속   (읽기)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  계층 오버라이드 (상속 우선순위)                                │
│  Global 기본값 → sw-platform-team 기본값 → my-api-service 값   │
│                                                                 │
│  ⚠️ 변경 시 Pod 자동 재시작   ○ 예   ● 아니오 (수동 재시작)   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.7 배포 이력 + 롤백 (`/projects/[name]/deployments`)

```
┌─────────────────────────────────────────────────────────────────┐
│  my-api-service / 배포 이력                                     │
├─────────────────────────────────────────────────────────────────┤
│  태그          브랜치    상태       배포자      시간             │
│  ──────────────────────────────────────────────────────────     │
│  ● v1.2.3     main     ✅ 현재    홍길동      5분 전           │
│  ○ v1.2.2     main     ✅ 성공    홍길동      2일 전    [롤백] │
│  ○ v1.2.1     main     ❌ 실패    홍길동      3일 전    [로그] │
│  ○ pr-42-abc  feature  ✅ Preview 홍길동      4일 전    [삭제] │
│                                                                 │
│  v1.2.2 선택 → [이 버전으로 롤백]                              │
│  롤백 시 생성되는 Diff:                                         │
│  image.tag: v1.2.3 → v1.2.2                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 트리

```
components/
├── layout/
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── TenantSelector.tsx
│
├── wizard/
│   ├── ServiceWizard.tsx
│   ├── ProvisioningProgress.tsx        # SSE 기반 실시간 단계 표시
│   └── steps/
│       ├── Step1BasicInfo.tsx
│       ├── Step2Resources.tsx          # LLM 추천 버튼 포함
│       ├── Step3Connections.tsx        # NetworkPolicy 미리보기 포함
│       └── Step4ManifestPreview.tsx    # YAML diff 뷰어
│
├── network/                            ★NEW
│   ├── NetworkPolicyEditor.tsx         # 규칙 목록 + CRUD
│   ├── PolicyRuleModal.tsx             # 규칙 추가/편집 모달
│   ├── TopologyMap.tsx                 # 서비스 연결 시각화 (D3.js)
│   └── ConnectionTester.tsx           # Pod에서 연결 테스트 실행
│
├── rbac/                               ★NEW
│   ├── RbacMatrix.tsx                  # 체크박스 권한 테이블
│   ├── AddSubjectModal.tsx             # 사용자/그룹/SA 추가
│   └── ServiceAccountList.tsx
│
├── resources/                          ★NEW
│   ├── HpaEditor.tsx                   # CPU/MEM 슬라이더
│   ├── ExternalSecretList.tsx
│   ├── ExternalSecretForm.tsx
│   ├── RawYamlEditor.tsx               # Monaco Editor 래퍼
│   └── ManifestDiffViewer.tsx          # before/after diff
│
├── secrets/                            ★NEW
│   ├── EnvVarTable.tsx
│   ├── SecretValueInput.tsx            # 마스킹 + 직접/참조 토글
│   └── InheritanceTree.tsx             # 계층 오버라이드 시각화
│
├── templates/                          ★NEW
│   ├── TemplateGallery.tsx
│   ├── TemplateCard.tsx
│   └── TemplatePreview.tsx
│
├── deployments/
│   ├── DeployHistory.tsx
│   └── RollbackModal.tsx
│
└── projects/
    ├── ProjectCard.tsx
    ├── ProjectStatusBadge.tsx
    └── ArgocdStatus.tsx
```

---

## 4. 상태 관리 (Zustand)

```typescript
// store/useNetworkPolicyStore.ts  ★NEW
interface NetworkPolicyStore {
  rules: PolicyRule[]
  pendingChanges: PolicyRule[]
  previewYaml: string
  setRules: (rules: PolicyRule[]) => void
  addRule: (rule: PolicyRule) => void
  removeRule: (id: string) => void
  generatePreview: () => Promise<void>   // 백엔드에서 YAML 생성
  applyChanges: () => Promise<void>
}

// store/useRbacStore.ts  ★NEW
interface RbacStore {
  matrix: RbacEntry[]          // {subject, resource, verbs}[]
  dirty: boolean               // 미저장 변경사항 여부
  updatePermission: (subject: string, resource: string, verb: string, allow: boolean) => void
  save: () => Promise<void>    // Role + RoleBinding 업데이트
}

// store/useWizardStore.ts
interface WizardStore {
  currentStep: 1 | 2 | 3 | 4
  formData: WizardFormData
  generatedManifests: string[]  // ★NEW: Step 4에서 표시할 YAML 목록
  llmSuggestion: string         // ★NEW: LLM 리소스 추천 텍스트
  setStep: (step: number) => void
  updateFormData: (data: Partial<WizardFormData>) => void
  fetchManifestPreview: () => Promise<void>   // ★NEW
  reset: () => void
}
```

---

## 5. 새 API 연동 (프론트엔드 관점)

```typescript
// lib/api-client.ts 추가 메서드

network: {
  // 규칙 목록 조회
  getRules: (projectName: string) =>
    apiClient.request(`/projects/${projectName}/network/rules`),

  // 규칙 추가·수정·삭제 후 YAML 미리보기 반환
  previewRule: (projectName: string, rule: PolicyRule) =>
    apiClient.request(`/projects/${projectName}/network/preview`, {
      method: 'POST', body: JSON.stringify(rule)
    }),

  // 규칙 적용 (GitOps 커밋 + ArgoCD Sync)
  applyRule: (projectName: string, rule: PolicyRule) =>
    apiClient.request(`/projects/${projectName}/network/rules`, {
      method: 'POST', body: JSON.stringify(rule)
    }),

  // 연결 테스트 (Pod에서 curl 실행)
  testConnection: (projectName: string, target: string, port: number) =>
    apiClient.request(`/projects/${projectName}/network/test`, {
      method: 'POST', body: JSON.stringify({ target, port })
    }),
},

rbac: {
  getMatrix: (projectName: string) =>
    apiClient.request(`/projects/${projectName}/rbac/matrix`),

  updateMatrix: (projectName: string, entries: RbacEntry[]) =>
    apiClient.request(`/projects/${projectName}/rbac/matrix`, {
      method: 'PUT', body: JSON.stringify({ entries })
    }),
},

resources: {
  // Manifest Preview (변경 전 diff 생성)
  previewChanges: (projectName: string, changes: Record<string, unknown>) =>
    apiClient.request(`/projects/${projectName}/resources/preview`, {
      method: 'POST', body: JSON.stringify(changes)
    }),

  getExternalSecrets: (projectName: string) =>
    apiClient.request(`/projects/${projectName}/resources/external-secrets`),

  applyYaml: (projectName: string, yaml: string) =>
    apiClient.request(`/projects/${projectName}/resources/apply`, {
      method: 'POST', body: JSON.stringify({ yaml })
    }),
},

secrets: {
  list: (projectName: string) =>
    apiClient.request(`/projects/${projectName}/secrets`),

  set: (projectName: string, key: string, value: string, isSecret: boolean) =>
    apiClient.request(`/projects/${projectName}/secrets`, {
      method: 'POST', body: JSON.stringify({ key, value, isSecret })
    }),
},
```
