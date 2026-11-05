import assert from "node:assert/strict";
import { db } from "./client";
import { importWithinTransaction } from "./seedRepo";
import { prepareSeed } from "../services/seedService";
export async function verifySeedPersistence(input: unknown) {
 const profiles = prepareSeed(input);
 assert.equal(await db.user.count(), 925);
 assert.equal(await db.connectProfile.count(), 925);
 const rollback = new Error("verification rollback");
 try {
  await db.$transaction(async tx => {
   const a = profiles[3].userId, b = profiles[4].userId;
   const editedProvenance = { ...profiles[3].provenance, alias: "user_entered", city: "user_entered" };
   await tx.connectProfile.update({ where: { userId: a }, data: { alias: "Intentional verification edit", city: null, discoverable: false, showCity: true, provenance: editedProvenance } });
   const deletedId = profiles[0].userId;
   await tx.connectProfile.delete({ where: { userId: deletedId } });
   await tx.profileDeletion.create({ data: { userId: deletedId } });
   const pair = [a,b].sort();
   const request = await tx.connectionRequest.create({ data: { senderId: a, recipientId: b, pairLow: pair[0], pairHigh: pair[1], state: "ACCEPTED", purpose: "friendship", note: "Verification fixture" } });
   const conversation = await tx.conversation.create({ data: { requestId: request.id } });
   const message = await tx.message.create({ data: { conversationId: conversation.id, userId: a, text: "Verification message" } });
   await importWithinTransaction(tx, profiles);
   await importWithinTransaction(tx, profiles);
   const edited = await tx.connectProfile.findUniqueOrThrow({ where: { userId: a } });
   assert.equal(edited.alias, "Intentional verification edit"); assert.equal(edited.discoverable, false); assert.equal(edited.showCity, true); assert.equal(edited.city, null);
   assert.deepEqual(edited.provenance, editedProvenance);
   assert.equal(await tx.connectProfile.count({ where: { userId: deletedId } }), 0);
   assert.equal(await tx.connectionRequest.count({ where: { id: request.id } }), 1);
   assert.equal(await tx.message.count({ where: { id: message.id, text: "Verification message" } }), 1);
   assert.equal(await tx.conversation.count({ where: { id: conversation.id } }), 1);
   assert.equal(await tx.user.count(), 925);
   await assert.rejects(tx.connectionRequest.create({ data: { senderId: b, recipientId: a, pairLow: pair[0], pairHigh: pair[1], purpose: "projects", note: "Duplicate pair" } }));
   throw rollback;
  }, { timeout: 30000 });
 } catch (error) { if (error !== rollback) throw error; }
 assert.equal(await db.user.count(), 925);
 assert.equal(await db.connectProfile.count(), 925);
}
