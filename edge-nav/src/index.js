/// <reference types="@fastly/js-compute" />
/**
 * AEM Edge Function entry point (Fastly Compute). Settings come from the config store
 * (`configs` in config/edgeFunctions.yaml) with defaults for local `aio aem edge-functions serve`.
 */
import { ConfigStore } from 'fastly:config-store';
import { edgeNavHandler } from './edge-nav.js';

const DEFAULTS = {
  EDS_ORIGIN: 'https://main--walgreens-storefront--adobedrago.aem.live',
  NAV_FRAGMENT_URL: 'https://4191536-703coralcanid-stage.adobeio-static.net/api/v1/web/nav-app/nav',
  FRAGMENT_TIMEOUT_MS: '1500',
};

function setting(store, key) {
  try {
    return store?.get(key) || DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

function loadConfig() {
  let store = null;
  try {
    store = new ConfigStore('config_default');
  } catch {
    // no config store locally unless fastly.toml declares one
  }
  return {
    edsOrigin: setting(store, 'EDS_ORIGIN').replace(/\/$/, ''),
    fragmentUrl: setting(store, 'NAV_FRAGMENT_URL'),
    fragmentTimeoutMs: Number(setting(store, 'FRAGMENT_TIMEOUT_MS')) || 1500,
  };
}

async function handleRequest(event) {
  const req = event.request;
  try {
    const res = await edgeNavHandler(req, loadConfig());
    console.log(JSON.stringify({ method: req.method, url: req.url, status: res.status, edgeNav: res.headers.get('X-Edge-Nav') }));
    return res;
  } catch (e) {
    console.error(`edge-nav: ${e.message}`);
    return new Response('Internal Edge Error', { status: 500 });
  }
}

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));
