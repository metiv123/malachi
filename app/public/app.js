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
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const data = await api('/api/families', { method: 'POST', body: JSON.stringify(payload) });
      if (data.waitlist) { result.textContent = 'הבטא מלאה כרגע. נכנסתם לרשימת המתנה וניצור קשר כשייפתח מקום.'; event.currentTarget.reset(); await loadBetaStatus(); return; }
      const link = new URL(`dashboard.html?token=${encodeURIComponent(data.family.managementToken)}`, location.href).href;
      result.innerHTML = `המשפחה נוצרה בהצלחה.\n\nקישור ניהול פרטי:\n${link}\n\nחשוב: שמרו את הקישור. דרכו מנהלים את המשפחה, השעה היומית, היסטוריית הבדיקות והשהיית השירות.\n\nהשלבים הבאים:\n1. פתחו את קישור הניהול.\n2. ודאו שהאדם המבוגר מאשר ב־WhatsApp לפני הפעלה.\n3. אחרי אישור, שלחו בדיקה כדי לוודא שהכול עובד.\n4. ודאו שאיש הקשר להתראה נכון.`;
      event.currentTarget.reset();
      for (const [id, value] of Object.entries(trackingFields)) {
        const field = document.querySelector(`#${id}`);
        if (field) field.value = value;
      }
    } catch (err) {
      result.textContent = err.message;
    }
  });
}
