import { authenticated } from "@/lib/http/connect";
import { connectService } from "@/lib/db/services/connectService";
export const dynamic = "force-dynamic";
export function GET(_request: Request, { params }: { params: { userId: string } }) { return authenticated(actorId => connectService.profileById(actorId, params.userId)); }
