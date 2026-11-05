import { cookies } from "next/headers";
import { resolveIdentity } from "../db/services/personaService";
export const PERSONA_COOKIE = "connect_demo_user";
export async function requireUser() {
 return resolveIdentity(cookies().get(PERSONA_COOKIE)?.value);
}

export async function optionalUser(){return cookies().has(PERSONA_COOKIE)?requireUser():null;}
