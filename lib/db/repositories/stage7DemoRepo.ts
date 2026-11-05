import {db} from "./client";
import {requireIsolatedStage4} from "./stage4TestRepo";
/** Synthetic screenshot fixture only; never operates on the public demo schema. */
export async function reserveStage7Newcomer(userId:string) {
 requireIsolatedStage4();
 await db.connectProfile.update({where:{userId},data:{demoOrdinal:1,discoverable:false}});
}
