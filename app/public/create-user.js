const params = new URLSearchParams(location.search);
const API_BASE = (window.MALACHI_API_BASE || '').replace(/\/$/, '');
const trackingFields = {
  sourceField: params.get('utm_source') || params.get('source') || params.get('ref') || 'direct',
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

const form = document.querySelector('#createUserForm');
const result = document.querySelector('#createUserResult');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.marketingEmailConsent = Boolean(payload.marketingEmailConsent);
    if (submit) submit.disabled = true;
    if (result) result.textContent = 'יוצר משתמש...';
    try {
      const data = await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      if (data.waitlist) { result.textContent = 'הבטא מלאה כרגע. נכנסת לרשימת המתנה.'; return; }
      localStorage.setItem('malachi_management_token', data.family.managementToken);
      const authNote = data.emailVerificationLink
        ? `<br><strong>אימות מייל:</strong> נוצר קישור אימות. בשלב הבטא אם המייל לא נשלח אוטומטית, פתח/י את הקישור: <a href="${data.emailVerificationLink}" target="_blank" rel="noopener">אימות מייל</a><br>`
        : (data.authWarning ? `<br><strong>שים לב:</strong> ${data.authWarning}<br>` : '');
      result.innerHTML = `המשתמש נוצר בהצלחה.${authNote}<br><a class="button primary" href="/dashboard.html?token=${encodeURIComponent(data.family.managementToken)}">מעבר לאזור האישי</a>`;
      setTimeout(() => { location.href = `/dashboard.html?token=${encodeURIComponent(data.family.managementToken)}`; }, 800);
    } catch (err) {
      if (result) result.textContent = err.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
