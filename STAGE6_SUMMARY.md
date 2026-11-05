# Stage 6 — complete

Block/unblock, reporting and confirmed Connect-profile deletion are implemented
at http://localhost:3000/connect. Stage 7 was not started.

## Behavior and design

- Safety controls appear on discovery/circle cards, introductions, chats and
  authenticated invitations. Profile settings lists the actor's own blocks using
  private saved labels rather than exposing later private alias edits.
- Blocking is enforced in both directions, closes pending/accepted relationships,
  revokes pair attribution, and permanently excludes old invitation permissions.
  Links issued while blocked inherit exclusions. Unblock removes only the actor's
  block; it never reopens old conversations or restores old links. Unrelated
  friends/links are unaffected. Anonymous approved invitation text remains public.
- Reports validate one of five reasons and up to 1,000 context characters.
  Insertion and persistent five-per-rolling-24-hour usage commit together under
  User locks, with retry headers on 429. Confirmation accurately says recorded
  locally, no human team is monitoring, and reporting does not auto-block.
  DESIGN.md assigns a proposed restricted production queue to designated
  Northbridge Trust & Safety staff and proposes context retention; no team,
  notification or retention job is claimed to exist in this prototype.
- Deletion requires two acknowledgements and the exact typed phrase
  DELETE CONNECT PROFILE. It atomically purges profile/consent/provenance data,
  memberships, owned invitations/dependent referrals, own referral, reports,
  blocks, usage, requests and all associated conversations/messages for BOTH
  participants. Other people's own profiles and counters remain. Only User.id
  and a minimal deletion marker remain for the deleted account in the app DB;
  the original ignored import file and external copies are not erased.
- Rare local deletion locks User rows in the shared C/ASCII order. Seeding locks
  its source rows before checking tombstones. This prevents contact/reseed races,
  with a deliberate throughput tradeoff for this small local prototype.
  Safety actions clear personal state and reload, including same-page/hash
  destinations; cross-tab reset signals contain no profile data.

## Important files

`lib/db/services/safetyService.ts`, `lib/db/repositories/safetyRepo.ts` and
`lib/connect/safetyTypes.ts` own rules, queries and deletion disclosure.
`InvitationRestriction` and migration `202611050001_safety` preserve old-link
revocation, including backfill for existing blocks. Invitation policy/creation,
seeding locks and the shared rolling-limit helper were updated.

Thin routes: `/api/connect/safety/blocks`, `/safety/reports`, and profile DELETE.
`SafetyActions.tsx`, `SafetySettings.tsx`, `connectClient.ts` and integrations
supply controls. `PlainText.tsx` is the tested message/note renderer.
`scripts/verify-stage6*.ts`, `run-stage6-tests.ts`, browser fixture launchers and
`stage6-browser-smoke.cjs` provide isolated verification.

## Actual results — November 5, 2026

Passed: Stage 6 database/HTTP suites; Stage 2/3 regressions; full Stage 4/5
DB/HTTP regressions; persona and live Stage 3 HTTP checks; Prisma validation and
four-migration status; typecheck, lint, production build and local Docker startup.
Tests include bilateral exclusions, terminal unblock, old/new blocked-period link
exclusions, report concurrency/caps and equal FREE/PAID access, complete deletion,
925-record synthetic reseeding and races among contact/block/report/delete/seed.
Cookie replay, forged actors, untrusted origins and missing confirmations fail.

A real headless Chrome smoke passed persona selection, literal HTML text with no
injected element, report confirmation, block, unblock without chat restoration,
two-checkbox/typed deletion gating, successful deletion and cookie clearing.
It found a same-page reload bug, which was fixed and rebuilt. Missing static
assets in the browser harness, a TS/TSX test-runner parsing issue and one JSX lint
escape were also repaired; affected checks passed without relaxed assertions.
No JavaScript runtime exceptions were reported by the passing browser smoke.

All destructive browser/API tests used temporary schemas and synthetic identities;
those servers, schemas and browser profiles were removed. Live checks were read-only
apart from a separate demo cookie. Final live SQL: **925 distinct User records**,
zero test schemas. Node 20.20.2, healthy app/Postgres, clean startup logs, private
inputs/.env absent, loopback ports and existing volumes retained. Profile and
Messages host URLs returned 200. No live demo profile was deleted by these tests.

## Remaining limits/manual checks

The Chrome smoke is not cross-browser or visual/responsive certification. Clipboard
permission/fallback, keyboard/focus traversal, cross-tab/back-cache behavior,
exact five-second polling/cleanup timing, and invitation/circle safety-dialog
clicks still need manual browser checks; their server permissions were tested.
Previously read/external copies cannot be withdrawn. Moderation staffing/retention
jobs, production scaling and stack/security upgrades remain future work. The
clean install still reported 11 audit findings; no dependency upgrade was made.
No Stage 6 execution blocker remains.
