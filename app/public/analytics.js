(function () {
  'use strict';
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  const apiBase = (window.MALACHI_API_BASE || '').replace(/\/$/, '');
  const market = document.documentElement.lang.toLowerCase().startsWith('en') ? 'uk' : 'il';
  const params = new URLSearchParams(location.search);
  const trackingKeys = ['ref', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'test'];
  const testMode = params.get('test') === '1';
  function referralSource() {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (!host || host === location.hostname) return 'direct';
      if (/facebook|fb\.com/.test(host)) return 'facebook';
      if (/instagram/.test(host)) return 'instagram';
      if (/linkedin/.test(host)) return 'linkedin';
      if (/google/.test(host)) return 'google';
      return host;
    } catch { return 'direct'; }
  }
  const attribution = {
    source: params.get('utm_source') || params.get('source') || params.get('ref') || referralSource(),
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || ''
  };
  function track(event, details = {}) {
    return fetch(`${apiBase}/api/analytics/event`, {
      method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, market, path: location.pathname, ...attribution, ...details, test: testMode })
    }).catch(() => {});
  }
  let engagementTracked = false;
  function markEngagedView() {
    if (engagementTracked) return;
    engagementTracked = true;
    track('engaged_view');
  }
  function eventForLink(link) {
    if (link.dataset.analytics) return link.dataset.analytics;
    const href = link.getAttribute('href') || '';
    if (/create-user\.html/.test(href)) return 'join_click';
    if (/demo(?:-ai)?\.html/.test(href)) return 'demo_click';
    if (/login\.html/.test(href)) return 'sign_in_click';
    if (/wa\.me\//.test(href)) return 'whatsapp_click';
    return '';
  }
  window.MalachiAnalytics = { track, market };
  document.addEventListener('DOMContentLoaded', () => {
    track('page_view');
    document.addEventListener('pointerdown', markEngagedView, { once: true, passive: true });
    document.addEventListener('keydown', markEngagedView, { once: true });
    document.addEventListener('scroll', markEngagedView, { once: true, passive: true });
    document.querySelectorAll('a[href],button[data-analytics]').forEach((element) => {
      const event = eventForLink(element);
      if (event) element.addEventListener('click', () => track(event));
      if (element.tagName === 'A' && trackingKeys.some((key) => params.get(key))) {
        try {
          const target = new URL(element.href, location.href);
          if (/\.(?:html)?$/.test(target.pathname) || target.pathname.endsWith('/')) {
            for (const key of trackingKeys) {
              const value = params.get(key);
              if (value && (key !== 'test' || value === '1') && !target.searchParams.has(key)) target.searchParams.set(key, value);
            }
            element.href = target.href;
          }
        } catch {}
      }
    });
  });
}());
