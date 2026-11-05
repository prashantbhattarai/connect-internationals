"use client";
import { useEffect, useState } from "react";
export async function connectJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
 const response = await fetch(url, { ...init, cache: "no-store" });
 const result = await response.json();
 if (!response.ok) throw new Error(response.status === 401 ? "Choose a demo persona above to continue." : result.error ?? "Connect is unavailable. Please retry.");
 return result;
}
export function useConnectResource<T>(url: string) {
 const [data, setData] = useState<T | null>(null);
 const [error, setError] = useState("");
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  let controller = new AbortController();
  let disposed = false;
  let identity: string | undefined;
  function clear() { controller.abort(); setData(null); setError(""); }
  async function load() {
   clear(); controller = new AbortController(); const signal = controller.signal;
   try { const result = await connectJSON<T>(url, { signal }); if (!disposed && !signal.aborted) {
    const envelope = result as { viewerId?: string; profile?: { userId?: string } };
    identity = envelope.viewerId ?? envelope.profile?.userId; setData(result);
   } }
   catch (e) { if (!disposed && !signal.aborted) setError(e instanceof Error ? e.message : "Could not load Connect."); }
  }
  async function checkIdentity() {
   if (document.visibilityState !== "visible" || !identity || disposed) return;
   try {
    const result = await connectJSON<{ current: { userId: string } }>("/api/connect/persona");
    if (!disposed && result.current.userId !== identity) { clear(); window.location.reload(); }
   } catch { if (!disposed) { clear(); window.location.reload(); } }
  }
  function safetyStorage(event:StorageEvent){if(event.key==="connect:safety-reset"){clear();window.location.reload();}}
  function restored(event: PageTransitionEvent) { if (event.persisted) { clear(); window.location.reload(); } }
  window.addEventListener("connect:persona-changing", clear);
  window.addEventListener("connect:persona-settled", load);
  window.addEventListener("pageshow", restored);
  window.addEventListener("storage", safetyStorage);
  window.addEventListener("focus", checkIdentity);
  document.addEventListener("visibilitychange", checkIdentity);
  load();
  return () => { disposed = true; controller.abort(); window.removeEventListener("connect:persona-changing", clear); window.removeEventListener("connect:persona-settled", load); window.removeEventListener("pageshow", restored); window.removeEventListener("storage", safetyStorage); window.removeEventListener("focus", checkIdentity); document.removeEventListener("visibilitychange", checkIdentity); };
 }, [url, retry]);
 return { data, error, retry: () => setRetry(v => v + 1) };
}

export function resetAfterSafety(path="/connect/profile#safety"){
 try{window.localStorage.setItem("connect:safety-reset",String(Date.now()));}catch{}
 window.dispatchEvent(new Event("connect:persona-changing"));
 const destination=new URL(path,window.location.origin);
 if(destination.origin===window.location.origin&&destination.pathname===window.location.pathname&&destination.search===window.location.search){
  window.history.replaceState(null,"",destination.href);
  window.location.reload();
 }else window.location.replace(destination.href);
}
