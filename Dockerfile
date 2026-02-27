# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY anc-frontend/package*.json ./
RUN npm install

COPY anc-frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY anc-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY anc-backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/build ./static

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
