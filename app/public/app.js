const ref = new URLSearchParams(location.search).get('ref') || new URLSearchParams(location.search).get('source') || 'direct';
const sourceField = document.querySelector('#sourceField');
if (sourceField) sourceField.value = ref;
async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
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
      const link = `${location.origin}/dashboard.html?token=${encodeURIComponent(data.family.managementToken)}`;
      result.innerHTML = `המשפחה נוצרה בהצלחה.\n\nקישור ניהול פרטי:\n${link}\n\nחשוב: שמרו את הקישור. דרכו מנהלים את המשפחה, השעה היומית, היסטוריית הבדיקות והשהיית השירות.\n\nהשלבים הבאים:\n1. פתחו את קישור הניהול.\n2. אשרו Opt-in בדמו / ודאו שהאדם המבוגר מאשר בוואטסאפ בחיבור אמיתי.\n3. לחצו 'שלח בדיקה עכשיו' כדי לבדוק את הזרימה.\n4. ודאו שאיש הקשר נכון.`;
      event.currentTarget.reset();
    } catch (err) {
      result.textContent = err.message;
    }
  });
}
