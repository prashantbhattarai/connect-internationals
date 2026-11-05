import {communityService} from "../lib/db/services/communityService";
import {db} from "../lib/db/repositories/client";
async function main(){const url=new URL(process.env.DATABASE_URL??"");if(!["postgres","localhost","127.0.0.1"].includes(url.hostname)||url.pathname!=="/connect_dev")throw new Error("Local database required");console.log(`Prepared ${await communityService.seedCircles()} curated circles; no users joined automatically.`);}
main().catch(()=>{console.error("Circle setup failed; private details omitted.");process.exitCode=1;}).finally(()=>db.$disconnect());
