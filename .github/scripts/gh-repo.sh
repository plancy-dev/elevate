#!/usr/bin/env bash
# Prints owner/repo for the current directory (requires gh, auth).
set -euo pipefail
cd "$(dirname "$0")/../.."
gh repo view --json nameWithOwner -q .nameWithOwner
