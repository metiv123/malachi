export const legalVersions = Object.freeze({
  terms: '2026-08-01',
  privacy: '2026-08-01',
  whatsappOptIn: '2026-08-01'
});

export function acceptedCheckbox(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

export function consentRecord({ termsConsent, privacyConsent = termsConsent } = {}) {
  if (!acceptedCheckbox(termsConsent) || !acceptedCheckbox(privacyConsent)) {
    throw new Error('יש לאשר את תנאי השימוש ואת מדיניות הפרטיות');
  }
  const acceptedAt = new Date().toISOString();
  return {
    termsAcceptedAt: acceptedAt,
    termsVersion: legalVersions.terms,
    privacyAcceptedAt: acceptedAt,
    privacyVersion: legalVersions.privacy
  };
}
