.PHONY: dev dev-build dev-down logs test test-unit test-integration test-e2e test-coverage lint lint-fix typecheck format db-migrate db-reset db-seed db-studio clean help

# ===========================================
# Development
# ===========================================

dev: ## Start development environment (Docker)
	docker compose up

dev-build: ## Rebuild and start development environment
	docker compose up --build

dev-down: ## Stop development environment
	docker compose down

logs: ## Show app logs
	docker compose logs -f app

# ===========================================
# Testing
# ===========================================

test: ## Run all tests
	npm run test

test-unit: ## Run unit tests
	npm run test:unit

test-integration: ## Run integration tests
	npm run test:integration

test-e2e: ## Run E2E tests (requires running app)
	npm run test:e2e

test-coverage: ## Run tests with coverage report
	npm run test:coverage

# ===========================================
# Code Quality
# ===========================================

lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues automatically
	npm run lint -- --fix

typecheck: ## Run TypeScript type check
	npx tsc --noEmit

format: ## Format code with Prettier
	npx prettier --write .

# ===========================================
# Database
# ===========================================

db-migrate: ## Run pending migrations
	npx prisma migrate dev

db-reset: ## Reset database (dev only)
	npx prisma migrate reset

db-seed: ## Seed database with test data
	npx prisma db seed

db-studio: ## Open Prisma Studio (DB GUI)
	npx prisma studio

db-generate: ## Generate Prisma client
	npx prisma generate

# ===========================================
# Production
# ===========================================

build: ## Build production Docker image
	docker build --target runner -t sos:latest .

build-prod: ## Build with docker compose prod
	docker compose -f docker compose.prod.yml build

prod-up: ## Start production environment
	docker compose -f docker compose.prod.yml up -d

prod-down: ## Stop production environment
	docker compose -f docker compose.prod.yml down

prod-logs: ## View production logs
	docker compose -f docker compose.prod.yml logs -f

prod-migrate: ## Run DB migrations in production
	docker compose -f docker compose.prod.yml exec app npx prisma migrate deploy

# ===========================================
# Cleanup
# ===========================================

clean: ## Remove build artifacts and containers
	docker compose down -v
	rm -rf .next coverage playwright-report

# ===========================================
# Help
# ===========================================

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
