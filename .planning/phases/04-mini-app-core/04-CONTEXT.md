# Phase 4 Context: Mini App Core

## Technical Decisions
- **D-01 (Routing):** Use `react-router-dom`. Provides clean navigation paths (Inbox, Categories) and integrates well with Telegram SDK BackButton.
- **D-02 (Data Fetching):** Use `@tanstack/react-query`. Essential for handling async loading states, caching `get_categories`, and invalidating queries after `categorize_transaction` mutations.
- **D-03 (Categorization UX):** Use Shadcn `Drawer` (Bottom Sheet). Native mobile app feel inside Telegram, optimal for selecting categories without losing context.
- **D-04 (Global State):** Use `Zustand`. Lightweight store to hold Telegram `initData`, `user` object, and app theme preferences.
- **D-05 (UI Framework):** Vite + React + TailwindCSS + Shadcn UI. Dark mode strictly follows Telegram theme variables provided by `@twa-dev/sdk`.

## Scope
- Implement Telegram SDK initialization.
- Fetch and display Uncategorized Transactions (Inbox).
- Categorize transactions via Drawer UI.
- Manage Categories (CRUD for Parent/Child categories).
- Transactions history with basic filtering.
