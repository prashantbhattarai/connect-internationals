import { Prisma } from "@prisma/client";
import { contentFields, demographicFields, DiscoveryResponse, OwnerProfile, ProfileResponse, StrangerCard } from "../../connect/types";
import { connectRepository, ConnectRepository, DiscoveryContext, ProfileRecord } from "../repositories/connectRepo";
import { ConnectError, parseDiscoveryQuery, parseProfilePatch, validUserId } from "./connectValidation";
import { fieldProvenance, generalizeCards, privacyCards, projectCard } from "./privacyService";
import { rankCards } from "./recommendationService";
const previewNotice = "Conservative stranger preview. Demographics appear only in groups of at least five; particular viewers may see fewer fields because of visibility and blocks. All consent here is simulated.";
const profileVersion = (profile: ProfileRecord) => `${profile.userId}:${profile.updatedAt.toISOString()}`;
function ownerDTO(profile: ProfileRecord): OwnerProfile {
 return {
  userId: profile.userId, alias: profile.alias, nationality: profile.nationality, city: profile.city, university: profile.university, major: profile.major,
  interests: [...profile.interests], purposes: [...profile.purposes], lookingFor: [...profile.lookingFor], canHelpWith: [...profile.canHelpWith],
  discoverable: profile.discoverable, showNationality: profile.showNationality, showCity: profile.showCity, showUniversity: profile.showUniversity, showMajor: profile.showMajor,
  nationalityPreference: profile.nationalityPreference, version: profileVersion(profile), provenance: fieldProvenance(profile),
  consent: profile.discoverable ? "Simulated demo opt-in; not evidence of real consent." : "Hidden from discovery. No discovery consent is assumed."
 };
}
function requireActor(context: DiscoveryContext): asserts context is DiscoveryContext & { actor: ProfileRecord } {
 if (!context.actor) throw new ConnectError(404, "Connect profile unavailable.");
}
function preview(context: DiscoveryContext, proposal: ProfileRecord) {
 if (!proposal.discoverable) return null;
 // Six including the owner allows for a stranger being excluded as self.
 return generalizeCards([...context.candidates.map(p => projectCard(p, proposal.userId)), projectCard(proposal, proposal.userId)], 6).find(p => p.userId === proposal.userId)!;
}
function profileResponse(context: DiscoveryContext, actor: ProfileRecord): ProfileResponse {
 return { profile: ownerDTO(actor), preview: preview(context, actor), previewNotice };
}
const equal = (a: unknown, b: unknown) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
export function createConnectService(repo: ConnectRepository = connectRepository) {
 async function contextFor(actorId: string) {
  validUserId(actorId);
  const context = await repo.loadContext(actorId); requireActor(context); return context;
 }
 async function proposalFor(actorId: string, input: unknown) {
  const { version, changes } = parseProfilePatch(input);
  const context = await contextFor(actorId);
  if (version !== profileVersion(context.actor)) throw new ConnectError(409, "Your profile changed. Reload before saving.");
  const provenance: Prisma.JsonObject = context.actor.provenance && typeof context.actor.provenance === "object" && !Array.isArray(context.actor.provenance) ? { ...context.actor.provenance } : {};
  for (const key of contentFields) if (key in changes && !equal(changes[key], context.actor[key])) provenance[key] = "user_entered";
  const proposal = { ...context.actor, ...changes, provenance };
  return { context, proposal, changes };
 }
 return {
  async ownProfile(actorId: string) { const context = await contextFor(actorId); return profileResponse(context, context.actor); },
  async previewProfile(actorId: string, input: unknown) {
   const { context, proposal } = await proposalFor(actorId, input);
   return { preview: preview(context, proposal), previewNotice };
  },
  async updateProfile(actorId: string, input: unknown) {
   const { context, proposal, changes } = await proposalFor(actorId, input);
   const data: Prisma.ConnectProfileUpdateManyMutationInput = { ...changes, provenance: proposal.provenance };
   if (changes.discoverable !== undefined && changes.discoverable !== context.actor.discoverable) {
    data.consentSource = changes.discoverable ? "simulated_user_choice" : "none";
    data.consentAt = changes.discoverable ? new Date() : null;
   }
   if (!await repo.updateProfile(actorId, context.actor.updatedAt, data)) throw new ConnectError(409, "Your profile changed. Reload before saving.");
   const updated = await contextFor(actorId); return profileResponse(updated, updated.actor);
  },
  async discover(actorId: string, params: URLSearchParams): Promise<DiscoveryResponse> {
   const { filters, page, pageSize } = parseDiscoveryQuery(params);
   const context = await contextFor(actorId);
   const visible = privacyCards(context);
   const options = Object.fromEntries([...demographicFields, "interest", "purpose"].map(key => [key, [...new Set(visible.flatMap(card => key === "interest" ? card.interests : key === "purpose" ? card.purposes : card.demographics[key as typeof demographicFields[number]] ? [card.demographics[key as typeof demographicFields[number]]!] : []))].sort()])) as DiscoveryResponse["options"];
   let filtered = visible.filter(card => Object.entries(filters).every(([key,value]) => {
    if (key === "interest") return card.interests.includes(value!);
    if (key === "purpose") return card.purposes.includes(value!);
    const actual = card.demographics[key as typeof demographicFields[number]];
    return actual !== undefined && actual.toLowerCase() === value!.toLowerCase();
   }));
   if (demographicFields.some(k => filters[k]) && filtered.length < 5) return { viewerId: actorId, items: [], recommendations: [], page, pageSize, hasNext: false, options, filters, notice: "No results can be shown for these demographic filters. Broaden or clear them; groups smaller than five are suppressed." };
   filtered = generalizeCards(filtered);
   const viewer = projectCard(context.actor, actorId);
   // A hidden viewer's demographics are not disclosed matching signals.
   if (!context.actor.discoverable) viewer.demographics = {};
   const safeViewer = generalizeCards([...visible, viewer]).find(c => c.userId === actorId)!;
   const recommendations = rankCards(safeViewer, filtered, context.actor.nationalityPreference);
   const start = (page - 1) * pageSize;
   return { viewerId: actorId, items: filtered.slice(start, start + pageSize), recommendations, page, pageSize, hasNext: start + pageSize < filtered.length, filters, options,
    notice: !filtered.length ? "No eligible profiles match these filters. Clear filters to browse more broadly." : !recommendations.length ? "Not enough shared information for explained suggestions. Browse people or add interests and purposes to your profile." : "Suggestions use shared, visible information and simulated demo fields; they are not verified compatibility." };
  },
  async profileById(actorId: string, targetId: string): Promise<StrangerCard> {
   validUserId(targetId); const context = await contextFor(actorId);
   const card = privacyCards(context).find(p => p.userId === targetId);
   if (!card) throw new ConnectError(404, "Profile unavailable.");
   return card;
  }
 };
}
export const connectService = createConnectService();
