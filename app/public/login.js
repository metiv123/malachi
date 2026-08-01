const API_BASE = (window.MALACHI_API_BASE || '').replace(/\/$/, '');
const form = document.querySelector('#loginForm');
const result = document.querySelector('#loginResult');

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());
    if (submit) submit.disabled = true;
    if (result) result.textContent = 'בודק פרטים...';
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      location.href = '/dashboard.html';
    } catch (err) {
      if (result) result.textContent = err.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
