#!/usr/bin/env bash
set -e

cd /home/hubertlam/Projects/projectone

PROJECT_ID="g-20251029-319565614788"
REGION="europe-west9"
SERVICE_NAME="flappy-h2"
REPO="${SERVICE_NAME}-repo"
BUCKET="gs://${PROJECT_ID}-${SERVICE_NAME}-storage"
BUILD_SA="lzi-build-cf@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="lzi-fw-rules-euwe1@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}:latest"

AUTHORIZED_USERS=(
    "hubert.lam@airliquide.com"
    "guillaume.chambaret@airliquide.com"
    "liticia.touzari@airliquide.com"
    "mathilde.guillemot@airliquide.com"
    "marc.nabhan@airliquide.com"
    "benjamin.le-creurer@airliquide.com"
    "sebastien.leonard@airliquide.com"
    "afef.salhi@airliquide.com"
    "ines.neves@airliquide.com"
    "nicolas.abergel@airliquide.com"
    "sylvain.ledur@airliquide.com"
    "vincent.ren@airliquide.com"
    "ismail.lemrabti@airliquide.com"
    "thomas.roustan@airliquide.com"
)

echo "=== 1. Activer les APIs GCP ==="
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com \
  run.googleapis.com storage.googleapis.com iap.googleapis.com --project="${PROJECT_ID}"

echo "=== 2. Créer le dépôt Artifact Registry ==="
gcloud artifacts repositories describe "${REPO}" --location="${REGION}" --project="${PROJECT_ID}" 2>/dev/null \
  || gcloud artifacts repositories create "${REPO}" --repository-format=docker \
       --location="${REGION}" --project="${PROJECT_ID}" --description="Docker repo for ${SERVICE_NAME}"

echo "=== 3. Créer le bucket GCS de staging ==="
gcloud storage buckets describe "${BUCKET}" --format="value(name)" 2>/dev/null \
  || gcloud storage buckets create "${BUCKET}" --location="${REGION}" \
       --project="${PROJECT_ID}" --uniform-bucket-level-access

echo "=== 3b. Accorder les permissions GCS au compte de service Cloud Run ==="
gcloud storage buckets add-iam-policy-binding "${BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectAdmin" --project="${PROJECT_ID}" 2>/dev/null || true

echo "=== 4. Soumettre le build avec Cloud Build ==="
gcloud builds submit . --project="${PROJECT_ID}" --region="${REGION}" \
  --gcs-source-staging-dir="${BUCKET}/source" --config=cloudbuild.yaml \
  --service-account="projects/${PROJECT_ID}/serviceAccounts/${BUILD_SA}"

echo "=== 5. Déployer sur Cloud Run ==="
gcloud run deploy "${SERVICE_NAME}" --image="${IMAGE}" --region="${REGION}" --platform=managed \
  --port=8080 --service-account="${RUNTIME_SA}" --no-allow-unauthenticated --project="${PROJECT_ID}"

echo "=== 6. Configurer IAP et autoriser les utilisateurs ==="
gcloud beta services identity create --service=iap.googleapis.com --project="${PROJECT_ID}" || true
gcloud beta run services update "${SERVICE_NAME}" --region="${REGION}" --iap --project="${PROJECT_ID}"

for u in "${AUTHORIZED_USERS[@]}"; do
    echo "Autorisation pour $u..."
    gcloud beta iap web add-iam-policy-binding --resource-type=cloud-run \
      --service="${SERVICE_NAME}" --region="${REGION}" \
      --member="user:$u" --role=roles/iap.httpsResourceAccessor --project="${PROJECT_ID}"
done

echo "=== 7. Vérification finale ==="
URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)")
echo "Application déployée avec succès !"
echo "URL : $URL"
