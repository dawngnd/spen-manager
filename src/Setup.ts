export function setup() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not set in Script Properties.');
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);

  // 1. Transactions
  let transactionsSheet = ss.getSheetByName('Transactions');
  if (!transactionsSheet) {
    transactionsSheet = ss.insertSheet('Transactions');
  }
  transactionsSheet.getRange(1, 1, 1, 10).setValues([[
    'id', 'gmail_message_id', 'date', 'amount', 'type', 'merchant', 'reference', 'status', 'category_parent_id', 'category_child_id'
  ]]);
  transactionsSheet.getRange(1, 1, 1, 10).setFontWeight('bold');

  // 2. Categories
  let categoriesSheet = ss.getSheetByName('Categories');
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet('Categories');
  }
  categoriesSheet.getRange(1, 1, 1, 5).setValues([[
    'id', 'name', 'parent_id', 'icon', 'color'
  ]]);
  categoriesSheet.getRange(1, 1, 1, 5).setFontWeight('bold');

  // 3. Budgets
  let budgetsSheet = ss.getSheetByName('Budgets');
  if (!budgetsSheet) {
    budgetsSheet = ss.insertSheet('Budgets');
  }
  budgetsSheet.getRange(1, 1, 1, 4).setValues([[
    'id', 'month', 'category_id', 'amount'
  ]]);
  budgetsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');

  // 4. Settings
  let settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
  }
  settingsSheet.getRange(1, 1, 1, 2).setValues([[
    'key', 'value'
  ]]);
  settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

  // Seed default categories
  const defaultCategories = [
    { id: Utilities.getUuid(), name: 'Food', parent_id: '', icon: '🍔', color: '#F87171' },
    { id: Utilities.getUuid(), name: 'Transport', parent_id: '', icon: '🚗', color: '#60A5FA' },
    { id: Utilities.getUuid(), name: 'Shopping', parent_id: '', icon: '🛍️', color: '#F472B6' },
    { id: Utilities.getUuid(), name: 'Bills', parent_id: '', icon: '🧾', color: '#FBBF24' },
    { id: Utilities.getUuid(), name: 'Entertainment', parent_id: '', icon: '🍿', color: '#A78BFA' },
    { id: Utilities.getUuid(), name: 'Health', parent_id: '', icon: '💊', color: '#34D399' },
    { id: Utilities.getUuid(), name: 'Education', parent_id: '', icon: '📚', color: '#38BDF8' },
    { id: Utilities.getUuid(), name: 'Others', parent_id: '', icon: '📦', color: '#9CA3AF' }
  ];

  const existingCategories = categoriesSheet.getDataRange().getValues();
  if (existingCategories.length <= 1) { // Only headers exist
    const categoryValues = defaultCategories.map(cat => [cat.id, cat.name, cat.parent_id, cat.icon, cat.color]);
    categoriesSheet.getRange(2, 1, categoryValues.length, 5).setValues(categoryValues);
  }
}
