/**
 * Copies the linked App Builder workspace (.env + .aio, written by `aio app use`) into the
 * "stage" GitHub environment the deploy workflow reads. Values go to `gh secret set` on stdin and
 * are never printed.
 *
 *   npm run ci:secrets
 *
 * Needs an OAuth server-to-server credential on the workspace (see README): after adding it, run
 * `aio app use` again and aio writes it to .env as AIO_ims_contexts_<name>_… keys.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ENVIRONMENT = 'stage';

function readEnv(file) {
  return Object.fromEntries(readFileSync(file, 'utf8').split('\n')
    .map((line) => line.match(/^([A-Za-z_][\w]*)=(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^(['"])(.*)\1$/, '$2')]));
}

const env = readEnv('.env');
const { project } = JSON.parse(readFileSync('.aio', 'utf8'));

const secrets = {
  AIO_RUNTIME_NAMESPACE: env.AIO_runtime_namespace,
  AIO_RUNTIME_AUTH: env.AIO_runtime_auth,
  AIO_PROJECT_ID: project.id,
  AIO_PROJECT_NAME: project.name,
  AIO_PROJECT_ORG_ID: project.org.id,
  AIO_PROJECT_WORKSPACE_ID: project.workspace.id,
  AIO_PROJECT_WORKSPACE_NAME: project.workspace.name,
  AIO_PROJECT_WORKSPACE_DETAILS_SERVICES: JSON.stringify(project.workspace.details.services),
};

// OAuth server-to-server credential, as `aio app use` stores it (`__` encodes `_` in key names)
const [, context] = Object.keys(env).map((k) => k.match(/^AIO_ims_contexts_(.+?)_client__id$/)).find(Boolean) || [];
const ims = (field) => env[`AIO_ims_contexts_${context}_${field}`];
const list = (value) => {
  try { return JSON.parse(value); } catch { return value ? value.split(',') : []; }
};
Object.assign(secrets, {
  CLIENTID: ims('client__id'),
  CLIENTSECRET: list(ims('client__secrets'))[0],
  TECHNICALACCID: ims('technical__account__id'),
  TECHNICALACCEMAIL: ims('technical__account__email'),
  IMSORGID: ims('ims__org__id') || project.org.ims_org_id,
  SCOPES: list(ims('scopes')).join(','),
});

const missing = Object.entries(secrets).filter(([, v]) => !v).map(([k]) => k);
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
