.PHONY: dev dev-down test-backend test-frontend lint-helm test-all build-backend build-frontend

# ─────────────────────────────────────────────────────────────────────────────
# 로컬 개발 환경
# ─────────────────────────────────────────────────────────────────────────────
dev:
	docker compose -f docker-compose.dev.yml up

dev-build:
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f backend

# ─────────────────────────────────────────────────────────────────────────────
# 백엔드
# ─────────────────────────────────────────────────────────────────────────────
test-backend:
	cd backend && pytest --cov=. -v

lint-backend:
	cd backend && ruff check . && mypy .

# ─────────────────────────────────────────────────────────────────────────────
# 프론트엔드
# ─────────────────────────────────────────────────────────────────────────────
test-frontend:
	cd frontend && npm test

build-frontend:
	cd frontend && npm run build

lint-frontend:
	cd frontend && npm run lint

# ─────────────────────────────────────────────────────────────────────────────
# Helm / K8s
# ─────────────────────────────────────────────────────────────────────────────
lint-helm:
	helm lint gitops/helm/base-service/

template-helm:
	helm template test-release gitops/helm/base-service/ \
		--set serviceName=my-service \
		--set tenantId=test-team \
		--set namespace=test-team \
		--set team=test-team \
		--set image.repository=harbor.foundrymtc.samsungds.net/test/my-service

# ─────────────────────────────────────────────────────────────────────────────
# 전체 테스트
# ─────────────────────────────────────────────────────────────────────────────
test-all: test-backend lint-helm
	cd frontend && npm test
