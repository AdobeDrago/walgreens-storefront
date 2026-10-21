/// <reference types="@fastly/js-compute" />
/**
 * edge-nav — proxies an EDS page and returns it with the server-rendered nav (nav-app on
 * App Builder) already in <header>, in one response.
 *
 * Based on Adobe's edge-delivery-transformer example (aem-edge-functions-examples):
 * - the page fetch bypasses the Compute cache (`pass`): EDS caches and purges pages itself, and
 *   the Adobe CDN in front of this function caches the assembled response
 * - the fragment fetch keeps the action's own Cache-Control (max-age=300)
 * - Surrogate-Key values from the page are passed on so EDS purges still reach the CDN
 * - a stitched page is CDN-cached no longer than the fragment (EDS asks for days), so nav
 *   changes show up within the fragment's max-age even though they don't purge the page
 *
 * Anything that isn't a 200 HTML page, or a fragment that fails or is slow, falls back to the
 * page as EDS sent it; the EDS header block then renders the nav client-side as usual.
 */
import { CacheOverride } from 'fastly:cache-override';
import {
  stitch, nonceFromCsp, nonceFromHtml, maxAge,
} from './stitch.js';

/** Incoming request headers forwarded to EDS (all others are dropped). */
const FORWARDED_HEADERS = ['X-Forwarded-Host', 'User-Agent', 'X-AEM-Request-ID'];

async function fetchPage(url, req) {
  const headers = new Headers();
  FORWARDED_HEADERS.forEach((name) => {
    const value = req.headers.get(name);
    if (value !== null) headers.set(name, value);
  });
  headers.set('X-BYO-CDN-Type', 'fastly');
  headers.set('X-Push-Invalidation', 'enabled');
  headers.set('Accept-Encoding', 'identity');
  return fetch(url, { method: req.method, headers, cacheOverride: new CacheOverride('pass') });
}

const DEFAULT_FRAGMENT_MAX_AGE = 300;
// an unstitched fallback is cached briefly so the CDN retries stitching soon
const FALLBACK_MAX_AGE = 60;

async function fetchFragment(url, timeoutMs) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  const request = (async () => {
    try {
      const res = await fetch(url, { headers: { Accept: 'text/html', 'Accept-Encoding': 'identity' } });
      if (!res.ok) return null;
      return { text: await res.text(), maxAge: maxAge(res.headers.get('cache-control')) ?? DEFAULT_FRAGMENT_MAX_AGE };
    } catch (e) {
      console.error(`edge-nav: fragment fetch failed: ${e.message}`);
      return null;
    }
  })();
  const fragment = await Promise.race([request, timeout]);
  clearTimeout(timer);
  return fragment;
}

function withStatus(res, body, status, cdnMaxAge = null) {
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('X-Edge-Nav', status);
  const pageMaxAge = maxAge(headers.get('surrogate-control'));
  if (cdnMaxAge !== null && (pageMaxAge === null || cdnMaxAge < pageMaxAge)) {
    headers.set('Surrogate-Control', `max-age=${cdnMaxAge}`);
  }
  return new Response(body, { status: res.status, statusText: res.statusText, headers });
}

/**
 * @param {Request} req
 * @param {{ edsOrigin: string, fragmentUrl: string, fragmentTimeoutMs: number }} config
 */
export async function edgeNavHandler(req, config) {
  const url = new URL(req.url);
  const page = await fetchPage(`${config.edsOrigin}${url.pathname}${url.search}`, req);

  const type = page.headers.get('content-type') || '';
  if (req.method !== 'GET' || page.status !== 200 || !type.includes('text/html')) return page;

  // start the fragment while the page body downloads
  const [html, fragment] = await Promise.all([
    page.text(),
    fetchFragment(config.fragmentUrl, config.fragmentTimeoutMs),
  ]);
  if (!fragment) return withStatus(page, html, 'fallback-fragment-unavailable', FALLBACK_MAX_AGE);

  const nonce = nonceFromCsp(page.headers.get('content-security-policy')) || nonceFromHtml(html);
  const result = stitch(html, fragment.text, { nonce });
  if (!result.stitched) return withStatus(page, html, `fallback-${result.reason}`, FALLBACK_MAX_AGE);
  return withStatus(page, result.html, 'stitched', fragment.maxAge);
}
