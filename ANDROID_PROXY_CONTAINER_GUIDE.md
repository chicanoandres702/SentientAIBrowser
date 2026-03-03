# AIDDE TRACE HEADER
# Android App Proxy Integration Guide
# Why: Ensure Android app exclusively utilizes GHCR-hosted Playwright + proxy container

## Proxy Container
- Built from `Dockerfile.playwright-proxy`
- Deployed to GitHub Container Registry (GHCR) via GitHub Actions
- Exposes ports 8080 (proxy API) and 9222 (browser debug)
- Image: `ghcr.io/<your-org-or-user>/<repo>/playwright-proxy:latest`

## Android App Integration
- Android app should connect to the proxy container via its public GHCR endpoint
- Use WebSocket, HTTP, or custom API to route browser automation requests
- Configure Android app to use the GHCR-hosted container URL exclusively

## Example Usage
- Set proxy URL in Android app config: `https://ghcr.io/<your-org-or-user>/<repo>/playwright-proxy:latest`
- All browser automation, screenshot, and workflow requests should be routed through this container

## CI/CD
- Container is built and pushed automatically on every main branch update
- Android app can be built in a container as well, but must use the proxy container for all browser/proxy logic

## Security
- Restrict access to GHCR image as needed (private/public)
- Use GitHub secrets for authentication in CI/CD

## Next Steps
- Validate Android app connectivity to proxy container
- Monitor and log all requests for audit and debugging
