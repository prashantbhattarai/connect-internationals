import {safetyService} from "@/lib/db/services/safetyService";
import {PERSONA_COOKIE} from "@/lib/auth/currentUser";
import { NextRequest } from "next/server";
import { authenticated, mutationBody, expectContactIdentity } from "@/lib/http/connect";
import { connectService } from "@/lib/db/services/connectService";
export const dynamic = "force-dynamic";
export function GET() { return authenticated(actorId => connectService.ownProfile(actorId)); }
export function PATCH(request: NextRequest) { return authenticated(async actorId => connectService.updateProfile(actorId, await mutationBody(request))); }

export async function DELETE(request:NextRequest){
 const response=await authenticated(async actor=>{expectContactIdentity(request,actor);return safetyService.deleteProfile(actor,await mutationBody(request));});
 if(response.ok)response.cookies.set(PERSONA_COOKIE,"",{httpOnly:true,sameSite:"lax",path:"/",maxAge:0,secure:new URL(process.env.DEMO_ORIGIN??"http://localhost:3000").protocol==="https:"});
 return response;
}
