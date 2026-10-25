# Build from the repository root, where the uv workspace and its lockfile live:
#   docker build -f skill-sync-backend/Dockerfile .
FROM python:3.12-slim

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
