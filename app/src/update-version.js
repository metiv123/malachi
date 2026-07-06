import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'VERSION_MANIFEST.json'), 'utf8'));
const latest = `V${manifest.latest}`;
await writeFile(path.join(process.cwd(), 'src/version.js'), `export const version = {\n  name: 'malachi-mvp',\n  version: '${latest}',\n  mode: 'mock-ready',\n  updatedAt: '${new Date().toISOString().slice(0,10)}'\n};\n`, 'utf8');
console.log(`✅ version.js updated to ${latest}`);
