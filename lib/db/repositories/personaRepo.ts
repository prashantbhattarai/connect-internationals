import { db } from "./client";
export const findDemoUser = (id: string) => db.user.findFirst({ where: { id, profile: { demoOrdinal: { not: null } }, tombstone: null }, select: { id: true } });
export const listDemoPersonas = () => db.connectProfile.findMany({ where: { demoOrdinal: { not: null }, user: { tombstone: null } }, orderBy: { demoOrdinal: "asc" }, select: { userId: true, alias: true } });
export const findPersona = (id: string) => db.connectProfile.findUnique({ where: { userId: id }, select: { userId: true, alias: true } });

export const listDemoNewcomers=()=>db.connectProfile.findMany({where:{demoOrdinal:{gte:1,lte:3},user:{tombstone:null}},orderBy:{demoOrdinal:"asc"},select:{userId:true,alias:true}});
