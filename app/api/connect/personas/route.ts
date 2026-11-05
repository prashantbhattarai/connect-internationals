import { NextResponse } from "next/server";
import { IdentityError, personaOptions } from "../../../../lib/db/services/personaService";
export const dynamic = "force-dynamic";
export async function GET() {
 try { return NextResponse.json({ personas: await personaOptions() }, { headers: { "Cache-Control": "private, no-store" } }); }
 catch (error) { return NextResponse.json({ error: "Demo personas unavailable." }, { status: error instanceof IdentityError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } }); }
}
