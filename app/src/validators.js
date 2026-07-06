export function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export function isLikelyPhone(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function validateJoinInput(input) {
  const errors = [];
  for (const field of ['ownerName','ownerPhone','elderName','elderPhone','dailyCheckTime','contactName','contactPhone']) {
    if (!input[field] || String(input[field]).trim() === '') errors.push(`חסר שדה: ${field}`);
  }
  if (input.dailyCheckTime && !isValidTime(input.dailyCheckTime)) errors.push('שעה לא תקינה');
  if (input.ownerPhone && !isLikelyPhone(input.ownerPhone)) errors.push('טלפון בן משפחה לא תקין');
  if (input.elderPhone && !isLikelyPhone(input.elderPhone)) errors.push('טלפון האדם המבוגר לא תקין');
  if (input.contactPhone && !isLikelyPhone(input.contactPhone)) errors.push('טלפון איש קשר לא תקין');
  if (errors.length) throw new Error(errors.join(', '));
}
