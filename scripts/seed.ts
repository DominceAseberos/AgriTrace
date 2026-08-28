import { config } from "dotenv";
import { closeDriver, getDriver } from "../src/lib/cognodb/driver";
import { buildSeedData } from "../src/lib/cognodb/seed-data";

config({ path: ".env.local" });

// WHAT: Defines unique identity constraints for seeded graph entities.
// HOW: CognoDB enforces one node per stable ID where the provider supports constraints.
// DO: Keep IDs stable across repeated seed runs.
// DON'T: Use display names as graph identity.
const schemaStatements = [
  "CREATE CONSTRAINT company_id IF NOT EXISTS FOR (n:Company) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT grid_id IF NOT EXISTS FOR (n:Grid) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT plant_id IF NOT EXISTS FOR (n:Plant) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT observation_id IF NOT EXISTS FOR (n:Observation) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT symptom_id IF NOT EXISTS FOR (n:Symptom) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT treatment_id IF NOT EXISTS FOR (n:Treatment) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT worker_id IF NOT EXISTS FOR (n:Worker) REQUIRE n.id IS UNIQUE",
];

async function seed() {
  const data = buildSeedData();
  const driver = getDriver();
  const session = driver.session();

  try {
    // WHAT: Removes only previous AgriTrace seed data when --reset is requested.
    // HOW: Deletes nodes marked agriTraceSeed=true and detaches their relationships.
    // DO: Keep reset scoped to seeded content.
    // DON'T: Run MATCH (n) DETACH DELETE n against a shared database.
    if (process.argv.includes("--reset")) {
      await session.run("MATCH (n) WHERE n.agriTraceSeed = true DETACH DELETE n");
      console.log("Reset previous AgriTrace seed nodes.");
    }

    for (const statement of schemaStatements) {
      try {
        await session.run(statement);
      } catch {
        console.log("Schema optimization skipped where unsupported by the provider.");
        break;
      }
    }

    // WHAT: Loads the realistic demo graph into CognoDB.
    // HOW: Uses one write transaction, UNWIND batches, stable IDs, and MERGE relationships.
    // DO: Keep the seed repeatable/idempotent.
    // DON'T: CREATE duplicate nodes or relationships on every run.
    await session.executeWrite(async (tx) => {
      await tx.run("UNWIND $rows AS row MERGE (n:Company {id: row.id}) SET n += row", { rows: data.companies });
      await tx.run("UNWIND $rows AS row MERGE (n:Grid {id: row.id}) SET n += row", { rows: data.grids });
      await tx.run("UNWIND $rows AS row MERGE (n:Plant {id: row.id}) SET n += row", { rows: data.plants });
      await tx.run("UNWIND $rows AS row MERGE (n:Worker {id: row.id}) SET n += row", { rows: data.workers });
      await tx.run("UNWIND $rows AS row MERGE (n:Symptom {id: row.id}) SET n += row", { rows: data.symptoms });
      await tx.run("UNWIND $rows AS row MERGE (n:Treatment {id: row.id}) SET n += row", { rows: data.treatments });
      await tx.run("UNWIND $rows AS row MERGE (n:Observation {id: row.id}) SET n += row", { rows: data.observations });

      await tx.run("UNWIND $rows AS row MATCH (c:Company {id: row.companyId}), (g:Grid {id: row.gridId}) MERGE (c)-[:OWNS]->(g)", { rows: data.owns });
      await tx.run("UNWIND $rows AS row MATCH (g:Grid {id: row.gridId}), (p:Plant {id: row.plantId}) MERGE (g)-[:CONTAINS]->(p)", { rows: data.contains });
      await tx.run("UNWIND $rows AS row MATCH (p:Plant {id: row.plantId}), (o:Observation {id: row.observationId}) MERGE (p)-[:HAS_OBSERVATION]->(o)", { rows: data.hasObservation });
      await tx.run("UNWIND $rows AS row MATCH (o:Observation {id: row.observationId}), (s:Symptom {id: row.symptomId}) MERGE (o)-[:SHOWS]->(s)", { rows: data.shows });
      await tx.run("UNWIND $rows AS row MATCH (w:Worker {id: row.workerId}), (o:Observation {id: row.observationId}) MERGE (w)-[:RECORDED]->(o)", { rows: data.recorded });
      await tx.run("UNWIND $rows AS row MATCH (p:Plant {id: row.plantId}), (t:Treatment {id: row.treatmentId}) MERGE (p)-[r:RECEIVED]->(t) SET r.appliedAt = row.appliedAt, r.dosage = row.dosage, r.outcome = row.outcome", { rows: data.received });
      await tx.run("UNWIND $rows AS row MATCH (a:Plant {id: row.fromId}), (b:Plant {id: row.toId}) MERGE (a)-[r:NEAR]->(b) SET r.distanceMeters = row.distanceMeters", { rows: data.near });
    });

    const verification = await session.run(`
      MATCH (p:Plant)
      OPTIONAL MATCH (p)-[r]->()
      RETURN count(DISTINCT p) AS plants, count(r) AS outgoingRelationships
    `);
    const record = verification.records[0];
    console.log(`Seed complete: ${Number(record?.get("plants") ?? 0)} plants, ${Number(record?.get("outgoingRelationships") ?? 0)} outgoing plant relationships.`);
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed().catch((error) => {
  console.error("Seed failed. Check CognoDB connectivity and environment configuration.");
  if (process.env.NODE_ENV === "development") console.error(error instanceof Error ? error.name : "Unknown error");
  process.exitCode = 1;
});
