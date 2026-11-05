import { authenticated } from "@/lib/http/connect";
import { contactService } from "@/lib/db/services/contactService";
export const dynamic = "force-dynamic";
export function GET(_request: Request,{ params }: {params:{requestId:string}}) { return authenticated(actorId=>contactService.conversationForRequest(actorId,params.requestId)); }
