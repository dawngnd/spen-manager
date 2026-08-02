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

    // Switch case for future API routing (Phase 3)
    switch (action) {
      case 'ping':
        result = { message: 'pong' };
        break;
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
