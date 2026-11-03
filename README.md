# Connect Internationals

Stage 1: local foundation only. No student data is imported or exposed yet.

## Run in Docker

Docker Desktop must be running. From this directory:

```sh
docker compose -f docker-compose.dev.yml up -d --build
```

Open http://localhost:3000/connect. Both published ports bind to loopback.
The app uses Node 20 in Docker; the host Node installation is untouched.
PostgreSQL 16 stores data in the persistent `connect_pg_dev` Compose volume.
Do not remove the volume to troubleshoot startup. If ports 3000 or 5432 are
occupied, inspect the owning process before changing anything.

## Checks with the project runtime

```sh
docker run --rm -v "$PWD:/app" -w /app node:20-bookworm-slim npm ci
docker run --rm -v "$PWD:/app" -w /app node:20-bookworm-slim npm run typecheck
docker run --rm -v "$PWD:/app" -w /app node:20-bookworm-slim npm run lint
docker run --rm -v "$PWD:/app" -w /app -e NEXT_TELEMETRY_DISABLED=1 node:20-bookworm-slim npm run build
docker compose -f docker-compose.dev.yml config --quiet
```

For host development with a project runtime manager, select Node 20 using
`.nvmrc`, run `npm ci`, then `npm run dev -- -H 127.0.0.1`.
Copy `.env.example` to `.env` and set the host database URL to
`postgresql://connect:connect_dev@localhost:5432/connect_dev`.
Inside Compose the database hostname is `postgres`; Compose supplies this URL.
The example environment file contains no credentials. Compose credentials are
fixed local demo values from the mentor brief; never reuse them remotely.

## Scope and private inputs

Navigation opens honest placeholder pages for Discover, Requests, Messages,
Circles, Invite and Profile. There is no working persona switcher yet.
The repository, service, auth and Prisma directories establish boundaries for
Prompt 2; there is no schema, migration or seed importer at Stage 1.
Keep supplied source attachments and seed JSON in ignored `private/`.
They are excluded from Docker builds; future seeding must mount them at runtime.
No public deployment, external service, remote or push is configured.

See PROGRESS.md for actual checks and DESIGN.md for the required unsupported
Next.js 14 / EOL Node 20 lifecycle limitation. Upgrade before live deployment.
