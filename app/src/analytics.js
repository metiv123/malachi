import { createHmac } from 'node:crypto';
import { config } from './config.js';
import { loadDb, mutateDb, nowIso } from './store.js';

const EVENTS = new Set([
  'page_view',
  'engaged_view',
  'join_click',
  'demo_click',
  'demo_interaction',
  'demo_join_click',
  'sign_in_click',
  'whatsapp_click',
  'signup_form_engaged',
  'signup_start',
  'signup_complete',
  'waitlist_joined'
]);
const MARKETS = new Set(['il', 'uk']);
const SKETCH_BITS = 2048;
const SKETCH_BYTES = SKETCH_BITS / 8;

function clean(value, fallback = '', max = 100) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9._~:/?&=+-]/g, '-');
  return normalized.slice(0, max) || fallback;
}

function cleanPath(value = '/') {
  try {
    const parsed = new URL(String(value), 'https://example.invalid');
    return clean(parsed.pathname || '/', '/', 120);
  } catch {
    return '/';
  }
}

function emptySketch() {
  return Buffer.alloc(SKETCH_BYTES);
}

function decodeSketch(value = '') {
  try {
    const buffer = Buffer.from(value, 'base64');
    return buffer.length === SKETCH_BYTES ? buffer : emptySketch();
  } catch {
    return emptySketch();
  }
}

function sketchAdd(encoded, visitorKey) {
  const sketch = decodeSketch(encoded);
  const digest = createHmac('sha256', config.analyticsSalt).update(visitorKey).digest();
  const bucket = digest.readUInt32BE(0) % SKETCH_BITS;
  sketch[Math.floor(bucket / 8)] |= 1 << (bucket % 8);
  return sketch.toString('base64');
}

function sketchMerge(target, encoded) {
  const source = decodeSketch(encoded);
  for (let index = 0; index < SKETCH_BYTES; index += 1) target[index] |= source[index];
}

function estimateSketch(sketch) {
  let used = 0;
  for (const byte of sketch) {
    let value = byte;
    while (value) { used += value & 1; value >>= 1; }
  }
  if (!used) return 0;
  const empty = SKETCH_BITS - used;
  if (empty <= 0) return SKETCH_BITS;
  return Math.round(-SKETCH_BITS * Math.log(empty / SKETCH_BITS));
}

function visitorKey({ ip = '', userAgent = '' } = {}) {
  const coarseIp = String(ip || '').trim().split(',')[0].trim();
  return `${coarseIp}|${String(userAgent || '').slice(0, 300)}`;
}

function isBot(userAgent = '') {
  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegrambot|uptime|monitor/i.test(userAgent);
}

function emptyRow(day, market) {
  return {
    day,
    market,
    pageViews: 0,
    visitorSketch: emptySketch().toString('base64'),
    events: {},
    pages: {},
    sources: {},
    sourceEvents: {},
    campaigns: {},
    campaignEvents: {},
    mediums: {},
    updatedAt: nowIso()
  };
}

export async function recordAnalyticsEvent(input = {}, request = {}) {
  const event = clean(input.event, '', 40);
  const market = clean(input.market, '', 10);
  if (!EVENTS.has(event) || !MARKETS.has(market)) throw Object.assign(new Error('Invalid analytics event'), { statusCode: 400 });
  if (input.test === true || isBot(request.userAgent)) return { ok: true, ignored: true };

  const day = new Date().toISOString().slice(0, 10);
  const path = cleanPath(input.path);
  const source = clean(input.utm_source || input.source, 'direct', 60);
  const campaign = clean(input.utm_campaign, 'none', 80);
  const medium = clean(input.utm_medium, 'none', 60);
  const key = visitorKey(request);

  await mutateDb((db) => {
    db.analyticsDaily ||= [];
    let row = db.analyticsDaily.find((item) => item.day === day && item.market === market);
    if (!row) {
      row = emptyRow(day, market);
      db.analyticsDaily.push(row);
    }
    row.events[event] = Number(row.events[event] || 0) + 1;
    row.sourceEvents ||= {};
    row.sourceEvents[source] ||= {};
    row.sourceEvents[source][event] = Number(row.sourceEvents[source][event] || 0) + 1;
    row.campaignEvents ||= {};
    row.campaignEvents[campaign] ||= {};
    row.campaignEvents[campaign][event] = Number(row.campaignEvents[campaign][event] || 0) + 1;
    row.updatedAt = nowIso();
    if (event === 'page_view') {
      row.pageViews = Number(row.pageViews || 0) + 1;
      row.pages[path] = Number(row.pages[path] || 0) + 1;
      row.sources[source] = Number(row.sources[source] || 0) + 1;
      row.campaigns[campaign] = Number(row.campaigns[campaign] || 0) + 1;
      row.mediums ||= {};
      row.mediums[medium] = Number(row.mediums[medium] || 0) + 1;
      row.visitorSketch = sketchAdd(row.visitorSketch, key);
    }
  });
  return { ok: true };
}

function addCounts(target, source = {}) {
  for (const [key, value] of Object.entries(source)) target[key] = Number(target[key] || 0) + Number(value || 0);
}

function summarizeBreakdowns(rows, countsField, eventsField) {
  const breakdowns = {};
  for (const row of rows) {
    for (const [name, value] of Object.entries(row[countsField] || {})) {
      breakdowns[name] ||= { pageViews: 0, events: {}, viewToSignupRate: 0 };
      breakdowns[name].pageViews += Number(value || 0);
    }
    for (const [name, events] of Object.entries(row[eventsField] || {})) {
      breakdowns[name] ||= { pageViews: 0, events: {}, viewToSignupRate: 0 };
      addCounts(breakdowns[name].events, events);
    }
  }
  for (const item of Object.values(breakdowns)) {
    const completed = Number(item.events.signup_complete || 0);
    item.viewToSignupRate = item.pageViews ? Number(((completed / item.pageViews) * 100).toFixed(1)) : 0;
  }
  return breakdowns;
}

function summarize(rows, market) {
  const marketRows = rows.filter((item) => item.market === market);
  const sketch = emptySketch();
  const summary = { market, visitors: 0, pageViews: 0, events: {}, pages: {}, sources: {}, sourceFunnels: {}, campaigns: {}, campaignFunnels: {}, mediums: {}, conversionRate: 0 };
  for (const row of marketRows) {
    summary.pageViews += Number(row.pageViews || 0);
    addCounts(summary.events, row.events);
    addCounts(summary.pages, row.pages);
    addCounts(summary.sources, row.sources);
    addCounts(summary.campaigns, row.campaigns);
    addCounts(summary.mediums, row.mediums);
    sketchMerge(sketch, row.visitorSketch);
  }
  summary.visitors = estimateSketch(sketch);
  summary.sourceFunnels = summarizeBreakdowns(marketRows, 'sources', 'sourceEvents');
  summary.campaignFunnels = summarizeBreakdowns(marketRows, 'campaigns', 'campaignEvents');
  const completed = Number(summary.events.signup_complete || 0);
  summary.conversionRate = summary.visitors ? Number(((completed / summary.visitors) * 100).toFixed(1)) : 0;
  return summary;
}

export async function analyticsReport({ days = 30, market = 'all' } = {}) {
  const safeDays = Math.max(1, Math.min(Number(days) || 30, config.retention.analyticsDays));
  const start = new Date(Date.now() - (safeDays - 1) * 86400000).toISOString().slice(0, 10);
  const db = await loadDb();
  const rows = (db.analyticsDaily || []).filter((row) => row.day >= start && MARKETS.has(row.market));
  const markets = market === 'all' ? ['il', 'uk'] : [MARKETS.has(market) ? market : 'il'];
  return {
    generatedAt: nowIso(),
    days: safeDays,
    note: 'Visitor totals are privacy-preserving estimates. Bots and Do Not Track browsers are excluded where possible.',
    markets: markets.map((value) => summarize(rows, value)),
    daily: rows.filter((row) => markets.includes(row.market)).map((row) => ({
      day: row.day,
      market: row.market,
      visitors: estimateSketch(decodeSketch(row.visitorSketch)),
      pageViews: Number(row.pageViews || 0),
      events: row.events || {}
    })).sort((a, b) => a.day.localeCompare(b.day) || a.market.localeCompare(b.market))
  };
}

export async function publicMarketingStatus({ days = 7 } = {}) {
  const report = await analyticsReport({ days, market: 'all' });
  return {
    generatedAt: report.generatedAt,
    days: report.days,
    note: 'Aggregate, privacy-preserving funnel totals. No visitor, referrer or campaign records are exposed.',
    markets: report.markets.map((summary) => ({
      market: summary.market,
      visitors: Number(summary.visitors || 0),
      pageViews: Number(summary.pageViews || 0),
      engagedViews: Number(summary.events.engaged_view || 0),
      demoClicks: Number(summary.events.demo_click || 0),
      demoInteractions: Number(summary.events.demo_interaction || 0),
      demoJoinClicks: Number(summary.events.demo_join_click || 0),
      joinClicks: Number(summary.events.join_click || 0),
      whatsappClicks: Number(summary.events.whatsapp_click || 0),
      signupFormEngaged: Number(summary.events.signup_form_engaged || 0),
      signupStarts: Number(summary.events.signup_start || 0),
      signupCompletes: Number(summary.events.signup_complete || 0),
      conversionRate: Number(summary.conversionRate || 0)
    }))
  };
}

export const analyticsInternals = { decodeSketch, estimateSketch, sketchAdd };
