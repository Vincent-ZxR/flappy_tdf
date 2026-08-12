---
name: gcp-deployer
description: "Use this skill when the user asks to deploy a Python web app (FastAPI/Uvicorn) to GCP Cloud Run with IAP, setup GCP deployment, or invokes /gcp-deployer."
user-invocable: true
---

# GCP Deployer Skill

## When to Use This Skill
Use this skill when the user asks to "deploy this app", "setup GCP deployment", or explicitly invokes `/gcp-deployer`. It is designed to scaffold infrastructure for Python applications using gcloud commands in accordance with best practices and strict rules. The skill details the steps to follow.


# Deploy a Python Web App (FastAPI) to GCP Cloud Run with IAP

Clean, repeatable procedure to deploy a folder containing `app.py` +
`requirements.txt` to **Cloud Run** (built via **Cloud Build** + **Artifact
Registry**) and protect it with **Identity-Aware Proxy (IAP)** for a defined
list of authorized users.

---

## 0. Prerequisites — check gcloud & components first

Run these **before anything else**. IAP commands require the `beta` component.

```powershell
# Allow the gcloud wrapper to run in this PowerShell session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# gcloud must be installed and authenticated
gcloud --version
gcloud auth list --filter=status:ACTIVE --format="value(account)"

# Ensure the beta component is installed (required for IAP commands)
$hasBeta = gcloud components list --format="value(id,state.name)" 2>$null |
  Select-String -Pattern '^beta\s+Installed'
if (-not $hasBeta) {
    Write-Host "Installing gcloud 'beta' component..."
    gcloud components install beta --quiet
} else {
    Write-Host "gcloud 'beta' component already installed."
}
```

---

## 1. Configuration

Set these once per terminal. Resource names must be lowercase with hyphens
(no underscores).

```powershell
$PROJECT_ID   = "g-20251029-319565614788"
$REGION       = "europe-west9"
$SERVICE_NAME = "flappy-h2"                                       # app/service name (no underscores)
$REPO         = "$SERVICE_NAME-repo"
$BUCKET       = "gs://$PROJECT_ID-$SERVICE_NAME-storage"
$BUILD_SA     = "lzi-build-cf@$PROJECT_ID.iam.gserviceaccount.com"
$RUNTIME_SA   = "lzi-fw-rules-euwe1@$PROJECT_ID.iam.gserviceaccount.com"
$IMAGE        = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE_NAME:latest"

# Restricted list of users authorized through IAP
$AUTHORIZED_USERS = @(
    "hubert.lam@airliquide.com",
    "guillaume.chambaret@airliquide.com"
)
```

---

## 2. Files to create in the app folder

### `Dockerfile`
```dockerfile
# Use official lightweight Python image
FROM python:3.11-slim
# Prevent Python from writing .pyc files & enable unbuffered logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy application files
COPY . .
# Expose port (Cloud Run sets PORT environment variable dynamically)
ENV PORT=8080
EXPOSE 8080
# Command to run application using uvicorn
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
```

### `cloudbuild.yaml`
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'europe-west9-docker.pkg.dev/${PROJECT_ID}/${_APP_NAME}-repo/${_APP_NAME}:latest', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'europe-west9-docker.pkg.dev/${PROJECT_ID}/${_APP_NAME}-repo/${_APP_NAME}:latest']
images:
  - 'europe-west9-docker.pkg.dev/${PROJECT_ID}/${_APP_NAME}-repo/${_APP_NAME}:latest'
substitutions:
  _APP_NAME: 'flappy-h2'
options:
  logging: CLOUD_LOGGING_ONLY
```

### `.dockerignore`
```
__pycache__/
*.pyc
.git/
.gitignore
.venv/
venv/
*.md
instructions.txt
```

---

## 3. Enable APIs
```powershell
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com `
  run.googleapis.com storage.googleapis.com iap.googleapis.com --project=$PROJECT_ID
```

## 4. Create Artifact Registry repo
```powershell
gcloud artifacts repositories describe $REPO --location=$REGION --project=$PROJECT_ID 2>$null `
  || gcloud artifacts repositories create $REPO --repository-format=docker `
       --location=$REGION --project=$PROJECT_ID --description="Docker repo for $SERVICE_NAME"
```

## 5. Create the GCS staging bucket
```powershell
gcloud storage buckets describe $BUCKET --format="value(name)" 2>$null `
  || gcloud storage buckets create $BUCKET --location=$REGION `
       --project=$PROJECT_ID --uniform-bucket-level-access
```

## 6. Build & push the image
```powershell
gcloud builds submit . --project=$PROJECT_ID --region=$REGION `
  --gcs-source-staging-dir="$BUCKET/source" --config=cloudbuild.yaml `
  --service-account="projects/$PROJECT_ID/serviceAccounts/$BUILD_SA"
```

## 7. Deploy to Cloud Run (private — IAP will guard access)
```powershell
gcloud run deploy $SERVICE_NAME --image=$IMAGE --region=$REGION --platform=managed `
  --port=8080 --service-account=$RUNTIME_SA --no-allow-unauthenticated --project=$PROJECT_ID
```

## 8. Configure IAP and authorize the user list
```powershell
# Provision the IAP service agent (P4SA)
gcloud beta services identity create --service=iap.googleapis.com --project=$PROJECT_ID

# Enable IAP on the Cloud Run service
gcloud beta run services update $SERVICE_NAME --region=$REGION --iap --project=$PROJECT_ID

# Grant access to each authorized user
foreach ($u in $AUTHORIZED_USERS) {
    gcloud beta iap web add-iam-policy-binding --resource-type=cloud-run `
      --service=$SERVICE_NAME --region=$REGION `
      --member="user:$u" --role=roles/iap.httpsResourceAccessor --project=$PROJECT_ID
}
```

## 9. Verify
```powershell
gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID `
  --format="value(status.url,status.conditions[0].status)"

gcloud beta iap web get-iam-policy --resource-type=cloud-run `
  --service=$SERVICE_NAME --region=$REGION --project=$PROJECT_ID
```

First access prompts a Google sign-in; only the listed users get through.
IAM/IAP changes can take a couple of minutes to propagate.

---

## Maintenance

**Update the authorized list** — edit `$AUTHORIZED_USERS`, then re-run Step 8's
loop (add) or use remove for revoked users:
```powershell
gcloud beta iap web remove-iam-policy-binding --resource-type=cloud-run --service=$SERVICE_NAME `
  --region=$REGION --member="user:SOMEONE@airliquide.com" --role=roles/iap.httpsResourceAccessor --project=$PROJECT_ID
```

**Redeploy after code changes** — re-run Step 6 (build) then Step 7 (deploy).
IAP settings persist across revisions.
