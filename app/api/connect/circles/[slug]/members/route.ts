import {NextRequest} from "next/server";
import {authenticated} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function GET(request:NextRequest,{params}:{params:{slug:string}}){return authenticated(actor=>communityService.members(actor,params.slug,request.nextUrl.searchParams));}
