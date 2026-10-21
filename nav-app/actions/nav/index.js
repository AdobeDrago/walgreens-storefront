/**
 * nav — App Builder web action that server-renders the Walgreens nav.
 *
 *   GET …/nav-app/nav               HTML fragment (default) — what the edge function will inject
 *   GET …/nav-app/nav?format=page   standalone HTML document, for viewing the nav on its own
 *   GET …/nav-app/nav?format=json   the parsed nav model
 *
 * Inputs (app.config.yaml, final — not overridable from the query string):
 *   EDS_ORIGIN  site the authored nav document is read from
 *   ASSET_BASE  optional base URL of the hydration bundle; defaults to the workspace's static hosting
 */
import parseNav from '../../src/parse-nav.js';
import { renderFragment, renderPage } from '../../src/render.js';

const DEFAULT_ORIGIN = 'https://main--walgreens-storefront--adobedrago.aem.page';
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

// memoized per warm container: hashed asset names only change on redeploy
let assetsPromise = null;

function assetBase(params) {
  if (params.ASSET_BASE) return params.ASSET_BASE.replace(/\/?$/, '/');
  const ns = process.env.__OW_NAMESPACE;
  return ns ? `https://${ns}.adobeio-static.net/` : null;
}

/**
 * Parcel content-hashes the static bundle, so its CSS/JS URLs are read from the deployed
 * index.html rather than hard-coded. Without them the nav still renders, just without hydration.
 */
async function loadAssets(base) {
  if (!base) return { css: [], js: [] };
  try {
    const resp = await fetch(new URL('index.html', base));
    if (!resp.ok) throw new Error(`index.html ${resp.status}`);
    const doc = await resp.text();
    const urls = (re) => [...doc.matchAll(re)].map((m) => new URL(m[1], base).href);
    return {
      css: urls(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
      js: urls(/<script[^>]+type="module"[^>]+src="([^"]+)"/g),
    };
  } catch (e) {
    console.warn(`hydration assets unavailable from ${base}: ${e.message}`);
    assetsPromise = null;
    return { css: [], js: [] };
  }
}

async function fetchModel(origin) {
  const url = new URL('/nav.plain.html', origin);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`nav document ${url} returned ${resp.status}`);
  return parseNav(await resp.text(), resp.url || url.href);
}

export async function main(params) {
  const origin = params.EDS_ORIGIN || DEFAULT_ORIGIN;
  const format = params.format || 'fragment';
  try {
    const model = await fetchModel(origin);
    if (format === 'json') {
      return { statusCode: 200, headers: { 'Cache-Control': CACHE_CONTROL }, body: model };
    }
    assetsPromise = assetsPromise || loadAssets(assetBase(params));
    const assets = await assetsPromise;
    const body = format === 'page' ? renderPage(model, assets) : renderFragment(model, assets);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': CACHE_CONTROL },
      body,
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 502, headers: { 'Cache-Control': 'no-store' }, body: { error: 'nav unavailable' } };
  }
}
