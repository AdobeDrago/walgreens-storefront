/**
 * deals-rail — "Deals of the Week" product carousel: a rail header (icon, title, "View all",
 * store/expiry line) and a horizontal track of whole-card product links with prev/next arrows.
 *
 * Section head (default content directly before the block, re-absorbed into the rail header):
 *   <p><img icon></p> <h2><strong>Deals</strong> <em>of the</em> <strong>Week</strong></h2>
 *   <p><a href>View all</a></p> <p>Deals for STORE <strong>expires in N days!</strong></p>
 * Authoring (one row per product, two cells):
 *   image | <h3><a href>price</a></h3> <p>product name</p>
 * The heading link becomes the whole-card anchor. Single-cell rows are supported.
 *
 * Behaviour: arrows scroll the track by one slide; they hide when the track fits and disable at
 * either end.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ARROW_D = 'M10.5 1.5L2 10l8.5 8.5';

function svgIcon(d, className, viewBox) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

const el = (className, tag = 'div') => {
  const e = document.createElement(tag);
  e.className = className;
  return e;
};

const mediaOf = (root) => {
  const m = root.querySelector('picture, img');
  return m ? (m.closest('picture') || m) : null;
};

function expandFolded(cell) {
  const kids = [...cell.children];
  if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].children.length > 1
    && kids[0].querySelector('picture, img')) {
    kids[0].replaceWith(...kids[0].childNodes);
  }
}

/** header: move default content by role — icon, heading, link, remaining text (store line) */
function buildHeader(block, leadingRows) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  const sources = [];
  if (wrapper && wrapper.classList.contains('default-content-wrapper')) {
    sources.push(...wrapper.children);
  }
  leadingRows.forEach((r) => sources.push(...r.querySelectorAll('h1, h2, h3, h4, h5, h6, p')));

  const icon = el('deals-rail-icon');
  const title = el('deals-rail-title');
  const link = el('deals-rail-link');
  const store = el('deals-rail-store');
  sources.forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName)) title.append(node);
    else if (node.querySelector('picture, img, .icon') && !node.textContent.trim()) icon.append(node);
    else if (node.querySelector('a[href]')) link.append(node);
    else if (node.textContent.trim()) store.append(node);
  });
  if (!title.childElementCount && !link.childElementCount && !store.childElementCount) return null;

  const header = el('deals-rail-header');
  const row = el('deals-rail-title-row');
  if (icon.childElementCount) {
    // decorative tag icon (empty alt): keep it out of the accessibility tree
    if (![...icon.querySelectorAll('img')].some((img) => img.alt.trim())) {
      icon.setAttribute('aria-hidden', 'true');
    }
    row.append(icon);
  }
  row.append(title);
  const a = link.querySelector('a[href]');
  if (a) {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    const p = a.closest('.button-wrapper');
    if (p) p.classList.remove('button-wrapper');
    a.append(svgIcon(ARROW_D, 'deals-rail-caret', '0 0 12 20'));
    row.append(link);
  }
  header.append(row);
  if (store.childElementCount) header.append(store);
  if (wrapper && !wrapper.childElementCount) wrapper.remove();
  return header;
}

/** one product card; the heading link becomes the whole-card anchor */
function buildCard(row) {
  const cells = [...row.children];
  cells.forEach(expandFolded);
  const media = mediaOf(row);
  const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
  const link = (heading && heading.querySelector('a[href]')) || row.querySelector('a[href]');

  const card = el('deals-rail-card', link ? 'a' : 'div');
  if (link) card.href = link.getAttribute('href');

  const text = el('deals-rail-text');
  const nodes = cells.length > 1
    ? cells.flatMap((c) => [...c.children])
    : [...(cells[0] || row).children];
  nodes.forEach((child) => {
    if (media && (child === media || (child.contains(media) && !child.textContent.trim()))) return;
    // unwrap anchors so no anchor is nested inside the card anchor
    let node = child;
    if (node.tagName === 'A') {
      node = document.createElement('p');
      node.append(...child.childNodes);
    }
    node.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
    const w = el(/^H[1-6]$/.test(node.tagName) ? 'deals-rail-price' : 'deals-rail-name');
    w.append(node);
    text.append(w);
  });

  if (media) {
    // alt text that repeats the card's own text (e.g. the price) would be announced twice
    // inside the card link — treat the image as decorative in that case
    const img = media.matches('img') ? media : media.querySelector('img');
    const alt = img ? img.alt.trim().toLowerCase() : '';
    if (alt && text.textContent.toLowerCase().includes(alt)) img.alt = '';
    const image = el('deals-rail-image');
    image.append(media);
    card.append(image);
  }
  card.append(text);
  return card;
}

function arrow(direction, label) {
  const btn = el(`deals-rail-arrow deals-rail-arrow-${direction}`, 'button');
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.append(svgIcon(ARROW_D, 'deals-rail-arrow-icon', '0 0 12 20'));
  return btn;
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const isCard = (r) => !!r.querySelector('picture, img') || r.children.length > 1;
  const leading = rows.filter((r) => !isCard(r));
  const cardRows = rows.filter(isCard);

  const header = buildHeader(block, leading);

  const container = el('deals-rail-stage');
  const viewport = el('deals-rail-viewport');
  const track = el('deals-rail-track', 'ul');
  cardRows.forEach((row) => {
    const slide = el('deals-rail-slide', 'li');
    slide.append(buildCard(row));
    track.append(slide);
  });
  viewport.append(track);
  const prev = arrow('prev', 'Previous slide');
  const next = arrow('next', 'Next slide');
  container.append(prev, viewport, next);

  block.replaceChildren(...(header ? [header] : []), container);

  const pitch = () => {
    const slide = track.firstElementChild;
    return slide ? slide.getBoundingClientRect().width : viewport.clientWidth;
  };
  const sync = () => {
    const locked = viewport.scrollWidth <= viewport.clientWidth + 1;
    prev.hidden = locked;
    next.hidden = locked;
    prev.disabled = viewport.scrollLeft <= 0;
    next.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1;
  };
  prev.addEventListener('click', () => viewport.scrollBy({ left: -pitch() }));
  next.addEventListener('click', () => viewport.scrollBy({ left: pitch() }));
  viewport.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  requestAnimationFrame(sync);
}
