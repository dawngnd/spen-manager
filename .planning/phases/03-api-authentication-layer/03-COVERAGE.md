---
phase: 03
type: api-coverage
created: 2026-08-03
---

# API Coverage — Telegram Bot API

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| initData HMAC-SHA256 validation | INTEGRATE | Core auth — Worker validates x-telegram-init-data via crypto.subtle |
| WebApp.initData URLSearchParams parsing | INTEGRATE | Extract data-check-string and hash for HMAC comparison |
| Bot token secret key derivation | INTEGRATE | HMAC-SHA256 of "WebAppData" with bot token |

# API Coverage — Google Apps Script Web App

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| doPost text/plain endpoint | INTEGRATE | GAS receives POST from Worker proxy |
| get_categories action | INTEGRATE | Read Categories sheet |
| upsert_category action | INTEGRATE | Create/update category with withLock |
| delete_category action | INTEGRATE | Delete category with withLock |
| get_transactions action | INTEGRATE | Read Transactions sheet (flat data per D-03) |
| categorize_transaction action | INTEGRATE | Update transaction category with withLock |
| get_dashboard action | INTEGRATE | Same as get_transactions (frontend aggregation per D-04) |
| LockService concurrency | INTEGRATE | All write operations guarded |

# API Coverage — Cloudflare Workers Runtime

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| crypto.subtle HMAC-SHA256 | INTEGRATE | Web Crypto API for initData validation |
| fetch proxy | INTEGRATE | Forward authenticated requests to GAS |
| Environment bindings | INTEGRATE | TELEGRAM_BOT_TOKEN secret + GAS_WEB_APP_URL var |
| CORS preflight | INTEGRATE | OPTIONS handler for Telegram Mini App |
