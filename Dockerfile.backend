# ==========================================
# Backend Service: Python 3.11 Slim
# ==========================================
FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY api/requirements.txt /app/api/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/api/requirements.txt

# Copy backend application source
COPY api /app/api

EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch Uvicorn server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]

