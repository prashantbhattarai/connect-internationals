import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalize, normalizeCity, prepareSeed } from "../lib/db/services/seedService";
import { resolveIdentity } from "../lib/db/services/personaService";
import { verifySeedPersistence } from "../lib/db/repositories/stage2VerificationRepo";
import { db } from "../lib/db/repositories/client";
async function main() {
 const input: unknown = JSON.parse(await readFile("private/connect_seed_users.json", "utf8"));
 const profiles = prepareSeed(input);
 assert.throws(() => prepareSeed([]), /925/);
 const records = input as Record<string, unknown>[];
 assert.throws(() => prepareSeed([records[0], records[0], ...records.slice(2)]), /validation/);
 assert.deepEqual(prepareSeed(input), profiles);
 for (const value of [null, undefined, "", "  ", "Prefer not to say", "I'd prefer not to say", "Unknown", "N/A"]) assert.equal(normalize(value), null);
 assert.equal(normalizeCity(" NYC "), "New York, NY"); assert.equal(normalizeCity("New York, NY"), "New York, NY"); assert.equal(normalizeCity("Springfield"), "Springfield");
 assert.equal(profiles.filter(p => p.city === null).length, 147);
 assert.equal(profiles.filter(p => p.nationality === null).length, 25);
 assert.ok(profiles.slice(0,3).every(p => !p.discoverable && p.university === null && !p.interests.length));
 await verifySeedPersistence(input);
 await assert.rejects(resolveIdentity(undefined), /Choose/); await assert.rejects(resolveIdentity("invalid"), /Choose/); await assert.rejects(resolveIdentity("seed_nonexistent"), /valid/);
 process.env.DEMO_MODE = "false"; await assert.rejects(resolveIdentity(profiles[0].userId), /disabled/); process.env.DEMO_MODE = "true";
 console.log("PASS: 925 distinct users; normalization; deterministic enrichment; hidden newcomers; repeated import preserves edit, visibility, tombstone, relationship and messages; unordered pair uniqueness; invalid identity and DEMO_MODE. Fixtures rolled back.");
}
main().catch(() => { console.error("Stage 2 verification failed; private details suppressed."); process.exitCode = 1; }).finally(() => db.$disconnect());
