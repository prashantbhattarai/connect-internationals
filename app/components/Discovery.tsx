"use client";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { demographicFields, DiscoveryFilters, DiscoveryResponse, StrangerCard } from "../../lib/connect/types";
import { connectJSON, useConnectResource } from "./connectClient";
import IntroductionComposer from "./IntroductionComposer";
import StrangerCardView from "./StrangerCard";
function DiscoveryResults({ data }: { data: DiscoveryResponse }) {
 const [intro,setIntro] = useState<StrangerCard|null>(null);
 const [detail, setDetail] = useState<StrangerCard | null>(null);
 const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => controller.current?.abort(), []);
 async function view(userId: string) {
  controller.current?.abort(); const active = new AbortController(); controller.current = active;
  setDetail(null); setError(""); setLoading(true);
  try { const result = await connectJSON<StrangerCard>(`/api/connect/profiles/${encodeURIComponent(userId)}`, { signal: active.signal }); if (!active.signal.aborted) setDetail(result); }
  catch (e) { if (!active.signal.aborted) setError(e instanceof Error ? e.message : "Profile unavailable."); }
  finally { if (!active.signal.aborted) setLoading(false); }
 }
 return <div className="space-y-10">
  <p role="status" className="rounded-xl bg-teal-50 p-4 text-sm leading-6 text-teal-950">{data.notice}</p>
  <section aria-labelledby="suggestions"><h2 id="suggestions" className="text-2xl font-bold">Suggestions for you</h2><p className="mt-2 text-sm text-slate-600">Up to five people, with reasons from visible information. Synthetic fields are labelled. Nationality is not a default ranking preference.</p>{data.recommendations.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.recommendations.map(card => <StrangerCardView key={card.userId} card={card} viewerId={data.viewerId} reasons={card.reasons} onView={() => view(card.userId)} onIntroduce={()=>setIntro(card)} />)}</div> : <p className="mt-5 rounded-xl border border-dashed border-stone-300 p-5 text-sm">No explained suggestions for this profile and these filters. <Link href="/connect/profile" className="font-semibold text-teal-800 underline">Add interests or purposes</Link>, or browse below. Filters stay in effect until you change them.</p>}</section>
  <section aria-labelledby="browse"><h2 id="browse" className="text-2xl font-bold">Browse eligible people</h2>{data.items.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map(card => <StrangerCardView key={card.userId} card={card} viewerId={data.viewerId} onView={() => view(card.userId)} onIntroduce={()=>setIntro(card)} />)}</div> : <p className="mt-5 text-sm text-slate-600">No profiles can be shown on this page. Clear filters or return to the previous page.</p>}</section>
  {(loading || error || detail) && <section aria-live="polite" aria-label="Selected profile" className="rounded-2xl bg-stone-100 p-5"><h2 className="mb-4 text-xl font-bold">Selected profile</h2>{loading && <p role="status">Loading profile…</p>}{error && <p role="alert">{error}</p>}{detail && <StrangerCardView card={detail} viewerId={data.viewerId} />}<button className="mt-3 text-sm underline" onClick={() => { controller.current?.abort(); setDetail(null); setError(""); setLoading(false); }}>Close profile</button></section>}
  {intro && <IntroductionComposer viewerId={data.viewerId} peer={intro} close={()=>setIntro(null)}/>}
  <p className="text-xs text-slate-500">Pending or existing relationships are labelled. Manage introductions in Requests; accepted conversations open in Messages.</p>
 </div>;
}
export default function Discovery() {
 const [draft, setDraft] = useState<DiscoveryFilters>({});
 const [applied, setApplied] = useState<DiscoveryFilters>({});
 const [page, setPage] = useState(1);
 const params = new URLSearchParams({ page: String(page), pageSize: "12" });
 for (const [key,value] of Object.entries(applied)) if (value) params.set(key, value);
 const { data, error, retry } = useConnectResource<DiscoveryResponse>(`/api/connect/discovery?${params}`);
 function apply(event: FormEvent) { event.preventDefault(); setPage(1); setApplied({ ...draft }); }
 return <div className="mt-8 space-y-8">
  <form onSubmit={apply} className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-bold">Find people through shared interests</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{([...demographicFields, "interest", "purpose"] as const).map(key => <label key={key} className="block text-sm capitalize">{key}<input list={`filter-${key}`} value={draft[key] ?? ""} maxLength={100} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="mt-2 w-full rounded-lg border border-stone-300 p-2" placeholder={data?.options[key].length ? "Any, or choose a visible value" : "Any · no disclosed options yet"} /><datalist id={`filter-${key}`}>{data?.options[key].map(value => <option key={value} value={value} />)}</datalist></label>)}</div><div className="mt-5 flex flex-wrap gap-3"><button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 font-semibold text-white">Apply filters</button><button type="button" className="rounded-lg border border-stone-300 px-4 py-2" onClick={() => { setDraft({}); setApplied({}); setPage(1); }}>Clear filters</button><Link href="/connect/profile" className="px-2 py-2 font-semibold text-teal-800 underline">Edit profile & visibility</Link></div><p className="mt-4 text-xs leading-6 text-slate-500">Filters are exact and stay applied. Only disclosed background values appear as options. Demographic groups smaller than five are suppressed; no precise cohort counts are displayed.</p>{Object.values(applied).some(Boolean) && <p className="mt-3 text-sm font-semibold">Applied: {Object.entries(applied).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(" · ")}</p>}</form>
  {error ? <div role="alert" className="rounded-xl bg-white p-6"><p>{error}</p><button className="mt-3 underline" onClick={retry}>Retry</button></div> : !data ? <p role="status">Loading people for the current persona…</p> : <><DiscoveryResults key={`${data.viewerId}:${params}`} data={data} /><nav aria-label="Discovery pages" className="flex items-center gap-4"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-stone-300 px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {data.page}</span><button disabled={!data.hasNext || page === 100} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-stone-300 px-4 py-2 disabled:opacity-40">Next</button></nav></>}
 </div>;
}
