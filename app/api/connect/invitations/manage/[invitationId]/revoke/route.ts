import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function POST(request:NextRequest,{params}:{params:{invitationId:string}}){return authenticated(async actor=>{expectContactIdentity(request,actor);return communityService.revoke(actor,params.invitationId,await mutationBody(request));});}
