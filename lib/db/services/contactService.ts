import { Prisma } from "@prisma/client";
import { ConversationsResponse, Introduction, MessagesResponse, RequestsResponse } from "../../connect/contactTypes";
import { contactGateway, ContactGateway, ContactRepository, RequestRecord } from "../repositories/contactRepo";
import { createConnectService } from "./connectService";
import { purposeOptions } from "../../connect/types";
import { ConnectError, validUserId } from "./connectValidation";
import { lockedInvitation, invitationUnavailable, isReserved, requestInvitationValid } from "./invitationPolicy";
import { contactObject, contactText, contactId, contactQuery, introductionInput, messageInput, transitionInput } from "./contactValidation";
export const contactLimits = { requestsPerDay: 5, pendingOutgoing: 20, messagesPerMinute: 30 };
const other = (actor: string, request: { senderId: string; recipientId: string }) => request.senderId === actor ? request.recipientId : request.senderId;
const unavailable = () => new ConnectError(404,"Contact unavailable.");
type Actor = NonNullable<Awaited<ReturnType<ContactRepository["actor"]>>>;
type Peer = NonNullable<Awaited<ReturnType<ContactRepository["peer"]>>>;
async function requireActor(repo: ContactRepository, actorId: string) {
 validUserId(actorId); const actor = await repo.actor(actorId); if (!actor) throw unavailable(); return actor;
}
async function requirePeer(repo: ContactRepository, actorId: string, peerId: string) {
 const peer = await repo.peer(actorId,peerId); if (!peer) throw unavailable(); return peer;
}
function relationshipAlias(actorId:string,peer:Peer,record:{senderId:string;invitationAlias:string|null;invitationSenderAlias:string|null}) {
 return record.invitationAlias ? (record.senderId===actorId?record.invitationAlias:record.invitationSenderAlias??peer.alias) : peer.alias;
}
async function introductionDTO(repo:ContactRepository,actor: Actor, peer: Peer, record: RequestRecord): Promise<Introduction> {
 const narrow=record.invitationId?await requestInvitationValid(repo,record):false;
 const visible = record.state === "ACCEPTED" || (record.invitationAlias ? narrow : actor.discoverable && peer.discoverable);
 return { id: record.id, direction: record.senderId === actor.userId ? "outgoing" : "incoming", peer: visible ? { userId: peer.userId, alias: relationshipAlias(actor.userId,peer,record) } : null,
  purpose: visible ? record.purpose : null, note: visible ? record.note : null, state: record.state, createdAt: record.createdAt.toISOString(),
  conversationId: record.state === "ACCEPTED" ? record.conversation?.id ?? null : null,
  canAccept: record.state === "PENDING" && record.recipientId === actor.userId && (record.invitationAlias ? narrow : actor.discoverable && peer.discoverable) };
}
export async function checkRollingLimit(repo: ContactRepository, userId: string, action: string, maximum: number, windowMs: number, now: Date) {
 const events = await repo.usage(userId,action,new Date(now.getTime()-windowMs));
 if (events.reduce((sum,event)=>sum+event.count,0) >= maximum) {
  const retryAfter = Math.max(1,Math.ceil((events[0].windowStart.getTime()+windowMs-now.getTime())/1000));
  throw new ConnectError(429,`Usage limit reached. Try again in ${retryAfter} seconds.`,retryAfter);
 }
}
export function createContactService(gateway: ContactGateway = contactGateway, limits = contactLimits) {
 async function transaction<T>(operation: (repo: ContactRepository) => Promise<T>) {
  try { return await gateway.transaction(operation); }
  catch(error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConnectError(409,"This relationship already exists."); throw error; }
 }
 async function withRequest<T>(actorId: string, requestId: string, operation: (repo: ContactRepository, actor: Actor, peer: Peer, request: RequestRecord) => Promise<T>) {
  contactId(requestId);
  return transaction(async repo => {
   const initial = await repo.request(actorId,requestId); if (!initial) throw unavailable();
   await repo.lockUsers([initial.senderId,initial.recipientId]);
   const actor = await requireActor(repo,actorId), peer = await requirePeer(repo,actorId,other(actorId,initial));
   const request = await repo.request(actorId,requestId); if (!request) throw unavailable();
   return operation(repo,actor,peer,request);
  });
 }
 async function withConversation<T>(actorId: string, conversationId: string, operation: (repo: ContactRepository, peer: Peer) => Promise<T>) {
  contactId(conversationId);
  return transaction(async repo => {
   const initial = await repo.conversation(actorId,conversationId); if (!initial) throw unavailable();
   await repo.lockUsers([initial.request.senderId,initial.request.recipientId]);
   await requireActor(repo,actorId); const peer = await requirePeer(repo,actorId,other(actorId,initial.request));
   const current = await repo.conversation(actorId,conversationId);
   if (!current || current.request.state !== "ACCEPTED") throw unavailable();
   return operation(repo,{...peer,alias:relationshipAlias(actorId,peer,current.request)});
  });
 }
 async function persistIntroduction(repo:ContactRepository,actor:Actor,peer:Peer,purpose:string,note:string,invitation?:{invitationId:string;invitationAlias:string;invitationSenderAlias:string}) {
  const [low,high]=[actor.userId,peer.userId].sort();
  if(await repo.pair(low,high))throw new ConnectError(409,"This relationship already exists. Declined or cancelled introductions cannot be resent in this prototype.");
  if(await repo.pendingCount(actor.userId)>=limits.pendingOutgoing)throw new ConnectError(429,`You have ${limits.pendingOutgoing} pending outgoing introductions. Cancel one or wait for a response, then retry.`,60);
  const now=new Date();await checkRollingLimit(repo,actor.userId,"introduction",limits.requestsPerDay,86400000,now);
  const created=await repo.createRequest(actor.userId,peer.userId,purpose,note,invitation);await repo.recordUsage(actor.userId,"introduction",now);
  return{viewerId:actor.userId,request:await introductionDTO(repo,actor,peer,created)};
 }
 return {
  async sendIntroduction(actorId: string, input: unknown) {
   const body = introductionInput(input);
   if (body.recipientId === actorId) throw new ConnectError(400,"You cannot introduce yourself to yourself.");
   return transaction(async repo => {
    await repo.lockUsers([actorId,body.recipientId]);
    const actor = await requireActor(repo,actorId), peer = await requirePeer(repo,actorId,body.recipientId);
    if (!actor.discoverable) throw new ConnectError(403,"Opt into discovery before sending an introduction.");
    await createConnectService(repo.connect).profileById(actorId,peer.userId);
    return persistIntroduction(repo,actor,peer,body.purpose,body.note);
   });
  },
  async sendInvitationIntroduction(actorId:string,token:string,input:unknown){
   const body=contactObject(input,["purpose","note","confirmIntroduction"]);
   if(body.confirmIntroduction!==true||typeof body.purpose!=="string"||!(purposeOptions as readonly string[]).includes(body.purpose))throw new ConnectError(400,"Confirm an explicit introduction and choose a purpose.");
   const purpose=body.purpose,note=contactText(body.note,300);
   return transaction(async repo=>{
    const invite=await lockedInvitation(repo,token,actorId);if(invite.userId===actorId)throw new ConnectError(400,"Self-introductions are not allowed.");
    if(!invite.allowsIntroductions)throw invitationUnavailable();
    const actor=await requireActor(repo,actorId),peer=await requirePeer(repo,actorId,invite.userId),profile=await repo.invitation.profile(actorId);
    if(!profile||(isReserved(profile.demoOrdinal)&&!profile.demoActivatedAt))throw new ConnectError(403,"Explicitly activate this newcomer demo persona first.");
    return persistIntroduction(repo,actor,peer,purpose,note,{invitationId:invite.id,invitationAlias:invite.approvedAlias,invitationSenderAlias:actor.alias});
   });
  },
  async transitionRequest(actorId: string, requestId: string, input: unknown) {
   const action = transitionInput(input);
   return withRequest(actorId,requestId,async (repo,actor,peer,request) => {
    if ((action === "cancel" && request.senderId !== actorId) || (action !== "cancel" && request.recipientId !== actorId)) throw new ConnectError(403,"Only the appropriate participant can perform this action.");
    if (action === "accept" && request.state === "ACCEPTED") {
     const conversation = await repo.ensureConversation(request.id);
     return { viewerId: actorId, request: await introductionDTO(repo,actor,peer,{...request,conversation}) };
    }
    if (request.state !== "PENDING") throw new ConnectError(409,"This introduction is no longer pending.");
    if (action === "accept") {
     if(request.invitationAlias){if(!await requestInvitationValid(repo,request))throw invitationUnavailable();}
     else {if (!actor.discoverable) throw new ConnectError(403,"Opt into discovery before accepting an introduction.");
      await createConnectService(repo.connect).profileById(actorId,peer.userId);}

    }
    const state = action === "accept" ? "ACCEPTED" : action === "decline" ? "DECLINED" : "CANCELLED";
    if ((await repo.transition(request.id,state)).count !== 1) throw new ConnectError(409,"This introduction changed. Reload and retry.");
    if (action === "accept") {await repo.ensureConversation(request.id);if(request.invitationId)await repo.invitation.markAccepted(request.senderId,request.invitationId,new Date());}
    const updated = await repo.request(actorId,requestId); if (!updated) throw unavailable();
    return { viewerId: actorId, request: await introductionDTO(repo,actor,peer,updated) };
   });
  },
  async requests(actorId: string, params: URLSearchParams): Promise<RequestsResponse> {
   const {page} = contactQuery(params);
   return transaction(async repo => {
    const actor = await requireActor(repo,actorId);
    const rows = await repo.listRequests(actorId,page), items: Introduction[] = [];
    for (const row of rows.slice(0,20)) { const peer = await repo.peer(actorId,other(actorId,row)); if (peer) items.push(await introductionDTO(repo,actor,peer,row)); }
    return {viewerId:actorId,items,page,hasNext:rows.length>20,canIntroduce:actor.discoverable};
   });
  },
  async conversationForRequest(actorId: string, requestId: string) {
   return withRequest(actorId,requestId,async (_repo,_actor,peer,request) => {
    if (request.state !== "ACCEPTED" || !request.conversation) throw new ConnectError(403,"Messaging opens only after acceptance.");
    return {viewerId:actorId,id:request.conversation.id,peer:{userId:peer.userId,alias:relationshipAlias(actorId,peer,request)}};
   });
  },
  async conversations(actorId: string, params: URLSearchParams): Promise<ConversationsResponse> {
   const {page} = contactQuery(params);
   return transaction(async repo => {
    await requireActor(repo,actorId); const rows = await repo.listConversations(actorId,page), items: ConversationsResponse["items"] = [];
    for (const row of rows.slice(0,20)) { const peer = await repo.peer(actorId,other(actorId,row.request)); if (peer) items.push({id:row.id,peer:{userId:peer.userId,alias:relationshipAlias(actorId,peer,row.request)},lastMessageAt:row.messages[0]?.createdAt.toISOString()??null}); }
    return {viewerId:actorId,items,page,hasNext:rows.length>20};
   });
  },
  async messages(actorId: string, conversationId: string, params: URLSearchParams): Promise<MessagesResponse> {
   const {limit,before} = contactQuery(params,true);
   return withConversation(actorId,conversationId,async (repo,peer) => {
    const cursor = before ? await repo.cursorMessage(conversationId,before) : undefined;
    if (before && !cursor) throw new ConnectError(400,"Invalid message cursor.");
    const rows = await repo.messages(conversationId,limit,cursor??undefined);
    const page = rows.slice(0,limit).reverse(), hasOlder = rows.length>limit;
    return {viewerId:actorId,conversationId,peer:{userId:peer.userId,alias:peer.alias},items:page.map(row=>({id:row.id,sender:row.userId===actorId?"you":"peer",text:row.text,createdAt:row.createdAt.toISOString()})),hasOlder,nextBefore:hasOlder?page[0].id:null};
   });
  },
  async sendMessage(actorId: string, conversationId: string, input: unknown) {
   const text = messageInput(input);
   return withConversation(actorId,conversationId,async (repo) => {
    const now = new Date(); await checkRollingLimit(repo,actorId,"message",limits.messagesPerMinute,60000,now);
    const row = await repo.createMessage(conversationId,actorId,text); await repo.recordUsage(actorId,"message",now);
    return {viewerId:actorId,message:{id:row.id,sender:"you" as const,text:row.text,createdAt:row.createdAt.toISOString()}};
   });
  }
 };
}
export const contactService = createContactService();
