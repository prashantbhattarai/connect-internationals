import { NextRequest } from "next/server";
import { authenticated, expectContactIdentity, mutationBody } from "@/lib/http/connect";
import { contactService } from "@/lib/db/services/contactService";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { return authenticated(actorId=>contactService.requests(actorId,request.nextUrl.searchParams)); }
export function POST(request: NextRequest) { return authenticated(async actorId=>{ expectContactIdentity(request,actorId); return contactService.sendIntroduction(actorId,await mutationBody(request)); }); }
