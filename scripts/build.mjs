import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'styles.css', 'src', 'assets', 'downloads', '404.html', '_headers']) {
  await cp(path.join(root, name), path.join(out, name), { recursive: true });
}
console.log('Built Wellnile in dist/.');
