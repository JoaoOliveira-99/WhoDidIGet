/**
 * Screen 1 — Setup (organizer): draw details, participants and exclusions.
 */

import { contactSummary } from '../core/messages.js';
import { newId } from '../core/state.js';
import { cleanName, validateExclusion, validateParticipant } from '../core/validation.js';
import { $, el, showErrors, toast } from './dom.js';

/** Participant field → input id in the HTML. */
const INPUT_BY_FIELD = { name: 'participant-name', phone: 'participant-phone', email: 'participant-email' };
const DRAW_FIELDS = ['name', 'budget', 'date', 'message'];

/**
 * @param {ReturnType<import('../store.js').createStore>} store
 * @param {{onDraw: () => void}} actions
 */
export function createSetupScreen(store, { onDraw }) {
  const ui = {
    form: $('#participant-form'),
    name: $('#participant-name'),
    phone: $('#participant-phone'),
    email: $('#participant-email'),
    participantError: $('#participant-error'),
    submit: $('#participant-submit'),
    cancel: $('#participant-cancel'),
    list: $('#participant-list'),
    empty: $('#participant-empty'),
    count: $('#participant-count'),
    exclusionA: $('#exclusion-a'),
    exclusionB: $('#exclusion-b'),
    exclusionError: $('#exclusion-error'),
    exclusionAdd: $('#exclusion-add'),
    exclusionList: $('#exclusion-list'),
    drawError: $('#draw-error'),
    drawButton: $('#draw-button'),
    firstField: $('#draw-name'),
  };

  /** Id of the participant being edited (null = adding a new one). */
  let editingId = null;
  const state = () => store.state;
  const nameOf = (id) => store.findParticipant(id)?.name ?? '?';

  // ---------- Draw details ----------

  function fillDrawFields() {
    for (const field of DRAW_FIELDS) $(`#draw-${field}`).value = state().draw[field];
  }

  for (const field of DRAW_FIELDS) {
    $(`#draw-${field}`).addEventListener('input', (event) => {
      state().draw[field] = event.target.value;
      store.save();
    });
  }

  // ---------- Participants ----------

  function markInvalidFields(errors) {
    const invalid = new Set(errors.map((e) => e.field));
    for (const [field, id] of Object.entries(INPUT_BY_FIELD)) {
      const input = document.getElementById(id);
      if (invalid.has(field)) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', 'participant-error');
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
  }

  function resetForm() {
    editingId = null;
    ui.form.reset();
    markInvalidFields([]);
    showErrors(ui.participantError, []);
    ui.submit.textContent = '➕ Adicionar participante';
    ui.cancel.hidden = true;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = {
      name: cleanName(ui.name.value),
      phone: ui.phone.value.trim(),
      email: ui.email.value.trim(),
    };

    const errors = validateParticipant(data, state().participants, editingId);
    markInvalidFields(errors);
    if (errors.length) {
      showErrors(ui.participantError, errors.map((e) => e.message));
      document.getElementById(INPUT_BY_FIELD[errors[0].field]).focus();
      return;
    }

    const existing = editingId && store.findParticipant(editingId);
    if (existing) {
      Object.assign(existing, data);
      toast('Alterações guardadas.');
    } else {
      state().participants.push({ id: newId(), ...data });
      toast(`${data.name} foi adicionado(a).`);
    }
    store.save();
    resetForm();
    showErrors(ui.drawError, []);
    render();
    ui.name.focus();
  }

  function editParticipant(id) {
    const participant = store.findParticipant(id);
    if (!participant) return;
    resetForm();
    editingId = id;
    ui.name.value = participant.name;
    ui.phone.value = participant.phone;
    ui.email.value = participant.email;
    ui.submit.textContent = '💾 Guardar alterações';
    ui.cancel.hidden = false;
    render();
    ui.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ui.name.focus({ preventScroll: true });
  }

  function removeParticipant(id) {
    const participant = store.findParticipant(id);
    if (!participant || !window.confirm(`Remover ${participant.name} da lista?`)) return;
    const s = state();
    s.participants = s.participants.filter((p) => p.id !== id);
    s.exclusions = s.exclusions.filter((x) => x.a !== id && x.b !== id);
    if (editingId === id) resetForm();
    store.save();
    render();
    toast(`${participant.name} foi removido(a).`);
    ui.name.focus();
  }

  ui.form.addEventListener('submit', handleSubmit);
  ui.cancel.addEventListener('click', () => {
    resetForm();
    render();
    ui.name.focus();
  });

  // ---------- Exclusions ----------

  function addExclusion() {
    const a = ui.exclusionA.value;
    const b = ui.exclusionB.value;
    const error = validateExclusion(a, b, state().participants, state().exclusions);
    showErrors(ui.exclusionError, error ? [error] : []);
    if (error) return;

    state().exclusions.push({ a, b });
    store.save();
    ui.exclusionA.value = '';
    ui.exclusionB.value = '';
    render();
    toast(`Exclusão adicionada: ${nameOf(a)} ⇄ ${nameOf(b)}.`);
  }

  function removeExclusion(index) {
    state().exclusions.splice(index, 1);
    store.save();
    render();
    ui.exclusionA.focus();
  }

  ui.exclusionAdd.addEventListener('click', addExclusion);

  // ---------- Draw ----------

  ui.drawButton.addEventListener('click', onDraw);

  function showDrawErrors(errors) {
    showErrors(ui.drawError, errors);
    if (errors.length) ui.drawError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Rendering ----------

  function fillSelect(select) {
    const current = select.value;
    const { participants } = state();
    select.replaceChildren(
      el('option', { value: '', text: 'Escolhe…' }),
      ...participants.map((p) => el('option', { value: p.id, text: p.name })),
    );
    select.value = participants.some((p) => p.id === current) ? current : '';
    select.disabled = participants.length < 2;
  }

  function participantItem(p) {
    return el(
      'li',
      { class: p.id === editingId ? 'is-editing' : null },
      el('div', { class: 'info' }, el('span', { class: 'name', text: p.name }), el('span', { class: 'contacts', text: contactSummary(p) })),
      el(
        'div',
        { class: 'item-actions' },
        el('button', { type: 'button', class: 'btn btn-link btn-sm', 'aria-label': `Editar ${p.name}`, onclick: () => editParticipant(p.id) }, 'Editar'),
        el('button', { type: 'button', class: 'btn btn-link btn-sm', 'aria-label': `Remover ${p.name}`, onclick: () => removeParticipant(p.id) }, 'Remover'),
      ),
    );
  }

  function exclusionItem(exclusion, index) {
    const a = nameOf(exclusion.a);
    const b = nameOf(exclusion.b);
    return el(
      'li',
      {},
      el('div', { class: 'info' }, el('span', { class: 'name', text: `🚫 ${a} ⇄ ${b}` })),
      el(
        'button',
        { type: 'button', class: 'btn btn-link btn-sm', 'aria-label': `Remover exclusão entre ${a} e ${b}`, onclick: () => removeExclusion(index) },
        'Remover',
      ),
    );
  }

  function render() {
    const { participants, exclusions } = state();
    const count = participants.length;

    ui.count.textContent = String(count);
    ui.count.setAttribute('aria-label', `${count} ${count === 1 ? 'participante' : 'participantes'}`);
    ui.list.replaceChildren(...participants.map(participantItem));
    ui.empty.hidden = count > 0;

    fillSelect(ui.exclusionA);
    fillSelect(ui.exclusionB);
    ui.exclusionAdd.disabled = count < 2;
    ui.exclusionList.replaceChildren(...exclusions.map(exclusionItem));
  }

  /** Back to a clean slate (used when starting over). */
  function reset() {
    resetForm();
    showErrors(ui.exclusionError, []);
    showErrors(ui.drawError, []);
    fillDrawFields();
  }

  fillDrawFields();

  return {
    render,
    reset,
    showDrawErrors,
    focusFirstField: () => ui.firstField.focus(),
  };
}
