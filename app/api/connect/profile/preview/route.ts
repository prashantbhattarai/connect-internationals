import { NextRequest } from "next/server";
import { authenticated, mutationBody } from "@/lib/http/connect";
import { connectService } from "@/lib/db/services/connectService";
export const dynamic = "force-dynamic";
export function POST(request: NextRequest) { return authenticated(async actorId => connectService.previewProfile(actorId, await mutationBody(request))); }
