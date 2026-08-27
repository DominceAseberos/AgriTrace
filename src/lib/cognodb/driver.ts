import neo4j, { type Driver, type Session } from "neo4j-driver";
import { getCognoDbEnv } from "./env";
import { toSafeDatabaseError } from "./errors";

const globalForDriver = globalThis as typeof globalThis & {
  __agriTraceDriver?: Driver;
};

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
