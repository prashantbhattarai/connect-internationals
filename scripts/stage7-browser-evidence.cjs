const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");const {once}=require("node:events");
const WebSocket=require("next/dist/compiled/ws");
const base="http://localhost:3100";
let stage="launch";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"stage7-chrome-"));
 const chrome=spawn(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",["--headless=new","--remote-debugging-port=0","--no-first-run","--no-default-browser-check","--disable-background-networking",`--user-data-dir=${profile}`,"about:blank"],{stdio:"ignore"});
 let socket,spawnError=false;chrome.on("error",()=>spawnError=true);
 try{
  const portFile=path.join(profile,"DevToolsActivePort");for(let n=0;n<150&&!fs.existsSync(portFile);n++){if(spawnError||chrome.exitCode!==null)throw new Error("Temporary Chrome did not start");await sleep(100);}assert.ok(fs.existsSync(portFile));
  const port=fs.readFileSync(portFile,"utf8").split("\n")[0];const target=await(await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(base+"/connect")}`,{method:"PUT"})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await once(socket,"open");let sequence=0;const pending=new Map(),exceptions=[];
  socket.on("message",raw=>{const event=JSON.parse(String(raw));if(event.id){const operation=pending.get(event.id);if(operation){pending.delete(event.id);event.error?operation.reject(new Error("Chrome protocol command failed")):operation.resolve(event.result);}}else if(event.method==="Runtime.exceptionThrown")exceptions.push(event.params);});
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error("Browser expression failed");return result.result.value;}
  async function wait(expression){for(let n=0;n<200;n++){try{if(await evaluate(expression))return;}catch{}await sleep(100);}throw new Error(`Browser condition timed out (${stage})`);}
  async function clickText(label,scope="document"){const selector=`Array.from(${scope}.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)})`;await wait(`!!(${selector})&&!(${selector}).disabled`);const point=await evaluate(`(()=>{const e=${selector};e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,...point});await send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,...point});}
  async function fill(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
  await send("Runtime.enable");await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const a="seed_s4_s7_A",b="seed_s4_s7_B",c="seed_s4_s7_C";
  async function choose(id,url="/connect"){
   await send("Page.navigate",{url:base+url});
   await wait(`!!document.querySelector('#persona option[value="${id}"]')`);
   await evaluate(`(()=>{const e=document.querySelector('#persona');e.value=${JSON.stringify(id)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   await wait(`document.querySelector('#persona')?.value===${JSON.stringify(id)}&&!document.body.textContent.includes('Loading people for')`);
  }
  async function api(url,method="GET",body,id){return evaluate(`(async()=>{const r=await fetch(${JSON.stringify(url)},{method:${JSON.stringify(method)},headers:{'Content-Type':'application/json','X-Connect-Identity':${JSON.stringify(id||"")}},${body===undefined?"":`body:JSON.stringify(${JSON.stringify(body)}),`}cache:'no-store'});return{status:r.status,data:await r.json()};})()`);}
  async function shot(name){await sleep(500);await evaluate(name==="01-discovery"?"window.scrollTo(0,document.querySelector('[aria-labelledby=\"suggestions\"]').offsetTop-70)":"window.scrollTo(0,0)");const result=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.mkdirSync("docs/screenshots",{recursive:true});fs.writeFileSync(`docs/screenshots/${name}.png`,Buffer.from(result.data,"base64"));}
  stage="discovery";await choose(a);await wait(`document.querySelectorAll('article').length>=5`);await shot("01-discovery");
  stage="independent acceptance";await choose(b,"/connect/requests");await clickText("Accept");await wait(`!!Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Open conversation')`);
  const chatPath=await evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Open conversation').getAttribute('href')`);
  const conversation=new URL(chatPath,base).searchParams.get("conversation");
  assert.equal((await api(`/api/connect/conversations/${conversation}/messages`,"POST",{text:"Synthetic B: happy to practice together."},b)).status,200);
  await choose(a,"/connect/messages");
  assert.equal((await api(`/api/connect/conversations/${conversation}/messages`,"POST",{text:"Synthetic A: let's pick a time for a mock interview."},a)).status,200);
  await send("Page.navigate",{url:base+chatPath});await wait(`document.querySelectorAll('ol[aria-label="Message history"] li').length===2`);await shot("02-messaging");
  stage="third-person denial";await choose(c);assert.equal((await api(`/api/connect/conversations/${conversation}/messages`)).status,404);
  stage="circles";await choose(a,"/connect/circles");await wait(`document.body.textContent.includes('SWE Interview Partners')`);await shot("03-circles");
  stage="approved invitation";const created=await api('/api/connect/invitations','POST',{kind:'circle',circleSlug:'project-builders',approvedAlias:'Synthetic demo A',message:'Synthetic invitation: build a small project together. Joining and introductions are separate choices.',allowsIntroductions:true,approvePublic:true},a);assert.equal(created.status,200);
  const invitePath=created.data.path,token=invitePath.split('/').pop();
  await choose(c);await send("Page.navigate",{url:base+invitePath});await wait(`document.body.textContent.includes('Activate selected demo newcomer')`);await shot("04-invitation");
  assert.equal((await api(`/api/connect/invitations/${token}/claim`,'POST',{confirmDemoActivation:true},c)).status,200);
  assert.equal((await api(`/api/connect/invitations/${token}/claim`,'POST',{confirmDemoActivation:true},c)).status,200);
  assert.equal((await api(`/api/connect/invitations/${token}/introduction`,'POST',{purpose:'projects',note:'Synthetic newcomer: may I join your project discussion?',confirmIntroduction:true},c)).status,200);
  assert.equal((await api('/api/connect/circles/project-builders/membership','POST',{action:'join'},c)).status,200);
  stage="safety";await choose(a,"/connect/messages");await send("Page.navigate",{url:base+chatPath});await wait(`document.querySelectorAll('ol[aria-label="Message history"] li').length===2`);
  await clickText("Block or report Demo test s7_B");await wait(`!!document.querySelector('[role="dialog"]')`);await shot("05-safety");await clickText("Block this person","document.querySelector('[role=dialog]')");
  await wait(`location.pathname==='/connect/profile'&&document.body.textContent.includes('Remove my block')`);
  assert.equal((await api(`/api/connect/conversations/${conversation}/messages`)).status,404);
  assert.equal(exceptions.length,0);
  console.log("PASS Stage 7 Chrome walkthrough: discovery, independent B acceptance, persisted A/B messages, C denial, circles, approved invitation, idempotent newcomer activation, explicit introduction/separate join, block enforcement. Five token-free synthetic screenshots saved; zero JS exceptions. Live demo untouched.");

 }finally{socket?.close();chrome.kill("SIGTERM");await Promise.race([once(chrome,"exit"),sleep(3000)]);if(chrome.exitCode===null)chrome.kill("SIGKILL");fs.rmSync(profile,{recursive:true,force:true});}
}
main().catch(error=>{console.error(`Stage 7 browser evidence failed at ${stage}: ${error.message}. No response bodies or profile data logged.`);process.exitCode=1;});
