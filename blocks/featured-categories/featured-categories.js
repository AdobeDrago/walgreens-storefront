/**
 * featured-categories — grid of round category tiles (image + label, whole-tile link) in a
 * collapsed region with a "See more / See less" toggle. The section title is default content
 * above the block.
 *
 * Authoring:
 *   - one row per tile (two cells): image | <a href>Label</a> (optionally wrapped in <p>)
 *   - optional last row (two text cells, no image): See more | See less
 *     (the toggle shows one label at a time; with no toggle row all tiles are shown)
 * Single-cell tile rows (image + link as flat siblings) are supported.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function chevron() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'featured-categories-chevron');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M4 7l6 6 6-6');
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

let regionCount = 0;

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const tiles = rows.filter((r) => r.querySelector('picture, img'));
  const controls = rows.filter((r) => !r.querySelector('picture, img') && r.textContent.trim());

  regionCount += 1;
  const region = el('featured-categories-region');
  region.id = `featured-categories-region-${regionCount}`;
  const list = el('featured-categories-list', 'ul');

  tiles.forEach((row) => {
    const media = mediaOf(row);
    const link = row.querySelector('a[href]');
    const tile = el('featured-categories-tile', link ? 'a' : 'div');
    if (link) tile.href = link.getAttribute('href');

    if (media) {
      const img = media.matches('img') ? media : media.querySelector('img');
      if (img) img.alt = '';
      const image = el('featured-categories-image');
      image.append(media);
      tile.append(image);
    }
    const label = el('featured-categories-label', 'span');
    label.textContent = (link || row).textContent.trim();
    if (label.textContent) tile.append(label);

    const item = el('featured-categories-item', 'li');
    item.append(tile);
    list.append(item);
  });
  region.append(list);

  // toggle labels: one per cell of the control row (paragraphs or bare text)
  const labels = controls
    .flatMap((r) => [...r.children])
    .map((cell) => cell.textContent.trim())
    .filter(Boolean);

  const children = [region];
  if (labels.length) {
    block.classList.add('is-collapsible');
    const [moreText] = labels;
    const lessText = labels[1] || moreText;
    const btn = el('featured-categories-toggle', 'button');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', region.id);
    const text = el('featured-categories-toggle-label', 'span');
    text.textContent = moreText;
    btn.append(text, chevron());
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      region.classList.toggle('is-open', open);
      text.textContent = open ? lessText : moreText;
    });
    const more = el('featured-categories-more');
    more.append(btn);
    children.push(more);

    // hide the toggle while every tile already fits in the collapsed rows at this breakpoint
    const items = [...list.children];
    const sync = () => {
      const collapsed = !region.classList.contains('is-open');
      more.hidden = collapsed && !items.some((item) => getComputedStyle(item).display === 'none');
    };
    window.addEventListener('resize', sync);
    requestAnimationFrame(sync);
  }

  block.replaceChildren(...children);
}
