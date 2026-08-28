# AgriTrace — What Each Core Part Does

This file is a quick guide to the important parts of the codebase.

Use it when reviewing the project or before changing a feature.

---

## `src/lib/cognodb/driver.ts`

**WHAT:**
Connects AgriTrace to CognoDB using the official Neo4j driver.

**HOW:**
- Creates one reusable driver connection.
- Opens short-lived read or write sessions when database work is needed.
- Closes every session after the operation finishes.
- Provides a small database health check.

**DO:**
- Use `withReadSession()` for read-only queries.
- Use `withWriteSession()` for future create/update/delete operations.
- Always close temporary sessions.
- Keep credentials inside environment variables.

**DON'T:**
- Do not create a new Neo4j driver for every request.
- Do not put CognoDB credentials directly in source code.
- Do not leave sessions open.

---

## `src/lib/cognodb/queries.ts`

**WHAT:**
Contains the Cypher queries AgriTrace sends to CognoDB.

**HOW:**
The queries describe graph patterns using nodes and relationships such as:

```text
Company -> Grid -> Plant -> Observation -> Symptom
                     |
                     -> Treatment

Worker -> Observation
Plant  -> NEAR -> Plant
```

Main queries include:
- dashboard totals
- tree search and filters
- tree details
- shared symptoms
- nearby trees
- shared treatments
- same-worker cross-area traces

**DO:**
- Use parameters like `$plantId`, `$query`, and `$limit`.
- Keep each query focused on one clear purpose.
- Use graph paths when the question is about relationships.

**DON'T:**
- Do not concatenate user input into a Cypher string.
- Do not replace a clear traversal with application-side manual matching when CognoDB can traverse it directly.
- Do not change relationship names without updating the seed data and service logic that depend on them.

---

## Parameterized queries

**WHAT:**
Runtime values are passed separately from the Cypher query.

**HOW:**
Example:

```ts
session.run(QUERIES.plantCore, { plantId });
```

The Cypher uses:

```cypher
MATCH (p:Plant {id: $plantId})
```

**DO:**
Pass values through the second argument of `session.run()`.

**DON'T:**
Do not write queries like:

```ts
`MATCH (p:Plant {id: '${plantId}'})`
```

---

## `src/lib/cognodb/service.ts`

**WHAT:**
Acts as the middle layer between CognoDB and the UI.

**HOW:**
It:
- runs the Cypher queries
- converts Neo4j records into normal TypeScript objects
- handles database errors
- combines related-tree evidence
- calculates the related-tree score
- creates the small graph payload used by the visual connection map

The investigation runs four relationship checks:

```text
Same symptom
Nearby / same area
Same treatment
Same worker trace
```

A tree may match more than one reason.

Current evidence weights are:

```text
Same worker trace = 4
Same symptom      = 3
Nearby            = 3
Same treatment    = 2
```

**DO:**
- Keep database records converted into typed application objects here.
- Add new relationship evidence here if a new graph query is introduced.
- Keep scoring logic separate from the Cypher query itself.

**DON'T:**
- Do not describe the score as statistical confidence; it is an application ranking rule.
- Do not make the React UI responsible for deciding which trees are related.
- Do not duplicate the same related tree when it matches multiple reasons; merge its reasons.

---

## Shared-symptom traversal

**WHAT:**
Finds other trees that have an observation showing the same symptom as the selected tree.

**HOW:**
CognoDB follows this path:

```text
Selected Plant
    ↓ HAS_OBSERVATION
Observation
    ↓ SHOWS
Symptom
    ↑ SHOWS
Observation
    ↑ HAS_OBSERVATION
Other Plant
```

The two trees do not need a direct connection to each other.

**DO:**
Think of this as a multi-hop graph traversal.

**DON'T:**
Do not say the two trees are directly linked by a `SAME_SYMPTOM` relationship. The relationship is discovered through their observations and the shared symptom node.

---

## Cross-area worker trace

**WHAT:**
Finds cases where the same worker recorded the same symptom on another tree in another growing area.

**HOW:**
The path is roughly:

```text
Source Grid
    ↓
Source Plant
    ↓
Observation
    ↑
Worker
    ↓
Other Observation
    ↓
Other Plant
    ↑
Other Grid
```

Both observations also connect to the same symptom.

**DO:**
Use this as the main example of a graph query that would require several joins in a relational database.

**DON'T:**
Do not say the worker caused the symptom. The graph only shows that the same worker recorded both observations.

---

## `src/app/api/plants/route.ts`

**WHAT:**
Provides the live tree-list API used by search and filters.

**HOW:**
The browser sends values such as:

```text
q=AG-011
status=critical
species=Aquilaria crassna
```

The API passes them to `getPlants()`, which runs the parameterized CognoDB query.

**DO:**
- Keep this endpoint read-only unless its purpose is intentionally changed.
- Return useful error codes when CognoDB is unavailable.
- Keep responses uncached when fresh filtering is expected.

**DON'T:**
- Do not filter the complete dataset only in the browser.
- Do not expose database credentials to the frontend.

---

## `src/components/tree-browser.tsx`

**WHAT:**
Controls the searchable and filterable Agarwood Trees list.

**HOW:**
- Search waits briefly before querying so every keystroke does not create a request.
- Status and species changes query immediately.
- Only the results area shows a skeleton while waiting.
- Previous requests are cancelled when a newer search starts.
- The URL updates without refreshing the whole page.

**DO:**
- Keep the page in place while only the result list updates.
- Keep a visible loading state.
- Keep the URL synchronized so filtered views remain shareable.

**DON'T:**
- Do not restore a full-page refresh for filters.
- Do not bring back a required `Show results` button.
- Do not remove request cancellation when live search is enabled.

---

## `src/components/investigation-graph.tsx`

**WHAT:**
Draws the Related Trees connection map.

**HOW:**
CognoDB and `service.ts` determine the actual relationships first.

This component receives the prepared nodes and edges and uses React Flow to display them around the selected tree.

The relationship categories are:

```text
Same symptoms
Same worker
Nearby / same area
Same treatment
```

Clicking a category does not create a different graph. It keeps the complete graph visible and fades unrelated branches.

**DO:**
- Keep the selected tree easy to identify.
- Keep all relationship categories visually distinguishable.
- Keep focus mode as opacity changes rather than deleting the rest of the graph.
- Recenter after the graph container becomes visible or changes size.

**DON'T:**
- Do not say React Flow is the graph database.
- Do not calculate the real relationships inside this component.
- Do not hide all unrelated nodes when a category is selected.

---

## CognoDB vs React Flow

**WHAT:**
They have completely different jobs.

**HOW:**

```text
CognoDB
  -> stores nodes and relationships
  -> runs Cypher
  -> discovers connected paths

service.ts
  -> combines and ranks the returned evidence

React Flow
  -> displays those results as a graph
```

**DO:**
Say: "CognoDB is the graph database; React Flow is only the visualization layer."

**DON'T:**
Do not say React Flow finds or stores the relationships.

---

## `scripts/seed.ts`

**WHAT:**
Loads the realistic demonstration dataset into CognoDB.

**HOW:**
- Creates uniqueness constraints when supported.
- Uses `UNWIND` to load batches efficiently.
- Uses `MERGE` with stable IDs so repeated runs do not create duplicate seed nodes.
- Creates the graph relationships after the nodes exist.
- Runs the write operations inside a transaction.

**DO:**
- Keep seed IDs stable.
- Use parameters for rows passed to Cypher.
- Keep reset limited to AgriTrace seed data.

**DON'T:**
- Do not use a reset command that deletes unrelated data from the CognoDB instance.
- Do not replace `MERGE` with unconditional `CREATE` for repeatable seed records unless duplicates are intentionally wanted.

---

## Current live-data status

**WHAT:**
AgriTrace currently reads live data from CognoDB, but normal users do not yet create farm records from the web UI.

**HOW:**
Current production features query the live database for:
- overview statistics
- tree records
- live search and filters
- tree history
- treatment results
- related-tree traversals

Seed/import code currently provides the main data-writing flow.

**DO:**
For future live field entry, add authenticated write APIs using `withWriteSession()` for observations, symptoms, treatments, and worker attribution.

**DON'T:**
Do not claim the current take-home already includes a complete authenticated live farm data-entry system.
