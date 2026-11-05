import { createHash } from "node:crypto";
import type { ContactRepository, RequestRecord } from "../repositories/contactRepo";
import type { InvitationRecord } from "../repositories/invitationRepo";
import { ConnectError } from "./connectValidation";
export const invitationUnavailable=()=>new ConnectError(404,"Invitation unavailable.");
export function invitationHash(token:string){if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw invitationUnavailable();return createHash("sha256").update(token).digest("hex");}
export function invitationActive(invite:InvitationRecord|null):invite is InvitationRecord{return !!invite&&!invite.revokedAt&&invite.expiresAt.getTime()>Date.now();}
export async function lockedInvitation(repo:ContactRepository,token:string,actorId?:string){
 const hash=invitationHash(token),initial=await repo.invitation.byHash(hash);if(!initial)throw invitationUnavailable();
 await repo.lockUsers(actorId?[actorId,initial.userId]:[initial.userId]);
 const invite=await repo.invitation.byHash(hash);if(!invitationActive(invite))throw invitationUnavailable();
 if(actorId&&!await repo.actor(actorId))throw invitationUnavailable();
 const creator=actorId&&actorId!==invite.userId?await repo.peer(actorId,invite.userId):await repo.actor(invite.userId);
 if(!creator||(actorId&&await repo.invitation.restricted(invite.id,actorId)))throw invitationUnavailable();return invite;
}
export async function requestInvitationValid(repo:ContactRepository,request:RequestRecord){
 if(!request.invitationId)return false;
 const invite=await repo.invitation.byId(request.invitationId);
 return invitationActive(invite)&&invite.allowsIntroductions&&invite.userId===request.recipientId&&!await repo.invitation.restricted(invite.id,request.senderId);
}
export const isReserved=(ordinal:number|null)=>ordinal!==null&&ordinal>=1&&ordinal<=3;
