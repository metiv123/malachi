import { id, mutateDb, loadDb, nowIso } from './store.js';

export async function createFeedback(input) {
  return mutateDb((db) => {
    db.feedback = db.feedback || [];
    const item = { id: id('fb'), rating: input.rating || '', text: input.text || '', source: input.source || 'dashboard', createdAt: nowIso() };
    db.feedback.push(item);
    return item;
  });
}

export async function listFeedback() {
  const db = await loadDb();
  return (db.feedback || []).slice().reverse();
}
