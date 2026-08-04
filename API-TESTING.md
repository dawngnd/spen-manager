# Spen Manager — API Testing Guide

## Cơ chế xác thực

```
Telegram Mini App → gửi initData (URL-encoded string)
    ↓
Frontend → header: x-telegram-init-data: <initData>
    ↓
Cloudflare Worker → verify HMAC-SHA256 bằng BOT_TOKEN
    ↓ (nếu hợp lệ)
Proxy sang GAS doPost
```

### initData là gì?

`initData` là chuỗi URL-encoded chứa thông tin user + hash HMAC:
```
query_id=AAHdF6Iq...&user=%7B%22id%22%3A279058397...%7D&auth_date=1691234567&hash=abc123...
```

Worker verify bằng cách:
1. Parse `initData` thành key-value pairs
2. Lấy `hash` ra, xóa nó khỏi params
3. Sort remaining keys alphabetically
4. Tạo `data_check_string` = `key=value\nkey=value\n...`
5. `secret_key` = HMAC-SHA256("WebAppData", BOT_TOKEN)
6. `computed_hash` = HMAC-SHA256(secret_key, data_check_string)
7. So sánh `computed_hash` với `hash`

---

## Script tạo initData giả lập

### Node.js Script

Lưu file `test/generate-init-data.js`:

```javascript
const crypto = require('crypto');

// ⚠️ THAY ĐỔI THEO BOT CỦA BẠN
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';

function generateInitData(userId = 279058397, username = 'testuser') {
  const user = JSON.stringify({
    id: userId,
    first_name: 'Test',
    last_name: 'User',
    username: username,
    language_code: 'vi',
  });

  const authDate = Math.floor(Date.now() / 1000);
  const queryId = 'AAHdF6IQAAAAAB0Xoig' + authDate;

  // Build data check string (sorted alphabetically)
  const params = {
    auth_date: String(authDate),
    query_id: queryId,
    user: user,
  };

  const keys = Object.keys(params).sort();
  const dataCheckString = keys.map(k => `${k}=${params[k]}`).join('\n');

  // HMAC chain: secret = HMAC("WebAppData", BOT_TOKEN)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Build URL-encoded initData string
  const initData = new URLSearchParams({
    ...params,
    hash: hash,
  }).toString();

  return initData;
}

const initData = generateInitData();
console.log('=== Generated initData ===');
console.log(initData);
console.log('');
console.log('=== Copy-paste for Postman header ===');
console.log(`x-telegram-init-data: ${initData}`);
console.log('');
console.log('=== curl ready ===');
const WORKER_URL = 'https://spen-manager-api.YOUR_SUBDOMAIN.workers.dev';
console.log(`curl -X POST "${WORKER_URL}" \\`);
console.log(`  -H "Content-Type: text/plain" \\`);
console.log(`  -H "x-telegram-init-data: ${initData}" \\`);
console.log(`  -d '{"action":"ping"}'`);
```

### Chạy:
```bash
cd /home/dangnd/code/github/spen-manager
node test/generate-init-data.js
```

---

## Postman Setup

### 1. Tạo Environment

| Variable | Value |
|----------|-------|
| `worker_url` | `https://spen-manager-api.xxx.workers.dev` |
| `init_data` | *(paste output từ script trên)* |

### 2. Collection Settings

- **Method**: `POST`
- **URL**: `{{worker_url}}`
- **Headers**:
  - `Content-Type`: `text/plain`
  - `x-telegram-init-data`: `{{init_data}}`
- **Body** → raw → JSON

### 3. Pre-request Script (tự động tạo initData)

Paste vào tab **Pre-request Script** của Collection:

```javascript
const BOT_TOKEN = pm.environment.get('bot_token');

const user = JSON.stringify({
  id: 279058397,
  first_name: 'Test',
  username: 'testuser',
  language_code: 'vi',
});

const authDate = String(Math.floor(Date.now() / 1000));
const queryId = 'AAHdF6IQAAAAAB0Xoig' + authDate;

const params = { auth_date: authDate, query_id: queryId, user: user };
const keys = Object.keys(params).sort();
const dataCheckString = keys.map(k => `${k}=${params[k]}`).join('\n');

const secretKey = CryptoJS.HmacSHA256(BOT_TOKEN, 'WebAppData');
const hash = CryptoJS.HmacSHA256(dataCheckString, secretKey).toString();

const entries = { ...params, hash: hash };
const initData = Object.entries(entries)
  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  .join('&');

pm.environment.set('init_data', initData);
```

Thêm biến `bot_token` vào Environment = BOT_TOKEN thật của bạn.

---

## Curl cho tất cả API

> ⚠️ Thay `$WORKER_URL` và `$INIT_DATA` bằng giá trị thật.
> Chạy script `generate-init-data.js` để lấy `$INIT_DATA`.

```bash
# Variables — thay đổi theo setup của bạn
WORKER_URL="https://spen-manager-api.YOUR_SUBDOMAIN.workers.dev"
INIT_DATA="query_id=...&user=...&auth_date=...&hash=..."
```

### 1. Ping (test connection)

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{"action":"ping"}'
```

**Response:**
```json
{"success":true,"data":{"message":"pong"}}
```

---

### 2. Get Categories

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{"action":"get_categories"}'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {"id":"uuid-1","name":"Food","parent_id":"","icon":"🍔","color":"#F87171"},
    {"id":"uuid-2","name":"Transport","parent_id":"","icon":"🚗","color":"#60A5FA"}
  ]
}
```

---

### 3. Upsert Category (Create)

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{
    "action": "upsert_category",
    "name": "Coffee",
    "icon": "☕",
    "color": "#8B4513",
    "parent_id": "PARENT_CATEGORY_ID_HERE"
  }'
```

**Response:**
```json
{"success":true,"data":{"id":"new-uuid-generated"}}
```

---

### 4. Upsert Category (Update)

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{
    "action": "upsert_category",
    "id": "EXISTING_CATEGORY_ID",
    "name": "Coffee & Tea",
    "icon": "🍵",
    "color": "#6B8E23"
  }'
```

---

### 5. Delete Category

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{
    "action": "delete_category",
    "id": "CATEGORY_ID_TO_DELETE"
  }'
```

**Response:**
```json
{"success":true,"data":null}
```

---

### 6. Get Transactions

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{"action":"get_transactions"}'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "gmail_message_id": "msg-id",
      "date": "2026-08-03T10:00:00",
      "amount": 150000,
      "type": "expense",
      "merchant": "Grab",
      "reference": "GrabFood order #123",
      "status": "new",
      "category_parent_id": "",
      "category_child_id": ""
    }
  ]
}
```

---

### 7. Categorize Transaction

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{
    "action": "categorize_transaction",
    "id": "TRANSACTION_ID",
    "category_parent_id": "PARENT_CAT_ID",
    "category_child_id": "CHILD_CAT_ID"
  }'
```

**Response:**
```json
{"success":true,"data":null}
```

---

### 8. Get Dashboard (same as get_transactions)

```bash
curl -X POST "$WORKER_URL" \
  -H "Content-Type: text/plain" \
  -H "x-telegram-init-data: $INIT_DATA" \
  -d '{"action":"get_dashboard"}'
```

---

## Test trực tiếp GAS (bypass Worker)

Nếu muốn test GAS API trực tiếp (không qua Worker, không cần auth):

```bash
GAS_URL="https://script.google.com/macros/s/AKfycb.../exec"

curl -L -X POST "$GAS_URL" \
  -H "Content-Type: text/plain" \
  -d '{"action":"ping"}'
```

> **Lưu ý:** GAS redirect (302) nên cần flag `-L` (follow redirects).

---

## Error Responses

| HTTP Code | Error | Nghĩa |
|-----------|-------|--------|
| 401 | `Unauthorized` | Thiếu hoặc sai `x-telegram-init-data` header |
| 405 | `Method not allowed` | Không phải POST request |
| 500 | `Server misconfiguration` | Worker chưa set `TELEGRAM_BOT_TOKEN` secret |
| 502 | `Backend unavailable` | GAS không trả JSON hợp lệ |
