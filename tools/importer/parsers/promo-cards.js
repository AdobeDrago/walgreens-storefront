/* eslint-disable */
/* global WebImporter */
/**
 * Parser for promo-cards. Base: promo-cards (custom project block).
 * Source: https://main--sdt-walgreens--aemcoder.aem.live/ (existing EDS site).
 *
 * Input is the AUTHORED block markup (walgreens-cleanup swaps <main> for
 * {path}.plain.html), validated against migration-work/block-context/promo-cards/source.html:
 *   <div class="promo-cards [dark|inverse|taupe|plain gap-top]">
 *     <div>                                        <- row (one card)
 *       <div><picture>..</picture></div>           <- cell 1: image
 *       <div><h3><a>Title</a></h3><p>..</p></div>  <- cell 2: heading + copy (+ CTA)
 *     </div> ...
 *   </div>
 * Output: faithful pass-through — one table row per authored row, one cell per
 * authored cell, cell contents moved as-is. Extra classes become block options
 * (e.g. "Promo Cards (plain, gap-top)").
 * Generated: 2026-09-24
 */

function cellContent(cell) {
  const nodes = [...cell.childNodes].filter(
    (n) => n.nodeType !== 3 || n.textContent.trim() !== '',
  );
  return nodes.length ? nodes : '';
}

export default function parse(element, { document }) {
  const variants = [...element.classList].filter((c) => c !== 'promo-cards' && c !== 'block');

  const cells = [];
  [...element.children].forEach((row) => {
    const rowCells = [...row.children];
    if (!rowCells.length) {
      if (row.textContent.trim() || row.querySelector('img, picture')) cells.push([cellContent(row)]);
      return;
    }
    cells.push(rowCells.map(cellContent));
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'promo-cards', variants, cells });
  element.replaceWith(block);
}
