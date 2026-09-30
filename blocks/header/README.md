# Header Block

## Overview

The Header block renders the Walgreens site chrome (ported from the source EDS header) with the Adobe Commerce storefront wired in:

- **Promo bar** (40px, neutral) — authored promo links.
- **Top row** (73px) — logo, pill search (product-discovery live results popover), store text with a pin, Account dropdown (authored links + storefront auth state), cart icon (mini-cart panel + item-count badge).
- **Nav row** (40px) — click-to-open dropdown panels (1 column, or 2 columns when a panel has 20+ items), direct links, last item right-aligned.
- **Mobile (<768px)** — hamburger menu panel (accordion dropdowns); store + account move to a second 43px row.

Total height: 153px at >=768px, 156px below (`--nav-height` in `styles/styles.css`).

## Nav document

The nav is fetched independently of page metadata: `/content/nav.plain.html` first (local import tree), falling back to `/nav.plain.html`. Relative image sources are resolved against the fetched document's directory. Sections, in order:

1. promo — `<ul>` of links
2. brand — `<p><a><img></a></p>`
3. search — `<p><a href>label</a></p>`; the label becomes the input placeholder / accessible name
4. store — `<p>text</p>` (optional, recognised by shape: no link, list or image)
5. account — `<p>trigger label</p>` + `<ul>` of links
6. nav — `<ul>`: `<li>label<ul>…</ul></li>` = dropdown, `<li><a/></li>` = direct link. Inside a panel a plain `<li>` is the panel title (mobile only) and `<li>group<ul>…</ul></li>` is a link group
7. cart — `<p><a href>label</a></p>`; the href is the no-JS fallback, the label is visually hidden

Items wrapped in `<p>` by live delivery are unwrapped.

## Integration

### Events

- `events.on('cart/data')` (eager) — updates the cart badge (`data-count` on the cart link) and preloads the mini-cart fragment when a cart exists.
- `events.on('authenticated')` (eager) — switches the Account panel between signed-out (a primary "Sign in" pill built from the authored `/customer/login` link, which it replaces in the list) and signed-in (greeting + Sign out; the pill and the `/customer/create` item hidden).
- Opening the mini-cart publishes `publishShoppingCartViewEvent()`.

### Metadata

- `mini-cart` — path to the mini-cart fragment (default `/mini-cart`). The nav path is not metadata-driven.

### Placeholders (optional)

- `Global.SearchViewAll` — "View all" button in the search popover.
- `Global.HeaderGreeting` (default `Hi,`) and `Global.HeaderSignOut` (default `Sign out`) — signed-in account panel.

## Behavior

- Dropdowns (nav items, Account, cart) open on click only; opening one closes the others. Escape closes and returns focus to the trigger; outside click or tabbing out of the header closes. No page overlay.
- Triggers are `<button aria-expanded aria-controls>` (the cart keeps its `<a href="/cart">`).
- Search: the product-discovery drop-in loads on first focus; typing 3+ characters shows up to 4 results in a popover directly under the pill (same width); submit navigates to `/search?q=…`. The focus ring is drawn on the pill form.
- Account: Sign out lazily imports `renderAuthDropdown.js`, revokes the token, then redirects (checkout → cart, customer pages → login, order details → home) or reloads.
- Mini-cart: lazily loaded into a 398px panel right-aligned under the cart icon (same top offset as the Account panel), drop-in buttons restyled as Walgreens pills; hidden on `/checkout`.

## Files

- `header.js` — nav fetch, DOM building, dropdown state, search / mini-cart / auth wiring
- `header.css` — Walgreens chrome styles (mobile first, desktop at 768px for source parity) and storefront panel styles
- `renderAuthDropdown.js` — storefront sign-out (lazy-loaded)
