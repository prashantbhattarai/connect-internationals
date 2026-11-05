import { NextRequest } from "next/server";
import { authenticated, expectContactIdentity, mutationBody } from "@/lib/http/connect";
import { contactService } from "@/lib/db/services/contactService";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest,{ params }: {params:{conversationId:string}}) { return authenticated(actorId=>contactService.messages(actorId,params.conversationId,request.nextUrl.searchParams)); }
export function POST(request: NextRequest,{ params }: {params:{conversationId:string}}) { return authenticated(async actorId=>{ expectContactIdentity(request,actorId); return contactService.sendMessage(actorId,params.conversationId,await mutationBody(request)); }); }
