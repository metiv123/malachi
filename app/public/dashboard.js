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

function lockSubmit(event, text = 'שומר…') {
  const button = event?.currentTarget?.querySelector?.('button[type="submit"]');
  if (!button) return () => {};
  const original = button.textContent;
  button.disabled = true;
  button.textContent = text;
  return () => {
    button.disabled = false;
    button.textContent = original;
  };
}

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
}

function pageUrl(page = '') {
  return new URL(page || './', location.href).href;
}

function statusLabel(status) {
  return { sent:'נשלחה הודעה — מחכים ללחיצה על “אני בסדר”', ok:'התקבל אישור שהכול בסדר', greeting_sent:'נשלח ד״ש למשפחה', distress:'התראת מצוקה ישנה', no_response:'לא התקבלה תגובה', failed:'השליחה נכשלה' }[status] || 'לא נשלחה עדיין בדיקה היום';
}
function statusClass(status){ return { ok:'ok', greeting_sent:'ok', distress:'danger', no_response:'warning', sent:'pending', failed:'danger' }[status] || 'pending'; }
function optInLabel(status){ return { pending:'עדיין לא אושר לקבל הודעות WhatsApp', approved:'מאושר לקבל הודעות WhatsApp', declined:'בוטל/הוסר' }[status] || 'לא ידוע'; }
function contactOptInLabel(status){ return { pending:'ממתין לאישור בן/בת המשפחה', approved:'מאושר לקבלת התראות', declined:'לא אישר/ה התראות' }[status] || 'לא ידוע'; }
function messageKindLabel(kind) {
  return {
    daily_check: 'בדיקת בוקר',
    daily_reminder: 'תזכורת בדיקת בוקר',
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
  if(status==='sent') return 'ממתינים לתגובה. אם לא תהיה תגובה בזמן — נשלח קודם תזכורות למבוגר, ורק אחר כך התראה למשפחה.';
  if(status==='ok') return 'הכול תקין להיום. לא נשלחה הודעה למשפחה.';
  if(status==='greeting_sent') return 'נשלחה דרישת שלום לאנשי הקשר שאישרו קבלת התראות.';
  return 'עדיין לא נשלחה בדיקה היום.';
}

function alertDelayOptions(value = 30) {
  const current = Number(value || 30);
  return [15, 30, 45, 60].map((minutes) => `<option value="${minutes}" ${current === minutes ? 'selected' : ''}>${minutes === 60 ? 'שעה' : `${minutes} דקות`}</option>`).join('');
}

function alertRepeatOptions(value = 2) {
  const current = Number(value || 3);
  return [2, 3, 4].map((count) => `<option value="${count}" ${current === count ? 'selected' : ''}>${count} ניסיונות</option>`).join('');
}

function reminderPlanLabel(elder = {}) {
  const interval = Number(elder.noResponseGraceMinutes || 30);
  const attempts = Number(elder.noResponseAlertRepeatCount || 3);
  const total = interval * attempts;
  const intervalLabel = interval === 60 ? 'שעה' : `${interval} דקות`;
  const totalLabel = total >= 60 ? `${Math.round((total / 60) * 10) / 10} שעות` : `${total} דקות`;
  return `תזכורת כל ${intervalLabel} · ${attempts} ניסיונות למבוגר · התראה למשפחה אחרי כ־${totalLabel}`;
}

function shomerShabbatLabel(elder = {}) {
  return elder.shomerShabbat ? 'שומר שבת — בשבת ההודעה תישלח בשעה 21:00 במקום השעה הרגילה' : 'לפי השעה היומית הרגילה';
}


function parentPreparationNotice() {
  return `<section class="parent-prep-box">
    <b>לפני ששולחים להורה הודעה</b>
    <p>חשוב לדבר עם ההורה מראש, כדי שהודעת WhatsApp ממלאכי לא תיראה לו כמו ספאם או משהו מבלבל.</p>
    <div class="parent-script">
      <span>נוסח קצר שאפשר להגיד:</span>
      <p>“אמא/אבא, חיברתי אותך למלאכי. זה שירות קטן ששולח לך כל בוקר הודעת WhatsApp כדי לוודא שהכול בסדר. עוד רגע תקבל/י הודעה ממלאכי — רק ללחוץ אישור.”</p>
    </div>
  </section>`;
}

function addElderCard(open = false) {
  const form = `<form class="dashboard-form" onsubmit="addElder(event)">
    <div class="form-subtitle">פרטי האדם לבדיקה</div>
    <label>שם ההורה / האדם המבוגר<input name="elderName" required placeholder="למשל: רחל"></label>
    <label>טלפון WhatsApp של ההורה<input name="elderPhone" required placeholder="0521234567 או +972521234567"></label>
    <label>שעת בדיקה יומית<input type="time" name="dailyCheckTime" required value="09:00"></label>
    <label class="check dashboard-consent"><input type="checkbox" name="shomerShabbat"><span>שומר שבת (הודעה תישלח ביום שבת בשעה 21:00 במקום השעה הרגילה)</span></label>
    <div class="form-subtitle">בן משפחה ראשון להתראות</div>
    <p class="form-help">זה האדם הראשון שיקבל התראה אם אין מענה. אחרי שמירת המבוגר אפשר להוסיף בני משפחה נוספים.</p>
    <label>שם בן/בת משפחה ראשון להתראה<input name="contactName" placeholder="אפשר להשאיר ריק — נשתמש בבן המשפחה הראשי"></label>
    <label>טלפון בן/בת משפחה ראשון להתראה<input name="contactPhone" placeholder="אפשר להשאיר ריק — נשתמש בטלפון בן המשפחה"></label>
    <div class="form-subtitle">הגדרות אי־מענה</div>
    <label>כל כמה זמן לשלוח תזכורת אם אין מענה<select name="noResponseGraceMinutes">${alertDelayOptions(30)}</select></label>
    <label>כמה ניסיונות לפני התראה למשפחה<select name="noResponseAlertRepeatCount">${alertRepeatOptions(3)}</select></label>
    <p class="form-help">ברירת המחדל: הודעה ראשונה, 2 תזכורות, ורק אחר כך התראה לבני המשפחה.</p>
    ${parentPreparationNotice()}
    <label class="check dashboard-consent parent-prep-check"><input type="checkbox" name="elderConsent" required><span>דיברתי עם ההורה / האדם המבוגר, והוא יודע שעכשיו תגיע אליו הודעת WhatsApp ממלאכי לאישור.</span></label>
    <button class="button primary save-main" type="submit">שמירת המבוגר ושליחת הודעת אישור</button>
  </form>`;
  return `<section class="dashboard-card setup-card quiet-setup">
    <span class="card-kicker">הוספה</span>
    <h3>${open ? 'הוספת מבוגר לבדיקה יומית' : 'הוספת אדם נוסף'}</h3>
    <p>${open ? 'מגדירים למי נשלחת הבדיקה, באיזו שעה ומי יקבל עדכון במקרה שאין מענה.' : 'צרפו הורה או אדם מבוגר נוסף לאזור המשפחתי.'}</p>
    ${open ? form : `<details class="clean-details"><summary>פתיחת טופס הוספה</summary>${form}</details>`}
  </section>`;
}

function addContactForm(elderId) {
  return `<form class="dashboard-form compact-form" onsubmit="addContact(event, '${elderId}')">
    <label>שם בן/בת משפחה<input name="contactName" required></label>
    <label>טלפון WhatsApp<input name="contactPhone" required></label>
    <button class="button primary" type="submit">הוספת בן משפחה</button>
  </form>`;
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
      const canSendManualCheck = elder.active && elder.optInStatus === 'approved';
      const manualCheckNote = elder.optInStatus !== 'approved' ? 'אפשר לשלוח בדיקה רק אחרי שהאדם מאשר ב־WhatsApp.' : !elder.active ? 'השירות מושהה כרגע.' : '';
      const visibleContacts = contacts.slice(0, 3);
      const hiddenContactsCount = Math.max(0, contacts.length - visibleContacts.length);
      return `<section class="dashboard-card elder-card">
        <div class="card-head elder-card-head">
          <div>
            <span class="card-kicker">הורה / אדם מבוגר</span>
            <div class="elder-title-row"><h3>${esc(elder.name)}</h3><span class="status ${elder.active ? 'ok' : 'warning'}">${elder.active ? 'פעיל' : 'מושהה'}</span></div>
          </div>
          ${canSendManualCheck ? `<button class="button primary elder-primary-action" onclick="sendCheck('${elder.id}')">שלח הודעת בדיקה ב־WhatsApp עכשיו</button>` : `<span class="small elder-primary-action muted-action">${esc(manualCheckNote)}</span>`}
        </div>
        <div class="elder-summary-layout">
          <div class="today-card ${statusClass(elder.latestCheck?.status)}"><span class="today-label">המצב היום</span><b>${statusLabel(elder.latestCheck?.status)}</b><p>${actionHint(elder.latestCheck?.status)}</p></div>
          <dl class="elder-facts">
            <div><dt>בדיקה יומית</dt><dd>${esc(elder.dailyCheckTime)}</dd></div>
            <div><dt>שבת</dt><dd>${esc(shomerShabbatLabel(elder))}</dd></div>
            <div><dt>אי־מענה</dt><dd>${esc(reminderPlanLabel(elder))}</dd></div>
            <div><dt>WhatsApp</dt><dd>${esc(elder.whatsappPhone)}</dd></div>
            <div><dt>קבלת הודעות WhatsApp</dt><dd>${optInLabel(elder.optInStatus)} <button class="text-action" onclick="resendElderOptIn('${elder.id}')">שלח בקשת אישור שוב</button></dd></div>
          </dl>
        </div>
        <section class="mini-section contact-section">
          <div class="mini-title"><h4>בני משפחה להתראות</h4><span class="contact-count">${contacts.length}</span></div>
          <p class="small">אם אין תגובה מהמבוגר — נשלח קודם תזכורות למבוגר, ורק לאחר מכן בני המשפחה שאישרו יקבלו התראה.</p>
          <div class="contact-list clean-contact-list">${visibleContacts.map((c) => `<article class="contact-row"><span class="contact-avatar" aria-hidden="true">${esc(String(c.name || '').trim().charAt(0) || 'א')}</span><span class="contact-identity"><b>${esc(c.name)}</b><span>${esc(c.whatsappPhone)}</span></span><small class="contact-state">${contactOptInLabel(c.optInStatus)}</small></article>`).join('')}${hiddenContactsCount ? `<article class="contact-row more-card"><span class="contact-avatar" aria-hidden="true">+${hiddenContactsCount}</span><span class="contact-identity"><b>אנשי קשר נוספים</b><span>מופיעים באזור הניהול</span></span></article>` : ''}</div>
          <details class="clean-details manage-contacts"><summary>ניהול והוספת בני משפחה</summary>
            <div class="contact-list manage-contact-list">${contacts.map((c) => `<article><b>${esc(c.name)}</b><span>${esc(c.whatsappPhone)}</span><small>${contactOptInLabel(c.optInStatus)}</small><div><button class="tiny" onclick="resendContactOptIn('${c.id}')">שלח אישור</button> ${contacts.length > 1 ? `<button class="tiny danger-text" onclick="deleteContact('${c.id}')">מחיקה</button>` : ''}</div></article>`).join('')}</div>
            <div class="inline-add-contact"><h4>הוספת בן/בת משפחה נוסף</h4>${addContactForm(elder.id)}</div>
          </details>
        </section>
        <div class="elder-secondary-tools">
          <details class="edit-box"><summary>עריכת פרטים והגדרות</summary>
            <form onsubmit="updateElder(event, '${elder.id}')">
              <label>שם<input name="elderName" value="${esc(elder.name)}"></label>
              <label>טלפון WhatsApp<input name="elderPhone" value="${esc(elder.whatsappPhone)}"></label>
              <label>שעה יומית<input type="time" name="dailyCheckTime" value="${esc(elder.dailyCheckTime)}"></label>
              <label class="check dashboard-consent"><input type="checkbox" name="shomerShabbat" ${elder.shomerShabbat ? 'checked' : ''}><span>שומר שבת (הודעה תישלח ביום שבת בשעה 21:00 במקום השעה הרגילה)</span></label>
              <label>כל כמה זמן לשלוח תזכורת אם אין מענה<select name="noResponseGraceMinutes">${alertDelayOptions(elder.noResponseGraceMinutes || 30)}</select></label>
              <label>כמה ניסיונות לפני התראה למשפחה<select name="noResponseAlertRepeatCount">${alertRepeatOptions(elder.noResponseAlertRepeatCount || 3)}</select></label>
              <label>שם איש קשר להתראה<input name="contactName" value="${esc(elder.contact?.name || '')}"></label>
              <label>טלפון איש קשר להתראה<input name="contactPhone" value="${esc(elder.contact?.whatsappPhone || '')}"></label>
              <button class="button primary" type="submit">שמירה</button>
            </form>
          </details>
          <details class="edit-box"><summary>היסטוריה והודעות</summary>
            <div id="history-${elder.id}" class="history-box">טוען היסטוריה...</div>
            <div id="messages-${elder.id}" class="history-box">טוען לוג הודעות...</div>
          </details>
        </div>
        <div class="dashboard-actions quiet-actions">
          <button class="button secondary" onclick="setActive('${elder.id}', ${!elder.active})">${elder.active ? 'השהה שירות' : 'הפעל שירות'}</button>
        </div>
      </section>`;
    }).join('');
    const accountMarkup = `<section class="dashboard-card account-card quiet-account">
        <div class="card-head"><div><span class="card-kicker">חשבון</span><h3>הגדרות חשבון</h3></div><button class="tiny" onclick="logout()">יציאה</button></div>
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
      </section>`;
    root.innerHTML = `<section class="personal-dashboard">
      <section class="dashboard-card hero-card family-header-card">
        <div>
          <span class="card-kicker">המשפחה שלי</span>
          <h2>${esc(family.ownerName)}</h2>
          <p>${esc(family.ownerEmail || 'מייל כניסה עדיין לא הוגדר')}</p>
        </div>
        <div class="dashboard-actions top-actions">
          <button class="button primary" onclick="copyShare()">שיתוף</button>
          <a class="button secondary" href="${pageUrl(`feedback.html?token=${encodeURIComponent(token)}`)}">פידבק</a>
        </div>
      </section>
      ${family.elders.length === 0 ? `${addElderCard(true)}${accountMarkup}` : `${eldersMarkup}<div class="dashboard-utility-grid">${addElderCard(false)}${accountMarkup}</div>`}
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
window.sendCheck = async (elderId) => {
  if (!confirm('לשלוח עכשיו הודעת WhatsApp עם כפתור “אני בסדר”?')) return;
  try {
    await api(`/api/elders/${elderId}/send-check`, { method:'POST', body:JSON.stringify({ token }) });
    alert('הודעת בדיקה נשלחה ל־WhatsApp. אפשר לראות את סטטוס המסירה בלוג ההודעות.');
    await load();
  } catch (err) {
    alert(err.message || 'לא הצלחנו לשלוח את הודעת הבדיקה');
  }
};
window.resendElderOptIn = async (elderId) => {
  const ok = confirm('לפני השליחה חשוב לוודא שההורה יודע שהוא עומד לקבל הודעה ממלאכי.\n\nכדאי להגיד לו: “תקבל/י עכשיו הודעת WhatsApp ממלאכי — רק ללחוץ אישור.”\n\nלשלוח עכשיו בקשת אישור WhatsApp?');
  if (!ok) return;
  try {
    await api(`/api/elders/${elderId}/resend-optin`, { method:'POST', body:JSON.stringify({ token }) });
    alert('בקשת האישור נשלחה ל־WhatsApp.');
    await load();
  } catch (err) {
    alert(err.message || 'לא הצלחנו לשלוח בקשת אישור');
  }
};
window.resendContactOptIn = async (contactId) => {
  if (!confirm('לשלוח שוב הודעת אישור WhatsApp לבן/בת המשפחה?')) return;
  try {
    await api(`/api/contacts/${contactId}/resend-optin`, { method:'POST', body:JSON.stringify({ token }) });
    alert('בקשת האישור נשלחה ל־WhatsApp.');
    await load();
  } catch (err) {
    alert(err.message || 'לא הצלחנו לשלוח בקשת אישור');
  }
};
window.setActive = async (elderId, active) => { await api(`/api/elders/${elderId}/active`, { method:'POST', body:JSON.stringify({ token, active }) }); await load(); };
window.addContact = async (event, elderId) => {
  event.preventDefault();
  const unlock = lockSubmit(event, 'מוסיף…');
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.token = token;
    await api(`/api/elders/${elderId}/contacts`, { method:'POST', body:JSON.stringify(payload) });
    await load();
  } catch (err) {
    unlock();
    alert(err.message || 'לא ניתן להוסיף איש קשר');
  }
};
window.addElder = async (event) => {
  event.preventDefault();
  const unlock = lockSubmit(event, 'שומר…');
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.shomerShabbat = event.currentTarget.elements.shomerShabbat?.checked ? 'on' : '';
    payload.token = token;
    await api('/api/elders', { method:'POST', body:JSON.stringify(payload) });
    await load();
  } catch (err) {
    unlock();
    alert(err.message || 'לא ניתן לשמור מבוגר');
  }
};
window.deleteContact = async (contactId) => {
  if (!confirm('למחוק איש קשר זה?')) return;
  await api(`/api/contacts/${contactId}/delete`, { method:'POST', body:JSON.stringify({ token }) });
  await load();
};
window.updateElder = async (event, elderId) => {
  event.preventDefault();
  const unlock = lockSubmit(event, 'שומר…');
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.shomerShabbat = event.currentTarget.elements.shomerShabbat?.checked ? 'on' : '';
    payload.token = token;
    await api(`/api/elders/${elderId}/update`, { method:'POST', body:JSON.stringify(payload) });
    await load();
  } catch (err) {
    unlock();
    alert(err.message || 'לא ניתן לשמור שינוי');
  }
};
load().catch((err) => {
  if (!root) return;
  root.innerHTML = `<article class="dashboard-card error-card">
    <span class="card-kicker">שגיאה</span>
    <h2>לא הצלחנו לטעון את האזור המשפחתי</h2>
    <p>נסו לרענן את הדף או לפתוח מחדש את קישור הניהול.</p>
    <p class="small">${esc(err.message || 'שגיאה לא ידועה')}</p>
    <button class="button primary" onclick="location.reload()">רענון הדף</button>
  </article>`;
});
