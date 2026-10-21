# nav-app — server-rendered nav on App Builder

Ancillary demo for the Walgreens storefront: the site nav built as a React app, rendered on the
server by an Adobe App Builder (I/O Runtime) web action, then hydrated in the browser.

- **Part 1 (this folder):** the nav app, deployed to App Builder.
- **Part 2 (later):** an AEM Edge Function on the Adobe-managed CDN that calls this action and
  stitches its HTML into the EDS page's `<header>` on the first request.

This folder is not served by EDS (`.hlxignore`) and not linted by the storefront's ESLint.

For the demo's design decisions, verification results and the Part 2 hand-off, see
[`tools/edge-nav-demo/index.html`](../tools/edge-nav-demo/index.html), served at
https://main--walgreens-storefront--adobedrago.aem.page/tools/edge-nav-demo/index.html.

## How it works

```
EDS  /nav.plain.html ──▶ actions/nav (Runtime web action)
                           parse-nav.js → model
                           Nav.js (React) → renderToString
                           ◀── fragment: <link css> + <div id="wnav-root">…</div>
                                         + <script id="wnav-data">model</script> + <script defer>
browser: web-src/src/client.js (static hosting) → hydrateRoot(#wnav-root, <Nav model/>)
```

The content source is replaceable. `fetchModel` in `actions/nav/index.js` is the only code that
knows where the nav comes from. Point it at another source (a headless CMS, Content Fragments, a
commerce category tree) and map that into the same model (`?format=json` shows its shape). The
render, hydration, caching and edge function stay as they are.

| Path | Purpose |
|------|---------|
| `src/parse-nav.js` | Reads the authored nav document into a JSON model. Same slot order as `blocks/header/header.js`, so authors keep editing `/nav` as today. |
| `src/Nav.js` | The React component, shared by server and browser. It renders the same DOM and classes as the EDS header block (`blocks/header/header.js`), the project's port of walgreens.com. Uses `htm` instead of JSX, so there's no transpile step. |
| `src/icons.js` | The header's 32×32 glyphs, copied from `header.js`. |
| `src/render.js` | Model → HTML fragment (or a standalone page). |
| `actions/nav/index.js` | The web action. |
| `web-src/src/nav.css` | `blocks/header/header.css` scoped to `.wnav`, plus the brand tokens it uses. Commerce panel rules are removed. |
| `web-src/` | Hydration bundle (built by Parcel on deploy). The action reads its hashed asset URLs from the deployed `index.html`. |
| `scripts/dev.js` | Local preview without a workspace. |

Action responses:

| URL | Returns |
|-----|---------|
| `…/api/v1/web/nav-app/nav` | HTML fragment, the thing the edge function will inject |
| `…?format=page` | Standalone HTML page with the nav |
| `…?format=json` | The parsed model |

Responses are `Cache-Control: public, max-age=300, stale-while-revalidate=600`.

Out of scope for the prototype: the Commerce drop-ins the EDS header wires in (search popover,
signed-in account state, mini-cart and cart badge). Search submits a plain `GET /search?q=`, and the
account panel always shows the signed-out "Sign in" button.

Fonts come from the page. Injected into the EDS site, the nav uses its Inter and Source Sans Pro.
On its own (`?format=page`) it falls back to system fonts, because aem.page doesn't send CORS headers
for fonts.

The hydration script loads cross-origin on the EDS page. App Builder static hosting sends no CORS
headers, so it has to be a classic `<script defer>`, which is what aio's Parcel build emits. A module
script would be blocked. The action copies whatever script tag the deployed `index.html` has, and
`npm run dev` serves its assets the same way (classic script, no CORS).

## Local preview (no Adobe project needed)

```bash
npm install
npm test
npm run dev   # http://localhost:3100/  (/fragment, /json)
```

`EDS_ORIGIN=https://<branch>--walgreens-storefront--adobedrago.aem.page npm run dev` reads a
different branch's nav.

## Set up the App Builder project

1. In [Adobe Developer Console](https://developer.adobe.com/console), choose the org that has
   App Builder. Then go to **Create project from template → App Builder**. You get **Stage** and
   **Production** workspaces.
2. Install the CLI and sign in:
   ```bash
   npm install -g @adobe/aio-cli
   aio login
   ```
3. From this folder, link it to the Stage workspace. This writes `.env` and `.aio`, which are
   gitignored:
   ```bash
   aio app use   # pick org → project → Stage
   ```
   You can also download the workspace JSON from the Console and run `aio app use <file>.json`.
4. Add the nav inputs to `.env` (see `.env.example`):
   ```
   EDS_ORIGIN=https://main--walgreens-storefront--adobedrago.aem.page
   ```
5. Deploy:
   ```bash
   npm run deploy
   ```
   This runs `NODE_ENV=production aio app deploy --web-optimize`. A plain `aio app deploy` also
   works, but it ships React's unminified development build (about 1.2 MB instead of about 230 KB).
   The output prints the action URL,
   `https://<namespace>.adobeio-static.net/api/v1/web/nav-app/nav`, and the static hosting URL,
   `https://<namespace>.adobeio-static.net/`.
6. Check it: open `<action URL>?format=page`, then click a nav item. It opens, which means
   hydration ran.

`aio app dev` also works once linked. Set `ASSET_BASE` to the local web server it prints, so the
fragment points at the local bundle.

## Deploy from GitHub Actions

`.github/workflows/deploy-nav-app.yaml` deploys `nav-app/` to the **Stage** workspace on every push
to `main` that touches `nav-app/`. You can also run it by hand from the Actions tab (**Deploy
nav-app (Stage)** → **Run workflow**). It runs the tests, then the same optimized build as
`npm run deploy`, then checks that the deployed action returns the nav with its script.

One-time setup:

1. **Add a CI credential to the Stage workspace.** In Developer Console, open the project, then the
   **Stage** workspace. Choose **Add service → API → I/O Management API → OAuth Server-to-Server**
   and save.
2. **Refresh the local link** so `.env` picks up that credential. From `nav-app/`:
   ```bash
   aio app use --merge   # pick the same org → project → Stage
   ```
3. **Copy the workspace into GitHub secrets.** This creates the `stage` GitHub environment and sets
   its secrets. It needs `gh auth login` with admin rights on the repo, and it never prints the
   values:
   ```bash
   npm run ci:secrets -- --check   # lists what was found, sets nothing
   npm run ci:secrets
   ```
   It sets `AIO_RUNTIME_NAMESPACE`, `AIO_RUNTIME_AUTH`, the `AIO_PROJECT_*` values and the OAuth
   values (`CLIENTID`, `CLIENTSECRET`, `TECHNICALACCID`, `TECHNICALACCEMAIL`, `IMSORGID`,
   `SCOPES`).
4. **Optional:** to read the nav from a different site, set an `EDS_ORIGIN` variable on the `stage`
   environment. The default is the `main` aem.page site.
