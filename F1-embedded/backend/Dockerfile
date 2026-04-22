# ── Base image ────────────────────────────────────────────────────────────────
# Use a slim Python 3.11 image; TF 2.x works well with 3.11
FROM python:3.11-slim

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# Create the models directory in case it doesn't exist
RUN mkdir -p models

# ── Hugging Face Spaces requires port 7860 ────────────────────────────────────
EXPOSE 7860

# ── Launch ────────────────────────────────────────────────────────────────────
# Use 0.0.0.0 so the container is reachable externally
# Port 7860 is mandatory for HF Spaces Docker SDK
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
