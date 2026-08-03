# Phase 4 Research: Mini App Core — Categorization & Categories

## Domain Analysis — What this phase is about
This phase transitions the user experience from basic email alerts to an interactive interface. We are building a Telegram Mini App (TMA) as a React Single Page Application (SPA). This SPA will allow users to:
1. View a dedicated "Inbox" of newly parsed, uncategorized transactions.
2. Quickly assign transactions to a parent and child category hierarchy.
3. Manage their personal categories (CRUD operations with icons and colors).
4. View a history of all transactions with filtering capabilities.
The Mini App must feel native to Telegram, adhering to its theme (dark/light) and navigation paradigms (e.g., using the native Telegram BackButton).

## Existing Codebase — What's already built that's relevant
- **Backend API (`src/API.ts`)**: The GAS `doPost` endpoint already implements all necessary data retrieval and mutation actions (`get_categories`, `upsert_category`, `delete_category`, `get_transactions`, `categorize_transaction`).
- **Frontend Scaffolding (`frontend/`)**: 
  - A Vite + React + TypeScript app is initialized.
  - Tailwind CSS and `lucide-react` are configured.
  - `@twa-dev/sdk` is installed for Telegram integration.
  - `App.tsx` contains placeholder content.

## Technical Approach — How to implement each component

### 1. Missing Dependencies
Before coding features, update `package.json`:
- **Routing**: `npm install react-router-dom` to manage Inbox, History, and Categories views.
- **State Management**: `npm install zustand` to store the user object, `initData`, and current theme.
- **Data Fetching**: `npm install @tanstack/react-query` to handle API caching, loading states, and optimistic updates for snappy UI.
- **UI Components**: Install Shadcn UI components needed (e.g., Drawer, Button, Input, Form, Tabs).

### 2. Telegram Integration (TG-03)
- **Initialization**: Create a `TelegramProvider` or initialize `WebApp` in `main.tsx`. Call `WebApp.ready()` and `WebApp.expand()` to maximize the view.
- **Theme Syncing**: Read `WebApp.themeParams` or `WebApp.colorScheme`. Apply the `dark` class to the `<html>` element dynamically and listen to the `themeChanged` event.
- **Navigation (BackButton)**: Sync Telegram's `BackButton` with `react-router-dom` history. Show the button when `location.pathname !== '/'` and call `navigate(-1)` on click.
- **UX Tweaks**: Disable vertical swipes to prevent accidental closing when scrolling lists using `WebApp.disableVerticalSwipes()` (if supported by SDK version) or CSS workarounds.

### 3. API Integration & React Query
- **Environment**: Add `VITE_GAS_API_URL` to `.env` for the frontend.
- Set up a utility function `fetchGasApi(action, payload)` that sends a `POST` request to the GAS Web App URL with `text/plain` body (`JSON.stringify({ action, initData, ...payload })`).
- Create `useTransactions()` and `useCategories()` hooks using `useQuery`.
- Create `useCategorizeMutation()`, `useCategoryMutation()` using `useMutation`.
- **Crucial**: Implement **optimistic updates** in mutations. Since GAS is slow (1-2s response time), the UI must instantly update the transaction state to "categorized" or remove it from the Inbox list to feel responsive.

### 4. UI Architecture
- **App Shell**: A Bottom Navigation Bar with three tabs: Inbox (default), History, Categories.
- **Inbox View (TXN-01)**: Renders transactions filtered by `status === 'uncategorized'`. Tapping a row opens the Categorization Drawer.
- **Categorization Drawer (TXN-02, TXN-03)**: A Shadcn `Drawer` sliding from the bottom. 
  - Step 1: Show a grid/list of Parent Categories.
  - Step 2: On selecting a parent, slide/animate to show its Child Categories.
  - On selecting a child, trigger the categorize mutation and close the drawer.
- **History View (TXN-04)**: Renders all transactions with basic filters (e.g., Categorized/Uncategorized tabs).
- **Categories View (CAT-01, CAT-02, CAT-03, CAT-04, CAT-06)**: 
  - A grouped list of parents and their children.
  - Includes a "+ New Category" button opening a form.
  - Form allows picking an icon (map to `lucide-react` strings or emojis) and color.
  - Delete action must be disabled for parent categories if they have active child categories.

## Dependencies & Risks — What could go wrong
- **Security / Incomplete Phase 3 (INF-05)**: Although Phase 3 is marked complete, `src/API.ts` **does not** currently call `verifyTelegramWebAppData` from `Utils.ts` to validate the incoming payload. The frontend must send `initData` in its payload, and the backend `API.ts` must be updated to validate it before processing actions, otherwise the endpoints remain open and vulnerable.
- **CORS in Development**: React app on `localhost` cannot directly POST to GAS due to CORS. A mock API service layer or dev-proxy approach is necessary for local UI development.
- **GAS Request Size/Rate Limits**: Frequent polling or rapid categorization might hit GAS rate limits. Rely heavily on React Query's caching and optimistic updates to minimize network requests.
- **Mobile Safari/Telegram WebView Quirks**: CSS `100vh` often causes issues on mobile webviews. Use Telegram SDK's `WebApp.viewportHeight` or `dvh` CSS units for full-height layouts like the Drawer.

## Validation Architecture — How to verify the work
1. **Telegram Sandbox**: Launch the Mini App inside Telegram (e.g., via BotFather test bot) to verify theme switching (light/dark mode toggling in TG settings) and BackButton behavior.
2. **Offline/Mock Data Testing**: Verify UI states (loading, error, empty inbox, full inbox) without relying on the live GAS API.
3. **Optimistic UI Verification**: Categorize a transaction and ensure it immediately disappears from the Inbox before the network request completes.
4. **Constraint Checking**: Attempt to delete a Parent category that contains Child categories — the UI should block this and provide clear feedback.

## RESEARCH COMPLETE
