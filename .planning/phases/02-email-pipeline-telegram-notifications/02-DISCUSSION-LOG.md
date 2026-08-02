# Phase 2: Email Pipeline & Telegram Notifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-02
**Phase:** 2-email-pipeline-telegram-notifications
**Areas discussed:** Provider Configuration, Unparsed Queue Alerts

---

## Provider Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded in TypeScript | (Recommended) Safer, version-controlled, easier to test and prevents accidental breaks | ✓ |
| In a "Settings" tab in the Google Sheet | Easier to update without deploying, but brittle if regex has typos | |
| Hybrid | TS for regex patterns, Sheet for active/inactive toggles | |

**User's choice:** Hardcoded in TypeScript
**Notes:** Safer approach preventing accidental breakages.

---

## Unparsed Queue Alerts

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, send a silent notification | (Recommended) Know when regex breaks, but avoid noise | ✓ |
| Yes, send a normal notification just like a successful transaction | Treat failures as urgent | |
| No, just log it in the Sheet | Keep notifications only for successful transactions | |

**User's choice:** Yes, send a silent notification
**Notes:** This allows knowing when regex breaks without unnecessary noise.

---

## the agent's Discretion

Any details regarding exact regex structure, specific error handling logic, and telegram formatting.

## Deferred Ideas

None
