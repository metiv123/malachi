import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { loadDb } from './store.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const REQUIRED_COLLECTIONS = ['families', 'elders', 'contacts', 'checks', 'audit', 'inboundMessages', 'outboundMessages', 'waitlist', 'feedback', 'errors'];

export function validateBackup(db) {
  if (!db || typeof db !== 'object' || Array.isArray(db)) throw new Error('Backup must be a JSON object');
  for (const collection of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(db[collection])) throw new Error(`Backup collection missing: ${collection}`);
  }
  return {
    valid: true,
    collections: Object.fromEntries(REQUIRED_COLLECTIONS.map((name) => [name, db[name].length]))
  };
}

function backupTimestamp(filename) {
  const match = String(filename).match(/^malachi-firestore-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return NaN;
  return new Date(`${match[1]}T${match[2]}:${match[3]}:${match[4]}Z`).getTime();
}

export async function cleanupExpiredBackups() {
  await mkdir(BACKUP_DIR, { recursive: true });
  const cutoff = Date.now() - config.retention.backupsDays * 24 * 60 * 60 * 1000;
  const files = await readdir(BACKUP_DIR);
  for (const filename of files.filter((name) => name.endsWith('.json'))) {
    const timestamp = backupTimestamp(filename);
    if (Number.isFinite(timestamp) && timestamp < cutoff) await rm(path.join(BACKUP_DIR, filename), { force: true });
  }
}

export async function createBackup() {
  await mkdir(BACKUP_DIR, { recursive: true });
  await cleanupExpiredBackups();
  const db = await loadDb();
  const validation = validateBackup(db);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `malachi-firestore-${stamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);
  await writeFile(filePath, JSON.stringify(db, null, 2), { encoding: 'utf8', mode: 0o600 });
  return { filename, path: filePath, validation };
}

export async function listBackups() {
  await mkdir(BACKUP_DIR, { recursive: true });
  await cleanupExpiredBackups();
  const files = await readdir(BACKUP_DIR);
  return files.filter((filename) => filename.startsWith('malachi-firestore-') && filename.endsWith('.json')).sort().reverse();
}

function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').replace(/^0/, '972');
}

function scrubFamily(db, { familyId, elderIds, contactIds, phones, ownerEmail }) {
  const relatedId = (payload = {}) => payload.familyId === familyId || elderIds.has(payload.elderId) || contactIds.has(payload.contactId);
  const relatedMessage = (message = {}) => relatedId(message.meta || {}) || phones.has(normalizePhone(message.to)) || phones.has(normalizePhone(message.from));
  db.families = (db.families || []).filter((item) => item.id !== familyId);
  db.elders = (db.elders || []).filter((item) => !elderIds.has(item.id) && item.familyId !== familyId);
  db.contacts = (db.contacts || []).filter((item) => !contactIds.has(item.id) && !elderIds.has(item.elderId));
  db.checks = (db.checks || []).filter((item) => !elderIds.has(item.elderId));
  db.inboundMessages = (db.inboundMessages || []).filter((item) => !relatedMessage(item));
  db.outboundMessages = (db.outboundMessages || []).filter((item) => !relatedMessage(item));
  db.audit = (db.audit || []).filter((item) => !relatedId(item.payload || {}));
  db.feedback = (db.feedback || []).filter((item) => item.family?.familyId !== familyId && item.familyId !== familyId);
  db.errors = (db.errors || []).filter((item) => !relatedId(item.context || {}) && !relatedId(item.payload || {}));
  db.waitlist = (db.waitlist || []).filter((item) => String(item.ownerEmail || '').toLowerCase() !== String(ownerEmail || '').toLowerCase() && !phones.has(normalizePhone(item.ownerPhone)));
  return db;
}

export async function purgeFamilyFromBackups(context) {
  await mkdir(BACKUP_DIR, { recursive: true });
  const files = (await readdir(BACKUP_DIR)).filter((name) => name.startsWith('malachi-firestore-') && name.endsWith('.json'));
  for (const filename of files) {
    const filePath = path.join(BACKUP_DIR, filename);
    try {
      const db = JSON.parse(await readFile(filePath, 'utf8'));
      await writeFile(filePath, JSON.stringify(scrubFamily(db, context), null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch {
      // A malformed backup is never restored automatically; cleanup continues.
    }
  }
}

export async function exportDbJson() {
  const db = await loadDb();
  validateBackup(db);
  return JSON.stringify(db, null, 2);
}

export async function verifyBackupFile(filePath) {
  const parsed = JSON.parse(await readFile(filePath, 'utf8'));
  return validateBackup(parsed);
}
