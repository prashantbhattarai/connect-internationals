import {Prisma} from "@prisma/client";
export function createSafetyRepository(client:Prisma.TransactionClient){return{
 lockAllUsers:()=>client.$queryRaw(Prisma.sql`SELECT "id" FROM "User" ORDER BY "id" COLLATE "C" FOR UPDATE`),
 deleted:(userId:string)=>client.profileDeletion.findUnique({where:{userId},select:{id:true}}),
 block:(userId:string,blockedId:string,label:string)=>client.block.upsert({where:{userId_blockedId:{userId,blockedId}},create:{userId,blockedId,label},update:{},select:{id:true}}),
 ownBlock:(userId:string,blockedId:string)=>client.block.findUnique({where:{userId_blockedId:{userId,blockedId}},select:{id:true}}),
 unblock:(userId:string,blockedId:string)=>client.block.deleteMany({where:{userId,blockedId}}),
 blocks:(userId:string,page:number)=>client.block.findMany({where:{userId},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*20,take:21,select:{blockedId:true,label:true,createdAt:true}}),
 async closePair(a:string,b:string,now:Date){
  const[pairLow,pairHigh]=[a,b].sort();await client.connectionRequest.updateMany({where:{pairLow,pairHigh,state:{in:["PENDING","ACCEPTED"]}},data:{state:"CLOSED"}});
  const invitations=await client.invitation.findMany({where:{userId:{in:[a,b]}},select:{id:true,userId:true}});
  if(invitations.length)await client.invitationRestriction.createMany({data:invitations.map(invite=>({invitationId:invite.id,userId:invite.userId===a?b:a})),skipDuplicates:true});
  await client.referralClaim.updateMany({where:{OR:[{userId:a,invitation:{userId:b}},{userId:b,invitation:{userId:a}}]},data:{revokedAt:now,acceptedAt:null}});
 },
 report:(userId:string,subjectId:string,reason:string,context:string|null)=>client.report.create({data:{userId,subjectId,reason,context},select:{id:true}}),
 async purgeProfile(userId:string){
  await client.profileDeletion.upsert({where:{userId},create:{userId},update:{}});
  await client.connectionRequest.deleteMany({where:{OR:[{senderId:userId},{recipientId:userId}]}});
  await client.message.deleteMany({where:{userId}});
  await client.circleMembership.deleteMany({where:{userId}});
  await client.referralClaim.deleteMany({where:{userId}});
  await client.invitationRestriction.deleteMany({where:{userId}});
  await client.invitation.deleteMany({where:{userId}});
  await client.report.deleteMany({where:{OR:[{userId},{subjectId:userId}]}});
  await client.block.deleteMany({where:{OR:[{userId},{blockedId:userId}]}});
  await client.usageCounter.deleteMany({where:{userId}});
  await client.connectProfile.deleteMany({where:{userId}});
 }
};}
