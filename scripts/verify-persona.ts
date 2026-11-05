import assert from "node:assert/strict";
async function main() {
 const base = process.env.TEST_APP_URL ?? "http://app:3000";
 const current = (cookie?: string) => fetch(`${base}/api/connect/persona`, { headers: cookie ? { Cookie: cookie } : {} });
 assert.equal((await current()).status, 401);
 assert.equal((await current("connect_demo_user=invalid")).status, 401);
 assert.equal((await current("connect_demo_user=seed_nonexistent")).status, 401);
 const options = await fetch(`${base}/api/connect/personas`); assert.equal(options.status, 200);
 const { personas } = await options.json(); assert.equal(personas.length, 925);
 assert.ok(personas.every((p: object) => Object.keys(p).sort().join(",") === "alias,userId"));
 const switchTo = (userId: string, origin = "http://localhost:3000", extra = {}) => fetch(`${base}/api/connect/persona`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ userId, ...extra }) });
 assert.equal((await switchTo(personas[0].userId, "https://untrusted.example")).status, 403);
 assert.equal((await switchTo(personas[0].userId, "http://localhost:3000", { actorId: personas[1].userId })).status, 400);
 assert.equal((await switchTo("seed_nonexistent")).status, 401);
 for (const persona of personas.slice(0,2)) {
  const response = await switchTo(persona.userId); assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!; assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Lax/i);
  const identity = await current(cookie.split(";")[0]); assert.equal(identity.status, 200); assert.match(identity.headers.get("cache-control")!, /no-store/);
  assert.deepEqual((await identity.json()).current, persona);
 }
 const page = await fetch(`${base}/connect`); assert.equal(page.status, 200); assert.match(await page.text(), /Logged in as/);
 console.log("PASS: HTTP missing/invalid identity; restricted DTO; A/B cookie switching; HttpOnly/SameSite; no-store; forged actors and cross-origin rejection; app shell.");
}
main().catch(() => { console.error("HTTP persona verification failed; private details suppressed."); process.exitCode = 1; });
