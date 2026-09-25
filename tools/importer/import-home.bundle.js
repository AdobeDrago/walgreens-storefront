/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/quick-links.js
  function cellContent(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "quick-links" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "quick-links", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/slim-banner.js
  function cellContent2(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse2(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "slim-banner" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent2(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent2));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "slim-banner", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/promo-cards.js
  function cellContent3(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse3(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "promo-cards" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent3(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent3));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "promo-cards", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/coupon-rail.js
  function cellContent4(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse4(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "coupon-rail" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent4(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent4));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "coupon-rail", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ad-slot.js
  function cellContent5(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse5(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "ad-slot" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent5(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent5));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "ad-slot", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/deals-rail.js
  function cellContent6(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse6(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "deals-rail" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent6(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent6));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "deals-rail", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/featured-categories.js
  function cellContent7(cell) {
    const nodes = [...cell.childNodes].filter(
      (n) => n.nodeType !== 3 || n.textContent.trim() !== ""
    );
    return nodes.length ? nodes : "";
  }
  function parse7(element, { document: document2 }) {
    const variants = [...element.classList].filter((c) => c !== "featured-categories" && c !== "block");
    const cells = [];
    [...element.children].forEach((row) => {
      const rowCells = [...row.children];
      if (!rowCells.length) {
        if (row.textContent.trim() || row.querySelector("img, picture")) cells.push([cellContent7(row)]);
        return;
      }
      cells.push(rowCells.map(cellContent7));
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "featured-categories", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/walgreens-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SWAPPED_ATTR = "data-excat-plain-swapped";
  function getMain(element) {
    if (element.matches && element.matches("main")) return element;
    return element.querySelector("main");
  }
  function getPageUrl(payload) {
    const candidates = [
      payload && payload.params && payload.params.originalURL,
      payload && payload.url,
      typeof window !== "undefined" && window.location && window.location.href,
      typeof document !== "undefined" && document.location && document.location.href
    ];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const u = new URL(c);
        if (u.protocol === "http:" || u.protocol === "https:") return u;
      } catch (e) {
      }
    }
    return null;
  }
  function fetchPlainHtml(pageUrl) {
    const { pathname } = pageUrl;
    const plainPath = pathname === "/" || pathname.endsWith("/") ? `${pathname}index.plain.html` : `${pathname}.plain.html`;
    const sameOrigin = typeof window !== "undefined" && window.location && window.location.origin === pageUrl.origin;
    const url = sameOrigin ? plainPath : `${pageUrl.origin}${plainPath}`;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if (xhr.status === 200 && xhr.responseText && xhr.responseText.trim()) {
        return xhr.responseText;
      }
      console.warn(`[walgreens-cleanup] ${url} returned status ${xhr.status}; keeping rendered DOM`);
    } catch (e) {
      console.warn(`[walgreens-cleanup] failed to fetch ${url}: ${e.message}; keeping rendered DOM`);
    }
    return null;
  }
  function toAbsolute(value, base) {
    if (!value) return value;
    if (!(value.startsWith("./") || value.startsWith("/") || value.startsWith("../"))) return value;
    if (value.startsWith("//")) return value;
    try {
      return new URL(value, base).href;
    } catch (e) {
      return value;
    }
  }
  function upgradeRendition(src) {
    try {
      const u = new URL(src);
      if (/\/media_[0-9a-f]+\./.test(u.pathname) && u.searchParams.has("width")) {
        u.searchParams.set("width", "2000");
      }
      return u.href;
    } catch (e) {
      return src;
    }
  }
  function normalizeMedia(main, pageUrl) {
    const base = pageUrl.href;
    main.querySelectorAll("picture source").forEach((s) => s.remove());
    main.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src) img.setAttribute("src", upgradeRendition(toAbsolute(src, base)));
      const srcset = img.getAttribute("srcset");
      if (srcset) img.removeAttribute("srcset");
      img.removeAttribute("loading");
    });
    main.querySelectorAll("source[src], source[srcset]").forEach((s) => {
      if (s.hasAttribute("src")) s.setAttribute("src", toAbsolute(s.getAttribute("src"), base));
      if (s.hasAttribute("srcset")) {
        const abs = s.getAttribute("srcset").split(",").map((part) => {
          const [u, ...rest] = part.trim().split(/\s+/);
          return [toAbsolute(u, base), ...rest].join(" ");
        }).join(", ");
        s.setAttribute("srcset", abs);
      }
    });
  }
  function removeEmptySections(main) {
    [...main.children].forEach((child) => {
      if (child.tagName !== "DIV") return;
      const hasMedia = child.querySelector("img, picture, video, iframe, svg");
      if (!child.textContent.trim() && !hasMedia) child.remove();
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const main = getMain(element);
      if (!main) return;
      if (!main.hasAttribute(SWAPPED_ATTR)) {
        const pageUrl = getPageUrl(payload);
        const html = pageUrl ? fetchPlainHtml(pageUrl) : null;
        if (html) {
          main.innerHTML = html;
          main.setAttribute(SWAPPED_ATTR, "true");
          normalizeMedia(main, pageUrl);
        } else if (!pageUrl) {
          console.warn("[walgreens-cleanup] could not determine page URL; keeping rendered DOM");
        }
      }
      removeEmptySections(main);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header-wrapper",
        "footer.footer-wrapper",
        "nav#hdr-nav",
        "header",
        "footer",
        "noscript",
        "link",
        "script",
        "style"
      ]);
      const main = getMain(element);
      if (main) main.removeAttribute(SWAPPED_ATTR);
    }
  }

  // tools/importer/transformers/walgreens-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function getMain2(element) {
    if (element.matches && element.matches("main")) return element;
    return element.querySelector("main") || element;
  }
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function isEmptySection(el) {
    return !el.textContent.trim() && !el.querySelector("img, picture, video, iframe, svg");
  }
  function prevIsBreak(el) {
    const prev = el.previousElementSibling;
    return prev && prev.tagName === "HR";
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const main = getMain2(element);
    if (!main) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const isFirst = !sectionEl.previousElementSibling;
        if (isFirst && !section.style) continue;
        if (prevIsBreak(sectionEl)) {
          if (section.style) sectionEl.previousElementSibling.setAttribute(SECTION_MARKER_ATTR, section.id);
          continue;
        }
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
      const topDivs = [...main.children].filter((c) => c.tagName === "DIV" && !isEmptySection(c));
      topDivs.forEach((div, idx) => {
        if (idx === 0) return;
        if (!prevIsBreak(div)) div.before(document.createElement("hr"));
      });
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (!marker.previousElementSibling) marker.remove();
        }
      }
      const kids = [...main.children];
      kids.forEach((el) => {
        if (el.tagName !== "HR") return;
        const prev = el.previousElementSibling;
        const next = el.nextElementSibling;
        if (!prev || !next || prev && prev.tagName === "HR") el.remove();
      });
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "quick-links": parse,
    "slim-banner": parse2,
    "promo-cards": parse3,
    "coupon-rail": parse4,
    "ad-slot": parse5,
    "deals-rail": parse6,
    "featured-categories": parse7
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Walgreens homepage. Source is an existing EDS site: selectors target the AUTHORED markup (from {path}.plain.html), which the walgreens-cleanup transformer swaps into <main> before parsing.",
    urls: [
      "https://main--sdt-walgreens--aemcoder.aem.live/"
    ],
    blocks: [
      { name: "quick-links", instances: ["main > div > div.quick-links"] },
      { name: "slim-banner", instances: ["main > div > div.slim-banner"] },
      { name: "promo-cards", instances: ["main > div > div.promo-cards"] },
      { name: "coupon-rail", instances: ["main > div > div.coupon-rail"] },
      { name: "ad-slot", instances: ["main > div > div.ad-slot"] },
      { name: "deals-rail", instances: ["main > div > div.deals-rail"] },
      { name: "featured-categories", instances: ["main > div > div.featured-categories"] }
    ],
    sections: [
      { id: "1", name: "quick-links", selector: ["main > div:has(> div.quick-links)"], style: null, blocks: ["quick-links"], defaultContent: [] },
      { id: "2", name: "vaccine-banner", selector: ["main > div:has(> div.slim-banner.split)"], style: null, blocks: ["slim-banner"], defaultContent: [] },
      { id: "3", name: "health-promos", selector: ["main > div:has(> div.promo-cards:not(.dark):not(.inverse):not(.taupe):not(.plain))"], style: null, blocks: ["promo-cards"], defaultContent: ["h1"] },
      { id: "4", name: "beauty-savings", selector: ["main > div:has(> div.promo-cards.dark)"], style: null, blocks: ["promo-cards"], defaultContent: ["h2"] },
      { id: "5", name: "beauty-deals-rail", selector: ["main > div:has(> div.coupon-rail.dark)"], style: null, blocks: ["coupon-rail"], defaultContent: ["h2", "p"] },
      { id: "6", name: "sponsored-ad", selector: ["main > div:has(> div.ad-slot:not(.criteo))"], style: null, blocks: ["ad-slot"], defaultContent: [] },
      { id: "7", name: "fall-well-being", selector: ["main > div:has(> div.promo-cards.inverse)"], style: null, blocks: ["promo-cards"], defaultContent: ["h2"] },
      { id: "8", name: "save-every-smile", selector: ["main > div:has(> div.promo-cards.taupe)"], style: null, blocks: ["promo-cards"], defaultContent: ["h2"] },
      { id: "9", name: "halloween-banner", selector: ["main > div:has(> div.slim-banner.bleed)"], style: null, blocks: ["slim-banner"], defaultContent: [] },
      { id: "10", name: "deals-of-the-week", selector: ["main > div:has(> div.deals-rail)"], style: null, blocks: ["deals-rail"], defaultContent: ["p", "h2"] },
      { id: "11", name: "offers-for-you", selector: ["main > div:has(> div.coupon-rail:not(.dark))"], style: null, blocks: ["coupon-rail"], defaultContent: ["h2", "p"] },
      { id: "12", name: "explore-more", selector: ["main > div:has(> div.promo-cards.plain)"], style: null, blocks: ["promo-cards"], defaultContent: ["h2"] },
      { id: "13", name: "criteo-ad", selector: ["main > div:has(> div.ad-slot.criteo)"], style: null, blocks: ["ad-slot"], defaultContent: [] },
      { id: "14", name: "featured-categories", selector: ["main > div:has(> div.featured-categories)"], style: null, blocks: ["featured-categories"], defaultContent: ["h2"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
