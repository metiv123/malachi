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
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
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
      result.textContent = 'המשתמש נוצר בהצלחה. מעבירים אותך לאזור האישי…';
      setTimeout(() => { location.href = '/dashboard.html'; }, 600);
    } catch (err) {
      if (result) result.textContent = err.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
