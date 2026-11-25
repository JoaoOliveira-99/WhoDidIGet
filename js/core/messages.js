/**
 * Invitation messages and sharing URLs (pure). Message text is in pt-PT.
 * The message carries ONLY the link — never the name of the secret friend.
 */

import { normalizePhone } from './contacts.js';
import { formatDate } from './dates.js';

export const DEFAULT_DRAW_NAME = 'Amigo Secreto';

export function drawName(draw) {
  return draw?.name?.trim() || DEFAULT_DRAW_NAME;
}

/**
 * @param {{name: string, draw: {name: string, budget: string, date: string}, link: string}} params
 */
export function buildMessage({ name, draw, link }) {
  let message =
    `Olá ${name}! 🎁 Já foi feito o sorteio do amigo secreto ${drawName(draw)}. ` +
    `Abre este link para descobrires a quem vais oferecer (não partilhes!): ${link}`;

  const extras = [];
  const budget = draw.budget?.trim();
  if (budget) extras.push(`Orçamento: ${budget}`);
  if (draw.date) extras.push(`Troca: ${formatDate(draw.date)}`);
  if (extras.length) message += `\n${extras.join(' · ')}`;
  return message;
}

export function emailSubject(draw) {
  return `🎁 Amigo secreto ${drawName(draw)}: o teu sorteio`;
}

/** https://wa.me/<number>?text=<message> */
export function whatsappUrl(phone, message) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

/**
 * sms: URL that opens the phone's messaging app with the number and text filled in.
 * iOS expects "sms:<number>&body=…"; Android and others expect "sms:<number>?body=…".
 */
export function smsUrl(phone, message, { ios = false } = {}) {
  const separator = ios ? '&' : '?';
  return `sms:+${normalizePhone(phone)}${separator}body=${encodeURIComponent(message)}`;
}

/** mailto: with encoded subject and body; line breaks as CRLF, as RFC 6068 requires. */
export function mailtoUrl(email, subject, body) {
  const recipient = String(email).trim().split('@').map(encodeURIComponent).join('@');
  return (
    `mailto:${recipient}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`
  );
}

export function contactSummary({ phone, email }) {
  const parts = [];
  if (phone) parts.push(`📱 ${phone}`);
  if (email) parts.push(`✉️ ${email}`);
  return parts.join(' · ');
}
