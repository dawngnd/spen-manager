# Phase 2: Email Pipeline & Telegram Notifications - Research

## Overview

This phase implements the background automation that fetches bank emails, parses transaction data, saves it to the Google Sheet, and notifies the user via Telegram. Since this runs in the Google Apps Script (GAS) environment, we will utilize `GmailApp` for email access and time-driven triggers for scheduling.

## Technical Approach

### 1. Email Ingestion (GmailApp)
- **Fetching:** Use `GmailApp.search(query)` to find unread Timo bank emails. The query might look like: `from:(timo.vn) -label:spen-processed`.
- **Trigger:** Create a top-level exported function `processEmails()` that will be bound to a time-driven trigger (every 5-10 minutes) set up either manually or via a setup function.

### 2. Provider Architecture
- Define a generic `EmailProvider` interface:
  ```typescript
  interface ParsedTransaction {
    amount: number;
    type: 'income' | 'expense';
    merchant: string;
    date: Date;
    reference: string;
  }
  
  interface EmailProvider {
    name: string;
    match: (subject: string, from: string) => boolean;
    parse: (body: string, subject: string) => ParsedTransaction | null;
  }
  ```
- Implement `TimoProvider` with regex patterns to extract amount, type (chi/thu/chuyển), merchant, date, and reference. 

### 3. Google Sheets Integration & Deduplication
- **Sheet:** `Transactions` (already defined in `Setup.ts`).
- **Deduplication:** Before inserting, load the `gmail_message_id` column from the `Transactions` sheet (and `Unparsed` sheet) to ensure we don't double-process emails. 
- **Concurrency:** Wrap sheet read/writes in the existing `withLock()` utility from `src/Utils.ts` to prevent data corruption during parallel trigger executions.
- **Labeling:** After successful insertion, apply a specific Gmail label (e.g., `spen-processed`) to the email thread/message via `message.getThread().addLabel()`.

### 4. Unparsed Queue
- For emails that match the provider but fail to parse (e.g., regex changes), save them to an `Unparsed` sheet (we'll need to update `Setup.ts` to create this sheet).
- Send a *silent* Telegram notification for unparsed emails so the developer is aware but not disrupted.

### 5. Telegram Notifications
- Use `UrlFetchApp.fetch` to call the Telegram Bot API: `https://api.telegram.org/bot<TOKEN>/sendMessage`.
- **Properties:** Require `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `MINI_APP_URL` in `PropertiesService`.
- **Format:** Include amount, merchant, type.
- **Inline Button:** Add an inline keyboard button "Open Spen Manager" using the `MINI_APP_URL`.

## Validation Architecture

1. **Regex Robustness:** The regex in `TimoProvider` is the most fragile part. The architecture isolates it so we can easily add unit tests (if we run tests locally via Jest) or handle failures gracefully by routing to the `Unparsed` queue.
2. **Idempotency:** By checking `gmail_message_id` in the Sheet *and* relying on Gmail labels, we ensure that multiple executions of the trigger won't create duplicate transactions.
3. **Locking mechanism:** Relying on `withLock()` ensures that if the time-driven trigger overlaps with itself, or with manual API calls in the future, the Sheet append operation remains atomic.
4. **Environment Variables Check:** The `processEmails` function must validate the presence of necessary Script Properties before attempting to call the Telegram API.

## Implementation Steps (Plan Outline)
1. Update `Setup.ts` to add the `Unparsed` sheet (or `Unparsed_Emails`).
2. Implement the `EmailProvider` interface and the `TimoProvider`.
3. Implement Telegram notification utility (`Telegram.ts`).
4. Implement the core `processEmails` function (fetching, parsing, deduplication, locking, sheet append, labeling).
5. Create a function to install the time-driven trigger.

## RESEARCH COMPLETE
