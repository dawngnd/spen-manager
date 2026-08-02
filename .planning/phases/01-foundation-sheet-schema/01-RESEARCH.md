# Phase 1: Foundation & Sheet Schema - Research

## What do I need to know to PLAN this phase well?

### 1. Sheet Schema Specifications
To support the requirements and decisions (D-02, D-03), the Google Sheet tabs should have the following columns:

- **Transactions**:
  - `id` (or rely on row index)
  - `gmail_message_id` (crucial for PIPE-04 deduplication)
  - `date` (transaction time)
  - `amount` (number)
  - `type` (chi/thu/chuyển)
  - `merchant` (string description)
  - `reference` (bank ref code)
  - `status` ('uncategorized' or 'categorized')
  - `category_parent_id` (foreign key to Categories)
  - `category_child_id` (foreign key to Categories)

- **Categories**:
  - `id` (unique string/UUID)
  - `name` (string)
  - `parent_id` (string, empty if it's a parent category - implements D-02 adjacency list)
  - `icon` (native emoji - D-03)
  - `color` (hex code - D-03)

- **Budgets**:
  - `id` (unique string/UUID)
  - `month` (e.g., 'YYYY-MM')
  - `category_id` (foreign key to Categories, supports both parent/child per BDG-01)
  - `amount` (number)

- **Settings**:
  - `key` (string)
  - `value` (string)

### 2. Initial Data Seeding (CAT-05)
The `setup()` function (D-01) needs to programmatically format the headers and insert the following default parent categories:
- Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others.
*Note: We should pick sensible default emojis and colors for these during implementation.*

### 3. GAS Project Structure
The `clasp` environment will need:
- `appsscript.json`: Needs correct OAuth scopes (e.g., `https://www.googleapis.com/auth/spreadsheets`).
- `Setup.ts`/`gs`: Contains the `setup()` function to initialize the spreadsheet (tabs, headers, and pre-seed categories).
- `API.ts`/`gs`: Stub out the `doPost(e)` function for the future REST API.
- `Utils.ts`/`gs`: Helper functions for sheet interaction, auth, and concurrency.

### 4. Concurrency & Auth Primitives (Phase 1 scope for Phase 3 reqs)
- **Concurrency (INF-04)**: Write a wrapper utility around `LockService.getScriptLock().waitLock(timeout)` to be used for any Sheet row insertions/updates to prevent race conditions.
- **Authentication (INF-05)**: Write a utility function for HMAC-SHA256 validation of Telegram `initData`. It will need to read a `TELEGRAM_BOT_TOKEN` from `PropertiesService.getScriptProperties()`.

### Summary for Planner
When writing the `PLAN.md`, ensure tasks cover:
1. Initializing the `clasp` GAS project.
2. Writing the schema definition (column headers) and the `setup()` function.
3. Implementing the category seeding array (CAT-05) with emojis and hex colors.
4. Implementing the `LockService` wrapper and the HMAC-SHA256 Telegram validation utility.
