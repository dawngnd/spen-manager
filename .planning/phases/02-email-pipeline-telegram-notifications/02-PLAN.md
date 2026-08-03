---
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - src/Setup.ts
  - src/Telegram.ts
  - src/providers/EmailProvider.ts
  - src/providers/TimoProvider.ts
  - src/EmailProcessor.ts
  - src/Triggers.ts
autonomous: true
---

# Phase 2: Email Pipeline & Telegram Notifications - Plan

## Tasks

<task id="1" type="tracer">
  <name>Tracer: Telegram Utility & Sheet Schema Update</name>
  <description>Update the sheet initialization to include an `Unparsed` sheet and implement the basic Telegram utility. Write a test function to prove the Telegram bot API works and that we can insert a dummy row into the new sheet.</description>
  <requirements>TG-01</requirements>
  <reversibility_gate>Is the Telegram API call isolated so we can mock or change it later? Yes, all API calls are isolated within `src/Telegram.ts`.</reversibility_gate>
  <read_first>Read `src/Setup.ts` to understand how the base sheets are currently initialized.</read_first>
  <acceptance_criteria>
    - `Setup.ts` is updated to create an `Unparsed` sheet with columns for Date, MessageID, Subject, and Body.
    - `src/Telegram.ts` is created with a `sendMessage(text, options)` function wrapping `UrlFetchApp`.
    - A `testTelegram()` function successfully sends a test message and writes a row to the Unparsed sheet.
  </acceptance_criteria>
</task>

<task id="2">
  <name>Email Provider Architecture & Timo Parser</name>
  <description>Define the standard `EmailProvider` interface and implement the `TimoProvider` with regex patterns to extract transaction details from Timo bank emails.</description>
  <requirements>PIPE-02, PIPE-06</requirements>
  <reversibility_gate>Are providers modular? Yes, the architecture requires an array of interface-compliant providers, making them easily swappable.</reversibility_gate>
  <read_first>Review `.planning/phases/02-email-pipeline-telegram-notifications/02-RESEARCH.md` for the proposed `EmailProvider` interface.</read_first>
  <acceptance_criteria>
    - `src/providers/EmailProvider.ts` defines the provider interface returning `amount`, `type`, `merchant`, `date`, and `reference`.
    - `src/providers/TimoProvider.ts` implements the interface.
    - TimoProvider correctly uses regex to extract the necessary fields from a raw email body.
  </acceptance_criteria>
</task>

<task id="3">
  <name>Email Ingestion & Deduplication Logic</name>
  <description>Implement the core logic to fetch unread emails via `GmailApp` and check for existing `gmail_message_id` in the Google Sheet to prevent duplicates.</description>
  <requirements>PIPE-04</requirements>
  <reversibility_gate>Is the deduplication mechanism robust to execution overlaps? Yes, by combining `gmail_message_id` checks with Google Apps Script's `LockService`.</reversibility_gate>
  <read_first>Check `src/Utils.ts` for the `withLock()` concurrency mechanism implemented in Phase 1.</read_first>
  <acceptance_criteria>
    - Script fetches unread emails matching Timo bank sender.
    - Script reads `Transactions` and `Unparsed` sheets to build a set of already processed `gmail_message_id`s.
    - Emails whose IDs are in the processed set are skipped.
  </acceptance_criteria>
</task>

<task id="4">
  <name>Core Pipeline Assembly</name>
  <description>Assemble the `processEmails` function to orchestrate fetching, parsing, saving, labeling, and notifying. Connect all previous components together.</description>
  <requirements>PIPE-03, PIPE-05, PIPE-07, TG-01, TG-02</requirements>
  <reversibility_gate>What happens if parsing fails? The pipeline catches the failure and routes the raw email to the Unparsed queue instead of silently dropping it.</reversibility_gate>
  <read_first>Review Telegram Bot API docs for sending inline keyboards (for the "Open Spen Manager" button).</read_first>
  <acceptance_criteria>
    - Successfully parsed transactions are appended to the `Transactions` sheet with the status "uncategorized".
    - Emails that fail parsing are appended to the `Unparsed` sheet.
    - The Gmail thread is labeled with `spen-processed`.
    - Telegram notifications are dispatched for successful parses (including amount, merchant, type, and the "Open Spen Manager" inline button using `MINI_APP_URL`).
    - Silent Telegram notifications are dispatched for unparsed emails.
    - All sheet writes are protected by `withLock()`.
  </acceptance_criteria>
</task>

<task id="5">
  <name>Time-Driven Trigger Setup</name>
  <description>Create a setup script to programmatically install and manage the 10-minute time-driven trigger for the `processEmails` pipeline.</description>
  <requirements>PIPE-01</requirements>
  <reversibility_gate>Can the trigger be cleanly uninstalled? Yes, the script will provide functions to both install and clear triggers.</reversibility_gate>
  <read_first>Check for any existing trigger management code in the project.</read_first>
  <acceptance_criteria>
    - `src/Triggers.ts` exposes an `installTriggers()` function.
    - Executing the function creates a Google Apps Script time-driven trigger that runs `processEmails` every 10 minutes.
  </acceptance_criteria>
</task>

## Verification Criteria

- [ ] `processEmails` runs without errors when triggered manually.
- [ ] Duplicate emails (same `gmail_message_id`) do not create duplicate rows in `Transactions` or `Unparsed` sheets.
- [ ] Successfully parsed emails appear in the `Transactions` sheet and the user receives a Telegram message with an inline button.
- [ ] Unparseable emails are caught, stored in the `Unparsed` sheet, and trigger a silent Telegram alert.
- [ ] Processed emails correctly receive the `spen-processed` label in Gmail.
- [ ] The pipeline supports adding new banks just by implementing a new class matching `EmailProvider`.
