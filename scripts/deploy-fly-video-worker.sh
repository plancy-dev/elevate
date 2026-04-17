#!/usr/bin/env sh
# Deploy the Elevate video assembly worker to Fly.io (from repo root).
# Prerequisites: flyctl installed (`brew install flyctl`), `fly auth login`, app created if first time.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v fly >/dev/null 2>&1; then
  echo "Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/" >&2
  exit 1
fi

echo "Deploying worker using fly.toml (dockerfile: workers/video-assembly/Dockerfile)..."
fly deploy

echo "Done. Set secrets if not already:"
echo "  fly secrets set SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... CONTENT_STORAGE_BUCKET=..."
echo "Optional: WORKER_POLL_IDLE_MS=2500"
