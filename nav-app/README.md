# nav-app — server-rendered nav on App Builder

Ancillary demo for the Walgreens storefront: the site nav built as a React app, rendered on the
server by an Adobe App Builder (I/O Runtime) web action, then hydrated in the browser.

- **Part 1 (this folder):** the nav app, deployed to App Builder.
- **Part 2 (later):** an AEM Edge Function on the Adobe-managed CDN that calls this action and
  stitches its HTML into the EDS page's `<header>` on the first request.

This folder is not served by EDS (`.hlxignore`) and not linted by the storefront's ESLint.

## How it works

```
EDS  /nav.plain.html ──▶ actions/nav (Runtime web action)
                           parse-nav.js → model
                           Nav.js (React) → renderToString
                           ◀── fragment: <link css> + <div id="wnav-root">…</div>
                                         + <script id="wnav-data">model</script> + <script module>
browser: web-src/src/client.js (static hosting) → hydrateRoot(#wnav-root, <Nav model/>)
```

| Path | Purpose |
|------|---------|
| `src/parse-nav.js` | Reads the authored nav document into a JSON model. Same slot order as `blocks/header/header.js`, so authors keep editing `/nav` as today. |
| `src/Nav.js` | The React component, shared by server and browser. Uses `htm` instead of JSX, so there's no transpile step. |
| `src/render.js` | Model → HTML fragment (or a standalone page). |
| `actions/nav/index.js` | The web action. |
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
signed-in account state, mini-cart and cart badge). Search submits a plain `GET /search?q=`.

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
   aio app deploy
   ```
   The output prints the action URL,
   `https://<namespace>.adobeioruntime.net/api/v1/web/nav-app/nav`, and the static hosting URL,
   `https://<namespace>.adobeio-static.net/`.
6. Check it: open `<action URL>?format=page`, then click a nav item. It opens, which means
   hydration ran.

`aio app dev` also works once linked. Set `ASSET_BASE` to the local web server it prints, so the
fragment points at the local bundle.
