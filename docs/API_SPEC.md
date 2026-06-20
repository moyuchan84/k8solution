# API_SPEC.md — FastAPI 엔드포인트 전체 명세

## 기본 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer {JWT}` 헤더 (모든 엔드포인트 필수)
- Content-Type: `application/json`
- 에러 응답 형식:
  ```json
  { "success": false, "error": "에러 메시지", "code": "ERROR_CODE" }
  ```

---

## 1. 인증 (`/auth`)

### `POST /auth/login`
OIDC 토큰 교환 또는 LDAP 로그인

**Request:**
```json
{
  "username": "hong.gildong",
  "password": "********"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "uid": "hong.gildong",
    "display_name": "홍길동",
    "email": "hong.gildong@samsungds.net",
    "roles": ["developer"],
    "tenants": ["sw-platform-team"]
  }
}
```

### `GET /auth/me`
현재 로그인 사용자 정보

### `POST /auth/refresh`
액세스 토큰 갱신

---

## 2. 테넌트 (`/tenants`)

### `GET /tenants`
접근 가능한 테넌트 목록

**권한:** 모든 인증 사용자

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sw-platform-team",
      "display_name": "SW Platform 팀",
      "namespace": "sw-platform-team",
      "member_count": 12,
      "project_count": 8,
      "resource_usage": {
        "cpu_used": "12",
        "cpu_total": "20",
        "memory_used": "24Gi",
        "memory_total": "40Gi",
        "pod_used": 18,
        "pod_total": 50
      }
    }
  ]
}
```

### `POST /tenants`
신규 테넌트(부서) 생성

**권한:** `platform-admin`

**Request:**
```json
{
  "id": "new-team",
  "display_name": "신규 팀",
  "ldap_group": "cn=new-team,ou=groups,dc=samsungds,dc=net",
  "admins": ["kim.daesik"],
  "resource_quota": {
    "cpu": "20",
    "memory": "40Gi",
    "pods": 50
  }
}
```

**Response 202:**
```json
{
  "success": true,
  "tracking_id": "req-2026-001",
  "status": "in_progress"
}
```

### `GET /tenants/{tenant_id}`
테넌트 상세 정보

### `PATCH /tenants/{tenant_id}`
테넌트 설정 변경 (리소스 쿼터 등)

**권한:** `platform-admin`, `tenant-admin`

### `DELETE /tenants/{tenant_id}`
테넌트 삭제 (포함된 모든 프로젝트 삭제)

**권한:** `platform-admin`

---

## 3. 프로젝트 (`/projects`)

### `POST /projects`
신규 서비스 프로젝트 생성 (Orchestrator 워크플로우 시작)

**권한:** `tenant-admin`, `developer` (자신의 테넌트만)

**Request:**
```json
{
  "project_name": "my-api-service",
  "tenant_id": "sw-platform-team",
  "stack": "java-spring",
  "resource_size": "medium",
  "env": "prod",
  "service_port": 8080,
  "health_check_path": "/health",
  "description": "사용자 인증 API 서비스",
  "db_connections": [
    {
      "type": "postgresql",
      "host": "db.internal.samsungds.net",
      "port": 5432,
      "database": "user_db",
      "secret_name": "my-api-service-db-secret"
    }
  ],
  "env_vars": [
    {
      "key": "SPRING_PROFILES_ACTIVE",
      "value": "prod"
    }
  ]
}
```

**Response 202:**
```json
{
  "success": true,
  "tracking_id": "req-2026-20-001",
  "status": "pending",
  "estimated_minutes": 3
}
```

### `GET /projects`
프로젝트 목록 조회

**쿼리 파라미터:**
- `tenant_id` (필수): 테넌트 필터
- `env`: dev/staging/prod 필터
- `status`: synced/progressing/degraded/unknown
- `page`, `page_size`: 페이지네이션

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "project_name": "my-api-service",
        "tenant_id": "sw-platform-team",
        "stack": "java-spring",
        "resource_size": "medium",
        "env": "prod",
        "status": "Synced",
        "health": "Healthy",
        "service_url": "https://my-api-service.swsol.samsungds.net",
        "github_repo": "https://github.samsungds.net/sw-platform-team/my-api-service",
        "last_deployed_at": "2026-06-20T14:30:00Z",
        "last_deployed_by": "hong.gildong",
        "last_image_tag": "v1.2.3",
        "pod_count": 2,
        "ready_pods": 2
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

### `GET /projects/{project_name}`
프로젝트 상세 + ArgoCD 상태

**Response 200:**
```json
{
  "success": true,
  "data": {
    "project_name": "my-api-service",
    "tenant_id": "sw-platform-team",
    "argocd_status": {
      "sync_status": "Synced",
      "health_status": "Healthy",
      "revision": "a1b2c3d",
      "last_synced_at": "2026-06-20T14:30:00Z"
    },
    "pods": [
      {
        "name": "my-api-service-7d9f8b-xxx",
        "status": "Running",
        "ready": "2/2",
        "restarts": 0,
        "age": "5m"
      }
    ],
    "resource_usage": {
      "cpu": "350m",
      "memory": "256Mi"
    },
    "deploy_history": [
      {
        "image_tag": "v1.2.3",
        "status": "success",
        "deployed_at": "2026-06-20T14:30:00Z",
        "deployed_by": "hong.gildong"
      }
    ]
  }
}
```

### `PATCH /projects/{project_name}`
프로젝트 설정 변경 (리소스 사이즈, 환경변수 등)

**Request:**
```json
{
  "resource_size": "large",
  "env_vars": [
    { "key": "LOG_LEVEL", "value": "DEBUG" }
  ]
}
```

### `DELETE /projects/{project_name}`
프로젝트 삭제 (K8s 리소스, ArgoCD App, GitHub 레포 포함)

**권한:** `tenant-admin`

### `POST /projects/{project_name}/sync`
ArgoCD 수동 Sync 트리거

### `POST /projects/{project_name}/rollback`
이전 이미지 태그로 롤백

**Request:**
```json
{
  "target_revision": "v1.2.2"
}
```

---

## 4. 상태 추적 (`/tasks`)

### `GET /tasks/{tracking_id}`
비동기 작업 진행 상태 조회

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tracking_id": "req-2026-20-001",
    "status": "in_progress",
    "current_step": "k8s_namespace",
    "completed_steps": ["validate", "github_repo", "harbor_project"],
    "total_steps": 9,
    "started_at": "2026-06-20T14:30:00Z",
    "estimated_completion": "2026-06-20T14:33:00Z",
    "error": null
  }
}
```

**Status 값:** `pending` | `in_progress` | `completed` | `failed` | `rolled_back`

### `GET /tasks/{tracking_id}/stream`
SSE(Server-Sent Events)로 실시간 상태 스트리밍

```
event: step_complete
data: {"step": "github_repo", "message": "GitHub 레포 생성 완료"}

event: step_complete
data: {"step": "harbor_project", "message": "Harbor 프로젝트 생성 완료"}

event: completed
data: {"service_url": "https://my-api.swsol.samsungds.net", "github_url": "..."}
```

---

## 5. 외부 연결 (`/projects/{project_name}/connections`)

### `GET /projects/{project_name}/connections`
현재 설정된 외부 연결 목록

### `POST /projects/{project_name}/connections`
외부 연결 추가 (DB, 외부 API 등)

**Request:**
```json
{
  "type": "postgresql",
  "display_name": "메인 DB",
  "host": "db.internal.samsungds.net",
  "port": 5432,
  "database": "user_db",
  "credentials": {
    "username": "app_user",
    "password": "***"
  }
}
```

**처리 내용:**
1. K8s Secret 생성 (`{project_name}-{type}-secret`)
2. Deployment에 환경변수 자동 마운트
3. NetworkPolicy에 Egress 규칙 추가 (해당 IP:Port 허용)

### `DELETE /projects/{project_name}/connections/{connection_id}`
외부 연결 제거

---

## 6. 로그 (`/projects/{project_name}/logs`)

### `GET /projects/{project_name}/logs`
파드 로그 조회

**쿼리 파라미터:**
- `pod_name`: 특정 파드 (미지정 시 첫 번째)
- `container`: 컨테이너명
- `lines`: 최근 N줄 (기본 100)
- `since`: RFC3339 시간 이후

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pod_name": "my-api-service-7d9f8b-xxx",
    "logs": "2026-06-20T14:30:00Z INFO  Started Application\n..."
  }
}
```

### `GET /projects/{project_name}/logs/stream`
SSE로 실시간 로그 스트리밍

---

## 7. 관리자 API (`/admin`)

### `GET /admin/resource-overview`
전체 클러스터 리소스 현황

**권한:** `platform-admin`

### `GET /admin/audit-logs`
감사 로그 조회

**쿼리 파라미터:**
- `tenant_id`, `action`, `resource_type`
- `from_date`, `to_date`
- `page`, `page_size`

### `GET /admin/cost-estimate`
테넌트별 리소스 사용량 비용 추산

---

## 8. Network Policy (`/projects/{name}/network`)

### `GET /projects/{name}/network/rules`
현재 적용된 NetworkPolicy 규칙 목록 (사람이 읽기 쉬운 형태)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ingress": [
      { "id": "allow-from-ingress", "source": "Envoy Gateway", "port": 8080, "protocol": "TCP" },
      { "id": "allow-from-prometheus", "source": "Prometheus", "port": 9090, "protocol": "TCP" }
    ],
    "egress": [
      { "id": "allow-dns", "target": "kube-dns", "port": 53, "protocol": "UDP" },
      { "id": "allow-egress-db-5432", "target": "10.1.2.3", "port": 5432, "protocol": "TCP",
        "original_domain": "db.internal.samsungds.net" }
    ]
  }
}
```

### `POST /projects/{name}/network/preview`
규칙 추가 시 생성될 YAML 미리보기 (적용 안 함)

**Request:**
```json
{ "direction": "egress", "target_type": "domain",
  "target": "api.external.samsungds.net", "port": 443, "protocol": "TCP" }
```

**Response 200:**
```json
{ "success": true, "data": { "yaml": "apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\n..." } }
```

### `POST /projects/{name}/network/rules`
규칙 적용 (K8s 즉시 적용 + GitOps 커밋)

### `DELETE /projects/{name}/network/rules/{rule_id}`
규칙 삭제

### `POST /projects/{name}/network/test`
연결 테스트 (Pod에서 nc 실행)

**Request:**
```json
{ "target_host": "db.internal.samsungds.net", "port": 5432 }
```

**Response 200:**
```json
{ "success": true, "data": { "reachable": true, "latency_ms": 2, "output": "Connection succeeded" } }
```

---

## 9. RBAC (`/projects/{name}/rbac`)

### `GET /projects/{name}/rbac/matrix`
현재 RBAC 매트릭스 조회

**Response 200:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "subject": "sw-dev-team", "subject_type": "Group",
        "permissions": { "pods": ["get","list"], "deployments": ["get","list"], "secrets": [] }
      },
      {
        "subject": "ci-bot", "subject_type": "ServiceAccount",
        "permissions": { "pods": ["get"], "deployments": ["get","patch"], "secrets": [] }
      }
    ]
  }
}
```

### `PUT /projects/{name}/rbac/matrix`
매트릭스 전체 업데이트 → Role + RoleBinding 자동 재생성

### `POST /projects/{name}/rbac/service-accounts`
ServiceAccount 생성 + 토큰 발급

### `DELETE /projects/{name}/rbac/service-accounts/{sa_name}`
ServiceAccount 삭제

---

## 10. 리소스 관리 (`/projects/{name}/resources`)

### `POST /projects/{name}/resources/preview`
변경 전 Manifest diff 반환

**Request:**
```json
{ "resource_size": "large" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "tenants/sw-team/my-api/values.yaml",
        "diff": "@@ -3,4 +3,4 @@\n-replicas: 2\n+replicas: 3\n-cpu: 500m\n+cpu: 1"
      }
    ]
  }
}
```

### `POST /projects/{name}/resources/apply`
Raw YAML 직접 적용 (K8s dry-run 검증 후 적용)

### `POST /projects/{name}/resources/validate`
YAML 문법 + K8s Schema 검증 (적용 안 함)

### `GET /projects/{name}/resources/external-secrets`
ExternalSecret 목록 + Sync 상태

### `POST /projects/{name}/resources/external-secrets`
ExternalSecret 생성

---

## 11. Secret & 환경변수 (`/projects/{name}/secrets`)

### `GET /projects/{name}/secrets`
환경변수 목록 (값은 마스킹, 출처 포함)

### `POST /projects/{name}/secrets`
환경변수 추가/수정

**Request:**
```json
{ "key": "LOG_LEVEL", "value": "DEBUG", "is_secret": false, "restart_pods": true }
```

### `DELETE /projects/{name}/secrets/{key}`
환경변수 삭제

---

## 12. Webhook (`/webhooks`)

### `POST /webhooks/github`
GitHub Enterprise Webhook 수신 (PR open/close → Preview 환경 자동 관리)

---

## 13. 헬스체크

### `GET /health`
```json
{ "status": "healthy", "version": "1.0.0" }
```

### `GET /ready`
모든 의존성 (K8s, Redis, DB) 연결 상태 확인
