"use client";
import { useDialogFocus } from "./useDialogFocus";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { purposeOptions } from "../../lib/connect/types";
import { connectJSON } from "./connectClient";
export default function IntroductionComposer({ viewerId, peer, close }: { viewerId: string; peer: {userId:string;alias:string}; close:()=>void }) {
 const [purpose,setPurpose] = useState<string>("friendship"), [note,setNote] = useState("");
 const [busy,setBusy] = useState(false), [error,setError] = useState("");
 const dialog = useDialogFocus(true, close, busy);
 const active = useRef<AbortController|null>(null);
 useEffect(()=>()=>active.current?.abort(),[]);
 async function send() {
  setBusy(true);setError(""); const controller=new AbortController();active.current=controller;
  try {
   await connectJSON("/api/connect/requests",{method:"POST",headers:{"Content-Type":"application/json","X-Connect-Identity":viewerId},body:JSON.stringify({recipientId:peer.userId,purpose,note}),signal:controller.signal});
   if(!controller.signal.aborted) window.location.assign("/connect/requests");
  } catch(e) {if(!controller.signal.aborted){setError(e instanceof Error?e.message:"Introduction failed.");setBusy(false);}}
 }
 return <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="intro-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-5"><form onSubmit={e=>{e.preventDefault();send();}} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><h2 id="intro-title" className="text-xl font-bold">Introduce yourself to {peer.alias}</h2><p className="mt-3 text-sm leading-6 text-slate-600">A short, purposeful introduction. Chat opens only after acceptance. Sending requires discovery opt-in.</p><fieldset disabled={busy} className="mt-4 space-y-4"><label className="block text-sm font-semibold">Purpose<select value={purpose} onChange={e=>setPurpose(e.target.value)} className="mt-2 w-full rounded border p-2">{purposeOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold">Your note<textarea required maxLength={300} rows={4} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 w-full rounded border p-2"/><span className="text-xs font-normal text-slate-500">{note.length}/300 characters</span></label><p className="text-xs text-slate-600">At most five new introductions per rolling 24 hours and 20 pending. Cancellation does not reset usage. Declined and cancelled pairs cannot be resent.</p><div className="flex gap-3"><button type="submit" className="rounded bg-teal-800 px-4 py-2 font-semibold text-white">{busy?"Sending…":"Send introduction"}</button><button type="button" onClick={close} className="rounded border px-4 py-2">Close</button></div></fieldset>{error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}<Link href="/connect/profile" className="mt-4 inline-block text-sm text-teal-800 underline">Manage discovery opt-in</Link></form></div>;
}
