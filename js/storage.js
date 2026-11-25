/**
 * localStorage access, always wrapped in try/catch
 * (private mode, full quota, blocked cookies, corrupted JSON…).
 */

const STORAGE_KEY = 'whodidiget:v2';

/** @returns {unknown} The stored data, or null if missing or unreadable. */
export function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @returns {boolean} True if the data was saved. */
export function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}
