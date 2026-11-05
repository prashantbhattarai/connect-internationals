import { NextRequest } from "next/server";
import { authenticated } from "@/lib/http/connect";
import { contactService } from "@/lib/db/services/contactService";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { return authenticated(actorId=>contactService.conversations(actorId,request.nextUrl.searchParams)); }
