import { Prisma } from "@prisma/client";
const circleSelect = { slug:true,name:true,purpose:true,starterActivity:true } satisfies Prisma.CircleSelect;
const inviteSelect = { id:true,userId:true,circleId:true,approvedAlias:true,message:true,allowsIntroductions:true,expiresAt:true,revokedAt:true,createdAt:true,circle:{select:circleSelect} } satisfies Prisma.InvitationSelect;
export type InvitationRecord = Prisma.InvitationGetPayload<{select:typeof inviteSelect}>;
export function createInvitationRepository(client:Prisma.TransactionClient){return{
 byHash:(tokenHash:string)=>client.invitation.findUnique({where:{tokenHash},select:inviteSelect}),
 byId:(id:string)=>client.invitation.findUnique({where:{id},select:inviteSelect}),
 async create(data:Prisma.InvitationUncheckedCreateInput){
  const invite=await client.invitation.create({data,select:inviteSelect});
  const blocks=await client.block.findMany({where:{OR:[{userId:invite.userId},{blockedId:invite.userId}]},select:{userId:true,blockedId:true}});
  if(blocks.length)await client.invitationRestriction.createMany({data:blocks.map(block=>({invitationId:invite.id,userId:block.userId===invite.userId?block.blockedId:block.userId})),skipDuplicates:true});
  return invite;
 },
 restricted:(invitationId:string,userId:string)=>client.invitationRestriction.findUnique({where:{userId_invitationId:{userId,invitationId}},select:{id:true}}),
 list:(userId:string,page:number)=>client.invitation.findMany({where:{userId},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*20,take:21,select:inviteSelect}),
 revoke:async(id:string,now:Date)=>{await client.invitation.update({where:{id},data:{revokedAt:now}});await client.referralClaim.updateMany({where:{invitationId:id,revokedAt:null},data:{revokedAt:now}});},
 profile:(userId:string)=>client.connectProfile.findFirst({where:{userId,user:{tombstone:null}},select:{userId:true,demoOrdinal:true,demoActivatedAt:true}}),
 claim:(userId:string)=>client.referralClaim.findUnique({where:{userId},select:{id:true,invitationId:true,revokedAt:true}}),
 createClaim:(userId:string,invitationId:string)=>client.referralClaim.create({data:{userId,invitationId},select:{id:true}}),
 activate:(userId:string,now:Date)=>client.connectProfile.update({where:{userId},data:{demoActivatedAt:now,discoverable:false,consentSource:"none",consentAt:null}}),
 markAccepted:(userId:string,invitationId:string,now:Date)=>client.referralClaim.updateMany({where:{userId,invitationId,acceptedAt:null,revokedAt:null},data:{acceptedAt:now}})
};}
