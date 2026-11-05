# Stage 5 — complete

Circles and invitations work at http://localhost:3000/connect. Stage 6 was not
started. Existing privacy, identity, pair-state and usage rules are preserved.

## What changed and why

- Three curated circles have public purposes and proposed starter activities:
  SWE Interview Partners, Campus & City Friends, and Project Builders. Join/leave
  is voluntary and idempotent, with database uniqueness. No members or activity
  are invented; joining never creates friendships or group chat.
- Member cards use the shared stranger projection, then apply cohort protection
  within the circle. Self, hidden/deleted profiles and bidirectional blocks are
  excluded. Counts describe eligible visible peers: small counts are withheld,
  with 5–9 / 10–19 / 20+ bands above that threshold. Lists remain bounded.
- Personal/circle links use 32 cryptographically random bytes, SHA-256 storage,
  seven-day expiry and creator revocation. The owner receives the raw link once.
  Copy has an always-selectable manual fallback. Public landing DTOs contain only
  approved alias/message, introduction permission and a public circle summary.
  Token access never sets a creator-login cookie or records a visit as signup.
- Reserved personas explicitly simulate newcomer activation, initially hidden.
  Claims are idempotent and unique per newcomer; concurrent competing sources
  cannot replace attribution. An activation marker prevents reattribution if a
  source later disappears. There are no registration metrics, rewards or emails.
- Activation, introduction, recipient acceptance and circle joining are separate
  choices. Personal links require explicit consent to receive introductions;
  circle links can be join-only. The contact service handles narrow permission
  for hidden profiles without making them discoverable. Approved alias snapshots
  prevent later private alias edits from leaking. Ordinary direct requests still
  require ordinary eligibility; pair restrictions and quotas remain unchanged.
- Pending invitation requests recheck live consent/expiry before acceptance.
  Revocation invalidates associated claims and pending acceptance. Already
  accepted relationships continue independently, subject to blocks/deletion.
  All mutations use cookie actors, stale-persona/origin checks and User-row locks.

## Important files

`communityService.ts` and `invitationPolicy.ts` define circle/invitation rules;
`circleRepo.ts` and `invitationRepo.ts` own their Prisma queries. `contactService.ts`
reuses one introduction persistence/limit path for ordinary and invitation flows.
Migration `202611030003_invitation_consent` adds feature-owned activation,
consent snapshots and claim-revocation fields; User remains unchanged.

`Circles.tsx`, `InvitationManager.tsx`, `InvitationLanding.tsx`, the newcomer
selector and `/connect/invitation/[token]` provide the UI. Thin API routes live
under `app/api/connect/circles`, `invitations` and `newcomers`. `db:circles` and
private seeding ensure the three circle rows without joining anyone.
`scripts/verify-stage5*.ts` and `run-stage5-tests.ts` provide isolated verification.

## Actual verification — November 4, 2026

Passed in Node 20 Docker: Stage 5 database and isolated HTTP suites; Stage 2/3
focused regressions; full Stage 4 database/HTTP regressions; live Stage 3 HTTP and
persona regressions; Prisma validation/migration status; typecheck, lint and
production build. Independent creator/newcomer cookie sessions opened the same
link without identity transfer, then performed separate activation, introduction,
normal acceptance and joining. Tests cover concurrent claims/memberships,
privacy/cohorts/counts, one source, snapshots, expiry/revocation, self-referral,
invalid links, blocks/deletion and shared request limits. Temporary schemas were
removed; live checks created no memberships, claims or invitations.

Rebuilt app checks passed: three circles, bounded member lists, own link manager,
three reserved options, invalid-link handling and host Circles/Invite HTTP 200.
The database retains **925 distinct users**, three circles and zero test schemas;
private inputs/.env are absent from the app container. Volumes were preserved.

## Remaining limitations

Browser clicks, clipboard permission/fallback interaction, visual layout and
cross-tab/back navigation were not automated; those remain manual checks. Member
lists can imply small-group membership despite coarse count labels. Approved
public text remains public without identity; authenticated pair blocks are
checked before showing it. Block/report/deletion controls and final safety audit
belong to Stage 6. Clean installation reported 11 audit findings; no dependency
upgrade/remediation was performed. No Stage 5 execution blocker remains.
