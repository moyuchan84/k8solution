# K8S_CONCEPTS_GUIDE.md — K8s 개념 학습 가이드 기능 설계

> **개발 우선순위: Phase 7 (후순위)**
> Phase 1~6 완료 후 구현. 플랫폼 기능에 종속되므로 Core 기능이 먼저다.

---

## 1. 기능 목적

개발자가 플랫폼 UI에서 버튼을 누를 때 "이게 내부에서 어떤 K8s 리소스를 만드는 건지"를
이해할 수 있도록 **맥락 기반 개념 설명**을 제공한다.

```
플랫폼 원칙: 몰라도 쓸 수 있다 → 알면 더 잘 쓸 수 있다
```

**두 가지 진입점:**

```
① 플랫폼 UI 내 컨텍스트 힌트      ② 독립 학습 페이지
   각 설정 옆 [?] 버튼 클릭           /learn 메뉴에서 탐색
   → 해당 개념 슬라이드오버 패널      → 전체 개념 맵 + 상세 문서
```

---

## 2. 개념 맵 — 전체 관계도

`/learn` 페이지 상단에 인터랙티브 관계 그래프(D3.js)로 표시:

```
                           ┌──────────────┐
                           │   Namespace  │  ← 모든 것의 울타리
                           └──────┬───────┘
                                  │ 포함
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼──────┐         ┌──────▼──────┐        ┌──────▼──────┐
    │ Deployment │         │   Service   │        │  ConfigMap  │
    │            │         │             │        │  / Secret   │
    │ Pod 복제본 │ ──만든다▶│ Pod에 접근  │        │  (설정/크리 │
    │ 관리·업데이트│        │ 하는 문     │        │   덴셜)     │
    └─────┬──────┘         └──────┬──────┘        └─────────────┘
          │ 실행                   │ 타입
          │                ┌──────┴───────────────┐
    ┌─────▼──────┐         │          │           │
    │    Pod     │   ┌─────▼──┐ ┌────▼────┐ ┌───▼──────┐
    │            │   │ClusterIP│ │NodePort │ │LoadBal...│
    │ 실제 컨테이너│  │(내부전용)│ │(노드포트)│ │(외부노출)│
    │ 실행 단위   │  └─────────┘ └─────────┘ └──────────┘
    └─────┬──────┘
          │ 마운트
    ┌─────▼──────┐         ┌─────────────┐
    │    PVC     │◀──요청── │     PV      │
    │            │          │             │
    │ 스토리지   │          │ 실제 디스크  │
    │ 요청서     │          │ (NFS, ceph) │
    └────────────┘          └─────────────┘

    ┌──────────────────────────────────────┐
    │         NetworkPolicy                │
    │  Pod 간 트래픽 허용/차단 규칙        │
    │  Ingress(들어오는) + Egress(나가는)  │
    └──────────────────────────────────────┘

    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
    │    RBAC     │    │    HPA       │    │   CRD       │
    │  Role +     │    │  오토스케일  │    │  K8s 확장   │
    │ RoleBinding │    │  (CPU/MEM)   │    │  커스텀 리소스│
    └─────────────┘    └──────────────┘    └─────────────┘
```

노드 클릭 → 해당 개념 상세 패널 열림.
연결선 색상: 파랑=포함, 초록=참조, 주황=트래픽 제어

---

## 3. 개념별 상세 명세

각 개념 카드는 동일한 구조를 가진다:

```
┌──────────────────────────────────────────────────────────────┐
│  [아이콘]  개념명                         [플랫폼에서 보기 →]│
│  한 줄 요약                                                  │
├──────────────────────────────────────────────────────────────┤
│  [시각 다이어그램]          [이 플랫폼에서의 역할]           │
│                                                              │
│  [개념 설명 (한국어)]       [실제 생성되는 YAML 예시]        │
├──────────────────────────────────────────────────────────────┤
│  관련 개념:  [Deployment]  [Service]  [Namespace]           │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.1 Pod

**한 줄 요약:** K8s에서 실제로 컨테이너가 실행되는 최소 단위

**시각 다이어그램:**
```
  ┌──────────────────────────────────────┐
  │              Pod                     │
  │  ┌──────────────┐  ┌──────────────┐ │
  │  │  Container   │  │  Container   │ │  ← 보통 1개, 사이드카 패턴시 2개+
  │  │  (앱 코드)   │  │ (로그수집 등)│ │
  │  └──────────────┘  └──────────────┘ │
  │                                      │
  │  IP: 10.244.1.5  (Pod마다 고유 IP)  │
  │  Volume: /data (컨테이너 간 공유)   │
  └──────────────────────────────────────┘
       ↑ Node(서버) 위에서 실행
```

**왜 Pod가 존재하나요?**
컨테이너 하나가 직접 K8s에 배포되는 게 아니라, Pod라는 껍질 안에 싸여서 배포됩니다.
같은 Pod 안의 컨테이너들은 네트워크(localhost)와 스토리지(Volume)를 공유합니다.

**⚠️ 주의:** Pod는 직접 만들지 않습니다. Deployment가 Pod를 만들고 관리합니다.
Pod를 직접 만들면 죽었을 때 자동으로 복구되지 않습니다.

**이 플랫폼에서는:**
서비스 생성 → Deployment 생성 → Deployment가 Pod 자동 생성.
서비스 상세 페이지의 "파드 목록" 탭에서 현재 실행 중인 Pod를 확인할 수 있습니다.

**실제 YAML:**
```yaml
# 직접 만들 일은 없지만, 이런 구조입니다
apiVersion: v1
kind: Pod
metadata:
  name: my-api-service-7d9f8b-xxx
  namespace: my-api-service
spec:
  containers:
  - name: app
    image: harbor.foundrymtc.samsungds.net/sw-team/my-api:v1.2.3
    ports:
    - containerPort: 8080
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
```

---

### 3.2 Deployment

**한 줄 요약:** "Pod를 N개 유지하고, 업데이트는 무중단으로" 하는 관리자

**시각 다이어그램:**
```
  Deployment (목표: Pod 2개 유지)
  ┌─────────────────────────────────────────────┐
  │  ReplicaSet                                 │
  │  ┌──────────┐  ┌──────────┐                │
  │  │  Pod v1  │  │  Pod v1  │   ← 현재 실행  │
  │  └──────────┘  └──────────┘                │
  └─────────────────────────────────────────────┘

  코드 업데이트(v2 배포) 시 롤링 업데이트:
  ┌─────────────────────────────────────────────┐
  │  ┌──────────┐  ┌──────────┐                │
  │  │  Pod v1  │  │  Pod v2  │  ← v2 하나 뜨고│
  │  └──────────┘  └──────────┘                │
  │            ↓ v1 하나 죽임                  │
  │  ┌──────────┐  ┌──────────┐                │
  │  │  Pod v2  │  │  Pod v2  │  ← 완료        │
  │  └──────────┘  └──────────┘                │
  └─────────────────────────────────────────────┘
  → 서비스 중단 없이 교체 완료
```

**이 플랫폼에서는:**
리소스 사이즈 S/M/L 선택 → replicas 자동 설정 (S=1, M=2, L=3).
`git push` → 새 이미지 → Deployment가 자동으로 롤링 업데이트.

---

### 3.3 Service (ClusterIP / NodePort / LoadBalancer)

**한 줄 요약:** 항상 바뀌는 Pod IP 대신, 고정 주소로 트래픽을 전달하는 문

**시각 다이어그램:**
```
  문제: Pod는 재시작할 때마다 IP가 바뀜
  ┌──────────┐     ┌──────────┐
  │ Pod A    │     │ Pod B    │  → Pod 죽고 새 Pod는 다른 IP
  │10.1.1.5  │     │10.1.1.9  │
  └──────────┘     └──────────┘

  해결: Service가 고정 IP(ClusterIP)를 가지고 Pod로 분산
  
         Service (고정: 10.96.100.1)
              │
      ┌───────┴───────┐
      ▼               ▼
  ┌──────┐        ┌──────┐
  │Pod A │        │Pod B │   ← 로드밸런싱
  └──────┘        └──────┘
  
  Service 타입:
  ┌──────────────────────────────────────────────────────┐
  │ ClusterIP   : 클러스터 내부에서만 접근 가능 (기본값) │
  │ NodePort    : 노드의 특정 포트로 외부 접근 가능      │
  │ LoadBalancer: 클라우드 LB 연동 (사내에서는 Envoy)    │
  └──────────────────────────────────────────────────────┘
```

**이 플랫폼에서는:**
서비스 생성 시 ClusterIP 타입 Service 자동 생성.
외부 노출은 Service가 아닌 Envoy VirtualService가 담당합니다.
(`{서비스명}.swsol.samsungds.net` → Envoy → ClusterIP → Pod)

---

### 3.4 PV / PVC (영구 스토리지)

**한 줄 요약:** Pod가 죽어도 데이터가 살아남는 디스크

**시각 다이어그램:**
```
  PV (PersistentVolume): 실제 디스크 (관리자가 미리 만들어둠)
  ┌──────────────────────────────────┐
  │  PV: nfs-100gi                   │
  │  용량: 100Gi, 타입: NFS          │
  │  상태: Available                 │
  └──────────────────────────────────┘
            ▲ 연결(Binding)
  PVC (PersistentVolumeClaim): 개발자가 "이만큼 달라"고 요청하는 쿠폰
  ┌──────────────────────────────────┐
  │  PVC: my-app-data                │
  │  요청: 10Gi, ReadWriteOnce       │
  │  상태: Bound → nfs-100gi에 연결  │
  └──────────────────────────────────┘
            ▲ Pod가 마운트
  ┌──────────────────────────────────┐
  │  Pod                             │
  │  /data → PVC → PV → 실제 디스크 │
  │                                  │
  │  Pod 재시작해도 /data 데이터 유지 │
  └──────────────────────────────────┘
```

**StatefulSet vs Deployment:**
```
  Deployment + PVC: 모든 Pod가 같은 PVC 공유 (읽기 전용에 적합)
  StatefulSet     : Pod마다 독립된 PVC (DB처럼 각자 다른 데이터)
```

**이 플랫폼에서는:**
현재는 Stateless 서비스 기준 설계. 데이터는 외부 DB 연결로 처리.
PVC는 로그/파일 업로드가 필요한 서비스에서 외부 연결 탭으로 추가.

---

### 3.5 NetworkPolicy

**한 줄 요약:** Pod 간 트래픽을 허용/차단하는 방화벽 규칙

**시각 다이어그램:**
```
  NetworkPolicy 없을 때 (위험):
  ┌─────────────────────────────────────────────┐
  │  Namespace A          Namespace B           │
  │  ┌───────┐            ┌───────┐             │
  │  │ Pod A │ ←─────────▶│ Pod B │  모두 허용! │
  │  └───────┘            └───────┘             │
  └─────────────────────────────────────────────┘

  NetworkPolicy 적용 후 (안전):
  ┌─────────────────────────────────────────────────────────┐
  │  Namespace: my-api-service                              │
  │                                                         │
  │       ✅ Ingress 허용         ✅ Egress 허용            │
  │  Envoy ──▶ Pod              Pod ──▶ DNS(53)            │
  │  Prometheus ──▶ Pod:9090    Pod ──▶ DB:5432            │
  │                                                         │
  │       ❌ 차단                ❌ 차단                    │
  │  다른 NS ──▶ Pod (차단)     Pod ──▶ 인터넷 (차단)      │
  └─────────────────────────────────────────────────────────┘

  Ingress 규칙 = 들어오는 트래픽 제어
  Egress  규칙 = 나가는 트래픽 제어
```

**이 플랫폼에서는:**
서비스 생성 시 기본적으로 **모든 트래픽 차단** 후 필요한 것만 허용.
`/network` 탭에서 드래그·드롭으로 규칙 추가. 도메인 입력하면 IP 자동 변환.

---

### 3.6 RBAC (Role / RoleBinding)

**한 줄 요약:** "누가(Subject) 어떤 리소스(Resource)에 무엇을(Verb) 할 수 있나"

**시각 다이어그램:**
```
  3가지 요소:
  
  Subject (누가)          Role (뭘 할 수 있나)       리소스
  ┌──────────────┐        ┌──────────────────┐
  │ User: 홍길동 │        │ rules:           │       pods: get, list
  │ Group: 개발팀│──────▶ │ - pods: get,list │  →  deployments: patch
  │ SA: ci-bot  │        │ - deploy: patch  │       secrets: -
  └──────────────┘        └──────────────────┘
         │                        │
         └────────────────────────┘
                RoleBinding
           (Subject와 Role을 연결)

  Namespace 범위 vs 클러스터 범위:
  Role + RoleBinding       → 특정 Namespace만 적용
  ClusterRole + ClusterRoleBinding → 전체 클러스터 적용 (플랫폼 어드민만 사용)
```

**이 플랫폼에서는:**
`/rbac` 탭의 체크박스 테이블이 내부적으로 Role + RoleBinding을 생성/수정합니다.
`cluster-admin` ClusterRole 바인딩은 금지 (최소 권한 원칙).

---

### 3.7 Namespace

**한 줄 요약:** 같은 클러스터 안에서 팀/서비스를 격리하는 가상 구획

**시각 다이어그램:**
```
  K8s 클러스터 (물리 서버들)
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  ┌──────────────────────┐  ┌──────────────────────┐   │
  │  │  Namespace:          │  │  Namespace:          │   │
  │  │  sw-platform-team    │  │  data-team           │   │
  │  │                      │  │                      │   │
  │  │  Pod, Service,       │  │  Pod, Service,       │   │
  │  │  NetworkPolicy...    │  │  NetworkPolicy...    │   │
  │  │                      │  │                      │   │
  │  │  ResourceQuota:      │  │  ResourceQuota:      │   │
  │  │  CPU 20 / MEM 40Gi  │  │  CPU 10 / MEM 20Gi  │   │
  │  └──────────────────────┘  └──────────────────────┘   │
  │                                                         │
  │  ┌──────────────────────┐  ┌──────────────────────┐   │
  │  │  arc-systems         │  │  arc-runners-sw-team │   │
  │  │  (ARC 컨트롤러)       │  │  (빌드 Runner Pod)   │   │
  │  └──────────────────────┘  └──────────────────────┘   │
  └─────────────────────────────────────────────────────────┘

  이 플랫폼 규칙:
  - 테넌트(부서) 1개 = Namespace 1개 (리소스 쿼터 할당)
  - 서비스 1개 = Namespace 1개 (더 강한 격리)
```

---

### 3.8 HPA (HorizontalPodAutoscaler)

**한 줄 요약:** CPU/메모리 사용량에 따라 Pod 수를 자동으로 늘리고 줄임

**시각 다이어그램:**
```
  HPA 설정: min=2, max=10, CPU 목표=70%

  평상시 (CPU 30%):                 트래픽 급증 (CPU 90%):
  ┌──────┐ ┌──────┐                ┌──────┐ ┌──────┐ ┌──────┐
  │Pod   │ │Pod   │     →          │Pod   │ │Pod   │ │Pod   │
  │30%   │ │30%   │                │70%   │ │70%   │ │70%   │
  └──────┘ └──────┘                └──────┘ └──────┘ └──────┘
  2개 유지                          3개로 자동 확장

  트래픽 감소 (CPU 20%):
  ┌──────┐ ┌──────┐
  │Pod   │ │Pod   │     ← 다시 2개로 축소 (min 이하로 안 내려감)
  │20%   │ │20%   │
  └──────┘ └──────┘
```

**이 플랫폼에서는:**
`/resources` 탭 → HPA 섹션 → CPU 임계값 슬라이더로 설정.

---

### 3.9 ConfigMap / Secret

**한 줄 요약:** 코드 밖에서 설정값·비밀값을 주입하는 방법

**시각 다이어그램:**
```
  ConfigMap: 비민감 설정 (평문 저장)
  ┌────────────────────────────────────────┐
  │  LOG_LEVEL=INFO                        │
  │  SPRING_PROFILES_ACTIVE=prod           │
  │  DB_HOST=db.internal.samsungds.net     │
  └────────────────────────────────────────┘
           ↓ Pod의 환경변수로 주입
  
  Secret: 민감 정보 (base64 인코딩 저장, RBAC으로 접근 제한)
  ┌────────────────────────────────────────┐
  │  DB_PASSWORD=******* (base64)          │
  │  API_KEY=******* (base64)              │
  └────────────────────────────────────────┘
           ↓ Pod의 환경변수 or 파일로 주입

  주입 방식:
  env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: my-api-service-db-secret
        key: password
```

**이 플랫폼에서는:**
`/secrets` 탭에서 설정. UI에서 값 마스킹 처리. 변경 시 Pod 자동 재시작 옵션.

---

### 3.10 ExternalSecret

**한 줄 요약:** Vault·AWS Secrets Manager 같은 외부 저장소의 값을 K8s Secret으로 자동 동기화

**시각 다이어그램:**
```
  외부 Secret 저장소          K8s 클러스터
  ┌─────────────────┐         ┌──────────────────────────────┐
  │  Vault          │         │                              │
  │  secret/sw-team/│──sync──▶│  ExternalSecret (CRD)       │
  │    db/password  │  ↓ 1h   │     ↓ 자동 생성             │
  │                 │         │  K8s Secret                  │
  └─────────────────┘         │     ↓ 주입                  │
                              │  Pod 환경변수                │
                              └──────────────────────────────┘
  
  장점: 실제 비밀값이 Git에 저장되지 않음
        Vault에서 값 바꾸면 K8s Secret도 자동 갱신
```

---

### 3.11 CRD (CustomResourceDefinition)

**한 줄 요약:** K8s의 기본 리소스(Pod, Service 등) 외에 새로운 타입을 정의하는 확장 메커니즘

**시각 다이어그램:**
```
  K8s 기본 제공 리소스 (Built-in):
  Pod, Deployment, Service, ConfigMap, Secret, PVC ...

  CRD로 추가된 리소스 (이 플랫폼에서 사용 중):
  ┌─────────────────────────────────────────────────────┐
  │ VirtualService       (Istio/Envoy 라우팅 설정)      │
  │ ExternalSecret       (외부 시크릿 동기화)            │
  │ AutoscalingRunnerSet (GitHub ARC 러너 설정)         │
  │ Application          (ArgoCD 배포 대상 설정)        │
  │ ClusterPolicy        (Kyverno 정책)                 │
  └─────────────────────────────────────────────────────┘

  CRD를 설치한다 = "K8s에게 새로운 리소스 타입을 가르쳐줌"
  CRD 인스턴스 = "그 타입으로 실제 리소스 생성"
```

**이 플랫폼에서는:**
`/resources` 탭 → CRD 목록에서 조회·생성 가능.
플랫폼이 내부적으로 VirtualService, ExternalSecret, AutoscalingRunnerSet을 자동 생성.

---

## 4. UI 설계

### 4.1 페이지 구조

```
/learn                              ← 개념 학습 메인
/learn/concepts/pod
/learn/concepts/deployment
/learn/concepts/service
/learn/concepts/pvc
/learn/concepts/networkpolicy
/learn/concepts/rbac
/learn/concepts/namespace
/learn/concepts/hpa
/learn/concepts/configmap
/learn/concepts/externalsecret
/learn/concepts/crd
```

### 4.2 메인 페이지 (`/learn`)

```
┌─────────────────────────────────────────────────────────────────┐
│  K8s 개념 가이드                                                │
│  이 플랫폼이 내부에서 어떻게 동작하는지 이해해보세요           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [개념 관계 맵]  [카드 목록]  [학습 경로]                      │
│                                                                 │
│  ── 개념 관계 맵 (D3.js 인터랙티브 그래프) ──────────────────  │
│                                                                 │
│  [Namespace]──포함──[Deployment]──만든다──[Pod]                │
│                          │                  │                  │
│               [Service(ClusterIP)]      [PVC]──연결──[PV]     │
│                          │                                     │
│               [NetworkPolicy]                                  │
│                                                                 │
│  노드 클릭 → 우측 패널에 개념 설명 표시                        │
│                                                                 │
│  ── 학습 경로 (추천 순서) ────────────────────────────────────  │
│                                                                 │
│  초급: Namespace → Pod → Deployment → Service → ConfigMap/Secret│
│  중급: NetworkPolicy → PV/PVC → RBAC → HPA                    │
│  고급: CRD → ExternalSecret → VirtualService → ARC             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 개념 상세 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 개념 목록   Deployment                  [플랫폼에서 보기 →] │
├─────────────────────────────────────────────────────────────────┤
│  Pod를 N개 유지하고, 업데이트는 무중단으로 하는 관리자          │
├────────────────────────┬────────────────────────────────────────┤
│  시각 다이어그램       │  이 플랫폼에서의 역할                  │
│                        │                                        │
│  [SVG 애니메이션]      │  서비스 생성 시 자동 생성됩니다.       │
│  (롤링 업데이트 과정  │  리소스 사이즈 S/M/L →                  │
│   시각화)              │  replicas 1/2/3 자동 매핑              │
│                        │                                        │
│                        │  git push → 새 이미지 → 자동           │
│                        │  롤링 업데이트 (무중단)                │
├────────────────────────┴────────────────────────────────────────┤
│  개념 설명                                                      │
│  ...                                                            │
├─────────────────────────────────────────────────────────────────┤
│  실제 생성되는 YAML                          [복사] [접기]      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ apiVersion: apps/v1                                       │  │
│  │ kind: Deployment                                          │  │
│  │ ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  관련 개념                                                      │
│  [Pod →]  [Service →]  [HPA →]  [ReplicaSet →]                 │
├─────────────────────────────────────────────────────────────────┤
│  ← 이전: Namespace          다음: Service →                     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 컨텍스트 힌트 (각 설정 화면에 인라인 표시)

플랫폼 UI 어디서든 `[?]` 아이콘 클릭 → 우측에서 슬라이드 패널 열림:

```
  서비스 생성 Wizard Step 2:

  리소스 사이즈 *                              [?]
  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
  │    S     │  │    M     │  │    L     │     │ → 슬라이드오버
  └──────────┘  └──────────┘  └──────────┘     │    패널 오픈
                                                ▼
                              ┌─────────────────────────┐
                              │ 리소스 사이즈란?         │
                              │                         │
                              │ CPU와 메모리 제한을     │
                              │ 설정합니다. K8s에서는   │
                              │ resources.requests와    │
                              │ resources.limits로      │
                              │ 표현합니다.             │
                              │                         │
                              │ [자세히 보기 →]         │
                              └─────────────────────────┘

  NetworkPolicy 편집기:
  규칙 추가 [?] → NetworkPolicy 개념 슬라이드오버
  
  RBAC 매트릭스:
  "pods: get" [?] → "get 동사는 단일 Pod 조회를 허용합니다" 툴팁
```

---

## 5. 컴포넌트 설계

```
components/learn/
├── ConceptMap.tsx              # D3.js 인터랙티브 관계 그래프
├── ConceptCard.tsx             # 개념 목록 카드
├── ConceptDetail.tsx           # 개념 상세 페이지 레이아웃
├── ConceptDiagram.tsx          # SVG 다이어그램 (개념별 분기)
├── YamlExampleBlock.tsx        # 신택스 하이라이팅 + 복사 버튼
├── LearningPath.tsx            # 초급/중급/고급 경로
├── ContextHint.tsx             # [?] 버튼 + 슬라이드오버 패널
└── diagrams/                   # 개념별 SVG 다이어그램
    ├── PodDiagram.tsx
    ├── DeploymentDiagram.tsx   # 롤링 업데이트 애니메이션
    ├── ServiceDiagram.tsx
    ├── NetworkPolicyDiagram.tsx
    ├── PvcDiagram.tsx
    └── RbacDiagram.tsx
```

---

## 6. 데이터 구조

```typescript
// types/concepts.ts

interface Concept {
  id: string                    // "pod", "deployment", "service"
  name: string                  // "Pod"
  emoji: string                 // "📦"
  summary: string               // 한 줄 요약
  description: string           // 상세 설명 (마크다운)
  level: 'beginner' | 'intermediate' | 'advanced'
  platformRole: string          // 이 플랫폼에서의 역할 설명
  yamlExample: string           // 실제 YAML 예시
  relatedConcepts: string[]     // 관련 개념 ID
  platformPath?: string         // "/projects/[name]/network" 등
}

// 개념 관계 (ConceptMap 그래프용)
interface ConceptRelation {
  from: string
  to: string
  label: string                 // "포함", "참조", "만든다"
  type: 'contains' | 'references' | 'creates' | 'controls'
}
```

---

## 7. 구현 우선순위 (Phase 7 내 순서)

```
7-1. 정적 콘텐츠 먼저
     - /learn 페이지 + 카드 목록 (개념별 텍스트 + 간단한 SVG)
     - ConceptDetail 페이지 (11개 개념 각각)
     - ContextHint [?] 버튼 (Wizard + NetworkPolicy 편집기에 먼저 적용)

7-2. 인터랙티브 추가
     - D3.js 개념 관계 맵 (ConceptMap.tsx)
     - 롤링 업데이트 애니메이션 (DeploymentDiagram.tsx)
     - NetworkPolicy 트래픽 흐름 애니메이션

7-3. 플랫폼 연동
     - "플랫폼에서 보기 →" 링크 연결
     - 실제 내 서비스의 Deployment YAML을 개념 설명에 바로 표시
       ("홍길동님의 my-api-service Deployment는 이렇게 생겼습니다")
```

---

## 8. 외부 참고 링크 (구현 시 참조)

| 개념 | 공식 문서 | 비고 |
|------|-----------|------|
| Pod | https://kubernetes.io/docs/concepts/workloads/pods/ | |
| Deployment | https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ | |
| Service | https://kubernetes.io/docs/concepts/services-networking/service/ | |
| NetworkPolicy | https://kubernetes.io/docs/concepts/services-networking/network-policies/ | |
| PV/PVC | https://kubernetes.io/docs/concepts/storage/persistent-volumes/ | |
| RBAC | https://kubernetes.io/docs/reference/access-authn-authz/rbac/ | |
| HPA | https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/ | |
| CRD | https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/ | |

> 사내 폐쇄망 환경: 외부 링크 직접 접근 불가. 개념 설명은 플랫폼 내에 자체 포함.
