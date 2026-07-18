const token = new URLSearchParams(location.search).get('token');
const root = document.querySelector('#familyBox');

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
}

function statusLabel(status) {
  return { sent:'ממתין לתגובה', ok:'אני בסדר', distress:'התראת מצוקה ישנה', no_response:'לא התקבלה תגובה', failed:'נכשל' }[status] || 'אין בדיקה עדיין';
}
function statusClass(status){ return { ok:'ok', distress:'danger', no_response:'warning', sent:'pending', failed:'danger' }[status] || 'pending'; }
function optInLabel(status){ return { pending:'ממתין לאישור ההורה', approved:'מאושר', declined:'בוטל/הוסר' }[status] || 'לא ידוע'; }
function actionHint(status){
  if(status==='distress') return 'סטטוס ישן ממודל קודם. בגרסת הבטא החדשה ההתראה למשפחה נשלחת בעיקר כשאין תגובה.';
  if(status==='no_response') return 'המלצה: להתקשר ולוודא שהכול בסדר. ייתכן שהטלפון לא זמין או שהאדם לא ראה את ההודעה.';
  if(status==='sent') return 'ממתינים לתגובה. אם לא תהיה תגובה בזמן — תישלח התראה.';
  if(status==='ok') return 'הכול תקין להיום. לא נשלחה הודעה למשפחה.';
  return 'עדיין לא נשלחה בדיקה היום.';
}

function shareText() {
  const ref = token ? `family_referral_${token.slice(0,8)}` : 'family_referral';
  return `מצאתי כלי חינמי בשם מלאכי.\nהוא שולח להורה מבוגר הודעת WhatsApp כל בוקר, ואם אין תשובה — מעדכן בן משפחה.\nבלי אפליקציה ובלי מצלמות.\n${location.origin}/?ref=${encodeURIComponent(ref)}`;
}

async function copyShare() {
  const text = shareText();
  try { await navigator.clipboard.writeText(text); alert('טקסט השיתוף הועתק'); }
  catch { prompt('העתיקו את הטקסט:', text); }
}

async function load() {
  if (!token) { root.innerHTML = '<article class="family"><h2>חסר קישור ניהול</h2><p>כדי לראות דשבורד משפחתי צריך לפתוח את הקישור הפרטי שקיבלתם אחרי ההרשמה.</p><p><a class="button primary" href="/">חזרה להרשמה</a></p></article>'; return; }
  try {
    const { family } = await api(`/api/family?token=${encodeURIComponent(token)}`);
    root.innerHTML = `<article class="family"><h2>${esc(family.ownerName)}</h2>
      <p class="small">קישור ניהול פרטי: ${esc(location.href)}</p>
      <button class="button primary" onclick="copyShare()">העתקת הודעת שיתוף למשפחה נוספת</button> <a class="button secondary" href="/feedback.html">שליחת פידבק</a> <button class="button secondary" onclick="regenerateToken()">יצירת קישור ניהול חדש</button> <button class="button secondary" onclick="deleteFamily()">מחיקת המשפחה והמידע</button>
      ${family.elders.map((elder) => `
      <div class="elder">
        <h3>${esc(elder.name)}</h3>
        <p>טלפון: ${esc(elder.whatsappPhone)}</p>
        <p>שעה יומית: ${esc(elder.dailyCheckTime)}</p>
        <p>אנשי קשר להתראה:</p><ul>${(elder.contacts || [elder.contact].filter(Boolean)).map((c) => `<li>${esc(c.name)} (${esc(c.whatsappPhone)}) ${elder.contacts?.length > 1 ? `<button class="tiny" onclick="deleteContact('${c.id}')">מחיקה</button>` : ''}</li>`).join('')}</ul>
        <p>אישור WhatsApp של ההורה: ${optInLabel(elder.optInStatus)} · פעיל: ${elder.active ? 'כן' : 'לא'}</p>
        <div class="today-card ${statusClass(elder.latestCheck?.status)}"><b>מצב אחרון: ${statusLabel(elder.latestCheck?.status)}</b><p>${actionHint(elder.latestCheck?.status)}</p></div>
        <div id="history-${elder.id}" class="history-box">טוען היסטוריה...</div>
        <div id="messages-${elder.id}" class="history-box">טוען לוג הודעות...</div>
        <details class="edit-box"><summary>עריכת פרטים</summary>
          <form onsubmit="updateElder(event, '${elder.id}')">
            <label>שם<input name="elderName" value="${esc(elder.name)}"></label>
            <label>טלפון WhatsApp<input name="elderPhone" value="${esc(elder.whatsappPhone)}"></label>
            <label>שעה יומית<input type="time" name="dailyCheckTime" value="${esc(elder.dailyCheckTime)}"></label>
            <label>שם איש קשר להתראה<input name="contactName" value="${esc(elder.contact?.name || '')}"></label>
            <label>טלפון איש קשר להתראה<input name="contactPhone" value="${esc(elder.contact?.whatsappPhone || '')}"></label>
            <button class="button primary" type="submit">שמירה</button>
          </form>
        </details>
        <details class="edit-box"><summary>הוספת איש קשר להתראה נוסף</summary>
          <form onsubmit="addContact(event, '${elder.id}')">
            <label>שם איש קשר להתראה<input name="contactName" required></label>
            <label>טלפון איש קשר להתראה<input name="contactPhone" required></label>
            <button class="button primary" type="submit">הוספה</button>
          </form>
        </details>
        <div class="dashboard-actions">
          <button class="button secondary" onclick="sendCheck('${elder.id}')">שלח בדיקה עכשיו</button>
          <button class="button secondary" onclick="setActive('${elder.id}', ${!elder.active})">${elder.active ? 'השהה שירות' : 'הפעל שירות'}</button>
          ${elder.latestCheck?.status === 'sent' ? `
            <button class="button secondary" onclick="respond('${elder.id}','${elder.latestCheck.id}','ok')">דמה אני בסדר</button>
            <button class="button secondary" onclick="noResponse()">דמה אין תגובה</button>` : ''}
          <button class="button secondary" onclick="mockWebhookText('${elder.whatsappPhone}','הסרה')">דמה הסרה בוואטסאפ</button>
        </div>
      </div>`).join('')}</article>`;
  } catch (err) { root.innerHTML = `<article class="family"><h2>לא מצאנו את המשפחה</h2><p>ייתכן שהקישור שגוי, הוחלף או נמחק.</p><p class="small">${esc(err.message)}</p><p><a class="button primary" href="/">חזרה לדף הבית</a></p></article>`; return; }
  await loadHistories();
}

async function loadHistories() {
  const boxes = document.querySelectorAll('[id^="history-"]');
  for (const box of boxes) {
    const elderId = box.id.replace('history-', '');
    try {
      const { checks } = await api(`/api/elders/${elderId}/history?token=${encodeURIComponent(token)}`);
      if (!checks.length) { box.innerHTML = '<p class="small">אין עדיין היסטוריית בדיקות.</p>'; continue; }
      box.innerHTML = `<h4>היסטוריה אחרונה</h4><ul>${checks.slice(0, 7).map((c) => `<li>${new Date(c.sentAt || c.scheduledAt).toLocaleString('he-IL')} — ${statusLabel(c.status)}</li>`).join('')}</ul>`;
    } catch (err) { box.textContent = 'לא ניתן לטעון היסטוריה'; }
  }
}


window.copyShare = copyShare;
window.regenerateToken = async () => {
  if (!confirm('ליצור קישור ניהול חדש? הקישור הישן יפסיק להיות שימושי רק אחרי שתשתמשו בחדש.')) return;
  const data = await api('/api/family/regenerate-token', { method:'POST', body:JSON.stringify({ token }) });
  const newUrl = `${location.origin}/dashboard.html?token=${encodeURIComponent(data.managementToken)}`;
  alert(`קישור חדש נוצר. שמרו אותו עכשיו:
${newUrl}`);
  location.href = newUrl;
};
window.deleteFamily = async () => {
  if (!confirm('למחוק את המשפחה וכל המידע מהמערכת? פעולה זו לא ניתנת לשחזור ב-MVP.')) return;
  await api('/api/family/delete', { method:'POST', body:JSON.stringify({ token }) });
  root.innerHTML = '<p>המידע נמחק מהמערכת.</p>';
};
window.sendCheck = async (elderId) => { await api(`/api/elders/${elderId}/send-check`, { method:'POST', body:'{}' }); await load(); };
window.setActive = async (elderId, active) => { await api(`/api/elders/${elderId}/active`, { method:'POST', body:JSON.stringify({ token, active }) }); await load(); };
window.respond = async (elderId, checkId, response) => { await api('/api/mock/respond', { method:'POST', body:JSON.stringify({ elderId, checkId, response }) }); await load(); };
window.noResponse = async () => { await api('/api/jobs/no-responses', { method:'POST', body:JSON.stringify({ graceMinutes:0 }) }); await load(); };
window.mockWebhookText = async (from, text) => { await api('/api/mock/webhook', { method:'POST', body:JSON.stringify({ from, text }) }); await load(); };
window.addContact = async (event, elderId) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.token = token;
  await api(`/api/elders/${elderId}/contacts`, { method:'POST', body:JSON.stringify(payload) });
  await load();
};
window.deleteContact = async (contactId) => {
  if (!confirm('למחוק איש קשר זה?')) return;
  await api(`/api/contacts/${contactId}/delete`, { method:'POST', body:JSON.stringify({ token }) });
  await load();
};
window.updateElder = async (event, elderId) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.token = token;
  await api(`/api/elders/${elderId}/update`, { method:'POST', body:JSON.stringify(payload) });
  await load();
};
load();
