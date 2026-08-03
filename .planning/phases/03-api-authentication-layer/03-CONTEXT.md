# Phase 3: API & Authentication Layer - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `doPost` action-dispatch API in GAS with 6 action handlers, plus a Cloudflare Worker middleware that handles Telegram `initData` HMAC-SHA256 authentication and proxies validated requests to GAS. GAS uses `LockService` for concurrent write protection. The Worker lives in `worker/` subfolder, deployed via wrangler CLI.

</domain>

<decisions>
## Implementation Decisions

### Architecture — Cloudflare Worker Proxy
- **D-01:** Cloudflare Worker acts as middleware between Mini App and GAS — Worker validates Telegram initData, forwards authenticated requests to GAS. GAS does NOT handle auth. — **Reversibility:** costly — [Moving auth back to GAS requires updating all clients and re-deploying; worker is the single auth boundary]
- **D-02:** Worker code lives in `worker/` subfolder in the same repo, deployed via wrangler CLI — **Reversibility:** reversible

### API Response Format
- **D-03:** Flat data — Transactions return `category_id` only; frontend joins with separately-fetched categories list. Categories fetched via `get_categories` action. — **Reversibility:** reversible

### Dashboard Data Strategy
- **D-04:** Frontend aggregation — `get_dashboard` is effectively `get_transactions` returning raw transaction data; frontend computes KPIs, category breakdown, monthly trends, top merchants. — **Reversibility:** reversible

### Error Handling
- **D-05:** Simple string errors — Keep current pattern `{ success: false, error: "message" }`. No error code enum. Frontend shows error message directly. — **Reversibility:** reversible

### the agent's Discretion
- Exact action handler implementation details (sheet reads/writes, data validation)
- Worker routing logic and CORS handling
- LockService granularity (which actions need locks — only write operations)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Project context and vision
- `.planning/REQUIREMENTS.md` — Requirement list (INF-04, INF-05)
- `.planning/ROADMAP.md` — Phase 3 goals and success criteria

### Existing Code (Phase 1 & 2)
- `src/API.ts` — Existing doPost skeleton with ping action and response pattern
- `src/Utils.ts` — Contains `withLock()` (LockService wrapper) and `verifyTelegramWebAppData()` (initData HMAC validation — reference implementation to port to Worker)
- `src/Setup.ts` — Sheet schemas for Transactions, Categories, Budgets, Settings tabs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `withLock()` in `src/Utils.ts` — Concurrency guard using LockService. Use for all write operations in action handlers.
- `verifyTelegramWebAppData()` in `src/Utils.ts` — HMAC-SHA256 validation logic. Port this to Cloudflare Worker (Web Crypto API instead of GAS Utilities).
- `doPost()` in `src/API.ts` — Action-dispatch skeleton already exists with JSON parse, action routing switch, and error handling. Extend with 6 new actions.
- Sheet tab schemas in `src/Setup.ts` — Column layouts for Transactions (10 cols), Categories (5 cols), Budgets (4 cols) are established.

### Established Patterns
- Action-dispatch via switch/case in doPost() — extend this pattern for new handlers
- JSON response format `{ success: true, data: ... }` and `{ success: false, error: "..." }` — keep consistent
- Manual query string parsing for initData (GAS V8 limitation) — Worker can use standard URLSearchParams

### Integration Points
- Worker → GAS: Worker forwards POST requests to GAS Web App URL after auth validation
- Mini App → Worker: Frontend calls Worker endpoint (not GAS directly)
- GAS reads/writes Google Sheets via SpreadsheetApp

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-API & Authentication Layer*
*Context gathered: 2026-08-03*
