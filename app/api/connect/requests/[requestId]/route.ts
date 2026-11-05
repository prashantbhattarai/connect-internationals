import { NextRequest } from "next/server";
import { authenticated, expectContactIdentity, mutationBody } from "@/lib/http/connect";
import { contactService } from "@/lib/db/services/contactService";
export const dynamic = "force-dynamic";
export function PATCH(request: NextRequest,{ params }: {params:{requestId:string}}) { return authenticated(async actorId=>{ expectContactIdentity(request,actorId); return contactService.transitionRequest(actorId,params.requestId,await mutationBody(request)); }); }
