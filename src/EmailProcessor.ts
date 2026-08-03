import { withLock } from './Utils';
import { EmailProvider } from './providers/EmailProvider';
import { TimoProvider } from './providers/TimoProvider';

// Register providers here
const PROVIDERS: EmailProvider[] = [TimoProvider];

export function getProcessedMessageIds(): Set<string> {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not set in Script Properties.');
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const processedIds = new Set<string>();

  // 1. Get from Transactions sheet
  const transactionsSheet = ss.getSheetByName('Transactions');
  if (transactionsSheet) {
    const data = transactionsSheet.getDataRange().getValues();
    // gmail_message_id is in column B (index 1)
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][1]) {
          processedIds.add(data[i][1].toString());
        }
      }
    }
  }

  // 2. Get from Unparsed sheet
  const unparsedSheet = ss.getSheetByName('Unparsed');
  if (unparsedSheet) {
    const data = unparsedSheet.getDataRange().getValues();
    // message_id is in column B (index 1)
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][1]) {
          processedIds.add(data[i][1].toString());
        }
      }
    }
  }

  return processedIds;
}

export function fetchUnprocessedEmails(processedIds: Set<string>): GoogleAppsScript.Gmail.GmailMessage[] {
  const messagesToProcess: GoogleAppsScript.Gmail.GmailMessage[] = [];
  
  // We can search for unread messages that haven't been labeled yet.
  // We also constrain by provider domains if needed, or just generally search unread.
  const searchQuery = 'is:unread -label:spen-processed';
  const threads = GmailApp.search(searchQuery, 0, 50);

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      const messageId = message.getId();
      
      // Skip if we've already processed this message
      if (processedIds.has(messageId)) {
        continue;
      }
      
      // Check if any provider matches this email
      const subject = message.getSubject();
      const from = message.getFrom();
      
      const matchedProvider = PROVIDERS.find(p => p.match(subject, from));
      if (matchedProvider) {
        messagesToProcess.push(message);
      }
    }
  }

  return messagesToProcess;
}
