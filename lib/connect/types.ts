export const demographicFields = ["nationality", "city", "university", "major"] as const;
export const tagFields = ["purposes", "interests", "lookingFor", "canHelpWith"] as const;
export const contentFields = ["alias", ...demographicFields, ...tagFields] as const;
export const visibilityFields = ["showNationality", "showCity", "showUniversity", "showMajor"] as const;
export const purposeOptions = ["friendship", "career preparation", "projects", "settling in"] as const;
export type Demographic = typeof demographicFields[number];
export type ContentField = typeof contentFields[number];
export type Provenance = "provided_seed" | "synthetic_demo" | "user_entered" | "unknown";
export type ProfileValues = {
 alias: string; nationality: string | null; city: string | null; university: string | null; major: string | null;
 purposes: string[]; interests: string[]; lookingFor: string[]; canHelpWith: string[];
 discoverable: boolean; showNationality: boolean; showCity: boolean; showUniversity: boolean; showMajor: boolean; nationalityPreference: boolean;
};
export type OwnerProfile = ProfileValues & { userId: string; version: string; provenance: Record<ContentField, Provenance>; consent: string };
export type Relationship = "none" | "incoming_pending" | "outgoing_pending" | "accepted" | "declined" | "cancelled" | "closed";
export type StrangerCard = {
 userId: string; alias: string; purposes: string[]; interests: string[]; lookingFor: string[]; canHelpWith: string[];
 demographics: Partial<Record<Demographic, string>>; provenance: Partial<Record<ContentField, Provenance>>;
 relationship: Relationship;
};
export type Recommendation = StrangerCard & { reasons: string[] };
export type ProfileResponse = { profile: OwnerProfile; preview: StrangerCard | null; previewNotice: string };
export type DiscoveryFilters = Partial<Record<Demographic | "interest" | "purpose", string>>;
export type DiscoveryResponse = {
 viewerId: string; items: StrangerCard[]; recommendations: Recommendation[]; page: number; pageSize: number; hasNext: boolean;
 notice: string; filters: DiscoveryFilters; options: Record<Demographic | "interest" | "purpose", string[]>;
};
