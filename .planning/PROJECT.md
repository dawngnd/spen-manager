# Spen Manager

## What This Is

App quản lý chi tiêu cá nhân qua Telegram Mini App. Tự động thu thập giao dịch từ email ngân hàng (bắt đầu với Timo), lưu vào Google Sheet, và gửi thông báo Telegram. User mở Mini App để phân loại giao dịch theo hệ thống category 2 cấp (parent/child), xem dashboard thống kê chi tiêu.

## Core Value

Mọi giao dịch ngân hàng được tự động capture và dễ dàng phân loại — không bỏ sót, không phải nhập tay.

## Requirements

### Validated

- [x] Lưu giao dịch vào Google Sheet (chưa phân loại) (Validated in Phase 1: Foundation & Sheet Schema)
- [x] Email pipeline tự động fetch + parse email ngân hàng (clone logic từ email-to-sheet, provider-based config, bắt đầu với Timo) (Validated in Phase 2: Email Pipeline & Telegram Notifications)
- [x] Gửi Telegram notification khi có giao dịch mới (Validated in Phase 2: Email Pipeline & Telegram Notifications)

### Active
- [ ] Telegram Mini App (Vite + React + TypeScript) để phân loại giao dịch
- [ ] Hệ thống category 2 cấp (parent/child) — quản lý qua Mini App
- [ ] Hỗ trợ 3 loại giao dịch: chi (expense), thu (income), chuyển khoản (transfer)
- [ ] Dashboard thống kê: category breakdown (pie), chi tiêu theo tháng (bar/line), so sánh tháng, top merchants
- [ ] Budget tracking — cài ngân sách cho từng category
- [ ] Deploy: GitHub Pages (frontend) + clasp CI/CD (backend)

### Out of Scope

- Thêm giao dịch thủ công — phát triển sau
- Sửa/xóa giao dịch — phát triển sau
- Multi-user support — chỉ single user
- Mobile native app — chỉ Telegram Mini App
- AI categorization tự động — user tự phân loại qua Mini App

## Context

- **Prior art**: 2 project đang hoạt động:
  - `email-to-sheet`: GAS pipeline đọc Gmail → parse → lưu Sheet → notify Telegram. Đang hoạt động tốt, cần clone logic pipeline.
  - `save-manager`: GAS backend + Vite/React/TS frontend (Telegram Mini App). Pattern đã proven, cần clone kiến trúc.
- **Email provider**: Bắt đầu với Timo bank, thiết kế theo config từng provider một (extensible)
- **User**: Chỉ mình dev sử dụng, không cần auth phức tạp
- **Data flow**: Email → GAS fetch/parse → Sheet → Telegram notify → User opens Mini App → Categorize → Dashboard

## Constraints

- **Tech stack**: Google Apps Script + Google Sheet (backend/DB), Vite + React + TypeScript (frontend), Telegram Bot API + Mini App
- **Single user**: Không cần hệ thống auth, chỉ validate Telegram user ID
- **Free tier**: Sử dụng hoàn toàn dịch vụ miễn phí (GAS, Google Sheet, GitHub Pages, Telegram)
- **Email parsing**: Không dùng AI, parse bằng regex/template theo từng email provider

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clone pipeline từ email-to-sheet | Đã hoạt động ổn định, không cần viết lại từ đầu | — Pending |
| Category 2 cấp (parent/child) | Dễ làm báo cáo theo nhóm lớn (Food, Transport...) và chi tiết (Food > Ăn sáng, Café...) | — Pending |
| Không dùng AI phân loại | User muốn tự kiểm soát phân loại, tránh phụ thuộc API key | — Pending |
| Vite + React + TS cho Mini App | Pattern đã proven từ save-manager, familiar stack | — Pending |
| GAS + Google Sheet | Stack quen thuộc, miễn phí, đã có kinh nghiệm từ 2 project trước | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-03 after Phase 2 completion*
