# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Runtime — official Playwright image has Chromium + system deps pre-installed
FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app

# Copy built output and deps from build stage
COPY --from=build /app/lib ./lib
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Ensure Chromium is installed for the exact Playwright version
RUN npx playwright install chromium

# Cloud Run injects PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "lib/proxy-server.js"]
