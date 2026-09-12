#!/usr/bin/env bash
set -euo pipefail

VULTR_SERVER_IP="${1:-${VULTR_SERVER_IP:-}}"
VULTR_SSH_USER="${2:-${VULTR_SSH_USER:-root}}"
DEPLOY_REVISION="${GITHUB_SHA:-$(git rev-parse HEAD)}"
DEPLOY_REVISION="${DEPLOY_REVISION:0:12}"

if [[ -z "$VULTR_SERVER_IP" ]]; then
  echo "Usage: ./scripts/deploy-vultr.sh <VULTR_SERVER_IP> [SSH_USER]" >&2
  exit 1
fi

SSH_KEY_FILE="${VULTR_SSH_KEY_FILE:-${HOME}/.ssh/batyard_deploy}"
SSH_ARGS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=yes -i "$SSH_KEY_FILE")
DEPLOY_TARGET="${VULTR_SSH_USER}@${VULTR_SERVER_IP}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_ARCHIVE="$(mktemp -t bats-deploy.XXXXXX.tar.gz)"
REMOTE_ARCHIVE="/tmp/road-to-the-bats-${DEPLOY_REVISION}.tar.gz"
trap 'rm -f "$DEPLOY_ARCHIVE"' EXIT

echo "Checking ${VULTR_SSH_USER}@${VULTR_SERVER_IP}…"
ssh "${SSH_ARGS[@]}" "$DEPLOY_TARGET" "command -v docker >/dev/null && docker compose version >/dev/null"

echo "Packaging ${DEPLOY_REVISION}…"
tar --exclude='.git' --exclude='.env' --exclude='.vercel' --exclude='node_modules' --exclude='*.log' \
  -czf "$DEPLOY_ARCHIVE" -C "$PROJECT_ROOT" .

echo "Uploading release…"
scp "${SSH_ARGS[@]}" "$DEPLOY_ARCHIVE" "${DEPLOY_TARGET}:${REMOTE_ARCHIVE}"

echo "Building and starting release…"
ssh "${SSH_ARGS[@]}" "$DEPLOY_TARGET" bash -s -- "$DEPLOY_REVISION" < "$PROJECT_ROOT/scripts/deploy-vultr-remote.sh"

echo "Verifying public health endpoint…"
curl --fail --silent --show-error --retry 5 --retry-delay 2 \
  "http://${VULTR_SERVER_IP}/api/health" >/dev/null
echo "Vultr deployment ${DEPLOY_REVISION} is healthy: http://${VULTR_SERVER_IP}"
