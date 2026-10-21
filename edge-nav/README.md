# edge-nav — AEM Edge Function that stitches the nav into EDS pages

Part 2 of the edge-stitched nav demo (overview: [`tools/edge-nav-demo/index.html`](../tools/edge-nav-demo/index.html)).
For each HTML page request, this function:

1. fetches the page from EDS,
2. fetches the server-rendered nav fragment from [`nav-app`](../nav-app) on App Builder,
3. inserts the fragment into the page's empty `<header>`,
4. returns one HTML response.

The browser gets the nav in the first response. The nav's script then makes it interactive
(hydration).

It runs on Fastly Compute under Adobe's managed CDN. The structure follows Adobe's
[`aem-edge-functions-boilerplate`](https://github.com/adobe/aem-edge-functions-boilerplate) and its
`edge-delivery-transformer` example. This folder is not served by EDS (`.hlxignore`) and not linted
by the storefront's ESLint.

## How it works

```
browser → Adobe CDN (custom domain; caches the assembled page)
            │  cdn.yaml: HTML page paths → origin edgefunction-edge-nav
            ▼
          edge-nav (Fastly Compute)
            ├─ GET <EDS_ORIGIN><path>   cache bypassed; EDS caches and purges its own pages
            ├─ GET <NAV_FRAGMENT_URL>   kept for the action's max-age (300s), 1.5 s timeout
            └─ stitch: fragment → <header>, page CSP nonce → fragment <script> tags
```

| Behaviour | Why |
|-----------|-----|
| **The page's CSP nonce is copied onto the fragment's `<script>` tags** | EDS sends `script-src 'nonce-…' 'strict-dynamic'` with a fresh nonce per response. Without the nonce, the browser blocks the nav's script and the nav never becomes interactive. |
| **A stitched page is CDN-cached for at most the fragment's max-age (300s)** | EDS asks for 2 days (`Surrogate-Control: max-age=172800`). A nav change doesn't purge pages, so without the cap it wouldn't show for up to 2 days. EDS `Surrogate-Key`s are passed through, so content purges still work. |
| **Fallback: the page goes out exactly as EDS sent it, CDN-cached for 60s** | This happens when the fragment fails, takes longer than `FRAGMENT_TIMEOUT_MS`, or the page has no `<header>`. The EDS `header` block then renders the nav client-side as usual, and the short cache means stitching is retried soon. |
| **Anything that isn't a `GET` 200 HTML response passes through unchanged** | Assets, 404s, redirects and `HEAD` requests aren't touched. `cdn.yaml` also only routes page paths here. |
| **`X-Edge-Nav` response header** | `stitched`, or `fallback-<reason>`, for debugging. |

The storefront's `scripts/scripts.js` skips `loadHeader` when `<header>` already contains
`#wnav-root`. That way the EDS `header` block doesn't render a second nav on stitched pages, and
it still renders on fallback pages and on `aem.page`/`aem.live`.

## Layout

| Path | Purpose |
|------|---------|
| `src/index.js` | Compute entry point: reads settings from the config store, logs one line per request |
| `src/edge-nav.js` | Fetches the page and the fragment, applies the fallback and cache rules |
| `src/stitch.js` | Pure string work with no Fastly imports, unit-tested in Node: insert into `<header>`, nonces, `max-age` |
| `config/edgeFunctions.yaml` | Declares the function `edge-nav` and its settings |
| `config/cdn.yaml` | Routes HTML page paths on the custom domain to `edgefunction-edge-nav` |
| `fastly.toml` | Compute package and local-server settings |
| `scripts/serve-local.js` | `npm run local`: build and serve in front of a local EDS dev server |
| `test/` | `node --test` suite for `stitch.js` |

## Settings

These are set in `config/edgeFunctions.yaml` (`configs`), and for local runs in `fastly.toml`:

| Key | Default |
|-----|---------|
| `EDS_ORIGIN` | `https://main--walgreens-storefront--adobedrago.aem.live` |
| `NAV_FRAGMENT_URL` | `https://4191536-703coralcanid-stage.adobeio-static.net/api/v1/web/nav-app/nav` |
| `FRAGMENT_TIMEOUT_MS` | `1500` |

## Run it locally

You need Node.js 22+ and the [Fastly CLI](https://www.fastly.com/documentation/reference/tools/cli/)
(`brew install fastly/tap/fastly`). No Adobe account is needed.

1. Start the EDS dev server from the repository root and keep it running:
   ```bash
   npx -y @adobe/aem-cli up --no-open        # http://localhost:3000
   ```
2. In a second terminal, from this folder:
   ```bash
   npm install
   npm run local                             # http://127.0.0.1:7676
   ```

`npm run local` compiles the function to `bin/main.wasm` and serves it in front of
`localhost:3000`. Every page then comes back with the nav already in `<header>`;
`curl -sI http://127.0.0.1:7676/ | grep -i x-edge-nav` prints `stitched`. It writes its settings
to `.local/` (gitignored) and leaves `fastly.toml` alone. Optional overrides:

| Variable | Default |
|----------|---------|
| `EDS_ORIGIN` | `http://localhost:3000` |
| `NAV_FRAGMENT_URL` | The Stage nav app. Use `http://localhost:3100/fragment` with nav-app's `npm run dev`. |
| `EDGE_PORT` | `7676` |

`npm test` runs the unit tests. Once `aio aem edge-functions setup` is done, `npm run serve` serves
through the aio plugin instead, using the settings in `fastly.toml`.

## Deploy

What you need first:

- A Cloud Manager program with the **Edge Delivery Services** add-on.
- This site onboarded in the program's **Edge Delivery** tab with its `aem.live` origin, a **custom
  domain**, an SSL certificate and DNS pointing at the Adobe-managed CDN. Adobe requires the custom
  domain even for testing.
- The **Deployment Manager** role in Cloud Manager.
- The aio plugin:
  ```bash
  aio plugins install @adobe/aio-cli-plugin-aem-edge-functions
  ```

Then:

1. **Set the domain.** In `config/cdn.yaml`, replace `www.example.com` with the custom domain.
2. **Link the function to the program.** From this folder, run `aio aem edge-functions setup`, pick
   Edge Delivery Services, then the program and site. It writes `.aio`, which is gitignored.
   `aio aem edge-functions info` shows the result.
3. **Deploy the CDN config.** In Cloud Manager, add this repository and create an **Edge Delivery
   pipeline** with config location `/edge-nav/config`. Run it; that registers the function and the
   route.
4. **Build and deploy the function:**
   ```bash
   aio aem edge-functions build
   npm run deploy            # aio aem edge-functions deploy edge-nav
   ```
5. **Verify** with `curl -sI https://<custom-domain>/ | grep -i x-edge-nav`, which should print
   `stitched`. `npm run logs` tails the function's `console.log`.

## Limits worth knowing

From Adobe's docs:
- At most 32 backend requests per invocation; this function makes 2.
- 128 MB heap.
- Average execution under 100 ms.
- Up to 3 edge functions per EDS program.
