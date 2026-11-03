# Connect Internationals — five-hour Codex playbook

Prepared for Prashant Bhattarai. Target: a runnable local prototype, concise DESIGN.md, and a short demo by 11:59 p.m. America/Chicago on November 3, 2026.

This is an execution plan and a complete sequence of prompts for Codex on your Mac. The application has not been built or tested by this document. Five hours is a working budget, not a guarantee; environment problems can consume the reserve.

## 1. Prepare once

1. Create a NEW project folder named `connect-internationals`. Keep it separate from Supply Chain Stress Tester and ClassLens.
2. Save this document in that folder with the exact name `CODEX_PLAYBOOK.md`.
3. Create a `private` subfolder. Copy the original `connect_seed_users.json` there. Also put `Prashant_ConnectInternationals_Brief.md` there if you have downloaded it. The product contract below includes the requirements already discussed, so an unavailable original Markdown attachment need not block local implementation.
4. Open the project folder in VS Code and start your existing Codex session/tool in that folder. Docker Desktop must be running to use PostgreSQL.
5. Paste Prompt 1. When it finishes, check its result before sending Prompt 2. Continue through Prompt 8 in the SAME project and conversation. Do not paste all prompts together.
6. If a stage fails, use the repair prompt in section 8. Preserve working code and continue from the failed stage.

If you use the terminal, these commands create and enter the folder; copy the two source files into `private/` using Finder:

```bash
mkdir -p "$HOME/connect-internationals/private"
cd "$HOME/connect-internationals"
codex
```

## 2. The agreed product contract

### Purpose and main journeys

Help international students make friends, meet people with shared ambitions, collaborate, and invite people they already know. Career interests are one route to a relationship; social interests and friendship are also first-class purposes.

The central experience is suggested people. Supporting experiences are small circles and invitations.

- **Meet someone new:** choose visibility, describe interests and connection purposes, see 3–5 relevant suggestions, understand the reasons, send a short introduction, receive acceptance, then chat.
- **Bring a friend:** copy a personal or circle invitation link, share it yourself, and let the friend explicitly accept the connection and separately choose whether to join a circle.
- **Find a circle:** read its purpose and starter activity, join voluntarily, and discover eligible members. Membership never automatically creates personal connections.

Tonight's prototype uses the required fake persona switcher. An invitation landing page can simulate a newcomer entering Connect through a reserved seed persona. It cannot create or verify real Northbridge accounts or prove actual new registrations. Label referral outcomes as demo activations/acceptances.

### What must work tonight

| Area | Required behavior |
| --- | --- |
| Local application | Next.js app, PostgreSQL, migrations, seed importer, reproducible setup |
| Identity | Cookie-based persona switcher using seed users; no real login |
| Profiles | Chosen display name/alias, optional demographic fields, interests, looking-for and can-help-with tags, connection purposes, opt-in discovery and field visibility |
| Discovery | Nationality, city, university, major, purpose/interest filters; pagination; 3–5 suggestions with valid reasons |
| Introductions | Short purpose and note; incoming/outgoing requests; accept, decline, cancel; duplicate and self-request prevention |
| Messaging | Persisted one-to-one messages after acceptance, simple polling |
| Safety | Server-side permissions, block/report, bounded usage, privacy changes, deletion |
| Circles | Three curated circles; purpose, starter activity, join/leave, eligible member list |
| Invitations | Copy personal/circle link, expiry/revocation, deliberate acceptance and demo attribution |
| Handoff | README, concise DESIGN.md answering Maxi's questions, verification results, demo script, screenshots or a recording made from the running app |

Circle discussions/group chat, weekly challenge automation, monetary rewards, public deployment, real account registration, email delivery, AI models/embeddings, calendar integration, and live push notifications are future work. A working map is a stretch item; the map design and cost answer are required in DESIGN.md.

### Stack and architecture

Mirror the brief: Next.js **14** App Router, TypeScript, React 18-compatible dependencies, Tailwind CSS **3**, Prisma **5** with a matching client, PostgreSQL **16**, and Node **20**. Resolve compatible patch releases and retain a lockfile. Do not use an unversioned latest scaffold that silently changes these major versions.

Lifecycle note checked November 3, 2026: Next.js 14 is listed as unsupported and Node 20 is EOL. Preserve the requested stack for this isolated local compatibility prototype, record the limitation in DESIGN.md, and make a supported runtime/framework upgrade a requirement before live deployment. Do not describe the prototype as production-ready. Prefer a project-scoped runtime or Docker over changing the user's global Node installation.

- Pages/components render UI.
- `app/api/connect/.../route.ts` authenticates, validates input, calls a service, and maps errors to HTTP responses.
- `lib/db/services/` owns discovery, privacy, matching, connection transitions, messaging, limits, invitations, circles, reports, and deletion rules.
- `lib/db/repositories/` owns Prisma queries. Pages and route handlers do not call Prisma directly.
- `lib/auth/currentUser.ts` exports a `requireUser()`-shaped function that reads the demo cookie and returns a valid User row. Actor identity comes only from this function.
- `prisma/schema.prisma`, checked-in migrations, and `prisma/seed.ts` define reproducible storage.
- Add indexes for columns actually filtered or ordered on, user-reference columns, and relevant pair/status lookups. Use database uniqueness to protect relationships from concurrent duplicate actions.

Provide `docker-compose.dev.yml` using the brief's Postgres service, `connect` user, `connect_dev` password/database and named volume. The host URL is `postgresql://connect:connect_dev@localhost:5432/connect_dev`. A containerized app uses hostname `postgres`, not localhost. Bind exposed services to loopback. Supply a tested Next.js Dockerfile or Compose app service so the app can also run in Docker. Never remove an existing volume to solve a setup error.

### Data and demo provenance

The uploaded JSON was validated: **925 records, 925 unique IDs and emails**, all email domains `example.test`. There are 107 distinct nonempty nationality labels and 89 distinct nonempty city labels; those counts include withheld-answer labels. City is missing for 10 records and withheld for 137. Nationality is withheld for 25. Only 19 students have nonempty target roles; university and major are empty throughout.

- Keep the original JSON only in ignored `private/`, outside `public/`, client bundles, screenshots, and logs.
- Ignore `.env` files except a credential-free `.env.example`, local database artifacts, build outputs, and the original source attachments. Use `.dockerignore` to keep private data and environment files out of image layers. Mount the seed at runtime when needed.
- Use a minimal local User stub, with no feature-specific additions to the production User concept. New feature data belongs in tables keyed by `userId`.
- Seed provided IDs explicitly. New feature records use `String @id @default(cuid())`.
- Normalize empty and withheld answers to unknown. Map documented city aliases such as NYC/New York, NY without inventing locations for ambiguous input. Preserve raw values privately only if necessary; never infer nationality from a fake name or visa status from anything.
- Deterministically generate clearly marked demo university, major, hobbies/interests, purposes, looking-for and can-help-with values. Maintain per-field provenance: provided seed, synthetic demo, or user entered. Editing a field changes that field's provenance only.
- A visible demo notice and appropriate field labels explain simulated academic/interests data and consent. Seeded consent is a simulation, never evidence of real consent.
- Import all 925 users; reserve a few incomplete/hidden personas for onboarding and invitation tests. Select a deterministic demo subset to simulate discovery opt-in so suggestions can be demonstrated. Newly activated demo profiles start hidden until they opt in.
- Seeding must be repeatable and must not duplicate users, erase messages, reset visibility choices, undo deletion, or overwrite user-edited fields. Keep deletion tombstones minimal if needed to prevent resurrection.

### Matching specification

First apply eligibility and visibility rules. Exclude self, deleted/hidden profiles, and blocks in either direction. Return existing-request/connection state so the UI does not offer duplicate invitations. Filter only on fields allowed for discovery. Missing or withheld values never count as a match.

Use this initial configurable ranking, with stable user-ID tie-breaking. These are proposed product weights, not validated measures of relationship quality:

| Signal | Points | Cap |
| --- | ---: | ---: |
| Shared connection purposes | 5 per shared purpose | 10 |
| Shared interests/hobbies | 3 per shared tag | 9 |
| Their offer matches my need, or my offer matches their need | 5 per distinct match | 10 |
| Same disclosed city | 3 | 3 |
| Same disclosed university | 2 | 2 |
| Same disclosed major | 2 | 2 |
| Same disclosed nationality, only if viewer explicitly enables this preference | 1 | 1 |

Nationality is not a default ranking preference. All users have the same feature access and usage limits regardless of FREE/PAID status.

Explain the top 1–3 nonzero, privacy-permitted reasons in normal language. Distinguish “They can help with…” from “You can help with…”. No compatibility percentages, fabricated reasons, or claims of verified expertise. With too little information, offer browse/filter guidance and optional profile completion; do not pretend there are 3–5 strong matches.

### Privacy, contact and safety rules

- Discovery is opt-in. Give users a preview of their stranger-visible card before saving. Demographic visibility is optional and defaults to hidden for new profiles; chosen alias, purpose and shared interests can support discovery on their own.
- All personal/profile APIs require a valid demo account, except the deliberately limited invitation landing response. No unauthenticated student directory. A visitor preview uses illustrative content explicitly labelled as an example.
- Every route and every service operation enforces actor permissions. Allowlist response fields; never return raw Prisma records or seed emails. Hiding fields in React is insufficient. Apply the same visibility rules to filters, reasons, circle membership displays, counts, and invitations.
- For small groups, use a conservative threshold of five for demographic-cohort disclosures. Suppress overly narrow demographic filter results/counts, and generalize identifying demographic combinations on stranger cards when the combination is below the threshold. Keep shared interests available. Document the exact behavior and the residual risk; this is a privacy heuristic, not a guarantee of anonymity.
- Requests carry a purpose and a note capped at 300 characters. Recipient alone can accept/decline; sender alone can cancel. Atomic transitions prevent duplicate conversations. A declined request cannot be resent in tonight's version; document that limitation.
- Chat requires an accepted relationship and membership of both participants. Poll only the active conversation, about every five seconds, with bounded message history and cleanup when switching views. Limit message text to 2,000 characters; render it as text.
- Suggested configurable limits: five new requests per rolling 24 hours, 20 pending outgoing requests, 30 messages per minute, five reports per 24 hours. Enforce limits on the server with persistent, concurrency-safe counters/transactions. Include retry guidance in limit errors. Persona switching is a demo feature and is not real-world identity or abuse protection.
- Blocking immediately prevents new contact and message access in both directions, removes discovery eligibility, closes pending/accepted relationships, and revokes invitation claims between those users. Keep prior messages inaccessible while blocked. Do not automatically restore an old relationship if an unblock control is provided.
- Reporting records a reason and bounded context; offer a separate block action. A report does not itself mean the other person is guilty. The prototype stores reports but has no human moderation team. DESIGN.md specifies a restricted production review queue and a proposed retention policy.
- Connect-profile deletion requires explicit confirmation and immediately removes discoverability, profile content, memberships, live invites and referral attribution. Purge related requests/conversations/messages according to one clearly disclosed policy. For this prototype, deleting the associated one-to-one conversations for both participants is acceptable if the confirmation explicitly says so. Remove report context involving the profile; document that production retention needs a deliberate decision. Preserve the core User stub and a minimal deletion tombstone, not the old demographic/profile content. Seeding must not resurrect it.
- Mutations reject untrusted cross-origin requests, validate all IDs/tags/lengths, and derive the actor from the cookie. Personalized responses are private/no-store; persona changes clear or reload client state so one user's data does not appear under another persona.
- Gate fake authentication with an explicit `DEMO_MODE` and local binding. No Clerk, Stripe, AWS, email, paid service, scraping, address-book import, or real credentials.

### Circles and invitations

Use three curated example circles: **SWE Interview Partners**, **Campus & City Friends**, and **Project Builders**. Each has a purpose, a starter activity and voluntary join/leave. A 5–10-member starting group is a product target; display actual eligible demo membership, not invented activity or member counts. No group messaging tonight.

Personal and circle invitations use random unguessable tokens, expire after seven days, and can be revoked by the creator. They carry no email address, raw user ID, demographic payload or arbitrary redirect URL. Invitations do not bypass blocks or privacy rules. For a blocked pair, return a generic unavailable response without exposing who blocked whom. Creating a personal link includes explicit permission to receive introductions through that link, independently of global directory visibility. This narrowly scoped permission never exposes the rest of a hidden profile.

Before authentication, disclose only an inviter-approved alias/invitation message and an intentionally public circle summary. No member directory, precise small-cohort count or private profile data. In the demo, a reserved seed persona simulates newcomer entry. Claiming requires an authenticated persona, is idempotent, forbids self-referral, and records at most one referral attribution for that user. A claim does not automatically make the users friends: the invitee explicitly sends an introduction and the inviter accepts it through the normal request flow. Joining a circle is a separate choice. Do not mark a referral successful from a link visit alone. Provide no cash rewards, email sending or fake signup statistics.

## 3. Five-hour budget

Use the start of your actual focused work as minute zero. To use a full five hours before the deadline, begin no later than 6:59 p.m. Central; start earlier to leave breathing room. Package/browser downloads count toward the budget.

| Prompt | Minutes | Cumulative | Finish condition |
| --- | ---: | ---: | --- |
| 1. Environment and foundation | 30 | 30 | Correct project, compatible scaffold, Docker configuration, app opens |
| 2. Database, seed, persona switching | 40 | 70 | 925 users, repeatable seed, validated cookie identity |
| 3. Profiles, privacy and discovery | 45 | 115 | Opt-in onboarding, useful filters and explained suggestions |
| 4. Requests and messages | 55 | 170 | A requests B, B accepts, both chat; C is denied |
| 5. Circles and invitations | 35 | 205 | Join/leave, copy link, newcomer simulation and explicit acceptance |
| 6. Safety and focused verification | 35 | 240 | Permissions, blocking, reporting, caps, deletion verified |
| 7. Design document and demo | 30 | 270 | Concise docs, repeatable demo, screenshots or recording |
| 8. Repair reserve and handoff | 30 | 300 | Remaining failures fixed; honest final status |

These are planning allocations. Codex cannot guarantee a wall-clock duration. Keep your own timer.

At minute 170, prioritize a working discovery → introduction → accepted conversation. At minute 240, stop adding features and complete documentation, verification and the demo. Simplify circle presentation and referral dashboards first if time slips. Do not remove server authorization, privacy, basic abuse controls, or falsify completion. If a required function remains incomplete, record it clearly for Maxi.

## 4. Shared execution rules

Every prompt authorizes the local changes necessary for that stage. Inspect existing work first, then implement and verify; do not stop at a proposed plan or repeatedly ask for confirmation for routine edits/installations. Respect applicable repository instructions. Do not change unrelated projects, overwrite user changes, delete database volumes, send external messages, publish the site or upload the seed data.

Use `CODEX_PLAYBOOK.md` as the agreed product contract and the original private brief as a supporting source when available. Maintain a short `PROGRESS.md` containing completed stages, concrete decisions, commands run, failures, and the next stage. Keep `AGENTS.md` short: architecture boundaries, privacy/data rules, and validation commands. Avoid creating a large documentation framework.

At each stage, report: what works, commands/checks actually run and their outcomes, remaining blockers, and which prompt comes next. Fix failures within the stage's scope before proceeding. Never claim a screenshot, test, database check, referral conversion or deployment occurred unless it did.

## 5. Prompts — paste one at a time

### Prompt 1 — inspect the environment and build the foundation

```text
Read CODEX_PLAYBOOK.md in full and the applicable AGENTS.md instructions. This is a five-hour local prototype for Connect Internationals; the agreed product contract is in that playbook. Implement only Stage 1 now, carrying it through verification.

Inspect the current directory, Git status if present, Node/npm versions, Docker/Compose availability and whether the Docker daemon is running. Confirm this is the intended connect-internationals folder, not another project. Check private/connect_seed_users.json exists without printing its records. Read the original private brief if available. If it is absent, proceed from the playbook and record that fact.

Create or preserve .gitignore and .dockerignore BEFORE copying, staging or packaging data. Exclude private/, original seed JSON/attachments, .env files except .env.example, local database artifacts, build outputs, and dependency folders. Do not put seed contents into source, public/, logs or image layers.

Initialize the Next.js 14 App Router/TypeScript foundation with compatible React, Tailwind 3, Prisma 5/client and Node 20. Resolve patch versions and commit a package lock; avoid latest-major scaffolding. Keep the existing global Node installation unchanged. Prefer an existing project runtime manager or the Node 20 Docker path. Record the lifecycle limitation from the playbook.

Add docker-compose.dev.yml for PostgreSQL 16 with the brief's local credentials and persistent volume, a Next.js Dockerfile/app service, and a credential-free .env.example. Use localhost from the host and postgres from the app container. Bind published services to loopback; never remove an existing database volume or stop an unrelated container. If Docker Desktop is not running, finish independent files and give the exact one manual action needed; do not claim database checks passed.

Create the repository/service/auth directories and a modest responsive app shell with Discover, Requests, Messages, Circles, Invite and Profile navigation. Show a visible local demo notice. Do not implement the later features as fake working buttons. Add a short AGENTS.md and PROGRESS.md. Initialize local Git if needed; do not create a remote or push.

Validate the scaffold with its actual typecheck/lint/build commands, inspect Compose configuration, and start the app through an available local path. Avoid build-time database access. Report the URL and actual results, then stop after Stage 1.
```

### Prompt 2 — database, repeatable seed and fake identity

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Implement Stage 2 on the existing foundation. Preserve Stage 1 and fix prerequisite failures instead of replacing the app.

Design the Prisma schema for the agreed scope: a minimal User stub and feature-owned ConnectProfile, requests/conversations/messages, blocks/reports, circles/memberships, invitations/referral claims, and persistent usage counters as needed. Keep feature columns out of User. Use cuid defaults for new feature rows, explicit seed User IDs, proper relations, indexes for filters/user references, unique memberships, and unique unordered connection pairs. Choose explicit connection states. Add checked-in migrations.

Implement prisma/seed.ts to validate and import all 925 records from ignored private/connect_seed_users.json at runtime. Normalize withheld/missing nationality/city and documented city aliases. Deterministically add demo university/major/interests/purposes/needs/offers, with per-field provenance and visible demo labels. Simulate opt-in for a reproducible demo subset and reserve hidden/incomplete newcomers for onboarding/invitation tests. Do not imply real consent. Do not infer fields from names. A repeated seed must preserve edits, privacy changes, deletions and relationships while avoiding duplicates.

Implement lib/auth/currentUser.ts with requireUser() reading a validated HttpOnly, SameSite cookie. The persona switcher may choose only existing seed users and must be gated by DEMO_MODE. Derive actors from this function, never a body/query actor ID. Missing/invalid identity must not silently impersonate the first user. Changing personas must reload/clear personalized client data. Keep the switcher response limited to IDs and demo aliases; expose no emails or private demographics.

Keep Prisma operations in repositories and business logic in services. Create necessary npm scripts for migrations, seed, development, typecheck, lint, build and focused tests. Do not run migrations against an unverified nonlocal database.

Verify migrations, seed twice, exactly 925 distinct users with no duplication, unknown-value normalization, and preservation of one intentional profile edit. Test missing/invalid cookies and switching A to B. Record a small persona legend in PROGRESS.md using demo aliases/IDs only. Report actual commands/results and stop after Stage 2.
```

### Prompt 3 — onboarding, privacy and useful discovery

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Implement Stage 3: profile settings, opt-in discovery, filtering and explained recommendations. Apply privacy before any data reaches the client.

Build brief onboarding/profile editing for chosen alias, connection purposes, interests/hobbies, looking-for and can-help-with tags, and optional city/nationality/university/major. Keep detailed career fields optional. Add discovery opt-in and field visibility with a stranger-card preview. New users start hidden. Preserve per-field provenance when a person edits data. Include friendship, career preparation, projects and settling-in purposes.

Create a shared privacy/eligibility service and allowlisted DTOs. Exclude self, deleted/hidden people and blocks in either direction. Enforce field visibility in filters, match reasons, counts and returned cards; do not send full Prisma rows, emails, raw seed data or hidden fields. Implement the playbook's small-cohort suppression/generalization policy and document its exact behavior. It must protect direct profile lookups as well as lists. Keep authenticated responses private/no-store.

Add nationality, city, university, major and interest/purpose filters with bounded pagination, useful loading/empty/error states and clear demo provenance. Unknown/withheld answers must not become selectable pseudo-locations. Broaden suggestions with user control; never silently ignore explicit filters.

Implement the playbook's configurable deterministic score. Return up to five suggestions with the top valid privacy-permitted reasons and correct directional needs/offers. Nationality preference is off by default. Existing connection/request state must be visible. Do not display compatibility percentages or fabricate matches when data is sparse.

Verify representative city/university/country filtering, hidden-field attacks, blocked/opted-out/deleted exclusions, small cohorts, complementary-skill direction, stable ranking ties, sparse profiles and persona-switch cache isolation. Run typecheck/lint/build plus focused policy tests. Report outcomes and stop after Stage 3.
```

### Prompt 4 — introductions that become conversations

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Implement Stage 4 end to end using existing repositories/services and the Stage 3 privacy rules.

Build Send introduction with a selected purpose and note up to 300 characters; incoming/outgoing requests; recipient-only accept/decline; sender-only cancel; existing relationship state; and messaging only after acceptance. Prevent self-requests and duplicate/crossed requests with database constraints and atomic transitions. Concurrent acceptance must create only one conversation. Declined requests cannot be resent in this prototype. Do not bypass hidden-profile eligibility, blocks or deleted accounts by posting a known ID.

Enforce the request caps from the playbook on the server now, not just in disabled buttons. Persist usage and make limit checks concurrency-safe. Implement coherent typed errors, validation and cross-origin mutation protection.

Implement paginated persisted messages capped at 2,000 characters. Only accepted participants can list/read/send. Poll the open conversation about every five seconds, clean up on navigation/persona switching, and do not poll every conversation. Render text safely. Re-check permission and blocks on every read/send. Add request/message indicators using real database state.

Use at least A, B and unrelated C for meaningful database-backed checks: A requests B; pre-acceptance chat is denied; B accepts; A and B exchange messages that survive refresh; C cannot read, send, accept or enumerate that conversation; reversed duplicate requests do not create extra rows. Also test invalid transitions and concurrent repeated acceptance. Run checks and repair failures before reporting Stage 4 complete. Stop here.
```

### Prompt 5 — small circles and inviting known friends

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Implement Stage 5 with deliberately small scope.

Create the three curated circles from the playbook, each with a purpose and starter activity. Implement voluntary join/leave, unique memberships and a member list using the SAME privacy/visibility/block policy as discovery. Display real eligible demo membership, not invented activity. Do not add group chat or auto-create personal connections.

Build copyable personal and circle invitation links with random tokens, seven-day expiry and creator revocation. The unauthenticated landing response may show only inviter-approved alias/message and an intentionally public circle summary. No emails, demographics, raw IDs, member directory, unsafe redirects or small-group counts. Missing/expired/revoked/blocked links return appropriate generic states.

Because the brief requires fake identity, simulate newcomer entry using a reserved seed persona. Clearly label demo activation; do not add real signup, Clerk, email or contact import. A personal-link creator explicitly enables receiving introductions through that token; this is a narrow consent path independent of directory visibility. Claiming the link must not automatically create a friendship: the invitee chooses to send an introduction, then the inviter accepts through the normal request flow. Circle joining is a separate action. Honor blocks, deletions and per-field privacy throughout. Make claims idempotent, prevent self-referrals and duplicate attribution, and record at most one referral source per new Connect member. Do not count link visits as successful registrations. Keep rewards and conversion dashboards out of scope.

Test join/leave, duplicate join, privacy-safe member lists, personal invite acceptance, separate circle joining, duplicate claims, self-referral, expired/revoked/invalid links and blocking. A browser test or two isolated sessions should demonstrate that a copied link can be opened independently. If clipboard permission fails, show selectable text with a manual copy fallback. Report actual results and stop after Stage 5.
```

### Prompt 6 — complete safety and verify the full flow

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Implement Stage 6 and audit the existing routes/services against the product contract. Preserve the working journeys.

Complete block/report and confirmed Connect-profile deletion, with the exact semantics in the playbook. Blocking must immediately stop discovery and pending/accepted contact and deny message access in BOTH directions. Reports store a reason and bounded context without claiming human review. Deletion must purge feature content and relationships under a clearly disclosed policy, revoke invitations, preserve the core User stub/minimal tombstone and prevent reseeding resurrection. Clear client state after these changes.

Finish persistent, server-enforced request/message/report caps and input validation. Confirm concurrency cannot overrun the limit or create duplicate requests/conversations/referrals. FREE and PAID personas must have equal access. Reject missing identities, forged actor fields, unauthorized IDs and cross-origin mutations. Check personalized caching and direct API access, not just visible buttons.

Add a compact meaningful database-backed integration suite, using disposable fixtures or an isolated local test database. Never reset the working demo database or delete its volume. Cover: opt-out and hidden-field leakage through lists/lookups/filters/reasons/circles/invites; small cohorts; A/B acceptance and persistence; C denied conversation access; block in each direction; concurrent request/acceptance/limit operations; report; deletion followed by reseeding; referral idempotency; and equal free/paid permissions. Add one browser smoke journey if available. Test text rendering with HTML-like input.

Run Prisma validation/migrations as needed, typecheck, lint, focused integration tests and the build. Inspect app-console/server errors. Fix material failures; do not skip tests or weaken privacy to obtain green output. Record exactly which checks ran, passed, failed or were unavailable. Stop after Stage 6.
```

### Prompt 7 — concise design, reproducible demo and evidence

```text
Read CODEX_PLAYBOOK.md, PROGRESS.md, the implemented code and actual verification outcomes. Implement Stage 7: final documentation and demo evidence. Describe what exists, not an imagined finished product.

Write README.md with local prerequisites, exact host and Docker app setup, .env.example, migrations, runtime seed mounting, development/test/build commands, persona legend and troubleshooting for Docker/ports. Explain how Maxi supplies the private seed. Keep the seed out of Git, images and archives. Include a clean-start reproduction check against a separate local database or Compose project without deleting existing data.

Write a concise DESIGN.md, approximately 1,000–1,400 words excluding compact tables/diagram, answering all brief topics: discovery/ranking/reasons/data normalization; request/accept/message/decline and abuse controls; opt-in/field privacy/small cohorts/block/report/deletion and residual risks; Prisma data model/indexes; free access; and production integration. Clearly separate implemented behavior, demo simulation and future work. Explain that fake names, generated interests/academics and simulated consent cannot validate real compatibility or registrations.

Include a compact Mermaid production architecture showing Traefik, the existing Docker Next.js app on EC2, feature services, shared RDS/PostgreSQL, separate cron workers and SES, with Clerk replacing requireUser(). Explain app-versus-worker responsibilities, polling versus SSE/WebSockets/managed alternatives, opt-in email notifications as future worker work, and future mobile push. Do not provision AWS or add real credentials. Identify who would review reports in production rather than claiming a review team exists.

Answer the map question: city-level circles from consenting eligible profiles, small-cohort suppression, no precise student coordinates; Leaflet is open source, while tile/geocoding services have separate attribution, usage and possible cost conditions. Document the Next.js 14/Node 20 lifecycle limitation and supported-version work before deployment. Use primary documentation links and verify facts when access is available.

Write DEMO.md with a repeatable 3–5-minute script covering opt-in, suggestions/reasons, filters, introduction, A/B acceptance and chat, C denial, circle membership, friend invitation and block. Include deletion as the final optional destructive demo step with confirmation; do not delete a demo persona just to take screenshots. Capture 3–5 screenshots from the actual running local app using available browser tooling, or explicitly mark screenshot capture as a manual step if unavailable. No seed file, email addresses, credentials, fabricated activity or fake testimonials in evidence.

Record real verification results and known limitations in PROGRESS.md. Run relevant checks for any code changed during documentation. Report deliverable paths and stop after Stage 7.
```

### Prompt 8 — use the repair reserve and prepare the handoff

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Complete Stage 8 using the remaining time. Prioritize broken required journeys and reproducibility, then visual issues that prevent use. Do not start a redesign or new feature.

Reconcile every required item with actual implementation and verification. Fix material failures. Check forms, keyboard use, responsive layout around 375px and desktop width, loading/empty/error states and persona transitions. Ensure every active button performs a real action. Exercise the demo once from beginning to end. Repeat only affected checks and the final build after fixes.

Run git diff --check and inspect tracked/staged filenames for private seed data, original private attachments, .env files, databases, logs, screenshots with sensitive content and build output. Verify .gitignore/.dockerignore behavior; ignored files that were previously tracked still require explicit removal from the index while preserving local bytes. Do not publish or push. A local commit is acceptable only when Git identity already exists and the staged file list has been reviewed for private inputs; otherwise leave the work intact and report that state.

Ensure README.md, DESIGN.md, DEMO.md and PROGRESS.md are truthful and consistent. Finish with: runnable commands and URL; implemented features; actual passed/failed/unrun checks; exact remaining limitations; seed-data exclusion status; demo evidence paths; and the next step for sharing a PRIVATE repository with Maxi. Do not send Maxi a message or assert a repository was shared.

If time runs out, leave the app in its best working state and state the incomplete items precisely. Never mark incomplete functions as complete. Stop after the handoff.
```

## 6. What you personally check between prompts

| After | Your quick check |
| --- | --- |
| 1 | The app opens; Docker is running; this is the new project folder |
| 2 | Switching personas changes the current identity; 925 users imported |
| 3 | You can opt in, change visible fields and understand a suggestion |
| 4 | You personally send A → B, switch to B, accept, and reply |
| 5 | A copied link opens independently; joining a circle is voluntary |
| 6 | Blocking stops contact; unauthorized API access is denied; deletion policy is clear |
| 7 | You can explain each major product decision in your own words |
| 8 | The app runs, docs agree with it, and private inputs are excluded |

Maxi asked for your reasoning. Read DESIGN.md yourself and revise any decision you cannot explain. Be candid about coding assistance and about what has only been simulated.

## 7. Final delivery checklist

- [ ] Correct specified stack with exact versions and a lockfile; lifecycle limitation recorded.
- [ ] Local app and PostgreSQL run reproducibly; Docker app path documented and checked.
- [ ] All 925 records imported, private input excluded, synthetic fields labelled, repeatable seed preserves changes.
- [ ] Persona switcher, opt-in, privacy preview, filters and explained suggestions work.
- [ ] Requests/acceptance/decline/cancel and persisted two-way messaging work.
- [ ] Outsiders denied; blocks, reports, limits, deletion and cache isolation verified.
- [ ] Three simple circles and personal/circle invitation flows demonstrated.
- [ ] Fake signup/consent/referral simulations identified honestly.
- [ ] DESIGN.md answers AWS architecture, privacy, contact, free access and map questions.
- [ ] README, demo script and screenshots/recording or clear capture instructions ready.
- [ ] Working features, missing features and passed/unrun checks reported accurately.

To share on GitHub, create a **private** repository, inspect tracked files again, verify remote visibility, then push and invite Maxi using the account he specifies. Private-repository access does not make committing the supplied seed appropriate. A clone needs the seed through a separate authorized channel and the README setup steps.

## 8. Repair / resume prompt

```text
Stay in the current connect-internationals project. Read CODEX_PLAYBOOK.md, AGENTS.md and PROGRESS.md, then inspect the current code, Git status and the latest failing command/output.

Repair the current stage rather than restarting or replacing working implementation. Reproduce the failure, identify its cause, make the smallest coherent fix and rerun the affected checks. Preserve private-data exclusions, the required stack, privacy/authorization rules and existing user changes. Do not reset database volumes, delete unrelated work, weaken tests, introduce a live service or claim a blocked check passed.

Update PROGRESS.md with the fix, actual results, remaining blockers and the exact next prompt number. If a manual action is unavoidable, identify that one action and finish any independent work first. Stop when the current stage works or the concrete blocker is established.
```

## 9. Optional map prompt — only after required checks and handoff are ready

Do not spend the repair reserve on this while any required journey is broken. The design answer is sufficient for the original brief; this enhancement may remain future work.

```text
Read CODEX_PLAYBOOK.md and PROGRESS.md. Add a small optional city-circle map only if all required stages are working and I have explicitly chosen to spend remaining time on it.

Use Leaflet 1.9.4 stable with Next.js 14-compatible client-only loading. Use documented city-centroid coordinates from an appropriate primary source, with provenance. Do not geolocate students, guess coordinates, send student data to a geocoder or use individual profile pins. Skip unknown cities. Aggregate only eligible opted-in profiles, apply the same blocks/visibility/small-cohort rules and show coarse count bands rather than precise small counts. No sensitive nationality/university overlays. Selecting a city can open the existing privacy-safe discovery view.

Keep attribution visible, follow the selected tile service's terms, and preserve a useful list fallback if tiles/network fail. Do not add paid keys, bulk tile downloads or unverified free-unlimited claims. Test hydration, loading, small-cohort suppression and fallback, rerun affected checks/build, and update DESIGN.md and the demo. If this cannot be completed cleanly, preserve the working core and report the map as future work.
```

## 10. Primary references

- [OpenAI: Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex) — outcome-driven specifications, milestones, acceptance criteria and validation.
- [Next.js support policy](https://nextjs.org/support-policy) — version support and production lifecycle.
- [Node.js releases](https://nodejs.org/en/about/previous-releases) — Node 20 lifecycle status.
- [Leaflet 1.9.4 reference](https://leafletjs.com/reference-1.9.4.html) — stable map library and circle layers.
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) — attribution, limited service capacity and acceptable tile use.

These references support the workflow/lifecycle/map notes. Matching weights, usage caps, cohort threshold, feature scope and time budgets are proposed project decisions, not externally validated claims.
