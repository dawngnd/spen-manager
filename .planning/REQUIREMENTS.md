# Requirements: Spen Manager

**Defined:** 2026-08-02
**Core Value:** Mọi giao dịch ngân hàng được tự động capture và dễ dàng phân loại — không bỏ sót, không phải nhập tay.

## v1 Requirements

### Email Pipeline

- [ ] **PIPE-01**: System tự động fetch email mới từ Gmail theo interval (time-triggered, mỗi 5-10 phút)
- [ ] **PIPE-02**: System parse email Timo Bank bằng regex để trích xuất: số tiền, loại giao dịch (chi/thu/chuyển), merchant/mô tả, ngày giờ, mã tham chiếu
- [ ] **PIPE-03**: System lưu giao dịch vào Google Sheet với trạng thái "uncategorized"
- [ ] **PIPE-04**: System deduplicate giao dịch dựa trên gmail_message_id — không xử lý lại email đã parse
- [ ] **PIPE-05**: System đưa email không parse được vào hàng đợi "unparsed" thay vì bỏ qua
- [ ] **PIPE-06**: Email parser có kiến trúc provider-configurable — dễ dàng thêm bank mới (VCB, Techcombank...)
- [ ] **PIPE-07**: System gắn label "processed" cho email đã xử lý trên Gmail

### Categories

- [ ] **CAT-01**: User có thể tạo parent category mới (ví dụ: Food & Dining, Transport, Shopping)
- [ ] **CAT-02**: User có thể tạo child category thuộc một parent (ví dụ: Food > Breakfast, Food > Coffee)
- [ ] **CAT-03**: User có thể sửa tên, icon, color của category (parent hoặc child)
- [ ] **CAT-04**: User có thể xóa category (child hoặc parent nếu không có child)
- [ ] **CAT-05**: System pre-seed danh sách default categories khi khởi tạo (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others)
- [ ] **CAT-06**: Mỗi category có icon và color để phân biệt trực quan

### Transaction Categorization

- [ ] **TXN-01**: User thấy danh sách giao dịch chưa phân loại (inbox) trong Mini App
- [ ] **TXN-02**: User có thể gán category (parent + child) cho giao dịch chưa phân loại
- [ ] **TXN-03**: Giao dịch được phân loại thay đổi trạng thái từ "uncategorized" sang "categorized"
- [ ] **TXN-04**: User có thể xem danh sách tất cả giao dịch (đã và chưa phân loại) với filter

### Dashboard

- [ ] **DASH-01**: User thấy KPI tổng quan tháng hiện tại: Tổng thu, Tổng chi, Số dư ròng (Thu - Chi), Số giao dịch chưa phân loại
- [ ] **DASH-02**: User thấy biểu đồ pie/donut phân bổ chi tiêu theo parent category
- [ ] **DASH-03**: User thấy biểu đồ bar/line trend chi tiêu theo tháng
- [ ] **DASH-04**: User có thể so sánh chi tiêu giữa các tháng
- [ ] **DASH-05**: User thấy danh sách top merchants/đơn vị chi nhiều nhất

### Budget

- [ ] **BDG-01**: User có thể đặt ngân sách tháng cho từng parent category hoặc child category
- [ ] **BDG-02**: User thấy tiến độ chi tiêu vs ngân sách với chỉ báo màu (xanh <80%, vàng 80-100%, đỏ >100%)
- [ ] **BDG-03**: User thấy số tiền còn lại hoặc vượt ngân sách cho mỗi category

### Telegram Integration

- [ ] **TG-01**: System gửi Telegram notification ngay khi parse được giao dịch mới (số tiền, merchant, loại)
- [ ] **TG-02**: Notification có inline button "Open Spen Manager" để mở Mini App trực tiếp
- [ ] **TG-03**: Mini App tự động sync dark/light theme với Telegram

### Infrastructure

- [ ] **INF-01**: Frontend deploy trên GitHub Pages (single HTML hoặc static SPA)
- [ ] **INF-02**: Backend deploy qua clasp push lên Google Apps Script
- [ ] **INF-03**: GitHub Actions CI/CD tự động deploy khi push code
- [ ] **INF-04**: GAS API sử dụng LockService chống concurrent write corruption
- [ ] **INF-05**: GAS API validate Telegram initData bằng HMAC-SHA256

## v2 Requirements

### Transaction Management

- **TXN-V2-01**: User có thể thêm giao dịch thủ công (không qua email)
- **TXN-V2-02**: User có thể sửa thông tin giao dịch đã lưu
- **TXN-V2-03**: User có thể xóa giao dịch

### Smart Features

- **SMART-01**: System gợi ý category dựa trên rule-based matching (merchant name → category)
- **SMART-02**: System phát hiện giao dịch định kỳ (recurring transactions)
- **SMART-03**: User có thể export dữ liệu ra CSV

### Multi-Provider

- **PROV-01**: Parser cho VCB (Vietcombank) email
- **PROV-02**: Parser cho Techcombank email

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI/LLM categorization | User muốn tự kiểm soát, tránh phụ thuộc API key và chi phí |
| Multi-user / shared wallets | Single user app, chỉ mình dev sử dụng |
| Multi-currency / exchange rates | Chỉ dùng VND |
| Native mobile app | Telegram Mini App là đủ |
| Bank API integration (OAuth/Plaid) | Quá phức tạp, email là đủ cho use case |
| Real-time sync / WebSocket | Polling-based là đủ cho personal use |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 2 | Pending |
| PIPE-02 | Phase 2 | Pending |
| PIPE-03 | Phase 2 | Pending |
| PIPE-04 | Phase 2 | Pending |
| PIPE-05 | Phase 2 | Pending |
| PIPE-06 | Phase 2 | Pending |
| PIPE-07 | Phase 2 | Pending |
| CAT-01 | Phase 4 | Pending |
| CAT-02 | Phase 4 | Pending |
| CAT-03 | Phase 4 | Pending |
| CAT-04 | Phase 4 | Pending |
| CAT-05 | Phase 1 | Pending |
| CAT-06 | Phase 4 | Pending |
| TXN-01 | Phase 4 | Pending |
| TXN-02 | Phase 4 | Pending |
| TXN-03 | Phase 4 | Pending |
| TXN-04 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| BDG-01 | Phase 5 | Pending |
| BDG-02 | Phase 5 | Pending |
| BDG-03 | Phase 5 | Pending |
| TG-01 | Phase 2 | Pending |
| TG-02 | Phase 2 | Pending |
| TG-03 | Phase 4 | Pending |
| INF-01 | Phase 6 | Pending |
| INF-02 | Phase 6 | Pending |
| INF-03 | Phase 6 | Pending |
| INF-04 | Phase 3 | Pending |
| INF-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-02*
*Last updated: 2026-08-02 after initial definition*
