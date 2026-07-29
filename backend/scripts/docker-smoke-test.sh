#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  docker compose down --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker compose config >/dev/null

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not reachable from this session." >&2
  echo "Make sure Docker is running and your user can access /var/run/docker.sock." >&2
  exit 1
fi

docker compose up --build -d

for attempt in {1..60}; do
  response="$(curl -fsS http://localhost:8080/hello 2>/dev/null || true)"

  if [ "$response" = "Hello Backend" ]; then
    echo "Docker smoke test passed: /hello returned expected response."
    exit 0
  fi

  if [ -n "$response" ]; then
    echo "Unexpected response from /hello: $response" >&2
    docker compose logs backend >&2
    exit 1
  fi

  sleep 2
done

echo "Backend did not become ready in time." >&2
docker compose ps >&2
docker compose logs backend >&2
exit 1
