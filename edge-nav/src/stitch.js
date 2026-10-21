/**
 * Puts the nav-app fragment into an EDS page's empty <header>. Pure string work with no Fastly
 * imports, so it runs (and is tested) in Node as well as in Compute.
 *
 * EDS delivers every page with `<header></header>` and moves the CSP into a response header with
 * a fresh nonce per response (`script-src 'nonce-…' 'strict-dynamic' …`). Under 'strict-dynamic'
 * a parser-inserted <script src> without that nonce is blocked, so the fragment's script tags get
 * the page's nonce.
 */

const HEADER_OPEN = /<header(\s[^>]*)?>/i;
const ROOT_MARKER = 'id="wnav-root"';

/** The nonce from a CSP header value, e.g. `script-src 'nonce-abc' …` → `abc`. */
export function nonceFromCsp(csp) {
  return csp?.match(/'nonce-([^']+)'/)?.[1] || null;
}

/** The nonce the page's own scripts carry, when the CSP is not in a header. */
export function nonceFromHtml(html) {
  return html.match(/<script\b[^>]*\snonce="([^"]+)"/i)?.[1] || null;
}

/** max-age from a Cache-Control or Surrogate-Control value, or null. */
export function maxAge(value) {
  const m = value?.match(/(?:^|,)\s*max-age=(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** Adds the nonce to every <script> start tag in the fragment that doesn't already have one. */
export function addNonce(fragment, nonce) {
  if (!nonce) return fragment;
  const attr = ` nonce="${nonce.replace(/"/g, '&quot;')}"`;
  return fragment.replace(/<script\b(?![^>]*\snonce=)/gi, (tag) => `${tag}${attr}`);
}

/**
 * @param {string} html the EDS page
 * @param {string} fragment the nav-app fragment (link + markup + model + script)
 * @param {{ nonce?: string|null }} options
 * @returns {{ html: string, stitched: boolean, reason?: string }}
 */
export function stitch(html, fragment, { nonce = null } = {}) {
  if (!fragment || !fragment.includes(ROOT_MARKER)) return { html, stitched: false, reason: 'no-fragment' };
  if (html.includes(ROOT_MARKER)) return { html, stitched: false, reason: 'already-stitched' };
  const match = html.match(HEADER_OPEN);
  if (!match) return { html, stitched: false, reason: 'no-header' };
  const at = match.index + match[0].length;
  return {
    html: `${html.slice(0, at)}${addNonce(fragment, nonce)}${html.slice(at)}`,
    stitched: true,
  };
}
