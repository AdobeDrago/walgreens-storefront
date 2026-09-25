/**
 * quick-links — a row of icon + label pills, each pill a whole-tile link.
 *
 * Authoring (one row per pill):
 *   1. icon image (<picture>/<img>, decorative)
 *   2. link (<a href>Label</a>, optionally wrapped in <p>)
 * Single-cell rows (icon + link as flat siblings) are supported.
 */

const mediaOf = (root) => {
  const m = root.querySelector('picture, img');
  return m ? (m.closest('picture') || m) : null;
};

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const list = document.createElement('ul');
  list.className = 'quick-links-list';
  const section = block.closest('.section');
  const inFirstSection = !!section && !section.previousElementSibling;

  rows.forEach((row) => {
    const link = row.querySelector('a[href]');
    const media = mediaOf(row);
    if (!link && !media) return;

    const pill = document.createElement(link ? 'a' : 'div');
    pill.className = 'quick-links-pill';
    if (link) {
      pill.href = link.getAttribute('href');
      if (link.title) pill.title = link.title;
    }

    if (media) {
      const img = media.matches('img') ? media : media.querySelector('img');
      if (img) {
        img.alt = '';
        // icons are tiny and never the LCP element: load them eagerly only when the block
        // opens the page, without competing for high fetch priority
        if (inFirstSection) img.loading = 'eager';
      }
      const icon = document.createElement('span');
      icon.className = 'quick-links-icon';
      icon.append(media);
      pill.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'quick-links-label';
    // unwrap the authored anchor so no anchor is nested inside the pill anchor
    label.textContent = link ? link.textContent.trim() : row.textContent.trim();
    if (label.textContent) pill.append(label);

    const item = document.createElement('li');
    item.className = 'quick-links-item';
    item.append(pill);
    list.append(item);
  });

  block.replaceChildren(list);
}
