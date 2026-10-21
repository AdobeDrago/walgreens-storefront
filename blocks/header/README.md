# Header Block

## Overview

The site nav is not built by this block. It comes from **nav-app**: the Walgreens nav as a
server-rendered React app on Adobe App Builder (`nav-app/`), part of the edge-stitched nav demo
(`tools/edge-nav-demo/index.html`).

- **Through the edge-nav edge function** (`edge-nav/`), the nav is already inside `<header>` in
  the first HTML response. `scripts/scripts.js` sees `#wnav-root` and doesn't load this block.
- **Everywhere else** (aem.page and aem.live without the edge function, or an edge-nav fallback),
  this block fetches the same nav-app fragment in the browser and appends it to `<header>`. React
  then makes it interactive.

The block never renders an EDS-built nav. If the nav-app URL fails, the header stays empty and the
error is logged. The EDS-built Walgreens header that used to live here, with Commerce search,
account and mini-cart, is in git history at `ae32f6d`.

## Nav document

Authors still edit `/nav` as before. nav-app reads `/nav.plain.html` on the server
(`nav-app/src/parse-nav.js`, same section order as before: promo, brand, search, store, account,
nav, cart).

## Integration

- **Fragment URL:** `NAV_APP_URL` in `header.js` (the App Builder Stage action
  `…/api/v1/web/nav-app/nav`).
- **The fragment** brings its own stylesheet, markup (`#wnav-root`), model (`#wnav-data`) and
  hydration script from App Builder static hosting. Its `<script>` is re-created after insertion so
  it runs; scripts created by a nonce'd script are allowed by the page's `'strict-dynamic'` CSP.
- **Not wired:** the Commerce drop-ins (product-discovery search popover, signed-in account state,
  mini-cart, cart count). Search submits `GET /search?q=`.

### Metadata

None.

## Behavior

Dropdowns, mobile menu, Escape and outside-click handling are provided by nav-app's React
component (`nav-app/src/Nav.js`), not by this block.

## Files

- `header.js` — removes the block element and, unless the nav is already present, fetches and
  appends the nav-app fragment
- `header.css` — keeps the block element out of the layout until it is removed
