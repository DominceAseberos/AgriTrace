# AgriTrace

**Graph-backed agarwood tree health investigation built with Next.js and CognoDB.**

AgriTrace is a focused take-home project for **agarwood plantations**, specifically `Aquilaria malaccensis` and `Aquilaria crassna`. Instead of treating each tree as an isolated row, it models relationships between agarwood trees, inspections, symptoms, treatments, workers, growing areas, and farms so a supervisor can investigate **why multiple tree cases may be connected**.

**Repository:** https://github.com/DominceAseberos/AgriTrace  
**Vercel production deployment:** https://agritrace-xi.vercel.app

> The production build is deployed successfully. Before reviewer use, configure `COGNODB_URI`, `COGNODB_USERNAME`, and `COGNODB_PASSWORD` in the Vercel project environment and redeploy so the hosted app can reach CognoDB.

The central workflow is **Check Related Trees**: select an affected agarwood tree, then review related trees through shared symptoms, physical proximity, treatment history, and cross-area worker-recording paths.

## Screenshots

### Dashboard

![AgriTrace dashboard](docs/screenshots/dashboard.png)

### Agarwood tree list

![AgriTrace plant explorer](docs/screenshots/plants.png)

### Agarwood tree detail

![AgriTrace plant detail](docs/screenshots/plant-detail.png)

### Related-tree investigation

![AgriTrace related-tree investigation](docs/screenshots/investigation.png)

### Responsive mobile views

| Overview | Tree list | Tree details | Related trees |
| --- | --- | --- | --- |
| ![Mobile overview](docs/screenshots/dashboard-mobile.png) | ![Mobile tree list](docs/screenshots/plants-mobile.png) | ![Mobile tree detail](docs/screenshots/plant-detail-mobile.png) | ![Mobile related trees](docs/screenshots/investigation-mobile.png) |

The optional connection map is also captured separately in `docs/screenshots/investigation-map.png`.

## Why a graph database?

The interesting questions in AgriTrace are not about a single agarwood tree record. They are about **paths across connected evidence**.

Examples:

- Which other agarwood trees have inspections showing the same symptom?
- Which nearby agarwood trees also received the same treatment?
- Which cases are related through more than one signal?
- Did the same worker record the same symptom in different grids?
- Which treatment relationships led to improved, stable, or declined outcomes?

A relational design can represent all of this, but the application would need several tables and join tables, then increasingly complex joins or recursive queries as the investigation depth grows. In CognoDB, those connections are first-class relationships and can be traversed directly with Cypher.

AgriTrace also stores facts on relationships themselves. For example, `RECEIVED` carries `appliedAt`, `dosage`, and `outcome`, while `NEAR` carries `distanceMeters`.

## Graph data model

```mermaid
graph LR
  C[Company] -->|OWNS| G[Grid]
  G -->|CONTAINS| P[Plant]
  P -->|HAS_OBSERVATION| O[Observation]
  O -->|SHOWS| S[Symptom]
  W[Worker] -->|RECORDED| O
  P -->|RECEIVED| T[Treatment]
  P -->|NEAR| P2[Plant]
```

### Node labels

| Label | Purpose | Example properties |
| --- | --- | --- |
| `Company` | Farm or organization | `id`, `name`, `location` |
| `Grid` | Agricultural section | `id`, `name`, `areaHectares` |
| `Plant` | Internal graph label representing an agarwood tree | `id`, `code`, `species`, `status`, `plantedAt` |
| `Observation` | Field inspection | `id`, `observedAt`, `severity`, `healthScore`, `notes` |
| `Symptom` | Observed health signal | `id`, `name`, `category` |
| `Treatment` | Intervention | `id`, `name`, `category` |
| `Worker` | Person who recorded an observation | `id`, `name`, `role` |

### Relationship types

| Relationship | Meaning | Properties |
| --- | --- | --- |
| `OWNS` | Company owns a grid | — |
| `CONTAINS` | Grid contains a plant | — |
| `HAS_OBSERVATION` | Plant has an observation | — |
| `SHOWS` | Observation shows a symptom | — |
| `RECORDED` | Worker recorded an observation | — |
| `RECEIVED` | Plant received a treatment | `appliedAt`, `dosage`, `outcome` |
| `NEAR` | Plant is spatially near another plant | `distanceMeters` |

## Main graph queries

All application queries are parameterized through the official Neo4j JavaScript driver. User-controlled values are passed as query parameters; Cypher is not built by string concatenation.

### 1. Multi-hop traversal: plants with the same symptom

This satisfies the required traversal of two hops or more.

Path:

```text
Plant
  → HAS_OBSERVATION
Observation
  → SHOWS
Symptom
  ← SHOWS
Observation
  ← HAS_OBSERVATION
Plant
```

Cypher:

```cypher
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
```

This is a four-relationship traversal between the source plant and a related plant.

### 2. Relationally awkward query: cross-grid worker trace

This query asks:

> Did the same worker record the same symptom in another grid?

Path:

```text
Source Grid
  → Plant
  → Observation
  ← Worker
  → Observation
  ← Plant
  ← Target Grid

Both observations → same Symptom
```

Cypher:

```cypher
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
```

This is the most graph-native investigation query in the project. In a relational schema it would require several joins across grids, plants, observations, workers, symptoms, and association tables, while the graph expresses the path directly.

### 3. Shared treatment traversal

```cypher
MATCH (source:Plant {id: $plantId})-[:RECEIVED]->(t:Treatment)<-[:RECEIVED]-(other:Plant)
```

This lets AgriTrace rank plants that received the same treatment as another piece of related-case evidence.

### 4. Treatment relationship insights

The `RECEIVED` edge stores outcome data, so the application can aggregate improvement/stability/decline directly from the relationship:

```cypher
MATCH (t:Treatment)<-[r:RECEIVED]-(p:Plant)
RETURN
  t.id AS id,
  t.name AS name,
  count(DISTINCT p) AS cases,
  sum(CASE WHEN r.outcome = 'improved' THEN 1 ELSE 0 END) AS improved,
  sum(CASE WHEN r.outcome = 'stable' THEN 1 ELSE 0 END) AS stable,
  sum(CASE WHEN r.outcome = 'declined' THEN 1 ELSE 0 END) AS declined
```

## How related cases are ranked

AgriTrace combines several graph signals instead of showing every connected node with equal importance.

- Shared symptom: weight `3`
- Direct `NEAR` relationship: weight `3`
- Shared treatment: weight `2`
- Cross-grid worker trace: weight `4`

The combined score is converted to a simple strength label:

- `high`: score 7+
- `moderate`: score 4–6
- `weak`: score below 4

The related-tree screen explains each reason in plain language so a non-technical user can understand why a tree surfaced.

## Seed dataset

The included seed script creates realistic deterministic data small enough for the CognoDB free tier while still producing meaningful graph patterns.

Current seed:

- 2 companies
- 6 grids
- 72 agarwood trees across two species
- 8 workers
- 8 symptoms
- 7 treatments
- inspections for every tree, with extra follow-up inspections for trees marked Needs attention or Urgent
- 66 `NEAR` relationships across grid neighbors
- treatment relationships with dosage and outcome properties

The seed is repeatable and uses `MERGE` for node/relationship creation.

Running with `--reset` removes only nodes marked with `agriTraceSeed = true`, so it does not delete arbitrary data from the CognoDB instance.

## Live validation snapshot

The project has been tested against a real CognoDB Cloud instance.

```text
CognoDB connectivity: OK
Seed complete: 72 plants, 198 outgoing plant relationships.
CognoDB smoke test: OK
Plants: 72
Critical cases: 8
Related cases for sample investigation: 14
Cross-grid worker traces: 3
```

## Technology stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- CognoDB Cloud
- Official `neo4j-driver`
- Cypher over Bolt/TLS
- `@xyflow/react` for graph visualization
- Zod for environment validation
- Lucide React icons
- Vercel for hosting

## Application structure

```text
src/
  app/
    api/health/          Safe database health endpoint
    plants/              Plant explorer and plant detail
    investigate/         Multi-hop graph investigation
    insights/            Treatment relationship insights
    page.tsx              Dashboard
  components/
    investigation-graph.tsx
    site-shell.tsx
    state-panels.tsx
    status-pill.tsx
  lib/cognodb/
    driver.ts             Neo4j driver singleton and sessions
    env.ts                Server-side environment validation
    errors.ts             Safe database error normalization
    queries.ts            Parameterized Cypher query catalog
    service.ts            Application data/query layer
    seed-data.ts          Deterministic realistic seed data
    types.ts              Typed domain/result contracts
scripts/
  seed.ts                 Seed/reset graph data
  health.ts               Secret-safe connectivity test
  smoke.ts                End-to-end graph smoke test
  capture.ts              Local screenshot capture helper
docs/screenshots/         README screenshots
```

## CognoDB Cloud setup

1. Create an account at `https://console.cognodb.com/signup`.
2. Create a free `c0` instance.
3. Save the generated password immediately; CognoDB displays it once.
4. Copy the connection URI, username, and password into a local `.env.local` file.

Start from the included example:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then set:

```env
COGNODB_URI=bolt+s://your-instance.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your-password
```

Never commit `.env.local` or downloaded CognoDB credential files. The repository `.gitignore` excludes `.env`, `.env.*`, `.env/`, and `.env.local`, while allowing `.env.example`.

## Run locally

### Requirements

- Node.js 20+ recommended
- A running CognoDB Cloud instance

### Install

```bash
npm install
```

### Verify database connectivity

```bash
npm run db:health
```

Expected output:

```text
CognoDB connectivity: OK
```

### Seed the graph

```bash
npm run seed -- --reset
```

The reset flag is optional. Without it, the script reuses the existing seeded nodes through `MERGE`.

### Run the smoke test

```bash
npm run db:smoke
```

This verifies dashboard data, critical plant retrieval, the related-case investigation, and the cross-grid worker trace.

### Start development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The current implementation passes all three commands and `npm install` reports no known vulnerabilities at the time of submission preparation.

## Error handling

Database failures are normalized into safe application errors.

The UI includes explicit:

- loading states
- empty states
- not-found states
- database-unreachable states

The health endpoint returns only:

```json
{ "ok": true, "database": "reachable" }
```

or a `503` response with `database: "unreachable"`. Connection details and passwords are never returned to the client.

## UX approach

The app intentionally does not open with a raw graph canvas. A non-technical user first sees an agarwood health overview, urgent trees, clear status labels, and plain-language reasons. The visual connection map is optional and secondary.

The graph visualization appears only as an optional **Show connection map** section during **Check Related Trees**. The decision summary, evidence counts, and trees to check first all appear before the map.

This keeps the graph database central to the product without making the database model itself the interface.

## Demo walkthrough

A short reviewer flow:

1. Open **Overview** and see the Urgent and Needs attention counts first.
2. Open **Agarwood trees** and filter by status or Aquilaria species.
3. Open a tree and review its plain-language inspection and treatment history.
4. Click **Check related trees**.
5. Review the summary and **Trees to check first** before opening any visualization.
6. Optionally expand **Show connection map** to inspect the underlying paths.
7. Open **Treatment results** to compare how treated trees responded.

## Submission checklist

- [x] CognoDB used as the persistent database layer
- [x] Official Neo4j JavaScript driver
- [x] Labeled nodes and typed relationships
- [x] Relationship properties
- [x] Realistic repeatable seed script
- [x] Parameterized Cypher queries
- [x] Multi-hop traversal of 2+ hops
- [x] Relationally awkward graph query
- [x] Functional non-technical web application
- [x] Intentional responsive UI
- [x] Loading, empty, not-found, and database error states
- [x] Environment-based secrets
- [x] Graceful database-unreachable handling
- [x] Graph model diagram
- [x] Main query explanations
- [x] UI screenshots
- [x] Production build validated
- [ ] Hosted demo URL
- [ ] Short screen recording

A production Vercel deployment exists at `https://agritrace-xi.vercel.app`, but the hosted-demo checkbox remains open until the CognoDB environment variables are configured in Vercel and the live database flow is re-verified. The short screen recording is the other remaining manual submission artifact.

## Security notes

- No CognoDB URI, username, or password is committed.
- Server environment parsing lives in `src/lib/cognodb/env.ts`.
- Database credentials never enter client components.
- Cypher input values are passed through driver parameters such as `$plantId`, `$limit`, `$query`, and `$status`.
- Database connection errors are converted to user-safe messages.

## License

This repository was created as a candidate take-home assignment for Wexa AI.
