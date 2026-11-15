import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const downloads = path.join(root, 'downloads');
const manifest = await readFile(path.join(downloads, 'SHA256SUMS.txt'), 'utf8');
const checksums = new Map(manifest.trim().split(/\r?\n/).map(line => {
  const match = /^([a-f0-9]{64})\s+([\w.-]+)$/.exec(line);
  if (!match) throw new Error(`Invalid checksum entry: ${line}`);
  return [match[2], match[1]];
}));

for (const file of await readdir(downloads)) {
  if (file === 'SHA256SUMS.txt') continue;
  const expected = checksums.get(file);
  if (!expected) throw new Error(`Missing checksum for ${file}`);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path.join(downloads, file))) hash.update(chunk);
  if (hash.digest('hex') !== expected) throw new Error(`Checksum mismatch for ${file}`);
  checksums.delete(file);
}
if (checksums.size) throw new Error(`Missing downloads: ${[...checksums.keys()].join(', ')}`);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'styles.css', 'src', 'assets', 'downloads', '404.html', '_headers']) {
  await cp(path.join(root, name), path.join(out, name), { recursive: true });
}
console.log('Built Vellire in dist/.');
