# Claude Code Prompt Playbook — React Rebuild Project

## 0. Start Session / Load Context

Use this at the beginning of every new Claude Code session.

```text
Read the project context before doing anything.

First read:
- CLAUDE.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/PROGRESS.md
- docs/API_CONTRACTS.md if it exists
- docs/DATA_MODEL.md if it exists

Then summarize:
1. What this project is.
2. Current implementation status.
3. Current architecture.
4. Current open questions.
5. What should be done next.

Do not write code yet.
Do not modify files yet.
```

---

## 1. Plan A New Feature / Screen

Use this before building any page, tab, table, map, dashboard or complex component.

```text
Use the react-architecture skill.

I want to plan the following feature/screen:

[DESCRIBE FEATURE HERE]

Relevant context:
- Figma screen/frame: [ADD FIGMA NAME OR DESCRIPTION]
- Route: [ADD ROUTE IF KNOWN]
- Main user flow: [ADD FLOW]
- APIs involved: [ADD API NAMES OR SAY UNKNOWN]
- State involved: [ADD FILTERS / SELECTED ITEMS / MODES / ETC.]
- Special areas:
  - Table: yes/no
  - Map: yes/no
  - Dashboard/charts: yes/no
  - Forms: yes/no

Your task:
1. Read the relevant docs and existing code patterns.
2. Do not implement yet.
3. Produce a React Architecture Plan.
4. Include component hierarchy, state ownership, API/proxy boundaries, query plan, Jotai plan, testing strategy, risks, and open questions.
5. If information is missing, ask focused blocking questions.
6. Wait for my approval before implementation.
```

---

## 2. Plan State Management

Use this when a screen has filters, selected rows, map layers, tabs, dashboard filters, shared UI state or server data.

```text
Use the jotai-and-react-query-state skill.

I need to design state management for this feature:

[DESCRIBE FEATURE HERE]

Known state:
- [STATE ITEM 1]
- [STATE ITEM 2]
- [STATE ITEM 3]

Known server data:
- [API DATA 1]
- [API DATA 2]

Your task:
1. Classify every state item as local state, Jotai, React Query, URL state, or derived state.
2. Do not store server data in Jotai.
3. Define query keys for all server data.
4. Define atoms only where shared client/UI state is really needed.
5. Define invalidation and optimistic update strategy for mutations.
6. Return a state ownership table and proposed file structure.
7. Do not implement yet.
```

---

## 3. Plan API Proxy / BFF

Use this when adding or changing requests to the server.

```text
Use the api-proxy-bff-design skill.

I need to design the proxy/BFF layer for the following frontend API needs:

Frontend flow:
[DESCRIBE FLOW]

Needed backend operations:
- [OPERATION 1]
- [OPERATION 2]

Known backend API details:
- Method/path: [IF KNOWN]
- Request params/body: [IF KNOWN]
- Response shape: [IF KNOWN]
- Error behavior: [IF KNOWN]

Your task:
1. Design the frontend-facing proxy/BFF endpoints.
2. Define request/response schemas.
3. Define error normalization.
4. Define timeout/retry behavior if relevant.
5. Define auth/header handling without exposing secrets.
6. Define logging/observability requirements.
7. Update or propose updates to docs/API_CONTRACTS.md.
8. Do not implement until I approve the design.
```

---

## 4. Plan MUI Components / Styling

Use this before building reusable UI or matching Figma.

```text
Use the mui-component-and-styling skill.

I need to design the UI implementation for this Figma screen/component:

[DESCRIBE FIGMA SCREEN OR COMPONENT]

Requirements:
- Use MUI components where appropriate.
- Use the existing theme.
- Use CSS only where it improves clarity.
- Keep components reusable but not over-abstracted.
- Ensure accessibility.
- Support loading, empty, error and disabled states.

Your task:
1. Map Figma sections to MUI components.
2. Suggest reusable components.
3. Identify theme tokens needed.
4. Identify where CSS is needed.
5. Identify accessibility requirements.
6. Return a component/styling plan.
7. Do not implement yet.
```

---

## 5. Plan Large Table

Use this for TanStack Table, filters, sorting, pagination, row actions or virtualization.

```text
Use the tanstack-table-and-virtualization skill.

I need to design a large data table for:

[DESCRIBE TABLE PURPOSE]

Requirements:
- TanStack Table
- Large dataset support
- Server-side pagination/filtering/sorting where needed
- Row actions: [LIST ACTIONS]
- Bulk actions: [LIST OR NONE]
- Column visibility/pinning: [YES/NO]
- Virtualization: [YES/NO/UNSURE]

Data source:
- API endpoint: [ADD IF KNOWN]
- Response model: [ADD IF KNOWN]
- Filters: [LIST]
- Sorting: [LIST]
- Pagination: [LIST]

Your task:
1. Design the table architecture.
2. Define column definition strategy.
3. Define table state ownership.
4. Define query keys and server parameters.
5. Define virtualization strategy.
6. Define loading, empty, error and permission states.
7. Define tests.
8. Do not implement yet.
```

---

## 6. Plan Map / OpenLayers Abstraction

Use this for maps, layers, markers, polygons, overlays or EPSG:4326.

```text
Use the map-engine-and-abstraction skill.

I need to design a map module for:

[DESCRIBE MAP FEATURE]

Requirements:
- Use a free map library.
- OpenLayers is the preferred option.
- Support EPSG:4326.
- Support reusable layers.
- Hide OpenLayers complexity behind a high-level abstraction.
- Feature developers should not need to understand OpenLayers internals.
- Support high-scale rendering where needed.

Map data:
- Points: [YES/NO]
- Lines/polygons: [YES/NO]
- Layers: [LIST]
- Overlays/popups: [YES/NO]
- Clustering: [YES/NO/UNSURE]
- Backend APIs: [LIST IF KNOWN]

Your task:
1. Design MapCore.
2. Define MapProvider / MapView.
3. Define layer/source/interaction/overlay APIs.
4. Define state ownership for visible layers and selected features.
5. Define performance strategy for large data.
6. Define folder structure.
7. Define tests.
8. Do not implement yet.
```

---

## 7. Plan Dashboard / Charts

Use this for KPI cards, graphs, analytics tabs and dashboards.

```text
Use the dashboard-and-charts-design skill.

I need to design a dashboard/charts tab for:

[DESCRIBE DASHBOARD PURPOSE]

Requirements:
- KPIs: [LIST]
- Charts: [LIST TYPES IF KNOWN]
- Filters: [LIST]
- Time range: [YES/NO]
- Drill-down: [YES/NO]
- Large dataset: [YES/NO/UNSURE]
- Preferred libraries: MUI X Charts or Apache ECharts

Data:
- APIs: [LIST IF KNOWN]
- Aggregation: client/server/unknown
- Refresh/polling: [YES/NO]

Your task:
1. Choose the charting strategy and justify it.
2. Define dashboard layout.
3. Define reusable KPI/chart card components.
4. Define chart view models.
5. Define React Query/Jotai state strategy.
6. Define loading, empty and error states.
7. Define performance strategy.
8. Define tests.
9. Do not implement yet.
```

---

## 8. Implement Approved Plan

Use this only after you approve the architecture plan.

```text
Use the feature-implementation skill.

Implement the approved plan from the previous step.

Rules:
1. Work in small slices.
2. Before editing, restate the implementation steps.
3. Modify only the files required by the approved plan.
4. Do not introduce unrelated refactors.
5. After each meaningful step, run the relevant validation command:
   - npm run lint
   - npm run typecheck
   - npm test
   - npm run build
   Use pnpm equivalents if this project uses pnpm.
6. If a command fails, stop and explain the failure before continuing.
7. Add or update tests.
8. Update docs/PROGRESS.md at the end.
9. Do not change auth, proxy, security, or environment behavior unless explicitly approved.
```

---

## 9. Clean Code Review

Use this after implementation.

```text
Use the react-typescript-clean-code skill.

Review the implementation I just made.

Focus on:
- TypeScript strictness
- no any
- component boundaries
- hooks correctness
- state ownership
- React Query usage
- Jotai usage
- MUI/styling
- error handling
- performance
- testability
- unnecessary abstractions
- duplicated logic

Return:
1. Blockers
2. High priority issues
3. Medium priority issues
4. Low priority cleanup
5. Minimal fix plan
6. Files that should change
7. Validation commands to run

Do not fix automatically yet.
Wait for my approval.
```

---

## 10. Error Handling Review

Use this when the feature includes API calls, forms or mutations.

```text
Use the error-handling-and-validation skill.

Review error handling and validation for this feature:

[DESCRIBE FEATURE]

Check:
1. Are query functions throwing errors correctly?
2. Are backend/proxy errors normalized?
3. Are user-facing messages safe and clear?
4. Are loading, empty, error and success states implemented?
5. Are form validations complete?
6. Are validation errors accessible?
7. Are retries intentional?
8. Are internal details hidden from the user?
9. Are tests covering error and validation cases?

Return a prioritized fix plan.
Do not implement until approved.
```

---

## 11. Testing Plan / Add Tests

Use this after feature implementation or before PR.

```text
Use the react-testing skill.

Create or review the test plan for this feature:

[DESCRIBE FEATURE]

Test requirements:
- loading state
- empty state
- success state
- error state
- validation errors
- user actions
- permission/mode behavior
- API mocked with MSW
- React Query provider
- Jotai state if relevant
- MUI rendering
- table/map/dashboard behavior if relevant

Your task:
1. Identify required tests.
2. Identify missing tests.
3. Propose test file structure.
4. Write test cases only after I approve the test plan.
5. Focus on user behavior, not implementation details.
```

---

## 12. End Session / Update Progress

Use this at the end of every work session.

```text
Use the documentation-and-progress skill.

End this session properly.

Update:
- docs/PROGRESS.md
- docs/DECISIONS.md if any architecture decision was made
- docs/API_CONTRACTS.md if API behavior changed
- docs/ARCHITECTURE.md if architecture changed

Include:
1. What was completed.
2. What files were changed.
3. What tests were added or updated.
4. What validation commands were run and their result.
5. What decisions were made.
6. What is blocked.
7. What should be done next.
8. Open questions for the next session.

Do not invent progress.
Do not include secrets or sensitive values.
```

---

# Implementation Prompt — After Architecture Approval

Use the Claude Code skill: feature-implementation.
Follow the instructions in `.claude/skills/feature-implementation/SKILL.md` exactly.

We already approved the architecture plan for:

[FEATURE NAME]

Approved plan summary:
[PASTE THE APPROVED PLAN OR LINK TO THE PLAN FILE]

Your task is to implement the approved plan.

Rules:

1. Do not redesign the architecture unless you discover a blocker.
2. Do not introduce unrelated refactors.
3. Work in small implementation slices.
4. Before editing, list the exact files you will create or modify in this slice.
5. After each slice:

   * summarize what changed
   * run the relevant validation commands
   * stop if validation fails
6. Use the existing project conventions.
7. Keep files small and focused.
8. Use TypeScript strictly.
9. Do not use `any`.
10. Do not call APIs directly from UI components.
11. Use TanStack Query for server state.
12. Use Jotai only for shared client/UI state.
13. Use MUI and the existing theme.
14. Add or update tests.
15. Update `docs/PROGRESS.md` at the end.

Start with slice 1 only.

Slice 1 should be the minimal skeleton needed for the feature:

* route/page file if needed
* feature folder structure
* placeholder components
* basic types
* no complex logic yet

Do not continue to slice 2 until I approve slice 1.
