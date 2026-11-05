# Stage 8 — complete

Working app: **http://localhost:3000/connect**. Docker app and PostgreSQL remain
bound to loopback; the original database and Docker volumes are preserved.
This is a local compatibility prototype, not a deployable student service.

## Changes

Introduction and safety dialogs now move focus inside, contain Tab/Shift+Tab,
close on Escape while idle, and restore the opener. Background scrolling is
locked while open; introduction content can scroll within short screens.
Textareas have the same visible focus outline as other controls. Discovery and
free-access UI copy now describe present behavior. No schema, dependency,
authorization or deletion-policy changes were made.

The new Chrome driver `scripts/stage8-browser-check.cjs` expands the existing
isolated fixture server with `STAGE8_BROWSER=true`: A/B start hidden, without a
prepared introduction. All seven fixture personas and their entered values are
synthetic. The server creates and removes a random guarded temporary schema;
it never imports the private seed or mutates live profiles.

## Exact run commands

For the existing configured database, rebuild/start the app:

```sh
cd ~/connect-internationals
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.dev.yml up -d --build app
```

For a fresh authorized clone, first obtain the original seed separately at
`private/connect_seed_users.json`, then run:

```sh
docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml build tools
docker compose -f docker-compose.dev.yml run --rm tools npm ci
docker compose -f docker-compose.dev.yml run --rm tools npm run db:generate
docker compose -f docker-compose.dev.yml run --rm tools npm run db:migrate
docker compose -f docker-compose.dev.yml run --rm tools npm run db:circles
docker compose -f docker-compose.dev.yml run --rm tools npm run db:seed
docker compose -f docker-compose.dev.yml up -d --build app
```

Stage 7 verified the fresh setup/repeat imports in a separate ephemeral database.
Stage 8 rebuilt the existing app; it did not repeat the clean import. No volume
removal or database reset is needed. Use `localhost` to match `DEMO_ORIGIN`.

Reproduce the Stage 8 browser run (requires host dependencies and local Chrome;
`CHROME_PATH` can override the default Mac Chrome executable):

```sh
docker compose -f docker-compose.dev.yml run --rm tools npm run build
docker compose -f docker-compose.dev.yml run --rm --name connect-stage8-browser-tools -e STAGE8_BROWSER=true -p 127.0.0.1:3100:3100 tools node scripts/run-ts.cjs scripts/stage7-browser-server.ts
```

Then in another terminal:

```sh
node scripts/stage8-browser-check.cjs
docker stop --timeout 20 connect-stage8-browser-tools
```

Each run needs a fresh fixture server. The browser uses a temporary Chrome
profile, fixed loopback target and viewport-only captures; the app runs Node 20
in Docker. Host Node is used only for browser automation. Stop the fixture server
also after a failed run, so its schema is cleaned. Do not run another shared
checkout build while this server is active.

## Actual verification

Final full browser run passed on the production build with zero JavaScript
runtime exceptions. These actions were actually clicked via Chrome mouse input:

- A/B discovery opt-in, preview and save; unmatched interest filter, clear,
  matching interest filter and accurate shared-interest recommendation reason.
- Introduction composer/send, B acceptance/open conversation, B/A message sends,
  reload persistence. C saw Contact unavailable with no history; its direct
  message API request also returned 404.
- Circle join, eligible member view/empty state and leave.
- Circle invitation creation with both permissions, copy button, verified
  clipboard contents, and selected-link fallback when the API was deliberately
  made unavailable. No token was logged or captured in a screenshot.
- C's simulated activation, separate introduction, A acceptance, separate circle
  joining; A revocation and unavailable landing afterward.
- Block dialog and blocking; old conversation denied afterward.

Persona and invitation-type/circle selections used DOM select change events;
text entry used Chrome input. Route navigation and extra authorization requests
used CDP/browser fetch, so this is not a claim that every navigation link was
clicked. Keyboard assertions covered introduction focus entry, Tab, Shift+Tab
wrap, Escape, opener restoration and Enter reopening; safety covered Escape,
restoration/Enter, Tab through fields and forward wrap.

Document widths were checked at **375px and 1440px**, with no horizontal overflow
at the checked workflow states. Nine screenshots were captured and visually
reviewed in [docs/screenshots/stage8](docs/screenshots/stage8): profile A/B opt-in,
recommendations, introduction dialog, mobile/desktop chat, circles, approved
invitation and safety dialog. They contain only synthetic fixtures. Existing
Stage 7 screenshots remain separate historical evidence. No video was recorded.

Passed commands/checks in Stage 8:

```sh
docker compose -f docker-compose.dev.yml run --rm tools npm run typecheck
docker compose -f docker-compose.dev.yml run --rm tools npm run lint
docker compose -f docker-compose.dev.yml run --rm tools npm run build
docker compose -f docker-compose.dev.yml run --rm tools npm run db:validate
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage3
docker compose -f docker-compose.dev.yml run --rm tools npm run test:persona
docker compose -f docker-compose.dev.yml run --rm tools npm run test:stage3:http
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.dev.yml -f docker-compose.repro.yml config --quiet
node --check scripts/stage8-browser-check.cjs
git diff --check
```

Final Docker production image build/startup passed too. Live aggregate checks:
925 User rows, 925 distinct IDs, zero remaining test schemas; app Node 20.20.2,
private/ and .env absent from runtime; healthy PostgreSQL; /connect HTTP 200.

Initial harness attempts failed on text replacement, an article selector that
included informational cards, and incomplete native Enter events. The harness
was corrected and the full assertions passed. The keyboard gap was identified
in code review and repaired, then verified in Chrome. No check was weakened to
permit a broken required flow.

Stage 6 isolated deletion evidence is reused: deletion paths were unchanged and
no deletion ran in Stage 8. Full Stage 4–6 DB/HTTP suites were not repeated for
these UI/docs changes. Stage 7 clean reproduction and its 11 audit findings are
historical evidence, not checks rerun here.

## Review and remaining limits

README, DESIGN, DEMO and PROGRESS reflect the final behavior and distinguish
historical checks. Tracked/outgoing and staged paths/content plus screenshots
were checked for private seed/mentor brief, local environment files, credentials,
raw invitation tokens, logs and build output. Safe `.env.example` is retained;
private attachments/environment files remain ignored locally, outside Git and
Docker images. Fixed local demo database values are documented test configuration,
not real service credentials.

Remaining manual checks: physical mobile/touch, Firefox/Safari, screen readers,
complete keyboard traversal, cross-tab/back-cache recovery, exact polling/abort
timing, slow/offline/retry behavior and actual OS clipboard permission prompts.
The unavailable-clipboard branch was simulated. This walkthrough does not claim
full accessibility or cross-browser certification. Production auth, moderation,
retention/backup decisions, supported runtime/framework/security upgrades, map
and notifications remain future work; no new integration was enabled.

## Repository and submission

Repository: https://github.com/prashantbhattarai/connect-internationals.
Visibility remains **public**, as explicitly requested in the preceding turn;
Stage 8 does not change it. This Stage 8 handoff is committed and pushed under the
owner's standing instruction, with the remote main commit verified afterward.
No collaborator invitation or external message has been sent.

When ready to submit privately, run locally:

```sh
gh repo edit prashantbhattarai/connect-internationals --visibility private --accept-visibility-change-consequences
gh repo view prashantbhattarai/connect-internationals --json nameWithOwner,visibility
```

Then use GitHub **Settings → Collaborators → Add people** with the GitHub username
Maxi specifies; read access suffices for review. He must accept the invitation.
Previously downloaded public copies cannot be recalled. Share the seed only
through a separate authorized channel. Stop after Stage 8.
