# Connect Internationals

Maxi: this local prototype implements profiles/discovery, introductions and
accepted chat, circles/invitations, and safety controls through Stage 6. Stage 7
adds the design and demo handoff; Stage 8 verifies the browser journeys and repairs
keyboard dialogs. Start with [DESIGN.md](DESIGN.md) and the
[3–5-minute walkthrough](DEMO.md). No real login, email, payments or AWS integration
is enabled. Identity, profile enrichment and consent are explicitly simulated.

## Run locally with Docker (recommended)

Prerequisites: Docker Desktop running, Docker Compose **2.24.4 or newer** (the
optional reproduction override uses [`!override`](https://docs.docker.com/reference/compose-file/merge/#replace-value)), Git, ports 3000 and 5432 free,
and the supplied 925-record seed. No host Node installation is required. The
containers use Node 20, Next 14, TypeScript, Tailwind 3, Prisma 5 and PostgreSQL 16.
This compatibility stack needs a supported-version/security upgrade before deployment.

From the repository root, create `private/` and place Maxi's separately supplied
file at **`private/connect_seed_users.json`**. Obtain it through an authorized
private channel. Do not substitute a public export. Do not put it in `public/`,
commit it, upload it, or include `private/`, `.env*`, database dumps or volumes in
an archive. Git/Docker exclusions protect these paths; the tools container mounts
the private input read-only at runtime. The app image never receives that mount.

```sh
# Check Docker and configuration first.
docker version
docker compose version
docker compose -f docker-compose.dev.yml config --quiet
# Presence only: do not print the file.
test -f private/connect_seed_users.json

docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml build tools
docker compose -f docker-compose.dev.yml run --rm tools npm ci
docker compose -f docker-compose.dev.yml run --rm tools npm run db:generate
docker compose -f docker-compose.dev.yml run --rm tools npm run db:migrate
docker compose -f docker-compose.dev.yml run --rm tools npm run db:circles
docker compose -f docker-compose.dev.yml run --rm tools npm run db:seed
docker compose -f docker-compose.dev.yml up -d --build app
```

Open **http://localhost:3000/connect**. Use `localhost`, matching `DEMO_ORIGIN`;
`127.0.0.1` is a different browser origin and mutations will fail. Published
ports are loopback-only. Compose supplies local-only database configuration;
you do not need an `.env` for the Docker route. `db:migrate` deploys checked-in
migrations; do not reset the database. `db:circles` creates the three curated
circles, without invented members. Seeding also ensures circles exist. Repeated
imports preserve edits, privacy choices, deletion markers and relationships.

The dropdown explicitly selects the cookie identity; there is no default login.
Switching reloads personalized state. It is intentionally possible to impersonate
any demo persona, so never expose this app publicly.

| Persona | Use |
| --- | --- |
| Demo 004 / Demo 005 | A and B for introductions and acceptance; opt both into discovery first |
| Demo 006 | Independent C for denied conversation access |
| Demo 001–003 | Reserved hidden newcomers for explicit invitation activation |

Aliases can be edited; do not assume those display names remain unchanged or that
A/B have opted in. Academic/interests/purpose enrichment is synthetic and labelled;
seed opt-ins are simulated. Email and supplied fake names are not persisted.
There are exactly 925 imported User IDs on a fresh import; deleted profiles stay
absent even though their minimal User IDs remain.

## Host development (optional Node 20)

Keep PostgreSQL running with the first Compose command above. Install Node **20.x**
with your preferred version manager, then:

```sh
cp .env.example .env
# Edit .env: set DATABASE_URL to the local URL below; keep DEMO_MODE=true.
# DATABASE_URL=postgresql://connect:connect_dev@localhost:5432/connect_dev
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Stop the Docker **app only** first if it occupies port 3000:
`docker compose -f docker-compose.dev.yml stop app`. The database keeps running.
Host development uses `localhost`; container database clients use `postgres`.
`.env.example` contains no credentials; never commit the edited `.env`. Host-mode
commands are provided for development; Stage 7 verification used Docker Node 20,
not the host's different Node version. `npm run start` can serve a completed host
`npm run build`; it also binds loopback.

## Checks and clean-start reproduction

```sh
docker compose -f docker-compose.dev.yml run --rm tools npm run db:validate
docker compose -f docker-compose.dev.yml run --rm tools npm run typecheck
docker compose -f docker-compose.dev.yml run --rm tools npm run lint
docker compose -f docker-compose.dev.yml run --rm tools npm run build
# Regression suites with isolated synthetic fixtures:
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage4:http
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage5:http
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage6:http
# Running-app identity/privacy checks (localhost:3000 inside scripts uses app service):
docker compose -f docker-compose.dev.yml run --rm tools npm run test:persona
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage3:http
```

`test:stage3` covers normalization, privacy, filters and ranking. `test:stage2`
expects the original 925-profile dataset and verifies repeatable imports and
preservation in a rolled-back transaction; run it on a fresh reproduction if you
have intentionally deleted a live profile. Stage 4–6 DB/HTTP suites generate random
local schemas and remove only their own fixtures. No live destructive tests.
The TS runner transpiles only: typecheck is a separate required check.

For a genuinely separate clean database/project, leaving the live volume alone:

```sh
sh scripts/verify-stage7-setup.sh
# Open http://localhost:3001/connect; select a persona.
# Inspect only the reproduction project's health/logs if needed:
docker compose -p connect-stage7-repro -f docker-compose.dev.yml -f docker-compose.repro.yml ps
# After review, stop/remove ONLY the temporary project's containers/network:
docker compose -p connect-stage7-repro -f docker-compose.dev.yml -f docker-compose.repro.yml down
```

The override uses ephemeral PostgreSQL and dependency filesystems, **no named
volumes**, a distinct container/network and app port 3001. Its database disappears
when stopped; it is deliberately disposable. It runs clean npm ci, generation,
migrations, circles, two imports, Stage 2 preservation checks, Prisma validation,
typecheck, lint, build and app startup. It writes normal build output in this
checkout, so do not run another build concurrently. Never use `down -v`, volume
pruning or database reset to fix the live app. The normal `connect_pg_dev` volume
must remain. Stop the live app non-destructively with `... stop app`.

## Troubleshooting and implementation guide

- Docker socket unavailable: start Docker Desktop and rerun `docker version`.
- Port conflict: inspect `docker ps`, `lsof -nP -iTCP:3000 -sTCP:LISTEN` and the
  equivalent for 5432. Do not stop unrelated services. If changing the app port,
  update `DEMO_ORIGIN` to exactly match the browser URL and rebuild/restart.
- Existing `connect-postgres-dev` container: inspect its Compose owner before
  starting another checkout; do not remove it or its volume. Use the separate
  reproduction project for a safe clean check.
- Seed missing/invalid: confirm its exact path and authorized original file.
  Diagnostics suppress private records. Never paste its contents into logs.
- Prisma executable/client missing: rerun tools `npm ci` and `db:generate`.
  Docker has a separate Linux dependency volume, independent of host packages.
- No suggestions/background options: add purposes/interests, opt in, or clear
  filters explicitly. Hidden fields and groups below five remain suppressed.
- Stale image after edits: rebuild/restart the app. Inspect
  `docker compose -f docker-compose.dev.yml logs --tail=40 app` locally; do not
  publish raw access logs containing invitation URLs.

UI is in `app/components`, thin routes in `app/api/connect`, cookie identity in
`lib/auth/currentUser.ts`, policy in `lib/db/services`, Prisma queries in
`lib/db/repositories`, and schema/migrations in `prisma`. `PROGRESS.md` and
`STAGE*_SUMMARY.md` record actual results and limits. Read `STAGE8_SUMMARY.md` for
the final handoff checks; screenshots are synthetic fixtures, not student activity.


## Submission access (when ready)

The repository is currently public by the owner's explicit choice. Stage 8 leaves
visibility unchanged; source visibility does not make the demo app safe to deploy.
To switch back to private before submission, run locally:

```sh
gh repo edit prashantbhattarai/connect-internationals --visibility private --accept-visibility-change-consequences
gh repo view prashantbhattarai/connect-internationals --json nameWithOwner,visibility
```

Then open GitHub repository **Settings → Collaborators → Add people**, enter the
GitHub username Maxi specifies, and grant the needed access (read access is enough
for review). Maxi must accept the invitation. No invitation has been sent by this
handoff. Making a repository private cannot recall previously downloaded copies.
Supply the private seed separately through an authorized channel.
