import {randomUUID} from "node:crypto";
import {spawnSync} from "node:child_process";
import {isolatedSchema} from "../lib/db/repositories/stage4TestRepo";
import {db} from "../lib/db/repositories/client";
async function suite(file:string){const schema=`stage6_test_${randomUUID().replaceAll("-","")}`;await isolatedSchema(schema,true);try{const url=new URL(process.env.DATABASE_URL!);url.searchParams.set("schema",schema);const env={...process.env,DATABASE_URL:url.toString()};for(const args of[[require.resolve("prisma/build/index.js"),"migrate","deploy"],["scripts/run-ts.cjs",file]]){const result=spawnSync(process.execPath,args,{env,stdio:"inherit"});if(result.status!==0)throw new Error("Stage 6 child check failed");}}finally{await isolatedSchema(schema,false);console.log("Temporary Stage 6 schema removed; live demo and volumes retained.");}}
async function main(){await suite("scripts/verify-stage6.ts");if(process.env.STAGE6_HTTP==="true")await suite("scripts/verify-stage6-http.ts");}
main().catch(()=>{console.error("Stage 6 checks failed. No live demo reset performed.");process.exitCode=1;}).finally(()=>db.$disconnect());
