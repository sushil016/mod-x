#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root on the Azure Ubuntu VM after .env has been created.
if [[ ! -f compose.yml || ! -f .env ]]; then
  echo "Run this script from the repository root after creating .env from deploy/.env.production.example."
  exit 1
fi

docker compose config --quiet
docker compose up --build --detach --remove-orphans
docker compose ps
docker compose exec --no-TTY app node -e 'fetch("http://127.0.0.1:8080/health").then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))'
echo "Deployment is healthy. HTTPS will become available after the configured DOMAIN resolves to this VM."
