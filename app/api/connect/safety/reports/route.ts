import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {safetyService} from "@/lib/db/services/safetyService";
export const dynamic="force-dynamic";
export function POST(request:NextRequest){return authenticated(async actor=>{expectContactIdentity(request,actor);return safetyService.report(actor,await mutationBody(request));});}
