import { NextRequest } from "next/server";
import { authenticated } from "@/lib/http/connect";
import { connectService } from "@/lib/db/services/connectService";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { return authenticated(actorId => connectService.discover(actorId, request.nextUrl.searchParams)); }
