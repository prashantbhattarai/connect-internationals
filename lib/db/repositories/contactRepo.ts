import { Prisma, ConnectionState } from "@prisma/client";
import { db } from "./client";
import {createSafetyRepository} from "./safetyRepo";
import { createInvitationRepository } from "./invitationRepo";
import { createCircleRepository } from "./circleRepo";
import { createConnectRepository } from "./connectRepo";
const requestSelect = { id: true, senderId: true, recipientId: true, state: true, purpose: true, note: true, createdAt: true, invitationId:true, invitationAlias:true, invitationSenderAlias:true, conversation: { select: { id: true } } } satisfies Prisma.ConnectionRequestSelect;
export type RequestRecord = Prisma.ConnectionRequestGetPayload<{ select: typeof requestSelect }>;
export async function lockContactUsers(client: Prisma.TransactionClient, ids: string[]) {
 const ordered = [...new Set(ids)].sort();
 await client.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id" IN (${Prisma.join(ordered)}) ORDER BY "id" COLLATE "C" FOR UPDATE`);
}
export function createContactRepository(client: Prisma.TransactionClient) {
 const activePeer = (actorId: string) => ({ tombstone: null, profile: { isNot: null }, blocks: { none: { blockedId: actorId } }, blockedBy: { none: { userId: actorId } } });
 return {
  connect: createConnectRepository(client),
  safety:createSafetyRepository(client),
  invitation:createInvitationRepository(client),
  circles:createCircleRepository(client),
  lockUsers: (ids: string[]) => lockContactUsers(client,ids),
  actor: (id: string) => client.connectProfile.findFirst({ where: { userId: id, user: { tombstone: null } }, select: { userId: true, alias: true, discoverable: true } }),
  peer: (actorId: string, id: string) => client.connectProfile.findFirst({ where: { userId: id, user: activePeer(actorId) }, select: { userId: true, alias: true, discoverable: true } }),
  request: (actorId: string, id: string) => client.connectionRequest.findFirst({ where: { id, OR: [{ senderId: actorId },{ recipientId: actorId }] }, select: requestSelect }),
  pair: (pairLow: string, pairHigh: string) => client.connectionRequest.findUnique({ where: { pairLow_pairHigh: { pairLow, pairHigh } }, select: requestSelect }),
  createRequest: (senderId: string, recipientId: string, purpose: string, note: string, invitation?: {invitationId:string;invitationAlias:string;invitationSenderAlias:string}) => {
   const [pairLow,pairHigh] = [senderId,recipientId].sort();
   return client.connectionRequest.create({ data: { senderId, recipientId, pairLow, pairHigh, purpose, note, ...invitation }, select: requestSelect });
  },
  transition: (id: string, state: ConnectionState) => client.connectionRequest.updateMany({ where: { id, state: "PENDING" }, data: { state } }),
  ensureConversation: (requestId: string) => client.conversation.upsert({ where: { requestId }, create: { requestId }, update: {}, select: { id: true } }),
  pendingCount: (senderId: string) => client.connectionRequest.count({ where: { senderId, state: "PENDING" } }),
  usage: (userId: string, action: string, since: Date) => client.usageCounter.findMany({ where: { userId, action, windowStart: { gt: since } }, orderBy: { windowStart: "asc" }, select: { count: true, windowStart: true } }),
  recordUsage: (userId: string, action: string, windowStart: Date) => client.usageCounter.upsert({ where: { userId_action_windowStart: { userId, action, windowStart } }, create: { userId, action, windowStart, count: 1 }, update: { count: { increment: 1 } } }),
  listRequests: (actorId: string, page: number) => client.connectionRequest.findMany({ where: { OR: [{ senderId: actorId, recipient: activePeer(actorId) },{ recipientId: actorId, sender: activePeer(actorId) }] }, orderBy: [{ createdAt: "desc" },{ id: "desc" }], skip: (page-1)*20, take: 21, select: requestSelect }),
  conversation: (actorId: string, id: string) => client.conversation.findFirst({ where: { id, request: { OR: [{ senderId: actorId },{ recipientId: actorId }] } }, select: { id: true, request: { select: requestSelect } } }),
  listConversations: (actorId: string, page: number) => client.conversation.findMany({ where: { request: { state: "ACCEPTED", OR: [{ senderId: actorId, recipient: activePeer(actorId) },{ recipientId: actorId, sender: activePeer(actorId) }] } }, orderBy: [{ createdAt: "desc" },{ id: "desc" }], skip: (page-1)*20, take: 21, select: { id: true, request: { select: { senderId: true, recipientId: true, invitationAlias:true,invitationSenderAlias:true } }, messages: { orderBy: [{ createdAt: "desc" },{ id: "desc" }], take: 1, select: { createdAt: true } } } }),
  cursorMessage: (conversationId: string, id: string) => client.message.findFirst({ where: { conversationId, id }, select: { id: true, createdAt: true } }),
  messages: (conversationId: string, limit: number, before?: { id: string; createdAt: Date }) => client.message.findMany({ where: { conversationId, ...(before ? { OR: [{ createdAt: { lt: before.createdAt } },{ createdAt: before.createdAt, id: { lt: before.id } }] } : {}) }, orderBy: [{ createdAt: "desc" },{ id: "desc" }], take: limit+1, select: { id: true, userId: true, text: true, createdAt: true } }),
  createMessage: (conversationId: string, userId: string, text: string) => client.message.create({ data: { conversationId, userId, text }, select: { id: true, userId: true, text: true, createdAt: true } })
 };
}
export type ContactRepository = ReturnType<typeof createContactRepository>;
export type ContactGateway = { transaction<T>(operation: (repo: ContactRepository) => Promise<T>): Promise<T> };
export const contactGateway: ContactGateway = { transaction: operation => db.$transaction(tx => operation(createContactRepository(tx)), { timeout: 15000, maxWait: 15000 }) };
