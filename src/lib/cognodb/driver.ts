import neo4j, { type Driver, type Session } from "neo4j-driver";

/**
 * CognoDB speaks Neo4j's Bolt protocol, so AgriTrace uses the official
 * neo4j-driver directly. This module owns connection reuse, session lifetime,
 * access mode, and conversion of low-level driver errors into safe app errors.
 */
import { getCognoDbEnv } from "./env";
import { toSafeDatabaseError } from "./errors";

const globalForDriver = globalThis as typeof globalThis & {
  __agriTraceDriver?: Driver;
};

/** Reuse one driver per server process instead of opening a pool per request. */
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

/** Run read-only work and always close the short-lived session afterward. */
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

/**
 * Write-session boundary reserved for mutation flows such as future live field
 * observations. The current take-home app mainly reads; the seed script proves
 * the same driver can write graph nodes and relationships transactionally.
 */
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

/** Check both Bolt connectivity and a minimal parameterized Cypher round-trip. */
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
