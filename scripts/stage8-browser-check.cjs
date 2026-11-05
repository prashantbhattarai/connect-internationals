const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");const {once}=require("node:events");
const WebSocket=require("next/dist/compiled/ws");
const base="http://localhost:3100";
let stage="launch";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"stage8-chrome-"));
 const chrome=spawn(process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",["--headless=new","--remote-debugging-port=0","--no-first-run","--no-default-browser-check","--disable-background-networking",`--user-data-dir=${profile}`,"about:blank"],{stdio:"ignore"});
 let socket,spawnError=false;chrome.on("error",()=>spawnError=true);
 try{
  const portFile=path.join(profile,"DevToolsActivePort");for(let n=0;n<150&&!fs.existsSync(portFile);n++){if(spawnError||chrome.exitCode!==null)throw new Error("Temporary Chrome did not start");await sleep(100);}assert.ok(fs.existsSync(portFile));
  const port=fs.readFileSync(portFile,"utf8").split("\n")[0];const target=await(await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(base+"/connect")}`,{method:"PUT"})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await once(socket,"open");let sequence=0;const pending=new Map(),exceptions=[];
  socket.on("message",raw=>{const event=JSON.parse(String(raw));if(event.id){const operation=pending.get(event.id);if(operation){pending.delete(event.id);event.error?operation.reject(new Error("Chrome protocol command failed")):operation.resolve(event.result);}}else if(event.method==="Runtime.exceptionThrown")exceptions.push(event.params);});
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error("Browser expression failed");return result.result.value;}
  async function wait(expression){for(let n=0;n<200;n++){try{if(await evaluate(expression))return;}catch{}await sleep(100);}throw new Error(`Browser condition timed out (${stage}): ${expression}`);}
  async function clickText(label,scope="document"){const selector=`Array.from(${scope}.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)})`;await wait(`!!(${selector})&&!(${selector}).disabled`);const point=await evaluate(`(()=>{const e=${selector};e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,...point});await send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,...point});}
  await send("Runtime.enable");await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const a="seed_s4_s7_A",b="seed_s4_s7_B",c="seed_s4_s7_C";
  async function choose(id,url="/connect"){
   await send("Page.navigate",{url:base+url});
   await wait(`location.pathname===${JSON.stringify(url.split("?")[0])}`);
   await wait(`!!document.querySelector('#persona option[value="${id}"]')`);
   await evaluate(`(()=>{const e=document.querySelector('#persona');e.value=${JSON.stringify(id)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   await wait(`document.querySelector('#persona')?.value===${JSON.stringify(id)}&&!document.querySelector('#persona').disabled&&!document.body.textContent.includes('Loading people for')`);
  }
  async function api(url,method="GET",body,id){return evaluate(`(async()=>{const r=await fetch(${JSON.stringify(url)},{method:${JSON.stringify(method)},headers:{'Content-Type':'application/json','X-Connect-Identity':${JSON.stringify(id||"")}},${body===undefined?"":`body:JSON.stringify(${JSON.stringify(body)}),`}cache:'no-store'});return{status:r.status,data:await r.json()};})()`);}
  async function shot(name){if(name.includes('messages'))await evaluate("window.scrollTo(0,document.querySelector('ol[aria-label]').closest('section').offsetTop-20)");if(name.includes('profile'))await evaluate("Array.from(document.querySelectorAll('label')).find(e=>e.textContent.includes('Opt into discovery')).scrollIntoView({block:'center'})");if(name.includes('circles'))await evaluate("document.querySelector('article').scrollIntoView({block:'start'})");await sleep(300);const result=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.mkdirSync("docs/screenshots/stage8",{recursive:true});fs.writeFileSync(`docs/screenshots/stage8/${name}.png`,Buffer.from(result.data,"base64"));}
  async function go(url){await send("Page.navigate",{url:base+url});await wait("document.readyState==='complete'");}
  async function point(expression){await wait(`!!(${expression})`);const p=await evaluate(`(()=>{const e=${expression};e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send("Input.dispatchMouseEvent",{type:"mousePressed",button:"left",clickCount:1,...p});await send("Input.dispatchMouseEvent",{type:"mouseReleased",button:"left",clickCount:1,...p});}
  function label(text){return `Array.from(document.querySelectorAll('label')).find(e=>e.textContent.includes(${JSON.stringify(text)}))`;}
  async function checkbox(text){await point(`${label(text)}.querySelector('input[type=checkbox]')`);}
  async function inputLabel(text,value){await wait(`!!(${label(text)})`);await evaluate(`(${label(text)}).querySelector('input,textarea').select()`);await send("Input.dispatchKeyEvent",{type:"keyDown",key:"a",code:"KeyA",modifiers:4});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"a",code:"KeyA",modifiers:4});await send("Input.insertText",{text:value});}
  async function selectLabel(text,value){await wait(`!!(${label(text)})?.querySelector('select')`);await evaluate(`(()=>{const e=(${label(text)}).querySelector('select');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
  async function key(key,code=key,modifiers=0){const windowsVirtualKeyCode={Enter:13,Tab:9,Escape:27}[key];await send("Input.dispatchKeyEvent",{type:"keyDown",key,code,modifiers,windowsVirtualKeyCode,...(key==="Enter"?{text:"\r",unmodifiedText:"\r"}:{})});await send("Input.dispatchKeyEvent",{type:"keyUp",key,code,modifiers,windowsVirtualKeyCode});}
  async function layout(width){await send("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:false});await sleep(150);assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),`Overflow at ${stage}`);}
  stage="profile opt-in";
  for(const id of [a,b]){
   await choose(id,"/connect/profile");await wait("document.body.textContent.includes('Your Connect profile')");
   assert.equal(await evaluate(`(${label('Opt into discovery')}).querySelector('input').checked`),false);
   await checkbox('Opt into discovery');await inputLabel('Interests / hobbies','stage8 practice');
   await clickText('Preview changes');await wait("!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save reviewed profile').disabled");
   await clickText('Save reviewed profile');await wait("document.body.textContent.includes('Profile saved for this demo persona.')");
   await layout(375);await shot(id===a?'01-profile-mobile':'02-profile-b-mobile');await layout(1440);
  }
  stage="filters and recommendations";await choose(a);await wait("document.querySelectorAll('article').length>=5");
  stage='empty filter';await inputLabel('interest','no matching synthetic tag');await clickText('Apply filters');await wait("document.body.textContent.includes('No explained suggestions')");
  stage='clear filters';await clickText('Clear filters');await wait("document.querySelectorAll('article').length>=5");
  stage='matching filter';await inputLabel('interest','stage8 practice');await clickText('Apply filters');await wait("document.body.textContent.includes('Shared interests: stage8 practice')");
  await layout(375);await evaluate("window.scrollTo(0,document.querySelector('#suggestions').offsetTop-20)");await shot('03-recommendations-mobile');await layout(1440);
  stage="introduction";
  await point(`Array.from(document.querySelectorAll('article')).find(e=>e.textContent.includes('Demo test s7_B')).querySelectorAll('button')[1]`);
  await wait("!!document.querySelector('[role=dialog]')");assert.equal(await evaluate("document.activeElement.tagName"),'SELECT');await key('Tab');assert.equal(await evaluate("document.activeElement.tagName"),'TEXTAREA');await key('Escape');await wait("!document.querySelector('[role=dialog]')");assert.equal(await evaluate("document.activeElement.textContent"),'Introduce yourself');await key('Enter');await wait("!!document.querySelector('[role=dialog]')");await key('Tab','Tab',8);assert.equal(await evaluate("document.activeElement.tagName"),'A');await key('Tab');assert.equal(await evaluate("document.activeElement.tagName"),'SELECT');await inputLabel('Your note','Synthetic Stage 8: let us practice together.');await layout(375);await shot('04-introduction-mobile');await clickText('Send introduction');
  await wait("location.pathname==='/connect/requests'&&document.body.textContent.includes('outgoing')");
  stage="acceptance";await choose(b,'/connect/requests');await clickText('Accept');await wait("!!Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Open conversation')");
  const chatPath=await evaluate("Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Open conversation').getAttribute('href')");
  const conversation=new URL(chatPath,base).searchParams.get('conversation');
  await point("Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Open conversation')");await wait("!!document.querySelector('textarea')");
  stage="messages";await inputLabel('Message','Synthetic B: ready to practice.');await clickText('Send');await wait("document.querySelectorAll('ol[aria-label] li').length===1");
  await choose(a,'/connect/messages');await go(chatPath);await wait("!!document.querySelector('textarea')");await inputLabel('Message','Synthetic A: see you at practice.');await clickText('Send');await wait("document.querySelectorAll('ol[aria-label] li').length===2");
  await go(chatPath);await wait("document.querySelectorAll('ol[aria-label] li').length===2");await layout(375);await shot('05-messages-mobile');await layout(1440);await shot('06-messages-desktop');
  stage="third-person denial";await choose(c);await go(chatPath);await wait("document.body.textContent.includes('Contact unavailable')");assert.equal(await evaluate("document.querySelectorAll('ol[aria-label] li').length"),0);assert.equal((await api(`/api/connect/conversations/${conversation}/messages`)).status,404);
  stage="circles";await choose(a,'/connect/circles');await wait("Array.from(document.querySelectorAll('article')).filter(e=>/SWE Interview Partners|Project Builders|Campus & City Friends/.test(e.textContent)).length===3");
  const project=`Array.from(document.querySelectorAll('article')).find(e=>e.textContent.includes('Project Builders'))`;
  stage='circle join';await clickText('Join voluntarily',project);await wait(`${project}.textContent.includes('You joined this circle')`);stage='circle members';await clickText('View eligible members',project);await wait("document.body.textContent.includes('No eligible member cards')");stage='circle leave';await clickText('Leave',project);await wait(`${project}.textContent.includes('You have not joined')`);
  stage='circle layout';await layout(375);await shot('07-circles-mobile');await layout(1440);
  stage="invitation form and copy";await go('/connect/invite');await wait("document.body.textContent.includes('Create a link for a friend')");
  await selectLabel('Invitation type','circle');await selectLabel('Public circle summary','project-builders');await inputLabel('Alias approved','Synthetic Stage 8 host');await inputLabel('Approved invitation message','Synthetic Stage 8 invitation.');
  await checkbox('I explicitly allow introductions');await checkbox('I approve the alias/message');await clickText('Create seven-day link');await wait("!!document.querySelector('input[readonly]')");
  const inviteURL=await evaluate("document.querySelector('input[readonly]').value");const invitePath=new URL(inviteURL).pathname;
  await send('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});await clickText('Copy link');await wait("document.body.textContent.includes('Link copied.')");assert.equal(await evaluate('navigator.clipboard.readText()'),inviteURL);
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined})");await clickText('Copy link');await wait("document.body.textContent.includes('Clipboard unavailable.')");assert.equal(await evaluate("document.activeElement===document.querySelector('input[readonly]')&&document.activeElement.selectionEnd===document.activeElement.value.length"),true);
  stage="newcomer separate actions";await choose(c);await go(invitePath);await wait("document.body.textContent.includes('Activate selected demo newcomer')");await checkbox('I confirm simulated activation');await clickText('Activate selected demo newcomer');await wait("document.body.textContent.includes('Demo persona activated.')");
  await inputLabel('Note','Synthetic newcomer asks to connect.');await checkbox('Send my chosen alias');await clickText('Send introduction');await wait("location.pathname==='/connect/requests'");
  await choose(a,'/connect/requests');await clickText('Accept');await wait("!Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Accept')");
  await choose(c);await go(invitePath);await wait("document.body.textContent.includes('Join circle voluntarily')");await clickText('Join circle voluntarily');await wait("document.body.textContent.includes('You joined this circle.')");await layout(375);await shot('08-invitation-mobile');await layout(1440);
  stage="revocation";await choose(a,'/connect/invite');await clickText('Revoke this link');await wait("document.body.textContent.includes('Revoked')");await choose(c);await go(invitePath);await wait("document.body.textContent.includes('Invitation unavailable')");assert.equal(await evaluate("!!document.querySelector('textarea')"),false);
  stage="blocking and keyboard";await choose(a,'/connect/messages');await go(chatPath);await wait("!!document.querySelector('textarea')");await clickText('Block or report Demo test s7_B');await wait("!!document.querySelector('[role=dialog]')");assert.equal(await evaluate("document.activeElement.textContent"),'Block this person');await key('Escape');await wait("!document.querySelector('[role=dialog]')");assert.equal(await evaluate("document.activeElement.textContent"),'Block or report Demo test s7_B');await key('Enter');await wait("!!document.querySelector('[role=dialog]')");await layout(375);await shot('09-safety-mobile');
  await evaluate("document.querySelector('[role=dialog] button').focus()");await key('Tab');assert.equal(await evaluate("document.activeElement.tagName"),'SELECT');await key('Tab');assert.equal(await evaluate("document.activeElement.tagName"),'TEXTAREA');
  await evaluate("Array.from(document.querySelector('[role=dialog]').querySelectorAll('button')).at(-1).focus()");await key('Tab');assert.equal(await evaluate("document.querySelector('[role=dialog]').contains(document.activeElement)"),true);await clickText('Block this person',"document.querySelector('[role=dialog]')");await wait("location.pathname==='/connect/profile'&&document.body.textContent.includes('Remove my block')");await go(chatPath);await wait("document.body.textContent.includes('Contact unavailable')");assert.equal((await api(`/api/connect/conversations/${conversation}/messages`)).status,404);
  assert.equal(exceptions.length,0);console.log('PASS Stage 8 Chrome: clicked opt-in/preview/save, filters/empty/clear, introduction, acceptance, A/B messaging/reload, C denial, circle join/members/leave, invitation creation/copy/fallback/activation/introduction/acceptance/join/revocation, block. Keyboard Tab, 375/1440 layout and persona isolation checked; zero JS exceptions. Synthetic schema only.');

 }finally{socket?.close();chrome.kill("SIGTERM");await Promise.race([once(chrome,"exit"),sleep(3000)]);if(chrome.exitCode===null)chrome.kill("SIGKILL");fs.rmSync(profile,{recursive:true,force:true});}
}
main().catch(error=>{if(error.code==='ERR_ASSERTION')console.error('Assertion failed (values withheld)');console.error(`Stage 8 browser check failed at ${stage}; response bodies, tokens and profile data omitted.`);process.exitCode=1;});
