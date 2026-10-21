/**
 * Maps a linked App Builder workspace (.env + .aio, written by `aio app use`) to the secrets the
 * deploy workflow reads. Pure, so it can be tested without a workspace or GitHub.
 */

/**
 * Parses .env text. Keys are taken as written up to `=`: aio names the OAuth context after the
 * credential, so keys can contain `-` (e.g. AIO_ims_contexts_Credential__in__My__App__-__Stage_…).
 */
export function parseEnv(text) {
  return Object.fromEntries(text.split('\n')
    .map((line) => line.match(/^\s*([^#=\s][^=\s]*)\s*=(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.trim().replace(/^(['"])(.*)\1$/, '$2')]));
}

const list = (value) => {
  try { return JSON.parse(value); } catch { return value ? value.split(',') : []; }
};

/**
 * @param {Record<string, string>} env parsed .env
 * @param {object} aio parsed .aio
 * @returns {Record<string, string|undefined>} secret name → value (undefined when missing)
 */
export function collectSecrets(env, { project }) {
  // OAuth server-to-server credential, as `aio app use` stores it (`__` encodes `_` in key names)
  const [, context] = Object.keys(env)
    .map((k) => k.match(/^AIO_ims_contexts_(.+)_client__id$/)).find(Boolean) || [];
  const ims = (field) => (context ? env[`AIO_ims_contexts_${context}_${field}`] : undefined);

  return {
    AIO_RUNTIME_NAMESPACE: env.AIO_runtime_namespace,
    AIO_RUNTIME_AUTH: env.AIO_runtime_auth,
    AIO_PROJECT_ID: project.id,
    AIO_PROJECT_NAME: project.name,
    AIO_PROJECT_ORG_ID: project.org.id,
    AIO_PROJECT_WORKSPACE_ID: project.workspace.id,
    AIO_PROJECT_WORKSPACE_NAME: project.workspace.name,
    AIO_PROJECT_WORKSPACE_DETAILS_SERVICES: JSON.stringify(project.workspace.details.services),
    CLIENTID: ims('client__id'),
    CLIENTSECRET: list(ims('client__secrets'))[0],
    TECHNICALACCID: ims('technical__account__id'),
    TECHNICALACCEMAIL: ims('technical__account__email'),
    IMSORGID: ims('ims__org__id') || project.org.ims_org_id,
    SCOPES: list(ims('scopes')).join(','),
  };
}
