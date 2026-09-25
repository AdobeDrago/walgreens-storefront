/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: walgreens cleanup.
 *
 * The source (https://main--sdt-walgreens--aemcoder.aem.live/) is already an AEM
 * Edge Delivery site, so its rendered <main> is decorated by block JS
 * (section wrappers, *-wrapper divs, data-block-status, etc.). Instead of
 * reverse-engineering the decorated DOM, beforeTransform swaps <main>'s content
 * for the page's AUTHORED markup ({path}.plain.html, fetched synchronously from
 * the same origin). Resulting structure:
 *   main > div (section) > default content + div.{block}[.{variant}] > div > div
 *
 * Selectors verified in migration-work/cleaned.html:
 *   <header class="header-wrapper"> (contains <nav class="hdr-nav" id="hdr-nav">)
 *   <footer class="footer-wrapper">
 *   <main> (header/footer are siblings of main, outside it)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const SWAPPED_ATTR = 'data-excat-plain-swapped';

function getMain(element) {
  if (element.matches && element.matches('main')) return element;
  return element.querySelector('main');
}

function getPageUrl(payload) {
  const candidates = [
    payload && payload.params && payload.params.originalURL,
    payload && payload.url,
    typeof window !== 'undefined' && window.location && window.location.href,
    typeof document !== 'undefined' && document.location && document.location.href,
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u;
    } catch (e) { /* try next */ }
  }
  return null;
}

function fetchPlainHtml(pageUrl) {
  const { pathname } = pageUrl;
  const plainPath = (pathname === '/' || pathname.endsWith('/'))
    ? `${pathname}index.plain.html`
    : `${pathname}.plain.html`;
  // Same-origin request: the importer runs inside the page on the source origin.
  const sameOrigin = typeof window !== 'undefined' && window.location
    && window.location.origin === pageUrl.origin;
  const url = sameOrigin ? plainPath : `${pageUrl.origin}${plainPath}`;
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // synchronous by design
    xhr.send(null);
    if (xhr.status === 200 && xhr.responseText && xhr.responseText.trim()) {
      return xhr.responseText;
    }
    console.warn(`[walgreens-cleanup] ${url} returned status ${xhr.status}; keeping rendered DOM`);
  } catch (e) {
    console.warn(`[walgreens-cleanup] failed to fetch ${url}: ${e.message}; keeping rendered DOM`);
  }
  return null;
}

function toAbsolute(value, base) {
  if (!value) return value;
  if (!(value.startsWith('./') || value.startsWith('/') || value.startsWith('../'))) return value;
  if (value.startsWith('//')) return value;
  try {
    return new URL(value, base).href;
  } catch (e) {
    return value;
  }
}

/** Upgrade EDS media rendition to the large (2000px) variant for better import quality. */
function upgradeRendition(src) {
  try {
    const u = new URL(src);
    if (/\/media_[0-9a-f]+\./.test(u.pathname) && u.searchParams.has('width')) {
      u.searchParams.set('width', '2000');
    }
    return u.href;
  } catch (e) {
    return src;
  }
}

function normalizeMedia(main, pageUrl) {
  const base = pageUrl.href;
  // One clean <img> per <picture>: drop <source> renditions.
  main.querySelectorAll('picture source').forEach((s) => s.remove());
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) img.setAttribute('src', upgradeRendition(toAbsolute(src, base)));
    const srcset = img.getAttribute('srcset');
    if (srcset) img.removeAttribute('srcset');
    img.removeAttribute('loading');
  });
  // Any remaining standalone <source> (video/audio) with relative URLs.
  main.querySelectorAll('source[src], source[srcset]').forEach((s) => {
    if (s.hasAttribute('src')) s.setAttribute('src', toAbsolute(s.getAttribute('src'), base));
    if (s.hasAttribute('srcset')) {
      const abs = s.getAttribute('srcset').split(',').map((part) => {
        const [u, ...rest] = part.trim().split(/\s+/);
        return [toAbsolute(u, base), ...rest].join(' ');
      }).join(', ');
      s.setAttribute('srcset', abs);
    }
  });
  // Links are intentionally left untouched (relative site links stay relative).
}

function removeEmptySections(main) {
  [...main.children].forEach((child) => {
    if (child.tagName !== 'DIV') return;
    const hasMedia = child.querySelector('img, picture, video, iframe, svg');
    if (!child.textContent.trim() && !hasMedia) child.remove();
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const main = getMain(element);
    if (!main) return;

    if (!main.hasAttribute(SWAPPED_ATTR)) {
      const pageUrl = getPageUrl(payload);
      const html = pageUrl ? fetchPlainHtml(pageUrl) : null;
      if (html) {
        main.innerHTML = html;
        main.setAttribute(SWAPPED_ATTR, 'true');
        normalizeMedia(main, pageUrl);
      } else if (!pageUrl) {
        console.warn('[walgreens-cleanup] could not determine page URL; keeping rendered DOM');
      }
    }

    // plain.html starts with an empty <div></div> section - drop empty sections.
    removeEmptySections(main);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (outside <main>, verified in cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'footer.footer-wrapper',
      'nav#hdr-nav',
      'header',
      'footer',
      'noscript',
      'link',
      'script',
      'style',
    ]);
    const main = getMain(element);
    if (main) main.removeAttribute(SWAPPED_ATTR);
  }
}
