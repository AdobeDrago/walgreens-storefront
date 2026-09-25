/* eslint-disable */
/* global WebImporter */
/**
 * Parser for slim-banner. Base: slim-banner (custom project block).
 * Source: https://main--sdt-walgreens--aemcoder.aem.live/ (existing EDS site).
 *
 * Input is the AUTHORED block markup (walgreens-cleanup swaps <main> for
 * {path}.plain.html), validated against migration-work/block-context/slim-banner/source.html:
 *   <div class="slim-banner split|bleed">
 *     <div>                                        <- row
 *       <div><picture>..</picture></div>           <- cell 1: banner image
 *       <div><p>..</p><p><em|strong><a>CTA</a></em|strong></p></div>  <- cell 2: copy + CTA
 *     </div>
 *   </div>
 * Output: faithful pass-through — one table row per authored row, one cell per
 * authored cell, cell contents moved as-is (em/strong CTA wrappers preserved).
 * Extra classes (split, bleed) become block options.
 * Generated: 2026-09-24
 */

function cellContent(cell) {
  const nodes = [...cell.childNodes].filter(
    (n) => n.nodeType !== 3 || n.textContent.trim() !== '',
  );
  return nodes.length ? nodes : '';
}

export default function parse(element, { document }) {
  const variants = [...element.classList].filter((c) => c !== 'slim-banner' && c !== 'block');

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

  const block = WebImporter.Blocks.createBlock(document, { name: 'slim-banner', variants, cells });
  element.replaceWith(block);
}
