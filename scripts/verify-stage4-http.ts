import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { db } from "../lib/db/repositories/client";
import { fixturePersona,fixtureBlock,fixtureDeletion,initializeFixtureOrdinals,conversationCount,pairCount,messageCount,requireIsolatedStage4 } from "../lib/db/repositories/stage4TestRepo";
async function main(){
 requireIsolatedStage4();await initializeFixtureOrdinals();
 const[a,b,c,hidden,deleted]=await Promise.all([fixturePersona("http_A"),fixturePersona("http_B"),fixturePersona("http_C"),fixturePersona("http_hidden",false),fixturePersona("http_deleted")]);await fixtureDeletion(deleted);
 const server=spawn(process.execPath,[".next/standalone/server.js"],{env:{...process.env,NODE_ENV:"production",PORT:"3100",HOSTNAME:"127.0.0.1",DEMO_MODE:"true",DEMO_ORIGIN:"http://localhost:3100"},stdio:"ignore"});
 let serverError=false;server.on("error",()=>{serverError=true;});
 try{
  const base="http://127.0.0.1:3100";let ready=false;
  for(let n=0;n<150;n++){if(serverError||server.exitCode!==null)throw new Error("Isolated app failed to start");try{if((await fetch(`${base}/api/connect/personas`)).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(ready);
  const request=(path:string,cookie?:string,init:RequestInit={})=>fetch(`${base}${path}`,{...init,headers:{...(cookie?{Cookie:cookie}:{}),...init.headers}});
  async function login(userId:string){const response=await request("/api/connect/persona",undefined,{method:"POST",headers:{Origin:"http://localhost:3100","Content-Type":"application/json"},body:JSON.stringify({userId})});assert.equal(response.status,200);return response.headers.get("set-cookie")!.split(";")[0];}
  const[ca,cb,cc]=await Promise.all([login(a),login(b),login(c)]);
  const mutate=(path:string,cookie:string,identity:string,body:unknown,method="POST",origin="http://localhost:3100")=>request(path,cookie,{method,headers:{Origin:origin,"Content-Type":"application/json","X-Connect-Identity":identity},body:JSON.stringify(body)});
  const intro=(actor:string,cookie:string,recipientId:string,note="A thoughtful HTTP introduction")=>mutate("/api/connect/requests",cookie,actor,{recipientId,purpose:"friendship",note});
  for(const path of["/api/connect/requests","/api/connect/conversations","/api/connect/conversations/unknown/messages"]){assert.equal((await request(path)).status,401);assert.equal((await request(path,"connect_demo_user=invalid")).status,401);}
  assert.equal((await mutate("/api/connect/requests",ca,b,{recipientId:b,purpose:"friendship",note:"Stale persona"})).status,409);
  assert.equal((await mutate("/api/connect/requests",ca,a,{recipientId:b,purpose:"friendship",note:"Cross origin"},"POST","https://untrusted.example")).status,403);
  assert.equal((await mutate("/api/connect/requests",ca,a,{recipientId:b,purpose:"friendship",note:"Forged",actorId:c})).status,400);
  assert.equal((await intro(a,ca,a)).status,400);assert.equal((await intro(a,ca,hidden)).status,404);assert.equal((await intro(a,ca,deleted)).status,404);assert.equal((await intro(a,ca,b,"x".repeat(301))).status,400);
  const sent=await intro(a,ca,b);assert.equal(sent.status,200);assert.match(sent.headers.get("cache-control")!,/private.*no-store/);assert.match(sent.headers.get("vary")!,/Cookie/i);const original=await sent.json();const requestId=original.request.id;
  assert.equal((await request(`/api/connect/requests/${requestId}/conversation`,ca)).status,403);
  const act=(actor:string,cookie:string,action:string)=>mutate(`/api/connect/requests/${requestId}`,cookie,actor,{action},"PATCH");
  assert.equal((await act(a,ca,"accept")).status,403);assert.equal((await act(c,cc,"accept")).status,404);assert.equal((await act(b,cb,"cancel")).status,403);
  assert.equal((await intro(a,ca,b)).status,409);assert.equal((await intro(b,cb,a)).status,409);
  const incoming=await(await request("/api/connect/requests",cb)).json();assert.equal(incoming.items.find((item:{id:string})=>item.id===requestId).direction,"incoming");assert.equal((await(await request("/api/connect/requests",cc)).json()).items.length,0);
  const accepts=await Promise.all(Array.from({length:6},()=>act(b,cb,"accept")));assert.ok(accepts.every(response=>response.status===200));const payloads=await Promise.all(accepts.map(response=>response.json()));const ids=new Set(payloads.map(payload=>payload.request.conversationId));assert.equal(ids.size,1);const conversationId=payloads[0].request.conversationId;assert.equal(await conversationCount(requestId),1);
  const path=`/api/connect/conversations/${conversationId}/messages`;
  assert.equal((await request(path,cc)).status,404);assert.equal((await mutate(path,cc,c,{text:"Intruder"})).status,404);assert.equal((await request(`/api/connect/requests/${requestId}/conversation`,cc)).status,404);assert.equal((await(await request("/api/connect/conversations",cc)).json()).items.length,0);
  const literal="<img src=x onerror=alert(1)>";assert.equal((await mutate(path,ca,a,{text:literal})).status,200);assert.equal((await mutate(path,cb,b,{text:"Persisted HTTP reply"})).status,200);
  const read=await request(path,ca);assert.equal(read.status,200);assert.match(read.headers.get("cache-control")!,/no-store/);const history=await read.json();assert.equal(history.items.length,2);assert.equal(history.items[0].text,literal);assert.equal(history.items[1].sender,"peer");assert.deepEqual((await(await request(path,ca)).json()).items,history.items);
  const latest=await(await request(`${path}?limit=1`,ca)).json();assert.equal(latest.items.length,1);assert.equal(latest.hasOlder,true);const older=await(await request(`${path}?limit=1&before=${latest.nextBefore}`,ca)).json();assert.equal(older.items[0].id,history.items[0].id);assert.equal(older.hasOlder,false);
  assert.equal((await request(`${path}?limit=51`,ca)).status,400);assert.equal((await mutate(path,ca,a,{text:"x".repeat(2001)})).status,400);assert.equal((await mutate(path,ca,a,{text:"Forged sender",userId:c})).status,400);assert.equal((await mutate(path,ca,b,{text:"Cross-persona draft"})).status,409);
  const burst=await Promise.all(Array.from({length:35},(_,i)=>mutate(path,ca,a,{text:`Rate test ${i}`})));assert.equal(burst.filter(response=>response.status===200).length,29);assert.equal(burst.filter(response=>response.status===429).length,6);for(const response of burst.filter(response=>response.status===429))assert.ok(Number(response.headers.get("retry-after"))>0);assert.equal(await messageCount(conversationId),31);
  const limitActor=await fixturePersona("http_limit"),limitCookie=await login(limitActor),targets=await Promise.all(Array.from({length:8},(_,i)=>fixturePersona(`http_target_${i}`)));
  const introductions=await Promise.all(targets.map(peer=>intro(limitActor,limitCookie,peer)));assert.equal(introductions.filter(response=>response.status===200).length,5);assert.equal(introductions.filter(response=>response.status===429).length,3);assert.ok(introductions.filter(response=>response.status===429).every(response=>Number(response.headers.get("retry-after"))>0));
  const first=await introductions.find(response=>response.status===200)!.json();assert.equal((await mutate(`/api/connect/requests/${first.request.id}`,limitCookie,limitActor,{action:"cancel"},"PATCH")).status,200);const extra=await fixturePersona("http_extra");assert.equal((await intro(limitActor,limitCookie,extra)).status,429);
  const[x,y]=await Promise.all([fixturePersona("http_X"),fixturePersona("http_Y")]);const[cx,cy]=await Promise.all([login(x),login(y)]);const crossed=await Promise.all([intro(x,cx,y),intro(y,cy,x)]);assert.deepEqual(crossed.map(response=>response.status).sort(),[200,409]);assert.equal(await pairCount(x,y),1);
  await fixtureBlock(b,a);for(const[cookie,identity]of[[ca,a],[cb,b]]){assert.equal((await request(path,cookie)).status,404);assert.equal((await mutate(path,cookie,identity,{text:"Blocked"})).status,404);assert.equal((await(await request("/api/connect/conversations",cookie)).json()).items.length,0);}
  await fixtureDeletion(y);assert.equal((await intro(x,cx,y)).status,404);assert.equal((await request("/api/connect/requests",cy)).status,401);
  for(const route of["/connect/requests","/connect/messages"]){const page=await request(route);assert.equal(page.status,200);}
  console.log("PASS Stage 4 isolated HTTP: independent A/B/C cookies; introduction/accept/chat persistence; recipient/sender authorization; concurrent accepts/crossed sends; real 5/day and 30/min caps with Retry-After; invalid and stale actors; privacy/block/deletion gates; bounded history; HTML-like text retained; app pages. Browser interactions not exercised.");
 }finally{server.kill("SIGTERM");await Promise.race([once(server,"exit"),new Promise(resolve=>setTimeout(resolve,2000))]);if(server.exitCode===null)server.kill("SIGKILL");}
}
main().catch(error=>{console.error(`Stage 4 HTTP failure (${error instanceof Error?error.name:"unknown"}). Response bodies omitted.`);if(error instanceof Error)console.error(error.stack?.split("\n").filter(line=>/^\s+at /.test(line)).slice(0,5).join("\n"));process.exitCode=1;}).finally(()=>db.$disconnect());
