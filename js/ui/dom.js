/**
 * DOM helpers shared by the screens.
 * User-provided text ALWAYS goes in through textContent (never innerHTML).
 */

/** querySelector that fails fast, with a clear message, if the element is missing. */
export function $(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`WhoDidIGET: element missing from the HTML: ${selector}`);
  return element;
}

/**
 * Creates an element.
 *   el('button', { type: 'button', class: 'btn', onclick: fn, disabled: true }, 'Text')
 * null/undefined/false attributes are skipped; true becomes an empty attribute.
 */
export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
}

/** Shows one or more messages in an error box (role="alert"). An empty list hides it. */
export function showErrors(box, errors = []) {
  box.replaceChildren();
  if (!errors.length) {
    box.hidden = true;
    return;
  }
  if (errors.length === 1) box.textContent = errors[0];
  else box.append(el('ul', {}, ...errors.map((error) => el('li', { text: error }))));
  box.hidden = false;
}

let toastTimer;
/** Short message at the bottom of the screen, announced to screen readers (role="status"). */
export function toast(message, duration = 3200) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), duration);
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Focuses an element without scrolling; useful after switching screens. */
export function focusQuietly(element) {
  element?.focus({ preventScroll: true });
}

/** Copies text to the clipboard. Returns true on success. */
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall back to the legacy method */
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text) {
  const area = el('textarea', { readonly: true, 'aria-hidden': 'true', class: 'offscreen' });
  area.value = text;
  document.body.append(area);
  try {
    area.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
