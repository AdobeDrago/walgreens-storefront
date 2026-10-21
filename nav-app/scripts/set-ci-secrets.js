/**
 * Copies the linked App Builder workspace (.env + .aio, written by `aio app use`) into the
 * "stage" GitHub environment the deploy workflow reads. Values go to `gh secret set` on stdin and
 * are never printed.
 *
 *   npm run ci:secrets
 *   npm run ci:secrets -- --check   only report which values were found; GitHub is not touched
 *
 * Needs an OAuth server-to-server credential on the workspace (see README): after adding it, run
 * `aio app use` again and aio writes it to .env as AIO_ims_contexts_<name>_… keys.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseEnv, collectSecrets } from './ci-secrets-lib.js';

const ENVIRONMENT = 'stage';

const secrets = collectSecrets(
  parseEnv(readFileSync('.env', 'utf8')),
  JSON.parse(readFileSync('.aio', 'utf8')),
);

const missing = Object.entries(secrets).filter(([, v]) => !v).map(([k]) => k);
if (process.argv.includes('--check')) {
  Object.entries(secrets).forEach(([name, value]) => console.log(`${value ? 'found  ' : 'MISSING'} ${name}`));
  process.exit(missing.length ? 1 : 0);
}
if (missing.length) {
  console.error(`missing values for: ${missing.join(', ')}. Add the OAuth server-to-server credential to the workspace, then run \`aio app use\` again (README).`);
  process.exit(1);
}

// the environment must exist before secrets can be set on it
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).toString().trim();
execFileSync('gh', ['api', '-X', 'PUT', `repos/${repo}/environments/${ENVIRONMENT}`], { stdio: 'ignore' });

Object.entries(secrets).forEach(([name, value]) => {
  execFileSync('gh', ['secret', 'set', name, '--env', ENVIRONMENT, '--repo', repo], { input: value, stdio: ['pipe', 'ignore', 'inherit'] });
  console.log(`set ${name}`);
});
console.log(`${Object.keys(secrets).length} secrets set on ${repo} environment "${ENVIRONMENT}"`);
