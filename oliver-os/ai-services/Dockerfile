# AI Services Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    cmake \
    curl \
    git \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies with optimizations
# Use --no-cache-dir to reduce image size
# Use --timeout to prevent hanging
# Upgrade pip, setuptools, wheel first
# Install dependencies in stages to avoid hanging on complex packages
RUN python -m pip install --upgrade --no-cache-dir pip setuptools wheel build && \
    echo "Installing core dependencies..." && \
    pip install --no-cache-dir --timeout=300 --retries=3 \
        fastapi==0.115.6 \
        uvicorn[standard]==0.32.1 \
        python-dotenv==1.0.1 \
        pydantic==2.10.3 \
        pydantic-settings==2.7.0 && \
    echo "Installing database dependencies..." && \
    pip install --no-cache-dir --timeout=300 --retries=3 \
        sqlalchemy==2.0.35 \
        redis==5.2.1 \
        psycopg2-binary==2.9.10 \
        asyncpg==0.30.0 && \
    echo "Installing HTTP and async dependencies..." && \
    pip install --no-cache-dir --timeout=300 --retries=3 \
        aiofiles==24.1.0 \
        requests==2.32.3 \
        httpx==0.27.2 \
        websockets==14.1 \
        python-multipart==0.0.20 && \
    echo "Installing AI/ML dependencies (this may take a while)..." && \
    pip install --no-cache-dir --timeout=600 --retries=5 \
        openai==1.58.1 \
        anthropic==0.40.0 \
        ollama==0.3.1 && \
    echo "Installing security dependencies..." && \
    pip install --no-cache-dir --timeout=300 --retries=3 \
        cryptography==44.0.0 \
        passlib[bcrypt]==1.7.4 && \
    echo "Installing utility dependencies..." && \
    pip install --no-cache-dir --timeout=300 --retries=3 \
        python-dateutil==2.9.0 \
        pytz==2024.2 && \
    echo "Installing LangChain dependencies..." && \
    pip install --no-cache-dir --timeout=600 --retries=5 \
        langchain==0.3.7 \
        langchain-community==0.3.7 && \
    echo "Installing vector store dependencies (this may take a while)..." && \
    pip install --no-cache-dir --timeout=900 --retries=5 \
        chromadb==0.5.15 \
        sentence-transformers==3.0.1 \
        qdrant-client==1.12.1 && \
    echo "Installing ML training dependencies (this may take a while)..." && \
    pip install --no-cache-dir --timeout=900 --retries=5 \
        peft==0.13.0 \
        datasets==3.0.2 \
        accelerate==1.0.1 && \
    echo "✅ All dependencies installed successfully"

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
