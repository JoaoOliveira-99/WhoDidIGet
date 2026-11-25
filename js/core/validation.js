/** Participant and exclusion validation (pure). User-facing messages are in pt-PT. */

import { isValidEmail, isValidPhone } from './contacts.js';
import { MIN_PARTICIPANTS } from './draw.js';

/** Comparison key that ignores case and spaces ("Ana Rita" == " ana  rita"). */
export function nameKey(name) {
  return String(name ?? '').replace(/\s+/g, '').toLocaleLowerCase('pt-PT');
}

/** Trims and collapses repeated spaces. */
export function cleanName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Validates a participant against the existing list.
 * @param {{name: string, phone: string, email: string}} data
 * @param {{id: string, name: string}[]} participants
 * @param {string | null} [ignoreId] The participant's own id (when editing).
 * @returns {{field: 'name'|'phone'|'email', message: string}[]}
 */
export function validateParticipant(data, participants, ignoreId = null) {
  const errors = [];
  const { name, phone, email } = data;

  if (!name) {
    errors.push({ field: 'name', message: 'Escreve o nome do participante.' });
  } else {
    const key = nameKey(name);
    const duplicate = participants.find((p) => p.id !== ignoreId && nameKey(p.name) === key);
    if (duplicate) {
      errors.push({
        field: 'name',
        message: `Já existe um participante chamado "${duplicate.name}". Usa um nome diferente (ex.: com o apelido).`,
      });
    }
  }

  if (!phone && !email) {
    errors.push({ field: 'phone', message: 'Indica um telemóvel ou um email (pelo menos um).' });
  }
  if (phone && !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'O telemóvel não parece válido. Ex.: 912 345 678 ou +351 912 345 678.' });
  }
  if (email && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'O email não parece válido. Ex.: nome@exemplo.pt.' });
  }
  return errors;
}

/** Full validation before drawing. Returns messages ready to display. */
export function validateForDraw(participants) {
  const errors = [];
  const count = participants.length;
  if (count < MIN_PARTICIPANTS) errors.push(`Precisas de pelo menos ${MIN_PARTICIPANTS} participantes (tens ${count}).`);
  for (const p of participants) {
    for (const error of validateParticipant(p, participants, p.id)) errors.push(`${p.name}: ${error.message}`);
  }
  return errors;
}

/** Validates a new exclusion. Returns the error message, or null if it is valid. */
export function validateExclusion(a, b, participants, exclusions) {
  if (participants.length < 2) return 'Adiciona primeiro os participantes.';
  if (!a || !b) return 'Escolhe as duas pessoas.';
  if (a === b) return 'Escolhe duas pessoas diferentes.';
  const ids = new Set(participants.map((p) => p.id));
  if (!ids.has(a) || !ids.has(b)) return 'Essa pessoa já não está na lista.';
  if (exclusions.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))) return 'Essa exclusão já existe.';
  return null;
}
