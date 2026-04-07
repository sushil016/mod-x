#!/usr/bin/env bash
# scripts/setup-gcp.sh
# Run ONCE to set up GCP infrastructure for mod-me.
# Prerequisites: gcloud CLI installed + authenticated + billing enabled.
# Usage: bash scripts/setup-gcp.sh <YOUR_GCP_PROJECT_ID> <YOUR_GITHUB_REPO>
# Example: bash scripts/setup-gcp.sh dazzling-spirit-426406-m4 yourname/mod-me

set -euo pipefail

PROJECT="${1:?Usage: $0 <GCP_PROJECT_ID> <GITHUB_REPO e.g. user/repo>}"
REPO="${2:?Usage: $0 <GCP_PROJECT_ID> <GITHUB_REPO>}"
REGION="us-central1"
SERVICE="mod-me"
SA_NAME="mod-me-deployer"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

echo "▶ Setting project to $PROJECT"
gcloud config set project "$PROJECT"

# ── Enable required APIs ────────────────────────────────────────────────────
echo "▶ Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  --quiet

# ── Artifact Registry repo ──────────────────────────────────────────────────
echo "▶ Creating Artifact Registry repo..."
gcloud artifacts repositories create mod-me \
  --repository-format=docker \
  --location="$REGION" \
  --description="mod-me Docker images" \
  --quiet 2>/dev/null || echo "  (already exists)"

# ── Service Account for GitHub Actions ─────────────────────────────────────
echo "▶ Creating service account $SA_NAME..."
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="mod-me GitHub Actions deployer" \
  --quiet 2>/dev/null || echo "  (already exists)"

SA_EMAIL="$SA_NAME@$PROJECT.iam.gserviceaccount.com"

# Grant required roles
for ROLE in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet
done

# ── Workload Identity Federation (keyless auth from GitHub Actions) ─────────
echo "▶ Setting up Workload Identity Pool..."
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --location="global" \
  --display-name="GitHub Actions pool" \
  --quiet 2>/dev/null || echo "  (already exists)"

POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
  --location=global --format="value(name)")

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --quiet 2>/dev/null || echo "  (already exists)"

# Allow GitHub repo to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${REPO}" \
  --quiet

PROVIDER_ID=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
  --location=global --workload-identity-pool="$POOL_NAME" --format="value(name)")

# ── Create Secret Manager secrets (values set manually after this script) ───
echo "▶ Creating Secret Manager secrets..."
for SECRET in DATABASE_URL JWT_SECRET COOKIE_SECRET \
              GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET \
              REDIS_HOST REDIS_PORT REDIS_PASSWORD; do
  gcloud secrets create "$SECRET" --replication-policy="automatic" --quiet \
    2>/dev/null || echo "  $SECRET already exists"
done

# ── Cloud Run: grant Secret Manager access ──────────────────────────────────
# Cloud Run uses the Compute default SA by default — give it secret access too
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format="value(projectNumber)")
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

# ── Print GitHub Actions secrets to set ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ GCP setup complete. Add these to GitHub Actions secrets:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  GCP_PROJECT_ID                → $PROJECT"
echo "  GCP_SERVICE_ACCOUNT           → $SA_EMAIL"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER→ $PROVIDER_ID"
echo ""
echo "  Then fill Secret Manager values in GCP Console:"
echo "  https://console.cloud.google.com/security/secret-manager?project=$PROJECT"
echo ""
echo "  Also add the Cloud Run URL to:"
echo "    GOOGLE_CALLBACK_URL  → https://<your-url>/auth/google/callback"
echo "    CLIENT_URL           → https://<your-url>"
echo ""
echo "  Push to main to trigger first deploy."
