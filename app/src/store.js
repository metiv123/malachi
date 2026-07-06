import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const emptyDb = () => ({
  families: [],
  elders: [],
  contacts: [],
  checks: [],
  audit: [],
  outboundMessages: [],
  waitlist: [],
  feedback: []
});

export async function loadDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await readFile(DB_PATH, 'utf8'));
  } catch {
    const db = emptyDb();
    await saveDb(db);
    return db;
  }
}

export async function saveDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function mutateDb(mutator) {
  const db = await loadDb();
  const result = await mutator(db);
  await saveDb(db);
  return result;
}

export function nowIso() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export async function audit(type, payload = {}) {
  await mutateDb((db) => {
    db.audit.push({ id: id('evt'), type, payload, createdAt: nowIso() });
  });
}
