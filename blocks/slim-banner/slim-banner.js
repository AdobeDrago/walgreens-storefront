/**
 * slim-banner — inset banner tile: a centred text column (headline, optional sub-line, CTA)
 * beside a cover image.
 *
 * Authoring (one row, two cells — cell order does not matter):
 *   - image cell: <picture>/<img>
 *   - text cell: <p>headline</p> [<p>sub-line</p>] <p><em|strong><a>CTA</a></em|strong></p>
 * Options (block class): `split` (60/40 text/image from 900px), `bleed` (50/50, display headline).
 * Single-cell rows (image + text as flat siblings) are supported.
 */

const mediaOf = (root) => {
  const m = root.querySelector('picture, img');
  return m ? (m.closest('picture') || m) : null;
};

const el = (className) => {
  const e = document.createElement('div');
  e.className = className;
  return e;
};

export default async function decorate(block) {
  const media = mediaOf(block);
  const texts = [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')]
    .filter((node) => node.textContent.trim() && !node.parentElement.closest('p, ul, ol'));
  if (!media && !texts.length) return;

  const box = el('slim-banner-box');
  const content = el('slim-banner-content');
  const headline = el('slim-banner-headline');
  const sub = el('slim-banner-sub');
  const cta = el('slim-banner-cta');

  // slot by role: link-bearing paragraphs are CTAs, first text is the headline, the rest sub-lines
  texts.forEach((node) => {
    if (node.tagName === 'P' && node.querySelector('a[href]')) {
      cta.append(node);
    } else if (!headline.childElementCount) {
      headline.append(node);
    } else {
      sub.append(node);
    }
  });

  // CTA links authored without a wrapping <p> are not buttonised by scripts.js — do it here
  cta.querySelectorAll('a[href]').forEach((a) => {
    if (!a.classList.contains('button')) {
      a.classList.add('button', a.closest('strong') ? 'primary' : 'secondary');
    }
  });

  [headline, sub, cta].forEach((slot) => {
    if (slot.childElementCount) content.append(slot);
  });
  box.append(content);

  if (media) {
    const img = media.matches('img') ? media : media.querySelector('img');
    // only a banner near the top of the page is an LCP candidate; later instances stay lazy
    const section = block.closest('.section');
    const sections = section && section.parentElement
      ? [...section.parentElement.querySelectorAll(':scope > .section')] : [];
    const index = sections.indexOf(section);
    if (img && index >= 0 && index <= 1) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    const image = el('slim-banner-image');
    image.append(media);
    box.append(image);
  }

  block.replaceChildren(box);
}
