# Claude Code Prompt Pack — Project Extraction

## Prompt 1 — Read-Only Project Audit

```text
You are analyzing an existing frontend project for the purpose of rebuilding it from scratch in a clean architecture.

Important constraints:
- Work in read-only mode.
- Do not modify files.
- Do not create code.
- Do not read, print, copy, or summarize secrets.
- Do not inspect `.env`, `.env.*`, secret files, tokens, private keys, certificates, or production credentials.
- Do not include real user data or sensitive operational data in the output.
- If you encounter sensitive names, values, URLs, tokens, or internal identifiers, replace them with safe placeholders.

Your task:
Analyze the repository and create a high-level technical inventory.

Return:
1. Project stack:
   - framework
   - language
   - package manager
   - build tool
   - UI library
   - state management
   - routing library
   - API client approach
   - testing tools

2. Project structure:
   - main folders
   - responsibility of each folder
   - important entry points

3. Main application areas:
   - pages/routes
   - major features
   - reusable components
   - layout/navigation structure

4. Data and API layer:
   - where API calls are defined
   - how requests are made
   - how responses are typed/transformed
   - where loading/error states are handled

5. State management:
   - global state
   - local state
   - server state/cache if exists
   - filters/search/pagination state

6. Current architecture problems:
   - large files/components
   - duplicated logic
   - unclear boundaries
   - mixed concerns
   - hardcoded values
   - weak typing
   - risky patterns

7. Rebuild implications:
   - what should be preserved as behavior
   - what should be redesigned
   - what must be clarified before rebuilding

Output format:
Create a structured Markdown report.
Do not include source code snippets longer than 10 lines.
Prefer descriptions, file paths, and extracted contracts over code.
```

---

## Prompt 2 — Extract Product Purpose And Business Flows

```text
You are extracting the business meaning of this frontend application so it can be rebuilt from scratch.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose secrets or real data.
- Replace sensitive names and values with safe placeholders.
- Focus on behavior and business flows, not implementation details.

Analyze routes, pages, components, forms, tables, buttons, modals, API usage, state transitions, and labels.

Return a Markdown document with:

1. Product purpose:
   - What the system is for
   - Who uses it
   - What business problem it solves

2. User roles / personas:
   - role name
   - what each role can see/do
   - role-specific restrictions if visible in code

3. Main user flows:
   For each flow:
   - flow name
   - entry screen/route
   - user actions
   - validations
   - API calls involved
   - success result
   - failure behavior
   - related screens

4. Business entities:
   - entity name
   - meaning
   - where it appears
   - main fields
   - statuses/enums
   - lifecycle/state transitions

5. Business rules:
   - validation rules
   - conditional UI rules
   - enable/disable rules
   - role-based rules
   - status-based rules
   - date/time rules
   - calculation/formatting rules

6. Open questions:
   - areas where the code is unclear
   - behavior that must be verified with product/backend owners

Do not propose a new implementation yet.
```

---

## Prompt 3 — Extract Screen Inventory

```text
You are creating a screen inventory for rebuilding this frontend application using Figma and clean code.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose secrets or real data.
- Use safe placeholders for sensitive labels or data.

Analyze all routes/pages and major screens.

For each screen, return:

1. Screen name
2. Route/path
3. Purpose
4. User role visibility if known
5. Main UI areas:
   - header
   - filters
   - actions
   - tables/lists
   - forms
   - dialogs/modals
   - side panels
   - tabs
6. Data displayed:
   - fields
   - labels
   - formatting
   - derived values
7. User actions:
   - buttons
   - row actions
   - bulk actions
   - form submissions
   - navigation actions
8. API calls:
   - on page load
   - on filter/search/pagination
   - on submit/action
9. UI states:
   - loading
   - empty
   - error
   - success
   - disabled
10. Important implementation notes:
   - complex conditions
   - duplicated logic
   - unclear behavior
11. Rebuild recommendation:
   - suggested clean component breakdown
   - what should be reusable

Output as a Markdown table plus details per screen.
```

---

## Prompt 4 — Extract API Contracts

```text
You are extracting API contracts used by the frontend so the application can be rebuilt against the same backend.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose secrets, real tokens, credentials, production URLs, or real user data.
- Replace base URLs, IDs, tokens, and sensitive values with placeholders.
- Do not include classified/sensitive payload values.
- Use dummy examples only.

Analyze all API calls in the frontend:
- axios/fetch clients
- service files
- hooks
- state actions
- generated clients
- request builders
- interceptors
- error handlers

For each API endpoint, extract:

1. Endpoint ID
2. Purpose
3. Method
4. Path using placeholders
5. Called from:
   - screen
   - component/hook/service
6. Trigger:
   - page load
   - filter change
   - submit
   - polling
   - user action
7. Auth/header requirements without exposing actual values
8. Query params:
   - name
   - type
   - required/optional
   - meaning
9. Path params:
   - name
   - type
   - meaning
10. Request body schema:
   - field
   - type
   - required/optional
   - meaning
11. Response schema:
   - field
   - type
   - meaning
   - nested objects/arrays
12. Error responses:
   - status code
   - frontend behavior
13. Loading/retry/polling behavior
14. Data transformations performed in the frontend
15. Screens or flows depending on this API
16. Open questions or uncertain fields

Also create:
- a list of all shared DTOs/types inferred from API usage
- a list of enums/status values
- a list of APIs that are unclear or inconsistently used

Do not generate new API client code.
Only produce the contract documentation.
```

---

## Prompt 5 — Extract Data Model And Type System

```text
You are extracting the frontend data model and type system so the project can be rebuilt cleanly.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose real data.
- Replace sensitive values with safe placeholders.

Analyze TypeScript interfaces, types, models, DTOs, API responses, form schemas, table columns, enum usage, constants, and transformations.

Return:

1. Entity catalog:
   For each entity:
   - entity name
   - business meaning
   - source API
   - screens where used
   - fields:
     - name
     - type
     - required/optional
     - business meaning
     - formatting/display rules
     - validation rules
     - default value if any

2. DTO mapping:
   - API DTO
   - frontend model
   - transformations between them

3. Enums and statuses:
   - enum/status name
   - possible values
   - display labels
   - business meaning
   - allowed transitions if visible

4. Form models:
   - form name
   - fields
   - validation
   - submit payload
   - error handling

5. Table/list models:
   - table name
   - columns
   - filters
   - sorting
   - pagination
   - row actions

6. Data quality issues:
   - inconsistent types
   - nullable fields
   - duplicated models
   - weak any usage
   - magic strings
   - unclear transformations

Do not write implementation code.
```

---

## Prompt 6 — Extract State, Permissions, And UI Logic

```text
You are extracting application state, permissions, and conditional UI behavior.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose secrets or real user data.
- Replace sensitive values with placeholders.

Analyze:
- state management
- hooks
- stores
- route guards
- role checks
- conditional rendering
- disabled buttons
- status-based UI behavior
- feature flags
- mode switching
- filters/search/pagination
- local storage/session storage usage

Return:

1. Global state:
   - state name
   - purpose
   - owner module
   - where read
   - where updated

2. Page-level state:
   - screen
   - filters
   - selected items
   - modals
   - loading/error flags
   - pagination/sorting

3. Permissions:
   - roles
   - allowed actions
   - restricted actions
   - UI behavior when unauthorized

4. Conditional UI rules:
   - condition
   - UI effect
   - business meaning
   - source file/reference

5. Modes:
   - mode name
   - what changes in the UI
   - what changes in API calls
   - what changes in validation/data model

6. Persistence:
   - localStorage/sessionStorage keys
   - meaning
   - risk
   - whether needed in rebuild

7. Rebuild recommendations:
   - what should be global state
   - what should be URL state
   - what should be server cache
   - what should remain local component state
```

---

## Prompt 7 — Extract Error Handling, Edge Cases, And Validation

```text
You are extracting error handling, validation, and edge-case behavior from the frontend.

Constraints:
- Read-only mode.
- Do not modify files.
- Do not expose real data or secrets.

Analyze:
- form validations
- API error handling
- toast/snackbar messages
- error pages
- empty states
- loading states
- retry behavior
- disabled states
- fallback values
- date/time edge cases
- network failure behavior

Return:

1. Validation rules by screen/form.
2. Error handling by API.
3. Error messages shown to users.
4. Empty state behavior by screen.
5. Loading behavior by screen/action.
6. Retry/polling behavior.
7. Edge cases handled in code.
8. Edge cases not handled but should be.
9. Rebuild acceptance criteria for error/empty/loading states.

Use safe placeholders for any sensitive labels or values.
```

---

## Prompt 8 — Map Existing App To Figma

```text
You are mapping the existing frontend behavior to the available Figma design.

Constraints:
- Read-only mode for the codebase.
- Do not modify files.
- Do not expose real data or secrets.
- If Figma files/images are available locally, use them only for UI mapping and do not copy sensitive data.

Create a mapping document:

For each Figma screen:
1. Figma screen/frame name
2. Matching existing route/page
3. Matching existing components if any
4. Data required for the screen
5. API calls required
6. User actions
7. UI states required:
   - loading
   - empty
   - error
   - success
   - disabled
8. Differences between Figma and current implementation
9. Missing behavior not represented in Figma
10. Rebuild notes:
   - components to create
   - shared components
   - layout rules
   - responsive behavior if visible

If Figma cannot be accessed directly, create a checklist of what must be manually mapped from Figma.
```

---

## Prompt 9 — Create Sanitized Handoff Package

```text
You are creating a sanitized handoff package for rebuilding this frontend project from scratch outside this environment.

Critical constraints:
- Do not include source code.
- Do not include secrets.
- Do not include real user data.
- Do not include real tokens, credentials, private URLs, internal IPs, certificates, or environment values.
- Do not include sensitive operational names if they are not allowed to leave this environment.
- Replace sensitive values with placeholders.
- Use dummy mock examples only.
- Keep only information that is necessary to rebuild the frontend behavior and API integration.

Create the following Markdown documents:

1. PRODUCT_SPEC.md
   - purpose
   - users
   - goals
   - non-goals
   - main flows
   - acceptance criteria

2. SCREEN_SPEC.md
   - screens
   - routes
   - UI sections
   - user actions
   - states
   - Figma mapping placeholders

3. USER_FLOWS.md
   - end-to-end flows
   - actions
   - validations
   - APIs
   - success/failure behavior

4. API_CONTRACTS.md
   - endpoints
   - request schemas
   - response schemas
   - error behavior
   - polling/retry behavior
   - dummy examples only

5. DATA_MODEL.md
   - entities
   - fields
   - enums/statuses
   - DTO to frontend model mappings

6. STATE_AND_PERMISSIONS.md
   - global state
   - page state
   - roles/permissions
   - mode-specific behavior
   - local/session storage usage

7. ERROR_HANDLING.md
   - validation
   - error states
   - empty states
   - loading states
   - retry behavior

8. REBUILD_PLAN.md
   - recommended clean architecture
   - suggested frontend stack
   - component breakdown
   - API client strategy
   - testing strategy
   - Docker/image considerations

9. OPEN_QUESTIONS.md
   - unclear behavior
   - missing backend details
   - decisions needed before rebuild

Before finalizing:
- Add a "Sanitization Checklist" section.
- Explicitly list what was intentionally excluded for security.
- Mark uncertain information as "Needs verification".
```

---

## Prompt 10 — Self-Review The Handoff Package

```text
Review the generated handoff package as if another developer will rebuild the frontend from scratch using only these documents and the Figma.

Do not add sensitive data.
Do not include source code.

Check:
1. Can a developer understand the product purpose?
2. Are all screens documented?
3. Are all routes documented?
4. Are all user flows documented?
5. Are API contracts complete enough?
6. Are request/response schemas clear?
7. Are entities and enums documented?
8. Are permissions and modes documented?
9. Are loading/error/empty states documented?
10. Are acceptance criteria testable?
11. Are open questions clearly marked?
12. Is anything sensitive included accidentally?
13. Is anything critical missing for rebuilding?

Return:
- Critical missing information
- Ambiguous areas
- Security/sanitization concerns
- Suggested improvements
- Final readiness score from 1 to 10
```
