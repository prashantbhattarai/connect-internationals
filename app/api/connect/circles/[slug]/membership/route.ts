import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function POST(request:NextRequest,{params}:{params:{slug:string}}){return authenticated(async actor=>{expectContactIdentity(request,actor);return communityService.membership(actor,params.slug,await mutationBody(request));});}
