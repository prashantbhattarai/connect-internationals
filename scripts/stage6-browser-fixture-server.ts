import {cpSync} from "node:fs";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {fixturePersona,requireIsolatedStage4} from "../lib/db/repositories/stage4TestRepo";
import {communityService} from "../lib/db/services/communityService";
import {contactService} from "../lib/db/services/contactService";
import {db} from "../lib/db/repositories/client";
let server:ReturnType<typeof spawn>|undefined;
for(const signal of ["SIGTERM","SIGINT"] as const)process.on(signal,()=>server?.kill("SIGTERM"));
async function main(){requireIsolatedStage4();const[a,b]=await Promise.all([fixturePersona("s6_browser_A"),fixturePersona("s6_browser_B")]);await communityService.seedCircles();const sent=await contactService.sendIntroduction(a,{recipientId:b,purpose:"friendship",note:"Browser fixture introduction"});const accepted=await contactService.transitionRequest(b,sent.request.id,{action:"accept"});await contactService.sendMessage(a,accepted.request.conversationId!,{text:'<img src=x onerror="window.__safetyInjection=true">'});cpSync(".next/static",".next/standalone/.next/static",{recursive:true});server=spawn(process.execPath,[".next/standalone/server.js"],{env:{...process.env,PORT:"3100",HOSTNAME:"0.0.0.0",NODE_ENV:"production",DEMO_MODE:"true",DEMO_ORIGIN:"http://localhost:3100"},stdio:"inherit"});await once(server,"exit");}
main().catch(()=>{console.error("Browser fixture setup failed; private details omitted.");process.exitCode=1;}).finally(()=>db.$disconnect());
