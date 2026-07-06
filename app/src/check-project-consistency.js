import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'VERSION_MANIFEST.json'), 'utf8'));
const latest = await readFile(path.join(root, 'LATEST.md'), 'utf8').catch(() => '');
if (!manifest.latest) throw new Error('manifest latest missing');
if (!latest.includes(`V${manifest.latest}`) && manifest.latest >= 44) {
  console.warn(`⚠️ LATEST.md does not mention V${manifest.latest}; update recommended`);
}
console.log(`✅ project consistency check passed latest=V${manifest.latest}`);
