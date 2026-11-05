# Stage 3 — complete

Profile settings and discovery now work at http://localhost:3000/connect.
Stage 2 identity, seed behavior and storage were preserved. Stage 4 was not started.

## What changed, how and why

- `/connect/profile` edits alias, four connection purposes, interests, needs,
  offers and optional nationality/city/university/major. It provides discovery
  opt-in, separate background-sharing flags and a server-generated preview
  before the UI enables saving. Consent is explicitly simulated. Only actual
  content changes change that field's provenance; untouched metadata survives.
- Revisions contain owner ID and update time. Stale edits and forms belonging
  to another persona receive 409. Actors still come exclusively from the cookie.
- Discovery supports exact AND filters, city aliases, pages 1–100 and 1–20 cards
  per page (default 12). Filters never broaden silently. Loading, errors, empty
  lists and sparse profiles have explicit states. Relationship state is shown;
  introductions/chat remain future stages.
- Up to five positive-score suggestions use the playbook's weights/caps and
  stable ID tie-breaking. Reasons show the top 1–3 allowed signals, distinguish
  “They can help” from “You can help,” and never show compatibility percentages.
  Nationality preference defaults off. Synthetic values are labelled.

## Privacy policy

A shared server projection excludes self, hidden/deleted profiles and blocks in
both directions, then removes fields without sharing permission. A complete
combination of disclosed background fields needs five eligible people in the
viewer's corpus; otherwise all demographic values and their provenance disappear.
This applies to direct lookups, options, filters and matching reasons. An excluded
lookup returns generic 404. Demographic queries matching fewer than five people
return no cards/recommendations/count; combinations are checked again after
filtering. No exact totals are returned. Preview conservatively uses six including
the owner; individual viewers' blocks can hide more. Tags remain available.

## Important files

- `lib/db/repositories/connectRepo.ts`: selected Prisma queries and snapshot reads.
- `lib/db/services/connectService.ts`, `connectValidation.ts`, `privacyService.ts`,
  `recommendationService.ts`: editing, validation, privacy and scoring rules.
- `lib/connect/types.ts`, `lib/http/connect.ts`: allowlisted DTOs and authenticated,
  private/no-store HTTP handling. API routes cover profile, preview, discovery
  and direct profile lookup.
- `app/components/ProfileEditor.tsx`, `Discovery.tsx`, `StrangerCard.tsx`,
  `connectClient.ts`: UI and request cleanup; persona switching clears state and
  fully navigates. Back-cache restoration/cross-tab identity checks reload too.
- `scripts/verify-stage3*.ts`, `stage3VerificationRepo.ts`: focused verification.

## Actual verification

Passed in Node 20 Docker: `test:stage3`, Stage 2 regression `test:stage2`,
`test:stage3:http`, `test:persona`, Prisma validation, typecheck, lint and production
build. The rebuilt app started successfully. Host discovery/profile URLs return
200. PostgreSQL retains **925 users and 925 distinct IDs**. Private inputs/.env
are absent from the app container; ignore, Compose and diff checks passed.

Database fixtures tested normalization, individual/combined filters, pagination,
scoring caps/direction/ties, sparse inputs, hidden-field attacks, both block
directions, deletion/opt-out, five-versus-four cohorts, narrowed searches,
allowlists, relationship states, preview, revision conflicts and provenance.
Fixtures rolled back. HTTP checks used independent cookie identities, verified
private responses/direct lookups/non-mutating preview, and rejected forged,
stale, cross-persona and cross-origin writes. No saved profiles were changed.
Initial fixture assertion/type errors were corrected and affected checks rerun.

## Remaining limitations

No browser automation was available: clicks, responsive appearance, browser
back-cache/cross-tab behavior and successful UI save interaction remain manual
checks. Successful edits were exercised through database-backed services;
HTTP tested preview and rejected writes. Existing demographic sharing choices
remain hidden, so demographic options may be empty. Cohort protection is a
heuristic with linkage/repeated-query risk, not anonymity. The local prototype
loads eligible profiles for in-memory ranking; production scaling and the
existing stack/audit issues remain future work. No Stage 3 execution blocker remains.
