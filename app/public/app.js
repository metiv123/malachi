const params = new URLSearchParams(location.search);
const API_BASE = (window.MALACHI_API_BASE || '').replace(/\/$/, '');
const leadSource = params.get('utm_source') || params.get('source') || params.get('ref') || 'direct';
const trackingFields = {
  sourceField: leadSource,
  refField: params.get('ref') || '',
  utmSourceField: params.get('utm_source') || '',
  utmMediumField: params.get('utm_medium') || '',
  utmCampaignField: params.get('utm_campaign') || '',
  utmContentField: params.get('utm_content') || '',
  utmTermField: params.get('utm_term') || ''
};
for (const [id, value] of Object.entries(trackingFields)) {
  const field = document.querySelector(`#${id}`);
  if (field) field.value = value;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

const form = document.querySelector('#joinForm');
const result = document.querySelector('#formResult');

async function loadBetaStatus(){
  const el=document.querySelector('#betaStatus'); if(!el) return;
  try{ const s=await api('/api/beta/status'); el.textContent=s.open?`נותרו ${s.remaining} מקומות בבטא החינמית`:'הבטא מלאה כרגע — הרשמה תיכנס לרשימת המתנה'; }catch{}
}
loadBetaStatus();

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submittedForm = event.currentTarget;
    const submitButton = submittedForm.querySelector('button[type="submit"], button:not([type])');
    const payload = Object.fromEntries(new FormData(submittedForm).entries());
    if (submitButton) submitButton.disabled = true;
    if (result) result.textContent = 'שולח הרשמה...';
    try {
      const data = await api('/api/families', { method: 'POST', body: JSON.stringify(payload) });
      if (data.waitlist) { if (result) result.textContent = 'הבטא מלאה כרגע. נכנסתם לרשימת המתנה וניצור קשר כשייפתח מקום.'; submittedForm.reset(); await loadBetaStatus(); return; }
      const link = new URL(`dashboard.html?token=${encodeURIComponent(data.family.managementToken)}`, location.href).href;
      const warnings = Array.isArray(data.warnings) && data.warnings.length
        ? `<br><strong>שים לב:</strong><br>${data.warnings.map((warning) => `• ${String(warning).replace(/[&<>\"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]))}`).join('<br>')}<br>`
        : '';
      if (result) {
        result.innerHTML = `המשפחה נוצרה בהצלחה.<br><br>
          ${warnings}
          <strong>קישור ניהול פרטי:</strong><br>
          <a href="${link}" target="_blank" rel="noopener">פתחו את דף הניהול האישי</a><br>
          <small>${link}</small><br><br>
          אם הגדרתם מייל וסיסמה, תוכלו להיכנס בהמשך גם דרך <a href="/login.html">כניסה לאזור אישי</a>.<br><br>
          חשוב: שמרו את הקישור. דרכו מנהלים את המשפחה, השעה היומית, היסטוריית הבדיקות והשהיית השירות.<br><br>
          השלבים הבאים:<br>
          1. פתחו את קישור הניהול.<br>
          2. ודאו שהאדם המבוגר מאשר ב־WhatsApp לפני הפעלה.<br>
          3. אחרי אישור, שלחו בדיקה כדי לוודא שהכול עובד.<br>
          4. ודאו שאיש הקשר להתראה נכון.`;
      }
      submittedForm.reset();
      for (const [id, value] of Object.entries(trackingFields)) {
        const field = document.querySelector(`#${id}`);
        if (field) field.value = value;
      }
    } catch (err) {
      if (result) result.textContent = err.message;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
