#!/usr/bin/env bash
set -euo pipefail

VULTR_HOST="root@155.138.146.221"
REMOTE_DIR="/opt/cupid/apps/backend"
LOCAL_DIR="$(cd "$(dirname "$0")/../apps/backend" && pwd)"

echo "==> Building backend locally..."
cd "$LOCAL_DIR"
npx tsc

echo "==> Syncing to Vultr..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  "$LOCAL_DIR/" "$VULTR_HOST:$REMOTE_DIR/"

echo "==> Installing production deps on Vultr..."
ssh "$VULTR_HOST" "cd $REMOTE_DIR && npm install --omit=dev"

echo "==> Restarting PM2..."
ssh "$VULTR_HOST" "pm2 restart shoulder-cupid"

echo "==> Verifying (waiting for server to boot)..."
sleep 5
STATUS=$(ssh "$VULTR_HOST" "curl -sf http://localhost:4000/api/presage/status" 2>&1) || true
if [ -n "$STATUS" ]; then
  echo "==> Backend is up! Presage status:"
  echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"
else
  echo "==> WARNING: Health check failed. Check logs:"
  echo "    ssh $VULTR_HOST 'pm2 logs shoulder-cupid --lines 20'"
fi

echo "==> Done."
