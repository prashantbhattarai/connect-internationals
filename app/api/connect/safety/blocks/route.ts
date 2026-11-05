import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {safetyService} from "@/lib/db/services/safetyService";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){return authenticated(actor=>safetyService.blocks(actor,request.nextUrl.searchParams));}
export function POST(request:NextRequest){return authenticated(async actor=>{expectContactIdentity(request,actor);return safetyService.block(actor,await mutationBody(request));});}
export function DELETE(request:NextRequest){return authenticated(async actor=>{expectContactIdentity(request,actor);return safetyService.unblock(actor,await mutationBody(request));});}
