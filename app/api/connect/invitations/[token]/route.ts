import {connectResponse} from "@/lib/http/connect";
import {optionalUser} from "@/lib/auth/currentUser";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function GET(_request:Request,{params}:{params:{token:string}}){return connectResponse(async()=>communityService.landing(params.token,(await optionalUser())?.id));}
