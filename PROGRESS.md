# Progress

## Stage 1 — complete

- Read the complete playbook and original private mentor brief. Confirmed the intended `/Users/prashantbhattarai/connect-internationals` directory, existing Git repository, and private seed presence without printing records. No pre-existing applicable AGENTS.md was found; added short repository instructions.
- Original files were preserved. No seed import, schema, migration, persona switching or later feature work was performed. Next step is **Prompt 2**, only when requested.
- Host Node v24.18.0 / npm 11.16.0 left unchanged. Docker Desktop 4.98.0, Engine 29.9.2, Compose v5.6.1 available. Docker socket access initially failed inside the sandbox; approved Docker access succeeded. Node v20.20.2 runs in the project containers.
- Exact dependencies and package-lock.json: Next 14.2.35, React/React DOM 18.3.1, Tailwind 3.4.19, Prisma/client 5.22.0. No global installs.
- Added responsive app shell and real navigation to six clearly labelled unavailable feature pages, visible demo notice, repository/service/auth/Prisma directories, Dockerfile, loopback-only Compose services, credential-free .env.example, README and lifecycle note in DESIGN.md.
- PostgreSQL uses the brief's local settings and persistent named volume. No existing volume was removed and no unrelated container was stopped. Private attachments, seed, environment files and generated artifacts are ignored for Git/Docker.

## Actual checks — November 3, 2026

- `docker version`, `docker compose version`, existing-container inspection: passed with approved Docker access; no running containers initially.
- `docker run --rm node:20-bookworm-slim node --version`: v20.20.2.
- Node 20 container `npm install --save-exact`: passed, 396 packages installed; then pinned direct versions to resolved lockfile versions.
- Node 20 container `npm run typecheck`: passed (exit 0).
- Node 20 container `npm run lint`: passed, no ESLint warnings/errors.
- Node 20 container `npm run build`: passed; 10 static pages generated, no database dependency.
- `docker compose -f docker-compose.dev.yml config --quiet`: passed.
- `docker compose -f docker-compose.dev.yml up -d postgres`: passed.
- `docker compose -f docker-compose.dev.yml exec -T postgres psql -U connect -d connect_dev -c 'SELECT version(), current_database();'`: passed; PostgreSQL 16.15, connect_dev.
- `git check-ignore` on private seed/brief, .env, dependency and build paths: passed. Existing Git index had no tracked files. `git diff --check`: passed.
- Install audit: 21 findings (16 moderate, 4 high, 1 critical). Separate `npm audit --omit=dev --json` exited 1: two runtime dependency findings (Next critical, bundled PostCSS high); suggested fix crosses to Next 16. The specified Next 14 / Node 20 compatibility constraint is preserved. This is a local-only prototype; upgrade and security remediation are required before deployment.
- `docker compose -f docker-compose.dev.yml --progress plain up -d --build app`: passed, including clean `npm ci`, production build, type validation and lint inside the image. Rebuilt successfully after redirect repair.
- Initial host HTTP check was blocked by sandbox local-network permissions. Repeated with approved access; it exposed a static root redirect without a Location header. Added an explicit `/` → `/connect` redirect in next.config.mjs and rebuilt. Final HTTP check passed: root follows to /connect; all six navigation pages return 200 with demo/unavailable labels; nine referenced JS/CSS assets return 200; unknown navigation returns 404.
- `docker compose ... ps`: app running on 127.0.0.1:3000; PostgreSQL healthy on 127.0.0.1:5432. App logs show ready with no server errors. Runtime check confirms Node v20.20.2 and absence of /app/private and /app/.env.
- App remains running at **http://localhost:3000/connect**. No Stage 1 execution blocker remains. Browser visual inspection/screenshots were not available; HTTP and build checks are the performed evidence.
- Reviewed filenames for a local foundation commit, including package-lock.json as requested by Prompt 1. Existing Git identity is configured; no remote or push is authorized.

## Scope and limitations

Stages 1–7 are complete at the checkpoints below. Stage 7 produced design/setup/demo documentation and five real Chrome screenshots using isolated synthetic fixtures. Earlier unavailable-browser notes are historical; see the Stage 6/7 evidence. Stage 8 has not started. No remote, push, public deployment, external messaging or seed upload occurred.


## Stage 2 — complete

- Preserved Stage 1, exact dependencies and its PostgreSQL volume. Read the playbook, repository instructions, existing progress and mentor brief. No subdirectory instructions were found.
- Added Prisma 5 schema and migration `202611030001_stage2`: minimal ID-only User; ConnectProfile and deletion tombstones; requests with explicit PENDING/ACCEPTED/DECLINED/CANCELLED/CLOSED states; conversations/messages; blocks/reports; circles/memberships; invitations/referral claims; usage counters. Feature IDs use cuid defaults. Foreign keys, filter/user-reference indexes, GIN tag indexes, unique memberships/referral recipients/conversations and canonical unordered connection-pair uniqueness are enforced. SQL checks prevent fabricated endpoint pairs, self-blocks and negative counters.
- Added validated runtime-only seed import of all 925 IDs. Emails are validated for uniqueness/example.test but never persisted or returned; supplied fake names are replaced with synthetic Demo NNN aliases. Missing/withheld answers become null (147 unknown cities, 25 unknown nationalities). NYC/New York City/New York City, NY/New York, NY aliases map to New York, NY; other locations are left unchanged. README documents the exact alias policy.
- Enrichment is deterministic from SHA-256 of the seed ID, with per-field provenance. Academics, interests, purposes, needs and offers are explicitly synthetic. A deterministic subset simulates opt-in, with simulated consent metadata; hidden profiles have no consent timestamp. Demographic visibility defaults hidden. Three newcomer profiles are hidden and incomplete.
- Repeated imports use inserts with duplicate skipping, never updates; tombstones prevent profile resurrection. Repositories own Prisma queries; services own import and identity rules. The local migration/seed commands reject nonlocal database URLs.
- Added requireUser() with validated demo cookie and DEMO_MODE gating; missing/invalid identities return 401 rather than choosing a default. Persona bootstrap returns only demo aliases/IDs. Mutation checks an exact configured origin and rejects additional actor fields. Cookies are HttpOnly/SameSite=Lax; identity responses are private/no-store. The dropdown performs full navigation after switching, clearing personalized client state.
- Added Compose Node 20 tools with a separate Linux dependency volume and read-only runtime private mount; private files remain outside app images. README documents setup, seed rules and focused checks. No Stage 3 profile editor/discovery implementation was added.

### Actual Stage 2 checks — November 3, 2026

- Node 20.20.2 tools: Prisma validation and generation passed. Local migration deployment passed; `prisma migrate status` reports up to date.
- `npm run db:seed` twice: both passed, 925 users / 925 profiles each. Separate PostgreSQL aggregate check returned 925 rows and 925 distinct User IDs; no records were printed.
- `npm run test:stage2`: passed normalization, deterministic generation, reserved hidden newcomers, seed input validation, repeat imports preserving an intentional profile edit, per-field provenance, visibility, a deletion tombstone, relationship, conversation and message; reversed duplicate pairs rejected. All mutation fixtures were rolled back, leaving 925 users and 925 profiles.
- Missing/invalid/nonexistent identities and DEMO_MODE=false rejected in focused identity tests.
- Node 20 `npm run typecheck`, `npm run lint`, `npm run build`: passed. Typecheck/lint were repeated after final seed-policy and persistence-test additions; passed.
- Compose configuration, `git diff --check`, private/environment ignore checks passed. No private/.env files are tracked. Existing dependency audit findings/lifecycle limitation from Stage 1 remain; no dependency upgrades were attempted.
- Production `docker compose -f docker-compose.dev.yml --progress plain up -d --build app`: passed, including clean npm ci, Prisma generation, Next production build, lint/type validation and container startup. Dependency installation took about six minutes; it completed successfully. Tools image build also passed. The existing 21 dependency audit findings remain as recorded in Stage 1.
- Final checks in the new isolated tools dependency volume: client generation, `npm run test:stage2`, typecheck and lint all passed.
- `npm run test:persona` against the rebuilt running app: passed missing/invalid/nonexistent cookie 401s, 925 allowlisted alias/ID options, switching two distinct cookies and reading the correct current identity, HttpOnly/SameSite flags, private/no-store responses, rejected cross-origin requests (403), rejected forged actor properties (400), invalid switch target (401), and app shell rendering (200).
- App runtime inspection: Node 20.20.2; `/app/private` and `/app/.env` absent; startup logs show ready with no server errors. App and PostgreSQL remain running, published only on 127.0.0.1:3000 and :5432. No volume was deleted or reset.
- No browser automation tool was available: no visual inspection, dropdown click automation, screenshot or browser-cache assertion is claimed. The switcher's full-navigation reset is implemented; HTTP identity/cookie isolation is verified. This is not a Stage 2 execution blocker.
- Final host-loopback `curl --location http://localhost:3000` check passed: HTTP 200 at http://localhost:3000/connect after the root redirect. Final Compose configuration and `git diff --check` passed.
- No Stage 2 blocker or required manual repair remains. Open **http://localhost:3000/connect** and choose a demo persona. Next authorized work would be **Prompt 3**, only after the user requests it.

### Demo-persona legend

| Role | Demo alias | Intended use |
| --- | --- | --- |
| A | Demo 004 | First ordinary persona |
| B | Demo 005 | Switch target for identity checks |
| C | Demo 006 | Unrelated persona for later authorization checks |
| Newcomer | Demo 001 · newcomer | Hidden/incomplete onboarding/invitation demo |

Demo 002 and Demo 003 are also reserved hidden newcomers. Labels and consent are simulations, not real students' chosen names or permission. No seed demographics or emails are included in this legend.


## Stage 3 — complete

Implemented only Prompt 3. Preserved all existing Stage 2 work, schema, seed
behavior, exact dependencies, private exclusions and the PostgreSQL volume.
No migration was required; no real profiles or visibility choices were reset.

- Added owner profile editing for alias, purposes (friendship, career preparation,
  projects, settling in), interests, looking-for/can-help-with, and optional
  background fields. Discovery opt-in and background visibility are explicit;
  demographic ranking preference stays off by default. Consent remains a demo
  simulation. The UI requires a server preview before save. Actual field changes
  alone become user_entered; other provenance, including targetRoles, survives.
- Added identity-bound optimistic revisions: an owner ID plus update timestamp
  is checked against the cookie actor's current record; stale/cross-persona
  saves return 409. Actor identity is never taken from the revision/body.
- `connectRepo.ts` owns selected Prisma queries; services own editing, shared
  privacy rules and scoring. Routes authenticate, validate and return explicit
  DTOs with private/no-store and Vary: Cookie. Owner DTOs expose only editable
  owner fields/settings; stranger DTOs never expose raw rows, emails, private
  metadata or hidden values/provenance.
- Discovery filters city/nationality/university/major/interest/purpose with exact
  AND semantics and documented city alias normalization. Pages are 1–100,
  page sizes 1–20 (default 12). Unknown/withheld demographics are not options or
  matching signals. Invalid/repeated/spoofed query fields are rejected. Explicit
  clear-filters controls broaden; no silent relaxation occurs.
- Up to five positive-score suggestions follow all playbook weights/caps;
  shared skill tags count once across both directions, with accurate directional
  explanations. Top 1–3 nonzero reasons, deterministic ascending-ID ties,
  provenance labels and existing relationship state are displayed. No percentage
  or unsupported expertise/compatibility claims are shown. Sparse profiles get
  browse/profile guidance, never fabricated suggestions.
- Persona changes abort active requests, clear personal UI and fully navigate.
  Restored back-cache pages reload; focus/visibility checks detect cross-tab
  identity changes. Profile revisions also reject another persona's stale form.
  No Stage 4 contact/chat action was implemented.

### Exact Stage 3 cohort policy

First exclude self, opted-out/deleted profiles and blocks in either direction.
Project only sharing-approved nonempty demographic values. The full tuple of
these values plus absent fields must occur for at least five eligible people
in the viewer's corpus; otherwise strip all demographics and their provenance,
leaving alias/purposes/interests/needs/offers. Direct lookup uses the same rule
and generic 404 for excluded users. Filter options and ranking use projected
cards only. Any demographic query yielding fewer than five people returns a
generic suppressed result with no cards/recommendations/count and hasNext=false.
The tuple rule is reapplied within filtered results, including interest-only
searches. Responses omit totals. Preview uses six including the proposed owner
to account for an excluded self-viewer, and warns that particular viewers' blocks
can hide more. Existing sharing flags were preserved, so seed demographic
options may be empty until enough personas deliberately share them. This is a
conservative heuristic, not anonymity; aliases/interests, external linkage,
repeated queries and changes over time leave residual risks.

### Actual Stage 3 verification — November 3, 2026

- Node 20 Docker `npm run test:stage3`: passed. Synthetic transaction fixtures
  cover profile normalization and preview, individual/combined demographic and
  tag filters, pagination, exact scoring/caps, skill direction/deduplication,
  stable ties/top-five limit, sparse profiles, direct lookup exclusions,
  opt-out/deletion, blocks in both directions, hidden-field mutation attacks,
  five-vs-four cohorts, narrowed demographic suppression, interest-only
  generalization, safe options/DTOs/reasons, relationship state, optimistic
  revisions, cross-persona revision rejection and per-field provenance.
  Every fixture was rolled back; 925 users retained.
- `npm run test:stage2`: passed after Stage 3 implementation; repeat import
  preserves edits/privacy/tombstones/relationships/messages, 925 users/profiles.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed in Node 20 Docker.
  Final production image build also passed client generation, lint/type validation
  and Next build, then started the app successfully. No build-time DB access.
- Early focused-test failure: a fixture expected both skill explanations in the
  top three while a higher-scoring interest displaced one. Adjusted the fixture
  to independently exercise both directions within the specified top three.
  A heterogeneous fixture-filter array also needed an explicit TypeScript type.
  Both were corrected; affected tests/typecheck passed. Review also strengthened
  revisions from timestamp-only to identity-bound; corresponding tests passed.
- `npm run test:stage3:http`: passed against the rebuilt app. Missing/invalid
  identities rejected on private APIs; independent A/B cookies return the
  correct owner/discovery identity without caching leakage; card fields and
  direct lookups match allowlists; filters/pagination are bounded; server preview
  leaves saved data unchanged; forged actor, stale/cross-persona edits,
  cross-origin requests and invalid tags are rejected. HTTP checks performed no
  successful saved-profile mutations; successful writes were service/DB tests.
- `npm run test:persona`: passed against the new app, preserving Stage 2 cookie
  switching, HttpOnly/SameSite flags, no-store policy and rejection behavior.
- Prisma validation passed. Compose configuration, private/environment ignore
  checks and git diff --check passed; private/.env inputs remain untracked.
- Final PostgreSQL aggregate returned 925 users / 925 distinct IDs. App runtime
  is Node 20.20.2; private/ and .env absent; startup logs ready with no errors.
  App/Postgres remain running on loopback, without volume removal/reset.
- Host HTTP checks: root redirects to /connect with final 200; /connect/profile
  returns 200. App URL: **http://localhost:3000/connect**.
- Browser tooling unavailable: no clicks, visual/responsive inspection,
  screenshots, successful UI-save interaction, or browser back-cache/cross-tab
  assertions are claimed. HTTP identity isolation and server-side protection
  were tested; browser behavior remains manual verification.
- Existing 21 dependency audit findings and Next 14/Node 20 lifecycle limitations
  remain unchanged. No new dependencies or live integrations were introduced.

Deliverables: README.md updated and STAGE3_SUMMARY.md saved with implementation,
policy, important files, results and limitations. No Stage 3 execution blocker
remains. **Next is Prompt 4, only when requested.**


## Stage 4 — complete

Implemented only Prompt 4. Read repository instructions, current progress,
STAGE3_SUMMARY.md, the playbook contract and current implementation. Preserved
Stage 2/3 records, private exclusions, exact dependencies and database volume.

- Added introductions from discovery cards, purpose plus 1–300-character note,
  incoming/outgoing lists, real relationship states and recipient-only
  accept/decline / sender-only cancel. Declined, cancelled and closed pairs are
  terminal in this prototype. Known IDs do not bypass shared stranger eligibility,
  deletion or bidirectional blocks. Both profiles must be discoverable for a new
  request or first acceptance; hidden pending peers disclose no alias/note.
- Participant User row locks serialize current-state/permission checks, pair
  uniqueness, atomic transitions and conversation creation. Concurrent repeated
  recipient acceptance is idempotent and returns one conversation. Profile edits
  now share the User-lock protocol; future block/deletion operations must too
  (documented in AGENTS.md). Prisma queries stay in repositories, business rules
  in services, routes authenticate/validate/map responses.
- Added persisted participant-only messages after acceptance, text capped at
  2,000 characters, stable createdAt/ID ordering and exclusive older-message
  cursors (20 default, 50 maximum). Conversation lists are paginated, with stored
  last-message timestamps. Only the selected chat polls about every five seconds;
  older-history views poll that bounded page until Latest is chosen. Timers,
  reads and sends are aborted/cleared on unmount, view and persona changes.
- Every chat read/send checks active profiles, membership, accepted state and
  blocks in either direction. Discovery opt-out preserves accepted chat access;
  deletion/blocking denies it. No raw Prisma objects, demographics or emails enter
  contact DTOs. Notes/messages render as React text. No unread counts are invented.
- Persistent rolling limits: 5 introductions/24h, 20 pending outgoing,
  30 messages/minute across conversations. Counters and mutations commit together
  under User locks; cancellation does not restore quota. 429 responses include
  retry guidance and Retry-After. There is no free/paid branch.
- Identity comes exclusively from requireUser(). A displayed-identity header is
  checked as a stale-form precondition, not used to choose an actor. Strict input,
  origin checks and private/no-store plus Vary: Cookie cover contact APIs.
- Added migration 202611030002_canonical_pair_order. The first concurrency test
  exposed PostgreSQL locale ordering differing from JS ASCII sorting for fixture
  IDs. Fixed the canonical pair check with explicit C collation, normalizing keys
  in a transaction while preserving IDs/relationships/messages. Did not edit the
  previously applied migration or delete records.

### Actual Stage 4 verification — November 3, 2026

- `npm run test:stage4`: passed real committed database/concurrency tests in a
  guarded random temporary schema. Eight accepts return one conversation;
  concurrent crossed sends create one pair; eight sends produce five successes;
  35 message attempts produce 30 successes. Also passed A/B persistence, C denied
  access/actions/enumeration, pre-accept denial, invalid transitions, declined
  resend denial, cancellation quota retention, 20-pending cap, rolling expiry,
  bounded/same-time pagination, text bounds, hidden/deleted users and both block
  directions. Initial locale failure was repaired, not bypassed.
- `npm run test:stage4:http`: passed DB tests again, then production standalone
  API tests on an isolated local server with independent A/B/C cookies. Verified
  introduction -> recipient acceptance -> persisted two-way messages; C denied;
  concurrent acceptance/crossed requests; real 5/day and 30/min caps with retry
  headers; literal HTML-like text; pagination; cross-origin/forged/stale actors;
  block/deletion gates and Requests/Messages page responses. No browser involved.
- Each test run creates only its own random stage4_test_ schema, applies both
  checked-in migrations, commits synthetic fixtures, stops its own temporary
  server and drops only that schema. Final SQL count confirms zero test schemas.
  Existing demo tables were never reset or populated with Stage 4 test users.
- Local `npm run db:migrate`, Prisma validation and migration status passed;
  public schema is up to date with two migrations.
- `npm run test:stage2` and `npm run test:stage3`: passed after the migration and
  profile lock change. Stage 2 repeated-import preservation remains verified.
- Node 20 `npm run typecheck`, `npm run lint`, `npm run build`: passed. Production
  Docker image rebuild also passed clean npm ci, Prisma generation, Next build,
  lint/type validation and app startup.
- Against rebuilt app: `npm run test:stage3:http` and `npm run test:persona`
  passed, preserving prior identity/profile/discovery HTTP behavior.
- Runtime Node v20.20.2, no /app/private or /app/.env, clean startup logs. Final
  aggregate confirms 925 users and 925 distinct IDs. PostgreSQL remains healthy
  and the existing volume was retained. App ports remain loopback only.
- Host HTTP checks passed 200 for /connect/requests and /connect/messages.
  App URL: **http://localhost:3000/connect**.
- Compose configuration, git diff --check, private/environment ignore and tracked
  file checks passed. No new packages or integrations. Existing 21 audit findings
  and framework/runtime lifecycle limitation remain documented.
- Browser automation unavailable: no clicks, visual/responsive inspection,
  browser refresh persistence, DOM text-render assertions, polling timer timing,
  navigation cleanup or cross-tab/back-cache behavior are claimed as browser
  verified. Server persistence across fresh requests and all described HTTP/
  database authorization/concurrency behavior were tested.

Updated README.md/AGENTS.md and saved STAGE4_SUMMARY.md with behavior, architecture,
files, actual results and limitations. No Stage 4 execution blocker remains.
**Stopped before Stage 5; Prompt 5 requires the user's next instruction.**


## Stage 5 — complete

Resumed existing work after transport interruptions, inspected Git/Docker state
and reused completed checks. Preserved Stage 2–4 implementation, migrations,
925-person data, private exclusions and PostgreSQL volume. Implemented Prompt 5
only; no Stage 6 controls or external integrations were added.

- Added SWE Interview Partners, Campus & City Friends and Project Builders,
  each with purpose and proposed starter activity. `db:circles` and the private
  seed ensure missing curated rows without fabricating memberships/activity.
  Voluntary join/leave is idempotent under User locks and unique membership keys.
- Member cards use shared stranger eligibility/privacy and circle-scoped cohort
  generalization. Self, hidden/deleted profiles and blocks in both directions
  are excluded from cards/counts. Counts are visible-peer bands: withheld below
  five, then 5–9 / 10–19 / 20+. Members paginate at 20 per page. No group chat or
  automatic personal connection is created.
- Added owner-approved personal/circle invitations: 32 random bytes, opaque
  base64url tokens, SHA-256 hashes only in DB, seven-day expiry, owner revocation.
  Newly generated links have copy and always-visible manual-copy input; older
  manager rows cannot reconstruct tokens. Public landing responses expose only
  approved alias/message, permission and public circle summary, never member
  counts/directory, emails, private demographics, hashes or creator user IDs.
- Reserved seed ordinals 1–3 simulate newcomer entry through explicit persona
  selection. The token never logs in as its creator. Activation is explicitly
  confirmed, starts hidden, records one referral source and does not create a
  friendship or membership. Duplicate claims return the same result; concurrent
  source claims serialize on participant User rows. Activation markers prevent
  attribution replacement after a source disappears. Visits record no success.
- Personal invitations require separate permission to receive introductions;
  circle-only links may omit it. Explicit sending shares the invitee alias/note;
  the inviter accepts via existing Requests. Contact service reuses the same
  pair uniqueness, transitions, User locks, rolling/pending quotas and usage
  recording. Ordinary discovery/direct-request eligibility is unchanged.
- Pending link requests revalidate live invitation permission/expiry at first
  acceptance. Request metadata stores approved aliases, not later private edits.
  Revocation marks claims revoked and prevents pending acceptance; already
  accepted chat remains independent and still checks blocks/deletion on each
  operation. Circle joining remains a separate deliberate action.
- Added additive migration 202611030003_invitation_consent (activation marker,
  request invitation/snapshot linkage, claim revokedAt); User has no new scalar
  fields. Cookie actors, origin checks, identity preconditions and private/no-store
  DTOs cover private operations. Public token responses also use no-referrer.
- UI: Circles, invitation manager, public landing and reserved newcomer selector.
  Manual-copy fallback is present; code review fixed the copy button to type=button
  so clicking it cannot submit the surrounding create-link form.

### Actual Stage 5 checks — November 4, 2026

- Preserved pre-disconnection passing Prisma generation, local migration,
  `db:circles`, Prisma validation, typecheck and lint results. No repeated setup or
  reset was performed on resume. Three curated circles were created; no students
  were auto-joined.
- `npm run test:stage5`: passed database fixtures for join/leave/duplicate join,
  real eligible cards, within-circle cohort suppression, count bands, exclusions,
  token hashing and seven-day expiry, public allowlist, explicit consent, separate
  activation/introduction/acceptance/join, idempotent/concurrent claims, one source,
  approved alias snapshots, source preservation, expiration/revocation/self-referral,
  block/deletion rules, pair restrictions, request quotas and cancellation usage.
- `npm run test:stage5:http`: passed database suite again and a separate fresh
  schema/server HTTP suite with independent creator/newcomer cookies. The same
  link opened anonymously and under a separate persona without Set-Cookie or
  creator impersonation. Explicit activation then introduction then existing
  recipient acceptance opened one conversation. Circle joining was separate;
  concurrent joins/claims were idempotent; competing sources could not replace
  attribution. Expired/revoked/invalid/blocked/deleted cases, stale/spoofed actors,
  narrow permission, ordinary privacy, quota Retry-After and live chat gates passed.
- Each Stage 5 suite uses its own guarded random temporary PostgreSQL schema,
  applies all checked-in migrations, and commits synthetic fixtures only there.
  Servers are stopped and those schemas removed afterward. Final SQL reports no
  remaining Stage 4/5 test schemas. Existing demo data was never reset.
- `npm run test:stage2` and `npm run test:stage3`: passed after Stage 5 changes;
  repeated-import edits/privacy/tombstones/relationships remain preserved.
- Full `npm run test:stage4:http` (database plus isolated HTTP) passed against the
  new implementation, including A/B/C authorization, ordinary visibility/pair
  rules, concurrent acceptance/crossed sends and request/message caps.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed in Node 20 Docker.
  Production Docker rebuild also passed clean npm ci, Prisma generation, full
  Next build, lint/type validation and startup. No new dependencies or stack
  version changes; the latest install audit reported 11 findings (6 moderate,
  4 high, 1 critical). Historical audit counts above remain historical; no
  remediation/production-readiness claim is made.
- Against rebuilt app: Stage 3 HTTP and persona regressions passed. Prisma
  validation and migration status passed; all three migrations are applied.
- Live read-only Stage 5 API checks passed for three circles, bounded members,
  own invitations, three reserved options and generic invalid-link handling.
  These checks created no memberships, claims or invitations in demo tables.
- Final SQL: 925 users / 925 distinct IDs, three circles, zero test schemas.
  Runtime Node v20.20.2; /app/private and /app/.env absent. Clean startup logs,
  app/Postgres running with loopback ports and original volume retained.
- Host HTTP 200: /connect/circles and /connect/invite. App URL remains
  **http://localhost:3000/connect**.
- Compose configuration, git diff --check, private/environment exclusions and
  tracked-file checks passed. No private seed, .env, tokens or original student
  records were printed, uploaded, staged or committed.
- No browser automation tool was available. Browser clipboard permission/manual
  fallback interaction, clicks, visual/responsive layout and back/cross-tab state
  behavior remain unverified. Two independent HTTP cookie sessions and actual
  server-side persistence/permissions were exercised, not browser automation.

Updated README.md and AGENTS.md; saved STAGE5_SUMMARY.md with implementation,
files, actual results and limitations. Member-card enumeration can imply small
memberships despite coarse bands; public approved text is intentionally visible
without identity. The core anonymity/demo-auth/lifecycle limitations remain.
No Stage 5 execution blocker remains. **Stopped before Stage 6.**


## Stage 6 — complete

Implemented Prompt 6 only after reading instructions, current progress,
STAGE5_SUMMARY.md and code/Git state. Preserved previous migrations, stack,
private exclusions, live demo records and volumes. Stage 7 was not started.

- Added block/unblock/report controls to visible profile/circle cards, request
  views, accepted chat and authenticated invitation views; profile settings
  manages the actor's own block labels and confirmed deletion. Actor IDs remain
  exclusively cookie-derived; origin, input and stale-persona checks protect
  every new mutation. Responses are allowlisted private/no-store DTOs.
- Blocking closes pending/accepted pair states, denies both directions across
  discovery/circles/contact/messages/invites, and revokes pair claim attribution.
  InvitationRestriction rows preserve old-link denial after unblock; invitations
  created while a block is active inherit restrictions. Unblock removes only the
  actor's block and never restores closed relationships or old permissions.
- Added migration 202611050001_safety for private block labels and per-visitor
  invitation restrictions, including closure/exclusion backfill for existing
  blocks. User still has only its original ID scalar. No old migration was edited.
- Reports accept a supported reason and <=1,000 context characters; five per
  rolling 24 hours enforced with persistent usage and User-row locks. Reporting
  confirms local recording, no human monitoring and no automatic block. DESIGN.md
  documents proposed designated Northbridge Trust & Safety review, restricted
  access/auditing and context retention; these are production proposals only.
- Explicit deletion requires two booleans plus DELETE CONNECT PROFILE. It purges
  feature data, memberships, owned links/dependent claims, own referral, blocks,
  reports/context and counters. Requests/conversations/messages are removed for
  BOTH participants. Other participants' profiles/counters remain. Core User ID
  and minimal tombstone prevent reseeding resurrection; source files are preserved.
- Deletion uses one transaction and ordered locks on all local User rows to stop
  contacts/invites appearing during cleanup. Seeding now takes ordered source
  User locks before reading tombstones; concurrent seed/delete cannot resurrect
  profiles. Broad locking is an explicit local-prototype scaling limitation.
- UI clears personal state/polling after safety changes and emits only a timestamp
  reset signal across tabs. Same-page/hash destinations now force a full reload.
  Shared PlainText React rendering is used for notes/messages and directly tested.

### Actual Stage 6 verification — November 5, 2026

- `npm run test:stage6`: passed committed synthetic fixtures in temporary schema.
  Covered bidirectional discovery/circle/direct/contact/invitation gates, closure,
  retained inaccessible messages, unblock without restoration, no-op/other-owner
  unblock, old/blocked-period link restrictions, reports without auto-block,
  concurrent five-report cap and expiry, equal FREE/PAID access, text escaping,
  full purge with only User/tombstone retained, other users/counters preserved,
  deletion/reseed and report/contact/block/accept/message races.
- `npm run test:stage6:http`: passed DB suite and separate isolated production
  HTTP server. Verified real cookie identities/private cache headers, report cap
  plus Retry-After, no auto-block, strict reasons/context/actors/origins,
  bilateral privacy, terminal unblock, token-resolved safety controls, destructive
  confirmation, clearing cookie, revoked deleted identity, complete two-party
  history purge, referral cleanup and concurrency. No live profiles were deleted.
- Final regression pipeline passed `test:stage2`, `test:stage3`, full
  `test:stage4:http`, full `test:stage5:http`, `test:stage6:http`,
  `test:stage3:http`, `test:persona`, Prisma validation/migration status,
  typecheck and lint. Four migrations are applied. Earlier quota, privacy,
  matching, messaging and referral behavior is preserved.
- `npm run build` passed in Node 20. Docker production image generation/build,
  lint/type validation and startup passed; rebuilt again after the browser-found
  client reset repair. No packages or required stack versions were changed.
- Found local Chrome despite no browser connector. A fresh temporary headless
  browser profile on an isolated loopback fixture server passed actual persona
  dropdown selection, chat text rendering (literal <img>, no injected node),
  report confirmation/no auto-block, block, same-page unblock without reopening
  chat, two acknowledgements/typed phrase gating, successful deletion redirect,
  removal from persona options and cookie clearing. No JS runtime exceptions.
- Browser harness initially lacked standalone static assets (404); fixed copying
  generated assets before startup. Browser then found a real same-page/hash
  navigation bug leaving cleared UI loading after unblock; reset now forces a
  full reload, and unchanged assertions passed. Initial JSX apostrophe lint was
  escaped. TSX support in the test runner initially misparsed a generic .ts helper;
  setting its source filename fixed file-kind detection. The complete affected
  regression pipeline then passed; no checks or privacy assertions were weakened.
- Browser server containers, random schemas and Chrome temporary profiles were
  cleaned up. Final SQL: 925 User rows / 925 distinct IDs, zero Stage 4/5/6 test
  schemas. Live safety read checks rejected anonymous access and returned only
  the selected actor's bounded block list with no-store; they made no safety writes.
- Runtime Node v20.20.2, app/Postgres healthy on loopback, original volume retained,
  startup logs ready with no server errors, /app/private and /app/.env absent.
  Host HTTP 200 for /connect/profile and /connect/messages. App remains
  **http://localhost:3000/connect**.
- Compose config, git diff --check, private/environment ignores and tracked-file
  checks passed. No private seed data, real profile content, tokens or credentials
  were printed, staged or uploaded. Latest clean install reported 11 audit findings
  (6 moderate, 4 high, 1 critical); no remediation/deployment-readiness claim.

### Specific remaining browser/manual limits

Chrome smoke passed only the listed workflow. Clipboard/fallback interaction,
keyboard/focus and responsive/visual review, cross-tab/back navigation, exact
poll interval/abort timing, and circle/invitation safety-dialog clicks remain
manual checks. Their server authorization/privacy rules were tested. No screenshots
or full Stage 7 design/demo evidence were produced. Previously viewed/external
copies, demo-cookie impersonation and production scale/moderation/retention are
not solved by this prototype; DESIGN.md documents those limits.

Updated README.md, AGENTS.md and Stage 6 safety DESIGN notes; saved
STAGE6_SUMMARY.md with behavior, architecture, checks and remaining limitations.
No Stage 6 execution blocker remains. **Stopped before Stage 7.**

## Stage 7 — complete (November 5, 2026)

### Deliverables

- Rewrote DESIGN.md for Maxi: approximately 1,390 words excluding the diagram,
  covering discovery weights/reasons, normalization, contact/polling tradeoffs,
  shared privacy/small cohorts, safety/deletion, feature storage/indexes, free
  access, circles/referrals, proposed AWS/Clerk/worker/SES/mobile architecture,
  and a city-level map proposal. Clearly separates implementation, simulated
  consent/compatibility/activation and production work. Verified primary links
  for Next/Node lifecycle, Leaflet, OSM tile policy, AWS RDS/SES and Compose merge.
- README.md now gives exact Docker setup, private runtime-only seed placement,
  optional host Node 20/.env setup, migrations, development/check commands,
  persona legend and Docker/port troubleshooting. No private import is bundled.
- Added docker-compose.repro.yml and scripts/verify-stage7-setup.sh: separate
  Compose project, PostgreSQL/dependencies on temporary filesystems, distinct
  loopback app port 3001, no named volumes. Existing live database not mounted.
- DEMO.md provides a 3–5-minute recording script, preparation, C denial,
  explicit invitation consent/separate joining, safety and optional final
  destructive deletion only in a disposable rehearsal. No video was sent.
- Five PNGs in docs/screenshots show actual production-build pages with seven
  wholly synthetic fixture identities: suggestions/reasons, A/B chat, circles,
  approved invitation landing and safety dialog. Inspected all five images;
  no raw tokens, email addresses, credentials or supplied student data appear.
  Memberships/pending request were deliberately prepared fixtures, not organic
  activity. No profile was deleted to obtain evidence.
- New Stage 7 browser launcher/fixture/evidence scripts and guarded
  stage7DemoRepo reuse the existing isolated Stage 6 schema namespace. Only
  repositories query Prisma. No feature behavior, package or migration changed.

### Checks actually run

- `sh scripts/verify-stage7-setup.sh`: passed in a separate Compose project.
  Clean npm ci (398 installed/399 audited), Prisma generation, all four migrations
  on empty PostgreSQL, circle setup, two full imports, test:stage2 preservation
  checks, Prisma validation, typecheck, lint, production build, Docker image
  build and app startup. SQL confirmed 925 users / 925 distinct IDs and 3 circles.
  Reproduction app /connect returned HTTP 200 at localhost:3001.
- First reproduction attempt failed because the temporary dependency filesystem
  was noexec (Prisma permission denied); added the exec mount option and reran
  the pipeline successfully. Clean install still reports 11 audit findings
  (6 moderate, 4 high, 1 critical); upgrades remain outside Stage 7.
- Relevant regressions rerun successfully: test:stage3, test:persona,
  test:stage3:http, db:validate, typecheck and lint. Stage 4–6 full HTTP/DB suites
  were not rerun for documentation/fixture-only additions; their final Stage 6
  passing results remain recorded above, with no affected feature changes.
- Actual headless Chrome walkthrough passed independent persona dropdown
  switching, B accepting A's prepared introduction, two messages across requests
  and page navigation, C denied the same history, circle rendering, approved
  invitation landing, repeated idempotent activation, explicit newcomer
  introduction, separate circle join and block denying old chat. Five screenshots
  captured; zero Runtime.exceptionThrown events. API operations in the browser
  driver are distinguished from clicked interactions in DEMO.md.
- The first new browser harness expected 201 from existing 200 mutation routes;
  corrected the harness to the source contract, with no application change.
  Final run passed again after improving the discovery screenshot framing.
- Compose configs, shell/JS syntax, git diff --check and private/.env exclusions
  passed. No private/.env tracked files. Production image/runtime exclusions
  remain in effect; the separate production app did not mount private input.
- Stopped only the temporary reproduction containers/network (no volume flag)
  and synthetic browser server; isolated schema/browser profile cleanup completed.
  Zero reproduction volumes created, zero remaining Stage 4/5/6 fixture schemas.
  Final live SQL: **925 users / 925 distinct IDs**. Original app/Postgres still
  running on loopback, Postgres healthy, /connect HTTP 200. Existing database
  and dependency volumes retained. Live URL: http://localhost:3000/connect.

### Remaining manual work and limits

The 3–5-minute video itself is not recorded. Manual browser checks remain for
opt-in/filter editing, clipboard success/fallback, circle join/leave clicks,
invitation revoke/accept clicks, keyboard/focus/mobile layout, cross-tab/back
navigation and exact polling/abort timing. Server authorization/privacy rules
have earlier automated coverage; this Chrome walkthrough does not claim complete
visual or cross-browser certification. Optional destructive deletion was not
performed during Stage 7; isolated deletion coverage remains Stage 6 evidence.
Host-mode setup was documented but not executed on the host's different Node.
Production auth, moderation staffing, retention/backup policy, supported stack/
security upgrades, map and notifications remain proposals. No Stage 7 blocker.
**Stopped after Stage 7; Stage 8 not started.**
