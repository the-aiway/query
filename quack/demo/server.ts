import { serve } from 'bun';
import { join } from 'path';

const PORT = 3000;
const PUBLIC_DIR = join(import.meta.dir, '.');
const ROOT_DIR = join(import.meta.dir, '../../..');
const QUERY_DIR = join(import.meta.dir, '../..');

console.log(`Starting Quack Demo Server on http://localhost:${PORT}`);
console.log(`Roots: ROOT=${ROOT_DIR}, QUERY=${QUERY_DIR}`);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const headers = new Headers();
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    // Bundle and serve index.tsx as a single JS file
    if (path === '/bundle.js') {
      const result = await Bun.build({
        entrypoints: [join(PUBLIC_DIR, 'index.tsx')],
        minify: false,
        target: 'browser',
      });
      headers.set('Content-Type', 'application/javascript');
      return new Response(result.outputs[0], { headers });
    }

    // Serve index.html
    if (path === '/' || path === '/index.html') {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quack Optimizer Demo</title>
          <style>
            body { margin: 0; font-family: system-ui; background: #0a0a0c; color: #fff; }
          </style>
        </head>
        <body>
          <div id="root">Loading Quack Engine...</div>
          <script type="module" src="/bundle.js"></script>
        </body>
        </html>
      `;
      headers.set('Content-Type', 'text/html');
      return new Response(html, { headers });
    }

    // Serve dist assets (WASM/Workers) from the query/dist folder
    if (path.includes('/dist/')) {
      const part = path.split('/dist/')[1];
      const fullPath = join(QUERY_DIR, 'dist', part);
      // For assets, we might also need CORP
      return new Response(Bun.file(fullPath), { headers });
    }

    // Serve Parquet files specifically from query/data
    if (path.startsWith('/query/data/')) {
      const fullPath = join(ROOT_DIR, path); // path already includes /query/data/
      return new Response(Bun.file(fullPath), { headers });
    }

    // Dedicated macros endpoint to avoid exposing server/
    if (path === '/api/macros') {
      const macrosSql = await Bun.file(join(ROOT_DIR, 'server/db/views/macros.sql')).text();
      headers.set('Content-Type', 'text/plain');
      return new Response(macrosSql, { headers });
    }

    return new Response('Not Found', { status: 404, headers });
  },
});
