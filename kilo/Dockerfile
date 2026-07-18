# kilo/Dockerfile
# Plain Linux server image for Kilo (no Cloud Run, no GCP specifics).
# Kilo is a client that drives an OpenCode HTTP server. This image installs the
# OpenCode server so it runs on any Docker host. The client side needs no
# browser or ffmpeg — it talks to this server over plain HTTP/SSE.
FROM node:20-slim

# System deps for the OpenCode server (Chromium is only pulled by the optional
# server-side Playwright MCP, installed lazily on first use).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install the OpenCode CLI (provides `opencode serve`).
RUN npm install -g opencode

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || true

EXPOSE 4096
ENV KILO_SERVER_HOST=0.0.0.0
ENV KILO_SERVER_PORT=4096

# Lightweight: just the HTTP server. Kilo clients connect over the network.
CMD ["bash", "-c", "opencode serve --hostname ${KILO_SERVER_HOST} --port ${KILO_SERVER_PORT}"]
