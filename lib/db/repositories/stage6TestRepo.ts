import {Prisma} from "@prisma/client";
import {db} from "./client";
import {requireIsolatedStage4} from "./stage4TestRepo";
export async function pairActiveCount(a:string,b:string){return db.connectionRequest.count({where:{pairLow:[a,b].sort()[0],pairHigh:[a,b].sort()[1],state:{in:["PENDING","ACCEPTED"]}}});}
export const reportCount=(userId:string)=>db.report.count({where:{userId}});
export const reportsAbout=(subjectId:string)=>db.report.count({where:{subjectId}});
export const coreCount=()=>db.user.count();
export const markerCount=(userId:string)=>db.profileDeletion.count({where:{userId}});
export const profileCount=(userId:string)=>db.connectProfile.count({where:{userId}});
export const profileExists=(userId:string)=>db.connectProfile.findUnique({where:{userId},select:{alias:true,provenance:true}});
export const restrictionCount=(userId:string)=>db.invitationRestriction.count({where:{userId}});
export async function deletionRemainders(userId:string){requireIsolatedStage4();return{
 core:await db.user.count({where:{id:userId}}),marker:await markerCount(userId),profile:await profileCount(userId),
 requests:await db.connectionRequest.count({where:{OR:[{senderId:userId},{recipientId:userId}]}}),messages:await db.message.count({where:{userId}}),
 memberships:await db.circleMembership.count({where:{userId}}),invitations:await db.invitation.count({where:{userId}}),claims:await db.referralClaim.count({where:{userId}}),
 blocks:await db.block.count({where:{OR:[{userId},{blockedId:userId}]}}),reports:await db.report.count({where:{OR:[{userId},{subjectId:userId}]}}),usage:await db.usageCounter.count({where:{userId}}),restrictions:await restrictionCount(userId)
};}
export async function freshImportInputs(count=925){return Array.from({length:count},(_,i)=>({id:`seed_s6_${String(i).padStart(4,"0")}`,email:`fixture.${i}@example.test`,displayName:"Synthetic fixture",nationality:"Prefer not to say",city:null,targetRoles:[],accessLevel:i%2?"PAID":"FREE"}));}
export async function editFixture(userId:string,alias:string){await db.connectProfile.update({where:{userId},data:{alias,provenance:{alias:"user_entered"}}});}
export const messageRows=(conversationId:string)=>db.message.count({where:{conversationId}});
export const countConversations=(id:string)=>db.conversation.count({where:{id}});
export async function fixtureReportContext(userId:string,subjectId:string){await db.report.create({data:{userId,subjectId,reason:"other",context:"Deletion fixture context"}});}
export const validDeletedRemainders=(rows:Awaited<ReturnType<typeof deletionRemainders>>)=>Object.entries(rows).every(([key,value])=>value===(key==="core"||key==="marker"?1:0));
export async function tombstoneCheckInTransaction(userId:string){return db.$transaction(async tx=>{await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`);return !!await tx.profileDeletion.findUnique({where:{userId}});});}
