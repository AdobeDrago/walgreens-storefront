/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import quickLinksParser from './parsers/quick-links.js';
import slimBannerParser from './parsers/slim-banner.js';
import promoCardsParser from './parsers/promo-cards.js';
import couponRailParser from './parsers/coupon-rail.js';
import adSlotParser from './parsers/ad-slot.js';
import dealsRailParser from './parsers/deals-rail.js';
import featuredCategoriesParser from './parsers/featured-categories.js';

// TRANSFORMER IMPORTS
// walgreens-cleanup MUST run first: it swaps <main> for the authored {path}.plain.html markup.
import walgreensCleanupTransformer from './transformers/walgreens-cleanup.js';
import walgreensSectionsTransformer from './transformers/walgreens-sections.js';

// PARSER REGISTRY
const parsers = {
  'quick-links': quickLinksParser,
  'slim-banner': slimBannerParser,
  'promo-cards': promoCardsParser,
  'coupon-rail': couponRailParser,
  'ad-slot': adSlotParser,
  'deals-rail': dealsRailParser,
  'featured-categories': featuredCategoriesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Walgreens homepage. Source is an existing EDS site: selectors target the AUTHORED markup (from {path}.plain.html), which the walgreens-cleanup transformer swaps into <main> before parsing.',
  urls: [
    'https://main--sdt-walgreens--aemcoder.aem.live/',
  ],
  blocks: [
    { name: 'quick-links', instances: ['main > div > div.quick-links'] },
    { name: 'slim-banner', instances: ['main > div > div.slim-banner'] },
    { name: 'promo-cards', instances: ['main > div > div.promo-cards'] },
    { name: 'coupon-rail', instances: ['main > div > div.coupon-rail'] },
    { name: 'ad-slot', instances: ['main > div > div.ad-slot'] },
    { name: 'deals-rail', instances: ['main > div > div.deals-rail'] },
    { name: 'featured-categories', instances: ['main > div > div.featured-categories'] },
  ],
  sections: [
    { id: '1', name: 'quick-links', selector: ['main > div:has(> div.quick-links)'], style: null, blocks: ['quick-links'], defaultContent: [] },
    { id: '2', name: 'vaccine-banner', selector: ['main > div:has(> div.slim-banner.split)'], style: null, blocks: ['slim-banner'], defaultContent: [] },
    { id: '3', name: 'health-promos', selector: ['main > div:has(> div.promo-cards:not(.dark):not(.inverse):not(.taupe):not(.plain))'], style: null, blocks: ['promo-cards'], defaultContent: ['h1'] },
    { id: '4', name: 'beauty-savings', selector: ['main > div:has(> div.promo-cards.dark)'], style: null, blocks: ['promo-cards'], defaultContent: ['h2'] },
    { id: '5', name: 'beauty-deals-rail', selector: ['main > div:has(> div.coupon-rail.dark)'], style: null, blocks: ['coupon-rail'], defaultContent: ['h2', 'p'] },
    { id: '6', name: 'sponsored-ad', selector: ['main > div:has(> div.ad-slot:not(.criteo))'], style: null, blocks: ['ad-slot'], defaultContent: [] },
    { id: '7', name: 'fall-well-being', selector: ['main > div:has(> div.promo-cards.inverse)'], style: null, blocks: ['promo-cards'], defaultContent: ['h2'] },
    { id: '8', name: 'save-every-smile', selector: ['main > div:has(> div.promo-cards.taupe)'], style: null, blocks: ['promo-cards'], defaultContent: ['h2'] },
    { id: '9', name: 'halloween-banner', selector: ['main > div:has(> div.slim-banner.bleed)'], style: null, blocks: ['slim-banner'], defaultContent: [] },
    { id: '10', name: 'deals-of-the-week', selector: ['main > div:has(> div.deals-rail)'], style: null, blocks: ['deals-rail'], defaultContent: ['p', 'h2'] },
    { id: '11', name: 'offers-for-you', selector: ['main > div:has(> div.coupon-rail:not(.dark))'], style: null, blocks: ['coupon-rail'], defaultContent: ['h2', 'p'] },
    { id: '12', name: 'explore-more', selector: ['main > div:has(> div.promo-cards.plain)'], style: null, blocks: ['promo-cards'], defaultContent: ['h2'] },
    { id: '13', name: 'criteo-ad', selector: ['main > div:has(> div.ad-slot.criteo)'], style: null, blocks: ['ad-slot'], defaultContent: [] },
    { id: '14', name: 'featured-categories', selector: ['main > div:has(> div.featured-categories)'], style: null, blocks: ['featured-categories'], defaultContent: ['h2'] },
  ],
};

// TRANSFORMER REGISTRY (order matters: cleanup swaps in authored markup before sections run)
const transformers = [
  walgreensCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [walgreensSectionsTransformer] : []),
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

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (swap in authored markup, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (chrome removal, section metadata, break tidy-up)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root → /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
