#!/bin/bash
# ============================================================
# Spen Manager — GAS API Test (Direct, bypass Cloudflare Worker)
# ============================================================
# Usage:
#   ./test/test-gas-api.sh              # Chạy tất cả
#   ./test/test-gas-api.sh ping         # Chỉ test ping
#   ./test/test-gas-api.sh get_cat      # Test get_categories
#   ./test/test-gas-api.sh 1 3 7        # Test theo số thứ tự
#   ./test/test-gas-api.sh list         # Xem danh sách API
#
# Environment:
#   GAS_URL=https://...  ./test/test-gas-api.sh ping
# ============================================================

GAS_URL="${GAS_URL:-https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec}"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

call_api() {
  local name="$1"
  local body="$2"
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}▶ ${name}${NC}"
  echo -e "${YELLOW}  Body: ${body}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  RESPONSE=$(curl -sL -w "\n${CYAN}HTTP Status: %{http_code} | Time: %{time_total}s${NC}\n" \
    -X POST "$GAS_URL" \
    -H "Content-Type: text/plain" \
    -d "$body")
  
  if command -v jq &> /dev/null; then
    # Tách HTTP status line (dòng cuối) ra, pretty print JSON phần còn lại
    BODY=$(echo "$RESPONSE" | head -n -1)
    STATUS_LINE=$(echo "$RESPONSE" | tail -n 1)
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo -e "$STATUS_LINE"
  else
    echo "$RESPONSE"
  fi
}

# ── Test functions ──────────────────────────────

test_ping() {
  call_api "1. Ping" \
    '{"action":"ping"}'
}

test_get_categories() {
  call_api "2. Get Categories" \
    '{"action":"get_categories"}'
}

test_create_category() {
  call_api "3. Create Category (parent)" \
    '{"action":"upsert_category","name":"Test Parent","icon":"🧪","color":"#FF5733"}'
}

test_create_child_category() {
  local parent_id="${1:-PARENT_ID}"
  call_api "4. Create Category (child)" \
    "{\"action\":\"upsert_category\",\"name\":\"Test Child\",\"icon\":\"🔬\",\"color\":\"#33FF57\",\"parent_id\":\"${parent_id}\"}"
}

test_update_category() {
  local cat_id="${1:-CATEGORY_ID}"
  call_api "5. Update Category" \
    "{\"action\":\"upsert_category\",\"id\":\"${cat_id}\",\"name\":\"Updated Name\",\"icon\":\"✏️\",\"color\":\"#0000FF\"}"
}

test_delete_category() {
  local cat_id="${1:-CATEGORY_ID}"
  call_api "6. Delete Category" \
    "{\"action\":\"delete_category\",\"id\":\"${cat_id}\"}"
}

test_get_transactions() {
  call_api "7. Get Transactions" \
    '{"action":"get_transactions"}'
}

test_get_dashboard() {
  call_api "8. Get Dashboard" \
    '{"action":"get_dashboard"}'
}

test_categorize_transaction() {
  local txn_id="${1:-TRANSACTION_ID}"
  local parent_cat="${2:-PARENT_CAT_ID}"
  local child_cat="${3:-CHILD_CAT_ID}"
  call_api "9. Categorize Transaction" \
    "{\"action\":\"categorize_transaction\",\"id\":\"${txn_id}\",\"category_parent_id\":\"${parent_cat}\",\"category_child_id\":\"${child_cat}\"}"
}

test_unknown_action() {
  call_api "10. Unknown Action (expect error)" \
    '{"action":"nonexistent_action"}'
}

test_missing_action() {
  call_api "11. Missing Action (expect error)" \
    '{"data":"no action field"}'
}

# ── Help / List ─────────────────────────────────

show_list() {
  echo -e "${BOLD}Spen Manager — GAS API Tests${NC}"
  echo -e "URL: ${CYAN}${GAS_URL}${NC}"
  echo ""
  echo -e "  ${GREEN} 1${NC}  ping                    Test kết nối"
  echo -e "  ${GREEN} 2${NC}  get_cat                 Lấy danh sách danh mục"
  echo -e "  ${GREEN} 3${NC}  create_cat              Tạo parent category"
  echo -e "  ${GREEN} 4${NC}  create_child <parent_id> Tạo child category"
  echo -e "  ${GREEN} 5${NC}  update_cat <cat_id>     Sửa category"
  echo -e "  ${GREEN} 6${NC}  delete_cat <cat_id>     Xóa category"
  echo -e "  ${GREEN} 7${NC}  get_txn                 Lấy tất cả giao dịch"
  echo -e "  ${GREEN} 8${NC}  dashboard               Lấy data dashboard"
  echo -e "  ${GREEN} 9${NC}  categorize <txn> <parent> <child>  Phân loại giao dịch"
  echo -e "  ${GREEN}10${NC}  unknown                 Test unknown action"
  echo -e "  ${GREEN}11${NC}  missing                 Test missing action"
  echo -e "  ${GREEN}  ${NC}  all                     Chạy tất cả (mặc định)"
  echo ""
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./test/test-gas-api.sh ping"
  echo "  ./test/test-gas-api.sh 1 2 7"
  echo "  ./test/test-gas-api.sh create_cat"
  echo "  ./test/test-gas-api.sh delete_cat abc-123-uuid"
  echo "  ./test/test-gas-api.sh categorize TXN_ID PARENT_ID CHILD_ID"
  echo "  GAS_URL=https://... ./test/test-gas-api.sh ping"
}

run_all() {
  test_ping
  test_get_categories
  test_create_category
  test_get_transactions
  test_get_dashboard
  test_unknown_action
  test_missing_action
}

# ── Router ──────────────────────────────────────

run_test() {
  local cmd="$1"
  shift
  case "$cmd" in
    1|ping)                test_ping ;;
    2|get_cat|get_categories)    test_get_categories ;;
    3|create_cat|create_category) test_create_category ;;
    4|create_child)        test_create_child_category "$@" ;;
    5|update_cat)          test_update_category "$@" ;;
    6|delete_cat)          test_delete_category "$@" ;;
    7|get_txn|get_transactions)  test_get_transactions ;;
    8|dashboard|get_dashboard)   test_get_dashboard ;;
    9|categorize)          test_categorize_transaction "$@" ;;
    10|unknown)            test_unknown_action ;;
    11|missing)            test_missing_action ;;
    all)                   run_all ;;
    list|help|-h|--help)   show_list ;;
    *)
      echo -e "${RED}Unknown test: ${cmd}${NC}"
      echo "Run with 'list' to see available tests."
      exit 1
      ;;
  esac
}

# ── Main ────────────────────────────────────────

echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Spen Manager — GAS API Direct Test${NC}"
echo -e "  ${CYAN}${GAS_URL}${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"

if [ $# -eq 0 ]; then
  run_all
else
  for arg in "$@"; do
    # Nếu arg là số kèm thêm params phía sau thì xử lý riêng
    case "$arg" in
      # Các command cần params đặc biệt — chạy trực tiếp với shift
      create_child|update_cat|delete_cat|categorize|4|5|6|9)
        run_test "$@"
        break
        ;;
      *)
        run_test "$arg"
        ;;
    esac
  done
fi

echo ""
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Done!${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
