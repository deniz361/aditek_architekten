import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, realpath, stat } from 'node:fs/promises';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const publicFiles = new Set([
  'index.html', 'styles.css', 'script.js', 'impressum.html',
  'datenschutz.html', 'robots.txt', 'sitemap.xml',
]);
const legacyRedirects = new Map([
  ['/leistungen', '/#leistungen'],
  ['/referenzen', '/#projekte'],
  ['/kontakt', '/#kontakt'],
  ['/impressum', '/impressum.html'],
  ['/datenschutz', '/datenschutz.html'],
]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
};

function parseOptions() {
  const options = { host: '127.0.0.1', port: '3000', dir: '.' };
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      console.log('Usage: node server.mjs [--host HOST] [--port PORT] [--dir DIRECTORY]');
      process.exit(0);
    }
    const [flag, inlineValue] = argument.split('=', 2);
    const key = flag.slice(2);
    if (!flag.startsWith('--') || !Object.hasOwn(options, key)) {
      throw new Error(`Unknown option: ${argument}`);
    }
    if (key === 'host' && inlineValue === undefined && (!args[index + 1] || args[index + 1].startsWith('--'))) {
      options.host = '0.0.0.0';
      continue;
    }
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[key] = value;
  }
  if (!/^\d+$/.test(options.port) || Number(options.port) < 1 || Number(options.port) > 65535) {
    throw new Error('Port must be an integer between 1 and 65535.');
  }
  return { ...options, port: Number(options.port) };
}

function inside(directory, filename) {
  const relative = path.relative(directory, filename);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function respond(response, code, message, head = false) {
  response.writeHead(code, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...(code === 405 ? { Allow: 'GET, HEAD' } : {}),
  });
  response.end(head ? undefined : `${message}\n`);
}

async function main() {
  const options = parseOptions();
  const root = await realpath(path.resolve(projectRoot, options.dir));
  if (!(await stat(root)).isDirectory()) throw new Error('The requested site directory is not a directory.');

  const server = http.createServer(async (request, response) => {
    const head = request.method === 'HEAD';
    if (request.method !== 'GET' && !head) {
      respond(response, 405, 'Method not allowed.');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    } catch {
      respond(response, 400, 'Invalid URL.', head);
      return;
    }
    const segments = pathname.split('/');
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || segments.some(segment => segment.startsWith('.'))) {
      respond(response, 404, 'Not found.', head);
      return;
    }
    const redirect = legacyRedirects.get(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname);
    if (redirect) {
      response.writeHead(301, {
        Location: redirect,
        'Content-Length': 0,
        'X-Content-Type-Options': 'nosniff',
      });
      response.end();
      return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const asset = relative.startsWith('assets/');
    if (!publicFiles.has(relative) && !asset) {
      respond(response, 404, 'Not found.', head);
      return;
    }

    try {
      const requestedFilename = path.join(root, relative);
      const filename = await realpath(requestedFilename);
      const allowedDirectory = asset ? path.join(root, 'assets') : root;
      if (filename !== requestedFilename || !inside(allowedDirectory, filename) || !(await stat(filename)).isFile()) {
        respond(response, 404, 'Not found.', head);
        return;
      }
      const content = await readFile(filename);
      response.writeHead(200, {
        'Content-Type': types[path.extname(filename).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': content.length,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      });
      response.end(head ? undefined : content);
    } catch (error) {
      const notFound = ['ENOENT', 'ENOTDIR', 'EACCES', 'ELOOP'].includes(error.code);
      if (!notFound) console.error('Unable to serve a file:', error.message);
      respond(response, notFound ? 404 : 500, notFound ? 'Not found.' : 'Unable to load this page.', head);
    }
  });

  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${options.port} is already in use. Try --port 3001.`
      : `Unable to start server: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(options.port, options.host, () => {
    const displayHost = options.host.includes(':') ? `[${options.host}]` : options.host;
    console.log(`ADITEK is available at http://${displayHost}:${options.port}`);
    console.log(`Serving ${path.relative(projectRoot, root) || 'the project directory'}. Press Ctrl+C to stop.`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

main().catch(error => {
  console.error(`Unable to start server: ${error.message}`);
  process.exitCode = 1;
});
