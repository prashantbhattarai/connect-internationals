import { randomBytes } from "node:crypto";
import { contactGateway, ContactGateway } from "../repositories/contactRepo";
import { CircleSummary, CircleResponse, CircleMembers, PublicInvitation, InvitationList, InvitationStatus } from "../../connect/communityTypes";
import { ConnectError } from "./connectValidation";
import { contactId, contactObject, contactQuery, contactText } from "./contactValidation";
import { generalizeCards, privacyCards } from "./privacyService";
import { invitationHash, invitationUnavailable, isReserved, lockedInvitation } from "./invitationPolicy";
import { requireDemoMode } from "./personaService";
import type { InvitationRecord } from "../repositories/invitationRepo";
export const curatedCircles=[
 {slug:"swe-interview-partners",name:"SWE Interview Partners",purpose:"Practice software interviews with a supportive partner.",starterActivity:"Introduce a topic you want to practice and arrange one mock interview together."},
 {slug:"campus-city-friends",name:"Campus & City Friends",purpose:"Make friends and share everyday campus and city experiences.",starterActivity:"Share one favorite local activity and invite someone to a public coffee or walk."},
 {slug:"project-builders",name:"Project Builders",purpose:"Meet collaborators for small, achievable projects.",starterActivity:"Describe a weekend project idea and one skill you can contribute."}
];
const summary=(circle:CircleSummary):CircleSummary=>({slug:circle.slug,name:circle.name,purpose:circle.purpose,starterActivity:circle.starterActivity});
const publicDTO=(invite:InvitationRecord):PublicInvitation=>({approvedAlias:invite.approvedAlias,message:invite.message,circle:invite.circle?summary(invite.circle):null,allowsIntroductions:invite.allowsIntroductions});
const band=(count:number)=>count<5?"Count withheld for small groups":count<10?"5–9 visible peers":count<20?"10–19 visible peers":"20+ visible peers";
function circleSlug(value:string){if(!curatedCircles.some(circle=>circle.slug===value))throw new ConnectError(404,"Circle unavailable.");return value;}
export function createCommunityService(gateway:ContactGateway=contactGateway){
 return{
  async seedCircles(){return gateway.transaction(async repo=>{for(const circle of curatedCircles)await repo.circles.ensure(circle);return curatedCircles.length;});},
  async circles(actorId:string):Promise<CircleResponse>{return gateway.transaction(async repo=>{
   const context=await repo.connect.loadContext(actorId);if(!context.actor)throw new ConnectError(404,"Profile unavailable.");
   const[circles,memberships]=await Promise.all([repo.circles.list(),repo.circles.memberships()]);const visible=privacyCards(context);
   return{viewerId:actorId,circles:circles.filter(circle=>curatedCircles.some(curated=>curated.slug===circle.slug)).map(circle=>({...summary(circle),joined:memberships.some(row=>row.circleId===circle.id&&row.userId===actorId),visibleMemberBand:band(visible.filter(card=>memberships.some(row=>row.circleId===circle.id&&row.userId===card.userId)).length)}))};
  });},
  async members(actorId:string,slug:string,params:URLSearchParams):Promise<CircleMembers>{circleSlug(slug);const{page}=contactQuery(params);return gateway.transaction(async repo=>{
   const context=await repo.connect.loadContext(actorId),circle=await repo.circles.bySlug(slug);if(!context.actor||!circle)throw new ConnectError(404,"Circle unavailable.");
   const memberships=await repo.circles.memberships();const visible=generalizeCards(privacyCards(context).filter(card=>memberships.some(row=>row.circleId===circle.id&&row.userId===card.userId)));
   const start=(page-1)*20;return{viewerId:actorId,circle:summary(circle),items:visible.slice(start,start+20),page,hasNext:start+20<visible.length,visibleMemberBand:band(visible.length)};
  });},
  async membership(actorId:string,slug:string,input:unknown){circleSlug(slug);const body=contactObject(input,["action"]);if(body.action!=="join"&&body.action!=="leave")throw new ConnectError(400,"Choose join or leave.");return gateway.transaction(async repo=>{
   await repo.lockUsers([actorId]);if(!await repo.actor(actorId))throw new ConnectError(404,"Profile unavailable.");const circle=await repo.circles.bySlug(slug);if(!circle)throw new ConnectError(404,"Circle unavailable.");
   if(body.action==="join")await repo.circles.join(actorId,circle.id);else await repo.circles.leave(actorId,circle.id);
   return{viewerId:actorId,joined:body.action==="join"};
  });},
  async createInvitation(actorId:string,input:unknown){
   const body=contactObject(input,["kind","circleSlug","approvedAlias","message","allowsIntroductions","approvePublic"]);
   if(body.approvePublic!==true||typeof body.allowsIntroductions!=="boolean"||(body.kind!=="personal"&&body.kind!=="circle"))throw new ConnectError(400,"Explicitly approve the public information and invitation permissions.");
   if(body.kind==="personal"&&(body.allowsIntroductions!==true||body.circleSlug!=null))throw new ConnectError(400,"Personal links require separate permission to receive introductions.");
   if(body.kind==="circle"&&(typeof body.circleSlug!=="string"||!curatedCircles.some(c=>c.slug===body.circleSlug)))throw new ConnectError(400,"Choose a curated circle.");
   const approvedAlias=contactText(body.approvedAlias,60),message=contactText(body.message,300),token=randomBytes(32).toString("base64url");
   return gateway.transaction(async repo=>{await repo.lockUsers([actorId]);if(!await repo.actor(actorId))throw new ConnectError(404,"Profile unavailable.");
    const circle=body.kind==="circle"?await repo.circles.bySlug(body.circleSlug as string):null;if(body.kind==="circle"&&!circle)throw new ConnectError(404,"Circle unavailable.");
    const invite=await repo.invitation.create({userId:actorId,tokenHash:invitationHash(token),circleId:circle?.id??null,approvedAlias,message,allowsIntroductions:body.allowsIntroductions as boolean,expiresAt:new Date(Date.now()+604800000)});
    return{viewerId:actorId,path:`/connect/invitation/${token}`,invitation:{...publicDTO(invite),id:invite.id,expiresAt:invite.expiresAt.toISOString(),revokedAt:null,createdAt:invite.createdAt.toISOString()}};
   });
  },
  async invitations(actorId:string,params:URLSearchParams):Promise<InvitationList>{const{page}=contactQuery(params);return gateway.transaction(async repo=>{if(!await repo.actor(actorId))throw new ConnectError(404,"Profile unavailable.");const rows=await repo.invitation.list(actorId,page);return{viewerId:actorId,page,hasNext:rows.length>20,items:rows.slice(0,20).map(invite=>({...publicDTO(invite),id:invite.id,expiresAt:invite.expiresAt.toISOString(),revokedAt:invite.revokedAt?.toISOString()??null,createdAt:invite.createdAt.toISOString()}))};});},
  async revoke(actorId:string,id:string,input:unknown){contactId(id);const body=contactObject(input,["confirmRevoke"]);if(body.confirmRevoke!==true)throw new ConnectError(400,"Confirm revocation.");return gateway.transaction(async repo=>{await repo.lockUsers([actorId]);if(!await repo.actor(actorId))throw invitationUnavailable();const invite=await repo.invitation.byId(id);if(!invite||invite.userId!==actorId)throw invitationUnavailable();if(!invite.revokedAt)await repo.invitation.revoke(id,new Date());return{viewerId:actorId,revoked:true};});},
  async landing(token:string,actorId?:string):Promise<PublicInvitation>{requireDemoMode();return gateway.transaction(async repo=>publicDTO(await lockedInvitation(repo,token,actorId)));},
  async status(actorId:string,token:string):Promise<InvitationStatus>{return gateway.transaction(async repo=>{
   const invite=await lockedInvitation(repo,token,actorId),profile=await repo.invitation.profile(actorId);if(!profile)throw invitationUnavailable();const claim=await repo.invitation.claim(actorId);const[low,high]=[actorId,invite.userId].sort();const pair=actorId===invite.userId?null:await repo.pair(low,high);
   const reserved=isReserved(profile.demoOrdinal),activated=profile.demoActivatedAt!==null,isCreator=invite.userId===actorId;
   return{viewerId:actorId,isCreator,reservedNewcomer:reserved,activated,claimedHere:claim?.invitationId===invite.id&&!claim.revokedAt,attributedElsewhere:!!claim&&claim.invitationId!==invite.id,canClaim:!isCreator&&reserved&&!activated&&!claim,canIntroduce:!isCreator&&invite.allowsIntroductions&&(!reserved||activated)&&!pair,relationship:pair?.state.toLowerCase()??"none",circleJoined:!!invite.circleId&&!!await repo.circles.joined(actorId,invite.circleId),circle:invite.circle?summary(invite.circle):null};
  });},
  async claim(actorId:string,token:string,input:unknown){const body=contactObject(input,["confirmDemoActivation"]);if(body.confirmDemoActivation!==true)throw new ConnectError(400,"Explicitly confirm simulated activation.");return gateway.transaction(async repo=>{
   const invite=await lockedInvitation(repo,token,actorId);if(invite.userId===actorId)throw new ConnectError(400,"Self-referral is not allowed.");
   const profile=await repo.invitation.profile(actorId);if(!profile||!isReserved(profile.demoOrdinal))throw new ConnectError(403,"Choose a reserved newcomer persona for demo activation.");
   const claim=await repo.invitation.claim(actorId);if(claim){if(claim.invitationId===invite.id&&!claim.revokedAt)return{viewerId:actorId,activated:true,alreadyClaimed:true};throw new ConnectError(409,"This persona already has a referral source.");}
   if(profile.demoActivatedAt)throw new ConnectError(409,"This demo persona was already activated.");
   await repo.invitation.createClaim(actorId,invite.id);await repo.invitation.activate(actorId,new Date());
   return{viewerId:actorId,activated:true,alreadyClaimed:false};
  });}
 };
}
export const communityService=createCommunityService();
