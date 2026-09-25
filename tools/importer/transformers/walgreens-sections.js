/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: walgreens sections.
 *
 * Runs after walgreens-cleanup.js has swapped <main> for the authored
 * {path}.plain.html markup, where every top-level `main > div` is one section.
 * Section selectors from page-templates.json (e.g. "main > div:has(> div.promo-cards.dark)")
 * target that authored markup.
 *
 * beforeTransform: insert <hr> section breaks while section elements still exist
 *   (parsers replace blocks between hooks). Template sections are processed in
 *   reverse first; then any remaining top-level main > div that lacks a
 *   preceding break also gets one, so every authored section is preserved.
 * afterTransform: add Section Metadata for styled sections (all styles are
 *   null for "home", so none are emitted) and tidy stray/duplicate breaks.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

function getMain(element) {
  if (element.matches && element.matches('main')) return element;
  return element.querySelector('main') || element;
}

function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) { /* invalid selector in this engine - try next */ }
  }
  return null;
}

function isEmptySection(el) {
  return !el.textContent.trim() && !el.querySelector('img, picture, video, iframe, svg');
}

function prevIsBreak(el) {
  const prev = el.previousElementSibling;
  return prev && prev.tagName === 'HR';
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  const main = getMain(element);
  if (!main) return;

  if (hookName === 'beforeTransform') {
    // 1) Template-driven breaks (reverse order keeps later references stable).
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
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }

    // 2) Guarantee: every non-empty top-level main > div is its own section.
    const topDivs = [...main.children].filter((c) => c.tagName === 'DIV' && !isEmptySection(c));
    topDivs.forEach((div, idx) => {
      if (idx === 0) return;
      if (!prevIsBreak(div)) div.before(document.createElement('hr'));
    });
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);
      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (!marker.previousElementSibling) marker.remove();
      }
    }

    // Tidy: drop leading/trailing breaks and collapse consecutive breaks.
    const kids = [...main.children];
    kids.forEach((el) => {
      if (el.tagName !== 'HR') return;
      const prev = el.previousElementSibling;
      const next = el.nextElementSibling;
      if (!prev || !next || (prev && prev.tagName === 'HR')) el.remove();
    });
  }
}
