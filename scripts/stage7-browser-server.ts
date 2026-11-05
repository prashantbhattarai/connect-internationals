import {randomUUID} from "node:crypto";
import {spawn,spawnSync} from "node:child_process";
import {isolatedSchema} from "../lib/db/repositories/stage4TestRepo";
import {db} from "../lib/db/repositories/client";
let child:ReturnType<typeof spawn>|undefined,stopping=false;
for(const signal of ["SIGTERM","SIGINT"] as const)process.on(signal,()=>{stopping=true;child?.kill("SIGTERM");});
async function main(){const schema=`stage6_test_${randomUUID().replaceAll("-","")}`;await isolatedSchema(schema,true);try{const url=new URL(process.env.DATABASE_URL!);url.searchParams.set("schema",schema);const env={...process.env,DATABASE_URL:url.toString()};const migrated=spawnSync(process.execPath,[require.resolve("prisma/build/index.js"),"migrate","deploy"],{env,stdio:"inherit"});if(migrated.status!==0)throw new Error("Browser fixture migration failed");if(stopping)return;child=spawn(process.execPath,["scripts/run-ts.cjs","scripts/stage7-browser-fixture-server.ts"],{env,stdio:"inherit"});await new Promise<void>((resolve,reject)=>child!.on("exit",code=>stopping||code===0?resolve():reject(new Error("Browser fixture child failed"))));}finally{await isolatedSchema(schema,false);console.log("Browser fixture schema removed; live demo retained.");}}
main().catch(()=>{console.error("Browser fixture server failed; private details omitted.");process.exitCode=1;}).finally(()=>db.$disconnect());
