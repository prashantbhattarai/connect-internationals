import { contentFields, demographicFields, ProfileValues, purposeOptions, tagFields, visibilityFields, DiscoveryFilters } from "../../connect/types";
import { normalize, normalizeCity } from "./seedService";
export class ConnectError extends Error {
 constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function validUserId(value: string) {
 if (!/^[A-Za-z0-9_-]{1,105}$/.test(value)) throw new ConnectError(404, "Profile unavailable.");
 return value;
}
const cleanText = (value: unknown, max: number) => {
 if (typeof value !== "string" || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new ConnectError(400, `Text must be at most ${max} characters, without control characters.`);
 return value.trim().replace(/\s+/g, " ");
};
export function parseProfilePatch(input: unknown): { version: string; changes: Partial<ProfileValues> } {
 if (!input || typeof input !== "object" || Array.isArray(input)) throw new ConnectError(400, "Expected profile changes.");
 const record = input as Record<string, unknown>;
 const allowed: string[] = ["version", ...contentFields, ...visibilityFields, "discoverable", "nationalityPreference"];
 if (Object.keys(record).some(k => !allowed.includes(k))) throw new ConnectError(400, "Unknown profile field.");
 if (typeof record.version !== "string" || !/^[A-Za-z0-9_-]{1,105}:\d{4}-\d{2}-\d{2}T.*Z$/.test(record.version) || !Number.isFinite(Date.parse(record.version.slice(record.version.indexOf(":") + 1)))) throw new ConnectError(400, "A current profile version is required.");
 const changes: Partial<ProfileValues> = {};
 if ("alias" in record) { const alias = cleanText(record.alias, 60); if (!alias) throw new ConnectError(400, "Choose an alias."); changes.alias = alias; }
 for (const key of demographicFields) if (key in record) {
  const value = record[key] === null ? null : cleanText(record[key], 100);
  changes[key] = key === "city" ? normalizeCity(value) : normalize(value);
 }
 for (const key of tagFields) if (key in record) {
  const values = record[key];
  if (!Array.isArray(values) || values.length > 10) throw new ConnectError(400, "Use at most 10 tags per field.");
  const tags = [...new Set(values.map(v => cleanText(v, 40).toLowerCase()).filter(Boolean))].sort();
  if (key === "purposes" && tags.some(v => !(purposeOptions as readonly string[]).includes(v))) throw new ConnectError(400, "Choose a supported connection purpose.");
  changes[key] = tags;
 }
 for (const key of [...visibilityFields, "discoverable", "nationalityPreference"] as const) if (key in record) {
  if (typeof record[key] !== "boolean") throw new ConnectError(400, "Visibility settings must be true or false.");
  changes[key] = record[key] as boolean;
 }
 return { version: record.version, changes };
}
export function parseDiscoveryQuery(params: URLSearchParams) {
 const allowed = ["nationality", "city", "university", "major", "interest", "purpose", "page", "pageSize"];
 for (const key of params.keys()) if (!allowed.includes(key) || params.getAll(key).length > 1) throw new ConnectError(400, "Unknown or repeated discovery filter.");
 const integer = (key: string, fallback: number, max: number) => {
  const raw = params.get(key); if (raw === null) return fallback;
  if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max) throw new ConnectError(400, `Invalid ${key}.`);
  return Number(raw);
 };
 const filters: DiscoveryFilters = {};
 for (const key of [...demographicFields, "interest", "purpose"] as const) {
  if (!params.has(key)) continue;
  const text = cleanText(params.get(key), 100);
  if (!text) continue;
  const normalized = key === "city" ? normalizeCity(text) : normalize(text);
  if (normalized === null) throw new ConnectError(400, "Unknown or withheld answers cannot be used as filters.");
  filters[key] = key === "interest" || key === "purpose" ? normalized.toLowerCase() : normalized;
 }
 return { filters, page: integer("page", 1, 100), pageSize: integer("pageSize", 12, 20) };
}
