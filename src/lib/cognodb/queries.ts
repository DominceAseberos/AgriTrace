// WHAT: Contains every runtime Cypher query used by AgriTrace.
// HOW: Queries describe graph patterns; runtime values arrive through $parameters.
// DO: Keep user values separate and pass them through session.run(query, params).
// DON'T: Concatenate search text, IDs, status, species, or limits into Cypher strings.
export const QUERIES = {
  dashboardStats: `
    MATCH (p:Plant)
    RETURN
      count(p) AS total,
      sum(CASE WHEN p.status = 'healthy' THEN 1 ELSE 0 END) AS healthy,
      sum(CASE WHEN p.status = 'watch' THEN 1 ELSE 0 END) AS watch,
      sum(CASE WHEN p.status = 'critical' THEN 1 ELSE 0 END) AS critical
  `,

  recentCases: `
    MATCH (g:Grid)-[:CONTAINS]->(p:Plant)-[:HAS_OBSERVATION]->(o:Observation)
    WHERE p.status <> 'healthy'
    OPTIONAL MATCH (o)-[:SHOWS]->(s:Symptom)
    WITH p, g, o, collect(DISTINCT s.name) AS symptoms
    ORDER BY o.observedAt DESC
    RETURN
      p.id AS plantId,
      p.code AS plantCode,
      p.status AS status,
      g.name AS gridName,
      o.observedAt AS observedAt,
      symptoms
    LIMIT $limit
  `,

  topSymptoms: `
    MATCH (p:Plant)-[:HAS_OBSERVATION]->(:Observation)-[:SHOWS]->(s:Symptom)
    RETURN s.name AS name, count(DISTINCT p) AS affectedPlants
    ORDER BY affectedPlants DESC, name ASC
    LIMIT $limit
  `,

  treatmentInsights: `
    MATCH (t:Treatment)<-[r:RECEIVED]-(p:Plant)
    RETURN
      t.id AS id,
      t.name AS name,
      count(DISTINCT p) AS cases,
      sum(CASE WHEN r.outcome = 'improved' THEN 1 ELSE 0 END) AS improved,
      sum(CASE WHEN r.outcome = 'stable' THEN 1 ELSE 0 END) AS stable,
      sum(CASE WHEN r.outcome = 'declined' THEN 1 ELSE 0 END) AS declined
    ORDER BY cases DESC, name ASC
    LIMIT $limit
  `,

  // WHAT: Searches and filters the tree catalog.
  // HOW: CognoDB applies ID/species/area/status filters before returning records.
  // DO: Keep filtering server-side and parameterized.
  // DON'T: Download the full database just to filter it in React.
  listPlants: `
    MATCH (c:Company)-[:OWNS]->(g:Grid)-[:CONTAINS]->(p:Plant)
    OPTIONAL MATCH (p)-[:HAS_OBSERVATION]->(o:Observation)
    OPTIONAL MATCH (o)-[:SHOWS]->(s:Symptom)
    WITH c, g, p, max(o.observedAt) AS latestObservedAt, collect(DISTINCT s.name) AS symptoms
    WHERE ($query = ''
      OR toLower(p.code) CONTAINS toLower($query)
      OR toLower(p.species) CONTAINS toLower($query)
      OR toLower(g.name) CONTAINS toLower($query))
      AND ($status = '' OR p.status = $status)
      AND ($species = '' OR p.species = $species)
    RETURN
      p.id AS id,
      p.code AS code,
      p.species AS species,
      p.status AS status,
      g.id AS gridId,
      g.name AS gridName,
      c.name AS companyName,
      latestObservedAt,
      symptoms
    ORDER BY
      CASE p.status WHEN 'critical' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END,
      p.code ASC
    LIMIT $limit
  `,

  plantCore: `
    MATCH (c:Company)-[:OWNS]->(g:Grid)-[:CONTAINS]->(p:Plant {id: $plantId})
    OPTIONAL MATCH (p)-[:HAS_OBSERVATION]->(o:Observation)-[:SHOWS]->(s:Symptom)
    WITH c, g, p, max(o.observedAt) AS latestObservedAt, collect(DISTINCT s.name) AS symptoms
    RETURN
      p.id AS id,
      p.code AS code,
      p.species AS species,
      p.status AS status,
      p.plantedAt AS plantedAt,
      g.id AS gridId,
      g.name AS gridName,
      c.name AS companyName,
      latestObservedAt,
      symptoms
  `,

  plantObservations: `
    MATCH (p:Plant {id: $plantId})-[:HAS_OBSERVATION]->(o:Observation)
    OPTIONAL MATCH (w:Worker)-[:RECORDED]->(o)
    OPTIONAL MATCH (o)-[:SHOWS]->(s:Symptom)
    WITH o, w, collect(DISTINCT s.name) AS symptoms
    RETURN
      o.id AS id,
      o.observedAt AS observedAt,
      o.severity AS severity,
      o.healthScore AS healthScore,
      o.notes AS notes,
      coalesce(w.name, 'Unknown recorder') AS workerName,
      symptoms
    ORDER BY o.observedAt DESC
  `,

  plantTreatments: `
    MATCH (p:Plant {id: $plantId})-[r:RECEIVED]->(t:Treatment)
    RETURN
      t.id AS id,
      t.name AS name,
      t.category AS category,
      r.appliedAt AS appliedAt,
      r.outcome AS outcome,
      r.dosage AS dosage
    ORDER BY r.appliedAt DESC
  `,

  // WHAT: Finds other trees that share a symptom with the selected tree.
  // HOW: Traverses Plant -> Observation -> Symptom <- Observation <- Plant.
  // DO: Keep the traversal relationship-driven; this is a core graph-database example.
  // DON'T: Replace it with a precomputed direct plant-to-plant link just for convenience.
  sameSymptomTraversal: `
    MATCH (source:Plant {id: $plantId})
      -[:HAS_OBSERVATION]->(:Observation)
      -[:SHOWS]->(symptom:Symptom)
      <-[:SHOWS]-(:Observation)
      <-[:HAS_OBSERVATION]-(other:Plant)
    MATCH (company:Company)-[:OWNS]->(grid:Grid)-[:CONTAINS]->(other)
    WHERE other.id <> source.id
    RETURN
      other.id AS id,
      other.code AS code,
      other.species AS species,
      other.status AS status,
      grid.id AS gridId,
      grid.name AS gridName,
      company.name AS companyName,
      symptom.name AS symptomName
  `,

  // WHAT: Finds trees connected by the NEAR relationship.
  // HOW: Traverses the direct Plant-[:NEAR]-Plant edge and returns tree context.
  // DO: Treat it as proximity evidence.
  // DON'T: Assume NEAR means the same thing as sharing a symptom or treatment.
  nearbyPlants: `
    MATCH (source:Plant {id: $plantId})-[:NEAR]-(other:Plant)
    MATCH (company:Company)-[:OWNS]->(grid:Grid)-[:CONTAINS]->(other)
    OPTIONAL MATCH (other)-[:HAS_OBSERVATION]->(o:Observation)-[:SHOWS]->(s:Symptom)
    WITH other, company, grid, max(o.observedAt) AS latestObservedAt, collect(DISTINCT s.name) AS symptoms
    RETURN
      other.id AS id,
      other.code AS code,
      other.species AS species,
      other.status AS status,
      grid.id AS gridId,
      grid.name AS gridName,
      company.name AS companyName,
      latestObservedAt,
      symptoms
  `,

  // WHAT: Finds trees that received the same treatment.
  // HOW: Traverses Plant -> Treatment <- Plant.
  // DO: Keep treatment as its own evidence category.
  // DON'T: Treat shared treatment as proof that two trees have the same health problem.
  sharedTreatments: `
    MATCH (source:Plant {id: $plantId})-[:RECEIVED]->(t:Treatment)<-[:RECEIVED]-(other:Plant)
    MATCH (company:Company)-[:OWNS]->(grid:Grid)-[:CONTAINS]->(other)
    WHERE other.id <> source.id
    OPTIONAL MATCH (other)-[:HAS_OBSERVATION]->(o:Observation)-[:SHOWS]->(s:Symptom)
    WITH other, company, grid, t, max(o.observedAt) AS latestObservedAt, collect(DISTINCT s.name) AS symptoms
    RETURN
      other.id AS id,
      other.code AS code,
      other.species AS species,
      other.status AS status,
      grid.id AS gridId,
      grid.name AS gridName,
      company.name AS companyName,
      latestObservedAt,
      symptoms,
      t.id AS treatmentId,
      t.name AS treatmentName
  `,

  // WHAT: Finds cross-area cases where the same worker recorded the same symptom.
  // HOW: Traverses Grid -> Plant -> Observation <- Worker -> Observation <- Plant <- Grid
  //      while both observations point to the same Symptom node.
  // DO: Keep the different-grid condition; it demonstrates a useful multi-hop graph query.
  // DON'T: Describe this as a direct worker-to-plant relationship because it is not one.
  crossGridWorkerTrace: `
    MATCH (sourceGrid:Grid)-[:CONTAINS]->(source:Plant {id: $plantId})
    MATCH (source)-[:HAS_OBSERVATION]->(sourceObs:Observation)<-[:RECORDED]-(worker:Worker)
    MATCH (sourceObs)-[:SHOWS]->(symptom:Symptom)
    MATCH (worker)-[:RECORDED]->(otherObs:Observation)<-[:HAS_OBSERVATION]-(other:Plant)<-[:CONTAINS]-(otherGrid:Grid)
    MATCH (otherObs)-[:SHOWS]->(symptom)
    WHERE other.id <> source.id AND otherGrid.id <> sourceGrid.id
    RETURN DISTINCT
      worker.name AS workerName,
      symptom.name AS symptomName,
      sourceGrid.name AS sourceGrid,
      otherGrid.name AS targetGrid,
      other.id AS targetPlantId,
      other.code AS targetPlantCode,
      otherObs.observedAt AS observedAt
    ORDER BY observedAt DESC
    LIMIT $limit
  `,

  healthProbe: `RETURN $message AS message`,
} as const;
