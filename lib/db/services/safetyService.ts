import {contactGateway,ContactGateway,ContactRepository} from "../repositories/contactRepo";
import {ConnectError,validUserId} from "./connectValidation";
import {contactObject,contactText,contactQuery} from "./contactValidation";
import {lockedInvitation} from "./invitationPolicy";
import {checkRollingLimit} from "./contactService";
import {reportReasons,deletionPhrase,BlockList} from "../../connect/safetyTypes";
async function activeActor(repo:ContactRepository,actorId:string){validUserId(actorId);if(!await repo.actor(actorId))throw new ConnectError(404,"Profile unavailable.");}
async function target(repo:ContactRepository,actorId:string,body:Record<string,unknown>){
 if((body.targetId!==undefined)===(body.invitationToken!==undefined)||(body.targetId!==undefined&&typeof body.targetId!=="string")||(body.invitationToken!==undefined&&typeof body.invitationToken!=="string"))throw new ConnectError(400,"Choose one safety target.");
 let targetId:string,label:string|undefined;
 if(typeof body.invitationToken==="string"){const invitation=await lockedInvitation(repo,body.invitationToken,actorId);targetId=invitation.userId;label=invitation.approvedAlias;}
 else{targetId=validUserId(body.targetId as string);await repo.lockUsers([actorId,targetId]);}
 await activeActor(repo,actorId);if(targetId===actorId)throw new ConnectError(400,"You cannot take this safety action on yourself.");
 if(!await repo.actor(targetId))throw new ConnectError(404,"Profile unavailable.");return{targetId,label};
}
export function createSafetyService(gateway:ContactGateway=contactGateway){return{
 async blocks(actorId:string,params:URLSearchParams):Promise<BlockList>{const{page}=contactQuery(params);return gateway.transaction(async repo=>{await activeActor(repo,actorId);const rows=await repo.safety.blocks(actorId,page);return{viewerId:actorId,page,hasNext:rows.length>20,items:rows.slice(0,20).map(row=>({targetId:row.blockedId,label:row.label,createdAt:row.createdAt.toISOString()}))};});},
 async block(actorId:string,input:unknown){const body=contactObject(input,["targetId","invitationToken","label"]);const label=body.label===undefined?"Blocked profile":contactText(body.label,60);return gateway.transaction(async repo=>{const peer=await target(repo,actorId,body);await repo.safety.block(actorId,peer.targetId,peer.label??label);await repo.safety.closePair(actorId,peer.targetId,new Date());return{viewerId:actorId,blocked:true,message:"Blocked in both directions. Old relationships and invitation permissions are closed."};});},
 async unblock(actorId:string,input:unknown){const body=contactObject(input,["targetId"]);if(typeof body.targetId!=="string")throw new ConnectError(400,"Choose a blocked profile.");const targetId=validUserId(body.targetId);if(targetId===actorId)throw new ConnectError(400,"Invalid safety target.");return gateway.transaction(async repo=>{await repo.lockUsers([actorId,targetId]);await activeActor(repo,actorId);if(await repo.safety.ownBlock(actorId,targetId))await repo.safety.closePair(actorId,targetId,new Date());await repo.safety.unblock(actorId,targetId);return{viewerId:actorId,unblocked:true,restored:false,message:"Your block was removed. Old relationships and invitation permissions were not restored."};});},
 async report(actorId:string,input:unknown){const body=contactObject(input,["targetId","invitationToken","reason","context"]);if(typeof body.reason!=="string"||!(reportReasons as readonly string[]).includes(body.reason))throw new ConnectError(400,"Choose a supported report reason.");const reason=body.reason;let context:string|null=null;if(body.context!==undefined&&body.context!==null){if(typeof body.context!=="string")throw new ConnectError(400,"Invalid report context.");if(body.context.trim())context=contactText(body.context,1000);else if(body.context.length>1000)throw new ConnectError(400,"Report context is too long.");}
 return gateway.transaction(async repo=>{const peer=await target(repo,actorId,body),now=new Date();await checkRollingLimit(repo,actorId,"report",5,86400000,now);await repo.safety.report(actorId,peer.targetId,reason,context);await repo.recordUsage(actorId,"report",now);return{viewerId:actorId,recorded:true,message:"Report recorded in this local prototype. No human moderation team is monitoring it. Reporting does not automatically block this person."};});},
 async deleteProfile(actorId:string,input:unknown){const body=contactObject(input,["confirmDeletion","acknowledgeConversationDeletion","phrase"]);if(body.confirmDeletion!==true||body.acknowledgeConversationDeletion!==true||body.phrase!==deletionPhrase)throw new ConnectError(400,"Explicitly confirm profile and both-participants' conversation deletion.");validUserId(actorId);return gateway.transaction(async repo=>{
  // Rare local-prototype operation. The common order prevents cycles with pair
  // operations and stops new relationships from appearing during the purge.
  await repo.safety.lockAllUsers();if(!await repo.actor(actorId)){if(await repo.safety.deleted(actorId))return{viewerId:actorId,deleted:true};throw new ConnectError(404,"Profile unavailable.");}
  await repo.safety.purgeProfile(actorId);return{viewerId:actorId,deleted:true};
 });}
};}
export const safetyService=createSafetyService();
