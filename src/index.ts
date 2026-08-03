// Entry point for Google Apps Script
// GasPlugin reads this file and generates top-level function stubs
// from `global.X = functionRef` assignments

import { doPost } from './API';
import { setup } from './Setup';
import { installTriggers, clearTriggers } from './Triggers';
import { processEmails } from './EmailProcessor';
import { testTelegram } from './Telegram';

declare const global: any;

global.doPost = doPost;
global.setup = setup;
global.installTriggers = installTriggers;
global.clearTriggers = clearTriggers;
global.processEmails = processEmails;
global.testTelegram = testTelegram;
