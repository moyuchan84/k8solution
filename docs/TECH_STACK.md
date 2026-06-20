# TECH_STACK.md — 기술 스택 및 의존성

## 1. 백엔드 (Python FastAPI)

### 핵심 라이브러리

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `fastapi` | ^0.115 | 웹 프레임워크 |
| `uvicorn[standard]` | ^0.32 | ASGI 서버 |
| `pydantic` | ^2.9 | 데이터 검증 (v2 필수) |
| `pydantic-settings` | ^2.6 | 환경변수 기반 설정 관리 |
| `kubernetes` | ^31 | K8s Python 클라이언트 |
| `PyGithub` | ^2.4 | GitHub Enterprise API |
| `httpx` | ^0.27 | 비동기 HTTP (Harbor, ArgoCD API) |
| `redis[hiredis]` | ^5.1 | 작업 상태 캐시 (SSE 상태 공유) |
| `python-jose[cryptography]` | ^3.3 | JWT 검증 |
| `python-ldap` | ^3.4 | LDAP 사용자 인증 |
| `pyyaml` | ^6.0 | YAML 매니페스트 생성 |
| `jinja2` | ^3.1 | K8s 리소스 템플릿 렌더링 |
| `python-dotenv` | ^1.0 | 환경변수 로딩 |
| `langchain-openai` | ^0.2 | LLM 연동 (선택적, `LLM_ENABLED=true` 시) |

### 개발 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `pytest` | ^8 | 테스트 |
| `pytest-asyncio` | ^0.24 | 비동기 테스트 |
| `pytest-cov` | ^6 | 커버리지 |
| `httpx` | ^0.27 | TestClient (FastAPI) |
| `ruff` | ^0.7 | 린터 + 포매터 |
| `mypy` | ^1.13 | 타입 체크 |

### `requirements.txt` 구조

```
# backend/requirements.txt
fastapi==0.115.5
uvicorn[standard]==0.32.1
pydantic==2.9.2
pydantic-settings==2.6.1
kubernetes==31.0.0
PyGithub==2.4.0
httpx==0.27.2
redis[hiredis]==5.1.1
python-jose[cryptography]==3.3.0
python-ldap==3.4.4
pyyaml==6.0.2
jinja2==3.1.4
python-dotenv==1.0.1
# LLM 연동 (선택적 — LLM_ENABLED=true 시 필요)
langchain-openai==0.2.14

# backend/requirements-dev.txt
-r requirements.txt
pytest==8.3.3
pytest-asyncio==0.24.0
pytest-cov==6.0.0
ruff==0.7.4
mypy==1.13.0
```

### LLM 로컬 개발 환경 (Ollama)

```bash
# Ollama 설치 후 경량 모델 Pull
ollama pull llama3.2:3b      # 추천: 빠르고 지시사항 잘 따름
# 또는
ollama pull qwen2.5:3b       # 한국어 성능이 더 좋음

# 서버 실행 (기본 포트 11434)
ollama serve

# .env 설정
LLM_ENABLED=true
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2:3b
LLM_API_KEY=ollama
```

### 사내 배포 LLM 전환

```bash
# .env (또는 K8s Secret)
LLM_ENABLED=true
LLM_BASE_URL=https://llm-api.samsungds.net/v1   # 사내 LLM API (OpenAI 호환)
LLM_MODEL=gpt-oss-12b                            # 사내 모델명
LLM_API_KEY=your-internal-api-key
```

코드 변경 없음. `langchain-openai`의 `ChatOpenAI`가 `base_url`만 바꾸면 자동 전환.

---

## 2. 프론트엔드 (Next.js)

### 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | ^15 | React 프레임워크 (App Router) |
| `react` | ^19 | UI 라이브러리 |
| `typescript` | ^5.6 | 타입 언어 |
| `tailwindcss` | ^3.4 | CSS 유틸리티 |
| `@shadcn/ui` | latest | UI 컴포넌트 (Radix 기반) |
| `zustand` | ^5 | 전역 상태 관리 |
| `next-auth` | ^5 | 인증 (OIDC/SSO) |
| `@tanstack/react-query` | ^5 | 서버 상태 관리 |
| `react-hook-form` | ^7 | 폼 관리 |
| `zod` | ^3 | 폼 스키마 검증 |
| `lucide-react` | ^0.460 | 아이콘 |
| `recharts` | ^2 | 리소스 사용량 차트 |
| `sonner` | ^1 | Toast 알림 |

### `package.json` 핵심 스크립트

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

### Next.js 설정 (`next.config.ts`)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 사내 폐쇄망: 외부 이미지 도메인 없음
  images: {
    domains: [],
  },
  // API 프록시 (CORS 우회)
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
```

---

## 3. 인프라 / GitOps

| 도구 | 버전 | 용도 |
|------|------|------|
| Kubernetes | 1.30+ | 컨테이너 오케스트레이션 |
| ArgoCD | 2.13+ | GitOps CD |
| Helm | 3.16+ | K8s 패키지 관리 |
| Kyverno | 1.13+ | 정책 엔진 (Policy as Code) |
| Istio / Envoy | 1.23+ | 서비스 메시, 트래픽 제어 |
| Harbor | 2.12+ | 컨테이너 이미지 레지스트리 |
| Redis | 7.4+ | 상태 캐시 |
| PostgreSQL | 16+ | 플랫폼 메타데이터 DB |

---

## 4. 사내 연동 시스템

| 시스템 | 연동 방식 | 비고 |
|--------|-----------|------|
| GitHub Enterprise (`github.samsungds.net`) | REST API v3, Personal Access Token | 레포 생성, Webhook |
| Harbor (`harbor.foundrymtc.samsungds.net`) | Harbor API v2, Basic Auth/Token | 프로젝트·사용자 관리 |
| ArgoCD (`argocd.swsol.samsungds.net`) | ArgoCD REST API, JWT | App 생성·Sync |
| 사내 SSO | OIDC (Authorization Code Flow) | 로그인 |
| LDAP | `python-ldap` | 사용자 검색, 그룹 조회 |
| L4 Gateway / Envoy | K8s CR (VirtualService) | 도메인 라우팅 |

---

## 5. 개발 환경

### 로컬 개발 (docker-compose)

```yaml
# docker-compose.dev.yml
services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    environment:
      - K8S_IN_CLUSTER=false
      - K8S_KUBECONFIG=/app/.kube/config
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"

  redis:
    image: redis:7.4-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gitops_platform
      POSTGRES_USER: platform
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
```

### 환경 변수 목록 (`.env.example`)

```bash
# ── 사내 인프라 ──────────────────────────────────
GITHUB_BASE_URL=https://github.samsungds.net
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_ORG=your-org

HARBOR_URL=https://harbor.foundrymtc.samsungds.net
HARBOR_USERNAME=platform-bot
HARBOR_PASSWORD=your-harbor-password

ARGOCD_SERVER=https://argocd.swsol.samsungds.net
ARGOCD_TOKEN=your-argocd-token

DOMAIN_SUFFIX=swsol.samsungds.net
GITOPS_REPO=github.samsungds.net/infra-team/gitops-manifests
GITOPS_BRANCH=main

# ── K8s ─────────────────────────────────────────
K8S_IN_CLUSTER=true
# K8S_KUBECONFIG=/path/to/kubeconfig  # 로컬 개발 시만 사용

# ── 인증 ─────────────────────────────────────────
OIDC_ISSUER=https://sso.samsungds.net/realms/internal
OIDC_CLIENT_ID=gitops-platform
OIDC_CLIENT_SECRET=your-client-secret
JWT_SECRET_KEY=your-jwt-secret-key

LDAP_SERVER=ldap://ldap.samsungds.net
LDAP_BIND_DN=cn=platform-bot,ou=service-accounts,dc=samsungds,dc=net
LDAP_BIND_PASSWORD=your-ldap-password
LDAP_BASE_DN=dc=samsungds,dc=net

# ── 데이터베이스 ──────────────────────────────────
DATABASE_URL=postgresql://platform:password@postgres:5432/gitops_platform
REDIS_URL=redis://redis:6379/0

# ── 앱 ──────────────────────────────────────────
ENVIRONMENT=production
LOG_LEVEL=INFO
```

---

## 6. CI/CD 파이프라인 (플랫폼 자체)

플랫폼 자체도 GitOps로 배포됩니다.

```yaml
# .github/workflows/platform-ci.yml
name: Platform CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements-dev.txt
          pytest --cov=. --cov-report=xml

  test-frontend:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cd frontend
          npm ci
          npm run type-check
          npm run test

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: self-hosted
    steps:
      - name: Build & Push to Harbor
        run: |
          docker build -t $HARBOR_URL/platform/backend:$GITHUB_SHA ./backend
          docker build -t $HARBOR_URL/platform/frontend:$GITHUB_SHA ./frontend
          docker push $HARBOR_URL/platform/backend:$GITHUB_SHA
          docker push $HARBOR_URL/platform/frontend:$GITHUB_SHA
      
      - name: Update GitOps values
        run: |
          # gitops 레포의 platform/values.yaml image.tag 업데이트
          # ArgoCD가 자동 Sync
```
