---
phase: 03
type: api-coverage
created: 2026-08-03
---

# Phase 03 — API Coverage Matrix

> Enumerates every external API capability this phase integrates with a disposition.

## External APIs

### 1. Telegram Bot API — initData Validation

| Capability | Disposition | Reason |
|-----------|-------------|--------|
| initData HMAC-SHA256 validation | INTEGRATE | Core auth mechanism — Worker validates x-telegram-init-data header using BOT_TOKEN-derived HMAC key per Telegram spec |
| WebApp.initData parsing | INTEGRATE | URLSearchParams parsing of initData to extract data-check-string and hash for validation |
| Bot token secret derivation | INTEGRATE | HMAC-SHA256 of "WebAppData" with bot token to derive secret key |

### 2. Google Apps Script — Web App Endpoint

| Capability | Disposition | Reason |
|-----------|-------------|--------|
| doPost text/plain | INTEGRATE | GAS receives POST requests from Worker proxy with action+payload in body |
| ContentService JSON response | INTEGRATE | All 6 action handlers return JSON via ContentService.createTextOutput |
| LockService concurrent access | INTEGRATE | Write operations (upsert_category, delete_category, categorize_transaction) use withLock |
| SpreadsheetApp sheet access | INTEGRATE | Read/write Categories (5 cols) and Transactions (10 cols) sheets |

### 3. Cloudflare Workers Runtime

| Capability | Disposition | Reason |
|-----------|-------------|--------|
| crypto.subtle (Web Crypto API) | INTEGRATE | HMAC-SHA256 for initData validation — ported from GAS Utilities |
| fetch() proxy | INTEGRATE | Forward authenticated requests to GAS Web App URL |
| Environment bindings | INTEGRATE | TELEGRAM_BOT_TOKEN (secret), GAS_WEB_APP_URL (var) |
| CORS preflight | INTEGRATE | OPTIONS handler returns Access-Control-Allow-Origin: * for Telegram Mini App |

## Coverage Summary

- **Total capabilities:** 10
- **INTEGRATE:** 10
- **OPT-OUT:** 0
- **Coverage:** 100%
