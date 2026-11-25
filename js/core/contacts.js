/** Phone numbers and emails (pure). */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PORTUGAL_CODE = '351';

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email ?? '').trim());
}

/**
 * Normalizes a phone number to the wa.me format (digits only, with country code).
 * Strips spaces, "+", dashes, parentheses and dots; a leading "00" is the international prefix.
 * Nine digits are assumed to be a Portuguese number and get the 351 prefix.
 */
export function normalizePhone(phone) {
  let digits = String(phone ?? '').replace(/[\s+\-().]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9) digits = PORTUGAL_CODE + digits;
  return digits;
}

export function isValidPhone(phone) {
  return /^\d{10,15}$/.test(normalizePhone(phone));
}
