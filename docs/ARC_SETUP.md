# ARC_SETUP.md — GitHub Actions Runner Controller 설계

---

## 1. ARC란 무엇인가

ARC(Actions Runner Controller)는 K8s 위에서 GitHub Actions의 **Self-Hosted Runner**를
Pod로 실행·자동 확장하는 컨트롤러입니다.

```
GitHub Enterprise
  └── Organization (테넌트)
        └── Repositories (서비스들)
              └── GitHub Actions Workflow
                    └── runs-on: [self-hosted, sw-platform-team]
                                        ↓ Job 트리거
K8s 클러스터
  ├── arc-systems/ (ARC 컨트롤러 네임스페이스)
  │     └── ARC Controller Pod
  │
  └── arc-runners-sw-platform-team/ (테넌트별 Runner 네임스페이스)
        └── Runner Pod (job 당 1개, 완료 후 삭제 — 에페머럴)
```

**핵심 장점:**
- 빌드마다 깨끗한 Pod 시작 → 환경 오염 없음
- 수요에 따라 0 → N Pod 자동 스케일
- Harbor(사내 레지스트리) 접근이 클러스터 내부라 빠르고 안전

---

## 2. 전체 셋업 흐름 (자동 vs 수동 구분)

```
┌─────────────────────────────────────────────────────────────────┐
│  플랫폼 어드민이 최초 1회 실행 (Platform Bootstrap)             │
└─────────────────────────────────────────────────────────────────┘

 STEP 1  [🤖 자동] ARC Controller 설치
         Helm으로 arc-systems 네임스페이스에 컨트롤러 배포

 STEP 2  [✋ 수동 + 가이드] GitHub Enterprise에 GitHub App 생성
         → UI가 단계별 안내 + 필요한 값 입력 폼 제공

 STEP 3  [🤖 자동] GitHub App 크리덴셜 K8s Secret 저장
         입력된 App ID + Private Key → arc-systems/github-app-secret

 STEP 4  [🤖 자동] 플랫폼 레벨 검증
         GitHub API로 App 권한·설치 여부 확인

┌─────────────────────────────────────────────────────────────────┐
│  테넌트(부서) 생성 시마다 자동 실행 (Per-Tenant)               │
└─────────────────────────────────────────────────────────────────┘

 STEP 5  [🤖 자동] GitHub Org에 App 설치 확인/요청
         (이미 설치됐으면 스킵, 없으면 안내)

 STEP 6  [🤖 자동] arc-runners-{tenant_id} 네임스페이스 생성

 STEP 7  [🤖 자동] AutoscalingRunnerSet CRD 생성
         → Org 레벨 Runner, 라벨: [self-hosted, {tenant_id}]

 STEP 8  [🤖 자동] CI 파이프라인 템플릿에 Runner 라벨 주입
         → 서비스 생성 시 .github/workflows/ci.yml에 자동 반영

┌─────────────────────────────────────────────────────────────────┐
│  서비스 프로비저닝 시 자동 실행 (Per-Service)                  │
└─────────────────────────────────────────────────────────────────┘

 STEP 9  [🤖 자동] GitHub 레포에 CI 워크플로우 파일 Push
         runs-on: [self-hosted, {tenant_id}] 라벨 포함

 STEP 10 [🤖 자동] Harbor ImagePullSecret을 Runner 네임스페이스에 복사
```

---

## 3. STEP 2 상세 — GitHub App 생성 가이드 UI

이 단계가 UX의 핵심입니다. 개발자가 GitHub Enterprise에서 직접 해야 하지만,
**플랫폼이 무엇을 어디서 어떻게 입력해야 하는지 화면에서 안내**합니다.

### 3.1 UI 흐름 (6단계 가이드 모달)

```
┌──────────────────────────────────────────────────────────────────┐
│  GitHub App 설정 가이드          단계 2 / 6            [닫기 ×]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ① GitHub Enterprise에서 앱 생성                                │
│  ② 권한 설정              ← 지금 여기                            │
│  ③ Webhook 설정                                                  │
│  ④ App 설치                                                      │
│  ⑤ 크리덴셜 입력                                                 │
│  ⑥ 검증 및 완료                                                  │
│                                                                  │
│  ────────────────────────────────────────────────────────────    │
│                                                                  │
│  GitHub App에 아래 권한을 설정해주세요:                          │
│                                                                  │
│  Repository permissions:                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Actions          → Read & Write   ✓ 필수               │    │
│  │ Administration   → Read & Write   ✓ 필수 (Runner 등록) │    │
│  │ Checks           → Read & Write   ✓ 필수               │    │
│  │ Contents         → Read           ✓ 필수               │    │
│  │ Metadata         → Read           ✓ 필수               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Organization permissions:                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Self-hosted runners → Read & Write  ✓ 필수             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  💡 위 내용을 복사하려면: [권한 목록 복사]                       │
│                                                                  │
│  설정이 완료되었으면 → [다음 단계 →]                            │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Webhook URL 자동 제공 단계

```
┌──────────────────────────────────────────────────────────────────┐
│  GitHub App 설정 가이드          단계 3 / 6                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Webhook 설정                                                    │
│                                                                  │
│  GitHub App 설정 페이지에서 Webhook을 활성화하고                 │
│  아래 URL을 입력해주세요:                                        │
│                                                                  │
│  Webhook URL:                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ https://gitops-platform.swsol.samsungds.net/webhooks/  │    │
│  │ github                                    [복사 📋]     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Webhook Secret:                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3f8a2c9d...  (자동 생성됨)              [복사 📋]       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Subscribe to events:                                            │
│  ☑ Workflow job    ☑ Workflow run    ☑ Push    ☑ Pull request   │
│                                                                  │
│  [← 이전]  [다음 단계 →]                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 크리덴셜 입력 단계

```
┌──────────────────────────────────────────────────────────────────┐
│  GitHub App 설정 가이드          단계 5 / 6                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  생성된 GitHub App 정보를 입력해주세요                           │
│                                                                  │
│  어디서 찾나요?                                                  │
│  GitHub Enterprise → Settings → Developer settings              │
│  → GitHub Apps → [앱 이름] → General                            │
│                                                                  │
│  App ID *                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 12345                                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  (GitHub App 설정 페이지 상단의 "App ID" 숫자)                  │
│                                                                  │
│  Private Key *                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Private Key 파일 업로드 (.pem)]    또는               │    │
│  │ -----BEGIN RSA PRIVATE KEY-----                         │    │
│  │ MIIEowIBAAKCAQEA...                                     │    │
│  │ -----END RSA PRIVATE KEY-----                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ("Generate a private key" 버튼으로 다운로드한 .pem 파일)       │
│                                                                  │
│  Installation ID *                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 67890                                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  (GitHub Enterprise → Settings → [앱] → Installations의 URL    │
│   .../installations/{이 숫자})                                  │
│                                                                  │
│  [← 이전]  [검증 및 저장 →]                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 자동 검증 단계

```
┌──────────────────────────────────────────────────────────────────┐
│  GitHub App 설정 가이드          단계 6 / 6                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  설정 검증 중...                                                 │
│                                                                  │
│  ✅ App ID 유효성 확인                                           │
│  ✅ Private Key 형식 확인                                        │
│  ✅ GitHub Enterprise API 연결 확인                              │
│  ✅ GitHub App 권한 확인 (Actions: R/W, Self-hosted runners: R/W)│
│  ✅ K8s Secret 저장 완료 (arc-systems/github-app-secret)        │
│  ⏳ ARC Controller 재기동 중...                                  │
│  ✅ ARC Controller 연결 확인                                     │
│                                                                  │
│  ────────────────────────────────────────────────────────        │
│  🎉 GitHub App 설정 완료!                                        │
│                                                                  │
│  이제 테넌트를 생성하면 해당 조직에 Runner가 자동으로            │
│  프로비저닝됩니다.                                               │
│                                                                  │
│                                          [완료]                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 테넌트 생성 시 ARC 자동 프로비저닝

테넌트(부서) 생성 워크플로우에 ARC Runner 셋업이 통합됩니다.

```python
# backend/orchestrator/steps/arc_step.py

async def provision_arc_runner_set(state: TenantState) -> TenantState:
    """
    테넌트 생성 시 자동 실행:
    
    1. arc-runners-{tenant_id} 네임스페이스 생성
       - ResourceQuota: Runner Pod CPU/MEM 제한
       - NetworkPolicy: 빌드 트래픽 허용 (Harbor, GitHub, 내부 레지스트리)
    
    2. Harbor 인증 Secret 복사
       arc-systems/harbor-credentials → arc-runners-{tenant_id}/harbor-credentials
    
    3. AutoscalingRunnerSet CRD 생성
       - githubConfigUrl: https://github.samsungds.net/orgs/{tenant_id}
       - githubConfigSecret: arc-systems/github-app-secret
       - minRunners: 0  (비용 절감: 요청 없으면 0개)
       - maxRunners: 10
       - runnerGroup: {tenant_id}
       - labels: [self-hosted, {tenant_id}, k8s]
    
    4. GitHub Org에 Runner 그룹 생성
       - GitHub API: POST /orgs/{tenant_id}/actions/runner-groups
       - name: {tenant_id}-runners
       - visibility: selected (해당 org 레포만)
    """

# AutoscalingRunnerSet 매니페스트
RUNNER_SET_TEMPLATE = """
apiVersion: actions.github.com/v1alpha1
kind: AutoscalingRunnerSet
metadata:
  name: {tenant_id}-runner-set
  namespace: arc-runners-{tenant_id}
  labels:
    managed-by: gitops-platform
    tenant: {tenant_id}
spec:
  githubConfigUrl: {github_base_url}/orgs/{tenant_id}
  githubConfigSecret: github-app-secret
  minRunners: 0
  maxRunners: 10
  runnerGroup: "{tenant_id}-runners"
  template:
    spec:
      initContainers:
      - name: init-dind-externals
        image: {harbor_registry}/arc/runner:{arc_version}
        command: ["cp", "-r", "-v", "/home/runner/externals/.", "/home/runner/tmpDir/"]
        volumeMounts:
        - name: dind-externals
          mountPath: /home/runner/tmpDir
      containers:
      - name: runner
        image: {harbor_registry}/arc/runner:{arc_version}
        env:
        - name: DOCKER_HOST
          value: tcp://localhost:2376
        - name: DOCKER_TLS_VERIFY
          value: "1"
        - name: DOCKER_CERT_PATH
          value: /certs/client
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2"
            memory: "4Gi"
        volumeMounts:
        - name: work
          mountPath: /home/runner/_work
        - name: dind-cert
          mountPath: /certs/client
          readOnly: true
      - name: dind
        image: {harbor_registry}/arc/dind:{dind_version}
        securityContext:
          privileged: true
        env:
        - name: DOCKER_TLS_CERTDIR
          value: /certs
        volumeMounts:
        - name: dind-cert
          mountPath: /certs/client
        - name: dind-externals
          mountPath: /home/runner/externals
      volumes:
      - name: work
        emptyDir: {{}}
      - name: dind-cert
        emptyDir: {{}}
      - name: dind-externals
        emptyDir: {{}}
"""
```

---

## 5. 서비스 생성 시 CI 워크플로우 자동 생성

서비스 프로비저닝 시 GitHub 레포에 Push되는 CI 파일:

```yaml
# .github/workflows/ci.yml (자동 생성)
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  HARBOR_REGISTRY: harbor.foundrymtc.samsungds.net
  IMAGE_NAME: ${{ env.HARBOR_REGISTRY }}/sw-platform-team/my-api-service

jobs:
  build-and-push:
    # ↓ 테넌트별 ARC Runner 라벨 (자동 주입)
    runs-on: [self-hosted, sw-platform-team, k8s]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Harbor
        uses: docker/login-action@v3
        with:
          registry: ${{ env.HARBOR_REGISTRY }}
          username: ${{ secrets.HARBOR_USERNAME }}
          password: ${{ secrets.HARBOR_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v6
        with:
          push: ${{ github.event_name == 'push' }}
          tags: |
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.IMAGE_NAME }}:latest

      - name: Update GitOps values (main 브랜치만)
        if: github.ref == 'refs/heads/main'
        env:
          GITOPS_TOKEN: ${{ secrets.GITOPS_TOKEN }}
        run: |
          # gitops-manifests 레포의 image.tag 업데이트
          git clone https://x-token:$GITOPS_TOKEN@github.samsungds.net/infra-team/gitops-manifests.git
          cd gitops-manifests
          # values.yaml의 image.tag를 현재 커밋 SHA로 업데이트
          yq e '.image.tag = "${{ github.sha }}"' -i \
            tenants/sw-platform-team/my-api-service/values.yaml
          git config user.email "gitops-bot@samsungds.net"
          git config user.name "GitOps Bot"
          git add -A
          git commit -m "chore: update my-api-service image to ${{ github.sha }}"
          git push
          # ArgoCD가 변경 감지 후 자동 배포

  # PR 시에만 실행: Preview 환경 배포
  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: [self-hosted, sw-platform-team, k8s]
    needs: build-and-push
    steps:
      - name: Notify Platform (Preview 배포 요청)
        run: |
          curl -X POST https://gitops-platform.swsol.samsungds.net/api/v1/webhooks/github \
            -H "Authorization: Bearer ${{ secrets.PLATFORM_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"event": "pr_preview", "pr": ${{ github.event.number }}, \
                 "sha": "${{ github.sha }}", "service": "my-api-service"}'
```

---

## 6. Runner NetworkPolicy (빌드 트래픽 허용)

Runner Pod는 빌드 중 외부 접근이 필요합니다. 다른 네임스페이스보다 넓은 정책 적용:

```yaml
# arc-runners-{tenant_id} 네임스페이스 NetworkPolicy

# 1. Harbor(이미지 Push/Pull) 허용
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-harbor
  namespace: arc-runners-sw-platform-team
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - ipBlock:
        cidr: {harbor_ip}/32
    ports:
    - port: 443

# 2. GitHub Enterprise(코드 체크아웃, API) 허용
---
kind: NetworkPolicy
metadata:
  name: allow-github
spec:
  egress:
  - to:
    - ipBlock:
        cidr: {github_enterprise_ip}/32
    ports:
    - port: 443
    - port: 22   # git over SSH

# 3. 사내 패키지 저장소 허용 (Maven, npm, PyPI 미러)
---
kind: NetworkPolicy
metadata:
  name: allow-internal-registry
spec:
  egress:
  - to:
    - ipBlock:
        cidr: {nexus_or_artifactory_ip}/32
    ports:
    - port: 8081
    - port: 443
```

---

## 7. 플랫폼 관리 UI — ARC 현황 대시보드

**`/admin/arc`** 페이지:

```
┌──────────────────────────────────────────────────────────────────┐
│  ARC Runner 현황                               [초기 설정]       │
├──────────────────────────────────────────────────────────────────┤
│  GitHub App: gitops-arc-runner    상태: ✅ 연결됨               │
│  ARC Controller: v0.9.3           상태: ✅ Running              │
│                                                                  │
│  테넌트별 Runner 현황                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 테넌트              러너 수   실행 중   대기   상태        │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ sw-platform-team    0~10      3개      0      ✅ 정상     │  │
│  │ data-team           0~10      1개      2      ✅ 정상     │  │
│  │ frontend-team       0~10      0개      0      ✅ 정상     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  최근 빌드 (전체)                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ my-api-service   main   ✅ 성공   1분 32초   5분 전       │  │
│  │ user-service     main   ✅ 성공   2분 10초   12분 전      │  │
│  │ batch-job        main   ❌ 실패   0분 45초   20분 전 [로그]│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. 테넌트 생성 Wizard에 ARC 통합

기존 테넌트 생성 흐름에 ARC 단계가 추가됩니다:

```
테넌트 생성 4단계 Wizard

Step 1: 기본 정보 (부서명, LDAP 그룹, 쿼터)
Step 2: GitHub Org 연동
        ┌────────────────────────────────────────────────────────┐
        │ GitHub 조직명 *                                        │
        │ [sw-platform-team                                    ] │
        │ → https://github.samsungds.net/sw-platform-team       │
        │                                                        │
        │ GitHub App 설치 상태:                                  │
        │ ⏳ 확인 중...                                          │
        │ → ✅ gitops-arc-runner 앱이 설치되어 있습니다          │
        │   또는                                                  │
        │ → ⚠️ 앱이 설치되지 않았습니다.                        │
        │   [설치 안내 보기]  ← 클릭 시 설치 가이드 모달 오픈   │
        └────────────────────────────────────────────────────────┘
Step 3: 리소스 쿼터 설정
Step 4: 확인 및 생성
        → K8s Namespace 생성
        → arc-runners-{tenant} 네임스페이스 생성
        → AutoscalingRunnerSet 생성          ← ARC 자동화
        → GitHub Org Runner 그룹 생성        ← ARC 자동화
        → 완료 알림
```

---

## 9. Secrets 자동 주입 (Repository Secrets)

서비스 레포가 생성될 때 CI에 필요한 Secret을 GitHub Repository Secrets에 자동 등록:

```python
# backend/orchestrator/steps/github_step.py

async def setup_repo_secrets(repo_name: str, tenant_id: str) -> None:
    """
    CI 워크플로우가 참조하는 Secret을 GitHub 레포에 자동 등록:
    
    - HARBOR_USERNAME: Harbor 봇 계정
    - HARBOR_PASSWORD: Harbor 봇 비밀번호
    - GITOPS_TOKEN:    gitops-manifests 레포 Push용 PAT
    - PLATFORM_TOKEN:  플랫폼 API 호출용 JWT
    
    값은 플랫폼의 K8s Secret에서 읽어 GitHub Secrets API로 암호화하여 등록.
    개발자는 Secret 값을 직접 보거나 입력할 필요 없음.
    """
    github = GitHubClient()
    platform_secrets = await k8s_client.get_secret("platform-ci-secrets", "arc-systems")

    secrets_to_inject = {
        "HARBOR_USERNAME": platform_secrets["harbor_username"],
        "HARBOR_PASSWORD": platform_secrets["harbor_password"],
        "GITOPS_TOKEN":    platform_secrets["gitops_pat"],
        "PLATFORM_TOKEN":  await generate_service_token(tenant_id, repo_name),
    }

    for key, value in secrets_to_inject.items():
        await github.set_repo_secret(
            org=tenant_id,
            repo=repo_name,
            secret_name=key,
            secret_value=value,
        )
```

---

## 10. ARC 관련 환경변수 (`.env.example` 추가분)

```bash
# ── ARC (Actions Runner Controller) ──────────────────────────────
ARC_VERSION=0.9.3                      # ARC Helm Chart 버전
ARC_RUNNER_IMAGE=harbor.foundrymtc.samsungds.net/arc/runner
ARC_DIND_IMAGE=harbor.foundrymtc.samsungds.net/arc/dind
ARC_NAMESPACE=arc-systems              # ARC 컨트롤러 네임스페이스
ARC_RUNNER_NAMESPACE_PREFIX=arc-runners  # 테넌트별: arc-runners-{tenant}

# GitHub App (ARC 인증용)
GITHUB_APP_ID=12345
GITHUB_APP_INSTALLATION_ID=67890
GITHUB_APP_PRIVATE_KEY_PATH=/etc/arc/github-app-key.pem
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# CI용 공통 Secret (레포에 자동 주입)
HARBOR_BOT_USERNAME=ci-bot
HARBOR_BOT_PASSWORD=your-harbor-bot-password
GITOPS_PAT=ghp_xxxxxxxxxxxx           # gitops-manifests 레포 Push 권한
```

---

## 11. ARC 관련 API 엔드포인트

```
GET  /admin/arc/status                 # ARC Controller 상태 + 테넌트별 Runner 현황
GET  /admin/arc/setup-status           # GitHub App 설정 완료 여부
POST /admin/arc/setup                  # GitHub App 크리덴셜 저장 + 검증
POST /admin/arc/setup/verify           # 설정 검증만 (저장 없이)
GET  /admin/arc/runners                # 전체 Runner Pod 목록
GET  /admin/arc/builds                 # 최근 빌드 목록 (전체 테넌트)

GET  /tenants/{id}/arc/status          # 테넌트별 Runner 상태
POST /tenants/{id}/arc/provision       # 테넌트 ARC 수동 재프로비저닝
GET  /tenants/{id}/arc/builds          # 테넌트 빌드 이력
```
