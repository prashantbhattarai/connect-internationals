import {authenticated} from "@/lib/http/connect";
import {communityService} from "@/lib/db/services/communityService";
export const dynamic="force-dynamic";
export function GET(){return authenticated(actor=>communityService.circles(actor));}
