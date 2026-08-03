export function installTriggers(): void {
  // Clear existing triggers to avoid duplicates
  clearTriggers();

  // Install trigger for processEmails every 10 minutes
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  console.log('Installed processEmails trigger (every 10 minutes).');
}

export function clearTriggers(): void {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  console.log('Cleared existing processEmails triggers.');
}
