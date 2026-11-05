import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isolatedSchema } from "../lib/db/repositories/stage4TestRepo";
import { db } from "../lib/db/repositories/client";
async function main(){
 const schema=`stage4_test_${randomUUID().replaceAll("-","")}`;
 await isolatedSchema(schema,true);
 try{
  const url=new URL(process.env.DATABASE_URL!);url.searchParams.set("schema",schema);
  const env={...process.env,DATABASE_URL:url.toString()};
  const commands=[[require.resolve("prisma/build/index.js"),"migrate","deploy"],["scripts/run-ts.cjs","scripts/verify-stage4.ts"]];
  if(process.env.STAGE4_HTTP==="true")commands.push(["scripts/run-ts.cjs","scripts/verify-stage4-http.ts"]);
  for(const args of commands){const result=spawnSync(process.execPath,args,{env,stdio:"inherit"});if(result.status!==0)throw new Error("Stage 4 child check failed");}
 }finally{await isolatedSchema(schema,false);console.log("Temporary Stage 4 schema removed; demo tables and database volume retained.");}
}
main().catch(()=>{console.error("Stage 4 checks failed. Existing demo schema was not reset.");process.exitCode=1;}).finally(()=>db.$disconnect());
