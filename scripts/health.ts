import { config } from "dotenv";
import { closeDriver, verifyDatabase } from "../src/lib/cognodb/driver";

config({ path: ".env.local" });

async function main() {
  const result = await verifyDatabase();
  if (result.ok) {
    console.log("CognoDB connectivity: OK");
  } else {
    console.error("CognoDB connectivity: FAILED");
    process.exitCode = 1;
  }
  await closeDriver();
}

main().catch(async () => {
  console.error("CognoDB connectivity: FAILED");
  process.exitCode = 1;
  await closeDriver();
});
