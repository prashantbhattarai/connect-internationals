import { Prisma } from "@prisma/client";
import { db } from "./client";
const profileSelect = {
 userId: true, alias: true, nationality: true, city: true, university: true, major: true,
 purposes: true, interests: true, lookingFor: true, canHelpWith: true, provenance: true,
 discoverable: true, showNationality: true, showCity: true, showUniversity: true, showMajor: true,
 nationalityPreference: true, consentSource: true, updatedAt: true
} satisfies Prisma.ConnectProfileSelect;
export type ProfileRecord = Prisma.ConnectProfileGetPayload<{ select: typeof profileSelect }>;
export function createConnectRepository(client: Prisma.TransactionClient) {
 return {
  async loadContext(actorId: string) {
   const [actor, candidates, relationships] = await Promise.all([
    client.connectProfile.findFirst({ where: { userId: actorId, user: { tombstone: null } }, select: profileSelect }),
    client.connectProfile.findMany({ where: {
     discoverable: true, userId: { not: actorId }, user: {
      tombstone: null, blocks: { none: { blockedId: actorId } }, blockedBy: { none: { userId: actorId } }
     }
    }, select: profileSelect, orderBy: { userId: "asc" } }),
    client.connectionRequest.findMany({ where: { OR: [{ senderId: actorId }, { recipientId: actorId }] }, select: { senderId: true, recipientId: true, state: true } })
   ]);
   return { actor, candidates, relationships };
  },
  async updateProfile(actorId: string, version: Date, data: Prisma.ConnectProfileUpdateManyMutationInput) {
   await client.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${actorId} FOR UPDATE`);
   const result = await client.connectProfile.updateMany({ where: { userId: actorId, updatedAt: version, user: { tombstone: null } }, data });
   return result.count === 1;
  }
 };
}
export type ConnectRepository = ReturnType<typeof createConnectRepository>;
export type DiscoveryContext = Awaited<ReturnType<ConnectRepository["loadContext"]>>;
export const connectRepository: ConnectRepository = {
 loadContext: actorId => db.$transaction(tx => createConnectRepository(tx).loadContext(actorId), { isolationLevel: "RepeatableRead" }),
 updateProfile: (actorId, version, data) => db.$transaction(tx => createConnectRepository(tx).updateProfile(actorId, version, data))
};
