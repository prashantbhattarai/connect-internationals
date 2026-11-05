# Maxi's 3–5-minute walkthrough

Use http://localhost:3000/connect after README setup. This is a local demo with
simulated identities/consent, not student testimonials, real registrations or
verified compatibility. Record only the app viewport. Keep browser address bars,
DevTools, seed files, database viewers and terminal output out of the recording;
invitation URLs contain secrets. Never record the newly generated link field.

## Prepare before recording

Use a disposable rehearsal environment if you intend to block or delete. The
README clean-start project at http://localhost:3001 has its own temporary database.
Do not delete a live persona just to produce evidence. A closed/declined/cancelled
pair cannot restart; choose another unused pair rather than resetting records.

Select Demo 004 (A) and Demo 005 (B) in turn. Under Profile choose discovery opt-in,
purpose `friendship`, interest `demo practice`, and optionally A looking-for / B
can-help-with `mock interviews`. Leave nationality ranking off and background
fields hidden. Preview on the server, then save each. These are deliberate demo
edits, not evidence of real student preferences. Keep Demo 006 (C) independent.
Have one unused reserved newcomer (001–003) available. If already activated,
use another reserved persona or the separate fresh reproduction project.

## Record in this order

1. **0:00–0:45 — control and discovery.** As A, show Profile opt-in, separate field
   controls and stranger preview. Return to People. Explain one shared-purpose or
   complementary-skill reason; synthetic fields are labelled. Filter interest to
   `demo practice`, apply and clear it. Background choices may legitimately be
   absent because fields are hidden or cohorts are too small. Do not promise a
   demographic result that the current data cannot safely show.
2. **0:45–1:45 — explicit contact.** On B's card choose the introduction action,
   select friendship and send a short note. Requests shows outgoing pending.
   Chat is unavailable before acceptance. Switch explicitly to B; accept in
   Requests, open the conversation and send `Demo B: happy to practice.` Switch
   to A, open Messages and reply `Demo A: let's choose a time.` Reload to show
   persistence. The recipient can decline and the sender can cancel pending
   requests; neither action refunds usage or permits resending this pair.
3. **1:45–2:05 — independent C.** Retain the A/B conversation URL privately,
   switch to C, and navigate to it without showing the address bar. The app must
   show Contact unavailable and no message history. This tests authorization,
   not merely whether a navigation link is hidden. Return to A.
4. **2:05–2:35 — circles.** Open Circles, show the three purposes and proposed
   starter activities. Join SWE Interview Partners, inspect members, then leave.
   Small counts can be withheld and empty lists are honest; joining grants no
   personal connection or group chat. Do not invent participation to fill a shot.
5. **2:35–3:45 — invite a friend.** Open Invite. Choose a circle invitation to
   Project Builders, enter an approved demo alias/message, and explicitly approve
   both public information and introduction permission. Pause recording before
   creating/copying the link. Copy with the button, or select the text manually
   if clipboard permission fails. Open the landing with the address bar excluded,
   then resume. It shows only approved information/public circle summary.
   Select an unused reserved newcomer explicitly and confirm **simulated**
   activation. Nothing signs in as A, creates friendship or joins a circle.
   Separately send the newcomer introduction with its sharing acknowledgement.
   Switch to A on the main app and accept through Requests. Circle joining is
   still separate: return as the newcomer and choose Join circle voluntarily.
   Returning as A, revocation is available in Invite; pending permission expires
   after seven days, while an already accepted chat is independent of the link.
6. **3:45–4:30 — safety.** As A, open B's block/report control. Show report reasons
   and the accurate local-recording/no-human-monitoring message if submitting a
   test report. Block B, then check the chat is unavailable. Profile lists A's
   block; removing it does not reopen the old conversation or old link permissions.
   End by explaining the prototype requires production moderation ownership.

**Optional final destructive step, outside the core recording:** in a disposable
rehearsal only, show Profile deletion disclosures. It removes affected two-party
chat history as well as feature data. Check both acknowledgements and type
`DELETE CONNECT PROFILE` to enable deletion. Do not submit against a live persona
for screenshots. A retained ID/deletion marker prevents reseeding restoration.

## Captured evidence

These five unedited viewport screenshots came from the actual running production
build at localhost:3100 with seven explicitly synthetic fixture identities in an
isolated schema. They contain no supplied student fields, raw invitation tokens,
credentials or email addresses. They show controlled fixtures, not organic
activity. The A→B pending request and voluntary memberships were deliberately
prepared by the fixture service; browser acceptance and subsequent messages were
real actions. No persona was deleted for these images.

| Image | Shows |
| --- | --- |
| [01-discovery.png](docs/screenshots/01-discovery.png) | Visible synthetic profiles and deterministic reasons |
| [02-messaging.png](docs/screenshots/02-messaging.png) | Accepted A/B conversation with persisted demo messages |
| [03-circles.png](docs/screenshots/03-circles.png) | Three circles and actual fixture memberships |
| [04-invitation.png](docs/screenshots/04-invitation.png) | Approved landing and independent newcomer choice; URL chrome excluded |
| [05-safety.png](docs/screenshots/05-safety.png) | Real block/report dialog before blocking |

To reproduce the evidence after a completed Docker tools build, in one terminal:

```sh
docker compose -f docker-compose.dev.yml run --rm --name connect-stage7-browser-tools -p 127.0.0.1:3100:3100 tools node scripts/run-ts.cjs scripts/stage7-browser-server.ts
```

In another terminal with host dependencies installed and local Chrome available:

```sh
node scripts/stage7-browser-evidence.cjs
docker stop --timeout 20 connect-stage7-browser-tools
```

The driver uses host Node only for CDP automation; the app runs Docker Node 20.
Set `CHROME_PATH` if Chrome is elsewhere. It uses a fresh temporary browser
profile, asserts independent acceptance, A/B messages, C denial, idempotent
activation, explicit introduction/separate membership and block denial, and
captures only viewport pixels. The launcher reuses the guarded Stage 6 temporary
schema namespace and cleans only its own schema when stopped. Do not run against
an arbitrary app URL: the driver is fixed to isolated localhost:3100.

The driver is not a full recording of all steps above: opt-in/filter editing,
clipboard/fallback, invitation revocation/acceptance via clicks, circle join/leave
via clicks, keyboard/mobile layout and cross-tab behavior remain manual checks.
Server rules for those flows have separate regression evidence. No video was
recorded or sent to Maxi; the files are ready for local review.
