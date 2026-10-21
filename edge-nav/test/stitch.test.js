import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stitch, addNonce, nonceFromCsp, nonceFromHtml, maxAge,
} from '../src/stitch.js';

// the shape nav-app returns (minified asset names as deployed to Stage)
const FRAGMENT = [
  '<link rel="stylesheet" href="https://ns.adobeio-static.net/web-src.3714c105.css">',
  '<div id="wnav-root"><div class="wnav">…</div></div>',
  '<script type="application/json" id="wnav-data">{"promo":[]}</script>',
  '<script src="https://ns.adobeio-static.net/web-src.9485b3f2.js" defer></script>',
].join('\n');

const PAGE = '<html><head><script nonce="abc123" src="/scripts/aem.js" type="module"></script></head>'
  + '<body><header></header><main><div>content</div></main><footer></footer></body></html>';

test('puts the fragment inside the empty <header>', () => {
  const { html, stitched } = stitch(PAGE, FRAGMENT, { nonce: 'abc123' });
  assert.equal(stitched, true);
  assert.match(html, /<header><link rel="stylesheet"[^>]*>\n<div id="wnav-root">/);
  assert.match(html, /<\/script><\/header><main>/);
  // the rest of the page is untouched
  assert.equal(html.replace(/<header>[\s\S]*<\/header>/, '<header></header>'), PAGE);
});

test("gives the fragment's scripts the page nonce, so 'strict-dynamic' CSP allows them", () => {
  const { html } = stitch(PAGE, FRAGMENT, { nonce: 'abc123' });
  assert.match(html, /<script nonce="abc123" src="https:\/\/ns\.adobeio-static\.net\/web-src\.9485b3f2\.js" defer>/);
  assert.match(html, /<script nonce="abc123" type="application\/json" id="wnav-data">/);
});

test('keeps attributes on <header> and leaves existing nonces alone', () => {
  const { html } = stitch('<header class="x"></header>', FRAGMENT.replace('<script src', '<script nonce="other" src'), { nonce: 'n' });
  assert.match(html, /^<header class="x"><link/);
  assert.match(html, /<script nonce="other" src=/);
  assert.equal(addNonce('<script>', null), '<script>');
});

test('falls back to the page as sent when it cannot stitch', () => {
  assert.deepEqual(stitch(PAGE, null), { html: PAGE, stitched: false, reason: 'no-fragment' });
  assert.deepEqual(stitch(PAGE, '{"error":"nav unavailable"}'), { html: PAGE, stitched: false, reason: 'no-fragment' });
  assert.equal(stitch('<main></main>', FRAGMENT).reason, 'no-header');
  // the CDN may hand back an already-assembled page; never stitch twice
  const once = stitch(PAGE, FRAGMENT).html;
  assert.equal(stitch(once, FRAGMENT).reason, 'already-stitched');
});

test('reads the nonce from the CSP header, or from the page scripts', () => {
  assert.equal(nonceFromCsp("script-src 'nonce-3a/tk46WAZnhLv+yu0Xvx5T6' 'strict-dynamic' 'unsafe-inline' http: https:; base-uri 'self'"), '3a/tk46WAZnhLv+yu0Xvx5T6');
  assert.equal(nonceFromCsp(null), null);
  assert.equal(nonceFromHtml(PAGE), 'abc123');
  assert.equal(nonceFromHtml('<script src="/x.js"></script>'), null);
});

test('reads max-age from Cache-Control and Surrogate-Control values', () => {
  assert.equal(maxAge('public, max-age=300, stale-while-revalidate=600'), 300);
  assert.equal(maxAge('max-age=172800, stale-while-revalidate=0'), 172800);
  assert.equal(maxAge('s-maxage=60'), null);
  assert.equal(maxAge(null), null);
});
