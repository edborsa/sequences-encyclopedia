# Sequences Encyclopedia

Minimal OEIS browser with a Flask API and a Next.js website.

## Requirements
- Docker
- Python
- NodeJS/NPM

## Setup

Install dependencies and load data:

```sh
./setup.sh
```

Run the app:

```sh
./dev-run.sh
```

Open `http://localhost:3053`.

The API runs on `http://localhost:5053`. Postgres runs in Docker on host port `5433`.

## Search

The homepage has a search bar that filters sequences by name or OEIS id. The backend exposes the same behavior:

- `GET /sequences` — first 200 rows ordered by name.
- `GET /sequences?q=<term>` — case-insensitive substring match on `name` and `oeis_id`. Searching `001055` is treated the same as `A001055` for prefix ranking, so id prefixes float to the top.
- `GET /sequences/<oeis_id>` — single row by id.

## Tests

The backend suite hits real Postgres (it skips with a clear message when `DATABASE_URL` is unreachable).

```sh
api/.venv/bin/pytest                    # backend, with 100% coverage gate
npm --prefix website run test           # frontend (vitest, no DOM)
npm --prefix website run typecheck      # tsc --noEmit
npm --prefix website run lint           # eslint
npm --prefix website run format:check   # prettier --check .
```
