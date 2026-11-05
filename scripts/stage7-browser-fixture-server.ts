import {cpSync} from "node:fs";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {fixturePersona,requireIsolatedStage4} from "../lib/db/repositories/stage4TestRepo";
import {reserveStage7Newcomer} from "../lib/db/repositories/stage7DemoRepo";
import {communityService} from "../lib/db/services/communityService";
import {contactService} from "../lib/db/services/contactService";
import {db} from "../lib/db/repositories/client";
let server:ReturnType<typeof spawn>|undefined;
for(const signal of ["SIGTERM","SIGINT"] as const)process.on(signal,()=>server?.kill("SIGTERM"));
async function main(){
 requireIsolatedStage4();
 const people:string[]=[];
 for(const name of ["A","B","C","D","E","F","G"])people.push(await fixturePersona(`s7_${name}`));
 await reserveStage7Newcomer(people[2]);
 await communityService.seedCircles();
 for(const id of people.filter((_,i)=>i!==2))await communityService.membership(id,"swe-interview-partners",{action:"join"});
 await contactService.sendIntroduction(people[0],{recipientId:people[1],purpose:"friendship",note:"Synthetic walkthrough: would you like to practice together?"});
 cpSync(".next/static",".next/standalone/.next/static",{recursive:true});
 server=spawn(process.execPath,[".next/standalone/server.js"],{env:{...process.env,PORT:"3100",HOSTNAME:"0.0.0.0",NODE_ENV:"production",DEMO_MODE:"true",DEMO_ORIGIN:"http://localhost:3100"},stdio:"inherit"});
 await once(server,"exit");
}
main().catch(()=>{console.error("Stage 7 synthetic fixture failed; private details omitted.");process.exitCode=1;}).finally(()=>db.$disconnect());
