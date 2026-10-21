/**
 * Reads the hydration bundle's stylesheet and script URLs out of the deployed web-src/index.html.
 * Parcel content-hashes them, and with `--web-optimize` it also minifies the HTML, dropping
 * attribute quotes (`<script src=/web-src.9485b3f2.js defer>`), so values may be double-quoted,
 * single-quoted or bare.
 */

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => tag);

/**
 * @param {string} html the deployed index.html
 * @param {string} base URL the asset paths resolve against
 * @returns {{ css: string[], js: { src: string, module: boolean }[] }}
 */
export default function parseAssets(html, base) {
  const abs = (url) => new URL(url, base).href;
  return {
    css: tags(html, 'link')
      .filter((tag) => (attr(tag, 'rel') || '').toLowerCase() === 'stylesheet' && attr(tag, 'href'))
      .map((tag) => abs(attr(tag, 'href'))),
    // aio's Parcel build emits a classic deferred script; a dev build may emit a module
    js: tags(html, 'script')
      .filter((tag) => attr(tag, 'src'))
      .map((tag) => ({ src: abs(attr(tag, 'src')), module: attr(tag, 'type') === 'module' })),
  };
}
