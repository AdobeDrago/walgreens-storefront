/**
 * ad-slot — reserved advertising band. The captured creative ships as an authored image; an ad
 * integration (GAM / Criteo) can be wired into this block later.
 *
 * Authoring (one row, one cell): <picture>/<img alt="Sponsored: …">, optionally wrapped in or
 * accompanied by a link (the slot becomes a link). An empty cell renders the reserved height only.
 * Options (block class): default = leaderboard slot, `criteo` = taller flagship module
 * (collapsed on small screens).
 */

const mediaOf = (root) => {
  const m = root.querySelector('picture, img');
  return m ? (m.closest('picture') || m) : null;
};

export default async function decorate(block) {
  const frame = document.createElement('div');
  frame.className = 'ad-slot-frame';

  const media = mediaOf(block);
  const link = block.querySelector('a[href]');
  if (media) {
    const img = media.matches('img') ? media : media.querySelector('img');
    if (img && !img.alt) img.alt = 'Sponsored';
    if (link) {
      const a = document.createElement('a');
      a.className = 'ad-slot-link';
      a.href = link.getAttribute('href');
      a.append(media);
      frame.append(a);
    } else {
      frame.append(media);
    }
  }

  block.setAttribute('role', 'complementary');
  block.setAttribute('aria-label', 'Advertisement');
  block.replaceChildren(frame);
}
