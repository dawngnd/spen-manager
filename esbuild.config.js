const esbuild = require('esbuild');

// Custom GAS plugin that creates proper top-level function stubs WITH parameters
// The original esbuild-gas-plugin creates stubs without parameters,
// which causes GAS to call the empty stub instead of the real implementation
const GasPluginFixed = {
  name: 'gas-plugin-fixed',
  setup(build) {
    build.onEnd((result) => {
      if (result.outputFiles) {
        for (const file of result.outputFiles) {
          if (file.path.endsWith('.js')) {
            // The IIFE already assigns functions to global.X
            // We just need the stubs to have correct signatures
            const banner = `var global = this;
function doPost(e) { return global._doPost(e); }
function setup() { return global._setup(); }
function installTriggers() { return global._installTriggers(); }
function clearTriggers() { return global._clearTriggers(); }
function processEmails() { return global._processEmails(); }
function testTelegram() { return global._testTelegram(); }
`;
            file.contents = Buffer.from(banner + file.text);
          }
        }
      }
    });
  }
};

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  write: false, // Don't write, let plugin modify first
  outfile: 'dist/Code.js',
  format: 'iife',
  target: 'es2020',
  globalName: '__gas__',
}).then(async (result) => {
  // Get the bundled code
  let code = result.outputFiles[0].text;
  
  // The IIFE bundles everything. We need to extract the functions
  // and make them available at top level for GAS.
  // Strategy: bundle as IIFE, then add top-level wrappers that call into the module.

  const banner = `// Google Apps Script Entry Points
// These top-level functions are discovered by GAS runtime.
// They delegate to the bundled implementations via global assignments.
`;

  const footer = `
// Top-level GAS entry points (must be real function declarations with correct params)
function doPost(e) { return global.doPost(e); }
function setup() { return global.setup(); }
function installTriggers() { return global.installTriggers(); }
function clearTriggers() { return global.clearTriggers(); }
function processEmails() { return global.processEmails(); }
function testTelegram() { return global.testTelegram(); }
`;

  // Remove GasPlugin-style stubs if esbuild added any
  // The IIFE should set global.X = realFunction
  const finalCode = `var global = this;\n${code}\n${footer}`;

  require('fs').writeFileSync('dist/Code.js', finalCode);
  console.log('BUILD OK');
}).catch((e) => { console.error(e); process.exit(1); });
