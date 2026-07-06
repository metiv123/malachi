import { mutateDb, nowIso, id } from './store.js';

export async function logError(source, error, context = {}) {
  await mutateDb((db) => {
    db.errors = db.errors || [];
    db.errors.push({
      id: id('err'),
      source,
      message: error?.message || String(error),
      stack: error?.stack || '',
      context,
      createdAt: nowIso()
    });
  });
}

export async function listErrors(limit = 50) {
  const { loadDb } = await import('./store.js');
  const db = await loadDb();
  return (db.errors || []).slice().reverse().slice(0, limit);
}
