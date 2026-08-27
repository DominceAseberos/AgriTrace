export type PlantStatus = "healthy" | "watch" | "critical";

export interface DashboardStats {
  total: number;
  healthy: number;
  watch: number;
  critical: number;
}

export interface PlantSummary {
  id: string;
  code: string;
  species: string;
  status: PlantStatus;
  gridId: string;
  gridName: string;
  companyName: string;
  latestObservedAt: string | null;
  symptoms: string[];
}

export interface ObservationRecord {
  id: string;
  observedAt: string;
  severity: number;
  healthScore: number;
  notes: string;
  workerName: string;
  symptoms: string[];
}

export interface TreatmentRecord {
  id: string;
  name: string;
  category: string;
  appliedAt: string;
  outcome: "improved" | "stable" | "declined";
  dosage: string;
}

export interface PlantDetail extends PlantSummary {
  plantedAt: string;
  observations: ObservationRecord[];
  treatments: TreatmentRecord[];
}

export interface RecentCase {
  plantId: string;
  plantCode: string;
  status: PlantStatus;
  gridName: string;
  observedAt: string;
  symptoms: string[];
}

export interface SymptomInsight {
  name: string;
  affectedPlants: number;
}

export interface TreatmentInsight {
  id: string;
  name: string;
  cases: number;
  improved: number;
  stable: number;
  declined: number;
  improvementRate: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentCases: RecentCase[];
  topSymptoms: SymptomInsight[];
  treatmentInsights: TreatmentInsight[];
}

export type ConnectionReasonType = "symptom" | "near" | "treatment" | "worker-trace";

export interface ConnectionReason {
  type: ConnectionReasonType;
  label: string;
  detail: string;
  weight: number;
}

export interface RelatedCase {
  plant: PlantSummary;
  score: number;
  strength: "high" | "moderate" | "weak";
  reasons: ConnectionReason[];
}

export interface WorkerTrace {
  workerName: string;
  symptomName: string;
  sourceGrid: string;
  targetGrid: string;
  targetPlantId: string;
  targetPlantCode: string;
  observedAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: "plant" | "symptom" | "treatment" | "worker" | "grid";
  meta?: string;
  emphasis?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: ConnectionReasonType | "context";
}

export interface InvestigationData {
  source: PlantDetail;
  relatedCases: RelatedCase[];
  workerTraces: WorkerTrace[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: "DB_UNAVAILABLE" | "NOT_FOUND" | "UNKNOWN"; message: string } };
