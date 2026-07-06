const buckets = new Map();

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
