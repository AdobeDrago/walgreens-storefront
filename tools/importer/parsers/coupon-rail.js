/* eslint-disable */
/* global WebImporter */
/**
 * Parser for coupon-rail. Base: coupon-rail (custom project block).
 * Source: https://main--sdt-walgreens--aemcoder.aem.live/ (existing EDS site).
 *
 * Input is the AUTHORED block markup (walgreens-cleanup swaps <main> for
 * {path}.plain.html), validated against migration-work/block-context/coupon-rail/source.html:
 *   <div class="coupon-rail [dark]">
 *     <div>                                               <- row (one coupon)
 *       <div><picture>..</picture></div>                  <- cell 1: product image
 *       <div><p><strong>Expires..</strong></p><p>..</p></div>  <- cell 2: offer copy
 *       <div><em><a href="..">Clip</a></em></div>         <- cell 3: CTA
 *     </div> ...
 *   </div>
 * Output: faithful pass-through — one table row per authored row, one cell per
 * authored cell (3-cell rows kept), cell contents moved as-is. Extra classes
 * become block options.
 * Generated: 2026-09-24
 */

function cellContent(cell) {
  const nodes = [...cell.childNodes].filter(
    (n) => n.nodeType !== 3 || n.textContent.trim() !== '',
  );
  return nodes.length ? nodes : '';
}

export default function parse(element, { document }) {
  const variants = [...element.classList].filter((c) => c !== 'coupon-rail' && c !== 'block');

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

  const block = WebImporter.Blocks.createBlock(document, { name: 'coupon-rail', variants, cells });
  element.replaceWith(block);
}
