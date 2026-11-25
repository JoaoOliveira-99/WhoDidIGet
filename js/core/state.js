/**
 * Organizer state shape and sanitizing of persisted data (pure).
 *
 * The drawn pairs are NEVER part of the state: only the already-encoded links.
 */

/**
 * @typedef {{id: string, name: string, phone: string, email: string}} Participant
 * @typedef {{a: string, b: string}} Exclusion
 * @typedef {{
 *   draw: {name: string, budget: string, date: string, message: string},
 *   participants: Participant[],
 *   exclusions: Exclusion[],
 *   links: Record<string, string> | null,
 *   sent: Record<string, true>,
 * }} State
 */

/** @returns {State} */
export function initialState() {
  return {
    draw: { name: '', budget: '', date: '', message: '' },
    participants: [],
    exclusions: [],
    links: null, // { participantId: token } — only exists after the draw
    sent: {}, // { participantId: true }
  };
}

export function newId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const asString = (value) => (typeof value === 'string' ? value : '');
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Rebuilds a valid state from unknown data (old, hand-edited or corrupted storage).
 * Never throws.
 * @returns {State}
 */
export function sanitize(data) {
  const state = initialState();
  if (!isPlainObject(data)) return state;

  if (isPlainObject(data.draw)) {
    for (const key of Object.keys(state.draw)) state.draw[key] = asString(data.draw[key]);
  }

  if (Array.isArray(data.participants)) {
    const seen = new Set();
    for (const p of data.participants) {
      if (!isPlainObject(p) || !asString(p.id) || !asString(p.name).trim() || seen.has(p.id)) continue;
      seen.add(p.id);
      state.participants.push({ id: p.id, name: p.name, phone: asString(p.phone), email: asString(p.email) });
    }
  }

  const ids = new Set(state.participants.map((p) => p.id));
  if (Array.isArray(data.exclusions)) {
    state.exclusions = data.exclusions
      .filter((x) => isPlainObject(x) && ids.has(x.a) && ids.has(x.b) && x.a !== x.b)
      .map(({ a, b }) => ({ a, b }));
  }

  // Links are only kept if they exist for EVERY current participant.
  const { links } = data;
  if (isPlainObject(links) && state.participants.length > 0 && state.participants.every((p) => asString(links[p.id]))) {
    state.links = Object.fromEntries(state.participants.map((p) => [p.id, links[p.id]]));
    if (isPlainObject(data.sent)) {
      for (const p of state.participants) if (data.sent[p.id] === true) state.sent[p.id] = true;
    }
  }
  return state;
}
