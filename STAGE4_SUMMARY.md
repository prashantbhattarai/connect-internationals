# Stage 4 — complete

Introductions and accepted one-to-one messaging now work at
http://localhost:3000/connect. Stage 5 was not started.

## Behavior and design

- Discovery cards open an introduction composer: one supported purpose and a
  nonempty note up to 300 characters. Requests displays incoming/outgoing
  introductions, stored states and pending-on-this-page indicators. Recipients
  alone accept/decline; senders alone cancel. Invalid transitions, self-requests
  and duplicate/crossed pairs are rejected. Repeated acceptance by the recipient
  is idempotent and returns the same conversation. Declined, cancelled and closed
  pairs cannot be resent in this prototype.
- New introductions and first acceptance require eligible, discoverable peers,
  using Stage 3 privacy rules. Knowing an ID does not bypass them. Hidden pending
  peers expose no alias/note. Only active, unblocked participants in an accepted
  relationship can access chat. Discovery opt-out preserves already accepted
  chat; blocking/deletion immediately denies subsequent API reads/sends.
- Messages persist in PostgreSQL, accept 1–2,000 characters and render as React
  text. History uses stable createdAt/ID ordering and an exclusive older-message
  cursor; default pages are 20, maximum 50. Only the selected conversation polls
  about every five seconds. Older-page polling keeps that bounded page; Latest
  returns to new messages. Navigation/persona changes abort requests and timers.
- Server limits are five introductions per rolling 24 hours, 20 pending outgoing
  and 30 messages per rolling minute across conversations. Participant User row
  locks serialize checks, transitions, usage recording and writes. Persistent
  usage survives cancellation; rate errors include Retry-After. Profile edits
  share this lock protocol; future block/deletion mutations must too.
- Routes derive actors only from requireUser(), validate allowlisted input,
  reject cross-origin mutations and return private/no-store DTOs. The displayed
  identity header is a stale-form precondition, never authentication.

## Important files

- `contactService.ts`, `contactValidation.ts`, `contactRepo.ts` under `lib/db/`:
  authorization, transitions, transactions, persistent limits and queries.
- `lib/connect/contactTypes.ts`, `lib/http/connect.ts`: response contracts,
  authentication/error mapping and identity preconditions.
- Request, request-conversation, conversation-list and message API routes under
  `app/api/connect/`; `IntroductionComposer.tsx`, `Requests.tsx`, `Messages.tsx`
  and discovery/card updates under `app/components/`.
- Migration `202611030002_canonical_pair_order`: explicit ASCII/C ordering fixes
  a locale mismatch between JavaScript pair sorting and the old database check.
  Existing IDs, relationships and messages are preserved.
- `scripts/run-stage4-tests.ts`, `verify-stage4*.ts` and
  `lib/db/repositories/stage4TestRepo.ts`: isolated database/API verification.

## Actual results

Passed in Node 20 Docker: Stage 4 database tests and isolated production-server
HTTP tests with independent A/B/C cookies; Stage 2/3 database regressions;
Stage 3 HTTP/persona regressions; Prisma validation/migration deployment/status;
typecheck, lint and production build. The initial concurrency test exposed the
pair-order locale bug; the migration repaired it and all affected checks passed.

Verified pre-accept denial, A/B message persistence across fresh requests,
C denied read/send/accept/enumeration, one conversation under concurrent accepts,
crossed/duplicate sends, invalid transitions, hidden/deleted/blocked users,
stable pagination, text bounds, real concurrent quotas, cancellation retention,
rolling expiry, stale-persona protection and HTML-like text retained literally.

Committed synthetic fixtures used guarded random temporary schemas; each was
removed afterward. The demo retains **925 distinct users**, zero test schemas
remain, private inputs/.env are absent from the app image, and no database volume
was removed. Rebuilt Requests/Messages URLs return 200; startup logs are clean.

## Limitations

Browser clicks, appearance, actual DOM text rendering, five-second timer behavior,
back/forward and cross-tab interactions remain unverified: browser automation was
unavailable. Services and HTTP were exercised, not a browser. Block/report/deletion
controls and full cleanup remain later-stage work; their existing database state
is enforced now. No unread tracking or live push is claimed. Existing dependency
findings/stack lifecycle limits remain. No Stage 4 execution blocker remains.
