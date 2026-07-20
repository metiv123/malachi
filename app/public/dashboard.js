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
function outboundStatusLabel(status) {
  return {
    sent: 'נשלח ל־WhatsApp',
    delivered: 'נמסר לנמען',
    read: 'נקרא',
    failed: 'נכשל',
    ignored: 'לא שויך'
  }[status] || status || 'נשלח ל־WhatsApp';
}
function outboundStatusClass(status) {
  return { read:'ok', delivered:'ok', sent:'pending', failed:'danger', ignored:'warning' }[status] || 'pending';
}
function outboundStatusHint(status) {
  if (status === 'read') return 'הנמען פתח/קרא את ההודעה ב־WhatsApp.';
  if (status === 'delivered') return 'ההודעה הגיעה למכשיר של הנמען. זה עדיין לא אומר שהוא קרא.';
  if (status === 'sent') return 'Meta/WhatsApp קיבלו את ההודעה לשליחה. עדיין אין אישור מסירה לנמען.';
  if (status === 'failed') return 'השליחה נכשלה. צריך לבדוק מספר, תבנית WhatsApp או הרשאות Meta.';
  return 'סטטוס לא מזוהה מהמערכת.';
}
function actionHint(status){
  if(status==='distress') return 'סטטוס ישן ממודל קודם. בגרסת הבטא החדשה ההתראה למשפחה נשלחת בעיקר כשאין תגובה.';
  if(status==='no_response') return 'המלצה: להתקשר ולוודא שהכול בסדר. ייתכן שהטלפון לא זמין או שהאדם לא ראה את ההודעה.';
  if(status==='sent') return 'ממתינים לתגובה. אם לא תהיה תגובה בזמן — תישלח התראה.';
  if(status==='ok') return 'הכול תקין להיום. לא נשלחה הודעה למשפחה.';
  if(status==='greeting_sent') return 'נשלחה דרישת שלום לאנשי הקשר שאישרו קבלת התראות.';
  return 'עדיין לא נשלחה בדיקה היום.';
}

function addElderCard(open = false) {
  return `<section class="dashboard-card setup-card">
    <span class="card-kicker">הוספה</span>
    <h3>הוספת מבוגר נוסף לבדיקה יומית</h3>
    <p>אפשר לנהל כמה הורים/מבוגרים באותו אזור אישי. לכל אחד תהיה שעת בדיקה ואפשר להוסיף לו כמה בני משפחה להתראות.</p>
    <details class="edit-box" ${open ? 'open' : ''}><summary>+ הוסף/י מבוגר</summary>
      <form class="dashboard-form" onsubmit="addElder(event)">
        <label>שם ההורה / האדם המבוגר<input name="elderName" required placeholder="למשל: רחל"></label>
        <label>טלפון WhatsApp של ההורה<input name="elderPhone" required placeholder="0521234567 או +972521234567"></label>
        <label>שעת בדיקה יומית<input type="time" name="dailyCheckTime" required value="09:00"></label>
        <label>שם בן/בת משפחה ראשון להתראה<input name="contactName" placeholder="אפשר להשאיר ריק — נשתמש בבן המשפחה הראשי"></label>
        <label>טלפון בן/בת משפחה ראשון להתראה<input name="contactPhone" placeholder="אפשר להשאיר ריק — נשתמש בטלפון בן המשפחה"></label>
        <label class="check dashboard-consent"><input type="checkbox" name="elderConsent" required> אני מצהיר/ה שהאדם יודע או יקבל הסבר, והשירות יופעל רק לאחר אישורו/ה ב־WhatsApp.</label>
        <button class="button primary" type="submit">שמירת המבוגר</button>
      </form>
    </details>
  </section>`;
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
    const eldersMarkup = family.elders.map((elder) => {
      const contacts = (elder.contacts || [elder.contact].filter(Boolean));
      return `<section class="dashboard-card elder-card">
        <div class="card-head">
          <div>
            <span class="card-kicker">הורה / אדם מבוגר</span>
            <h3>${esc(elder.name)}</h3>
          </div>
          <span class="status ${elder.active ? 'ok' : 'warning'}">${elder.active ? 'פעיל' : 'מושהה'}</span>
        </div>
        <div class="dashboard-grid compact-grid">
          <div><b>טלפון</b><span>${esc(elder.whatsappPhone)}</span></div>
          <div><b>שעה יומית</b><span>${esc(elder.dailyCheckTime)}</span></div>
          <div><b>אישור ההורה</b><span>${optInLabel(elder.optInStatus)}</span></div>
          <div><b>מצב אחרון</b><span>${statusLabel(elder.latestCheck?.status)}</span></div>
        </div>
        <div class="today-card ${statusClass(elder.latestCheck?.status)}"><b>${statusLabel(elder.latestCheck?.status)}</b><p>${actionHint(elder.latestCheck?.status)}</p></div>
        <section class="mini-section">
          <div class="mini-title"><h4>בני משפחה שמקבלים התראות</h4><button class="tiny" onclick="resendElderOptIn('${elder.id}')">שלח אישור להורה</button></div>
          <p class="small">אפשר להוסיף כמה בני משפחה. אם אין תגובה מהמבוגר — כל מי שאישר יקבל התראה.</p>
          <div class="contact-list">${contacts.map((c) => `<article><b>${esc(c.name)}</b><span>${esc(c.whatsappPhone)}</span><small>${contactOptInLabel(c.optInStatus)}</small><div><button class="tiny" onclick="resendContactOptIn('${c.id}')">שלח אישור</button> ${contacts.length > 1 ? `<button class="tiny danger-text" onclick="deleteContact('${c.id}')">מחיקה</button>` : ''}</div></article>`).join('')}</div>
        </section>
        <details class="edit-box"><summary>עריכת פרטי ההורה</summary>
          <form onsubmit="updateElder(event, '${elder.id}')">
            <label>שם<input name="elderName" value="${esc(elder.name)}"></label>
            <label>טלפון WhatsApp<input name="elderPhone" value="${esc(elder.whatsappPhone)}"></label>
            <label>שעה יומית<input type="time" name="dailyCheckTime" value="${esc(elder.dailyCheckTime)}"></label>
            <label>שם איש קשר להתראה<input name="contactName" value="${esc(elder.contact?.name || '')}"></label>
            <label>טלפון איש קשר להתראה<input name="contactPhone" value="${esc(elder.contact?.whatsappPhone || '')}"></label>
            <button class="button primary" type="submit">שמירה</button>
          </form>
        </details>
        <details class="edit-box"><summary>+ הוספת בן/בת משפחה נוסף להתראות</summary>
          <form onsubmit="addContact(event, '${elder.id}')">
            <label>שם בן/בת משפחה<input name="contactName" required></label>
            <label>טלפון WhatsApp<input name="contactPhone" required></label>
            <button class="button primary" type="submit">הוספה</button>
          </form>
        </details>
        <details class="edit-box"><summary>היסטוריה ולוג הודעות</summary>
          <div id="history-${elder.id}" class="history-box">טוען היסטוריה...</div>
          <div id="messages-${elder.id}" class="history-box">טוען לוג הודעות...</div>
        </details>
        <div class="dashboard-actions quiet-actions">
          <button class="button secondary" onclick="sendCheck('${elder.id}')">שלח בדיקה עכשיו</button>
          <button class="button secondary" onclick="setActive('${elder.id}', ${!elder.active})">${elder.active ? 'השהה שירות' : 'הפעל שירות'}</button>
        </div>
      </section>`;
    }).join('');
    root.innerHTML = `<section class="personal-dashboard">
      <section class="dashboard-card hero-card">
        <div>
          <span class="card-kicker">אזור אישי</span>
          <h2>${esc(family.ownerName)}</h2>
          <p>${esc(family.ownerEmail || 'מייל כניסה עדיין לא הוגדר')}</p>
        </div>
        <div class="dashboard-actions top-actions">
          <button class="button primary" onclick="copyShare()">שיתוף</button>
          <a class="button secondary" href="${pageUrl(`feedback.html?token=${encodeURIComponent(token)}`)}">פידבק</a>
        </div>
      </section>
      <section class="dashboard-card account-card">
        <div class="card-head"><div><span class="card-kicker">חשבון</span><h3>כניסה וניהול</h3></div><button class="tiny" onclick="logout()">יציאה</button></div>
        <details class="edit-box"><summary>עדכון מייל או סיסמה</summary>
          <form onsubmit="setPassword(event)">
            <label>מייל כניסה<input type="email" name="email" required value="${esc(family.ownerEmail || '')}" autocomplete="email"></label>
            <label>סיסמה חדשה<input type="password" name="password" required placeholder="לפחות 8 תווים" autocomplete="new-password"></label>
            <button class="button primary" type="submit">שמירת מייל וסיסמה</button>
          </form>
        </details>
        <details class="edit-box"><summary>פעולות מתקדמות</summary>
          <div class="dashboard-actions quiet-actions">
            <button class="button secondary" onclick="regenerateToken()">קישור ניהול חדש</button>
            <button class="button secondary danger-action" onclick="deleteFamily()">מחיקת המשפחה והמידע</button>
          </div>
          <p class="small">קישור ניהול פרטי לגיבוי: ${esc(location.href)}</p>
        </details>
      </section>
      ${family.elders.length === 0 ? addElderCard(true) : `${eldersMarkup}${addElderCard(false)}`}
    </section>`
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
      box.innerHTML = `<h4>לוג הודעות אחרונות</h4><ul class="message-log">${messages.slice(0, 10).map((m) => `<li>${new Date(m.createdAt).toLocaleString('he-IL')} — ${esc(messageKindLabel(m.kind))} · ${esc(m.to || '')}<br><span class="status ${outboundStatusClass(m.status || 'sent')}">${esc(outboundStatusLabel(m.status || 'sent'))}</span> <small>${esc(outboundStatusHint(m.status || 'sent'))}</small>${m.error ? `<br><small class="danger-text">${esc(m.error)}</small>` : ''}</li>`).join('')}</ul>`;
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
window.sendCheck = async (elderId) => { await api(`/api/elders/${elderId}/send-check`, { method:'POST', body:JSON.stringify({ token }) }); await load(); };
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
