import neo4j, { type Driver, type Session } from "neo4j-driver";

// WHAT: Owns the CognoDB connection and database session lifecycle.
// HOW: Uses the official Neo4j driver because CognoDB speaks openCypher over Bolt.
// DO: Reuse the driver and keep read/write sessions short-lived and closed in finally.
// DON'T: Create a new driver per request or expose raw database errors to the UI.
import { getCognoDbEnv } from "./env";
import { toSafeDatabaseError } from "./errors";

const globalForDriver = globalThis as typeof globalThis & {
  __agriTraceDriver?: Driver;
};

// WHAT: Returns the shared database driver.
// HOW: Caches one driver on globalThis so hot reloads/server requests reuse the pool.
// DO: Keep credentials in environment variables and connection limits conservative.
// DON'T: Instantiate a new connection pool for every request.
export function getDriver(): Driver {
  if (!globalForDriver.__agriTraceDriver) {
    const { uri, username, password } = getCognoDbEnv();
    globalForDriver.__agriTraceDriver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        disableLosslessIntegers: true,
        maxConnectionPoolSize: 20,
        connectionAcquisitionTimeout: 10_000,
        connectionTimeout: 10_000,
      },
    );
  }

  return globalForDriver.__agriTraceDriver;
}

// WHAT: Runs a read-only CognoDB operation.
// HOW: Opens a READ session, executes the callback, converts errors, then closes it.
// DO: Use this for dashboard, search, details, and graph traversal queries.
// DON'T: Use it for CREATE/MERGE/SET mutation flows.
export async function withReadSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    return await work(session);
  } catch (error) {
    throw toSafeDatabaseError(error);
  } finally {
    await session.close();
  }
}

// WHAT: Runs database mutations when AgriTrace needs to create/update graph data.
// HOW: Opens a WRITE session with the same shared driver.
// DO: Use transactions for related node + relationship writes.
// DON'T: Split one logical write across unrelated sessions when atomicity matters.
export async function withWriteSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    return await work(session);
  } catch (error) {
    throw toSafeDatabaseError(error);
  } finally {
    await session.close();
  }
}

// WHAT: Verifies that CognoDB is reachable and can execute Cypher.
// HOW: Checks Bolt connectivity, then runs a tiny parameterized RETURN query.
// DO: Return a safe health result to the app.
// DON'T: Return credentials, driver internals, or raw provider errors.
export async function verifyDatabase(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.run("RETURN $message AS message", { message: "ok" });
      if (result.records[0]?.get("message") !== "ok") throw new Error("Unexpected health response");
    } finally {
      await session.close();
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "CognoDB is not reachable." };
  }
}

export async function closeDriver(): Promise<void> {
  if (globalForDriver.__agriTraceDriver) {
    await globalForDriver.__agriTraceDriver.close();
    delete globalForDriver.__agriTraceDriver;
  }
}
