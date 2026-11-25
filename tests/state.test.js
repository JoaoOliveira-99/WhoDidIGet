import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { initialState, newId, sanitize } from '../js/core/state.js';

describe('sanitize', () => {
  it('returns the initial state for garbage', () => {
    for (const garbage of [null, 42, 'text', [], { participants: 'x' }]) assert.deepEqual(sanitize(garbage), initialState());
  });

  it('drops invalid/duplicate participants and orphan exclusions', () => {
    const state = sanitize({
      participants: [{ id: 'a', name: 'A' }, { id: 'a', name: 'Dup' }, { id: 'b', name: '' }, { name: 'no id' }, { id: 'c', name: 'C', phone: 5 }],
      exclusions: [{ a: 'a', b: 'c' }, { a: 'a', b: 'zz' }, { a: 'a', b: 'a' }],
    });
    assert.deepEqual(state.participants, [
      { id: 'a', name: 'A', phone: '', email: '' },
      { id: 'c', name: 'C', phone: '', email: '' },
    ]);
    assert.deepEqual(state.exclusions, [{ a: 'a', b: 'c' }]);
  });

  it('discards incomplete links', () => {
    const state = sanitize({ participants: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], links: { a: 'x' }, sent: { a: true } });
    assert.equal(state.links, null);
    assert.deepEqual(state.sent, {});
  });

  it('keeps complete links and sent flags', () => {
    const state = sanitize({ participants: [{ id: 'a', name: 'A' }], links: { a: 'x' }, sent: { a: true, ghost: true } });
    assert.deepEqual(state.links, { a: 'x' });
    assert.deepEqual(state.sent, { a: true });
  });
});

describe('newId', () => {
  it('returns unique 16-character hex ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, newId));
    assert.equal(ids.size, 1000);
    for (const id of ids) assert.match(id, /^[0-9a-f]{16}$/);
  });
});
