import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import parseNav from '../src/parse-nav.js';
import { renderFragment, ROOT_ID, DATA_ID } from '../src/render.js';

const BASE = 'https://main--walgreens-storefront--adobedrago.aem.page/nav.plain.html';
const model = parseNav(readFileSync(new URL('nav.fixture.html', import.meta.url), 'utf8'), BASE);

test('parses every slot of the authored nav document', () => {
  assert.equal(model.promo.length, 3);
  assert.match(model.brand.src, /^https:\/\/main--walgreens-storefront--adobedrago\.aem\.page\/media_/);
  assert.deepEqual(model.search, { label: 'Search', action: '/search' });
  assert.equal(model.store, '151 N State St, Chicago, IL');
  assert.equal(model.account.label, 'Account');
  assert.equal(model.account.links[0].href, '/customer/login');
  assert.deepEqual(model.cart, { label: 'View shopping cart', href: '/cart' });
});

test('nav items keep panels, groups and direct links', () => {
  const pharmacy = model.nav.find((n) => n.label === 'Pharmacy');
  const group = pharmacy.children.find((c) => c.label === 'Prescriptions');
  assert.ok(group.children.some((c) => c.label === 'Refills' && c.href));
  const weeklyAd = model.nav.find((n) => n.label === 'Weekly Ad');
  assert.equal(weeklyAd.href, '/offers/offers-jsp/weeklyad');
  assert.equal(weeklyAd.children, undefined);
  assert.equal(model.nav.find((n) => n.label === 'Shop').children.length >= 20, true);
});

test('fragment carries markup, escaped model and assets', () => {
  const html = renderFragment(model, { css: ['https://a/x.css'], js: ['https://a/x.js'] });
  assert.match(html, new RegExp(`<div id="${ROOT_ID}"><div class="wnav"`));
  assert.match(html, /<link rel="stylesheet" href="https:\/\/a\/x.css">/);
  assert.match(html, /<script type="module" src="https:\/\/a\/x.js"><\/script>/);
  const json = html.match(new RegExp(`<script type="application/json" id="${DATA_ID}">(.*?)</script>`, 's'))[1];
  assert.doesNotMatch(json, /</);
  assert.deepEqual(JSON.parse(json), model);
  // panels are closed in the server render
  assert.doesNotMatch(html, /aria-expanded="true"/);
});
