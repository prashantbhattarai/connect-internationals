"use client";
import PlainText from "./PlainText";
import SafetyActions from "./SafetyActions";
import { useEffect, useRef, useState } from "react";
import { ConversationsResponse, MessagesResponse } from "../../lib/connect/contactTypes";
import { connectJSON, useConnectResource } from "./connectClient";
function ActiveChat({viewerId,conversationId}:{viewerId:string;conversationId:string}) {
 const [before,setBefore]=useState<string|null>(null),[revision,setRevision]=useState(0);
 const [history,setHistory]=useState<MessagesResponse|null>(null),[error,setError]=useState("");
 const [text,setText]=useState(""),[sending,setSending]=useState(false),[sendError,setSendError]=useState("");
 const sendingController=useRef<AbortController|null>(null);
 useEffect(()=>{
  let disposed=false;let timer:ReturnType<typeof setTimeout>|undefined;let controller:AbortController|undefined;
  setHistory(null);setError("");
  function stop(){disposed=true;clearTimeout(timer);controller?.abort();sendingController.current?.abort();setHistory(null);}
  async function poll(){
   controller=new AbortController();
   try{const query=new URLSearchParams({limit:"20"});if(before)query.set("before",before);
    const result=await connectJSON<MessagesResponse>(`/api/connect/conversations/${conversationId}/messages?${query}`,{signal:controller.signal});
    if(disposed)return;if(result.viewerId!==viewerId){stop();window.location.reload();return;}
    setHistory(result);setError("");timer=setTimeout(poll,5000);
   }catch(e){if(!disposed){setHistory(null);setError(e instanceof Error?e.message:"Conversation unavailable.");}}
  }
  window.addEventListener("connect:persona-changing",stop);poll();
  return()=>{disposed=true;clearTimeout(timer);controller?.abort();sendingController.current?.abort();window.removeEventListener("connect:persona-changing",stop);};
 },[viewerId,conversationId,before,revision]);
 async function send(){setSending(true);setSendError("");const controller=new AbortController();sendingController.current=controller;
  try{await connectJSON(`/api/connect/conversations/${conversationId}/messages`,{method:"POST",headers:{"Content-Type":"application/json","X-Connect-Identity":viewerId},body:JSON.stringify({text}),signal:controller.signal});if(!controller.signal.aborted){setText("");setBefore(null);setRevision(r=>r+1);setSending(false);}}
  catch(e){if(!controller.signal.aborted){setSendError(e instanceof Error?e.message:"Message failed.");setSending(false);}}
 }
 return <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-xl font-bold">{history?`Conversation with ${history.peer.alias}`:"Active conversation"}</h2>{history&&<SafetyActions viewerId={viewerId} targetId={history.peer.userId} label={history.peer.alias}/>}<p className="mt-2 text-xs leading-6 text-slate-500">Only this conversation is polled, about every five seconds. Showing a bounded page in chronological order. When browsing older history, choose Latest to see new messages.</p>{error?<div role="alert" className="mt-5 text-sm text-red-800">{error}<button className="ml-3 underline" onClick={()=>setRevision(r=>r+1)}>Retry</button></div>:!history?<p role="status" className="mt-5">Checking access and loading messages…</p>:<><div className="mt-4 flex gap-3"><button disabled={!history.hasOlder} onClick={()=>setBefore(history.nextBefore)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Older messages</button><button disabled={!before} onClick={()=>setBefore(null)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Latest</button></div><ol aria-label="Message history" className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto">{history.items.map(message=><li key={message.id} className={`rounded-xl p-4 ${message.sender==="you"?"bg-teal-50":"bg-stone-100"}`}><p className="text-xs font-semibold">{message.sender==="you"?"You":history.peer.alias} · {new Date(message.createdAt).toLocaleString()}</p><PlainText text={message.text}/></li>)}</ol>{!history.items.length&&<p className="my-5 text-sm text-slate-600">No messages yet. Your introduction was accepted; say hello.</p>}<form className="mt-5" onSubmit={e=>{e.preventDefault();send();}}><label className="block text-sm font-semibold">Message<textarea required maxLength={2000} rows={3} disabled={sending} value={text} onChange={e=>setText(e.target.value)} className="mt-2 w-full rounded border p-3"/></label><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{text.length}/2,000 · limit 30 messages per rolling minute</span><button disabled={sending||!text.trim()} type="submit" className="rounded bg-teal-800 px-4 py-2 font-semibold text-white disabled:opacity-40">{sending?"Sending…":"Send"}</button></div>{sendError&&<p role="alert" className="mt-3 text-sm text-red-800">{sendError}</p>}</form></>}</section>;
}
function ConversationWorkspace({data}:{data:ConversationsResponse}){
 const [active,setActive]=useState<string|null>(null);
 useEffect(()=>{setActive(new URLSearchParams(window.location.search).get("conversation"));},[]);
 return <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]"><aside className="rounded-xl border border-stone-200 bg-white p-4"><h2 className="font-bold">Accepted conversations</h2><ul className="mt-4 space-y-2">{data.items.map(item=><li key={item.id}><button onClick={()=>{setActive(item.id);window.history.replaceState(null,"",`/connect/messages?conversation=${item.id}`);}} aria-pressed={active===item.id} className={`w-full rounded-lg p-3 text-left ${active===item.id?"bg-teal-50":"hover:bg-stone-100"}`}><span className="block font-semibold">{item.peer.alias}</span><span className="mt-1 block text-xs text-slate-500">{item.lastMessageAt?`Last message: ${new Date(item.lastMessageAt).toLocaleString()}`:"Accepted · no messages yet"}</span></button></li>)}</ul>{!data.items.length&&<p className="mt-4 text-sm text-slate-600">No accepted conversations on this page.</p>}</aside>{active?<ActiveChat key={`${data.viewerId}:${active}`} viewerId={data.viewerId} conversationId={active}/>:<p className="rounded-xl border border-dashed p-6 text-sm text-slate-600">Choose an accepted conversation. No messages are polled until one is open.</p>}</div>;
}
export default function Messages(){const[page,setPage]=useState(1);const{data,error,retry}=useConnectResource<ConversationsResponse>(`/api/connect/conversations?page=${page}`);
 return <section className="mt-8 space-y-6"><button onClick={retry} className="rounded border px-4 py-2 text-sm">Refresh conversations</button>{error?<div role="alert">{error}<button onClick={retry} className="ml-3 underline">Retry</button></div>:!data?<p role="status">Loading accepted conversations…</p>:<><ConversationWorkspace key={`${data.viewerId}:${page}`} data={data}/><nav aria-label="Conversation pages" className="flex items-center gap-4"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded border px-4 py-2 disabled:opacity-40">Previous</button><span>Page {data.page}</span><button disabled={!data.hasNext||page===100} onClick={()=>setPage(p=>p+1)} className="rounded border px-4 py-2 disabled:opacity-40">Next</button></nav></>}</section>;
}
