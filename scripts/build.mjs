import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, readdir, realpath, rm, stat } from 'node:fs/promises';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'dist');
const files = [
  'index.html', 'styles.css', 'script.js', 'impressum.html',
  'datenschutz.html', 'robots.txt', 'sitemap.xml',
];

async function validateAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Assets must not contain symbolic links: ${path.relative(root, filename)}`);
    if (entry.isDirectory()) await validateAssets(filename);
    else if (!entry.isFile()) throw new Error(`Unsupported asset type: ${path.relative(root, filename)}`);
  }
}

async function build() {
  for (const filename of files) {
    const source = path.join(root, filename);
    const info = await stat(source);
    if (!info.isFile() || info.size === 0) throw new Error(`Required file is missing or empty: ${filename}`);
    if (await realpath(source) !== source) throw new Error(`Required file must not be a symbolic link: ${filename}`);
  }
  const assets = path.join(root, 'assets');
  if (!(await stat(assets)).isDirectory()) throw new Error('The assets directory is missing.');
  if (await realpath(assets) !== assets) throw new Error('The assets directory must not be a symbolic link.');
  await validateAssets(assets);

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await Promise.all(files.map(filename => cp(path.join(root, filename), path.join(output, filename))));
  await cp(assets, path.join(output, 'assets'), {
    recursive: true,
    filter: filename => !path.relative(assets, filename).split(path.sep).some(part => part.startsWith('.')),
  });
  console.log(`Built ${files.length} site files and local assets into dist/.`);
}

build().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
