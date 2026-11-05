const { spawnSync } = require("node:child_process");
try {
 const url = new URL(process.env.DATABASE_URL || "");
 if (!["localhost", "127.0.0.1", "postgres"].includes(url.hostname) || url.pathname !== "/connect_dev") throw new Error();
} catch {
 console.error("Migration refused: configure the verified local connect_dev database."); process.exit(1);
}
const result = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], { stdio: "inherit" });
process.exit(result.status ?? 1);
