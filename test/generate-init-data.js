const crypto = require('crypto');

// ⚠️ THAY ĐỔI THEO BOT CỦA BẠN
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WORKER_URL = process.env.WORKER_URL || 'https://spen-manager-api.YOUR_SUBDOMAIN.workers.dev';

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

  // Build data check string (sorted alphabetically by key)
  const params = {
    auth_date: String(authDate),
    query_id: queryId,
    user: user,
  };

  const keys = Object.keys(params).sort();
  const dataCheckString = keys.map(k => `${k}=${params[k]}`).join('\n');

  // HMAC chain: secret = HMAC-SHA256("WebAppData", BOT_TOKEN)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  // hash = HMAC-SHA256(secret, data_check_string)
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

// === Generate ===
const initData = generateInitData();

console.log('╔══════════════════════════════════════════╗');
console.log('║   Spen Manager — initData Generator      ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📋 initData (raw):');
console.log(initData);
console.log('');
console.log('─'.repeat(50));
console.log('');
console.log('📌 Postman Header:');
console.log(`   Key:   x-telegram-init-data`);
console.log(`   Value: ${initData}`);
console.log('');
console.log('─'.repeat(50));
console.log('');
console.log('🧪 curl commands:');
console.log('');

const actions = [
  { name: 'Ping', body: '{"action":"ping"}' },
  { name: 'Get Categories', body: '{"action":"get_categories"}' },
  { name: 'Get Transactions', body: '{"action":"get_transactions"}' },
  { name: 'Get Dashboard', body: '{"action":"get_dashboard"}' },
  { name: 'Create Category', body: '{"action":"upsert_category","name":"Test Cat","icon":"🧪","color":"#FF0000"}' },
  { name: 'Categorize Transaction', body: '{"action":"categorize_transaction","id":"TXN_ID","category_parent_id":"CAT_ID","category_child_id":""}' },
];

actions.forEach(({ name, body }) => {
  console.log(`# ${name}`);
  console.log(`curl -s -X POST "${WORKER_URL}" \\`);
  console.log(`  -H "Content-Type: text/plain" \\`);
  console.log(`  -H "x-telegram-init-data: ${initData}" \\`);
  console.log(`  -d '${body}' | jq .`);
  console.log('');
});
