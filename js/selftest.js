/**
 * Self-test to run from the browser console: selfTest()
 *
 * Runs 10 000 draws (3 to 12 people, with exclusions from 5 up) and checks:
 * nobody draws themselves, everyone gives and receives once, no reciprocal
 * pairs and exclusions are respected. Also checks link encoding.
 * Uses test data only — never touches real pairs.
 */

import { drawPairs, verifyPairs } from './core/draw.js';
import { decode, encode } from './core/link.js';

export function selfTest(total = 10000) {
  const start = performance.now();
  const errors = [];
  let completed = 0;

  for (let i = 0; i < total && errors.length < 20; i++) {
    const size = 3 + (i % 10);
    const ids = Array.from({ length: size }, (_, k) => `p${k}`);
    const exclusions = size >= 5 ? [{ a: 'p0', b: 'p1' }, { a: 'p2', b: 'p3' }] : [];
    const pairs = drawPairs(ids, exclusions);
    if (!pairs) {
      errors.push(`Draw #${i}: no solution with ${size} people (unexpected)`);
      continue;
    }
    const problem = verifyPairs(ids, exclusions, pairs);
    if (problem) errors.push(`Draw #${i}: ${problem}`);
    completed++;
  }

  // In a circle of 3 everyone sits next to everyone: this must be impossible.
  if (drawPairs(['a', 'b', 'c'], [{ a: 'a', b: 'b' }]) !== null) {
    errors.push('Drawing 3 people with one exclusion should be impossible');
  }

  const sample = {
    name: 'Natal 2026', budget: '20€', date: '2026-12-24',
    message: 'Até já! 🎄\nçãõ', giver: 'João', receiver: 'Inês Conceição',
  };
  const token = encode(sample);
  if (JSON.stringify(decode(token)) !== JSON.stringify(sample)) errors.push('Link encoding round-trip failed');
  if (decode('not-a-real-link') !== null) errors.push('A broken link should be rejected');
  if (decode(token.slice(0, 20)) !== null) errors.push('A truncated link should be rejected');

  const ms = Math.round(performance.now() - start);
  if (errors.length) {
    console.error(`❌ selfTest failed (${errors.length} problem(s)):\n- ${errors.join('\n- ')}`);
    return false;
  }
  console.log(
    `✅ selfTest OK: ${completed} draws in ${ms} ms. No self-assignments, everyone gives and receives once, ` +
      'no reciprocal pairs, exclusions respected, links OK.',
  );
  return true;
}
