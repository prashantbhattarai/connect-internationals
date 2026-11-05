import { communityService } from "../lib/db/services/communityService";
import { readFile } from "node:fs/promises";
import { seedRecords } from "../lib/db/services/seedService";
import { db } from "../lib/db/repositories/client";
async function main() {
 const url = new URL(process.env.DATABASE_URL ?? "");
 if (!["localhost", "127.0.0.1", "postgres"].includes(url.hostname) || url.pathname !== "/connect_dev") throw new Error("Seed requires the verified local connect_dev database");
 const input: unknown = JSON.parse(await readFile(process.env.SEED_PATH ?? "private/connect_seed_users.json", "utf8"));
 const result = await seedRecords(input);
 await communityService.seedCircles();
 console.log(`Import complete: ${result.users} users, ${result.profiles} profiles. Private records omitted.`);
}
main().catch(() => { console.error("Seed failed; check local database, input validation and seed mount. Private details suppressed."); process.exitCode = 1; }).finally(() => db.$disconnect());
