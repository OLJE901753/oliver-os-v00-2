# AI Services Dockerfile
FROM python:3.12-slim

# Choose accelerator: "cpu" (default) for CI, "cuda" for local/prod with GPUs
ARG ML_ACCELERATOR=cpu
ENV ML_ACCELERATOR=${ML_ACCELERATOR}

# Set working directory
WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update
RUN apt-get install -y \
    gcc \
    g++ \
    make \
    cmake \
    curl \
    git \
    libffi-dev \
    libssl-dev \
    libpq-dev
RUN rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies with optimizations
# - Use --no-cache-dir to reduce image size
# - Lower verbosity to reduce CI logs
# - Avoid GPU/CUDA wheels in CI by installing CPU-only PyTorch when ML_ACCELERATOR=cpu
RUN python -m pip install --upgrade --no-cache-dir --disable-pip-version-check -q pip setuptools wheel build

# Conditionally install PyTorch
# CPU-only (CI): smaller wheels, no CUDA runtime downloads
# CUDA (local/prod): install CUDA wheels from the official PyTorch index
RUN if [ "$ML_ACCELERATOR" = "cpu" ]; then \
  python -m pip install -q --no-cache-dir --progress-bar off \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.9.0; \
else \
  python -m pip install -q --no-cache-dir --progress-bar off \
    --index-url https://download.pytorch.org/whl/cu121 \
    torch==2.9.0; \
fi

# Core web stack
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=300 --retries=3 \
    fastapi==0.115.6 \
    "uvicorn[standard]"==0.32.1 \
    python-dotenv==1.0.1 \
    pydantic==2.10.3 \
    pydantic-settings==2.7.0

# Database stack
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=300 --retries=3 \
    sqlalchemy==2.0.35 \
    redis==5.2.1 \
    psycopg2-binary==2.9.10 \
    asyncpg==0.30.0

# HTTP and async utilities
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=300 --retries=3 \
    aiofiles==24.1.0 \
    requests==2.32.3 \
    httpx==0.27.2 \
    websockets==14.1 \
    python-multipart==0.0.20

# AI/ML client libraries (non-heavy)
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=600 --retries=5 \
    openai==1.58.1 \
    anthropic==0.40.0 \
    ollama==0.3.1

# Security
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=300 --retries=3 \
    cryptography==44.0.0 \
    "passlib[bcrypt]"==1.7.4

# Utilities
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=300 --retries=3 \
    python-dateutil==2.9.0 \
    pytz==2024.2

# LangChain (kept separate for resolver stability)
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=600 --retries=5 \
    langchain==0.3.7 \
    langchain-community==0.3.7

# Vector stores and embeddings (pulls sentence-transformers which depends on torch)
# With torch pre-installed above (CPU-only in CI), heavy CUDA downloads are avoided
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=900 --retries=5 \
    chromadb==0.5.15 \
    sentence-transformers==3.0.1 \
    qdrant-client==1.12.1

# Training stack (optional but included; relies on CPU torch in CI)
RUN python -m pip install -q --no-cache-dir --progress-bar off --timeout=900 --retries=5 \
    peft==0.13.0 \
    datasets==3.0.2 \
    accelerate==1.0.1

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
# Start FastAPI server with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
