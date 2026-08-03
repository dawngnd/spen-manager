const esbuild = require('esbuild');
const { GasPlugin } = require('esbuild-gas-plugin');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/Code.js',
  plugins: [GasPlugin],
  format: 'iife',
  target: 'es2020',
}).then(() => console.log('BUILD OK')).catch((e) => { console.error(e); process.exit(1); });
