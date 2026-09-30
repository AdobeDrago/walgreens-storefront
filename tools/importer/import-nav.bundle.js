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

  // tools/importer/import-nav.js
  var import_nav_exports = {};
  __export(import_nav_exports, {
    default: () => import_nav_default
  });

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

  // tools/importer/transformers/walgreens-nav.js
  var LOGO_SRC = "images/walgreens-logo.svg";
  var STOREFRONT_ROUTES = {
    "Sign in": "/customer/login",
    "Create an account": "/customer/create",
    "Your Account": "/customer/account",
    "Order Status & History": "/customer/orders",
    Search: "/search",
    "View shopping cart": "/cart"
  };
  function getMain2(element) {
    if (element.matches && element.matches("main")) return element;
    return element.querySelector("main") || element;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const main = getMain2(element);
    const logo = main.querySelector(":scope > div img");
    if (logo) {
      logo.setAttribute("src", LOGO_SRC);
      logo.removeAttribute("width");
      logo.removeAttribute("height");
    }
    main.querySelectorAll("a[href]").forEach((a) => {
      const route = STOREFRONT_ROUTES[a.textContent.trim()];
      if (route && !a.closest("li li")) a.setAttribute("href", route);
    });
  }

  // tools/importer/transformers/walgreens-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function getMain3(element) {
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
  function transform3(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const main = getMain3(element);
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

  // tools/importer/import-nav.js
  var PAGE_TEMPLATE = {
    name: "nav",
    description: "Walgreens header nav fragment (source /nav.plain.html). Sections: promo links | logo | search | store | account | main nav | cart.",
    urls: [
      "https://main--sdt-walgreens--aemcoder.aem.live/nav"
    ],
    blocks: [],
    sections: []
  };
  var transformers = [
    transform,
    transform2,
    transform3
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
  var import_nav_default = {
    transform: (payload) => {
      const { document: document2, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: "nav",
          template: PAGE_TEMPLATE.name,
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_nav_exports);
})();
