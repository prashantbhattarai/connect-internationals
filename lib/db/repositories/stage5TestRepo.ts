import {db} from "./client";
import {fixturePersona,requireIsolatedStage4} from "./stage4TestRepo";
export async function newcomer(name:string,ordinal:number){const id=await fixturePersona(name,false);await db.connectProfile.update({where:{userId:id},data:{demoOrdinal:ordinal}});return id;}
export const profileMeta=(userId:string)=>db.connectProfile.findUniqueOrThrow({where:{userId},select:{demoActivatedAt:true,discoverable:true,alias:true}});
export const claimMeta=(userId:string)=>db.referralClaim.findUnique({where:{userId},select:{invitationId:true,acceptedAt:true,revokedAt:true}});
export const claimCount=(userId:string)=>db.referralClaim.count({where:{userId}});
export const membershipsFor=(userId:string)=>db.circleMembership.count({where:{userId}});
export const allRequests=()=>db.connectionRequest.count();
export const storedInvitation=(id:string)=>db.invitation.findUniqueOrThrow({where:{id},select:{tokenHash:true,expiresAt:true,createdAt:true}});
export const expireInvitation=(id:string)=>db.invitation.update({where:{id},data:{expiresAt:new Date(Date.now()-1000)}});
export const aliasEdit=(userId:string,alias:string)=>db.connectProfile.update({where:{userId},data:{alias}});
export const discloseBackground=(userId:string)=>db.connectProfile.update({where:{userId},data:{city:"S5 Test City",nationality:"S5 Test Nation",university:"S5 Test University",major:"S5 Test Major",showCity:true,showNationality:true,showUniversity:true,showMajor:true}});
export async function fixtureStats(){requireIsolatedStage4();return{circles:await db.circle.count(),claims:await db.referralClaim.count(),requests:await db.connectionRequest.count(),conversations:await db.conversation.count(),memberships:await db.circleMembership.count()};}
