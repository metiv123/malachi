const urlToken = new URLSearchParams(location.search).get('token');
const token = urlToken || localStorage.getItem('malachi_management_token');
if (urlToken) localStorage.setItem('malachi_management_token', urlToken);
const root = document.querySelector('#familyBox');
const API_BASE = (window.MALACHI_API_BASE || '').replace(/\/$/, '');

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
}

function pageUrl(page = '') {
  return new URL(page || './', location.href).href;
}

function statusLabel(status) {
  return { sent:'ממתין לתגובה', ok:'אני בסדר', greeting_sent:'נשלח ד״ש למשפחה', distress:'התראת מצוקה ישנה', no_response:'לא התקבלה תגובה', failed:'נכשל' }[status] || 'אין בדיקה עדיין';
}
function statusClass(status){ return { ok:'ok', greeting_sent:'ok', distress:'danger', no_response:'warning', sent:'pending', failed:'danger' }[status] || 'pending'; }
function optInLabel(status){ return { pending:'ממתין לאישור ההורה', approved:'מאושר', declined:'בוטל/הוסר' }[status] || 'לא ידוע'; }
function contactOptInLabel(status){ return { pending:'ממתין לאישור בן/בת המשפחה', approved:'מאושר לקבלת התראות', declined:'לא אישר/ה התראות' }[status] || 'לא ידוע'; }
function messageKindLabel(kind) {
  return {
    daily_check: 'בדיקת בוקר',
    ok_ack: 'אישור שהתקבלה תשובת אני בסדר',
    no_response_alert: 'התראת אין תגובה למשפחה',
    distress_alert: 'התראת מצוקה ישנה',
    family_greeting: 'ד״ש למשפחה',
    opt_in: 'בקשת אישור WhatsApp להורה',
    contact_optin: 'בקשת אישור WhatsApp לבן/בת משפחה'
  }[kind] || kind || 'הודעה';
}
function actionHint(status){
  if(status==='distress') return 'סטטוס ישן ממודל קודם. בגרסת הבטא החדשה ההתראה למשפחה נשלחת בעיקר כשאין תגובה.';
  if(status==='no_response') return 'המלצה: להתקשר ולוודא שהכול בסדר. ייתכן שהטלפון לא זמין או שהאדם לא ראה את ההודעה.';
  if(status==='sent') return 'ממתינים לתגובה. אם לא תהיה תגובה בזמן — תישלח התראה.';
  if(status==='ok') return 'הכול תקין להיום. לא נשלחה הודעה למשפחה.';
  if(status==='greeting_sent') return 'נשלחה דרישת שלום לאנשי הקשר שאישרו קבלת התראות.';
  return 'עדיין לא נשלחה בדיקה היום.';
}

function shareText() {
  const ref = token ? `family_referral_${token.slice(0,8)}` : 'family_referral';
  return `מצאתי כלי חינמי בשם מלאכי.\nהוא שולח להורה מבוגר הודעת WhatsApp כל בוקר, ואם אין תשובה — מעדכן בן משפחה.\nבלי אפליקציה ובלי מצלמות.\n${new URL(`./?ref=${encodeURIComponent(ref)}`, location.href).href}`;
}

async function copyShare() {
  const text = shareText();
  try { await navigator.clipboard.writeText(text); alert('טקסט השיתוף הועתק'); }
  catch { prompt('העתיקו את הטקסט:', text); }
}

async function load() {
  if (!token) { root.innerHTML = `<article class="family"><h2>צריך להתחבר</h2><p>כדי לראות את האזור האישי צריך להתחבר עם מייל וסיסמה או לפתוח את קישור הניהול הפרטי שקיבלתם אחרי ההרשמה.</p><p><a class="button primary" href="${pageUrl('login.html')}">כניסה לאזור אישי</a> <a class="button secondary" href="${pageUrl('index.html')}">חזרה להרשמה</a></p></article>`; return; }
  try {
    const { family } = await api(`/api/family?token=${encodeURIComponent(token)}`);
    root.innerHTML = `<article class="family"><h2>${esc(family.ownerName)}</h2>
      <p class="small">אזור אישי משפחתי · ${esc(family.ownerEmail || 'מייל כניסה עדיין לא הוגדר')}</p>
      <p class="small">קישור ניהול פרטי לגיבוי: ${esc(location.href)}</p>
      <button class="button primary" onclick="copyShare()">העתקת הודעת שיתוף למשפחה נוספת</button> <a class="button secondary" href="${pageUrl(`feedback.html?token=${encodeURIComponent(token)}`)}">שליחת פידבק</a> <button class="button secondary" onclick="regenerateToken()">יצירת קישור ניהול חדש</button> <button class="button secondary" onclick="deleteFamily()">מחיקת המשפחה והמידע</button>
      <details class="edit-box" open><summary>חשבון וכניסה</summary>
        <form onsubmit="setPassword(event)">
          <label>מייל כניסה<input type="email" name="email" required value="${esc(family.ownerEmail || '')}" autocomplete="email"></label>
          <label>סיסמה חדשה<input type="password" name="password" required placeholder="לפחות 8 תווים" autocomplete="new-password"></label>
          <button class="button primary" type="submit">שמירת מייל וסיסמה</button>
          <button class="button secondary" type="button" onclick="logout()">יציאה מהמכשיר הזה</button>
        </form>
      </details>
      ${family.elders.length === 0 ? `<section class="note"><h3>הוספת פרטי משפחה</h3><p>עדיין לא הוגדר הורה לבדיקה. מלא/י את הפרטים כדי להפעיל את מלאכי.</p>
        <form onsubmit="addElder(event)">
          <label>שם ההורה / האדם המבוגר<input name="elderName" required placeholder="למשל: רחל"></label>
          <label>טלפון WhatsApp של ההורה<input name="elderPhone" required placeholder="0521234567 או +972521234567"></label>
          <label>שעת בדיקה יומית<input type="time" name="dailyCheckTime" required value="09:00"></label>
          <label>שם איש קשר להתראה<input name="contactName" placeholder="אפשר להשאיר ריק — נשתמש בבן המשפחה הראשי"></label>
          <label>טלפון איש קשר להתראה<input name="contactPhone" placeholder="אפשר להשאיר ריק — נשתמש בטלפון בן המשפחה"></label>
          <button class="button primary" type="submit">שמירת פרטי המשפחה</button>
        </form>
      </section>` : ''}
      ${family.elders.map((elder) => `
      <div class="elder">
        <h3>${esc(elder.name)}</h3>
        <p>טלפון: ${esc(elder.whatsappPhone)}</p>
        <p>שעה יומית: ${esc(elder.dailyCheckTime)}</p>
        <p>אנשי קשר להתראה:</p><ul>${(elder.contacts || [elder.contact].filter(Boolean)).map((c) => `<li>${esc(c.name)} (${esc(c.whatsappPhone)}) — ${contactOptInLabel(c.optInStatus)} <button class="tiny" onclick="resendContactOptIn('${c.id}')">שלח אישור שוב</button> ${elder.contacts?.length > 1 ? `<button class="tiny" onclick="deleteContact('${c.id}')">מחיקה</button>` : ''}</li>`).join('')}</ul>
        <p>אישור WhatsApp של ההורה: ${optInLabel(elder.optInStatus)} <button class="tiny" onclick="resendElderOptIn('${elder.id}')">שלח אישור שוב</button> · פעיל: ${elder.active ? 'כן' : 'לא'}</p>
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
  } catch (err) { root.innerHTML = `<article class="family"><h2>לא מצאנו את המשפחה</h2><p>ייתכן שהקישור שגוי, הוחלף או נמחק.</p><p class="small">${esc(err.message)}</p><p><a class="button primary" href="${pageUrl('index.html')}">חזרה לדף הבית</a></p></article>`; return; }
  await loadHistories();
  await loadOutboundMessages();
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

async function loadOutboundMessages() {
  const boxes = document.querySelectorAll('[id^="messages-"]');
  for (const box of boxes) {
    const elderId = box.id.replace('messages-', '');
    try {
      const { messages } = await api(`/api/outbound-messages?token=${encodeURIComponent(token)}&elderId=${encodeURIComponent(elderId)}`);
      if (!messages.length) { box.innerHTML = '<p class="small">אין עדיין לוג הודעות.</p>'; continue; }
      box.innerHTML = `<h4>לוג הודעות אחרונות</h4><ul>${messages.slice(0, 10).map((m) => `<li>${new Date(m.createdAt).toLocaleString('he-IL')} — ${esc(messageKindLabel(m.kind))} · ${esc(m.to || '')} · ${esc(m.status || 'נשלח')}</li>`).join('')}</ul>`;
    } catch (err) { box.textContent = 'לא ניתן לטעון לוג הודעות'; }
  }
}


window.copyShare = copyShare;
window.regenerateToken = async () => {
  if (!confirm('ליצור קישור ניהול חדש? הקישור הישן יפסיק להיות שימושי רק אחרי שתשתמשו בחדש.')) return;
  const data = await api('/api/family/regenerate-token', { method:'POST', body:JSON.stringify({ token }) });
  const newUrl = new URL(`dashboard.html?token=${encodeURIComponent(data.managementToken)}`, location.href).href;
  alert(`קישור חדש נוצר. שמרו אותו עכשיו:
${newUrl}`);
  location.href = newUrl;
};
window.deleteFamily = async () => {
  if (!confirm('למחוק את המשפחה וכל המידע מהמערכת? פעולה זו לא ניתנת לשחזור ב-MVP.')) return;
  await api('/api/family/delete', { method:'POST', body:JSON.stringify({ token }) });
  root.innerHTML = '<p>המידע נמחק מהמערכת.</p>';
};
window.setPassword = async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.token = token;
  await api('/api/auth/set-password', { method:'POST', body:JSON.stringify(payload) });
  alert('המייל והסיסמה נשמרו. בפעם הבאה אפשר להיכנס דרך דף הכניסה.');
  await load();
};
window.logout = () => {
  localStorage.removeItem('malachi_management_token');
  location.href = '/login.html';
};
window.sendCheck = async (elderId) => { await api(`/api/elders/${elderId}/send-check`, { method:'POST', body:'{}' }); await load(); };
window.resendElderOptIn = async (elderId) => {
  if (!confirm('לשלוח שוב הודעת אישור WhatsApp להורה?')) return;
  await api(`/api/elders/${elderId}/resend-optin`, { method:'POST', body:JSON.stringify({ token }) });
  await load();
};
window.resendContactOptIn = async (contactId) => {
  if (!confirm('לשלוח שוב הודעת אישור WhatsApp לבן/בת המשפחה?')) return;
  await api(`/api/contacts/${contactId}/resend-optin`, { method:'POST', body:JSON.stringify({ token }) });
  await load();
};
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
window.addElder = async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.token = token;
  await api('/api/elders', { method:'POST', body:JSON.stringify(payload) });
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
