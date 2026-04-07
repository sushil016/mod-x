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

# ── Print GitHub Actions secrets to set ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ GCP setup complete. Add these to GitHub Actions secrets:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  ── GCP Infrastructure (3 secrets) ──"
echo "  GCP_PROJECT_ID                → $PROJECT"
echo "  GCP_SERVICE_ACCOUNT           → $SA_EMAIL"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER→ $PROVIDER_ID"
echo ""
echo "  ── App Secrets (set your actual values) ──"
echo "  DATABASE_URL                  → postgresql://user:pass@host/db?sslmode=require"
echo "  JWT_SECRET                    → $(openssl rand -hex 32)"
echo "  COOKIE_SECRET                 → $(openssl rand -hex 32)"
echo "  GOOGLE_CLIENT_ID              → (from GCP OAuth credentials)"
echo "  GOOGLE_CLIENT_SECRET          → (from GCP OAuth credentials)"
echo "  REDIS_HOST                    → (Upstash Redis endpoint, or leave blank)"
echo "  REDIS_PORT                    → 6379"
echo "  REDIS_PASSWORD                → (Upstash Redis password, or leave blank)"
echo ""
echo "  ── Set AFTER first deploy (you'll get the URL then) ──"
echo "  GOOGLE_CALLBACK_URL           → https://<your-cloud-run-url>/auth/google/callback"
echo "  CLIENT_URL                    → https://<your-cloud-run-url>"
echo ""
echo "  Push to main to trigger first deploy."
echo ""
echo "  Add GOOGLE_CALLBACK_URL to your Google OAuth app's authorized redirect URIs:"
echo "  https://console.cloud.google.com/apis/credentials?project=$PROJECT"
