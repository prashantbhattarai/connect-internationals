import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {contactService} from "@/lib/db/services/contactService";
export const dynamic="force-dynamic";
export function POST(request:NextRequest,{params}:{params:{token:string}}){return authenticated(async actor=>{expectContactIdentity(request,actor);return contactService.sendInvitationIntroduction(actor,params.token,await mutationBody(request));});}
