---
phase: 03
type: api-coverage
created: 2026-08-03
---

# API Coverage — Phase 03

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| Telegram initData HMAC-SHA256 validation | INTEGRATE | Core auth — Worker validates x-telegram-init-data via crypto.subtle |
| Telegram WebApp.initData parsing | INTEGRATE | Extract data-check-string and hash for HMAC comparison |
| Telegram bot token secret key derivation | INTEGRATE | HMAC-SHA256 of WebAppData with bot token |
| GAS doPost text/plain endpoint | INTEGRATE | GAS receives POST from Worker proxy |
| GAS get_categories action | INTEGRATE | Read Categories sheet |
| GAS upsert_category action | INTEGRATE | Create/update category with withLock |
| GAS delete_category action | INTEGRATE | Delete category with withLock |
| GAS get_transactions action | INTEGRATE | Read Transactions sheet flat data per D-03 |
| GAS categorize_transaction action | INTEGRATE | Update transaction category with withLock |
| GAS get_dashboard action | INTEGRATE | Same as get_transactions frontend aggregation per D-04 |
| GAS LockService concurrency | INTEGRATE | All write operations guarded |
| CF Workers crypto.subtle HMAC-SHA256 | INTEGRATE | Web Crypto API for initData validation |
| CF Workers fetch proxy | INTEGRATE | Forward authenticated requests to GAS |
| CF Workers environment bindings | INTEGRATE | TELEGRAM_BOT_TOKEN secret and GAS_WEB_APP_URL var |
| CF Workers CORS preflight | INTEGRATE | OPTIONS handler for Telegram Mini App |
