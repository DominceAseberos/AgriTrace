# AgriTrace Engineering Notes

This document explains the implementation choices that are easiest to forget when reading the code quickly. It is intended as a reviewer/interview reference, not as setup documentation.

## 1. Request flow

AgriTrace separates database, application, and presentation responsibilities:

```text
UI / Next.js page
      ↓
service.ts
      ↓
queries.ts + driver.ts
      ↓
CognoDB over Bolt
```

For the live tree filters, the flow is:

```text
TreeBrowser
  ↓ fetch
GET /api/plants
  ↓
getPlants()
  ↓
session.run(QUERIES.listPlants, parameters)
  ↓
CognoDB
```

The browser does not download all records and then filter them locally. Search, status, and species are evaluated by CognoDB.

## 2. CognoDB connection model

CognoDB is accessed with the official `neo4j-driver` because CognoDB supports openCypher over the Bolt protocol.

`driver.ts` keeps one reusable driver per server process. Individual operations create short-lived read or write sessions and close those sessions in `finally` blocks.

- `withReadSession()` is used by the current application queries.
- `withWriteSession()` is available for future authenticated live-data mutation flows.
- `verifyDatabase()` checks connectivity and executes a minimal parameterized Cypher round-trip.

## 3. Parameterized Cypher

All runtime values are passed separately from the Cypher string:

```ts
session.run(QUERIES.plantCore, { plantId });
```

The Cypher references the value as:

```cypher
MATCH (p:Plant {id: $plantId})
```

The application never concatenates user input into Cypher. This keeps query structure separate from data and avoids injection-prone string construction.

## 4. Graph model

The primary graph is:

```text
Company -[:OWNS]-> Grid -[:CONTAINS]-> Plant
Plant -[:HAS_OBSERVATION]-> Observation
Observation -[:SHOWS]-> Symptom
Worker -[:RECORDED]-> Observation
Plant -[:RECEIVED]-> Treatment
Plant -[:NEAR]-> Plant
```

Properties live where their meaning belongs. For example, treatment outcome, dose, and application date are properties of the `RECEIVED` relationship because they describe a particular tree receiving a particular treatment.

## 5. Important query patterns

### Shared symptom multi-hop traversal

```text
Plant
  ↓ HAS_OBSERVATION
Observation
  ↓ SHOWS
Symptom
  ↑ SHOWS
Observation
  ↑ HAS_OBSERVATION
Other Plant
```

The Cypher does not require a direct relationship between the two plants. Their connection is discovered through the shared symptom node.

### Nearby trees

`(source:Plant)-[:NEAR]-(other:Plant)` is a direct graph relationship and contributes proximity evidence.

### Shared treatment

```text
Plant -[:RECEIVED]-> Treatment <-[:RECEIVED]- Other Plant
```

### Cross-grid worker trace

This is the deliberately relationally awkward traversal:

```text
Source Grid
  ↓
Source Plant
  ↓
Source Observation
  ↑
Worker
  ↓
Other Observation
  ↓
Other Plant
  ↑
Other Grid
```

Both observations must also point to the same `Symptom`, and the target tree must be in a different grid.

## 6. Investigation aggregation and scoring

`getInvestigation()` runs four separate traversals:

1. same symptom
2. nearby tree
3. shared treatment
4. cross-grid worker trace

A related tree can be returned by more than one traversal. The service layer merges those reasons into one related-tree record rather than duplicating the tree.

Current evidence weights are application heuristics:

```text
same worker trace  = 4
same symptom       = 3
nearby             = 3
same treatment     = 2
```

The total is converted into `high`, `moderate`, or `weak` match strength. These values are not produced by CognoDB and should not be described as statistical confidence.

## 7. React Flow versus CognoDB

React Flow is only the visualization layer.

CognoDB discovers the relationships through Cypher. `service.ts` converts the returned evidence into a small graph payload, and `investigation-graph.tsx` lays that payload out radially.

The category controls use focus mode: they lower the opacity of unrelated branches instead of deleting nodes from the visualization. The complete network therefore stays visible while one relationship type is emphasized.

## 8. Live search behavior

The tree browser is client-interactive after the initial server render.

- Search input is debounced to avoid querying on every keystroke.
- Status and species filters query immediately.
- Previous requests are aborted when newer input arrives.
- Only the result region displays skeleton loading.
- `history.replaceState()` updates the URL without triggering a page navigation.
- `/api/plants` returns uncached data so the list reflects the current CognoDB state.

## 9. Seed and write behavior

The seed script writes nodes and relationships in a transaction and uses `MERGE` with stable IDs so repeated imports are deterministic.

The optional reset removes only nodes marked as AgriTrace seed data rather than deleting every node in the database.

The current take-home application is intentionally read/investigation focused. A real farm rollout would add authenticated write APIs using `withWriteSession()` for new observations, treatments, worker attribution, validation, and audit history.

## 10. Useful interview distinction

A concise way to describe the architecture is:

> CognoDB stores and traverses the graph. Cypher discovers the connected patterns. The service layer ranks and shapes the results. React Flow only renders the resulting network.
