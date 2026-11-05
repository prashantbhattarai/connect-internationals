import { createHash } from "node:crypto";
import { importProfiles } from "../repositories/seedRepo";
export const cityAliases: Record<string, string> = {
 "nyc": "New York, NY", "new york city": "New York, NY",
 "new york city, ny": "New York, NY", "new york, ny": "New York, NY"
};
export function normalize(value: unknown): string | null {
 if (value == null) return null;
 if (typeof value !== "string") throw new Error("Invalid seed field type");
 const clean = value.trim().replace(/\s+/g, " ");
 return !clean || /prefer.*(?:not|say)|withheld|^(?:unknown|n\/a|null|not specified)$/i.test(clean) ? null : clean;
}
export function normalizeCity(value: unknown) { const clean = normalize(value); return clean ? cityAliases[clean.toLowerCase()] ?? clean : null; }
export function prepareSeed(input: unknown) {
 if (!Array.isArray(input) || input.length !== 925) throw new Error("Expected exactly 925 seed records");
 const ids = new Set<string>(), emails = new Set<string>();
 for (const row of input) {
  if (!row || typeof row !== "object" || typeof row.id !== "string" || !/^seed_[a-zA-Z0-9_-]{1,100}$/.test(row.id) || typeof row.email !== "string" || !/^[^@]+@example\.test$/.test(row.email) || ids.has(row.id) || emails.has(row.email)) throw new Error("Seed validation failed (identity uniqueness or format)");
  if (typeof row.displayName !== "string" || !Array.isArray(row.targetRoles) || row.targetRoles.some((v: unknown) => typeof v !== "string")) throw new Error("Seed validation failed (profile fields)");
  ids.add(row.id); emails.add(row.email);
 }
 return [...input].sort((a,b) => a.id.localeCompare(b.id)).map((row, index) => {
  const hash = createHash("sha256").update(row.id).digest().readUInt32BE(0);
  const reserved = index < 3;
  const pick = (values: string[]) => values[hash % values.length];
  const provided = ["alias", "nationality", "city", "targetRoles"];
  const synthetic = ["university", "major", "interests", "purposes", "lookingFor", "canHelpWith"];
  return {
   userId: row.id, alias: `Demo ${String(index + 1).padStart(3, "0")}${reserved ? " · newcomer" : ""}`, demoOrdinal: index + 1,
   nationality: normalize(row.nationality), city: normalizeCity(row.city), targetRoles: row.targetRoles as string[],
   university: reserved ? null : pick(["Demo Lakeside University", "Demo City University", "Demo North Campus"]),
   major: reserved ? null : pick(["Computer Science", "Business", "Data Science", "Design"]),
   interests: reserved ? [] : [pick(["hiking", "cooking", "board games", "photography"])],
   purposes: reserved ? [] : [pick(["friendship", "career preparation", "projects", "settling in"])],
   lookingFor: reserved ? [] : [pick(["interview practice", "city tips", "project partner"])],
   canHelpWith: reserved ? [] : [pick(["city tips", "project partner", "interview practice"])],
   provenance: Object.fromEntries([...provided.map(k => [k, k === "alias" ? "synthetic_demo" : "provided_seed"]), ...synthetic.map(k => [k, "synthetic_demo"])]),
   discoverable: !reserved && hash % 3 === 0, consentSource: !reserved && hash % 3 === 0 ? "simulated_demo" : "none", consentAt: !reserved && hash % 3 === 0 ? new Date("2026-11-03T00:00:00Z") : null
  };
 });
}
export async function seedRecords(input: unknown) { return importProfiles(prepareSeed(input)); }
