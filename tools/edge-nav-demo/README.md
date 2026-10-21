# Edge-stitched nav demo

## Overview

A prototype for developers. It shows the Walgreens site nav built as a server-rendered React app
and delivered **inside the first HTML response** of the Edge Delivery Services (EDS) page. The
browser gets the nav already rendered, instead of waiting for the `header` block to fetch `/nav` and
build it client-side.

The demo has two parts:

| Part | What | Where it runs | Status |
|------|------|---------------|--------|
| 1 | The nav as an app: React rendered on the server, hydrated in the browser | Adobe App Builder (I/O Runtime web action + static hosting) | **Done.** Live on Stage, deployed by CI. |
| 2 | Stitching: put the nav HTML into the page's `<header>` on the first request | AEM Edge Function on the Adobe-managed CDN in front of EDS | Not started |

The code for Part 1 is in [`nav-app/`](../../nav-app). Its [README](../../nav-app/README.md) is the
hands-on guide (setup, commands, CI secrets). This document records what was built, why, how it was
verified, and what Part 2 needs.

## Architecture

```
                        ┌──────────────────────── Adobe App Builder (Stage) ────────────────────────┐
 authors edit /nav      │                                                                           │
 in DA as today         │  I/O Runtime web action  nav-app/nav                                       │
        │               │    1. fetch  <EDS_ORIGIN>/nav.plain.html                                  │
        ▼               │    2. parse-nav.js  → JSON model                                          │
 EDS  /nav.plain.html ──┼──▶ 3. Nav.js (React) → renderToString                                    │
                        │    4. read hashed asset URLs from static hosting's index.html              │
                        │    5. return the HTML fragment                                             │
                        │                                                                           │
                        │  Static hosting (Adobe CDN)   web-src.<hash>.css  web-src.<hash>.js        │
                        └───────────────────────────────────────────────────────────────────────────┘

 fragment = <link rel="stylesheet" href="…/web-src.<hash>.css">
            <div id="wnav-root"> …server-rendered nav… </div>
            <script type="application/json" id="wnav-data"> …model… </script>
            <script src="…/web-src.<hash>.js" defer></script>

 browser: web-src.<hash>.js → hydrateRoot(#wnav-root, <Nav model/>), so the existing markup becomes interactive

 Part 2 (planned): AEM Edge Function on the managed CDN
   request for an EDS page → fetch the page from EDS + fetch the fragment (cached)
   → put the fragment into <header> → one HTML response
```

### Stage endpoints

| URL | Returns |
|-----|---------|
| `https://4191536-703coralcanid-stage.adobeio-static.net/api/v1/web/nav-app/nav` | The HTML fragment Part 2 will inject |
| `…/nav?format=page` | A standalone page with the nav, for viewing on its own |
| `…/nav?format=json` | The parsed nav model |

Responses are `Cache-Control: public, max-age=300, stale-while-revalidate=600` and send
`Access-Control-Allow-Origin: *`.

## Decisions

| Decision | Why |
|----------|-----|
| **Adobe-managed CDN + AEM Edge Functions for the stitching** (Part 2) | The demo should stay on the Adobe stack. Edge Functions are in beta and run on Fastly Compute under Adobe's CDN. For EDS sites, requests are routed to them with `cdn.yaml` rules and deployed through a Cloud Manager config pipeline plus `aio aem edge-functions deploy`. |
| **App Builder hosts the nav app** | It also keeps the app on Adobe. A Runtime web action does the server render, and the same project's static hosting serves the browser bundle. |
| **Plain React server rendering, not Next.js** | Runtime actions are short-lived OpenWhisk functions. Next.js expects its own long-running Node server, and there's no supported adapter. Bundling Next into an action would be fragile and add cold-start time and package-size problems that have nothing to do with what the demo proves. `renderToString` + `hydrateRoot` shows the same server-render-then-hydrate pattern. |
| **`htm` tagged templates instead of JSX** | The same component file runs in Node (the action and tests), webpack (aio's action bundle) and Parcel (aio's web bundle) with no transpile step, in keeping with the project's no-build approach. |
| **The nav reads the authored `/nav` document** | Authors keep editing `/nav` exactly as they do for the EDS `header` block. `parse-nav.js` uses the same slot order as `blocks/header/header.js`. |
| **Port the EDS `header` block, rather than re-scraping walgreens.com** | The block is already the project's port of walgreens.com. `Nav.js` renders the same DOM and classes, and `nav.css` is `header.css` scoped to `.wnav` with the brand tokens it needs, so the site and the app stay one design. |
| **Store and account render in both rows; CSS shows one** | The EDS block moves them between rows with JavaScript when the viewport changes. A server render can't know the viewport, so the app renders both and toggles them at the 768px breakpoint. |
| **The browser bundle loads as a classic `<script defer>`** | On the EDS page, the bundle comes from another origin, and App Builder static hosting sends no CORS headers. Module scripts need CORS and classic scripts don't. aio's Parcel build already emits a classic script, and the action copies whatever tag the deployed `index.html` has. |
| **Commerce drop-ins left out** | Search submits a plain `GET /search?q=`, the account panel shows the signed-out "Sign in" button, and the cart is a plain link. They aren't needed to prove the delivery pattern. |

## What's in `nav-app/`

| Path | Purpose |
|------|---------|
| `actions/nav/index.js` | The web action: fetch `/nav`, parse, render, attach assets, set cache headers |
| `src/parse-nav.js` | Authored nav document → JSON model |
| `src/Nav.js`, `src/icons.js` | The React nav, shared by server and browser, plus the header glyphs |
| `src/render.js` | Model → fragment or standalone page; the model is embedded as escaped JSON |
| `src/assets.js` | Reads stylesheet and script URLs from the deployed `index.html`, with or without attribute quotes |
| `web-src/` | Hydration entry (`client.js`), `nav.css`, and the `index.html` Parcel builds from |
| `scripts/dev.js` | Local preview at `localhost:3100` without an Adobe project; serves assets like static hosting does (classic script, no CORS) |
| `scripts/set-ci-secrets.js`, `scripts/ci-secrets-lib.js` | `npm run ci:secrets`: copies the linked workspace into the `stage` GitHub environment's secrets |
| `test/` | `node --test` suites for the parser, render output, markup contract, asset parsing and CI secrets mapping |

Outside `nav-app/`, only three things changed:
- `nav-app/` was added to `.hlxignore` and `.eslintignore`.
- `.claude/launch.json` gained a `nav-app-dev` entry.
- `.github/workflows/deploy-nav-app.yaml` was added.

## Deployment

**CI (normal path).** `.github/workflows/deploy-nav-app.yaml` runs on every push to `main` that
touches `nav-app/`, and on demand from the Actions tab. It runs:

1. `npm ci` and `npm test`
2. OAuth server-to-server sign-in with `adobe/aio-apps-action`
3. `NODE_ENV=production aio app deploy --web-optimize --no-publish`, from `nav-app/`
4. A smoke check that the deployed action returns the nav markup and its `<script>`

It deploys to the `stage` GitHub environment. Until that environment has its secrets, the job
skips with a notice instead of failing.

**By hand.** Run `npm run deploy` from a linked `nav-app/` folder. It's the same optimized build as
CI.

**One-time setup (done for Stage):**
1. Create an App Builder project in Developer Console.
2. Add **I/O Management API → OAuth Server-to-Server** to the Stage workspace.
3. Run `aio app use --merge`.
4. Run `npm run ci:secrets` (use `-- --check` to list what it found first).

The [nav-app README](../../nav-app/README.md#deploy-from-github-actions) has the details.

## Verification

| Check | Result |
|-------|--------|
| Markup parity with the EDS header | On the EDS dev server's home page, I measured the EDS header, swapped in the nav-app fragment and hydration script, and measured again. **1440px:** promo bar, top row, logo, search, store, account, cart, nav row and links had identical boxes, font size, weight and background, including with the Pharmacy, Shop (mega) and Account panels open. **375px:** all 18 checks were identical, covering the menu drawer, an open panel, the page-scroll lock and no horizontal scroll. |
| Hydration | The server markup is reused with no hydration-mismatch warnings. After hydration, one panel is open at a time, Escape closes the panel and returns focus to its button, an outside click closes it, and the mobile menu locks and releases page scroll. **Not verified:** the reset when the viewport crosses 768px. The test browser's viewport emulation fires no media-query `change` events. |
| Live Stage | Using only the URLs the live fragment returns, the stylesheet applies, the classic script loads cross-origin from `adobeio-static.net` with no CORS error, React hydrates, the Shop mega menu opens, and the console has no errors. |
| Bundle size | 234 KB minified production build (it was 1.17 MB with a plain `aio app deploy`) and about 10 KB of CSS |
| Tests | 10 passing (`npm test`) |
| CI | The deploy after #10 passed every step, including the smoke check |

## Gotchas found along the way

These shaped the code. Each is fixed, and most have a test or a CI check guarding it.

1. **`process` polyfill.** Parcel needs the `process` package to bundle React for the browser, and
   aio's Parcel run doesn't auto-install it. Fix: `process` is a devDependency.
2. **`engines.node` in `package.json`.** Parcel reads it as "build for Node" and left React out of
   the browser bundle as an external module. Fix: no `engines` field.
3. **aio emits a classic script, not a module.** The action originally looked only for
   `type="module"`, so the fragment shipped with no JS. Fix: copy whatever script tag `index.html`
   has. That turned out to be required anyway, since static hosting sends no CORS headers.
4. **A plain `aio app deploy` doesn't minify** and ships React's development build. Fix:
   `npm run deploy` and CI use `NODE_ENV=production … --web-optimize`.
5. **`--web-optimize` also minifies `index.html`** and drops attribute quotes
   (`<script src=/web-src.9485b3f2.js defer>`). The quote-only parser found neither asset, and the CI
   smoke check caught it. Fix: `src/assets.js` accepts quoted and unquoted values, with tests using
   the exact deployed HTML.
6. **`.env` keys containing `-`.** aio names the OAuth context after the credential
   (`AIO_ims_contexts_Credential__in__Walgreens__Nav__-__Stage_…`), and the secrets helper's parser
   skipped those keys. Fix: keys are read up to `=`, with a test.
7. **Files aio leaves behind.** The downloaded workspace JSON (it can hold credentials),
   `.aws.tmp.creds.json` and `web-src/src/config.json` are gitignored in `nav-app/.gitignore`.
8. **React attribute names.** htm passes attributes straight to React, so templates must use
   `className`. `class` renders, but React's development build warns about it.

## Known limitations

- **Fonts on the standalone page.** `?format=page` shows system fonts, because aem.page doesn't send
  CORS headers for fonts. Injected into the EDS page, the site's Inter and Source Sans Pro apply.
- **Commerce features** aren't wired: no product-discovery popover, no signed-in account state, no
  mini-cart or cart count.
- **Only Stage is deployed.** A Production workspace exists in the project but has no CI job yet.
- **Content is up to 5 minutes stale.** An author's change to `/nav` shows up once the action's
  cached response expires; the `stale-while-revalidate` window is another 10 minutes.

## Part 2 hand-off

What Part 1 already provides for the edge function:

- **A ready-to-inject fragment** at one stable URL. It's self-contained: stylesheet, markup, model
  and script in one response.
- **CORS on the action** (`Access-Control-Allow-Origin: *`) and a cacheable response
  (`max-age=300`).
- **A script that loads from another origin without CORS** (classic `defer`), so the stitched page
  needs no extra headers.
- **A smoke-checked deploy** on every merge, so the fragment URL stays healthy.

What Part 2 needs:

- **Access to a Cloud Manager program** with an EDS site on the Adobe-managed CDN, where
  `cdn.yaml` and the edge function are deployed. Check this before starting.
- **An `aem.cdn`-scoped credential** for the `aio aem edge-functions` commands.
- **Two design calls:**
  - which pages get the stitched nav;
  - what to do when the fragment fetch fails or is slow (fall back to the EDS `header` block's
    client-side render).
- **Coexisting with the EDS `header` block.** On stitched pages the block must not render a
  second nav. Either the edge function drops the block, or the block skips itself when
  `#wnav-root` is already present.

## References

- [AEM Edge Functions (Experience League)](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/edge-functions)
- [Set up AEM Edge Functions on Edge Delivery Services](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/edge-functions-setup/setup-eds)
- [Edge Function deployment strategy on EDS](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/edge-functions-deployment-strategy/deployment-strategy-eds)
- [Understanding Adobe I/O Runtime](https://developer.adobe.com/app-builder/docs/get_started/runtime_getting_started/understanding-runtime)
- [Minifying JS with `aio app deploy` (AdobeDocs issue)](https://github.com/AdobeDocs/app-builder/issues/90)
