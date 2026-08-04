import { withLock } from './Utils';

/**
 * Main entry point for HTTP POST requests to the Google Apps Script Web App.
 * @param e The event object containing the request data.
 */
export function doPost(e: GoogleAppsScript.Events.DoPost) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Invalid request: Missing postData or contents');
    }

    let payload: any;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error('Invalid request: Body must be valid JSON');
    }

    const action = payload.action;

    if (!action) {
      throw new Error('Invalid request: Missing action field');
    }

    let result: any = null;
    
    // Lazy-load spreadsheet only when needed (ping doesn't need it)
    const getSpreadsheet = () => {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set in Script Properties');
      return SpreadsheetApp.openById(spreadsheetId);
    };
    let ss: GoogleAppsScript.Spreadsheet.Spreadsheet;

    // Switch case for future API routing (Phase 3)
    switch (action) {
      case 'ping':
        result = { message: 'pong' };
        break;
        
      case 'get_categories': {
        ss = getSpreadsheet();
        const sheet = ss.getSheetByName('Categories');
        if (!sheet) throw new Error('Categories sheet not found');
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          result = [];
        } else {
          result = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            parent_id: row[2],
            icon: row[3],
            color: row[4]
          }));
        }
        break;
      }
        
      case 'upsert_category': {
        ss = getSpreadsheet();
        result = withLock(() => {
          const sheet = ss.getSheetByName('Categories');
          if (!sheet) throw new Error('Categories sheet not found');
          
          const catId = payload.id || Utilities.getUuid();
          const name = payload.name;
          const parent_id = payload.parent_id || '';
          const icon = payload.icon || '';
          const color = payload.color || '';
          
          if (!name) throw new Error('Category name is required');

          const data = sheet.getDataRange().getValues();
          let rowIndex = -1;
          if (payload.id) {
            for (let i = 1; i < data.length; i++) {
              if (data[i][0] === payload.id) {
                rowIndex = i + 1;
                break;
              }
            }
          }

          if (rowIndex > -1) {
            sheet.getRange(rowIndex, 2, 1, 4).setValues([[name, parent_id, icon, color]]);
          } else {
            sheet.appendRow([catId, name, parent_id, icon, color]);
          }
          
          return { id: catId };
        });
        break;
      }
        
      case 'delete_category': {
        ss = getSpreadsheet();
        withLock(() => {
          if (!payload.id) throw new Error('Category id is required');
          const sheet = ss.getSheetByName('Categories');
          if (!sheet) throw new Error('Categories sheet not found');
          
          const data = sheet.getDataRange().getValues();
          let rowIndex = -1;
          for (let i = 1; i < data.length; i++) {
            if (data[i][0] === payload.id) {
              rowIndex = i + 1;
              break;
            }
          }
          
          if (rowIndex > -1) {
            sheet.deleteRow(rowIndex);
          } else {
            throw new Error('Category not found');
          }
        });
        break;
      }
        
      case 'get_transactions':
      case 'get_dashboard': {
        ss = getSpreadsheet();
        const sheet = ss.getSheetByName('Transactions');
        if (!sheet) throw new Error('Transactions sheet not found');
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          result = [];
        } else {
          result = data.slice(1).map(row => ({
            id: row[0],
            gmail_message_id: row[1],
            date: row[2],
            amount: row[3],
            type: row[4],
            merchant: row[5],
            reference: row[6],
            status: row[7],
            category_parent_id: row[8],
            category_child_id: row[9]
          }));
        }
        break;
      }
        
      case 'categorize_transaction': {
        ss = getSpreadsheet();
        withLock(() => {
          if (!payload.id) throw new Error('Transaction id is required');
          const sheet = ss.getSheetByName('Transactions');
          if (!sheet) throw new Error('Transactions sheet not found');
          
          const data = sheet.getDataRange().getValues();
          let rowIndex = -1;
          for (let i = 1; i < data.length; i++) {
            if (data[i][0] === payload.id) {
              rowIndex = i + 1;
              break;
            }
          }
          
          if (rowIndex > -1) {
            sheet.getRange(rowIndex, 8, 1, 3).setValues([
              ['categorized', payload.category_parent_id || '', payload.category_child_id || '']
            ]);
          } else {
            throw new Error('Transaction not found');
          }
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error: any) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || String(error)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
