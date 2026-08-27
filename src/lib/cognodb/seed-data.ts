type SeedNode = Record<string, string | number | boolean> & { id: string };

export interface SeedBundle {
  companies: SeedNode[];
  grids: SeedNode[];
  plants: SeedNode[];
  workers: SeedNode[];
  symptoms: SeedNode[];
  treatments: SeedNode[];
  observations: SeedNode[];
  owns: { companyId: string; gridId: string }[];
  contains: { gridId: string; plantId: string }[];
  hasObservation: { plantId: string; observationId: string }[];
  shows: { observationId: string; symptomId: string }[];
  recorded: { workerId: string; observationId: string }[];
  received: { plantId: string; treatmentId: string; appliedAt: string; dosage: string; outcome: string }[];
  near: { fromId: string; toId: string; distanceMeters: number }[];
}

const pad = (value: number, size = 3) => String(value).padStart(size, "0");
const isoDay = (day: number) => `2026-08-${String(Math.max(1, Math.min(28, day))).padStart(2, "0")}T08:00:00+08:00`;

export function buildSeedData(): SeedBundle {
  const companies: SeedNode[] = [
    { id: "company-tagum", name: "Tagum Agri Research Farm", location: "Tagum City, Davao del Norte", agriTraceSeed: true },
    { id: "company-cabcor", name: "Cabcor Sustainable Farms", location: "New Corella, Davao del Norte", agriTraceSeed: true },
  ];

  const grids: SeedNode[] = [
    { id: "grid-a", name: "North Grove", areaHectares: 1.84, agriTraceSeed: true },
    { id: "grid-b", name: "Creek Line", areaHectares: 1.42, agriTraceSeed: true },
    { id: "grid-c", name: "Upper Terrace", areaHectares: 1.66, agriTraceSeed: true },
    { id: "grid-d", name: "East Nursery", areaHectares: 1.51, agriTraceSeed: true },
    { id: "grid-e", name: "River Bend", areaHectares: 1.73, agriTraceSeed: true },
    { id: "grid-f", name: "South Block", areaHectares: 1.58, agriTraceSeed: true },
  ];

  const owns = [
    { companyId: "company-tagum", gridId: "grid-a" },
    { companyId: "company-tagum", gridId: "grid-b" },
    { companyId: "company-tagum", gridId: "grid-c" },
    { companyId: "company-cabcor", gridId: "grid-d" },
    { companyId: "company-cabcor", gridId: "grid-e" },
    { companyId: "company-cabcor", gridId: "grid-f" },
  ];

  const workers: SeedNode[] = [
    { id: "worker-1", name: "Mara Santos", role: "Field Technician", agriTraceSeed: true },
    { id: "worker-2", name: "Joel Ramirez", role: "Field Technician", agriTraceSeed: true },
    { id: "worker-3", name: "Ana Villareal", role: "Plant Health Scout", agriTraceSeed: true },
    { id: "worker-4", name: "Carlo Mendoza", role: "Plant Health Scout", agriTraceSeed: true },
    { id: "worker-5", name: "Leah Garcia", role: "Farm Supervisor", agriTraceSeed: true },
    { id: "worker-6", name: "Noel Dizon", role: "Field Technician", agriTraceSeed: true },
    { id: "worker-7", name: "Ivy Flores", role: "Agriculture Aide", agriTraceSeed: true },
    { id: "worker-8", name: "Paolo Reyes", role: "Agriculture Aide", agriTraceSeed: true },
  ];

  const symptoms: SeedNode[] = [
    { id: "sym-yellow", name: "Leaf yellowing", category: "foliar", agriTraceSeed: true },
    { id: "sym-spot", name: "Leaf spot", category: "foliar", agriTraceSeed: true },
    { id: "sym-wilt", name: "Wilting", category: "water-stress", agriTraceSeed: true },
    { id: "sym-stunted", name: "Stunted growth", category: "growth", agriTraceSeed: true },
    { id: "sym-lesion", name: "Stem lesion", category: "stem", agriTraceSeed: true },
    { id: "sym-fungal", name: "Fungal growth", category: "pathogen", agriTraceSeed: true },
    { id: "sym-root", name: "Root stress", category: "root", agriTraceSeed: true },
    { id: "sym-drop", name: "Premature leaf drop", category: "foliar", agriTraceSeed: true },
  ];

  const treatments: SeedNode[] = [
    { id: "treat-npk", name: "Balanced NPK", category: "nutrition", agriTraceSeed: true },
    { id: "treat-copper", name: "Copper fungicide", category: "fungicide", agriTraceSeed: true },
    { id: "treat-irrigation", name: "Deep irrigation", category: "water", agriTraceSeed: true },
    { id: "treat-compost", name: "Organic compost", category: "soil", agriTraceSeed: true },
    { id: "treat-sanitation", name: "Wound sanitation", category: "sanitation", agriTraceSeed: true },
    { id: "treat-biofungicide", name: "Biofungicide", category: "fungicide", agriTraceSeed: true },
    { id: "treat-root", name: "Root drench", category: "root-care", agriTraceSeed: true },
  ];

  const watchSymptoms = ["sym-yellow", "sym-spot", "sym-wilt", "sym-stunted"];
  const criticalSecondSymptoms = ["sym-lesion", "sym-fungal", "sym-root", "sym-drop"];
  const treatmentBySymptom: Record<string, string> = {
    "sym-yellow": "treat-npk",
    "sym-spot": "treat-copper",
    "sym-wilt": "treat-irrigation",
    "sym-stunted": "treat-compost",
    "sym-lesion": "treat-sanitation",
    "sym-fungal": "treat-biofungicide",
    "sym-root": "treat-root",
    "sym-drop": "treat-compost",
  };

  const plants: SeedNode[] = [];
  const observations: SeedNode[] = [];
  const contains: SeedBundle["contains"] = [];
  const hasObservation: SeedBundle["hasObservation"] = [];
  const shows: SeedBundle["shows"] = [];
  const recorded: SeedBundle["recorded"] = [];
  const received: SeedBundle["received"] = [];
  const near: SeedBundle["near"] = [];

  for (let plantNumber = 1; plantNumber <= 72; plantNumber += 1) {
    const gridIndex = Math.floor((plantNumber - 1) / 12);
    const grid = grids[gridIndex];
    const code = `PL-${pad(plantNumber)}`;
    const plantId = `plant-${pad(plantNumber)}`;
    const isCritical = plantNumber % 11 === 0 || plantNumber === 34 || plantNumber === 58;
    const isWatch = !isCritical && (plantNumber % 5 === 0 || plantNumber % 7 === 0 || plantNumber === 18);
    const plantStatus = isCritical ? "critical" : isWatch ? "watch" : "healthy";
    const species = plantNumber % 3 === 0 ? "Aquilaria crassna" : "Aquilaria malaccensis";

    plants.push({
      id: plantId,
      code,
      species,
      status: plantStatus,
      plantedAt: `2025-${String(((plantNumber + 2) % 9) + 1).padStart(2, "0")}-15`,
      agriTraceSeed: true,
    });
    contains.push({ gridId: String(grid.id), plantId });

    const symptomIds = isCritical
      ? ["sym-yellow", criticalSecondSymptoms[plantNumber % criticalSecondSymptoms.length]]
      : isWatch
        ? [watchSymptoms[plantNumber % watchSymptoms.length]]
        : [];

    const observationCount = plantStatus === "healthy" ? 1 : 2;
    for (let observationIndex = 0; observationIndex < observationCount; observationIndex += 1) {
      const observationId = `obs-${pad(plantNumber)}-${observationIndex + 1}`;
      const day = 7 + ((plantNumber * 3 + observationIndex * 7) % 20);
      const severity = plantStatus === "critical" ? Math.max(3, 5 - observationIndex) : plantStatus === "watch" ? Math.max(2, 3 - observationIndex) : 1;
      const healthScore = plantStatus === "critical" ? 42 + observationIndex * 8 : plantStatus === "watch" ? 67 + observationIndex * 9 : 92 + (plantNumber % 6);
      const workerIndex = (plantNumber + observationIndex * 2) % 6;

      observations.push({
        id: observationId,
        observedAt: isoDay(day),
        severity,
        healthScore,
        notes: plantStatus === "healthy"
          ? "Routine inspection; canopy and stem condition normal."
          : observationIndex === 0
            ? "Field scout flagged a visible health change for follow-up."
            : "Follow-up inspection recorded the plant response after intervention.",
        agriTraceSeed: true,
      });
      hasObservation.push({ plantId, observationId });
      recorded.push({ workerId: String(workers[workerIndex].id), observationId });
      for (const symptomId of symptomIds) shows.push({ observationId, symptomId });
    }

    if (symptomIds.length > 0) {
      const treatmentId = treatmentBySymptom[symptomIds[symptomIds.length - 1]];
      const outcome = plantStatus === "watch" || plantNumber % 3 === 0 ? "improved" : plantNumber % 4 === 0 ? "declined" : "stable";
      const appliedDay = 8 + ((plantNumber * 3) % 15);
      received.push({
        plantId,
        treatmentId,
        appliedAt: isoDay(appliedDay),
        dosage: treatmentId === "treat-irrigation" ? "18 L" : treatmentId === "treat-compost" ? "1.5 kg" : "label rate",
        outcome,
      });
    }
  }

  for (let gridIndex = 0; gridIndex < 6; gridIndex += 1) {
    const firstPlant = gridIndex * 12 + 1;
    for (let offset = 0; offset < 11; offset += 1) {
      const from = firstPlant + offset;
      const to = from + 1;
      near.push({
        fromId: `plant-${pad(from)}`,
        toId: `plant-${pad(to)}`,
        distanceMeters: 2.5 + ((from + to) % 4) * 0.8,
      });
    }
  }

  return {
    companies,
    grids,
    plants,
    workers,
    symptoms,
    treatments,
    observations,
    owns,
    contains,
    hasObservation,
    shows,
    recorded,
    received,
    near,
  };
}
