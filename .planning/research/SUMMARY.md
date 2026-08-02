# Project Research Summary

**Project:** Spen Manager
**Domain:** Personal Expense Tracking via Telegram Mini App
**Researched:** 2026-08-02
**Confidence:** HIGH

## Executive Summary

Spen Manager is a zero-cost, single-user personal expense tracker that automates bank transaction capture from email notifications (starting with Timo Bank), stores data in Google Sheets, and provides a Telegram Mini App for manual categorization and analytics. The system extends two proven internal projects — `email-to-sheet` (Gmail→Sheet pipeline) and `save-manager` (GAS backend + Telegram Mini App frontend) — into a unified financial management tool. Research confirms that this architecture carries low technical risk because both the backend pipeline and frontend deployment patterns have been validated in production.

The recommended stack — Google Apps Script + Google Sheets (backend/DB), Vite + React 19 + TypeScript (frontend), Telegram Mini App SDK, GitHub Pages hosting — is entirely free-tier and requires zero server maintenance. Email parsing uses deterministic regex patterns rather than AI/LLM APIs, ensuring 100% reliability, zero latency, and zero recurring cost. The core differentiator is a **notification-to-categorization micro-workflow**: bank email arrives → GAS parses and stores → Telegram notification fires → user taps inline button → Mini App opens → single-tap category assignment → done in under 5 seconds.

Research identified 13 pitfalls across 3 severity tiers. The 5 critical pitfalls (CORS preflight failure, concurrent write corruption, duplicate email parsing, initData auth bypass, timezone month-boundary errors) all have well-documented prevention strategies drawn from prior art and platform documentation. No showstoppers were found; all risks are mitigable with known patterns.

## Key Findings

### Recommended Stack

| Layer | Choice | Confidence |
|:------|:-------|:----------:|
| **Backend Runtime** | Google Apps Script (GAS) — time triggers + `doPost`/`doGet` Web App | 98% |
| **Database** | Google Sheets (structured tabs: Transactions, Categories, Budgets, Settings) | 98% |
| **Email Parsing** | Deterministic regex pipeline, provider-based extractor pattern (Timo first) | 95% |
| **Frontend Framework** | Vite 8 + React 19 + TypeScript 5 | 98% |
| **Telegram SDK** | `@telegram-apps/sdk-react` v3.3.9 | 95% |
| **Styling** | Tailwind CSS v4 with Telegram theme CSS variable binding | 95% |
| **Server State** | TanStack React Query v5 (caching, optimistic updates, background revalidation) | 95% |
| **Client State** | Zustand v5 (~1KB, UI-only state: tabs, modals, filters) | 95% |
| **Charts** | Recharts v3 (declarative SVG, mobile-friendly) | 90% |
| **Hosting** | GitHub Pages (frontend) + GAS Web App (backend API) | 98% |
| **CI/CD** | GitHub Actions: `deploy-frontend.yml` + `clasp-push.yml` | 95% |

**Explicitly excluded**: AI/LLM parsing APIs, heavy UI frameworks (MUI/Ant Design), SSR frameworks (Next.js), deprecated `@twa-dev/sdk`, `vite-plugin-singlefile`.

### Expected Features

**Table Stakes (Must-Have for MVP):**
1. **Automated Transaction Ingestion** — Gmail fetch → regex parse → Sheet append → Telegram notify. Handles expense, income, and transfer types. Failed parses go to error queue.
2. **2-Level Category System** — Parent/child hierarchy (e.g., Food → Coffee, Groceries). CRUD management via Mini App.
3. **Categorization Inbox** — Rapid single-tap classification of pending transactions with optimistic UI updates.
4. **Budget Tracking** — Monthly limits per category with color-coded health indicators (green <80%, yellow 80-100%, red >100%).
5. **Analytics Dashboard** — KPI summary (income, expenses, net flow), category pie chart with drill-down, monthly trend bar chart, top merchants list.
6. **Telegram Integration** — Push notifications with inline "Open Spen Manager" deep-link button. Native theme sync (dark/light).

**Key Differentiators:**
- Zero-friction automated capture (no manual entry, no paid bank APIs)
- Messenger-native micro-workflow (notification → categorize in <5 seconds)
- Transfer isolation (prevents double-counting internal account movements)
- Full data ownership (personal Google Sheet, no third-party cloud DB)

**Anti-Features (Deliberately Excluded):**
- Manual transaction entry (v1), raw transaction editing/deletion, AI auto-categorization, multi-user support, multi-currency, native mobile app.

### Architecture Approach

The system is organized into **6 component layers** with strict boundaries:

1. **Email Source** (Gmail) → 2. **Email Pipeline Engine** (GAS background worker, 5-15 min trigger) → 3. **Google Sheet DB** (single source of truth) → 4. **GAS Web App API** (single `doPost` action dispatcher) → 5. **Telegram Bot API** (push notifications + deep links) → 6. **Telegram Mini App** (React SPA on GitHub Pages)

**Critical architectural decisions:**
- **CORS bypass**: All frontend→backend requests use `Content-Type: text/plain` to avoid preflight `OPTIONS` requests that GAS cannot handle.
- **Single `doPost` dispatcher**: All API actions (`get_transactions`, `categorize_transaction`, `get_categories`, `get_dashboard`, `set_budget`, `upsert_category`) route through one endpoint with an `action` field.
- **Authentication**: Telegram `initData` HMAC-SHA256 verification on every request, plus `user.id === ALLOWED_TELEGRAM_USER_ID` check.
- **Concurrency**: All write operations wrapped in `LockService.getScriptLock()` with `SpreadsheetApp.flush()` before lock release.
- **Deduplication**: Gmail `messageId` stored in Sheet as unique index; checked before every write.
- **State management**: TanStack Query for server state (transactions, categories, dashboard data) with optimistic updates; Zustand for UI-only state (active tab, modal state, filters).

### Critical Pitfalls

| # | Pitfall | Severity | Phase Impact | Mitigation |
|:-:|:--------|:--------:|:------------:|:-----------|
| 1 | **CORS preflight failure** — GAS doesn't support `OPTIONS` requests | Critical | Phase 1, 3 | Use `text/plain` content type; parse `e.postData.contents` |
| 2 | **Concurrent write corruption** — Trigger + API race condition | Critical | Phase 1 | `LockService` + `SpreadsheetApp.flush()` before lock release |
| 3 | **Duplicate email parsing** — Trigger overlap | Critical | Phase 2 | Gmail `messageId` dedup + `LockService` in trigger |
| 4 | **initData auth bypass** — Spoofed `user.id` | Critical | Phase 1, 3 | Server-side HMAC-SHA256 verification + `auth_date` staleness check |
| 5 | **Timezone month-boundary errors** — Wrong month assignment | Critical | Phase 2, 5 | Explicit `Asia/Ho_Chi_Minh` timezone + ISO 8601 with offset |
| 6 | Sheet performance from dynamic formulas | Medium | Phase 1, 5 | No formulas in data sheets; aggregate in GAS memory |
| 7 | Email HTML template drift breaking regex | Medium | Phase 2 | Sanitize HTML before parsing; test against `.eml` fixtures |
| 8 | Mini App viewport collapse (swipe-to-close) | Medium | Phase 4 | `disableVerticalSwipes()` + safe area CSS |
| 9 | BackButton desync with React SPA | Medium | Phase 4 | Bind Telegram `BackButton` SDK to React navigation state |
| 10 | Transfer conflation with expense/income | Medium | Phase 2, 5 | First-class `TRANSFER` type; exclude from budget/expense totals |

## Implications for Roadmap

### Phase 1: Backend Foundation & Sheet Schema
**Scope**: Google Sheet workbook structure (4 tabs with strict schemas), Apps Script project setup with `clasp`, seed category data, `LockService` wrapper, `doPost` dispatcher skeleton, HMAC-SHA256 auth service, CORS-safe response pattern.

**Why first**: Every other component depends on the data store schema and API contract. Auth and concurrency guards must be baked in from day one — retrofitting these is error-prone. The CORS `text/plain` pattern must be validated before frontend work begins.

**Estimated complexity**: Low–Medium (S–M).

### Phase 2: Email Pipeline & Telegram Alerts
**Scope**: Port pipeline engine from `email-to-sheet`. Implement `TimoExtractor` with regex parsing. Gmail message ID deduplication. Telegram bot notification with inline WebApp button. Time-based trigger configuration (10-min interval). Timezone standardization (`Asia/Ho_Chi_Minh`). HTML sanitization before regex.

**Why second**: The pipeline is the data source. Without automated ingestion, there are no transactions to categorize or analyze. This phase can run in parallel with Phase 3 since both depend only on Phase 1.

**Estimated complexity**: Medium (M). Email template regex is the highest-variance work item.

### Phase 3: GAS REST API Layer
**Scope**: Complete `doPost` action routing for all 6 endpoints. Repository modules (`TransactionRepository`, `CategoryRepository`, `BudgetRepository`). Read operations (filtered transaction lists, category tree, dashboard aggregations). Write operations with `LockService`.

**Why parallel with Phase 2**: API layer depends on Sheet schema (Phase 1) but not on the email pipeline. Frontend development (Phase 4) needs working API endpoints. Building API and pipeline concurrently shortens critical path.

**Estimated complexity**: Medium (M).

### Phase 4: Telegram Mini App Core UI & Categorization
**Scope**: Vite + React + TS + Tailwind project scaffolding. `@telegram-apps/sdk-react` integration with mock dev environment. `callBackendApi` helper (text/plain POST). Pending transactions list. 2-level category picker modal. Optimistic categorization mutations. Telegram theme sync. BackButton navigation binding. `disableVerticalSwipes()`. GitHub Pages deployment via GitHub Actions.

**Why fourth**: Requires both working API (Phase 3) and transaction data in Sheet (Phase 2) to be functional. This is the primary user-facing deliverable and the highest-effort phase.

**Estimated complexity**: Medium–High (M–L). Mobile webview UX edge cases (viewport, safe areas, swipe gestures) add integration risk.

### Phase 5: Analytics Dashboard & Budget Tracking
**Scope**: `get_dashboard` backend aggregation (monthly totals, category breakdown, top merchants, budget consumption). Dashboard UI with Recharts (pie/donut, bar/line charts). Budget management UI (set limits, progress bars). Transfer exclusion from expense/budget calculations. Pre-aggregated payloads for chart performance.

**Why last**: Dashboard and budget features depend on having categorized transaction data (Phase 4). These are value-add features on top of the core categorization workflow.

**Estimated complexity**: High (L). Chart rendering in mobile webview + multi-dimensional data aggregation on GAS.

### Phase Ordering Rationale

```
Phase 1 ──→ Phase 2 ──→ Phase 4 ──→ Phase 5
         ╲              ╱
          → Phase 3 ──→
```

The ordering follows strict dependency chains from the feature dependency matrix:
1. **Phase 1 gates everything** — schema, auth, and concurrency are foundational.
2. **Phases 2 & 3 can parallelize** — pipeline (data source) and API (data access) both depend only on Phase 1.
3. **Phase 4 requires both 2 & 3** — the Mini App needs working API endpoints AND transaction data.
4. **Phase 5 requires Phase 4** — analytics need categorized data, which requires the categorization UI.

This ordering also aligns with the **value delivery sequence**: each phase produces a testable, runnable increment:
- After Phase 2: emails auto-parsed, stored, and notified via Telegram (backend validation).
- After Phase 4: full categorization workflow end-to-end (core user value).
- After Phase 5: complete financial insights (full product vision).

### Research Flags

> [!WARNING]
> **Email Template Volatility** — Timo Bank may change email HTML formatting without notice. Regex parsers must be tested against real email fixtures and designed with fallback patterns. Budget time for parser maintenance.

> [!IMPORTANT]
> **GAS 6-Minute Execution Limit** — Email pipeline must implement time-budget monitoring (`Date.now() - startTime > 300000ms`) and gracefully terminate before hitting the hard limit. Batch size should be capped.

> [!NOTE]
> **Single Provider Start** — Architecture supports multi-provider (VCB, Techcombank) via `ExtractorFactory` pattern, but v1 only implements Timo. Adding providers later is additive, not architectural change.

## Confidence Assessment

| Research Area | Confidence | Rationale |
|:--------------|:----------:|:----------|
| **Overall Architecture** | **HIGH (95%)** | Direct extension of 2 proven production projects (`email-to-sheet`, `save-manager`). |
| **Stack Selection** | **HIGH (96%)** | Every library verified on NPM. All integrations validated in prior art. |
| **Feature Scope** | **HIGH (92%)** | Clear table stakes vs. anti-features. Complexity estimates grounded in similar prior implementations. |
| **Pitfall Identification** | **HIGH (90%)** | 13 pitfalls identified across 3 severity tiers with tested prevention strategies. CORS and LockService patterns proven in `save-manager`. |
| **Phase Structure** | **HIGH (90%)** | Dependency graph is acyclic and validated against feature dependency matrix. Phase 2/3 parallelism reduces critical path. |
| **Effort Estimates** | **MEDIUM (75%)** | T-shirt sizing based on feature complexity ratings. Actual timeline depends on email template edge cases and mobile webview integration polish. |

## Sources

### Internal Prior Art
- [`email-to-sheet`](file:///home/dangnd/code/github/email-to-sheet): Gmail fetch pipeline, regex parsing, deduplication, Telegram notification patterns.
- [`save-manager`](file:///home/dangnd/code/github/save-manager): GAS `doPost` routing, `initData` HMAC verification, Vite/React/TS frontend, `text/plain` CORS workaround, GitHub Pages CI/CD.

### Research Documents
- [STACK.md](file:///home/dangnd/code/github/spen-manager/.planning/research/STACK.md): Technology selection rationale and version pinning.
- [FEATURES.md](file:///home/dangnd/code/github/spen-manager/.planning/research/FEATURES.md): Feature taxonomy, dependency matrix, and complexity estimates.
- [ARCHITECTURE.md](file:///home/dangnd/code/github/spen-manager/.planning/research/ARCHITECTURE.md): Component boundaries, data flows, Sheet schema, API design, and build order.
- [PITFALLS.md](file:///home/dangnd/code/github/spen-manager/.planning/research/PITFALLS.md): 13 identified risks with prevention strategies and phase mapping.
- [PROJECT.md](file:///home/dangnd/code/github/spen-manager/.planning/PROJECT.md): Project requirements, constraints, and key decisions.

### External References
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [`@telegram-apps/sdk-react` Docs](https://docs.telegram-mini-apps.com/)
- [Google Apps Script Web App & ContentService Guide](https://developers.google.com/apps-script/guides/html/communication)
- [Google Apps Script LockService Reference](https://developers.google.com/apps-script/reference/lock/lock-service)

### Verified NPM Packages (August 2026)
`@telegram-apps/sdk-react` v3.3.9 · `@tanstack/react-query` v5.101.4 · `react` v19.2.8 · `vite` v8.2.0 · `tailwindcss` v4.3.3 · `recharts` v3.10.1 · `zustand` v5.0.0 · `dayjs` v1.11.21 · `lucide-react` v0.470.0 · `@google/clasp` v3.3.0
