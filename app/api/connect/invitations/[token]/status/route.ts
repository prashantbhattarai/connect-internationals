import {authenticated} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function GET(_request:Request,{params}:{params:{token:string}}){return authenticated(actor=>communityService.status(actor,params.token));}
