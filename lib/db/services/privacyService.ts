import { contentFields, demographicFields, Demographic, Provenance, Relationship, StrangerCard } from "../../connect/types";
import type { ProfileRecord, DiscoveryContext } from "../repositories/connectRepo";
export const COHORT_MINIMUM = 5;
const visibility = { nationality: "showNationality", city: "showCity", university: "showUniversity", major: "showMajor" } as const;
export function fieldProvenance(profile: ProfileRecord) {
 const source = profile.provenance && typeof profile.provenance === "object" && !Array.isArray(profile.provenance) ? profile.provenance : {};
 return Object.fromEntries(contentFields.map(key => {
  const value = source[key];
  return [key, ["provided_seed", "synthetic_demo", "user_entered"].includes(String(value)) ? value : "unknown"];
 })) as Record<typeof contentFields[number], Provenance>;
}
function relationshipFor(actorId: string, userId: string, relationships: DiscoveryContext["relationships"]): Relationship {
 const record = relationships.find(r => r.senderId === userId || r.recipientId === userId);
 if (!record) return "none";
 if (record.state === "PENDING") return record.senderId === actorId ? "outgoing_pending" : "incoming_pending";
 return record.state.toLowerCase() as Relationship;
}
export function projectCard(profile: ProfileRecord, actorId: string, relationships: DiscoveryContext["relationships"] = []): StrangerCard {
 const demographics: Partial<Record<Demographic, string>> = {};
 for (const key of demographicFields) if (profile[visibility[key]] && profile[key]) demographics[key] = profile[key]!;
 const allProvenance = fieldProvenance(profile);
 const provenance = Object.fromEntries(["alias", "purposes", "interests", "lookingFor", "canHelpWith", ...Object.keys(demographics)].map(key => [key, allProvenance[key as keyof typeof allProvenance]]));
 return { userId: profile.userId, alias: profile.alias, purposes: [...profile.purposes], interests: [...profile.interests], lookingFor: [...profile.lookingFor], canHelpWith: [...profile.canHelpWith], demographics, provenance, relationship: relationshipFor(actorId, profile.userId, relationships) };
}
function combination(card: StrangerCard) {
 return JSON.stringify(demographicFields.map(k => card.demographics[k] ?? null));
}
// Reused after filtering as well as before it. A rare disclosed combination loses
// every demographic field; tags remain. Never replace a hidden value with a label.
export function generalizeCards(cards: StrangerCard[], minimum = COHORT_MINIMUM): StrangerCard[] {
 const counts = new Map<string, number>();
 for (const card of cards) counts.set(combination(card), (counts.get(combination(card)) ?? 0) + 1);
 return cards.map(card => {
  if ((counts.get(combination(card)) ?? 0) >= minimum) return card;
  const provenance = { ...card.provenance };
  for (const key of demographicFields) delete provenance[key];
  return { ...card, demographics: {}, provenance };
 });
}
export function privacyCards(context: DiscoveryContext) {
 return generalizeCards(context.candidates.map(p => projectCard(p, context.actor!.userId, context.relationships)));
}
