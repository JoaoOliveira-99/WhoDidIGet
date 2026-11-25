/**
 * Validation + draw + link encoding in one step (pure).
 *
 * The pair map only exists inside this function: it is never returned, stored,
 * rendered or logged. Only the encoded links leave it.
 */

import { MAX_ATTEMPTS, drawPairs } from './draw.js';
import { encode } from './link.js';
import { drawName } from './messages.js';
import { validateForDraw } from './validation.js';

/**
 * @param {import('./state.js').State} state
 * @returns {{ok: true, links: Record<string, string>} | {ok: false, errors: string[]}}
 */
export function runDraw(state) {
  const errors = validateForDraw(state.participants);
  if (errors.length) return { ok: false, errors };

  const ids = state.participants.map((p) => p.id);
  const pairs = drawPairs(ids, state.exclusions);
  if (!pairs) {
    return {
      ok: false,
      errors: [
        `Não foi possível fazer um sorteio que respeite todas as exclusões (tentámos ${MAX_ATTEMPTS} vezes). ` +
          'Remove algumas exclusões ou junta mais participantes.',
      ],
    };
  }

  const nameById = new Map(state.participants.map((p) => [p.id, p.name]));
  const { draw } = state;
  const shared = {
    name: drawName(draw),
    budget: draw.budget.trim(),
    date: draw.date,
    message: draw.message.trim(),
  };

  const links = {};
  for (const giver of ids) {
    links[giver] = encode({ ...shared, giver: nameById.get(giver), receiver: nameById.get(pairs[giver]) });
  }
  return { ok: true, links };
}
