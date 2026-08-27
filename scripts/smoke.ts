import { config } from "dotenv";
import { closeDriver } from "../src/lib/cognodb/driver";
import { getDashboardData, getInvestigation, getPlants } from "../src/lib/cognodb/service";

config({ path: ".env.local" });

async function smoke() {
  const dashboard = await getDashboardData();
  if (!dashboard.ok) throw new Error("Dashboard query failed");

  const plants = await getPlants({ status: "critical", limit: 20 });
  if (!plants.ok || plants.data.length === 0) throw new Error("Plant query returned no critical cases");

  const investigation = await getInvestigation(plants.data[0].id);
  if (!investigation.ok) throw new Error("Investigation query failed");

  console.log("CognoDB smoke test: OK");
  console.log(`Plants: ${dashboard.data.stats.total}`);
  console.log(`Critical cases: ${plants.data.length}`);
  console.log(`Related cases for sample investigation: ${investigation.data.relatedCases.length}`);
  console.log(`Cross-grid worker traces: ${investigation.data.workerTraces.length}`);
}

smoke()
  .catch(() => {
    console.error("CognoDB smoke test: FAILED");
    process.exitCode = 1;
  })
  .finally(closeDriver);
