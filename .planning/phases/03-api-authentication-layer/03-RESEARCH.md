# Phase 03: API & Authentication Layer - Research

## Domain Analysis — What this phase is about
This phase establishes a robust and secure backend infrastructure for the Telegram Mini App. It is composed of two main components:
1. **Cloudflare Worker Middleware:** Acts as the public-facing API. It intercepts requests from the Mini App, validates the user's authenticity using Telegram's `initData` and a secret bot token, handles CORS, and proxies valid requests to the underlying Google Apps Script (GAS) Web App.
2. **Google Apps Script (GAS) API:** An extension of the existing `doPost` function that acts as the database layer. It implements six specific CRUD/action handlers for reading and writing transaction and category data to Google Sheets, using `LockService` to prevent data corruption from concurrent writes.

## Existing Codebase — What's already built that's relevant
- **`src/API.ts`:** Already implements a basic action-dispatch mechanism via `doPost(e)`. It parses the JSON payload, checks the `action` field, and returns a standard JSON response format: `{ success: true, data: ... }` or `{ success: false, error: "..." }` (aligns with D-05).
- **`src/Utils.ts`:** Contains two crucial utilities:
  - `withLock<T>(callback, timeoutMs)`: A wrapper around `LockService.getScriptLock()` that executes code safely. This will be wrapped around all write operations in the new action handlers.
  - `verifyTelegramWebAppData(initData)`: Validates the Telegram initData. **Note:** This uses GAS `Utilities.computeHmacSha256Signature`. Since D-01 dictates auth moves to the Worker, this exact logical flow needs to be ported to the Web Crypto API (`crypto.subtle`) in the Cloudflare Worker.
- **`src/Setup.ts`:** Defines the exact column layouts for the `Transactions` and `Categories` tabs. The action handlers will map spreadsheet rows to JSON objects using these columns.

## Technical Approach — How to implement each component

### 1. Cloudflare Worker (`worker/`)
- **Structure:** Create a `worker/` directory with a `wrangler.toml` and `src/index.ts`. Use standard `fetch` event listener (or ES Module `export default { fetch }`).
- **CORS:** Implement preflight `OPTIONS` handling to allow cross-origin requests from the Telegram Mini App frontend (e.g., returning `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type, Authorization, x-telegram-init-data`).
- **Authentication Port (Web Crypto API):**
  - Read `x-telegram-init-data` from request headers.
  - Extract the `hash` and sort the remaining key-value pairs alphabetically.
  - Create the `data-check-string`.
  - Use `crypto.subtle.importKey` and `crypto.subtle.sign` to compute the HMAC-SHA256 signature recursively (first with the bot token and 'WebAppData', then with the result and the `data-check-string`). Convert the final buffer to a hex string and compare with the `hash`.
  - Bot token must be injected via `env.TELEGRAM_BOT_TOKEN` (managed by Wrangler secrets).
- **Proxying:** If valid, `fetch()` the GAS Web App URL with the original payload, parse the JSON, and return it to the client.

### 2. GAS doPost Action Handlers
Extend the `switch(action)` block in `src/API.ts`:
- **`get_categories`:** Read the `Categories` sheet, skip header, map rows to objects `[id, name, parent_id, icon, color]`.
- **`upsert_category`:** Write operation (use `withLock`). Find row by `id`. If found, overwrite. If not, `appendRow`.
- **`delete_category`:** Write operation (use `withLock`). Find row by `id`, delete it. *(Edge case: May need to clear `category_child_id` on transactions that use it, but keep it simple for now based on requirements).*
- **`get_transactions`:** Read `Transactions` sheet, return array of mapped objects. As per D-03, this returns flat data containing only `category_parent_id` and `category_child_id` without joining names.
- **`categorize_transaction`:** Write operation (use `withLock`). Find transaction by `id`, update `category_parent_id`, `category_child_id`, and `status` to "categorized".
- **`get_dashboard`:** As per D-04, this effectively routes to `get_transactions` under the hood. The frontend computes the KPIs.

## Dependencies & Risks — What could go wrong
- **GAS Redirects:** GAS Web Apps respond with a `302 Redirect` for GET/POST requests. The Cloudflare Worker `fetch` call handles this automatically, but you must ensure the Worker passes the payload correctly and reads the final redirected response.
- **Web Crypto API Porting:** The asynchronous nature of `crypto.subtle` and ArrayBuffer-to-Hex conversions can be tricky. It's easy to mismatch the exact string encoding. Tests will be needed.
- **LockService Deadlocks/Timeouts:** Concurrent writes could cause a Lock timeout if an operation takes longer than 10 seconds. However, Google Sheets appending/editing a single row is typically fast (< 1s), so this risk is low for a single-user app.
- **Error Propagation:** If GAS returns an HTML error page instead of JSON (e.g., due to deployment issues), the Worker's `JSON.parse` will fail. The Worker must gracefully handle non-JSON GAS responses and return a standard `{ success: false, error: ... }`.

## Validation Architecture — How to verify the work
1. **Worker Isolation Testing:** Deploy the Worker locally (`wrangler dev`). Send a curl request with invalid `x-telegram-init-data` and verify a 401 Unauthorized response is returned. Send one with a manually crafted valid signature to ensure it passes.
2. **End-to-End Integration:** Send a POST request to the Worker's URL (with valid auth) targeting `get_categories`. Verify the request successfully hits GAS and returns the seed categories.
3. **Concurrency Testing:** Fire multiple `categorize_transaction` requests simultaneously (e.g., using Promise.all in a script) targeting the Worker. Verify via the Google Sheet UI that all rows were updated correctly and no data was overwritten improperly due to `LockService` protection.

## RESEARCH COMPLETE
