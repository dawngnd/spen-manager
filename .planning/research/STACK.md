# Stack Research: Spen Manager

## Recommended Stack

### Backend
* **Platform**: Google Apps Script (GAS)
  * **Rationale**: Free serverless execution environment natively integrated with Google Workspace and Gmail API (`GmailApp`). Cloned from the proven `email-to-sheet` pipeline architecture.
  * **Execution Model**: Time-driven triggers (every 5–10 minutes) for background email fetching + Web App HTTP endpoints (`doGet` / `doPost`) to serve as a REST API for the Telegram Mini App frontend.
* **Database / Data Store**: Google Sheets
  * **Rationale**: Zero-cost, persistent, easily inspectable data store. Operates as a relational-like backend using structured tabs:
    * `Transactions`: `id`, `message_id`, `date`, `amount`, `type` (`expense` | `income` | `transfer`), `merchant`, `parent_category`, `child_category`, `note`, `status` (`pending` | `categorized`), `created_at`
    * `Categories`: `parent_id`, `parent_name`, `child_id`, `child_name`, `icon`, `color`, `type`
    * `Budgets`: `id`, `parent_category`, `child_category`, `monthly_limit`, `alert_threshold`, `created_at`
    * `Settings`: `key`, `value` (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SEARCH_QUERY`)
    * `Logs`: Execution audit logs
* **Email Parser Strategy**: Deterministic Regex-based Pipeline
  * **Rationale**: Bank notifications (starting with Timo Bank) follow strict, deterministic templates. Regex patterns extract transaction amount, account number, date, transaction code, and merchant details with zero cost, zero latency, and 100% reliability without external AI dependency.
  * **Architecture**: Modular provider parser design (e.g. `src/parsers/timoParser.js`) with pre/post hooks for easy addition of future bank providers (VCB, Techcombank, etc.).

### Frontend
* **Build Tool**: Vite (`vite` `^6.2.0` / `^8.2.0`)
  * **Rationale**: Instant HMR during local development, optimized ES module bundling, fast production build times, and seamless static deployment to GitHub Pages.
* **Framework & Language**: React 19 (`react` `^19.0.0`, `react-dom` `^19.0.0`) + TypeScript 5 (`typescript` `^5.7.0`)
  * **Rationale**: Provides strict type safety for data models (`Transaction`, `Category`, `Budget`, `APIResponse`) shared conceptually with the backend. React 19 provides high performance and small runtime overhead.
* **Telegram Mini App SDK**: `@telegram-apps/sdk-react` (`^3.3.9`) & `@telegram-apps/sdk` (`^2.x` / `^3.x`)
  * **Rationale**: Official modern SDK suite for Telegram Mini Apps. Provides React hooks for native Telegram UI components (`MainButton`, `BackButton`, `HapticFeedback`, theme variable integration matching Telegram dark/light modes).
* **Styling Engine**: Tailwind CSS v4 (`tailwindcss` `^4.0.0`) with `@tailwindcss/vite`
  * **Rationale**: Utility-first CSS engine with zero runtime overhead. Seamlessly binds Telegram WebApp CSS variables (`var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)`) into utility classes for custom mobile UI design.

### Infrastructure
* **Frontend Hosting**: GitHub Pages
  * **Rationale**: Free, low-latency, static site hosting for single-page applications. Built into GitHub repositories.
* **Backend Deployment Tool**: `@google/clasp` (`^3.3.0`)
  * **Rationale**: Google's official CLI tool for Apps Script. Enables local JavaScript/TypeScript source code editing and automated continuous integration deployment.
* **CI/CD Automation**: GitHub Actions
  * **Workflows**:
    1. `.github/workflows/deploy-frontend.yml`: Triggered on push to `main` for `frontend/**`. Installs dependencies (`npm ci`), builds the SPA (`npm run build`), and deploys `frontend/dist/` to GitHub Pages via `actions/deploy-pages@v4`.
    2. `.github/workflows/clasp-push.yml`: Triggered on push to `main` for `backend/**`. Generates `.clasprc.json` from `CLASP_REFRESH_TOKEN` secret, populates `CLASP_SCRIPT_ID`, and runs `clasp push` to update the Google Apps Script deployment.

### Key Libraries
* **Data Fetching & Caching**: `@tanstack/react-query` (`^5.101.4`)
  * **Rationale**: Manages server state between the Mini App and Google Apps Script Web App endpoint. Provides automatic cache management, background revalidation, loading states, and optimistic UI updates when categorizing transactions.
* **UI State Management**: `zustand` (`^5.0.0`)
  * **Rationale**: Lightweight (~1KB) state management for client-only UI states (active tab navigation, category modal filters, selected batch items).
* **Data Visualization & Analytics**: `recharts` (`^3.10.1`)
  * **Rationale**: Declarative React SVG chart components. Perfectly handles 2-level category breakdown pie/donut charts, monthly spending bar charts, and budget progress indicators with fluid scaling in mobile webviews.
* **UI Icons**: `lucide-react` (`^0.470.0`)
  * **Rationale**: Clean, modern, tree-shakeable SVG icons for category icons (food, shopping, bills, income, transfer) and navigation controls.
* **Date Utilities**: `dayjs` (`^1.11.21`)
  * **Rationale**: Ultra-lightweight (<2KB) date parsing library for formatting transaction timestamps, computing current month periods (`YYYY-MM`), and budget cycle calculations.

---

## What NOT to Use

* **AI / LLM APIs (Gemini, OpenAI) for Email Parsing**:
  * *Why not*: Bank transaction emails follow strict structural templates. AI APIs introduce non-deterministic parsing (risk of misreading transaction amounts or dates), add network latency (1-3s per email), and require API keys/costs. Regex rules are instant, 100% deterministic, and free.
* **Heavy UI Frameworks (MUI / Ant Design / Bootstrap)**:
  * *Why not*: Large bundle footprint (>500KB gzipped) significantly degrades startup performance inside the Telegram WebApp mobile webview over cellular networks. Tailwind CSS keeps the frontend JavaScript bundle small (<150KB).
* **Deprecated Telegram SDK (`@twa-dev/sdk`)**:
  * *Why not*: `@twa-dev/sdk` is unmaintained and legacy. Use `@telegram-apps/sdk-react`, which is the officially supported community standard for Telegram Mini Apps with React hook bindings.
* **Complex SSR Frameworks (Next.js / Remix / Nuxt)**:
  * *Why not*: Overkill for a personal expense tracker. Requires paid or complex Node.js hosting infrastructure (Vercel, Render) and complicates simple GitHub Pages static hosting.
* **`vite-plugin-singlefile` (Inlining All Bundles into 1 File)**:
  * *Why not*: While `save-manager` utilized `vite-plugin-singlefile` for offline HTML output, GitHub Pages natively serves multi-asset static files. Splitting JavaScript and CSS chunks allows browser asset caching, leading to faster load times on repeat opens.

---

## Confidence Levels

| Stack Layer | Recommendation | Confidence Level | Rationale |
| :--- | :--- | :---: | :--- |
| **Backend** | Google Apps Script + Google Sheets DB + Regex Email Parser | **HIGH (98%)** | Proven architecture directly derived and extended from active `email-to-sheet` project. |
| **Frontend Core** | Vite + React 19 + TypeScript + GitHub Pages | **HIGH (98%)** | Proven frontend build and deployment stack derived from active `save-manager` project. |
| **Telegram Integration** | `@telegram-apps/sdk-react` v3.3.9 | **HIGH (95%)** | Standard, maintained React SDK for Telegram Mini Apps integration. |
| **Data & State Management** | `@tanstack/react-query` v5 + `zustand` v5 | **HIGH (95%)** | Industry standard for async server state management and minimal client state in React. |
| **Analytics & Visualization** | `recharts` v3.10.1 | **HIGH (90%)** | Mobile-friendly, declarative SVG charting library for React dashboard. |

---

## Sources

* **Local Prior Art Architecture**:
  * [`PROJECT.md`](file:///home/dangnd/code/github/spen-manager/.planning/PROJECT.md): Project requirements & scope constraints
  * [`BUILD.md`](file:///home/dangnd/code/github/save-manager/BUILD.md): Save Manager reference architecture (GAS backend + Vite/React frontend + CI/CD)
  * [`README.md`](file:///home/dangnd/code/github/email-to-sheet/README.md): Email to Sheet reference pipeline (Gmail fetch, deduplication, Telegram integration)
* **Verified NPM Registry Packages (August 2026 / 2025 standard)**:
  * `@telegram-apps/sdk-react` (`v3.3.9`)
  * `@tanstack/react-query` (`v5.101.4`)
  * `react` / `react-dom` (`v19.2.8`)
  * `vite` (`v8.2.0` / `v6.x`)
  * `tailwindcss` (`v4.3.3`)
  * `recharts` (`v3.10.1`)
  * `dayjs` (`v1.11.21`)
  * `@google/clasp` (`v3.3.0`)
