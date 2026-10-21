/**
 * Local preview without an App Builder workspace: runs the nav action in-process and serves the
 * hydration bundle (built with esbuild instead of Parcel) from /assets/, including an index.html
 * so the action discovers the asset URLs exactly as it does against static hosting.
 *
 *   npm run dev  →  http://localhost:3100/  (page)   /fragment   /json
 */
import http from 'node:http';
import * as esbuild from 'esbuild';
import { main } from '../actions/nav/index.js';

const PORT = Number(process.env.PORT) || 3100;
const ASSET_BASE = `http://localhost:${PORT}/assets/`;

const build = await esbuild.build({
  entryPoints: { client: 'web-src/src/client.js' },
  bundle: true,
  format: 'esm',
  minify: true,
  write: false,
  outdir: 'dist/dev',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const files = Object.fromEntries(build.outputFiles.map((f) => [f.path.split('/').pop(), f.text]));
files['index.html'] = '<link rel="stylesheet" href="client.css"><script type="module" src="client.js"></script>';

const TYPES = { js: 'text/javascript', css: 'text/css', html: 'text/html' };

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, ASSET_BASE);
  if (pathname.startsWith('/assets/')) {
    const name = pathname.slice('/assets/'.length);
    if (!files[name]) { res.writeHead(404).end(); return; }
    // module scripts loaded cross-origin (from the EDS page) need CORS
    res.writeHead(200, {
      'Content-Type': TYPES[name.split('.').pop()], 'Access-Control-Allow-Origin': '*',
    }).end(files[name]);
    return;
  }
  const format = { '/': 'page', '/fragment': 'fragment', '/json': 'json' }[pathname];
  if (!format) { res.writeHead(404).end(); return; }
  const out = await main({ format, ASSET_BASE, EDS_ORIGIN: process.env.EDS_ORIGIN });
  const body = typeof out.body === 'string' ? out.body : JSON.stringify(out.body, null, 2);
  // web actions answer with CORS open; mirror it so the EDS dev server (:3000) can fetch the fragment
  res.writeHead(out.statusCode, {
    'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...out.headers,
  }).end(body);
}).listen(PORT, () => console.log(`nav-app dev server: http://localhost:${PORT}/`));
