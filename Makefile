# SkillSync, a full-stack web application. `make help` lists the targets.

.PHONY: help install up down logs dev-api dev-web test lint typecheck format build seed

help:
	@grep -E "^[a-z-]+:.*## " $(MAKEFILE_LIST) | sed "s/:.*## /\t/"

install: ## Install the backend (uv) and frontend (npm) workspaces from their lockfiles
	uv sync --frozen
	npm ci

up: ## Build and start PostgreSQL, the API on :8000 and the web app on :3000 in Docker
	docker compose up --build -d --wait
	curl -fsS http://localhost:8000/api/healthcheck

down: ## Stop the Docker stack, keeping its volumes
	docker compose down

logs: ## Follow the Docker stack logs
	docker compose logs -f

dev-api: ## Run the API with reload on :8000, against DATABASE_URL in skill-sync-backend/.env
	cd skill-sync-backend && uv run uvicorn app.main:app --reload --port 8000

dev-web: ## Run the Vite dev server on :3000
	npm run dev

test: ## Run pytest and Vitest, both with coverage floors
	npm test

lint: ## Run ruff, ESLint and Prettier checks
	npm run lint

typecheck: ## Type-check the backend with mypy
	npm run typecheck

format: ## Format Python with ruff and the frontend with Prettier
	npm run format

build: ## Build the frontend bundle into skill-sync-frontend/build
	npm run build

seed: ## Add demo accounts, internships and resumes to the running Docker stack (uses SEED_PASSWORD)
	docker compose exec -T -e SEED_PASSWORD backend python scripts/seed_demo_data.py
