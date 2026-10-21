import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv, collectSecrets } from '../scripts/ci-secrets-lib.js';

// the shape `aio app use` writes: the OAuth context is named after the credential, `-` included
const ENV = `AIO_runtime_auth=auth
AIO_runtime_namespace=ns-stage
AIO_runtime_apihost=https://adobeioruntime.net
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_client__id=cid
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_client__secrets=["p8e-secret"]
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_technical__account__email=x@techacct.adobe.com
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_technical__account__id=tid
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_scopes=["openid","AdobeID","read_organizations"]
AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_ims__org__id=org@AdobeOrg
`;

const AIO = {
  project: {
    id: 'p1',
    name: 'WalgreensNav',
    org: { id: 'o1', ims_org_id: 'fallback@AdobeOrg' },
    workspace: { id: 'w1', name: 'Stage', details: { services: [{ code: 'AdobeIOManagementAPISDK' }] } },
  },
};

test('reads .env keys that contain "-"', () => {
  const env = parseEnv(ENV);
  assert.equal(env['AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_client__id'], 'cid');
});

test('collects every secret the deploy workflow reads', () => {
  const secrets = collectSecrets(parseEnv(ENV), AIO);
  assert.deepEqual(secrets, {
    AIO_RUNTIME_NAMESPACE: 'ns-stage',
    AIO_RUNTIME_AUTH: 'auth',
    AIO_PROJECT_ID: 'p1',
    AIO_PROJECT_NAME: 'WalgreensNav',
    AIO_PROJECT_ORG_ID: 'o1',
    AIO_PROJECT_WORKSPACE_ID: 'w1',
    AIO_PROJECT_WORKSPACE_NAME: 'Stage',
    AIO_PROJECT_WORKSPACE_DETAILS_SERVICES: '[{"code":"AdobeIOManagementAPISDK"}]',
    CLIENTID: 'cid',
    CLIENTSECRET: 'p8e-secret',
    TECHNICALACCID: 'tid',
    TECHNICALACCEMAIL: 'x@techacct.adobe.com',
    IMSORGID: 'org@AdobeOrg',
    SCOPES: 'openid,AdobeID,read_organizations',
  });
});

test('reports the OAuth values as missing before the credential is added', () => {
  const secrets = collectSecrets(parseEnv('AIO_runtime_auth=a\nAIO_runtime_namespace=n\n'), AIO);
  assert.equal(secrets.CLIENTID, undefined);
  assert.equal(secrets.IMSORGID, 'fallback@AdobeOrg');
});
