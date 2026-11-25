import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decode } from '../js/core/link.js';
import { runDraw } from '../js/core/run-draw.js';
import { initialState } from '../js/core/state.js';

function stateWith(names, exclusions = []) {
  const state = initialState();
  state.draw = { name: 'Natal 2026', budget: ' 20€ ', date: '2026-12-24', message: 'Até lá!' };
  state.participants = names.map((name, i) => ({ id: `id${i}`, name, phone: '912345678', email: '' }));
  state.exclusions = exclusions;
  return state;
}

describe('runDraw', () => {
  it('creates one link per person, each with its own giver and a valid receiver', () => {
    const names = ['João', 'Inês', 'Rui', 'Ana', 'Zé'];
    const state = stateWith(names, [{ a: 'id0', b: 'id1' }]);

    for (let round = 0; round < 200; round++) {
      const result = runDraw(state);
      assert.equal(result.ok, true);
      assert.deepEqual(Object.keys(result.links).sort(), state.participants.map((p) => p.id).sort());

      const receivers = new Set();
      for (const p of state.participants) {
        const data = decode(result.links[p.id]);
        assert.equal(data.giver, p.name);
        assert.notEqual(data.receiver, p.name);
        assert.ok(names.includes(data.receiver));
        assert.equal(data.budget, '20€');
        assert.equal(data.name, 'Natal 2026');
        receivers.add(data.receiver);
      }
      assert.equal(receivers.size, names.length, 'everyone receives exactly once');

      const receiverOf = (id) => decode(result.links[id]).receiver;
      assert.notEqual(receiverOf('id0'), 'Inês');
      assert.notEqual(receiverOf('id1'), 'João');
    }
  });

  it('never returns the pairs in plain form', () => {
    const result = runDraw(stateWith(['A', 'B', 'C']));
    assert.deepEqual(Object.keys(result).sort(), ['links', 'ok']);
  });

  it('fails on validation errors or impossible exclusions', () => {
    assert.equal(runDraw(stateWith(['A', 'B'])).ok, false);
    const impossible = runDraw(stateWith(['A', 'B', 'C'], [{ a: 'id0', b: 'id1' }]));
    assert.equal(impossible.ok, false);
    assert.match(impossible.errors[0], /exclusões/);
  });
});
