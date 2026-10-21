import { test } from 'node:test';
import assert from 'node:assert/strict';
import parseAssets from '../src/assets.js';

const BASE = 'https://ns-stage.adobeio-static.net/';

test('reads the minified index.html `aio app deploy --web-optimize` deploys', () => {
  // as deployed to Stage: Parcel's HTML minifier drops attribute quotes
  const html = '<!DOCTYPE html><html lang=en><link rel=stylesheet href=/web-src.3714c105.css><meta charset=utf-8>'
    + '<meta name=viewport content="width=device-width, initial-scale=1"><title>Walgreens nav assets</title>'
    + '<script src=/web-src.9485b3f2.js defer></script><body>';
  assert.deepEqual(parseAssets(html, BASE), {
    css: [`${BASE}web-src.3714c105.css`],
    js: [{ src: `${BASE}web-src.9485b3f2.js`, module: false }],
  });
});

test('reads the unminified index.html a plain `aio app deploy` deploys', () => {
  const html = '<link rel="stylesheet" href="/index.9a350343.css"><script src="/index.354a6508.js" defer=""></script>';
  assert.deepEqual(parseAssets(html, BASE), {
    css: [`${BASE}index.9a350343.css`],
    js: [{ src: `${BASE}index.354a6508.js`, module: false }],
  });
});

test('keeps module scripts as modules and ignores inline scripts', () => {
  const html = "<script type='module' src='./client.js'></script><script>inline()</script><link rel=preload href=/x.js>";
  assert.deepEqual(parseAssets(html, BASE), {
    css: [],
    js: [{ src: `${BASE}client.js`, module: true }],
  });
});
