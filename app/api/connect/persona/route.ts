import { NextRequest, NextResponse } from "next/server";
import { PERSONA_COOKIE, requireUser } from "../../../../lib/auth/currentUser";
import { currentPersona, IdentityError, resolveIdentity } from "../../../../lib/db/services/personaService";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
 return NextResponse.json({ error: error instanceof IdentityError ? error.message : "Identity service unavailable." }, { status: error instanceof IdentityError ? error.status : 503, headers });
}
export async function GET() {
 try { const user = await requireUser(); return NextResponse.json({ current: await currentPersona(user.id) }, { headers }); }
 catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
 try {
  const origin = request.headers.get("origin");
  const expected = process.env.DEMO_ORIGIN ?? "http://localhost:3000";
  if (origin !== expected) throw new IdentityError(403, "Untrusted request origin.");
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Object.keys(body).length !== 1 || !("userId" in body)) throw new IdentityError(400, "Choose a demo persona.");
  const user = await resolveIdentity(body.userId);
  const response = NextResponse.json({ current: await currentPersona(user.id) }, { headers });
  response.cookies.set(PERSONA_COOKIE, user.id, { httpOnly: true, sameSite: "lax", secure: new URL(expected).protocol === "https:", path: "/", maxAge: 28800 });
  return response;
 } catch (error) { return failure(error); }
}
export async function OPTIONS() { return new NextResponse(null, { status: 405, headers }); }
