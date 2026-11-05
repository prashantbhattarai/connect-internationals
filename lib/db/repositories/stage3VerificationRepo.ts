import assert from "node:assert/strict";
import { db } from "./client";
import { createConnectRepository } from "./connectRepo";
import { createConnectService } from "../services/connectService";
import { ConnectError } from "../services/connectValidation";
import { contentFields } from "../../connect/types";
const id = (suffix: string) => `seed_s3_fixture_${suffix}`;
const query = (values: Record<string,string> = {}) => new URLSearchParams(values);
const rejected = (status: number) => (error: unknown) => error instanceof ConnectError && error.status === status;
export async function verifyStage3Database() {
 const before = await db.user.count();
 const rollback = new Error("Stage 3 fixture rollback");
 try {
  await db.$transaction(async tx => {
   const names = ["actor", "b", "c", "d", "e", "f", "g", "hidden", "deleted", "blocked_out", "blocked_in", "private", "rare1", "rare2", "rare3", "rare4"];
   await tx.user.createMany({ data: names.map(name => ({ id: id(name) })) });
   const base = {
    alias: "Stage 3 synthetic fixture", nationality: "Stage3 Nation", city: "Stage3 City", university: "Stage3 University", major: "Stage3 Major",
    interests: ["s3 cohort", "s3 shared"], purposes: ["friendship"], lookingFor: ["s3 city tips"], canHelpWith: ["s3 mentoring"],
    discoverable: true, showNationality: true, showCity: true, showUniversity: true, showMajor: true,
    provenance: { ...Object.fromEntries(contentFields.map(k => [k,"synthetic_demo"])), targetRoles: "provided_seed" }, consentSource: "simulated_demo"
   };
   for (const name of names) await tx.connectProfile.create({ data: {
    ...base, userId: id(name),
    ...(name === "actor" ? { alias: "Stage3 Actor", interests: ["s3 shared"], lookingFor: ["s3 mentoring"], canHelpWith: ["s3 city tips"] } : {}),
    ...(name === "hidden" ? { discoverable: false } : {}),
    ...(name === "private" ? { nationality: "S3 secret nation", city: "S3 secret city", university: "S3 secret university", major: "S3 secret major", showNationality: false, showCity: false, showUniversity: false, showMajor: false } : {}),
    ...(name.startsWith("rare") ? { nationality: "S3 rare nation", city: "S3 rare city", university: "S3 rare university", major: "S3 rare major", interests: ["s3 rare"] } : {})
   } });
   await tx.profileDeletion.create({ data: { userId: id("deleted") } });
   await tx.block.createMany({ data: [{ userId: id("actor"), blockedId: id("blocked_out") }, { userId: id("blocked_in"), blockedId: id("actor") }] });
   const pair = [id("actor"), id("b")].sort();
   await tx.connectionRequest.create({ data: { senderId: id("actor"), recipientId: id("b"), pairLow: pair[0], pairHigh: pair[1], purpose: "friendship", note: "Stage3 fixture" } });
   const service = createConnectService(createConnectRepository(tx));
   const actor = id("actor");
   const own = await service.ownProfile(actor); assert.equal(own.profile.nationalityPreference, false); assert.ok(own.preview); assert.equal(own.preview.demographics.city, "Stage3 City");
   const filtered = await service.discover(actor, query({ city: "Stage3 City", university: "Stage3 University", nationality: "Stage3 Nation", major: "Stage3 Major", interest: "s3 cohort", purpose: "friendship", pageSize: "2" }));
   assert.equal(filtered.items.length, 2); assert.equal(filtered.hasNext, true); assert.equal(filtered.recommendations.length, 5);
   assert.deepEqual(filtered.recommendations.map(p => p.userId), ["b","c","d","e","f"].map(id));
   assert.equal(filtered.items[0].relationship, "outgoing_pending"); assert.ok(!("total" in filtered));
   const second = await service.discover(actor, query({ interest: "s3 cohort", city: "Stage3 City", page: "2", pageSize: "2" }));
   assert.deepEqual(second.items.map(p => p.userId), [id("d"),id("e")]);
   for (const [key,value] of Object.entries({ city: "Stage3 City", nationality: "Stage3 Nation", university: "Stage3 University", major: "Stage3 Major" })) {
    const matching = await service.discover(actor,query({ [key]: value, pageSize: "20" }));
    assert.equal(matching.items.length,6);
    assert.equal((await service.discover(actor,query({ [key]: "not a disclosed value" }))).items.length,0);
   }
   const incoming = await service.profileById(id("b"), actor); assert.equal(incoming.relationship, "incoming_pending");
   for (const name of ["actor","hidden","deleted","blocked_out","blocked_in","absent"]) await assert.rejects(service.profileById(actor,id(name)), rejected(404));
   const all = await service.discover(actor, query());
   for (const name of ["actor","hidden","deleted","blocked_out","blocked_in"]) assert.ok(!all.items.some(p => p.userId === id(name)));
   const privateCard = await service.profileById(actor,id("private")); assert.deepEqual(privateCard.demographics, {});
   assert.ok(!JSON.stringify(privateCard).includes("S3 secret")); assert.ok(!("city" in privateCard.provenance));
   await tx.connectProfile.update({ where: { userId: id("private") }, data: { city: "S3 changed hidden city" } });
   assert.deepEqual(await service.profileById(actor,id("private")), privateCard);
   for (const [key,value] of Object.entries({ city: "S3 changed hidden city", nationality: "S3 secret nation", university: "S3 secret university", major: "S3 secret major" })) assert.equal((await service.discover(actor,query({ [key]: value }))).items.length,0);
   const rare = await service.profileById(actor,id("rare1")); assert.deepEqual(rare.demographics, {});
   const rareList = await service.discover(actor,query({ interest: "s3 rare" })); assert.equal(rareList.items.length,4); assert.ok(rareList.items.every(p => !Object.keys(p.demographics).length));
   for (const filters of [{ city: "S3 secret city" }, { nationality: "S3 rare nation" }, { city: "Stage3 City", interest: "nonexistent" }] as Record<string,string>[]) {
    const result = await service.discover(actor,query(filters)); assert.equal(result.items.length,0); assert.equal(result.recommendations.length,0); assert.equal(result.hasNext,false); assert.ok(!("total" in result));
   }
   assert.ok(!JSON.stringify(all.options).includes("S3 secret")); assert.ok(!JSON.stringify(all.options).includes("S3 rare"));
   const publicKeys = ["userId","alias","purposes","interests","lookingFor","canHelpWith","demographics","provenance","relationship"].sort();
   assert.deepEqual(Object.keys(privateCard).sort(),publicKeys);
   assert.ok(filtered.recommendations.every(p => p.reasons.length > 0 && p.reasons.length <= 3));
   assert.ok(filtered.recommendations.some(p => p.reasons.includes("They can help with: s3 mentoring")));
   assert.ok(filtered.recommendations.some(p => p.reasons.includes("You can help with: s3 city tips")));
   await tx.connectProfile.update({ where: { userId: id("b") }, data: { interests: ["s3 narrow"] } });
   const narrowDemographic = await service.discover(actor,query({ city: "Stage3 City", interest: "s3 narrow" }));
   assert.equal(narrowDemographic.items.length,0); assert.equal(narrowDemographic.hasNext,false);
   const narrowInterest = await service.discover(actor,query({ interest: "s3 narrow" }));
   assert.equal(narrowInterest.items.length,1); assert.deepEqual(narrowInterest.items[0].demographics,{});
   assert.ok(narrowInterest.recommendations.every(card => card.reasons.every(reason => !reason.startsWith("Same disclosed"))));
   // Five eligible matching people are enough; four are generalized everywhere.
   await tx.block.create({ data: { userId: actor, blockedId: id("b") } });
   assert.equal((await service.profileById(actor,id("d"))).demographics.city,"Stage3 City");
   await tx.block.create({ data: { userId: actor, blockedId: id("c") } });
   assert.deepEqual((await service.profileById(actor,id("d"))).demographics,{});
   assert.equal((await service.discover(actor,query({ city: "Stage3 City" }))).items.length,0);
   const narrow = await service.discover(actor,query({ interest: "s3 cohort" }));
   assert.ok(narrow.recommendations.every(p => p.reasons.every(r => !r.startsWith("Same disclosed"))));
   const staged = await service.previewProfile(actor,{ version: own.profile.version, alias: "Staged alias" });
   assert.equal(staged.preview?.alias,"Staged alias"); assert.equal((await service.ownProfile(actor)).profile.alias,"Stage3 Actor");
   await assert.rejects(service.updateProfile(actor,{ version: own.profile.version, actorId: id("b"), alias: "Wrong actor" }),rejected(400));
   await assert.rejects(service.updateProfile(actor,{ version: own.profile.version, provenance: {} }),rejected(400));
   const otherOwner = await service.ownProfile(id("g"));
   await assert.rejects(service.updateProfile(actor,{ version: otherOwner.profile.version, alias: "Cross-persona stale form" }),rejected(409));
   const edited = await service.updateProfile(actor,{ version: own.profile.version, alias: "Edited alias" });
   assert.equal(edited.profile.provenance.alias,"user_entered"); assert.equal(edited.profile.provenance.major,"synthetic_demo");
   const persisted = await tx.connectProfile.findUniqueOrThrow({ where: { userId: actor } });
   assert.equal((persisted.provenance as Record<string,unknown>).targetRoles,"provided_seed");
   await assert.rejects(service.updateProfile(actor,{ version: `${actor}:2000-01-01T00:00:00.000Z`, alias: "Stale" }),rejected(409));
   const normalized = await service.updateProfile(actor,{ version: edited.profile.version, city: " NYC ", nationality: "I'd prefer not to say", interests: [" S3 Shared ","s3 shared"], showMajor: false });
   assert.equal(normalized.profile.city,"New York, NY"); assert.equal(normalized.profile.nationality,null); assert.deepEqual(normalized.profile.interests,["s3 shared"]);
   assert.equal(normalized.profile.provenance.city,"user_entered"); assert.equal(normalized.profile.provenance.major,"synthetic_demo");
   const hidden = await service.updateProfile(actor,{ version: normalized.profile.version, discoverable: false });
   assert.equal(hidden.preview,null); await assert.rejects(service.profileById(id("g"),actor),rejected(404));
   const deletedActor = id("deleted"); await assert.rejects(service.discover(deletedActor,query()),rejected(404));
   throw rollback;
  }, { timeout: 60000 });
 } catch (error) { if (error !== rollback) throw error; }
 assert.equal(await db.user.count(),before);
 return before;
}
