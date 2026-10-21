/**
 * header — the site nav comes from nav-app (server-rendered React on App Builder, see nav-app/);
 * this block builds no nav of its own.
 *
 * - Through the edge-nav edge function (edge-nav/) the nav is already in <header> when the page
 *   arrives, and scripts.js doesn't load this block at all.
 * - Everywhere else (aem.page / aem.live, or an edge-nav fallback) it fetches the same nav-app
 *   fragment in the browser and appends it to <header>.
 *
 * The EDS-built Walgreens header that used to live here is in git history (ae32f6d).
 */

import { loadCSS } from '../../scripts/aem.js';

const NAV_APP_URL = 'https://4191536-703coralcanid-stage.adobeio-static.net/api/v1/web/nav-app/nav';

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const header = block.closest('header');
  block.remove();
  if (!header || header.querySelector('#wnav-root')) return;

  try {
    const resp = await fetch(NAV_APP_URL);
    if (!resp.ok) throw new Error(`nav-app responded ${resp.status}`);
    const template = document.createElement('template');
    template.innerHTML = await resp.text();
    // styles first: unstyled nav markup would lay out tall and then jump into place (CLS)
    const styles = [...template.content.querySelectorAll('link[rel="stylesheet"]')];
    styles.forEach((link) => link.remove());
    await Promise.all(styles.map((link) => loadCSS(link.href)));
    // scripts parsed from a string never run; re-created ones do ('strict-dynamic' allows them)
    template.content.querySelectorAll('script[src]').forEach((parsed) => {
      const script = document.createElement('script');
      script.src = parsed.src;
      parsed.replaceWith(script);
    });
    header.append(template.content);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('header: nav-app unavailable', error);
  }
}
