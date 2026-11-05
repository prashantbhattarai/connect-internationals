import assert from "node:assert/strict";
import { DiscoveryResponse, ProfileResponse, StrangerCard } from "../lib/connect/types";
async function main() {
 const base = process.env.TEST_APP_URL ?? "http://app:3000";
 const request = (path: string, cookie?: string, init: RequestInit = {}) => fetch(`${base}${path}`, { ...init, headers: { ...(cookie ? { Cookie: cookie } : {}), ...init.headers } });
 const json = async <T>(path: string, cookie: string): Promise<T> => {
  const response = await request(path,cookie); assert.equal(response.status,200); assert.match(response.headers.get("cache-control")!,/private.*no-store/); assert.match(response.headers.get("vary")!,/Cookie/i); return response.json();
 };
 for (const path of ["/api/connect/profile","/api/connect/discovery","/api/connect/profiles/seed_nonexistent"]) {
  assert.equal((await request(path)).status,401); assert.equal((await request(path,"connect_demo_user=invalid")).status,401);
 }
 for (const [path,method] of [["/api/connect/profile","PATCH"],["/api/connect/profile/preview","POST"]]) assert.equal((await request(path,undefined,{ method,headers:{Origin:"http://localhost:3000","Content-Type":"application/json"},body:"{}" })).status,401);
 const options = await (await request("/api/connect/personas")).json();
 async function login(userId: string) {
  const response = await request("/api/connect/persona",undefined,{ method: "POST",headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },body: JSON.stringify({ userId }) });
  assert.equal(response.status,200); return response.headers.get("set-cookie")!.split(";")[0];
 }
 const a = options.personas[0].userId, b = options.personas[1].userId;
 const cookieA = await login(a), cookieB = await login(b);
 const profileA = await json<ProfileResponse>("/api/connect/profile",cookieA);
 const profileB = await json<ProfileResponse>("/api/connect/profile",cookieB);
 assert.equal(profileA.profile.userId,a); assert.equal(profileB.profile.userId,b); assert.notEqual(a,b);
 assert.deepEqual(await json<ProfileResponse>("/api/connect/profile",cookieA),profileA);
 const discoveryA = await json<DiscoveryResponse>("/api/connect/discovery",cookieA);
 const discoveryB = await json<DiscoveryResponse>("/api/connect/discovery",cookieB);
 assert.equal(discoveryA.viewerId,a); assert.equal(discoveryB.viewerId,b);
 assert.equal((await json<DiscoveryResponse>("/api/connect/discovery",cookieA)).viewerId,a);
 assert.ok(discoveryA.items.length <= 12); assert.ok(discoveryA.recommendations.length <= 5); assert.ok(!("total" in discoveryA));
 const cardKeys = ["userId","alias","purposes","interests","lookingFor","canHelpWith","demographics","provenance","relationship"].sort();
 for (const card of discoveryA.items) {
  assert.notEqual(card.userId,a); assert.deepEqual(Object.keys(card).sort(),cardKeys);
  assert.deepEqual(await json<StrangerCard>(`/api/connect/profiles/${card.userId}`,cookieA),card);
 }
 for (const card of discoveryA.recommendations) { assert.notEqual(card.userId,a); assert.ok(card.reasons.length >= 1 && card.reasons.length <= 3); assert.deepEqual(Object.keys(card).sort(),[...cardKeys,"reasons"].sort()); }
 for (const target of [a,b,"seed_nonexistent"]) assert.equal((await request(`/api/connect/profiles/${target}`,cookieA)).status,404);
 for (const query of ["pageSize=100","page=0","city=Unknown","city=A&city=B","actorId=forged"]) assert.equal((await request(`/api/connect/discovery?${query}`,cookieA)).status,400);
 const interest = discoveryA.options.interest[0];
 if (interest) {
  const filtered = await json<DiscoveryResponse>(`/api/connect/discovery?interest=${encodeURIComponent(interest)}&pageSize=1`,cookieA);
  assert.ok(filtered.items.length <= 1); assert.ok([...filtered.items,...filtered.recommendations].every(card => card.interests.includes(interest)));
 }
 const body = { version: profileA.profile.version, alias: "Stage 3 preview only", city: "NYC", nationality: "Prefer not to say", showCity: true, showNationality: true, discoverable: true };
 const mutate = (path: string, payload: unknown, origin = "http://localhost:3000", method = "POST") => request(path,cookieA,{ method, headers: { Origin: origin,"Content-Type": "application/json" },body: JSON.stringify(payload) });
 const previewResponse = await mutate("/api/connect/profile/preview",body); assert.equal(previewResponse.status,200);
 const preview = await previewResponse.json(); assert.equal(preview.preview.alias,body.alias); assert.ok(!("nationality" in preview.preview.demographics));
 assert.deepEqual(await json<ProfileResponse>("/api/connect/profile",cookieA),profileA);
 assert.equal((await mutate("/api/connect/profile",{ version: profileA.profile.version, userId: b, alias: "Forged" },undefined,"PATCH")).status,400);
 assert.equal((await mutate("/api/connect/profile",{ version: `${a}:2000-01-01T00:00:00.000Z`, alias: "Stale" },undefined,"PATCH")).status,409);
 assert.equal((await mutate("/api/connect/profile",{ version: profileB.profile.version, alias: "Cross-persona stale form" },undefined,"PATCH")).status,409);
 assert.equal((await mutate("/api/connect/profile/preview",body,"https://untrusted.example")).status,403);
 assert.equal((await mutate("/api/connect/profile/preview",{ ...body, interests: Array(11).fill("tag") })).status,400);
 assert.deepEqual(await json<ProfileResponse>("/api/connect/profile",cookieA),profileA);
 for (const path of ["/connect","/connect/profile"]) assert.equal((await request(path)).status,200);
 console.log("PASS Stage 3 HTTP: auth/cache isolation with independent A/B cookies; owner DTOs; allowlisted discovery/direct cards and reasons; bounded filters/pagination; preview without mutation; rejected forged actor, stale edits and cross-origin requests; app pages. No saved profile changes.");
}
main().catch(error => { console.error(`Stage 3 HTTP verification failed (${error instanceof Error ? error.name : "unknown"}); private response bodies omitted.`); if (error instanceof Error) console.error(error.stack?.split("\n").filter(line => /^\s+at /.test(line)).slice(0,4).join("\n")); process.exitCode = 1; });
