/**
 * Parses the authored EDS nav document (/nav.plain.html) into a plain data model the React nav
 * renders from. Server-only (node-html-parser); the browser receives the model as JSON.
 *
 * The document has one default-content section per slot, in the same order the EDS header block
 * reads them (blocks/header/header.js):
 *   1. promo    <ul> of links
 *   2. brand    <picture>/<img>, optionally wrapped in a link
 *   3. search   <p><a href>label</a></p>
 *   4. store    <p>text</p> — optional, recognised by shape (no link, list or image)
 *   5. account  <p>trigger label</p> + <ul> of links
 *   6. nav      <ul>: <li>label<ul>…</ul></li> (panel) | <li><a/></li> (direct link)
 *   7. cart     <p><a href>label</a></p>
 */
import { parse } from 'node-html-parser';

const elements = (node) => (node ? node.childNodes.filter((n) => n.nodeType === 1) : []);
const childByTag = (node, tag) => elements(node).find((n) => n.tagName === tag);
const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();

function link(a) {
  return a ? { label: clean(a.text), href: a.getAttribute('href') } : null;
}

/**
 * A list item becomes { label, href?, children? }. Live delivery may wrap the inline run in <p>,
 * so the label/link is looked up through one level of paragraphs.
 */
function navNode(li) {
  const sub = childByTag(li, 'UL');
  const inline = elements(li).filter((n) => n !== sub);
  const anchor = inline.map((n) => (n.tagName === 'A' ? n : childByTag(n, 'A'))).find(Boolean);
  const label = anchor
    ? clean(anchor.text)
    : clean(li.childNodes.filter((n) => n !== sub).map((n) => n.text).join(' '));
  const node = { label };
  if (anchor) node.href = anchor.getAttribute('href');
  if (sub) node.children = elements(sub).map(navNode);
  return node;
}

function brand(section, base) {
  const img = section?.querySelector('img');
  if (!img) return null;
  const resolve = (value) => new URL(value, base).href;
  const sources = section.querySelectorAll('source').map((s) => ({
    type: s.getAttribute('type'),
    media: s.getAttribute('media') || null,
    srcSet: s.getAttribute('srcset').split(',').map((candidate) => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/);
      return [resolve(url), ...descriptors].join(' ');
    }).join(', '),
  }));
  return {
    href: section.querySelector('a')?.getAttribute('href') || '/',
    alt: img.getAttribute('alt') || '',
    src: resolve(img.getAttribute('src')),
    width: img.getAttribute('width'),
    height: img.getAttribute('height'),
    sources,
  };
}

/**
 * @param {string} html the nav.plain.html body
 * @param {string} base URL of the fetched document, used to resolve relative media
 */
export default function parseNav(html, base) {
  const root = parse(html);
  const q = elements(root).filter((n) => n.tagName === 'DIV');
  const slots = {};
  slots.promo = q.shift();
  slots.brand = q.shift();
  slots.search = q.shift();
  const next = q[0];
  if (next && !next.querySelector('a, ul, ol, picture, img') && next.querySelector('p')) {
    slots.store = q.shift();
  }
  slots.account = q.shift();
  slots.nav = q.shift();
  slots.cart = q.shift();

  const searchLink = slots.search?.querySelector('a');
  const accountList = slots.account?.querySelector('ul');

  return {
    promo: (slots.promo?.querySelectorAll('a') || []).map(link),
    brand: brand(slots.brand, base),
    search: {
      label: clean(searchLink?.text || slots.search?.text) || 'Search',
      action: searchLink?.getAttribute('href') || '/search',
    },
    store: slots.store ? clean(slots.store.text) : null,
    account: {
      label: clean(slots.account?.querySelector('p')?.text) || 'Account',
      links: (accountList?.querySelectorAll('a') || []).map(link),
    },
    nav: elements(slots.nav?.querySelector('ul')).map(navNode),
    cart: link(slots.cart?.querySelector('a')) || { label: 'Cart', href: '/cart' },
  };
}
