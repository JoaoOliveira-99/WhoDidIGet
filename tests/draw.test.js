import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { drawPairs, randomInt, shuffle, verifyPairs } from '../js/core/draw.js';
import { selfTest } from '../js/selftest.js';

const makeIds = (n) => Array.from({ length: n }, (_, i) => `p${i}`);

describe('randomInt', () => {
  it('always stays within range', () => {
    for (let i = 0; i < 5000; i++) {
      const value = randomInt(7);
      assert.ok(Number.isInteger(value) && value >= 0 && value < 7);
    }
  });

  it('rejects invalid limits', () => {
    for (const max of [0, -1, 1.5, NaN, 2 ** 33]) assert.throws(() => randomInt(max), RangeError);
  });
});

describe('shuffle', () => {
  it('returns a permutation of the same items', () => {
    const original = makeIds(20);
    const shuffled = shuffle(original.slice());
    assert.deepEqual([...shuffled].sort(), [...original].sort());
  });

  it('produces every possible order of 3 items', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) seen.add(shuffle(['a', 'b', 'c']).join(''));
    assert.equal(seen.size, 6);
  });
});

describe('drawPairs', () => {
  it('follows the rules over 10 000 draws (3 to 12 people, with exclusions)', () => {
    for (let i = 0; i < 10000; i++) {
      const ids = makeIds(3 + (i % 10));
      const exclusions = ids.length >= 5 ? [{ a: 'p0', b: 'p1' }, { a: 'p2', b: 'p3' }] : [];
      const pairs = drawPairs(ids, exclusions);
      assert.ok(pairs, `no solution with ${ids.length} people`);
      assert.equal(verifyPairs(ids, exclusions, pairs), null);
    }
  });

  it('returns null when exclusions make the draw impossible', () => {
    assert.equal(drawPairs(['a', 'b', 'c'], [{ a: 'a', b: 'b' }]), null);
  });

  it('returns null with fewer than 3 people', () => {
    assert.equal(drawPairs(['a', 'b']), null);
    assert.equal(drawPairs([]), null);
  });

  it('rejects duplicate ids', () => {
    assert.throws(() => drawPairs(['a', 'b', 'a']));
  });
});

describe('verifyPairs', () => {
  const ids = ['a', 'b', 'c'];

  it('accepts a valid circle', () => {
    assert.equal(verifyPairs(ids, [], { a: 'b', b: 'c', c: 'a' }), null);
  });

  it('detects self-assignment', () => {
    assert.match(verifyPairs(ids, [], { a: 'a', b: 'c', c: 'b' }), /themselves/);
  });

  it('detects someone receiving twice', () => {
    assert.match(verifyPairs(['a', 'b', 'c', 'd'], [], { a: 'b', b: 'c', c: 'd', d: 'b' }), /more than once/);
  });

  it('detects broken exclusions', () => {
    assert.match(verifyPairs(ids, [{ a: 'b', b: 'a' }], { a: 'b', b: 'c', c: 'a' }), /Exclusion/);
  });
});

describe('selfTest', () => {
  it('passes', (t) => {
    t.mock.method(console, 'log', () => {});
    assert.equal(selfTest(2000), true);
  });
});
