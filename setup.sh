#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

python3 -m venv "$ROOT/db_utils/.venv"
"$ROOT/db_utils/.venv/bin/pip" install -r "$ROOT/db_utils/requirements.txt"

python3 -m venv "$ROOT/api/.venv"
"$ROOT/api/.venv/bin/pip" install -r "$ROOT/api/requirements.txt"

npm --prefix "$ROOT/website" install

docker compose -f "$ROOT/docker-compose.yml" up -d postgres
ready=false
for _ in {1..30}; do
  if docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
    pg_isready -U oeis -d oeis >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done

if [ "$ready" != true ]; then
  echo "postgres did not become ready in time" >&2
  exit 1
fi

"$ROOT/db_utils/.venv/bin/python" "$ROOT/db_utils/load_oeis.py"
