/**
 * Reveal link encoding (pure: no DOM, testable in Node).
 *
 * { name, budget, date, message, giver, receiver }
 *   → JSON (wire format below) → UTF-8 bytes (TextEncoder, so "João" or "Inês" work)
 *   → XOR with a fixed key (only so the name can't be read at a glance;
 *     this is NOT real security: anyone who knows JavaScript can decode it)
 *   → URL-safe base64 (no "+", "/" or "=")
 *
 * The token goes in the URL fragment (#), which browsers never send to the server.
 */

// WARNING: changing this key invalidates every link already sent.
const XOR_KEY = new TextEncoder().encode('WhoDidIGET·amigo-secreto·🎁');

/**
 * Wire format: JSON keys inside the token. Part of the link format, kept in
 * Portuguese as originally specified — changing them breaks links already sent.
 */
const WIRE_KEYS = {
  name: 'sorteio',
  budget: 'orcamento',
  date: 'data',
  message: 'mensagem',
  giver: 'de',
  receiver: 'para',
};

const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

const asString = (value) => (typeof value === 'string' ? value : '');

function xor(bytes) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ XOR_KEY[i % XOR_KEY.length];
  return out;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(text) {
  let base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * @typedef {{name: string, budget: string, date: string, message: string, giver: string, receiver: string}} LinkData
 */

/** @param {LinkData} data @returns {string} URL-safe token. */
export function encode(data) {
  const wire = {};
  for (const [field, key] of Object.entries(WIRE_KEYS)) wire[key] = data[field];
  return bytesToBase64Url(xor(new TextEncoder().encode(JSON.stringify(wire))));
}

/** @returns {LinkData | null} The link data, or null if the token is broken or incomplete. */
export function decode(token) {
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return null;
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(xor(base64UrlToBytes(token)));
    const wire = JSON.parse(json);
    if (!wire || typeof wire !== 'object') return null;

    const data = {};
    for (const [field, key] of Object.entries(WIRE_KEYS)) data[field] = asString(wire[key]);
    if (!data.giver.trim() || !data.receiver.trim()) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Extracts the token from the URL fragment, tolerating what some apps do to links:
 * %XX encoding and punctuation stuck to the end (e.g. "…abc." or "…abc)").
 */
export function extractToken(hash) {
  let token = String(hash ?? '').replace(/^#/, '');
  try {
    token = decodeURIComponent(token);
  } catch {
    /* keep as is */
  }
  return token.trim().replace(/[^A-Za-z0-9_-]+$/, '');
}

/** Base URL where the page is hosted (works on any domain or sub-folder). */
export function baseUrl(location) {
  if (location.protocol === 'file:' || location.origin === 'null') {
    return location.href.split('#')[0].split('?')[0];
  }
  return location.origin + location.pathname;
}

export function buildLink(base, token) {
  return `${base}#${token}`;
}

/** True when the page is not publicly hosted (links would not work for other people). */
export function isLocalLocation(location) {
  if (location.protocol === 'file:') return true;
  const host = location.hostname;
  return host === 'localhost' || host === '[::1]' || host === '::1' || host.startsWith('127.') || host.endsWith('.local');
}
