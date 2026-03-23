# PowerShell script to build, push, and deploy Docker image to Google Cloud Run
# Usage: Run this script from project root

$IMAGE_NAME = "gcr.io/sentient-ai-browser/sentient-ai-browser:latest"
$SERVICE_NAME = "sentient-ai-browser"
$REGION = "us-central1"
$DOCKERFILE = "functions/Dockerfile"
$CONTEXT = "."

# Build Docker image (specify Dockerfile and context)
docker build -f $DOCKERFILE -t $IMAGE_NAME $CONTEXT
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed. Exiting."
    exit 1
}

# Push image to GCR
docker push $IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed. Exiting."
    exit 1
}

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME --image $IMAGE_NAME --platform managed --region $REGION
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Run deploy failed. Exiting."
    exit 1
}

Write-Host "Deployment to Cloud Run completed successfully!"