/**
 * Executes a callback within a Script Lock to prevent race conditions.
 * @param callback The function to execute securely.
 * @param timeoutMs The maximum time to wait for the lock (default 10000ms).
 */
export function withLock<T>(callback: () => T, timeoutMs: number = 10000): T {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(timeoutMs);
    return callback();
  } catch (e) {
    throw new Error(`Failed to acquire lock within ${timeoutMs}ms: ${e}`);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Validates Telegram Web App initData string.
 * Uses the TELEGRAM_BOT_TOKEN from Script Properties.
 * @param initData The URL-encoded initData string from Telegram Web App.
 * @returns boolean indicating if the data is valid.
 */
export function verifyTelegramWebAppData(initData: string): boolean {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty('TELEGRAM_BOT_TOKEN');
  
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in Script Properties.');
  }

  // Parse the initData query string
  const params = initData.split('&');
  const data: Record<string, string> = {};
  let hash = '';

  for (const param of params) {
    const [key, value] = param.split('=');
    if (key === 'hash') {
      hash = value;
    } else {
      data[key] = decodeURIComponent(value);
    }
  }
  
  if (!hash) {
    return false;
  }

  // Sort keys alphabetically
  const keys = Object.keys(data).sort();
  
  // Construct the data-check-string
  const dataCheckString = keys.map(key => `${key}=${data[key]}`).join('\n');
  
  // Generate secret key: HMAC-SHA256 of bot token with key 'WebAppData'
  const secretKey = Utilities.computeHmacSha256Signature(token, 'WebAppData');
  
  // Generate signature: HMAC-SHA256 of data-check-string with the secret key
  const signatureBytes = Utilities.computeHmacSha256Signature(dataCheckString, secretKey);
  
  // Convert signature bytes to hex string
  const signatureHex = signatureBytes.map(byte => {
    const v = (byte < 0 ? byte + 256 : byte);
    return v.toString(16).padStart(2, '0');
  }).join('');
  
  return signatureHex === hash;
}
