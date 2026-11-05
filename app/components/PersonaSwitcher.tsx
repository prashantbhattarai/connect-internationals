"use client";
import { useEffect, useState } from "react";
type Persona = { userId: string; alias: string };
export default function PersonaSwitcher({newcomersOnly=false}:{newcomersOnly?:boolean}) {
 const [personas, setPersonas] = useState<Persona[]>([]);
 const [current, setCurrent] = useState("");
 const [error, setError] = useState("");
 const [busy, setBusy] = useState(false);
 useEffect(() => {
  const controller = new AbortController();
  Promise.all([fetch(newcomersOnly?"/api/connect/newcomers":"/api/connect/personas", { cache: "no-store", signal: controller.signal }), fetch("/api/connect/persona", { cache: "no-store", signal: controller.signal })]).then(async ([options, identity]) => {
   if (!options.ok) throw new Error("Demo personas unavailable. Check DEMO_MODE and database setup.");
   setPersonas((await options.json()).personas);
   if (identity.ok) setCurrent((await identity.json()).current.userId);
   else if (identity.status !== 401) throw new Error("Current identity unavailable.");
  }).catch(e => { if (e.name !== "AbortError") setError(e.message); });
  return () => controller.abort();
 }, [newcomersOnly]);
 async function switchPersona(userId: string) {
  if (!userId) return;
  setBusy(true); setError("");
  window.dispatchEvent(new Event("connect:persona-changing"));
  try {
   const response = await fetch("/api/connect/persona", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }), cache: "no-store" });
   if (!response.ok) throw new Error((await response.json()).error);
   // Full navigation clears component state, active polling and personalized caches.
   window.location.replace(window.location.pathname);
  } catch (e) { setError(e instanceof Error ? e.message : "Switch failed."); setBusy(false); window.dispatchEvent(new Event("connect:persona-settled")); }
 }
 return <div className="mt-5 max-w-lg rounded-xl border border-stone-200 bg-white p-4"><label htmlFor="persona" className="block text-sm font-semibold">{newcomersOnly?"Choose a reserved demo newcomer":"Logged in as · simulated demo identity"}</label><select id="persona" className="mt-2 w-full rounded border border-stone-300 p-2" value={current} disabled={busy || !personas.length} onChange={e => switchPersona(e.target.value)}><option value="">Choose a demo persona</option>{personas.map(p => <option key={p.userId} value={p.userId}>{p.alias}</option>)}</select><p className="mt-2 text-xs text-slate-600">Academics, interests and consent are simulated. This is not real login.</p>{error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}</div>;
}
