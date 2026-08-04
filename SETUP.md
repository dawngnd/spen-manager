# Spen Manager — Hướng dẫn Setup & Deploy

> Quản lý chi tiêu cá nhân: tự động capture giao dịch ngân hàng từ email, phân loại qua Telegram Mini App.

## Kiến trúc tổng quan

```
Gmail (bank emails)
    ↓ (GAS time-trigger mỗi 10 phút)
Google Apps Script ←→ Google Sheets (data store)
    ↓ (Telegram notification)
Telegram Bot → User bấm "Open Spen Manager"
    ↓
Telegram Mini App (React SPA trên GitHub Pages)
    ↓ (API call kèm initData)
Cloudflare Worker (validate HMAC-SHA256)
    ↓ (proxy)
Google Apps Script (doPost API)
```

---

## Yêu cầu

- Node.js ≥ 22
- npm
- Git
- Tài khoản Google (Gmail + Google Sheets)
- Tài khoản Cloudflare (Workers free tier)
- Telegram Bot (tạo qua @BotFather)
- GitHub repo (public hoặc private)

---

## Bước 1: Tạo Telegram Bot

1. Mở Telegram, tìm **@BotFather**
2. Gửi `/newbot`, đặt tên bot (vd: `Spen Manager`)
3. Lưu lại **BOT_TOKEN** (dạng `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Gửi `/setmenubutton` → chọn bot → gửi URL Mini App (sẽ cấu hình sau)
5. Lấy **CHAT_ID** của bạn:
   - Gửi tin nhắn bất kỳ cho bot
   - Truy cập: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
   - Tìm `"chat":{"id": 123456789}` → đó là CHAT_ID

---

## Bước 2: Tạo Google Sheets & GAS Project

### 2.1 Tạo Google Sheets

1. Vào [Google Sheets](https://sheets.google.com) → tạo Spreadsheet mới
2. Đặt tên: `Spen Manager Data`
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### 2.2 Tạo Google Apps Script Project

1. Vào [Google Apps Script](https://script.google.com) → New Project
2. Đặt tên: `Spen Manager`
3. Copy **Script ID** từ Settings → IDs:
   ```
   Script ID: 1jJfwjzf_Vl5Y22wEzf...
   ```

### 2.3 Cấu hình clasp (local)

```bash
# Cài clasp globally
npm install -g @google/clasp

# Login (mở browser để authorize)
clasp login

# Clone project từ Script ID vào thư mục tạm (để lấy credentials)
# KHÔNG cần làm bước này nếu đã có .clasp.json
```

Tạo file `.clasp.json` ở root project:
```json
{
  "scriptId": "<SCRIPT_ID>",
  "rootDir": "dist"
}
```

### 2.4 Build & Deploy GAS lần đầu

```bash
# Cài dependencies
npm install

# Build TypeScript → dist/Code.js
npm run build

# Push lên GAS
clasp push --force
```

### 2.5 Cấu hình Script Properties trong GAS

Vào [Google Apps Script Editor](https://script.google.com) → Project Settings → Script Properties → Add:

| Property | Value | Mô tả |
|----------|-------|--------|
| `SPREADSHEET_ID` | `1ABC...xyz` | ID của Google Sheets |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | Token bot từ BotFather |
| `TELEGRAM_CHAT_ID` | `987654321` | Chat ID của bạn |

### 2.6 Chạy Setup & Deploy Web App

1. Trong GAS Editor, mở file `Code.gs`
2. Chọn function `setup` từ dropdown → bấm **Run**
3. Cho phép quyền (OAuth consent) khi được hỏi
4. Kiểm tra Google Sheets — 5 tabs sẽ được tạo: `Transactions`, `Categories`, `Budgets`, `Settings`, `Unparsed`

**Deploy Web App:**

1. Trong GAS Editor → **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Bấm **Deploy**
6. Copy **Web App URL** (dạng `https://script.google.com/macros/s/AKfycb.../exec`)

### 2.7 Cài đặt Time Trigger

Trong GAS Editor, chọn function `installTriggers` → **Run**

Hoặc vào **Triggers** (biểu tượng đồng hồ bên trái) → Add Trigger:
- Function: `processEmails`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every 10 minutes

---

## Bước 3: Deploy Cloudflare Worker

### 3.1 Cài Wrangler CLI

```bash
npm install -g wrangler

# Login vào Cloudflare
wrangler login
```

### 3.2 Cấu hình Worker

Sửa file `worker/wrangler.toml`:

```toml
name = "spen-manager-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec"
```

Thay `GAS_WEB_APP_URL` bằng URL Web App từ Bước 2.6.

### 3.3 Thêm Secret

```bash
cd worker

# Thêm Telegram Bot Token làm secret (nhập token khi được hỏi)
wrangler secret put TELEGRAM_BOT_TOKEN
```

### 3.4 Deploy

```bash
cd worker
wrangler deploy
```

Lưu lại **Worker URL** (dạng `https://spen-manager-api.<your-subdomain>.workers.dev`)

---

## Bước 4: Deploy Frontend (GitHub Pages)

### 4.1 Cấu hình GitHub Secrets

Vào repo GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value | Mô tả |
|--------|-------|--------|
| `VITE_API_URL` | `https://spen-manager-api.xxx.workers.dev` | URL Cloudflare Worker |
| `CLASP_REFRESH_TOKEN` | `1//0abc...` | Token từ `~/.clasprc.json` |
| `CLASP_SCRIPT_ID` | `1jJfwjzf...` | Script ID của GAS project |

**Lấy CLASP_REFRESH_TOKEN:**
```bash
cat ~/.clasprc.json
# Tìm field "refresh_token" trong JSON
```

### 4.2 Enable GitHub Pages

1. Vào repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `/ (root)`
4. Bấm **Save**

### 4.3 Trigger Deploy

Push bất kỳ thay đổi trong `frontend/` lên `main`:
```bash
git push origin main
```

Hoặc trigger thủ công:
- Vào **Actions** → **Deploy Frontend to GitHub Pages** → **Run workflow**

Frontend sẽ live tại: `https://<username>.github.io/spen-manager/`

---

## Bước 5: Kết nối Telegram Mini App

1. Mở Telegram, tìm **@BotFather**
2. Gửi `/mybots` → chọn bot
3. Chọn **Bot Settings** → **Menu Button** → **Configure menu button**
4. Gửi URL: `https://<username>.github.io/spen-manager/`
5. Gửi text cho button: `Open Spen Manager`

Hoặc dùng Mini App button:
1. `/mybots` → chọn bot → **Bot Settings** → **Menu Button**
2. Hoặc set Web App URL qua API:
```
https://api.telegram.org/bot<TOKEN>/setChatMenuButton?menu_button={"type":"web_app","text":"Spen Manager","web_app":{"url":"https://<username>.github.io/spen-manager/"}}
```

---

## Bước 6: Kiểm tra hoạt động

### Test 1: GAS API
```bash
curl -X POST "https://spen-manager-api.xxx.workers.dev" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: test" \
  -d '{"action":"ping"}'
```
→ Kết quả mong đợi: `401 Unauthorized` (vì initData không hợp lệ — đúng behavior)

### Test 2: Telegram Notification
- Trong GAS Editor, chọn function `testTelegram` → **Run**
- Bot sẽ gửi tin nhắn "Test message from Spen Manager" vào chat

### Test 3: Email Processing
- Trong GAS Editor, chọn function `processEmails` → **Run**
- Nếu có email ngân hàng mới, transaction sẽ xuất hiện trong Sheets

### Test 4: Mini App
- Mở Telegram → chat với bot → bấm **Menu Button**
- Mini App mở ra trong Telegram với giao diện Inbox

---

## Cấu trúc thư mục

```
spen-manager/
├── src/                    # GAS backend (TypeScript)
│   ├── index.ts           # Entry point — exports global functions
│   ├── API.ts             # doPost handler với action routing
│   ├── Setup.ts           # Tạo sheets & seed categories
│   ├── EmailProcessor.ts  # Parse email ngân hàng
│   ├── Telegram.ts        # Gửi notification qua bot
│   ├── Triggers.ts        # Install/clear time triggers
│   ├── Utils.ts           # LockService & helpers
│   ├── providers/         # Bank-specific email parsers
│   └── appsscript.json    # GAS manifest
├── dist/                   # Build output (git-ignored)
│   ├── Code.js            # Bundled JS cho GAS
│   └── appsscript.json
├── frontend/               # React Mini App
│   ├── src/
│   │   ├── App.tsx        # Router + Telegram SDK init
│   │   ├── main.tsx       # Entry point + QueryClient
│   │   ├── store/         # Zustand store
│   │   ├── lib/           # API client, utils
│   │   ├── hooks/         # React Query hooks
│   │   ├── pages/         # Inbox, Dashboard, Budget, Categories
│   │   └── components/    # Layout, CategorizeDrawer, UI
│   ├── public/404.html    # SPA redirect cho GitHub Pages
│   └── vite.config.ts
├── worker/                 # Cloudflare Worker (git-ignored, deploy bằng tay)
│   ├── src/index.ts       # Auth middleware + GAS proxy
│   └── wrangler.toml
├── .github/workflows/
│   ├── deploy-frontend.yml # Auto deploy frontend → GitHub Pages
│   └── clasp-push.yml     # Auto deploy backend → GAS
├── esbuild.config.js       # TS → GAS bundler
├── .clasp.json             # clasp config (rootDir: dist)
└── package.json
```

---

## CI/CD Tự động

| Trigger | Workflow | Hành động |
|---------|----------|-----------|
| Push `src/**` → `main` | `clasp-push.yml` | Build TS → Push lên GAS |
| Push `frontend/**` → `main` | `deploy-frontend.yml` | Build Vite → Deploy GitHub Pages |
| Thủ công | Cả 2 workflow | Bấm **Run workflow** trên GitHub |
| Cloudflare Worker | **Bằng tay** | `cd worker && wrangler deploy` |

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| `clasp push` lỗi auth | Chạy `clasp login` lại, copy refresh_token mới vào GitHub Secrets |
| Frontend 404 trên GitHub Pages | Kiểm tra `base: '/spen-manager/'` trong `vite.config.ts` |
| Worker trả 401 | initData từ Telegram hết hạn hoặc BOT_TOKEN sai — kiểm tra Cloudflare secrets |
| Không nhận email mới | Kiểm tra Time Trigger trong GAS → Triggers, chạy `processEmails` thủ công |
| Sheets không có data | Chạy function `setup` trong GAS Editor trước |
| Mini App trắng | Kiểm tra Console trong DevTools, thường do `VITE_API_URL` chưa set |
