#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point for scheduled research extraction. Publication is
# handled separately after reconciling tracker and timeline disagreements.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
npm run auction:sync
