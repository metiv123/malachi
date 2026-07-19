import { id, mutateDb, loadDb, nowIso } from './store.js';
import { config } from './config.js';

function clean(value = '') {
  return String(value || '').trim();
}

function publicFamily(family) {
  if (!family) return null;
  return {
    familyId: family.id,
    ownerName: family.ownerName || '',
    ownerEmail: family.ownerEmail || '',
    ownerPhone: family.ownerPhone || ''
  };
}

async function notifyFeedback(item) {
  if (!config.feedbackNotifyWebhook) return;
  try {
    await fetch(config.feedbackNotifyWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'malachi_feedback_created', feedback: item })
    });
  } catch (err) {
    // Notification must never block feedback submission.
    console.warn('feedback notification failed', err.message);
  }
}

export async function createFeedback(input = {}) {
  const token = clean(input.token);
  const item = await mutateDb((db) => {
    db.feedback = db.feedback || [];
    const family = token ? db.families.find((f) => f.managementToken === token && !f.tokenRevokedAt) : null;
    const feedback = {
      id: id('fb'),
      rating: clean(input.rating),
      text: clean(input.text),
      source: clean(input.source) || 'dashboard',
      page: clean(input.page),
      userAgent: clean(input.userAgent),
      family: publicFamily(family),
      createdAt: nowIso()
    };
    db.feedback.push(feedback);
    db.audit = db.audit || [];
    db.audit.push({ id: id('evt'), type: 'feedback_created', payload: { feedbackId: feedback.id, rating: feedback.rating, familyId: feedback.family?.familyId || null }, createdAt: nowIso() });
    return feedback;
  });
  await notifyFeedback(item);
  return item;
}

export async function listFeedback() {
  const db = await loadDb();
  return (db.feedback || []).slice().reverse();
}
