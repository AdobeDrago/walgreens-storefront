/* eslint-disable */
/* global WebImporter */
/**
 * Parser for featured-categories. Base: featured-categories (custom project block).
 * Source: https://main--sdt-walgreens--aemcoder.aem.live/ (existing EDS site).
 *
 * Input is the AUTHORED block markup (walgreens-cleanup swaps <main> for
 * {path}.plain.html), validated against migration-work/block-context/featured-categories/source.html:
 *   <div class="featured-categories">
 *     <div>                                       <- row (one category tile)
 *       <div><picture>..</picture></div>          <- cell 1: image
 *       <div><a href="..">Label</a></div>         <- cell 2: link
 *     </div> ...
 *     <div><div>See more</div><div>See less</div></div>  <- final toggle-labels row (text-only cells)
 *   </div>
 * Output: faithful pass-through — one table row per authored row, one cell per
 * authored cell, cell contents moved as-is. Extra classes become block options.
 * Generated: 2026-09-24
 */

function cellContent(cell) {
  const nodes = [...cell.childNodes].filter(
    (n) => n.nodeType !== 3 || n.textContent.trim() !== '',
  );
  return nodes.length ? nodes : '';
}

export default function parse(element, { document }) {
  const variants = [...element.classList].filter((c) => c !== 'featured-categories' && c !== 'block');

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

  const block = WebImporter.Blocks.createBlock(document, { name: 'featured-categories', variants, cells });
  element.replaceWith(block);
}
