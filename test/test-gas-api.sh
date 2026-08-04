#!/bin/bash
# ============================================================
# Spen Manager — GAS API Test (Direct, bypass Cloudflare Worker)
# ============================================================
# Usage:
#   1. Thay GAS_URL bên dưới bằng Web App URL thật
#   2. chmod +x test/test-gas-api.sh
#   3. ./test/test-gas-api.sh
#
# Lưu ý: GAS redirect (302) nên cần flag -L (follow redirects)
# ============================================================

GAS_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

call_api() {
  local name="$1"
  local body="$2"
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}▶ ${name}${NC}"
  echo -e "${YELLOW}  Body: ${body}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  RESPONSE=$(curl -sL -X POST "$GAS_URL" \
    -H "Content-Type: text/plain" \
    -d "$body")
  
  # Pretty print JSON if jq available
  if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq .
  else
    echo "$RESPONSE"
  fi
}

echo "============================================"
echo "  Spen Manager — GAS API Direct Test"
echo "  URL: $GAS_URL"
echo "============================================"

# ──────────────────────────────────────────────
# 1. PING — Test kết nối
# ──────────────────────────────────────────────
call_api "1. Ping" \
  '{"action":"ping"}'

# ──────────────────────────────────────────────
# 2. GET CATEGORIES — Lấy danh sách danh mục
# ──────────────────────────────────────────────
call_api "2. Get Categories" \
  '{"action":"get_categories"}'

# ──────────────────────────────────────────────
# 3. UPSERT CATEGORY (Create) — Tạo danh mục mới
# ──────────────────────────────────────────────
call_api "3. Create Category (parent)" \
  '{"action":"upsert_category","name":"Test Parent","icon":"🧪","color":"#FF5733"}'

# ──────────────────────────────────────────────
# 4. UPSERT CATEGORY (Create child) — Tạo danh mục con
#    ⚠️ Thay PARENT_ID bằng id trả về từ bước 3
# ──────────────────────────────────────────────
call_api "4. Create Category (child)" \
  '{"action":"upsert_category","name":"Test Child","icon":"🔬","color":"#33FF57","parent_id":"PARENT_ID"}'

# ──────────────────────────────────────────────
# 5. UPSERT CATEGORY (Update) — Sửa danh mục
#    ⚠️ Thay CATEGORY_ID bằng id có sẵn
# ──────────────────────────────────────────────
call_api "5. Update Category" \
  '{"action":"upsert_category","id":"CATEGORY_ID","name":"Updated Name","icon":"✏️","color":"#0000FF"}'

# ──────────────────────────────────────────────
# 6. DELETE CATEGORY — Xóa danh mục
#    ⚠️ Thay CATEGORY_ID bằng id muốn xóa
# ──────────────────────────────────────────────
call_api "6. Delete Category" \
  '{"action":"delete_category","id":"CATEGORY_ID"}'

# ──────────────────────────────────────────────
# 7. GET TRANSACTIONS — Lấy tất cả giao dịch
# ──────────────────────────────────────────────
call_api "7. Get Transactions" \
  '{"action":"get_transactions"}'

# ──────────────────────────────────────────────
# 8. GET DASHBOARD — Lấy data cho dashboard
#    (Cùng response với get_transactions)
# ──────────────────────────────────────────────
call_api "8. Get Dashboard" \
  '{"action":"get_dashboard"}'

# ──────────────────────────────────────────────
# 9. CATEGORIZE TRANSACTION — Phân loại giao dịch
#    ⚠️ Thay TRANSACTION_ID, PARENT_CAT_ID, CHILD_CAT_ID
# ──────────────────────────────────────────────
call_api "9. Categorize Transaction" \
  '{"action":"categorize_transaction","id":"TRANSACTION_ID","category_parent_id":"PARENT_CAT_ID","category_child_id":"CHILD_CAT_ID"}'

# ──────────────────────────────────────────────
# 10. UNKNOWN ACTION — Test error handling
# ──────────────────────────────────────────────
call_api "10. Unknown Action (expect error)" \
  '{"action":"nonexistent_action"}'

# ──────────────────────────────────────────────
# 11. MISSING ACTION — Test validation
# ──────────────────────────────────────────────
call_api "11. Missing Action (expect error)" \
  '{"data":"no action field"}'

echo ""
echo "============================================"
echo "  Done! Check responses above."
echo "============================================"
