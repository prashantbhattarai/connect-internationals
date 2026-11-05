"use client";
import SafetySettings from "./SafetySettings";
import { useRef, useState, useEffect } from "react";
import { contentFields, ContentField, demographicFields, OwnerProfile, ProfileResponse, ProfileValues, purposeOptions, tagFields, visibilityFields } from "../../lib/connect/types";
import { connectJSON, useConnectResource } from "./connectClient";
import StrangerCardView, { provenanceLabel } from "./StrangerCard";
const labels = { alias: "Chosen alias", nationality: "Nationality", city: "City", university: "University", major: "Major", purposes: "Connection purposes", interests: "Interests / hobbies", lookingFor: "Looking for", canHelpWith: "Can help with" };
function editValues(profile: OwnerProfile): ProfileValues {
 return Object.fromEntries([...contentFields, ...visibilityFields, "discoverable", "nationalityPreference"].map(k => [k, profile[k as keyof OwnerProfile]])) as ProfileValues;
}
function ProfileForm({ initial }: { initial: ProfileResponse }) {
 const [draft, setDraft] = useState<ProfileValues>(() => editValues(initial.profile));
 const [tagText, setTagText] = useState(() => Object.fromEntries(tagFields.filter(k => k !== "purposes").map(k => [k, draft[k].join(", ")])) as Record<"interests" | "lookingFor" | "canHelpWith", string>);
 const [preview, setPreview] = useState(initial.preview);
 const [previewNotice, setPreviewNotice] = useState(initial.previewNotice);
 const [previewed, setPreviewed] = useState("");
 const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 const active = useRef<AbortController | null>(null);
 useEffect(() => () => active.current?.abort(), []);
 function change<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) { setDraft(d => ({ ...d, [key]: value })); setPreviewed(""); setPreview(null); setError(""); }
 function sourceLabel(key: ContentField) {
  const value = key === "interests" || key === "lookingFor" || key === "canHelpWith" ? tagText[key].split(",").map(v => v.trim()).filter(Boolean) : draft[key];
  const source = provenanceLabel(initial.profile.provenance[key]);
  return JSON.stringify(value) === JSON.stringify(initial.profile[key]) ? source : `Unsaved draft (was ${source.toLowerCase()})`;
 }
 const payload = { version: initial.profile.version, ...draft, ...Object.fromEntries(Object.entries(tagText).map(([key,value]) => [key, value.split(",").map(v => v.trim()).filter(Boolean)])) };
 const signature = JSON.stringify(payload);
 async function previewChanges() {
  setBusy(true); setError(""); active.current?.abort(); const controller = new AbortController(); active.current = controller;
  try {
   const result = await connectJSON<Pick<ProfileResponse,"preview" | "previewNotice">>("/api/connect/profile/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: signature, signal: controller.signal });
   if (!controller.signal.aborted) { setPreview(result.preview); setPreviewNotice(result.previewNotice); setPreviewed(signature); }
  } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Preview failed."); }
  finally { if (!controller.signal.aborted) setBusy(false); }
 }
 async function save() {
  if (previewed !== signature) return;
  setBusy(true); setError(""); const controller = new AbortController(); active.current = controller;
  try {
   await connectJSON<ProfileResponse>("/api/connect/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: signature, signal: controller.signal });
   if (!controller.signal.aborted) window.location.replace("/connect/profile?saved=1");
  } catch (e) { if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : "Save failed."); setBusy(false); } }
 }
 return <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
  <form onSubmit={e => { e.preventDefault(); previewChanges(); }} className="rounded-2xl border border-stone-200 bg-white p-6">
   <h2 className="text-2xl font-bold">Your Connect profile</h2><p className="mt-2 text-sm leading-6 text-slate-600">An alias, interests and shared purposes are enough to get started. All fields in this local demo use simulated identities. Editing a field marks only that field as user entered.</p>
   <fieldset disabled={busy} className="mt-5 space-y-5">
    <label className="block text-sm font-semibold">{labels.alias} <span className="text-xs font-normal text-slate-500">· {sourceLabel("alias")}</span><input required maxLength={60} value={draft.alias} onChange={e => change("alias", e.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 p-2" /></label>
    <fieldset><legend className="text-sm font-semibold">Connection purposes · {sourceLabel("purposes")}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{purposeOptions.map(purpose => <label key={purpose} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={draft.purposes.includes(purpose)} onChange={e => change("purposes", e.target.checked ? [...draft.purposes, purpose] : draft.purposes.filter(p => p !== purpose))} />{purpose}</label>)}</div></fieldset>
    {(["interests", "lookingFor", "canHelpWith"] as const).map(key => <label key={key} className="block text-sm font-semibold">{labels[key]} <span className="text-xs font-normal text-slate-500">· {sourceLabel(key)}</span><input value={tagText[key]} onChange={e => { setTagText(t => ({ ...t, [key]: e.target.value })); setPreviewed(""); setPreview(null); }} className="mt-2 w-full rounded-lg border border-stone-300 p-2" /><span className="mt-1 block text-xs font-normal text-slate-500">Comma-separated; up to 10 tags, 40 characters each. Optional.</span></label>)}
    <div className="border-t border-stone-200 pt-5"><h3 className="font-semibold">Optional background</h3><p className="mt-1 text-sm text-slate-600">Sharing each field is optional. Small demographic groups remain hidden even when you enable sharing.</p></div>
    {demographicFields.map((key,index) => <div key={key}><label className="block text-sm font-semibold">{labels[key]} <span className="text-xs font-normal text-slate-500">· {sourceLabel(key)}</span><input maxLength={100} value={draft[key] ?? ""} onChange={e => change(key, e.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 p-2" /></label><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={draft[visibilityFields[index]]} onChange={e => change(visibilityFields[index], e.target.checked)} />Allow this field in discovery</label></div>)}
    <div className="rounded-xl bg-teal-50 p-4"><label className="flex items-start gap-3 text-sm font-semibold"><input className="mt-1" type="checkbox" checked={draft.discoverable} onChange={e => change("discoverable", e.target.checked)} />Opt into discovery for this simulated persona</label><p className="mt-2 text-xs leading-6 text-slate-700">When enabled, eligible signed-in personas can see your alias, purposes, interests, needs and offers. Background fields require their own sharing choices and privacy checks. Turning this off hides your profile. This is simulated permission, never real consent.</p></div>
    <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={draft.nationalityPreference} onChange={e => change("nationalityPreference", e.target.checked)} />Use shared disclosed nationality as a small ranking signal (off by default).</label>
    <p className="text-xs text-slate-500">{initial.profile.consent}</p>
    <button type="submit" className="rounded-lg bg-teal-800 px-4 py-3 font-semibold text-white">{busy ? "Working…" : "Preview changes"}</button>
   </fieldset>
   {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
   <button type="button" disabled={busy || previewed !== signature} onClick={save} className="mt-4 rounded-lg border border-teal-800 px-4 py-3 font-semibold text-teal-900 disabled:opacity-40">Save reviewed profile</button>
  </form>
  <section aria-live="polite" className="space-y-4"><h2 className="text-xl font-bold">Stranger-visible preview</h2><p className="text-sm leading-6 text-slate-600">{previewNotice}</p>{preview ? <StrangerCardView card={preview} /> : <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-slate-600">{previewed === signature || !draft.discoverable ? "Your profile is hidden from discovery." : "Preview your latest changes before saving."}</div>}<p className="text-xs leading-6 text-slate-500">Synthetic demo fields are labelled. Empty or withheld background values are unknown, never matching signals. Visibility can vary by viewer; this heuristic does not guarantee anonymity.</p></section>
 </div>;
}
export default function ProfileEditor() {
 const [saved, setSaved] = useState(false);
 useEffect(() => { setSaved(new URLSearchParams(window.location.search).get("saved") === "1"); }, []);
 const { data, error, retry } = useConnectResource<ProfileResponse>("/api/connect/profile");
 if (error) return <div role="alert" className="mt-8 rounded-xl bg-white p-6"><p>{error}</p><button onClick={retry} className="mt-3 underline">Retry</button></div>;
 if (!data) return <p role="status" className="mt-8">Loading your profile…</p>;
 return <>{saved && <p role="status" className="mt-6 rounded-xl bg-teal-50 p-4 text-sm text-teal-950">Profile saved for this demo persona.</p>}<ProfileForm key={data.profile.userId} initial={data} /><SafetySettings key={`safety:${data.profile.userId}`} viewerId={data.profile.userId}/></>;
}
