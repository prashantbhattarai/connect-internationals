import { purposeOptions } from "../../connect/types";
import { ConnectError, validUserId } from "./connectValidation";
export function contactObject(input: unknown, keys: string[]) {
 if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(k=>!keys.includes(k))) throw new ConnectError(400,"Invalid contact fields.");
 return input as Record<string,unknown>;
}
export function contactText(value: unknown, max: number) {
 if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new ConnectError(400,`Use 1–${max} characters without control characters.`);
 return value.trim();
}
export function introductionInput(input: unknown) {
 const body = contactObject(input,["recipientId","purpose","note"]);
 if (typeof body.recipientId !== "string") throw new ConnectError(400,"Choose a recipient.");
 validUserId(body.recipientId);
 if (typeof body.purpose !== "string" || !(purposeOptions as readonly string[]).includes(body.purpose)) throw new ConnectError(400,"Choose a connection purpose.");
 return { recipientId: body.recipientId, purpose: body.purpose, note: contactText(body.note,300) };
}
export function transitionInput(input: unknown) {
 const body = contactObject(input,["action"]);
 if (body.action !== "accept" && body.action !== "decline" && body.action !== "cancel") throw new ConnectError(400,"Choose accept, decline or cancel.");
 return body.action;
}
export function messageInput(input: unknown) { return contactText(contactObject(input,["text"]).text,2000); }
export function contactId(value: string) {
 if (!/^[A-Za-z0-9_-]{1,105}$/.test(value)) throw new ConnectError(404,"Contact unavailable."); return value;
}
export function contactQuery(params: URLSearchParams, messages = false) {
 const allowed = messages ? ["before","limit"] : ["page"];
 for (const key of params.keys()) if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new ConnectError(400,"Invalid contact query.");
 const key = messages ? "limit" : "page", raw = params.get(key) ?? (messages ? "20" : "1");
 if (!/^[1-9]\d*$/.test(raw) || Number(raw) > (messages ? 50 : 100)) throw new ConnectError(400,"Invalid contact page size or page.");
 const before = params.get("before"); if (before !== null) contactId(before);
 return { page: messages ? 1 : Number(raw), limit: messages ? Number(raw) : 20, before };
}
