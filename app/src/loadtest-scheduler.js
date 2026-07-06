import { rm } from 'node:fs/promises';
import path from 'node:path';
import { createFamily, processDueChecks, setOptIn, listDashboard } from './malachi.js';

function assert(condition, message) { if (!condition) throw new Error(message); }

const nowTime = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

await rm(path.resolve(process.cwd(), 'data/db.json'), { force: true });
for (let i = 0; i < 25; i++) {
  const created = await createFamily({
    ownerName: `משפחה ${i}`,
    ownerPhone: `+97250111${String(i).padStart(4, '0')}`,
    elderName: `קשיש ${i}`,
    elderPhone: `+97250222${String(i).padStart(4, '0')}`,
    dailyCheckTime: nowTime,
    contactName: `איש קשר ${i}`,
    contactPhone: `+97250333${String(i).padStart(4, '0')}`,
    consent: 'on',
    source: 'loadtest'
  });
  await setOptIn(created.elder.id, true);
}
const sent = await processDueChecks(new Date());
const sentAgain = await processDueChecks(new Date());
assert(sent.length === 25, `expected 25 sent, got ${sent.length}`);
assert(sentAgain.length === 0, `expected 0 duplicate, got ${sentAgain.length}`);
const dashboard = await listDashboard();
assert(dashboard.length === 25, 'expected 25 families');
console.log('✅ scheduler loadtest passed');
