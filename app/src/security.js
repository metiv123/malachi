const buckets = new Map();
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

export function rateLimit(req, { key = 'global', limit = 120, windowMs = 60_000 } = {}) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  buckets.set(bucketKey, bucket);
  if (buckets.size > 10_000) {
    for (const [storedKey, stored] of buckets) if (now > stored.resetAt) buckets.delete(storedKey);
  }
  return bucket.count <= limit;
}

export function safePublicFamily(family) {
  return {
    id: family.id,
    ownerName: family.ownerName,
    ownerPhone: maskPhone(family.ownerPhone),
    ownerEmail: family.ownerEmail || '',
    managementToken: family.managementToken,
    createdAt: family.createdAt,
    elders: family.elders?.map((elder) => ({
      ...elder,
      whatsappPhone: maskPhone(elder.whatsappPhone),
      contact: elder.contact ? { ...elder.contact, whatsappPhone: maskPhone(elder.contact.whatsappPhone) } : null
    })) || []
  };
}

export function maskPhone(phone = '') {
  const s = String(phone);
  if (s.length < 7) return s;
  return `${s.slice(0, 4)}***${s.slice(-3)}`;
}

export function hashPassword(password) {
  const rounds = 600000;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(String(password), salt, rounds, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$${rounds}$${salt}$${hash}`;
}

export function verifyPassword(password, stored = '') {
  const [algo, roundsRaw, salt, hash] = String(stored).split('$');
  if (algo !== 'pbkdf2_sha256' || !roundsRaw || !salt || !hash) return false;
  const rounds = Number(roundsRaw);
  const actual = pbkdf2Sync(String(password), salt, rounds, Buffer.from(hash, 'hex').length, 'sha256');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
