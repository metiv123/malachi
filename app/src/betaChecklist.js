import { betaReadiness } from './betaReadiness.js';

export async function betaChecklist() {
  const readiness = await betaReadiness();
  const items = [
    { id: 'privacy', label: 'דפי פרטיות/תנאים קיימים', status: 'done', note: '/privacy.html /terms.html /data-deletion.html' },
    { id: 'landing', label: 'דף נחיתה קיים', status: 'done', note: '/' },
    { id: 'dashboard', label: 'דשבורד משפחתי פרטי קיים', status: 'done', note: '/dashboard.html?token=...' },
    { id: 'scheduler', label: 'מנוע תזמון קיים', status: 'done', note: 'scheduler.js' },
    { id: 'contacts', label: 'אנשי קשר להתראות', status: readiness.counts.contacts >= readiness.counts.elders ? 'done' : 'blocked', note: `${readiness.counts.contacts}/${readiness.counts.elders}` },
    { id: 'optin', label: 'Opt-in לכל האנשים', status: readiness.counts.elders === 0 ? 'pending' : readiness.counts.approvedElders === readiness.counts.elders ? 'done' : 'pending', note: `${readiness.counts.approvedElders}/${readiness.counts.elders}` },
    { id: 'errors', label: 'אין שגיאות פתוחות', status: readiness.counts.errors === 0 ? 'done' : 'warning', note: `${readiness.counts.errors} שגיאות` },
    { id: 'meta', label: 'חיבור Meta אמיתי', status: readiness.mode === 'meta' ? 'done' : 'needs_approval', note: 'דורש אישור לפני חיבור חי' },
    { id: 'db', label: 'DB production', status: 'recommended', note: 'לפני בטא רחבה מומלץ PostgreSQL/MySQL' }
  ];
  return { summary: readiness.nextStep, readyForInternalPilot: readiness.readyForInternalPilot, readyForRealFamilies: readiness.readyForRealFamilies, items };
}
