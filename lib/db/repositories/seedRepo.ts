import { Prisma } from "@prisma/client";
import {lockContactUsers} from "./contactRepo";
import { db } from "./client";
export async function importWithinTransaction(tx: Prisma.TransactionClient, profiles: Prisma.ConnectProfileCreateManyInput[]) {
 await tx.user.createMany({ data: profiles.map(p => ({ id: p.userId })), skipDuplicates: true });
 await lockContactUsers(tx,profiles.map(p=>p.userId));
 const deleted = new Set((await tx.profileDeletion.findMany({ select: { userId: true } })).map(p => p.userId));
 await tx.connectProfile.createMany({ data: profiles.filter(p => !deleted.has(p.userId)), skipDuplicates: true });
 return { users: await tx.user.count(), profiles: await tx.connectProfile.count() };
}
export async function importProfiles(profiles: Prisma.ConnectProfileCreateManyInput[]) {
 return db.$transaction(tx => importWithinTransaction(tx, profiles), { timeout: 30000 });
}
