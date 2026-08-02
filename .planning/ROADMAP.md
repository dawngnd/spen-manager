# Roadmap: Spen Manager

**Created:** 2026-08-02
**Granularity:** Standard
**Phases:** 6

## Milestone 1: v1.0

### Phase 1: Foundation & Sheet Schema
**Goal:** Establish Google Sheet data store, GAS project structure, seed data, and concurrency/auth primitives.
**Success Criteria:**
1. Google Sheet workbook exists with 4 tabs (Transactions, Categories, Budgets, Settings) and correct column schemas
2. Default categories (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others) are pre-seeded with icons and colors in the Categories tab
3. `clasp` project is initialized and can push code to GAS successfully
**Requirements:** CAT-05

### Phase 2: Email Pipeline & Telegram Notifications
**Goal:** Automate bank email ingestion from Gmail and push Telegram alerts for each new transaction.
**Success Criteria:**
1. Time-triggered function fetches new Timo Bank emails every 10 minutes, parses them, and appends transactions to the Sheet
2. Duplicate emails (same `gmail_message_id`) are skipped — no duplicate rows in the Sheet
3. Unparseable emails land in an "unparsed" queue row instead of being silently dropped
4. Processed emails receive a "processed" Gmail label
5. Telegram notification fires for each new transaction with amount, merchant, type, and an inline "Open Spen Manager" button
**Requirements:** PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, TG-01, TG-02

### Phase 3: API & Authentication Layer
**Goal:** Build the `doPost` action-dispatch API with initData auth and concurrency guards so the frontend has working endpoints.
**Success Criteria:**
1. `doPost` endpoint accepts `text/plain` POST requests and routes to correct action handler based on `action` field
2. Every request is validated via Telegram `initData` HMAC-SHA256 — unauthenticated requests return error
3. All write operations use `LockService` — concurrent requests do not corrupt Sheet data
4. API returns valid JSON responses for all 6 action types (get_transactions, categorize_transaction, get_categories, upsert_category, delete_category, get_dashboard)
**Requirements:** INF-04, INF-05

### Phase 4: Mini App Core — Categorization & Categories
**Goal:** Deliver the React SPA Telegram Mini App where users manage categories and categorize transactions from their inbox.
**Success Criteria:**
1. Mini App opens inside Telegram via the inline button from notifications, adapts to dark/light theme automatically
2. User sees uncategorized transactions inbox and can assign a parent+child category with a single flow
3. User can create, edit (name/icon/color), and delete categories (parent and child) from within the app
4. Transaction list view shows all transactions (categorized and uncategorized) with filter capability
5. Telegram BackButton works correctly for SPA navigation; vertical swipe-to-close is disabled
**Requirements:** CAT-01, CAT-02, CAT-03, CAT-04, CAT-06, TXN-01, TXN-02, TXN-03, TXN-04, TG-03

### Phase 5: Dashboard & Budget Tracking
**Goal:** Add analytics charts and budget management so users can visualize spending and track limits.
**Success Criteria:**
1. Dashboard shows current month KPIs: total income, total expenses, net flow, and count of uncategorized transactions
2. Pie/donut chart displays expense breakdown by parent category; bar/line chart shows monthly spending trend
3. User can compare spending across different months
4. Top merchants list shows highest-spend counterparties
5. User can set monthly budgets per category and see color-coded progress (green <80%, yellow 80-100%, red >100%) with remaining/over amounts
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, BDG-01, BDG-02, BDG-03

### Phase 6: CI/CD & Production Polish
**Goal:** Automate deployment pipelines and harden the system for daily production use.
**Success Criteria:**
1. Pushing to `main` triggers GitHub Actions that deploy frontend to GitHub Pages and backend via `clasp push`
2. Frontend is accessible as a static SPA on GitHub Pages
3. Backend is deployed as a GAS Web App reachable via its published URL
**Requirements:** INF-01, INF-02, INF-03

---

## Coverage Verification

| Phase | Requirements | Count |
|-------|-------------|-------|
| 1 | CAT-05 | 1 |
| 2 | PIPE-01..07, TG-01, TG-02 | 9 |
| 3 | INF-04, INF-05 | 2 |
| 4 | CAT-01..04, CAT-06, TXN-01..04, TG-03 | 10 |
| 5 | DASH-01..05, BDG-01..03 | 8 |
| 6 | INF-01..03 | 3 |
| **Total** | | **30 ✓** |

## Phase Dependencies

```
Phase 1 ──→ Phase 2 ──→ Phase 4 ──→ Phase 5
         ╲              ╱
          → Phase 3 ──→              → Phase 6
```

---
*Roadmap created: 2026-08-02*
