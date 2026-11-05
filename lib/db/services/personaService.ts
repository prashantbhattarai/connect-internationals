import { findDemoUser, findPersona, listDemoPersonas, listDemoNewcomers } from "../repositories/personaRepo";
export class IdentityError extends Error {
 constructor(public status: number, message: string) { super(message); }
}
export function requireDemoMode() {
 if (process.env.DEMO_MODE !== "true") throw new IdentityError(403, "Demo identity is disabled.");
}
export async function resolveIdentity(value: unknown) {
 requireDemoMode();
 if (typeof value !== "string" || !/^seed_[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new IdentityError(401, "Choose a demo persona.");
 const user = await findDemoUser(value);
 if (!user) throw new IdentityError(401, "Choose a valid demo persona.");
 return user;
}
export async function personaOptions() { requireDemoMode(); return listDemoPersonas(); }
export async function currentPersona(id: string) { return findPersona(id); }

export async function newcomerOptions(){requireDemoMode();return listDemoNewcomers();}
