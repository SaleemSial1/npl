#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO_URL="${NPL_AUCTION_SYNC_REPO:-https://github.com/footballarroyo/npl.git}"
WORKDIR="${NPL_AUCTION_SYNC_DIR:-$HOME/.npl-auction-sync}"
BRANCH="${NPL_AUCTION_SYNC_BRANCH:-main}"

mkdir -p "$(dirname "$WORKDIR")"

if [ ! -d "$WORKDIR/.git" ]; then
  rm -rf "$WORKDIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$WORKDIR"
fi

cd "$WORKDIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

npm run auction:sync

if git diff --quiet -- auction.html data/npl-auction-live.json; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) no auction changes"
  exit 0
fi

git config user.name "NPL Auction Sync Bot"
git config user.email "auction-sync@nplcricketleague.com"
git add auction.html data/npl-auction-live.json
git commit -m "Auto sync NPL auction live updates"
git push origin "$BRANCH"
