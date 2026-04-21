#!/usr/bin/env bash
# Sync Geist font .woff2 files from node_modules/geist into public/fonts/geist/.
# Run after bumping the `geist` npm package version.
#
# Usage:
#   pnpm install       # make sure geist is resolved in node_modules
#   bash scripts/sync-geist-fonts.sh
#
# Exit codes:
#   0 — success
#   1 — `geist` package not found in node_modules

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_SANS="$ROOT/node_modules/geist/dist/fonts/geist-sans"
SRC_MONO="$ROOT/node_modules/geist/dist/fonts/geist-mono"
SRC_LICENSE="$ROOT/node_modules/geist/LICENSE.txt"
DEST="$ROOT/public/fonts/geist"

if [[ ! -d "$SRC_SANS" || ! -d "$SRC_MONO" ]]; then
  echo "error: geist font sources missing under node_modules/geist/dist/fonts/" >&2
  echo "run \`pnpm install\` first." >&2
  exit 1
fi

mkdir -p "$DEST/sans" "$DEST/mono"

echo "→ syncing Geist Sans .woff2"
rm -f "$DEST"/sans/*.woff2
cp "$SRC_SANS"/*.woff2 "$DEST/sans/"

echo "→ syncing Geist Mono .woff2"
rm -f "$DEST"/mono/*.woff2
cp "$SRC_MONO"/*.woff2 "$DEST/mono/"

if [[ -f "$SRC_LICENSE" ]]; then
  cp "$SRC_LICENSE" "$DEST/LICENSE.txt"
fi

GEIST_VERSION="$(node -p "require('./node_modules/geist/package.json').version" 2>/dev/null || echo unknown)"
SANS_COUNT=$(ls "$DEST/sans" | wc -l | tr -d ' ')
MONO_COUNT=$(ls "$DEST/mono" | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$DEST" | awk '{print $1}')

echo ""
echo "✓ Geist $GEIST_VERSION synced"
echo "  sans/: $SANS_COUNT files"
echo "  mono/: $MONO_COUNT files"
echo "  total: $TOTAL_SIZE"
