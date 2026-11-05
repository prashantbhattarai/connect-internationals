import { Prisma } from "@prisma/client";
import { db } from "./client";
import { lockContactUsers } from "./contactRepo";
let ordinal=10000;
export async function initializeFixtureOrdinals(){ordinal=((await db.connectProfile.aggregate({_max:{demoOrdinal:true}}))._max.demoOrdinal??9999)+1;}
export function requireIsolatedStage4() {
 const url=new URL(process.env.DATABASE_URL??"");
 if(!["postgres","localhost","127.0.0.1"].includes(url.hostname)||url.pathname!=="/connect_dev"||!/^stage[456]_test_[0-9a-f]{32}$/.test(url.searchParams.get("schema")??"")) throw new Error("Stage 4 fixtures require their isolated local schema");
}
export async function isolatedSchema(name:string,create:boolean) {
 if(!/^stage[456]_test_[0-9a-f]{32}$/.test(name))throw new Error("Invalid isolated schema");
 const url=new URL(process.env.DATABASE_URL??"");if(!["postgres","localhost","127.0.0.1"].includes(url.hostname)||url.pathname!=="/connect_dev")throw new Error("Local database required");
 await db.$executeRawUnsafe(create?`CREATE SCHEMA "${name}"`:`DROP SCHEMA "${name}" CASCADE`);
}
export async function fixturePersona(name:string,discoverable=true) {
 requireIsolatedStage4();const userId=`seed_s4_${name}`;
 await db.user.create({data:{id:userId,profile:{create:{alias:`Demo test ${name}`,demoOrdinal:ordinal++,interests:["s4 projects"],purposes:["friendship"],lookingFor:[],canHelpWith:[],targetRoles:[],provenance:{alias:"synthetic_demo",interests:"synthetic_demo",purposes:"synthetic_demo"},discoverable,consentSource:"simulated_demo"}}}});
 return userId;
}
export async function fixtureBlock(a:string,b:string) {await db.$transaction(async tx=>{await lockContactUsers(tx,[a,b]);await tx.block.create({data:{userId:a,blockedId:b}});});}
export async function fixtureHidden(id:string,discoverable:boolean) {await db.$transaction(async tx=>{await lockContactUsers(tx,[id]);await tx.connectProfile.update({where:{userId:id},data:{discoverable}});});}
export async function fixtureDeletion(id:string) {await db.$transaction(async tx=>{await lockContactUsers(tx,[id]);await tx.profileDeletion.create({data:{userId:id}});});}
export async function fixtureUsage(userId:string,action:string,count:number,ago:number) {await db.usageCounter.create({data:{userId,action,count,windowStart:new Date(Date.now()-ago)}});}
export async function fixturePending(userId:string,count:number) {
 for(let i=0;i<count;i++){const recipientId=await fixturePersona(`pending_${i}`);const[pairLow,pairHigh]=[userId,recipientId].sort();await db.connectionRequest.create({data:{senderId:userId,recipientId,pairLow,pairHigh,purpose:"friendship",note:"Old pending fixture",createdAt:new Date(Date.now()-172800000)}});}
}
export const pairCount=(a:string,b:string)=>db.connectionRequest.count({where:{pairLow:[a,b].sort()[0],pairHigh:[a,b].sort()[1]}});
export const conversationCount=(requestId:string)=>db.conversation.count({where:{requestId}});
export const requestState=(id:string)=>db.connectionRequest.findUniqueOrThrow({where:{id},select:{state:true}});
export const messageCount=(conversationId:string)=>db.message.count({where:{conversationId}});
export async function usageTotal(userId:string,action:string){return(await db.usageCounter.aggregate({where:{userId,action},_sum:{count:true}}))._sum.count??0;}
export async function fixtureMessages(conversationId:string,userId:string){await db.message.createMany({data:Array.from({length:5},(_,i)=>({id:`s4_same_time_${i}`,conversationId,userId,text:`Same-time fixture ${i}`,createdAt:new Date("2020-01-01T00:00:00Z")}))});}
export const fixtureConversationState=(requestId:string,state:Prisma.ConnectionRequestUpdateInput["state"])=>db.connectionRequest.update({where:{id:requestId},data:{state}});
