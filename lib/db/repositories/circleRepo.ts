import { Prisma } from "@prisma/client";
export function createCircleRepository(client:Prisma.TransactionClient){return{
 ensure:(circle:{slug:string;name:string;purpose:string;starterActivity:string})=>client.circle.upsert({where:{slug:circle.slug},create:circle,update:{},select:{id:true}}),
 list:()=>client.circle.findMany({orderBy:{slug:"asc"},select:{id:true,slug:true,name:true,purpose:true,starterActivity:true}}),
 bySlug:(slug:string)=>client.circle.findUnique({where:{slug},select:{id:true,slug:true,name:true,purpose:true,starterActivity:true}}),
 memberships:()=>client.circleMembership.findMany({select:{circleId:true,userId:true}}),
 joined:(userId:string,circleId:string)=>client.circleMembership.findUnique({where:{userId_circleId:{userId,circleId}},select:{id:true}}),
 join:(userId:string,circleId:string)=>client.circleMembership.upsert({where:{userId_circleId:{userId,circleId}},create:{userId,circleId},update:{},select:{id:true}}),
 leave:(userId:string,circleId:string)=>client.circleMembership.deleteMany({where:{userId,circleId}})
};}
