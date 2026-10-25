# One Dockerfile for both services, built from the repository root where the uv and npm
# workspaces keep their lockfiles. docker compose picks the target for each service:
#   docker build --target backend -t skillsync-backend .
#   docker build --target frontend -t skillsync-frontend .

# ---- backend: FastAPI on uvicorn ---------------------------------------------------------
FROM python:3.12-slim AS backend

COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    HF_HOME=/data/hf-cache \
    CHROMA_DB_PATH=/data/chroma_db

# Install dependencies first so code changes do not invalidate this layer.
WORKDIR /build
COPY pyproject.toml uv.lock ./
COPY skill-sync-backend/pyproject.toml ./skill-sync-backend/
RUN uv sync --frozen --no-dev

WORKDIR /app
COPY skill-sync-backend/app ./app
COPY skill-sync-backend/scripts ./scripts

RUN useradd --create-home --uid 1000 skillsync \
    && mkdir -p /data /app/app/public/resumes \
    && chown -R skillsync /data /app/app/public/resumes
USER skillsync

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/healthcheck')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---- frontend: Vite build served by nginx -----------------------------------------------
FROM node:26-alpine AS frontend-build

WORKDIR /repo
COPY package.json package-lock.json ./
COPY skill-sync-frontend/package.json ./skill-sync-frontend/
RUN npm ci --no-audit --no-fund

COPY skill-sync-frontend/index.html skill-sync-frontend/vite.config.js ./skill-sync-frontend/
COPY skill-sync-frontend/public ./skill-sync-frontend/public
COPY skill-sync-frontend/src ./skill-sync-frontend/src

# Vite bakes VITE_* values into the bundle at build time.
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build -w skill-sync-frontend

FROM nginx:1.27-alpine AS frontend

COPY skill-sync-frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /repo/skill-sync-frontend/build /usr/share/nginx/html

EXPOSE 80
