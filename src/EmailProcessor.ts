import { withLock } from './Utils';
import { EmailProvider } from './providers/EmailProvider';
import { TimoProvider } from './providers/TimoProvider';
import { sendMessage } from './Telegram';

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
  
  console.log(`[getProcessedMessageIds] Found ${processedIds.size} already processed messages.`);
  return processedIds;
}

export function fetchUnprocessedEmails(processedIds: Set<string>): GoogleAppsScript.Gmail.GmailMessage[] {
  const messagesToProcess: GoogleAppsScript.Gmail.GmailMessage[] = [];
  
  // We can search for unread messages that haven't been labeled yet.
  // We also constrain by provider domains if needed, or just generally search unread.
  const searchQuery = 'from:timo is:unread newer_than:1d';
  const threads = GmailApp.search(searchQuery, 0, 50);
  console.log(`[fetchUnprocessedEmails] Found ${threads.length} threads matching query: ${searchQuery}`);

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

  console.log(`[fetchUnprocessedEmails] Found ${messagesToProcess.length} messages matching providers.`);
  return messagesToProcess;
}

function getOrCreateLabel(labelName: string): GoogleAppsScript.Gmail.GmailLabel {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

export function processEmails(): void {
  console.log('[processEmails] Starting email processing job...');
  const processedIds = getProcessedMessageIds();
  const messages = fetchUnprocessedEmails(processedIds);
  
  if (messages.length === 0) {
    console.log('[processEmails] No new messages to process. Exiting.');
    return;
  }
  console.log(`[processEmails] Processing ${messages.length} messages...`);

  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  const miniAppUrl = scriptProperties.getProperty('MINI_APP_URL');
  
  if (!spreadsheetId) {
    console.error('SPREADSHEET_ID is not set in Script Properties.');
    return;
  }

  const label = getOrCreateLabel('spen-processed');
  
  // Group messages by thread to minimize label operations
  const threadMessagesMap = new Map<string, GoogleAppsScript.Gmail.GmailMessage[]>();
  
  for (const message of messages) {
    const threadId = message.getThread().getId();
    if (!threadMessagesMap.has(threadId)) {
      threadMessagesMap.set(threadId, []);
    }
    threadMessagesMap.get(threadId)!.push(message);
  }

  // Iterate over threads and their messages
  for (const [threadId, threadMsgs] of threadMessagesMap.entries()) {
    let allParsedInThread = true;
    
    for (const message of threadMsgs) {
      const subject = message.getSubject();
      const from = message.getFrom();
      const body = message.getPlainBody() || message.getBody(); // fallback to HTML body if plain is not available
      const messageId = message.getId();
      const dateStr = message.getDate().toISOString();

      console.log(`[processEmails] Processing message ${messageId} from ${from} | subject: ${subject}`);

      const provider = PROVIDERS.find(p => p.match(subject, from));
      if (!provider) {
        console.log(`[processEmails] No provider matched for message ${messageId}. Skipping.`);
        continue;
      }

      console.log(`[processEmails] Matched provider: ${provider.name}. Parsing...`);
      const parsedTx = provider.parse(body, subject);
      
      withLock(() => {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        
        if (parsedTx) {
          // Successfully parsed -> append to Transactions sheet
          const transactionsSheet = ss.getSheetByName('Transactions');
          if (transactionsSheet) {
            // 'id', 'gmail_message_id', 'date', 'amount', 'type', 'merchant', 'reference', 'status', 'category_parent_id', 'category_child_id'
            transactionsSheet.appendRow([
              Utilities.getUuid(),
              messageId,
              parsedTx.date,
              parsedTx.amount,
              parsedTx.type,
              parsedTx.merchant,
              parsedTx.reference,
              'uncategorized',
              '',
              ''
            ]);
          }
          
          // Send Telegram notification
          const msgText = `✅ *New ${parsedTx.type.toUpperCase()}*\n\n` +
                          `💰 Amount: ${parsedTx.amount.toLocaleString()} VND\n` +
                          `🏪 Merchant: ${parsedTx.merchant}\n` +
                          `📅 Date: ${parsedTx.date.toLocaleString()}`;
                          
          const options: any = { parse_mode: 'HTML' };
          if (miniAppUrl) {
            options.reply_markup = {
              inline_keyboard: [[
                { text: 'Open Spen Manager', web_app: { url: miniAppUrl } }
              ]]
            };
          }
          sendMessage(msgText, options);
          console.log(`[processEmails] Successfully parsed & saved transaction ${parsedTx.amount} VND for message ${messageId}`);
          
        } else {
          // Failed to parse -> append to Unparsed sheet
          console.log(`[processEmails] Failed to parse message ${messageId}`);
          allParsedInThread = false;
          const unparsedSheet = ss.getSheetByName('Unparsed');
          if (unparsedSheet) {
            // 'date', 'message_id', 'subject', 'body'
            unparsedSheet.appendRow([
              new Date(),
              messageId,
              subject,
              body.substring(0, 500) // Truncate body to prevent huge cells
            ]);
          }
          
          // Send silent Telegram notification
          const silentMsg = `⚠️ *Failed to parse email*\n\n` +
                            `Subject: ${subject}\n` +
                            `From: ${from}\n` +
                            `Message ID: ${messageId}`;
          sendMessage(silentMsg, { disable_notification: true, parse_mode: 'HTML' });
        }
      });
    }
    
    // Label thread as processed (even if some failed, they are in Unparsed queue and shouldn't be retried indefinitely)
    if (threadMsgs.length > 0) {
      const thread = threadMsgs[0].getThread();
      thread.addLabel(label);
    }
  }
}

