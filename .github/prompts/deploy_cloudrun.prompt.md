---
description: "Build and deploy a service to Google Cloud Run using gcloud CLI and Cloud Build."
argument-hint: "Service name and optional image tag"
agent: "agent"
tools: ["execute", "read"]
---

# /deploy_cloudrun — Cloud Run Deploy Workflow

Delegate to `deploy-engineer` agent.

## Pre-Deploy Checks
```bash
gcloud config get project
echo "Region: $GCP_REGION"
[ -z "$GCP_PROJECT_ID" ] && echo "❌ GCP_PROJECT_ID not set" && exit 1
```

## Build Image
```bash
IMAGE="gcr.io/$GCP_PROJECT_ID/{service-name}:$(git rev-parse --short HEAD)"
gcloud builds submit --tag "$IMAGE"
```

## Deploy to Cloud Run
```bash
gcloud run deploy {service-name} \
  --image "$IMAGE" \
  --region $GCP_REGION \
  --platform managed \
  --no-allow-unauthenticated \
  --service-account $GCP_SERVICE_ACCOUNT \
  --set-env-vars "NODE_ENV=production"
```

## Verify
```bash
gcloud run services describe {service-name} \
  --region $GCP_REGION \
  --format "value(status.url)"
```

Report: service URL, image deployed, region.
