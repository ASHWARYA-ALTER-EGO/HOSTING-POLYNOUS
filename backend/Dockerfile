FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (curl needed for healthcheck)
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements FIRST (for Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create non-root user
RUN useradd -m -s /bin/bash polynous && chown -R polynous:polynous /app
USER polynous

# Expose port
EXPOSE 8000

# Health check (uses $PORT if set, else 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run
CMD ["/bin/sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]