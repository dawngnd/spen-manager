# Phase 3: API & Authentication Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-03
**Phase:** 03-api-authentication-layer
**Areas discussed:** API response format, Auth integration point, Dashboard aggregation, Error handling contract

---

## API Response Format

| Option | Description | Selected |
|--------|-------------|----------|
| Flat data + frontend join | Transactions trả về category_id, frontend lookup từ categories list đã fetch riêng | ✓ |
| Nested/enriched | Transactions trả kèm category_name, icon, color. Frontend không cần join nhưng payload lớn hơn | |

**User's choice:** Flat data + frontend tự join
**Notes:** Giảm payload, tách biệt rõ ràng.

---

## Auth Integration Point

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware-style (GAS) | Validate initData 1 lần trong doPost() trước khi route | |
| Per-handler (GAS) | Mỗi action handler tự gọi verify | |
| Cloudflare Worker middleware | Worker validate initData, forward to GAS | ✓ |

**User's choice:** Auth ở Worker layer — Cloudflare Worker validate initData, GAS không cần biết về Telegram auth.
**Notes:** User đang sử dụng Cloudflare Worker làm trung gian. Web page gọi qua worker, rồi từ worker mới điều hướng vào GAS. Cần bổ sung viết middleware cho Cloudflare Worker. Worker code nằm trong `worker/` subfolder, deploy bằng wrangler CLI.

---

## Dashboard Aggregation

| Option | Description | Selected |
|--------|-------------|----------|
| Backend aggregation | GAS tính sẵn sum/group by category, monthly totals, top merchants | |
| Frontend aggregation | get_dashboard trả về raw transactions, frontend tự tính | ✓ |
| Hybrid | Backend tính KPIs + category breakdown, frontend nhận thêm recent transactions | |

**User's choice:** Frontend aggregation
**Notes:** Linh hoạt hơn cho filter/drill-down. get_dashboard thực chất giống get_transactions.

---

## Error Handling Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Chuẩn hóa | Error response có error_code (enum) + message (human-readable) | |
| Simple strings | Chỉ trả { success: false, error: "message" } như hiện tại | ✓ |

**User's choice:** Simple strings
**Notes:** Đơn giản, frontend show trực tiếp. Giữ pattern hiện tại.

---

## the agent's Discretion

- Exact action handler implementation details (sheet reads/writes, data validation)
- Worker routing logic and CORS handling
- LockService granularity (which actions need locks — only write operations)

## Deferred Ideas

None — discussion stayed within phase scope.
