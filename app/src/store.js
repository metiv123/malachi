import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const STORE_DRIVER = process.env.MALACHI_STORE || (process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'firestore' : 'file');
const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || 'malachi_runtime';
const FIRESTORE_DOCUMENT = process.env.FIRESTORE_DOCUMENT || 'main';

const HEAVY_LOG_LIMITS = {
  audit: Number(process.env.MALACHI_AUDIT_LIMIT || 300),
  inboundMessages: Number(process.env.MALACHI_INBOUND_MESSAGES_LIMIT || 150),
  outboundMessages: Number(process.env.MALACHI_OUTBOUND_MESSAGES_LIMIT || 300),
  errors: Number(process.env.MALACHI_ERRORS_LIMIT || 100)
};

const emptyDb = () => ({
  families: [],
  elders: [],
  contacts: [],
  checks: [],
  audit: [],
  inboundMessages: [],
  outboundMessages: [],
  waitlist: [],
  feedback: [],
  errors: []
});

function normalizeDb(db = {}) {
  const base = emptyDb();
  const normalized = { ...base, ...db };
  normalized.elders = (normalized.elders || []).map((elder) => ({
    ...elder,
    // Existing beta families joined before this preference existed. Per current
    // beta policy they are treated as Shabbat-observant unless explicitly changed.
    shomerShabbat: elder.shomerShabbat === undefined || elder.shomerShabbat === null ? true : Boolean(elder.shomerShabbat)
  }));
  return normalized;
}

function trimArrayTail(value, limit) {
  if (!Array.isArray(value)) return [];
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return value.length > limit ? value.slice(-limit) : value;
}

function compactDb(db = {}) {
  const normalized = normalizeDb(db);
  return {
    ...normalized,
    audit: trimArrayTail(normalized.audit, HEAVY_LOG_LIMITS.audit),
    inboundMessages: trimArrayTail(normalized.inboundMessages, HEAVY_LOG_LIMITS.inboundMessages),
    outboundMessages: trimArrayTail(normalized.outboundMessages, HEAVY_LOG_LIMITS.outboundMessages),
    errors: trimArrayTail(normalized.errors, HEAVY_LOG_LIMITS.errors)
  };
}

function parseFirebaseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`);
  }
}

let firestoreDb = null;
function firestore() {
  if (firestoreDb) return firestoreDb;
  const serviceAccount = parseFirebaseServiceAccount();
  if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON missing');
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  }
  firestoreDb = getFirestore();
  return firestoreDb;
}

function firestoreRef() {
  return firestore().collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOCUMENT);
}

async function loadFileDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    return normalizeDb(JSON.parse(await readFile(DB_PATH, 'utf8')));
  } catch {
    const db = emptyDb();
    await saveFileDb(db);
    return db;
  }
}

async function saveFileDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(compactDb(db), null, 2), 'utf8');
}

async function loadFirestoreDb() {
  const snap = await firestoreRef().get();
  if (!snap.exists) {
    const db = emptyDb();
    await saveFirestoreDb(db);
    return db;
  }
  return normalizeDb(snap.data()?.db || {});
}

async function saveFirestoreDb(db) {
  await firestoreRef().set({ db: compactDb(db), updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadDb() {
  if (STORE_DRIVER === 'firestore') return loadFirestoreDb();
  return loadFileDb();
}

export async function saveDb(db) {
  if (STORE_DRIVER === 'firestore') return saveFirestoreDb(db);
  return saveFileDb(db);
}

export async function mutateDb(mutator) {
  if (STORE_DRIVER === 'firestore') {
    return firestore().runTransaction(async (transaction) => {
      const ref = firestoreRef();
      const snap = await transaction.get(ref);
      const db = normalizeDb(snap.exists ? (snap.data()?.db || {}) : {});
      const result = await mutator(db);
      transaction.set(ref, { db: compactDb(db), updatedAt: new Date().toISOString() }, { merge: true });
      return result;
    });
  }
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
