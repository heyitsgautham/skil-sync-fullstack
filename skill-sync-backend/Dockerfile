FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.5.14 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    HF_HOME=/data/hf-cache \
    CHROMA_DB_PATH=/data/chroma_db

WORKDIR /app

# Install dependencies first so code changes do not invalidate this layer.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app ./app
COPY scripts ./scripts

RUN useradd --create-home --uid 1000 skillsync \
    && mkdir -p /data /app/app/public/resumes \
    && chown -R skillsync /data /app/app/public/resumes
USER skillsync

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/healthcheck')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
