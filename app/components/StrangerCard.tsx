import SafetyActions from "./SafetyActions";
import { StrangerCard } from "../../lib/connect/types";
export function provenanceLabel(value: string | undefined) {
 return value === "synthetic_demo" ? "Simulated demo" : value === "user_entered" ? "User entered" : value === "provided_seed" ? "Provided seed" : "Source unknown";
}
export default function StrangerCardView({ card, reasons, onView, onIntroduce, viewerId }: { card: StrangerCard; reasons?: string[]; onView?: () => void; onIntroduce?: () => void; viewerId?: string }) {
 return <article className="rounded-2xl border border-stone-200 bg-white p-5">
  <h3 className="text-xl font-bold">{card.alias}</h3><p className="mt-1 text-xs text-slate-500">Alias · {provenanceLabel(card.provenance.alias)}</p>
  {([ ["purposes", "Connection purposes"], ["interests", "Interests"], ["lookingFor", "Looking for"], ["canHelpWith", "Can help with"] ] as const).map(([key,label]) => card[key].length ? <div key={key} className="mt-4"><p className="text-xs font-semibold text-slate-600">{label} · {provenanceLabel(card.provenance[key])}</p><p className="mt-1 text-sm leading-6">{card[key].join(" · ")}</p></div> : null)}
  <dl className="mt-4 space-y-1 text-sm">{Object.entries(card.demographics).map(([key,value]) => <div key={key}><dt className="inline capitalize text-slate-500">{key}: </dt><dd className="inline">{value} <span className="text-xs text-slate-500">({provenanceLabel(card.provenance[key as keyof typeof card.provenance])})</span></dd></div>)}</dl>
  {!Object.keys(card.demographics).length && <p className="mt-4 text-xs text-slate-500">Demographics are not disclosed in this view.</p>}
  {reasons?.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-teal-900">{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul> : null}
  <p className="mt-4 text-xs text-slate-600">Relationship: {card.relationship.replaceAll("_", " ")}</p>
  {onView && <button className="mt-4 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-900" onClick={onView}>View profile</button>}
  {onIntroduce && card.relationship === "none" && <button className="ml-2 mt-4 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white" onClick={onIntroduce}>Introduce yourself</button>}
  {viewerId&&viewerId!==card.userId&&<SafetyActions viewerId={viewerId} targetId={card.userId} label={card.alias}/>}
 </article>;
}
