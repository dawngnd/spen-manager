# Phase 2: Email Pipeline & Telegram Notifications - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate bank email ingestion from Gmail and push Telegram alerts for each new transaction. Handles fetching emails, parsing Timo bank format, saving to Google Sheets, deduplication, unparsed queue handling, and sending Telegram notifications.

</domain>

<decisions>
## Implementation Decisions

### Provider Configuration
- **D-01:** Hardcoded in TypeScript — **Reversibility:** reversible — [safer, version-controlled, easier to test and prevents accidental breaks]

### Unparsed Queue Alerts
- **D-02:** Send a silent notification for unparsed emails — **Reversibility:** reversible — [Know when regex breaks, but avoid noise]

### the agent's Discretion
Any details regarding exact regex structure, specific error handling logic, and telegram formatting.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Project context and vision
- `.planning/REQUIREMENTS.md` — Requirement list (PIPE-01..07, TG-01, TG-02)
- `.planning/ROADMAP.md` — Roadmap goals and criteria for Phase 2

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `email-to-sheet` clone architecture: Reference how the previous project fetched and parsed emails.
- `src/Utils.ts` (from Phase 1): Contains concurrency helpers (`withLock`) that should be used when writing to the Sheet.
- `src/Setup.ts` (from Phase 1): Defines the Sheet structure (Transactions tab) where parsed emails will go.

### Established Patterns
- Time-triggered execution: Setting up Google Apps Script triggers to run periodically (every 5-10 minutes).
- Deduplication: Tracking processed `gmail_message_id` to prevent double-insertions.

### Integration Points
- Gmail App Service for reading emails and applying labels.
- Telegram Bot API for pushing notifications.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Email Pipeline & Telegram Notifications*
*Context gathered: 2026-08-02*
