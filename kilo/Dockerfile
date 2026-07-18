# kilo/Dockerfile
# Plain Linux server image for Kilo (no Cloud Run, no GCP specifics).
# Kilo is a client that drives an OpenCode HTTP server. This image installs the
# OpenCode server + Playwright Chromium and runs `opencode serve` so the whole
# stack runs on any Docker host.
FROM node:20-slim

# System deps for Chromium (Playwright MCP + live-video recording).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg \
      libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
      libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
      libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install the OpenCode CLI (provides `opencode serve`).
RUN npm install -g opencode

# Playwright Chromium for the inner MCP browser + live video.
RUN npx -y playwright@latest install --with-deps chromium || \
    npx -y playwright@latest install chromium

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || true

EXPOSE 4096
ENV KILO_SERVER_HOST=0.0.0.0
ENV KILO_SERVER_PORT=4096

# Lightweight: just the HTTP server. Kilo clients connect over the network.
CMD ["bash", "-c", "opencode serve --hostname ${KILO_SERVER_HOST} --port ${KILO_SERVER_PORT}"]
