import { loadDb } from './store.js';
import { config } from './config.js';

export async function betaReadiness() {
  const db = await loadDb();
  const blockers = [];
  const warnings = [];
  const recommendations = [];

  const families = db.families.length;
  const elders = db.elders.length;
  const activeElders = db.elders.filter((e) => e.active).length;
  const approvedElders = db.elders.filter((e) => e.optInStatus === 'approved').length;
  const contacts = db.contacts.length;
  const openChecks = db.checks.filter((c) => c.status === 'sent').length;
  const failedChecks = db.checks.filter((c) => c.status === 'failed').length;
  const errors = (db.errors || []).length;

  if (!config.betaOpen) blockers.push('הבטא סגורה בהגדרות MALACHI_BETA_OPEN=false');
  if (config.whatsappProvider === 'meta') {
    if (!config.meta.phoneNumberId) blockers.push('חסר META_PHONE_NUMBER_ID');
    if (!config.meta.accessToken) blockers.push('חסר META_ACCESS_TOKEN');
  } else {
    warnings.push('WhatsApp במצב mock — מתאים לדמו/בדיקה, לא למשפחות אמיתיות בלי ניטור ידני');
  }
  if (failedChecks > 0) blockers.push(`יש ${failedChecks} בדיקות בסטטוס failed`);
  if (openChecks > 10) warnings.push(`יש ${openChecks} בדיקות פתוחות שממתינות לתגובה`);
  if (errors > 0) warnings.push(`יש ${errors} שגיאות בלוג — לבדוק /api/errors`);
  if (families >= config.betaMaxFamilies) blockers.push('מכסת הבטא מלאה');

  if (families === 0) recommendations.push('להכניס קודם משפחת בדיקה פנימית אחת');
  if (elders > 0 && approvedElders < elders) recommendations.push('יש אנשים שעדיין לא אישרו Opt-in');
  if (elders > 0 && contacts < elders) blockers.push('יש אדם מבוגר ללא איש קשר להתראה');
  if (activeElders === 0 && families > 0) warnings.push('אין כרגע אנשים פעילים לבדיקה יומית');

  const readyForInternalPilot = blockers.length === 0;
  const readyForRealFamilies = readyForInternalPilot && config.whatsappProvider === 'meta' && errors === 0;

  return {
    readyForInternalPilot,
    readyForRealFamilies,
    mode: config.whatsappProvider,
    counts: { families, elders, activeElders, approvedElders, contacts, openChecks, failedChecks, errors, betaMaxFamilies: config.betaMaxFamilies },
    blockers,
    warnings,
    recommendations,
    nextStep: blockers.length
      ? 'לטפל בחסמים לפני הכנסת משפחות נוספות'
      : config.whatsappProvider === 'mock'
        ? 'אפשר להמשיך בדמו/בדיקה פנימית; למשפחות אמיתיות צריך חיבור Meta מאושר'
        : 'אפשר להתחיל פיילוט קטן ומבוקר עם 5 משפחות'
  };
}
