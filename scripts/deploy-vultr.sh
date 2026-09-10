#!/usr/bin/env bash
# ==============================================================================
# Louisville Bats - Road to the Bats
# Automated Vultr Cloud Deployment Script
# ==============================================================================

set -euo pipefail

echo "⚾ ======================================================="
echo "⚾ Deploying 'Road to the Bats' to Vultr Cloud Compute"
echo "⚾ ======================================================="

# Check for required target host argument or environment variable
VULTR_SERVER_IP="${1:-${VULTR_SERVER_IP:-}}"
VULTR_SSH_USER="${2:-${VULTR_SSH_USER:-root}}"

if [ -z "$VULTR_SERVER_IP" ]; then
  echo "⚠️  Usage: ./scripts/deploy-vultr.sh <VULTR_SERVER_IP> [SSH_USER]"
  echo "   Or set the VULTR_SERVER_IP environment variable."
  echo ""
  echo "👉 Need to create an instance first? Follow the steps in 'vultr-deploy-guide.md'."
  exit 1
fi

echo "🚀 Target Host: ${VULTR_SSH_USER}@${VULTR_SERVER_IP}"

# Step 1: Check SSH Connectivity
echo "📡 Checking SSH connection to Vultr instance..."
ssh -o BatchMode=yes -o ConnectTimeout=5 "${VULTR_SSH_USER}@${VULTR_SERVER_IP}" "echo '✅ Connection verified!'"

# Step 2: Ensure Docker & Docker Compose are installed on remote host
echo "🐳 Verifying Docker on Vultr instance..."
ssh "${VULTR_SSH_USER}@${VULTR_SERVER_IP}" bash -c "'
  if ! command -v docker &> /dev/null; then
    echo \"Installing Docker...\"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
  fi
'"

# Step 3: Bundle and transfer project files
echo "📦 Packaging project files..."
TMP_ARCHIVE="/tmp/road-to-the-bats-deploy.tar.gz"
tar --exclude="node_modules" --exclude=".git" --exclude="*.log" -czf "$TMP_ARCHIVE" -C "$(dirname "$0")/.." .

echo "📤 Uploading package to Vultr instance..."
scp "$TMP_ARCHIVE" "${VULTR_SSH_USER}@${VULTR_SERVER_IP}:/tmp/deploy.tar.gz"
rm -f "$TMP_ARCHIVE"

# Step 4: Extract and launch with Docker on remote host
echo "🚀 Building container and starting game server on Vultr..."
ssh "${VULTR_SSH_USER}@${VULTR_SERVER_IP}" bash -c "'
  mkdir -p /opt/road-to-the-bats
  tar -xzf /tmp/deploy.tar.gz -C /opt/road-to-the-bats
  rm -f /tmp/deploy.tar.gz
  cd /opt/road-to-the-bats
  
  docker compose down || true
  docker compose up -d --build
  
  echo \"⏳ Waiting for health check...\"
  sleep 5
  curl -s http://localhost:3000/api/health || true
'"

echo ""
echo "🎉 ======================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "🎉 Game is LIVE at: http://${VULTR_SERVER_IP}:3000"
echo "🎉 Health endpoint: http://${VULTR_SERVER_IP}:3000/api/health"
echo "🎉 Stadium QR Code Target: http://${VULTR_SERVER_IP}:3000"
echo "🎉 ======================================================="
