---
description: "Initialize and configure a Google Cloud project. Sets up IAM, enables required APIs, creates Artifact Registry, configures Secret Manager, and sets workload identity."
argument-hint: "GCP project ID and region"
agent: "agent"
tools: ["execute"]
---

# /gcloud_setup — GCP Project Setup

Ask for `GCP_PROJECT_ID` and `GCP_REGION` if not set.

```bash
# Set project
gcloud config set project $GCP_PROJECT_ID
gcloud config set compute/region $GCP_REGION

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com

# Create Artifact Registry
gcloud artifacts repositories create aidde-registry \
  --repository-format=docker \
  --location=$GCP_REGION \
  --description="AIDDE container registry" 2>/dev/null || echo "Registry exists"

# Create deploy service account (Principle of Least Privilege)
SA="aidde-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com"
gcloud iam service-accounts create aidde-deploy \
  --display-name="AIDDE Deploy SA" 2>/dev/null || echo "SA exists"

# Grant only required roles
for role in roles/run.developer roles/cloudbuild.builds.editor \
            roles/secretmanager.secretAccessor roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:$SA" --role="$role" --quiet
done

echo "✅ GCP project $GCP_PROJECT_ID configured"
echo "Service Account: $SA"
```

Report: project ID, region, SA email, APIs enabled.
