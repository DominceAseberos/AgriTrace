import type { Record as Neo4jRecord } from "neo4j-driver";
import { withReadSession } from "./driver";
import { DatabaseUnavailableError } from "./errors";
import { QUERIES } from "./queries";
import type {
  ConnectionReason,
  DashboardData,
  DataResult,
  GraphEdge,
  GraphNode,
  InvestigationData,
  ObservationRecord,
  PlantDetail,
  PlantStatus,
  PlantSummary,
  RelatedCase,
  TreatmentInsight,
  TreatmentRecord,
  WorkerTrace,
} from "./types";

const text = (record: Neo4jRecord, key: string): string => String(record.get(key) ?? "");
const nullableText = (record: Neo4jRecord, key: string): string | null => {
  const value = record.get(key);
  return value == null ? null : String(value);
};
const number = (record: Neo4jRecord, key: string): number => Number(record.get(key) ?? 0);
const texts = (record: Neo4jRecord, key: string): string[] => {
  const value = record.get(key);
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
};

function status(value: string): PlantStatus {
  return value === "critical" || value === "watch" ? value : "healthy";
}

function plantFromRecord(record: Neo4jRecord): PlantSummary {
  return {
    id: text(record, "id"),
    code: text(record, "code"),
    species: text(record, "species"),
    status: status(text(record, "status")),
    gridId: text(record, "gridId"),
    gridName: text(record, "gridName"),
    companyName: text(record, "companyName"),
    latestObservedAt: nullableText(record, "latestObservedAt"),
    symptoms: texts(record, "symptoms"),
  };
}

async function safely<T>(work: () => Promise<T>): Promise<DataResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, error: { code: "DB_UNAVAILABLE", message: error.message } };
    }
    return { ok: false, error: { code: "UNKNOWN", message: "We couldn't load the latest agarwood records." } };
  }
}

export async function getDashboardData(): Promise<DataResult<DashboardData>> {
  return safely(async () =>
    withReadSession(async (session) => {
      const statsResult = await session.run(QUERIES.dashboardStats);
      const statsRecord = statsResult.records[0];
      const stats = {
        total: statsRecord ? number(statsRecord, "total") : 0,
        healthy: statsRecord ? number(statsRecord, "healthy") : 0,
        watch: statsRecord ? number(statsRecord, "watch") : 0,
        critical: statsRecord ? number(statsRecord, "critical") : 0,
      };

      const recentResult = await session.run(QUERIES.recentCases, { limit: 8 });
      const recentCases = recentResult.records.map((record) => ({
        plantId: text(record, "plantId"),
        plantCode: text(record, "plantCode"),
        status: status(text(record, "status")),
        gridName: text(record, "gridName"),
        observedAt: text(record, "observedAt"),
        symptoms: texts(record, "symptoms"),
      }));

      const symptomResult = await session.run(QUERIES.topSymptoms, { limit: 5 });
      const topSymptoms = symptomResult.records.map((record) => ({
        name: text(record, "name"),
        affectedPlants: number(record, "affectedPlants"),
      }));

      const treatmentResult = await session.run(QUERIES.treatmentInsights, { limit: 5 });
      const treatmentInsights: TreatmentInsight[] = treatmentResult.records.map((record) => {
        const cases = number(record, "cases");
        const improved = number(record, "improved");
        return {
          id: text(record, "id"),
          name: text(record, "name"),
          cases,
          improved,
          stable: number(record, "stable"),
          declined: number(record, "declined"),
          improvementRate: cases === 0 ? 0 : Math.round((improved / cases) * 100),
        };
      });

      return { stats, recentCases, topSymptoms, treatmentInsights };
    }),
  );
}

export async function getPlants(options: { query?: string; status?: string; species?: string; limit?: number } = {}): Promise<DataResult<PlantSummary[]>> {
  return safely(async () =>
    withReadSession(async (session) => {
      const result = await session.run(QUERIES.listPlants, {
        query: options.query?.trim() ?? "",
        status: options.status === "healthy" || options.status === "watch" || options.status === "critical" ? options.status : "",
        species: options.species === "Aquilaria malaccensis" || options.species === "Aquilaria crassna" ? options.species : "",
        limit: options.limit ?? 200,
      });
      return result.records.map(plantFromRecord);
    }),
  );
}

async function readPlantDetail(plantId: string): Promise<PlantDetail | null> {
  return withReadSession(async (session) => {
    const coreResult = await session.run(QUERIES.plantCore, { plantId });
    const core = coreResult.records[0];
    if (!core) return null;

    const observationsResult = await session.run(QUERIES.plantObservations, { plantId });
    const observations: ObservationRecord[] = observationsResult.records.map((record) => ({
      id: text(record, "id"),
      observedAt: text(record, "observedAt"),
      severity: number(record, "severity"),
      healthScore: number(record, "healthScore"),
      notes: text(record, "notes"),
      workerName: text(record, "workerName"),
      symptoms: texts(record, "symptoms"),
    }));

    const treatmentResult = await session.run(QUERIES.plantTreatments, { plantId });
    const treatments: TreatmentRecord[] = treatmentResult.records.map((record) => ({
      id: text(record, "id"),
      name: text(record, "name"),
      category: text(record, "category"),
      appliedAt: text(record, "appliedAt"),
      outcome: text(record, "outcome") === "improved" ? "improved" : text(record, "outcome") === "declined" ? "declined" : "stable",
      dosage: text(record, "dosage"),
    }));

    return {
      ...plantFromRecord(core),
      plantedAt: text(core, "plantedAt"),
      observations,
      treatments,
    };
  });
}

export async function getPlantDetail(plantId: string): Promise<DataResult<PlantDetail>> {
  try {
    const plant = await readPlantDetail(plantId);
    if (!plant) return { ok: false, error: { code: "NOT_FOUND", message: "Tree not found." } };
    return { ok: true, data: plant };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, error: { code: "DB_UNAVAILABLE", message: error.message } };
    }
    return { ok: false, error: { code: "UNKNOWN", message: "We couldn't load this agarwood tree." } };
  }
}

function reasonKey(reason: ConnectionReason): string {
  return `${reason.type}:${reason.label}`;
}

function strength(score: number): RelatedCase["strength"] {
  if (score >= 7) return "high";
  if (score >= 4) return "moderate";
  return "weak";
}

export async function getInvestigation(plantId: string): Promise<DataResult<InvestigationData>> {
  return safely(async () => {
    const source = await readPlantDetail(plantId);
    if (!source) throw new Error("Plant not found");

    const allPlantsResult = await getPlants({ limit: 500 });
    const allPlants = allPlantsResult.ok ? allPlantsResult.data : [];
    const plantLookup = new Map(allPlants.map((plant) => [plant.id, plant]));

    const { sameSymptomRecords, nearbyRecords, treatmentRecords, traceRecords } = await withReadSession(async (session) => {
      const sameSymptom = await session.run(QUERIES.sameSymptomTraversal, { plantId });
      const nearby = await session.run(QUERIES.nearbyPlants, { plantId });
      const treatments = await session.run(QUERIES.sharedTreatments, { plantId });
      const traces = await session.run(QUERIES.crossGridWorkerTrace, { plantId, limit: 20 });
      return {
        sameSymptomRecords: sameSymptom.records,
        nearbyRecords: nearby.records,
        treatmentRecords: treatments.records,
        traceRecords: traces.records,
      };
    });

    const related = new Map<string, { plant: PlantSummary; reasons: Map<string, ConnectionReason> }>();
    const ensure = (id: string, fallback?: PlantSummary) => {
      const existing = related.get(id);
      if (existing) return existing;
      const plant = plantLookup.get(id) ?? fallback;
      if (!plant) return null;
      const created = { plant, reasons: new Map<string, ConnectionReason>() };
      related.set(id, created);
      return created;
    };
    const addReason = (id: string, reason: ConnectionReason, fallback?: PlantSummary) => {
      const entry = ensure(id, fallback);
      if (entry) entry.reasons.set(reasonKey(reason), reason);
    };

    for (const record of sameSymptomRecords) {
      const id = text(record, "id");
      addReason(id, {
        type: "symptom",
        label: text(record, "symptomName"),
        detail: `Both trees have inspections showing ${text(record, "symptomName")}.`,
        weight: 3,
      }, {
        id,
        code: text(record, "code"),
        species: text(record, "species"),
        status: status(text(record, "status")),
        gridId: text(record, "gridId"),
        gridName: text(record, "gridName"),
        companyName: text(record, "companyName"),
        latestObservedAt: null,
        symptoms: [text(record, "symptomName")],
      });
    }

    for (const record of nearbyRecords) {
      const id = text(record, "id");
      addReason(id, {
        type: "near",
        label: "Nearby tree",
        detail: `The trees are recorded as nearby in ${text(record, "gridName")}.`,
        weight: 3,
      }, plantFromRecord(record));
    }

    for (const record of treatmentRecords) {
      const id = text(record, "id");
      addReason(id, {
        type: "treatment",
        label: text(record, "treatmentName"),
        detail: `Both trees received ${text(record, "treatmentName")}.`,
        weight: 2,
      }, plantFromRecord(record));
    }

    const workerTraces: WorkerTrace[] = traceRecords.map((record) => ({
      workerName: text(record, "workerName"),
      symptomName: text(record, "symptomName"),
      sourceGrid: text(record, "sourceGrid"),
      targetGrid: text(record, "targetGrid"),
      targetPlantId: text(record, "targetPlantId"),
      targetPlantCode: text(record, "targetPlantCode"),
      observedAt: text(record, "observedAt"),
    }));

    for (const trace of workerTraces) {
      addReason(trace.targetPlantId, {
        type: "worker-trace",
        label: trace.workerName,
        detail: `${trace.workerName} recorded the same ${trace.symptomName} symptom in ${trace.sourceGrid} and ${trace.targetGrid}.`,
        weight: 4,
      });
    }

    const relatedCases: RelatedCase[] = [...related.values()]
      .map(({ plant, reasons }) => {
        const reasonList = [...reasons.values()];
        const score = reasonList.reduce((total, reason) => total + reason.weight, 0);
        return { plant, reasons: reasonList, score, strength: strength(score) };
      })
      .sort((a, b) => b.score - a.score || a.plant.code.localeCompare(b.plant.code))
      .slice(0, 14);

    const nodes: GraphNode[] = [{ id: source.id, label: source.code, kind: "plant", meta: source.gridName, emphasis: true }];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set([source.id]);
    const edgeIds = new Set<string>();

    const pushNode = (node: GraphNode) => {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        nodes.push(node);
      }
    };
    const pushEdge = (edge: GraphEdge) => {
      if (!edgeIds.has(edge.id)) {
        edgeIds.add(edge.id);
        edges.push(edge);
      }
    };

    for (const item of relatedCases.slice(0, 5)) {
      pushNode({ id: item.plant.id, label: item.plant.code, kind: "plant", meta: item.plant.gridName });
      for (const reason of item.reasons) {
        if (reason.type === "near") {
          pushEdge({ id: `near:${source.id}:${item.plant.id}`, source: source.id, target: item.plant.id, label: "NEAR", kind: "near" });
          continue;
        }
        const middleId = `${reason.type}:${reason.label}`;
        const kind = reason.type === "symptom" ? "symptom" : reason.type === "treatment" ? "treatment" : "worker";
        pushNode({ id: middleId, label: reason.label, kind, meta: reason.type === "worker-trace" ? "cross-grid trace" : undefined });
        pushEdge({ id: `${source.id}:${middleId}`, source: source.id, target: middleId, label: reason.type === "symptom" ? "SHOWS" : reason.type === "treatment" ? "RECEIVED" : "RECORDED BY", kind: reason.type });
        pushEdge({ id: `${middleId}:${item.plant.id}`, source: middleId, target: item.plant.id, label: reason.type === "symptom" ? "SHOWS" : reason.type === "treatment" ? "RECEIVED" : "RECORDED", kind: reason.type });
      }
    }

    return { source, relatedCases, workerTraces, graph: { nodes, edges } };
  });
}

export async function getTreatmentInsights(): Promise<DataResult<TreatmentInsight[]>> {
  const dashboard = await getDashboardData();
  return dashboard.ok ? { ok: true, data: dashboard.data.treatmentInsights } : dashboard;
}
