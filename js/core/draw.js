/**
 * Secret Santa draw algorithm (pure: no DOM, testable in Node).
 *
 * 1. Shuffle participants with Fisher–Yates using crypto.getRandomValues.
 * 2. Build a circle: order[i] gives to order[i + 1] and the last gives to the first.
 *    This guarantees nobody draws themselves, everyone gives and receives exactly
 *    once and, with 3 or more people, there are no reciprocal pairs.
 * 3. If the circle breaks an exclusion, reshuffle (up to MAX_ATTEMPTS times).
 */

export const MAX_ATTEMPTS = 1000;
export const MIN_PARTICIPANTS = 3;

const UINT32_RANGE = 0x100000000;

/** Uniform random integer in [0, max), without modulo bias. */
export function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError(`randomInt: invalid max (${max})`);
  }
  // Reject values above the largest multiple of max so the distribution stays uniform.
  const limit = Math.floor(UINT32_RANGE / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/** In-place Fisher–Yates shuffle with cryptographic randomness. Returns the same array. */
export function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Draws a single circle that respects the exclusions.
 * @param {string[]} ids Unique participant ids.
 * @param {{a: string, b: string}[]} [exclusions] Forbidden pairs, in both directions.
 * @param {{maxAttempts?: number}} [options]
 * @returns {Record<string, string> | null} { giver: receiver }, or null if there is no solution.
 */
export function drawPairs(ids, exclusions = [], { maxAttempts = MAX_ATTEMPTS } = {}) {
  if (!Array.isArray(ids) || ids.length < MIN_PARTICIPANTS) return null;
  if (new Set(ids).size !== ids.length) throw new Error('drawPairs: duplicate ids');

  const forbidden = new Set();
  for (const { a, b } of exclusions) {
    forbidden.add(`${a}|${b}`);
    forbidden.add(`${b}|${a}`);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const order = shuffle(ids.slice());
    const pairs = {};
    let valid = true;

    for (let i = 0; i < order.length; i++) {
      const giver = order[i];
      const receiver = order[(i + 1) % order.length]; // the last one gives to the first
      if (forbidden.has(`${giver}|${receiver}`)) {
        valid = false;
        break;
      }
      pairs[giver] = receiver;
    }

    if (valid) return pairs;
  }
  return null; // no circle satisfies the exclusions
}

/**
 * Checks that a result follows every rule.
 * @returns {string | null} Description of the first problem found, or null if all is well.
 */
export function verifyPairs(ids, exclusions, pairs) {
  const n = ids.length;
  if (!pairs || Object.keys(pairs).length !== n) return 'Wrong number of givers';

  const known = new Set(ids);
  const receivers = new Set();
  for (const giver of ids) {
    const receiver = pairs[giver];
    if (!receiver) return `${giver} gives to nobody`;
    if (receiver === giver) return `${giver} drew themselves`;
    if (!known.has(receiver)) return `${giver} drew an unknown participant`;
    if (receivers.has(receiver)) return `${receiver} receives more than once`;
    receivers.add(receiver);
    if (n >= MIN_PARTICIPANTS && pairs[receiver] === giver) return `Reciprocal pair ${giver} ⇄ ${receiver}`;
  }
  if (receivers.size !== n) return 'Someone receives no gift';

  for (const { a, b } of exclusions) {
    if (pairs[a] === b || pairs[b] === a) return `Exclusion ${a} ⇄ ${b} not respected`;
  }
  return null;
}
