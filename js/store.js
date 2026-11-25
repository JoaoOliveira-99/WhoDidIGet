/**
 * Holds the organizer state in memory and persists it to localStorage.
 * Screens mutate `store.state` and then call `store.save()`.
 */

import { initialState, sanitize } from './core/state.js';
import * as storage from './storage.js';

/**
 * @param {{onSaveError?: () => void}} [options] Called (once) if the state cannot be saved.
 */
export function createStore({ onSaveError } = {}) {
  let state = sanitize(storage.read());
  let warned = false;

  return {
    /** @returns {import('./core/state.js').State} */
    get state() {
      return state;
    },

    save() {
      if (!storage.write(state) && !warned) {
        warned = true;
        onSaveError?.();
      }
    },

    /** Clears everything (memory and localStorage). */
    reset() {
      state = initialState();
      storage.clear();
    },

    findParticipant(id) {
      return state.participants.find((p) => p.id === id) ?? null;
    },
  };
}
