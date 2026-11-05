import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../auth/currentUser";
import { IdentityError } from "../db/services/personaService";
import { ConnectError } from "../db/services/connectValidation";
export async function connectResponse(operation: () => Promise<unknown>) {
 const headers: Record<string,string> = { "Cache-Control": "private, no-store", Vary: "Cookie", "Referrer-Policy":"no-referrer" };
 try { return NextResponse.json(await operation(), { headers }); }
 catch (error) {
  const known = error instanceof IdentityError || error instanceof ConnectError;
  const retryAfter = error instanceof ConnectError ? error.retryAfter : undefined;
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json({ error: known ? error.message : "Connect is temporarily unavailable. Please retry.", ...(retryAfter ? { retryAfter } : {}) }, { status: known ? error.status : 503, headers });
 }
}
export function authenticated(operation:(actorId:string)=>Promise<unknown>){return connectResponse(async()=>{const actor=await requireUser();return operation(actor.id);});}
export async function mutationBody(request: NextRequest) {
 if (request.headers.get("origin") !== (process.env.DEMO_ORIGIN ?? "http://localhost:3000")) throw new ConnectError(403, "Untrusted request origin.");
 if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ConnectError(400, "Expected JSON.");
 const text = await request.text();
 if (text.length > 16000) throw new ConnectError(413, "Request body is too large.");
 try { return JSON.parse(text) as unknown; } catch { throw new ConnectError(400, "Invalid JSON."); }
}

// Identity is still derived solely from requireUser. This is a stale-form
// precondition, never an alternative way to authorize or select an actor.
export function expectContactIdentity(request: NextRequest, actorId: string) {
 if (request.headers.get("x-connect-identity") !== actorId) throw new ConnectError(409,"Persona changed. Reload before sending or responding.");
}
