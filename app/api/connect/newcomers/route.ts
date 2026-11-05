import {connectResponse} from "@/lib/http/connect";
import {newcomerOptions} from "@/lib/db/services/personaService";
export const dynamic="force-dynamic";
export function GET(){return connectResponse(async()=>({personas:await newcomerOptions()}));}
