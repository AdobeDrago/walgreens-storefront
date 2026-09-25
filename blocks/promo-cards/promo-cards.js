/**
 * promo-cards — a band of 3 or 4 image cards (heading = default content above the block).
 *
 * Authoring (one row per card, two cells — CELL ORDER = VISUAL ORDER):
 *   - image cell: <picture>/<img>
 *   - text cell, in reading order:
 *       [<p>kicker</p>]                         small line above the title
 *       <h3><a href>Title</a></h3>              card link (whole tile becomes the anchor);
 *                                               <h3><strong>Title</strong></h3> = large title;
 *                                               a title without link = non-navigating tile
 *       [<p>copy</p>]                           body lines
 *       [<p><em>meta</em></p>]                  small meta line
 *       [<p><strong|em><a>CTA</a></strong|em></p>]  CTA button
 * Column count follows the row count: 4 cards = 4 equal columns; 3 cards = wide lead + 2.
 * Options (block class): `dark`, `inverse`, `taupe`, `plain` (surface schemes) and `gap-top`
 * (extra space above the band). The scheme is mirrored onto the section as
 * `promo-cards-<option>` so the in-section heading can follow it.
 * Single-cell rows (picture + text as flat siblings) are supported.
 */

const SCHEMES = ['dark', 'inverse', 'taupe', 'plain'];

const mediaOf = (root) => {
  const m = root.querySelector('picture, img');
  return m ? (m.closest('picture') || m) : null;
};

const el = (className, tag = 'div') => {
  const e = document.createElement(tag);
  e.className = className;
  return e;
};

/** a cell whose whole content was folded into one <p> around the picture */
function expandFolded(cell) {
  const kids = [...cell.children];
  if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].children.length > 1
    && kids[0].querySelector('picture, img')) {
    kids[0].replaceWith(...kids[0].childNodes);
  }
}

/** wrap an element in place, keeping sibling order */
function wrapInPlace(node, className) {
  const w = el(className);
  node.replaceWith(w);
  w.append(node);
  return w;
}

/** collect the text nodes/elements of a row, excluding the media and its empty wrapper */
function collectText(row, cells, media, mediaCell) {
  const text = el('promo-cards-text');
  const textCell = cells.find((c) => c !== mediaCell);
  if (textCell) {
    text.append(...textCell.childNodes);
    return { text, imageOnTop: !!mediaCell && cells.indexOf(mediaCell) === 0 };
  }
  // single cell: everything except the picture; image on top when it precedes the heading
  const cell = cells[0] || row;
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const order = [...cell.children];
  const mediaTop = media ? (order.find((n) => n.contains(media)) || media) : null;
  const imageOnTop = !!media && (!heading || order.indexOf(mediaTop) < order.indexOf(heading));
  [...cell.childNodes].forEach((n) => {
    const isMediaWrapper = n.nodeType === 1 && n.contains(media) && !n.textContent.trim();
    if (media && (n === media || isMediaWrapper)) return;
    text.append(n);
  });
  return { text, imageOnTop };
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const scheme = SCHEMES.find((s) => block.classList.contains(s)) || 'default';
  const section = block.closest('.section');
  if (section) {
    section.classList.add(`promo-cards-${scheme}`);
    if (block.classList.contains('gap-top')) section.classList.add('promo-cards-gap-top');
  }
  block.classList.add(`cols-${rows.length}`);

  const grid = el('promo-cards-grid', 'ul');

  rows.forEach((row, i) => {
    const cells = [...row.children];
    cells.forEach(expandFolded);
    const media = mediaOf(row);
    const mediaCell = media ? cells.find((c) => c.contains(media)) : null;
    const { text, imageOnTop } = collectText(row, cells, media, mediaCell);

    const heading = text.querySelector('h1, h2, h3, h4, h5, h6');
    const titleLink = heading ? heading.querySelector('a[href]') : null;

    // classify each text element by role
    let seenHeading = false;
    let hasCta = false;
    [...text.children].forEach((node) => {
      let cls;
      if (/^H[1-6]$/.test(node.tagName)) {
        cls = 'promo-cards-title';
        seenHeading = true;
      } else if (node.querySelector('a[href]')) {
        cls = 'promo-cards-cta';
        hasCta = true;
        node.querySelectorAll('a[href]').forEach((a) => {
          if (!a.classList.contains('button')) {
            a.classList.add('button', a.closest('strong') ? 'primary' : 'secondary');
          }
        });
      } else if (node.children.length === 1 && node.firstElementChild.tagName === 'EM'
        && node.textContent.trim() === node.firstElementChild.textContent.trim()) {
        cls = 'promo-cards-meta';
      } else {
        cls = seenHeading ? 'promo-cards-copy' : 'promo-cards-kicker';
      }
      wrapInPlace(node, cls);
    });

    // whole-tile anchor only when the tile navigates and holds no other link (no nested anchors)
    const wholeTile = titleLink && !hasCta;
    // a generic CTA label ("Clip") gets the card title appended to its accessible name,
    // keeping the visible label first (WCAG 2.5.3)
    const titleText = heading ? heading.textContent.trim() : '';
    if (hasCta && titleText) {
      text.querySelectorAll('.promo-cards-cta a[href]').forEach((a) => {
        const label = a.textContent.trim();
        if (label && !a.hasAttribute('aria-label') && !label.includes(titleText)) {
          a.setAttribute('aria-label', `${label}: ${titleText}`);
        }
      });
    }

    const card = el('promo-cards-card', wholeTile ? 'a' : 'div');
    if (wholeTile) {
      card.href = titleLink.getAttribute('href');
      titleLink.replaceWith(...titleLink.childNodes);
    }

    const body = el(`promo-cards-body${hasCta ? ' promo-cards-body-clip' : ''}`);
    body.append(text);
    if (media) {
      const mediaWrap = el('promo-cards-image');
      mediaWrap.append(media);
      if (imageOnTop) card.append(mediaWrap, body);
      else card.append(body, mediaWrap);
    } else {
      card.append(body);
    }

    const item = el('promo-cards-item', 'li');
    if (rows.length === 3 && i === 0) item.classList.add('promo-cards-item-wide');
    item.append(card);
    grid.append(item);
  });

  block.replaceChildren(grid);
}
