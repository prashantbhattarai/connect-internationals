import assert from "node:assert/strict";
import { StrangerCard } from "../lib/connect/types";
import { parseDiscoveryQuery, parseProfilePatch } from "../lib/db/services/connectValidation";
import { rankCards, scoreCard } from "../lib/db/services/recommendationService";
import { verifyStage3Database } from "../lib/db/repositories/stage3VerificationRepo";
import { db } from "../lib/db/repositories/client";
function card(userId: string, patch: Partial<StrangerCard> = {}): StrangerCard { return { userId, alias: "Synthetic test", purposes: [], interests: [], lookingFor: [], canHelpWith: [], demographics: {}, provenance: {}, relationship: "none", ...patch }; }
async function main() {
 const version = "seed_test_revision:2026-11-03T00:00:00.000Z";
 assert.deepEqual(parseProfilePatch({ version, city: "NYC", nationality: "Prefer not to say", university: "  ", interests: [" Hiking ","hiking"] }).changes,{ nationality: null, city: "New York, NY", university: null, interests: ["hiking"] });
 assert.throws(() => parseProfilePatch({ version, interests: Array(11).fill("tag") }));
 assert.throws(() => parseProfilePatch({ version, purposes: ["unsupported"] }));
 for (const query of ["page=0","pageSize=21","page=101","city=Unknown","city=A&city=B","actorId=forged"]) assert.throws(() => parseDiscoveryQuery(new URLSearchParams(query)));
 assert.equal(parseDiscoveryQuery(new URLSearchParams("city=NYC")).filters.city,"New York, NY");
 const viewer = card("viewer",{ purposes: ["a","b","c"], interests: ["a","b","c","d"], lookingFor: ["x","y","z"], canHelpWith: ["q"], demographics: { city: "City", university: "University", major: "Major", nationality: "Nation" } });
 const candidate = card("candidate",{ ...viewer, userId: "candidate", canHelpWith: ["x","y","z"], lookingFor: ["q"] });
 assert.equal(scoreCard(viewer,candidate).score,36); assert.equal(scoreCard(viewer,candidate,true).score,37);
 assert.equal(scoreCard(card("a",{lookingFor:["help"]}),card("b",{canHelpWith:["help"]})).reasons[0],"They can help with: help");
 assert.equal(scoreCard(card("a",{canHelpWith:["help"]}),card("b",{lookingFor:["help"]})).reasons[0],"You can help with: help");
 assert.equal(scoreCard(card("a",{lookingFor:["help"],canHelpWith:["help"]}),card("b",{lookingFor:["help"],canHelpWith:["help"]})).score,5);
 assert.equal(scoreCard(card("a"),candidate).score,0); assert.deepEqual(rankCards(card("a"),[candidate]),[]);
 const tied = ["z","b","a","e","c","d"].map(id => card(id,{ interests: ["shared"] }));
 assert.deepEqual(rankCards(card("viewer",{interests:["shared"]}),tied).map(c=>c.userId),["a","b","c","d","e"]);
 assert.equal(scoreCard(card("a",{demographics:{city:"hidden"}}),card("b")).score,0);
 const users = await verifyStage3Database();
 console.log(`PASS Stage 3: normalization; filters/pagination; scoring caps/direction/ties/sparse profiles; visibility and cohort thresholds; direct lookup exclusions; both block directions; allowlisted DTOs; relationship states; preview, optimistic edits and per-field provenance. Fixtures rolled back; ${users} users retained.`);
}
main().catch(error => { console.error(`Stage 3 verification failed (${error instanceof Error ? error.name : "unknown"}); private records omitted.`); if (error instanceof Error) console.error(error.stack?.split("\n").filter(line => /^\s+at /.test(line)).slice(0,4).join("\n")); process.exitCode = 1; }).finally(() => db.$disconnect());
