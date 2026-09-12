#!/usr/bin/env bash
set -euo pipefail

DEPLOY_REVISION="${1:?deployment revision is required}"
APP_ROOT='/opt/road-to-the-bats'
RELEASE_DIR="${APP_ROOT}/releases/${DEPLOY_REVISION}"
ARCHIVE="/tmp/road-to-the-bats-${DEPLOY_REVISION}.tar.gz"

mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
rm -f "$ARCHIVE"

# Keep production configuration on the server; deployment archives exclude .env.
if [[ -f "${APP_ROOT}/.env" ]]; then
  cp "${APP_ROOT}/.env" "${RELEASE_DIR}/.env"
else
  touch "${RELEASE_DIR}/.env"
fi

cd "$RELEASE_DIR"
COMPOSE_PROJECT_NAME=road-to-the-bats docker compose up -d --build --remove-orphans

for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:3000/api/health >/dev/null; then
    ln -sfn "$RELEASE_DIR" "${APP_ROOT}/current"
    echo "Release ${DEPLOY_REVISION} is healthy."
    exit 0
  fi
  sleep 2
done

COMPOSE_PROJECT_NAME=road-to-the-bats docker compose logs --tail=100 bats-game
echo "Release failed its health check." >&2
exit 1
