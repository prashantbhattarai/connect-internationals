import {NextRequest} from "next/server";
import {authenticated,mutationBody,expectContactIdentity} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){return authenticated(actor=>communityService.invitations(actor,request.nextUrl.searchParams));}
export function POST(request:NextRequest){return authenticated(async actor=>{expectContactIdentity(request,actor);return communityService.createInvitation(actor,await mutationBody(request));});}
