(() => {
  const STORAGE_KEY = 'malachi_accessibility_prefs';
  const DEFAULTS = { largeText: false, highContrast: false, underlineLinks: false };

  function loadPrefs() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }

  function savePrefs(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  function applyPrefs(prefs) {
    document.documentElement.classList.toggle('a11y-large-text', !!prefs.largeText);
    document.documentElement.classList.toggle('a11y-high-contrast', !!prefs.highContrast);
    document.documentElement.classList.toggle('a11y-underline-links', !!prefs.underlineLinks);
  }

  function button(label, key, prefs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'a11y-option';
    btn.setAttribute('aria-pressed', String(!!prefs[key]));
    btn.textContent = label;
    btn.addEventListener('click', () => {
      prefs[key] = !prefs[key];
      savePrefs(prefs);
      applyPrefs(prefs);
      btn.setAttribute('aria-pressed', String(!!prefs[key]));
    });
    return btn;
  }

  function init() {
    const prefs = loadPrefs();
    applyPrefs(prefs);

    const wrap = document.createElement('section');
    wrap.className = 'a11y-widget';
    wrap.setAttribute('aria-label', 'אפשרויות נגישות');
    wrap.innerHTML = `
      <button type="button" class="a11y-toggle" aria-expanded="false" aria-controls="a11yPanel" aria-label="פתיחת תפריט נגישות">
        <span class="a11y-icon" aria-hidden="true">♿</span>
        <span class="a11y-text">נגישות</span>
      </button>
      <div id="a11yPanel" class="a11y-panel" hidden>
        <h2>אפשרויות נגישות</h2>
        <p>העדפות נשמרות בדפדפן שלך בלבד.</p>
      </div>
    `;
    const toggle = wrap.querySelector('.a11y-toggle');
    const panel = wrap.querySelector('.a11y-panel');
    panel.append(
      button('הגדלת טקסט', 'largeText', prefs),
      button('ניגודיות גבוהה', 'highContrast', prefs),
      button('הדגשת קישורים', 'underlineLinks', prefs)
    );

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'a11y-option secondary';
    reset.textContent = 'איפוס';
    reset.addEventListener('click', () => {
      Object.assign(prefs, DEFAULTS);
      savePrefs(prefs);
      applyPrefs(prefs);
      panel.querySelectorAll('[aria-pressed]').forEach((el) => el.setAttribute('aria-pressed', 'false'));
    });
    panel.append(reset);

    toggle.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.body.append(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
