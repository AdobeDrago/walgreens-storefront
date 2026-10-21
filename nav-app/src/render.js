/**
 * Turns a nav model into the HTML the edge function (Part 2) splices into the EDS page: the
 * server-rendered markup, the model as JSON for hydration, and the hydration bundle's assets.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import Nav from './Nav.js';

export const ROOT_ID = 'wnav-root';
export const DATA_ID = 'wnav-data';

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// JSON inside <script> must not be able to close the tag or break JS line parsing
const escapeJson = (model) => JSON.stringify(model)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

/**
 * @param {object} model output of parseNav
 * @param {{ css: string[], js: { src: string, module: boolean }[] }} assets the hydration bundle
 * @returns {string} HTML fragment
 */
export function renderFragment(model, assets = { css: [], js: [] }) {
  const markup = renderToString(React.createElement(Nav, { model }));
  return [
    ...assets.css.map((href) => `<link rel="stylesheet" href="${escapeAttr(href)}">`),
    `<div id="${ROOT_ID}">${markup}</div>`,
    `<script type="application/json" id="${DATA_ID}">${escapeJson(model)}</script>`,
    ...assets.js.map(({ src, module }) => (module
      ? `<script type="module" src="${escapeAttr(src)}"></script>`
      : `<script src="${escapeAttr(src)}" defer></script>`)),
  ].join('\n');
}

/** A standalone document around the fragment, for viewing the nav on its own. */
export function renderPage(model, assets) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Walgreens nav (SSR)</title>
<style>body { margin: 0; font-family: inter, system-ui, sans-serif; }</style>
</head>
<body>
<header>
${renderFragment(model, assets)}
</header>
</body>
</html>
`;
}
