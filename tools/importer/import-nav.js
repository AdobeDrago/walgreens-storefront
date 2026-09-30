/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
// walgreens-cleanup MUST run first: it swaps <main> for the authored /nav.plain.html markup.
import walgreensCleanupTransformer from './transformers/walgreens-cleanup.js';
import walgreensNavTransformer from './transformers/walgreens-nav.js';
import walgreensSectionsTransformer from './transformers/walgreens-sections.js';

// PAGE TEMPLATE CONFIGURATION — nav fragment: default content only, one section per authored div
const PAGE_TEMPLATE = {
  name: 'nav',
  description: 'Walgreens header nav fragment (source /nav.plain.html). Sections: promo links | logo | search | store | account | main nav | cart.',
  urls: [
    'https://main--sdt-walgreens--aemcoder.aem.live/nav',
  ],
  blocks: [],
  sections: [],
};

const transformers = [
  walgreensCleanupTransformer,
  walgreensNavTransformer,
  walgreensSectionsTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;

    // 1. beforeTransform (swap in authored nav, local logo + storefront routes, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. afterTransform (chrome removal, break tidy-up)
    executeTransformers('afterTransform', main, payload);

    // 3. No metadata block: the nav fragment must stay flat (no block tables).

    // 4. Path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: 'nav',
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
