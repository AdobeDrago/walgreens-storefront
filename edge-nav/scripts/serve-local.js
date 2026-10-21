/**
 * `npm run local` — builds the function and serves it at http://127.0.0.1:7676 in front of a local
 * EDS dev server, so the page and its scripts come from your working copy.
 *
 *   EDS_ORIGIN        default http://localhost:3000 (`aem up`)
 *   NAV_FRAGMENT_URL  default: the App Builder Stage action (fastly.toml); set it to
 *                     http://localhost:3100/fragment to use nav-app's `npm run dev`
 *   EDGE_PORT         default 7676
 *
 * fastly.toml stays untouched: the overrides go into a gitignored copy under .local/.
 */
import { execFileSync, spawn } from 'node:child_process';
import {
  copyFileSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';

const edsOrigin = (process.env.EDS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
const fragmentUrl = process.env.NAV_FRAGMENT_URL;
const port = process.env.EDGE_PORT || '7676';

try {
  execFileSync('fastly', ['version'], { stdio: 'ignore' });
} catch {
  console.error('The Fastly CLI is required: brew install fastly/tap/fastly (see README)');
  process.exit(1);
}

console.log('Building bin/main.wasm …');
execFileSync('npx', ['js-compute-runtime', './src/index.js', './bin/main.wasm'], { stdio: 'inherit' });

mkdirSync('.local/bin', { recursive: true });
copyFileSync('bin/main.wasm', '.local/bin/main.wasm');
let toml = readFileSync('fastly.toml', 'utf8')
  .replace(/^(\s*EDS_ORIGIN\s*=\s*).*$/m, `$1"${edsOrigin}"`);
if (fragmentUrl) toml = toml.replace(/^(\s*NAV_FRAGMENT_URL\s*=\s*).*$/m, `$1"${fragmentUrl}"`);
writeFileSync('.local/fastly.toml', toml);

console.log(`Edge function: http://127.0.0.1:${port}/  →  EDS: ${edsOrigin}${fragmentUrl ? `, nav: ${fragmentUrl}` : ''}`);
spawn('fastly', ['compute', 'serve', '--skip-build', '--file', 'bin/main.wasm', '--addr', `127.0.0.1:${port}`, '--non-interactive'], {
  cwd: '.local',
  stdio: 'inherit',
});
