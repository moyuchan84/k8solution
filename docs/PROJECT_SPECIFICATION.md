# PROJECT_SPECIFICATION.md — K8s GitOps Self-Service Platform

---

## 1. 벤치마킹 — 우리가 참고한 플랫폼들

> 이 시스템은 아래 플랫폼들의 **개발자 경험(DX)**을 사내 폐쇄망 K8s 환경에 이식한다.

| 플랫폼 | 우리가 가져온 것 |
|--------|----------------|
| **Vercel** | git push → 자동 빌드·배포. PR마다 Preview URL 자동 생성. 제로 설정 |
| **Railway** | 서비스 토폴로지 캔버스 (서비스 간 연결 시각화). 서비스 링크 UI |
| **Porter** | Helm/YAML 완전 추상화. 개발자가 K8s를 몰라도 배포 가능. Manifest Preview |
| **Northflank** | Template Gallery (공통 패턴 즉시 부트스트랩). Secret Manager UI |
| **Humanitec** | 동적 RBAC 매트릭스. Score 방식 선언형 앱 설정. 환경별 설정 오버라이드 |

### 핵심 DX 원칙 (이 플랫폼들의 공통점)

1. **개발자는 YAML을 쓰지 않는다** — 모든 K8s 리소스는 UI 폼으로 생성
2. **git push가 배포 트리거** — CI/CD 파이프라인 설정 없이 코드 push만으로 배포
3. **미리보기 후 적용** — 변경 전 생성될 매니페스트를 UI에서 확인 가능
4. **외부 연결은 UI에서 점·클릭** — NetworkPolicy, ServiceEntry를 직접 편집하지 않음

---

## 2. 배경 및 목적

### 현재 문제

| 문제 | 영향 |
|------|------|
| K8s YAML 직접 작성 부담 | 학습 비용, 실수 가능성 |
| Namespace·RBAC 요청 시 인프라팀 승인 대기 | 수 일의 배포 지연 |
| NetworkPolicy 설정이 복잡하고 수동 | 보안 사고 위험 또는 과도한 개방 |
| Harbor 레지스트리 권한 수동 관리 | 온보딩 비용 |
| CRD, ExternalSecret 등 고급 리소스 진입장벽 | 기능 활용 못함 |
| 외부 서비스 연결 시 Egress 규칙 직접 작성 | 실수 또는 보안 홀 |

### 목표

```
개발자 담당: 소스코드 작성 → git push
플랫폼 담당: 스택 자동감지 → 이미지 빌드 → K8s 배포 → 도메인 노출 → 모니터링
```

---

## 3. 핵심 기능 목록

### 3.1 서비스 프로비저닝 (Vercel·Porter 벤치마킹)

- **Buildpack 자동감지**: Dockerfile 없어도 됨. 언어/프레임워크 자동 감지 후 표준 이미지 빌드
- **git push → 자동 배포**: GitHub Webhook → Harbor 빌드 → ArgoCD Sync 자동화
- **Branch Preview 환경**: PR 생성 시 `pr-{번호}.swsol.samsungds.net` 임시 URL 자동 생성, PR 머지·닫힘 시 자동 삭제
- **Manifest Preview**: 배포 전 생성될 K8s YAML 전체를 UI에서 미리 확인 가능 (diff 뷰)

### 3.2 네트워크 정책 관리 (Northflank·Humanitec 벤치마킹)

- **Visual Network Policy Editor**: 드롭다운으로 소스/대상 선택, Ingress·Egress 규칙 점·클릭 설정
- **외부 서비스 연결 마법사**: DB, 외부 API 등록 시 필요한 Egress 규칙 자동 생성
- **서비스 토폴로지 맵**: 네임스페이스 내 서비스 간 허용된 트래픽 경로 시각화
- **Kyverno 정책 상태**: 각 서비스에 적용된 정책 목록과 위반 내역 표시

### 3.3 RBAC 관리 (Humanitec 벤치마킹)

- **RBAC 매트릭스 UI**: 사용자/그룹 × 리소스 × 권한(get·list·create·delete) 체크박스 테이블
- **역할 템플릿**: `developer`, `reviewer`, `deployer`, `read-only` 사전 정의 역할
- **ServiceAccount 관리**: CI/CD용 SA 생성·토큰 발급 UI
- **감사 로그**: RBAC 변경 이력 추적

### 3.4 CRD & 고급 리소스 관리

- **CRD 뷰어**: 클러스터에 설치된 CRD 목록 및 각 인스턴스 조회
- **ExternalSecret 관리**: Vault·AWS SM·사내 Secret 백엔드 연동, UI로 Secret 참조 설정
- **HPA/KEDA 설정**: CPU·메모리·커스텀 메트릭 기반 오토스케일 규칙 UI 설정
- **PodDisruptionBudget**: 무중단 배포 보장 설정 (minAvailable 슬라이더)
- **Manifest 직접 편집**: 고급 사용자를 위한 YAML 에디터 (Monaco, schema 검증 포함)

### 3.5 Template Gallery (Northflank 벤치마킹)

버튼 하나로 검증된 구성으로 서비스 시작:

| 템플릿 | 구성 |
|--------|------|
| Spring Boot + PostgreSQL | App(M) + DB Secret + Egress 규칙 |
| Node.js API + Redis | App(S) + Redis Sidecar + Session 설정 |
| Python Worker | App(S) + CronJob + 큐 연결 |
| Go Microservice | App(S) + Prometheus 메트릭 설정 |
| Full-stack (API + Frontend) | 2개 서비스 + Ingress 분기 규칙 |

### 3.6 Secret & 환경변수 관리

- **계층적 환경변수**: Global(플랫폼) → Tenant(부서) → Service(서비스) 단계별 오버라이드
- **Secret UI**: 값 마스킹, K8s Secret 자동 생성, 변경 시 Pod 자동 재시작 옵션
- **Secret 참조 방식**: 직접 값 입력 or K8s Secret 참조(`secretKeyRef`) 선택 가능
- **환경별 분리**: dev·staging·prod 환경마다 독립 Secret 세트

---

## 4. 사용자 역할

| 역할 | 권한 |
|------|------|
| `platform-admin` | 전체 테넌트 관리, 쿼터 조정, CRD 설치, Kyverno 정책 관리 |
| `tenant-admin` | 소속 부서 서비스 생성·삭제, 멤버 관리, RBAC 설정 |
| `developer` | 소속 서비스 배포, 로그·상태 조회, 환경변수 변경 |
| `read-only` | 조회만 가능 (감사·보안팀용) |

---

## 5. 핵심 유즈케이스

### UC-01: 신규 서비스 프로비저닝 (제로 설정)

```
개발자 행동                    플랫폼 자동화
─────────────────────────────────────────────────────────
① UI에서 "새 서비스" 클릭       
② 서비스명·환경 입력           
③ (선택) Template Gallery 선택  
④ [배포 요청]                  → GitHub 레포 생성 (Dockerfile + CI 포함)
                               → Harbor 프로젝트 생성
                               → K8s Namespace + ResourceQuota 생성
                               → RBAC 자동 설정
                               → NetworkPolicy 기본 격리 적용
                               → Envoy VirtualService 등록
                               → ArgoCD Application 등록 + Sync
⑤ 완료 알림 수신               → {서비스명}.swsol.samsungds.net 접속 가능
⑥ git clone → 코드 개발         
⑦ git push                    → CI: Harbor 이미지 빌드
                               → ArgoCD: 자동 배포
```

**소요 시간:** 첫 프로비저닝 ~3분 / 이후 git push → 배포 ~2분

---

### UC-02: Branch Preview 환경

```
① 개발자가 feature/login 브랜치 push
② GitHub Webhook 수신 → 플랫폼이 감지
③ preview namespace 자동 생성: {서비스명}-pr-{번호}
④ 동일한 Helm Chart로 배포, 별도 URL 생성:
   pr-42-my-api.swsol.samsungds.net
⑤ PR에 URL 자동 댓글
⑥ PR 머지·닫힘 → namespace + 모든 리소스 자동 삭제
```

---

### UC-03: 외부 서비스 연결 (NetworkPolicy 자동화)

```
① 서비스 상세 → [외부 연결 추가]
② 연결 타입 선택:
   - 사내 DB (IP/포트 직접 입력)
   - 사내 API (도메인 입력, DNS 조회 후 IP 매핑)
   - 클러스터 내 다른 서비스 (서비스 이름 선택)

③ [미리보기] 클릭 → 생성될 NetworkPolicy YAML 표시
④ [적용] → 자동 생성 및 ArgoCD Sync
⑤ 연결 테스트 버튼 → Pod에서 curl 실행 후 결과 표시
```

---

### UC-04: RBAC 설정

```
① [권한 관리] 탭 클릭
② RBAC 매트릭스 표시:

   사용자/그룹        pods  deployments  secrets  configmaps
   ─────────────────────────────────────────────────────────
   dev-team(LDAP)    ✓get  ✓get         ✗        ✓get
   ci-bot(SA)        ✓get  ✓patch       ✗        ✓get
   홍길동(개인)       ✓all  ✓all         ✓get     ✓all

③ 체크박스 변경 → [저장] → Role + RoleBinding 자동 업데이트
④ 변경 이력 감사 로그 기록
```

---

### UC-05: CRD 및 고급 리소스 관리

```
① [리소스] → [CRD 관리]
② 설치된 CRD 목록: ExternalSecret, VirtualService, HorizontalPodAutoscaler...
③ ExternalSecret 선택 → [새 인스턴스 생성]
④ 폼 입력:
   - 이름, 백엔드(Vault), 참조 경로, 갱신 주기
⑤ [미리보기] → 생성될 YAML 확인
⑥ [적용] → GitOps 레포에 커밋 → ArgoCD Sync
```

---

### UC-06: Manifest Preview & Diff

```
① 서비스 설정 변경 (리소스 사이즈 M→L)
② [변경 미리보기] 클릭
③ diff 뷰 표시:

   deployment.yaml
   - replicas: 2              + replicas: 3
   - resources.cpu: "500m"    + resources.cpu: "1"
   - resources.memory: "512Mi"+ resources.memory: "1Gi"

④ [적용] 또는 [취소]
```

---

## 6. 비기능 요구사항

| 항목 | 목표 |
|------|------|
| 첫 프로비저닝 완료 | 3분 이내 |
| git push → 배포 완료 | 2분 이내 |
| Preview 환경 생성 | 90초 이내 |
| API 응답 P95 | 500ms 이내 |
| UI 첫 로딩 (LCP) | 2초 이내 |
| 동시 사용자 | 100명 |
| 감사 로그 보존 | 1년 |
| 가용성 | 99.5% |

---

## 7. 보안 요구사항

- 모든 UI 접근: 사내 SSO (OIDC/LDAP) 인증 필수
- 테넌트 간 완전 격리: NetworkPolicy + RBAC + ResourceQuota 3중 적용
- 이미지 보안: Harbor Trivy 스캔 통과 이미지만 배포
- Secret: K8s Secret 저장, UI에서 값 마스킹, 로그에 미노출
- `cluster-admin` 바인딩 금지, 최소 권한 원칙
- 모든 리소스 변경: 감사 로그 기록 (who, what, when, from-where)
