---
phase: 01-foundation-sheet-schema
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [appsscript.json, src/Setup.ts, src/Utils.ts, src/API.ts]
autonomous: true
requirements: ["CAT-05"]
must_haves:
  truths:
    - "User can run setup() function to format Google Sheet with 4 tabs and proper headers"
    - "Categories tab is pre-populated with default categories with icons and colors"
    - "Utility for HMAC-SHA256 Telegram validation exists"
    - "Utility for LockService concurrency handling exists"
  artifacts:
    - path: "src/Setup.ts"
      provides: "Sheet initialization and seeding script"
    - path: "src/Utils.ts"
      provides: "Concurrency and authentication utility functions"
    - path: "src/API.ts"
      provides: "Basic API entrypoint stub"
  key_links: []
---

<objective>
Establish the Google Sheet data store schema, initialize the GAS project structure, seed default categories, and set up concurrency/auth primitives.

Purpose: Provides the foundational data layer and common utilities for all subsequent phases.
Output: Initialized GAS project with `Setup.ts`, `Utils.ts`, and `API.ts`.
</objective>

<execution_context>
@.agents/gsd-core/workflows/execute-plan.md
@.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-sheet-schema/01-RESEARCH.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Initialize GAS project and configuration</name>
  <files>appsscript.json</files>
  <read_first>.planning/phases/01-foundation-sheet-schema/01-RESEARCH.md</read_first>
  <action>Create or update `appsscript.json` to include the standard Google Apps Script configuration and necessary OAuth scopes (`https://www.googleapis.com/auth/spreadsheets`, `https://www.googleapis.com/auth/script.scriptapp`, etc.). Ensure `timeZone` is set (e.g. `Asia/Ho_Chi_Minh`).</action>
  <verify>Check that `appsscript.json` is a valid JSON file with correct scopes.</verify>
  <acceptance_criteria>
    - `appsscript.json` exists and is valid JSON
    - Contains `oauthScopes` with spreadsheet and scriptapp permissions
  </acceptance_criteria>
  <done>appsscript.json is fully configured</done>
</task>

<task type="auto">
  <name>Task 2: Implement Setup script for schema and data seeding</name>
  <files>src/Setup.ts</files>
  <read_first>.planning/phases/01-foundation-sheet-schema/01-RESEARCH.md</read_first>
  <action>Create src/Setup.ts. Implement a setup() function that opens the target spreadsheet using the ID from Script Properties (e.g., PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')). It should create/format 4 sheets: Transactions, Categories, Budgets, Settings. Create the columns exactly as defined in the RESEARCH document. Implement logic to seed default parent categories (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others) with sensible native emojis for icons and hex codes for colors in the Categories sheet, satisfying CAT-05.</action>
  <verify>Check that `src/Setup.ts` exports/defines `setup()` function and contains headers/seed data logic.</verify>
  <acceptance_criteria>
    - `setup()` function handles tab creation (Transactions, Categories, Budgets, Settings)
    - Sets correct column headers for all 4 sheets
    - Seeds default categories with emojis and colors
  </acceptance_criteria>
  <done>Setup.ts implementation matches schema specification</done>
</task>

<task type="auto">
  <name>Task 3: Implement Utilities for Concurrency and Auth</name>
  <files>src/Utils.ts</files>
  <read_first>.planning/phases/01-foundation-sheet-schema/01-RESEARCH.md</read_first>
  <action>Create `src/Utils.ts`. Implement `withLock(callback)` that uses `LockService.getScriptLock()` with a sensible timeout (e.g., 10000ms) to prevent race conditions during row insertion. Implement `verifyTelegramWebAppData(initData)` using Google Apps Script's `Utilities.computeHmacSha256Signature` to validate Telegram's initData string, relying on `PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN')`.</action>
  <verify>Check that `src/Utils.ts` defines `withLock` and `verifyTelegramWebAppData`.</verify>
  <acceptance_criteria>
    - Uses `LockService` for concurrency management
    - Uses `Utilities.computeHmacSha256Signature` for Telegram authentication
  </acceptance_criteria>
  <done>Concurrency and authentication utilities are implemented</done>
</task>

<task type="auto">
  <name>Task 4: Stub the GAS entry point API</name>
  <files>src/API.ts</files>
  <read_first>.planning/phases/01-foundation-sheet-schema/01-RESEARCH.md</read_first>
  <action>Create `src/API.ts`. Implement a basic `doPost(e)` function stub that parses `e.postData.contents`, safely extracts the `action` field, and returns a JSON response indicating success or failure. This lays the groundwork for Phase 3 API routing.</action>
  <verify>Check that `src/API.ts` exports/defines `doPost(e)`.</verify>
  <acceptance_criteria>
    - Defines `doPost(e)` function
    - Returns a valid JSON stringified ContentService response
  </acceptance_criteria>
  <done>API entry point is established</done>
</task>
</tasks>

<verification>
Before declaring plan complete:
- [ ] TypeScript syntax check passes (if `tsc` or `clasp` check is available)
- [ ] Code is formatted and structurally sound for Google Apps Script
</verification>

<success_criteria>
- All tasks completed
- Source files are ready to be pushed via clasp
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-sheet-schema/01-SUMMARY.md`
</output>
