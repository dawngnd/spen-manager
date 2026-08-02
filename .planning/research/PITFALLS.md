# Pitfalls Research: Spen Manager

## Critical Pitfalls

### 1. GAS Web App CORS & Preflight Option Failure
- **Description**: Standard `fetch()` calls from Telegram Mini App sending `Content-Type: application/json` or custom headers trigger a browser CORS preflight `OPTIONS` request. GAS Web Apps redirect (`302 Found`) to `script.googleusercontent.com` and DO NOT support `OPTIONS` preflight handling, resulting in CORS failures inside the Telegram webview.
- **Warning Signs**:
  - `Access-Control-Allow-Origin` errors in browser DevTools when calling GAS Web App endpoint.
  - `POST` requests from Mini App work in Postman/cURL but fail inside Telegram Mini App webview.
- **Prevention Strategy**:
  - Send POST request payloads as `text/plain` or `application/x-www-form-urlencoded` from frontend `fetch()` calls (this prevents the browser from sending a CORS preflight `OPTIONS` request).
  - Parse `e.postData.contents` in GAS `doPost(e)` using `JSON.parse(e.postData.contents)` regardless of incoming header.
  - Always construct responses using `ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON)`.
- **Phase Mapping**: Phase 1 (Backend Architecture & API Setup).

### 2. Concurrent Writes & Data Corruption in Google Sheets
- **Description**: When the Gmail time trigger runs simultaneously with a Web App API request (e.g., user categorizes a transaction in Mini App while background sync parses a new email), both execution instances read `getLastRow()` at the same time, leading to overwritten transaction rows or duplicate insertions.
- **Warning Signs**:
  - Intermittent missing transactions or scrambled cell values in Google Sheets.
  - Two distinct transactions assigned identical row indices or overwritten categories.
- **Prevention Strategy**:
  - Wrap all Sheet read-modify-write operations inside `LockService.getScriptLock()`.
  - Call `lock.waitLock(30000)` before reading row bounds or appending data.
  - **CRITICAL REQUIREMENT**: Execute `SpreadsheetApp.flush()` BEFORE calling `lock.releaseLock()` to force pending updates to be written to disk before releasing the lock to queued execution processes.
- **Phase Mapping**: Phase 1 (Backend & Sheet Schema Design).

### 3. Gmail Trigger Overlap & Duplicate Transaction Parsing
- **Description**: Gmail time triggers executing every 1–5 minutes can overlap if a batch takes longer than the trigger interval, or if `GmailApp.markMessageRead()` / labeling fails, causing the same email to be processed multiple times and producing duplicate expense entries.
- **Warning Signs**:
  - Duplicate transaction rows in Google Sheet with identical amounts, timestamps, and reference codes.
  - Log entries showing the same email ID parsed twice in consecutive trigger runs.
- **Prevention Strategy**:
  - Store unique Gmail `messageId` or Bank Transaction Reference Code in a primary key column in Google Sheets.
  - Acquire `LockService` in the email parser trigger script.
  - Query sheet for `messageId` existence before appending new row.
  - Use an atomic Gmail processing pattern: search via `is:unread label:spen-pending`, immediately apply `spen-processing` label or mark read before parsing execution.
- **Phase Mapping**: Phase 2 (Email Parsing Pipeline).

### 4. Telegram WebApp `initData` Authentication & Security Bypasses
- **Description**: Relying on client-side `initDataUnsafe` for user identity allows any user or malicious client to spoof `user.id`. Without server-side HMAC-SHA256 signature verification of `initData` using the Telegram Bot Token in GAS, unauthorized users could read or alter financial records.
- **Warning Signs**:
  - API endpoints accepting `user_id` as a raw query/body parameter without HMAC validation.
  - Mini App functions cleanly when opened directly in external browser without Telegram context.
- **Prevention Strategy**:
  - Compute HMAC-SHA256 signature of `initData` query string on GAS backend using secret key derived from `WebAppData` constant and `BOT_TOKEN`.
  - Validate `auth_date` timestamp in `initData` to reject stale requests (> 86400 seconds / 24 hours) to prevent replay attacks.
  - Perform strict user validation verifying decrypted/validated `user.id === ALLOWED_TELEGRAM_USER_ID`.
- **Phase Mapping**: Phase 1 (Backend Security) & Phase 3 (Telegram Mini App Auth).

### 5. Timezone Discrepancy & Month Boundary Misclassification
- **Description**: Google Apps Script default script timezone (`Session.getScriptTimeZone()`) may differ from bank email timestamps (ICT / UTC+7) or Telegram client timezone. Transactions occurring late at night (e.g. 23:45 on July 31st ICT) convert to July 31 16:45 UTC, causing budget calculations and monthly statistics to misassign expenses to the wrong month.
- **Warning Signs**:
  - Transactions on the 1st or last day of the month appear in the wrong month's budget summary.
  - Discrepancy between date displayed in Telegram notification vs Mini App dashboard.
- **Prevention Strategy**:
  - Standardize script timezone explicitly in `appsscript.json` (`"timeZone": "Asia/Ho_Chi_Minh"`).
  - Always store transaction dates in Sheet as standardized ISO 8601 strings with timezone offset (`YYYY-MM-DDTHH:mm:ss+07:00`) or ISO date string `YYYY-MM-DD`.
  - Parse date strings using explicit timezone offsets in JS (`Utilities.formatDate(date, "Asia/Ho_Chi_Minh", "yyyy-MM-dd")`).
- **Phase Mapping**: Phase 2 (Email Parsing) & Phase 4 (Budget & Analytics Engine).

---

## Medium-Risk Pitfalls

### 6. Google Sheet Performance Degraded by Dynamic Formulas
- **Description**: Adding dynamic formulas like `QUERY`, `SUMIFS`, or `VLOOKUP` on every row of the transactional sheet causes recalculation of the entire sheet whenever a new transaction is appended via `appendRow()`. Over time (1,000+ rows), backend response time inflates from <500ms to >5s.
- **Warning Signs**:
  - GAS API calls taking > 3-5 seconds to complete as transaction history grows.
  - Google Sheet taking long time to open or edit manually.
- **Prevention Strategy**:
  - Keep transaction raw data sheet completely clean of cell formulas.
  - Perform all aggregation (monthly budget totals, category sums) programmatically in Apps Script memory or in separate cached summary sheets.
  - Use batch reads (`sheet.getDataRange().getValues()`) and write operations (`getRange().setValues()`) instead of cell-by-cell operations.
- **Phase Mapping**: Phase 1 (Database Design) & Phase 4 (Dashboard Backend).

### 7. Email HTML Template Drift & Hidden Character Breaking Regex
- **Description**: Banks periodically change transaction email HTML formatting, add invisible non-breaking spaces (`&nbsp;`, `\u00a0`), zero-width spaces (`\u200b`), or alter currency formatting (e.g., `100,000 VND` vs `100.000 đ`), breaking rigid regex patterns without throwing syntax errors (resulting in `null` parsed values).
- **Warning Signs**:
  - Transactions silently skipped or recorded with `$0` / empty merchant names after bank updates email template.
  - Parsing error logs appearing after scheduled email trigger runs.
- **Prevention Strategy**:
  - Sanitize raw email HTML/text before regex parsing: normalize whitespace, strip HTML tags cleanly, remove zero-width characters (`body.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/&nbsp;|\u00a0/g, ' ')`).
  - Implement defensive regex matchers with fallback patterns and strict validation (flag error to Telegram if amount or date fails to parse).
  - Provider pattern abstraction: isolate bank email parser into dedicated module with unit tests against raw saved email fixtures (`.eml` or `.html`).
- **Phase Mapping**: Phase 2 (Email Parser Development).

### 8. Telegram Mini App Viewport Collapse & Safe Area Clipping
- **Description**: Scrolling vertically inside Mini App triggers Telegram's swipe-to-close gesture, closing the app unexpectedly while categorizing expenses. Additionally, iOS home bar and top notch cover interactive elements (like category save buttons or top search bar).
- **Warning Signs**:
  - Mini App accidentally closing when swiping down through long transaction lists.
  - Bottom action buttons obscured by iPhone home indicator line.
- **Prevention Strategy**:
  - Call `window.Telegram.WebApp.disableVerticalSwipes()` on app launch (Bot API 7.7+).
  - Use viewport meta tag with `viewport-fit=cover`.
  - Apply CSS padding using safe area variables: `padding-bottom: env(safe-area-inset-bottom); padding-top: env(safe-area-inset-top);`.
  - Set container CSS: `html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }` and scroll inside an overflow-y element.
- **Phase Mapping**: Phase 3 (Telegram Mini App Frontend).

### 9. Telegram Native BackButton Desynchronization with React SPA
- **Description**: When navigating between Mini App screens (e.g., Transaction List -> Category Selector -> Budget Settings), clicking Telegram's native top-left BackButton closes the entire Mini App instead of going back a page because history stack is not tied to Telegram SDK `BackButton`.
- **Warning Signs**:
  - Pressing Telegram back arrow exits Mini App to chat context instead of returning to previous sub-view.
- **Prevention Strategy**:
  - Integrate Telegram SDK `window.Telegram.WebApp.BackButton` into React state or router stack.
  - Call `BackButton.show()` when navigating to sub-views and `BackButton.hide()` on root view.
  - Attach listener `BackButton.onClick(() => navigate(-1))` to maintain unified navigation stack.
- **Phase Mapping**: Phase 3 (Telegram Mini App Frontend).

### 10. Conflating Internal Transfers with Expense/Income
- **Description**: Transferring money between personal accounts (e.g., checking to savings or credit card payment) gets parsed as an expense or income, skewing monthly budget analytics and top categories.
- **Warning Signs**:
  - Total monthly spend/income artificially inflated by account transfers.
  - Category reports showing high transfer amounts in "Other" or "Uncategorized".
- **Prevention Strategy**:
  - First-class support for 3 transaction types: `expense`, `income`, `transfer`.
  - Exclude `transfer` type from budget quota calculations and expense summary charts.
  - Auto-detect keywords (e.g., "chuyen khoan noi bo", "tiet kiem", "thanh toan the tin dung") to pre-flag transaction as `transfer`.
- **Phase Mapping**: Phase 2 (Data Schema) & Phase 4 (Analytics Engine).

---

## Low-Risk Pitfalls

### 11. Floating-Point Precision Loss in Currency Math
- **Description**: In JavaScript/Apps Script, binary floating-point representation causes calculation errors during cumulative addition (e.g., `0.1 + 0.2 === 0.30000000000000004` or fractional numbers in interest/fee calculations).
- **Warning Signs**:
  - Total balance or budget spent displaying cents like `1500000.0000000002` in chart tooltips.
- **Prevention Strategy**:
  - Treat all VND amounts as strict 64-bit integers (`Math.round(amount)`).
  - Use `Math.round()` after division or formatting helper `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- **Phase Mapping**: Phase 2 (Backend Schemas) & Phase 3/4 (Frontend UI).

### 12. Heavy Mobile Chart Re-renders & Layout Shifts
- **Description**: Rendering un-aggregated transaction data using heavy chart libraries on mobile webviews causes canvas lag, battery drain, and un-responsive UI when switching tabs in Mini App.
- **Warning Signs**:
  - Laggy tab switching when opening Dashboard tab on mobile.
  - FPS drops during pie chart animations on lower-spec mobile devices.
- **Prevention Strategy**:
  - Pre-aggregate monthly summaries on backend before sending payload to Mini App.
  - Use lightweight charting library (e.g., Chart.js, Recharts, or SVG charts) with canvas acceleration.
  - Memoize chart components with React `useMemo` / `React.memo` to prevent unnecessary chart redraws on state changes.
- **Phase Mapping**: Phase 4 (Dashboard & Charts UI).

### 13. GAS Deployment Stale Version Caching
- **Description**: Updating code in Apps Script editor or pushing via clasp does not automatically update the published Web App `/exec` URL if bound to a fixed version ID, causing the Mini App to execute old backend logic.
- **Warning Signs**:
  - Frontend fetch receives old response structure after backend code changes.
  - Bug fixes pushed to backend do not take effect.
- **Prevention Strategy**:
  - In development, deploy Web App version set to `HEAD` (Test Deployments) or automate version deployment via clasp CLI scripts (`clasp deploy -i <deploymentId>`).
  - Log version hash/timestamp in API ping response (`doGet` returns app version) to verify runtime code version.
- **Phase Mapping**: Phase 1 (DevOps & Clasp Setup).

---

## Prevention Checklist

| Phase | Category | Action Item | Verification Test |
|-------|----------|-------------|-------------------|
| Phase 1 | Backend | Implement `LockService.getScriptLock()` & `SpreadsheetApp.flush()` in write calls | Run concurrent `doPost` requests in parallel; verify zero data overlap or row overwrites |
| Phase 1 | Security | Implement HMAC-SHA256 verification for `initData` with Telegram Bot Token | Send request with altered `initData` payload; verify backend returns 401 Unauthorized |
| Phase 1 | Web App | Return `ContentService.MimeType.JSON` and use `text/plain` POST payload handling | Call endpoint from Vite frontend; verify zero CORS preflight errors |
| Phase 2 | Email | Sanitize email body (remove `&nbsp;`, zero-width spaces) before running regex | Run test parser against stored `.eml` sample fixtures containing hidden HTML formatting |
| Phase 2 | Email | Store Gmail `messageId` in Sheet and check uniqueness before write | Execute email trigger twice on same email thread; verify transaction is recorded exactly once |
| Phase 2 | Timezone | Set `"timeZone": "Asia/Ho_Chi_Minh"` in `appsscript.json` & store ISO dates | Parse email received at 23:55 ICT on month-end; verify date correctly belongs to current month |
| Phase 3 | Mini App | Call `window.Telegram.WebApp.disableVerticalSwipes()` & set safe areas | Scroll down transaction list on iOS Telegram; verify app does not collapse |
| Phase 3 | Mini App | Bind Telegram `BackButton` SDK to SPA navigation state | Navigate 3 levels deep in Mini App and press top-left back button; verify it goes back 1 screen |
| Phase 4 | Analytics | Differentiate `transfer` type from `expense` / `income` | Add internal bank transfer; verify total monthly expense/income budget remains unaffected |
| Phase 4 | Dashboard | Deliver pre-aggregated backend summary payloads to frontend | Load Dashboard tab; verify chart renders in < 200ms with zero frame drops |

---

## Sources
1. Google Apps Script LockService Documentation & Best Practices (Concurrency control in WebApps)
2. Telegram Mini Apps WebApp API Documentation (v7.7+ Vertical Swipes & Viewport management)
3. Google Apps Script Quotas & Web App CORS Limitations
4. Standard ISO 8601 Date String & Timezone Offset specifications for financial ledgers
