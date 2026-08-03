import { withLock } from './Utils';

export interface TelegramMessageOptions {
  reply_markup?: any;
  parse_mode?: 'MarkdownV2' | 'HTML';
  disable_notification?: boolean;
}

export function sendMessage(text: string, options?: TelegramMessageOptions): void {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = scriptProperties.getProperty('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in Script Properties.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    ...options
  };

  const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    if (response.getResponseCode() !== 200) {
      console.error(`Telegram API Error: ${response.getContentText()}`);
    }
  } catch (error) {
    console.error(`Failed to send Telegram message: ${error}`);
  }
}

export function testTelegram(): void {
  // Test 1: Send Telegram message
  sendMessage('Test message from Spen Manager', { disable_notification: true });

  // Test 2: Write a row to the Unparsed sheet
  withLock(() => {
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
    
    if (!spreadsheetId) {
      console.warn('SPREADSHEET_ID is not set.');
      return;
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const unparsedSheet = ss.getSheetByName('Unparsed');
    
    if (!unparsedSheet) {
      console.error('Unparsed sheet not found.');
      return;
    }
    
    unparsedSheet.appendRow([
      new Date(),
      'test_msg_id_' + new Date().getTime(),
      'Test Subject',
      'Test Body Content'
    ]);
  });
}
