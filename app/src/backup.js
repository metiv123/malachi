import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export async function createBackup() {
  await mkdir(BACKUP_DIR, { recursive: true });
  let data = '{}';
  try { data = await readFile(DB_PATH, 'utf8'); } catch {}
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `malachi-db-${stamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);
  await writeFile(filePath, data, 'utf8');
  return { filename, path: filePath };
}

export async function listBackups() {
  await mkdir(BACKUP_DIR, { recursive: true });
  const files = await readdir(BACKUP_DIR);
  return files.filter((f) => f.endsWith('.json')).sort().reverse();
}

export async function exportDbJson() {
  try { return await readFile(DB_PATH, 'utf8'); } catch { return '{}'; }
}
