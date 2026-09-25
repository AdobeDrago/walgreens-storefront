/**
 * coupon-rail — horizontal coupon carousel with a rail header (title + "View all") and
 * prev/next arrows.
 *
 * Section head (default content directly before the block, re-absorbed into the rail header):
 *   <h2>Title</h2> <p><a href>View all</a></p>
 * Authoring (one row per coupon, three cells):
 *   1. image (<picture>/<img>)
 *   2. [<p><strong>Expires …</strong></p>] (bold-only first line = expiry badge)
 *      <p>offer</p> <p>brand</p> <p>coupon type</p>
 *   3. <em><a href>Clip</a></em> — CTA
 * Rows without an image and a single cell are treated as header content.
 * Options (block class): `dark` (dark band, light header/arrows; mirrored onto the section as
 * `coupon-rail-dark`).
 *
 * Behaviour: arrows scroll the track by one slide; they hide when the track fits and disable at
 * either end. Clip opens `/fragments/clip-modal` in a <dialog> when that fragment exists,
 * otherwise it follows the authored link.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ARROW_D = 'M10.5 1.5L2 10l8.5 8.5';
const CLOSE_D = 'M2 2l12 12M14 2L2 14';
const CLIP_FRAGMENT = '/fragments/clip-modal';

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

function wrapInPlace(node, className) {
  const w = el(className);
  node.replaceWith(w);
  w.append(node);
  return w;
}

/** rail header: move the section's default content (heading -> title, link -> View all) */
function buildHeader(block, leadingRows) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  const sources = [];
  if (wrapper && wrapper.classList.contains('default-content-wrapper')) {
    sources.push(...wrapper.children);
  }
  leadingRows.forEach((r) => sources.push(...r.querySelectorAll('h1, h2, h3, h4, h5, h6, p')));

  const title = el('coupon-rail-title');
  const link = el('coupon-rail-link');
  sources.forEach((node) => {
    if (!/^H[1-6]$/.test(node.tagName) && node.querySelector('a[href]')) link.append(node);
    else if (node.textContent.trim()) title.append(node);
  });
  if (!title.childElementCount && !link.childElementCount) return null;

  const header = el('coupon-rail-header');
  header.append(title);
  const a = link.querySelector('a[href]');
  if (a) {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    const p = a.closest('.button-wrapper');
    if (p) p.classList.remove('button-wrapper');
    a.append(svgIcon(ARROW_D, 'coupon-rail-caret', '0 0 12 20'));
    header.append(link);
  }
  if (wrapper && !wrapper.childElementCount) wrapper.remove();
  return header;
}

/** one coupon card from an authored row */
function buildCoupon(row) {
  const cells = [...row.children];
  cells.forEach(expandFolded);
  const media = mediaOf(row);
  const card = el('coupon-rail-card');
  const content = el('coupon-rail-content');
  const body = el('coupon-rail-body');
  const foot = el('coupon-rail-foot');
  const kinds = ['coupon-rail-offer', 'coupon-rail-brand', 'coupon-rail-type'];
  let badge = null;
  let line = 0;

  const nodes = cells.length > 1
    ? cells.flatMap((c) => [...c.children])
    : [...(cells[0] || row).children];
  nodes.forEach((node) => {
    if (media && (node === media || node.contains(media))) return;
    if (node.matches('a[href]') || node.querySelector('a[href]')) {
      foot.append(node);
      return;
    }
    const strongOnly = node.children.length === 1 && node.firstElementChild.tagName === 'STRONG'
      && node.textContent.trim() === node.firstElementChild.textContent.trim();
    if (strongOnly && !badge && !line) {
      badge = el('coupon-rail-badge');
      badge.append(node);
      return;
    }
    body.append(node);
    wrapInPlace(node, kinds[Math.min(line, kinds.length - 1)]);
    line += 1;
  });

  if (badge) card.append(badge);
  if (media) {
    const image = el('coupon-rail-image');
    image.append(media);
    content.append(image);
  }
  content.append(body);
  card.append(content);

  const cta = foot.querySelector('a[href]');
  if (cta) {
    const ctaText = cta.textContent.trim();
    cta.title = cta.title || ctaText;
    // every coupon's CTA reads "Clip": give each a distinct accessible name that still starts
    // with the visible label (WCAG 2.5.3), e.g. "Clip $6 off 2, L'Oreal Paris Cosmetics"
    const offer = [...body.querySelectorAll('.coupon-rail-offer, .coupon-rail-brand')]
      .map((n) => n.textContent.trim())
      .filter(Boolean)
      .join(', ');
    if (offer && !cta.hasAttribute('aria-label')) cta.setAttribute('aria-label', `${ctaText} ${offer}`);
    if (!cta.classList.contains('button')) {
      cta.classList.add('button', cta.closest('strong') ? 'primary' : 'secondary');
    }
    card.append(foot);
  }
  return card;
}

/** Clip: load the shared fragment once and show it as a <dialog>; fall back to the link */
async function openClipModal(block, href) {
  let dialog = block.querySelector('dialog.coupon-rail-dialog');
  if (!dialog) {
    dialog = el('coupon-rail-dialog', 'dialog');
    const close = el('coupon-rail-close', 'button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.append(svgIcon(CLOSE_D, 'coupon-rail-close-icon', '0 0 16 16'));
    close.addEventListener('click', () => dialog.close());
    const body = el('coupon-rail-dialog-body');
    dialog.append(close, body);
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
    block.append(dialog);
    try {
      const { loadFragment } = await import('../fragment/fragment.js');
      const fragment = await loadFragment(CLIP_FRAGMENT);
      if (fragment) body.append(...fragment.childNodes);
    } catch (e) {
      // fragment unavailable: fall through to the authored link
    }
  }
  if (dialog.querySelector('.coupon-rail-dialog-body').childElementCount) dialog.showModal();
  else if (href) window.location.assign(href);
}

function arrow(direction, label) {
  const btn = el(`coupon-rail-arrow coupon-rail-arrow-${direction}`, 'button');
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.append(svgIcon(ARROW_D, 'coupon-rail-arrow-icon', '0 0 12 20'));
  return btn;
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const isCoupon = (r) => !!r.querySelector('picture, img') || r.children.length > 1;
  const leading = rows.filter((r) => !isCoupon(r));
  const couponRows = rows.filter(isCoupon);

  if (block.classList.contains('dark')) {
    const section = block.closest('.section');
    if (section) section.classList.add('coupon-rail-dark');
  }

  const header = buildHeader(block, leading);

  const container = el('coupon-rail-container');
  const viewport = el('coupon-rail-viewport');
  const track = el('coupon-rail-track', 'ul');
  couponRows.forEach((row) => {
    const slide = el('coupon-rail-slide', 'li');
    slide.append(buildCoupon(row));
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

  track.addEventListener('click', (ev) => {
    const cta = ev.target.closest('.coupon-rail-foot a[href]');
    if (!cta) return;
    ev.preventDefault();
    openClipModal(block, cta.href);
  });
}
