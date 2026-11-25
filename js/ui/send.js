/**
 * Screen 2 — Send links (organizer).
 *
 * Shows only the participant list, never the pairs. Each message carries only
 * that person's private link (the secret friend's name is encoded inside it).
 *   WhatsApp: https://wa.me/<number>?text=<message>
 *   Email:    mailto:<email>?subject=…&body=…
 */

import { formatDate } from '../core/dates.js';
import { baseUrl, buildLink, isLocalLocation } from '../core/link.js';
import { buildMessage, contactSummary, drawName, emailSubject, mailtoUrl, whatsappUrl } from '../core/messages.js';
import { $, copyText, el, toast } from './dom.js';

/**
 * @param {ReturnType<import('../store.js').createStore>} store
 * @param {{onRedraw: () => void, onEdit: () => void}} actions
 */
export function createSendScreen(store, { onRedraw, onEdit }) {
  const ui = {
    title: $('#send-title'),
    summary: $('#send-summary'),
    localWarning: $('#local-warning'),
    progressText: $('#progress-text'),
    progressBar: $('#progress-bar'),
    list: $('#send-list'),
  };

  $('#redraw-button').addEventListener('click', onRedraw);
  $('#edit-button').addEventListener('click', onEdit);

  const state = () => store.state;

  function linkFor(participant) {
    return buildLink(baseUrl(window.location), state().links[participant.id]);
  }

  function messageFor(participant) {
    return buildMessage({ name: participant.name, draw: state().draw, link: linkFor(participant) });
  }

  // ---------- Send actions ----------

  function sendWhatsApp(participant) {
    window.open(whatsappUrl(participant.phone, messageFor(participant)), '_blank', 'noopener');
    markSent(participant.id, true);
  }

  function sendEmail(participant) {
    window.location.href = mailtoUrl(participant.email, emailSubject(state().draw), messageFor(participant));
    markSent(participant.id, true);
  }

  async function copyLink(participant) {
    const link = linkFor(participant);
    if (await copyText(link)) {
      markSent(participant.id, true);
      toast(`Link de ${participant.name} copiado e marcado como enviado.`);
    } else {
      window.prompt(`Copia o link de ${participant.name}:`, link);
    }
  }

  function markSent(id, value) {
    if (value) state().sent[id] = true;
    else delete state().sent[id];
    store.save();

    // Re-render while keeping focus on the same button/checkbox.
    const focusedId = document.activeElement?.id;
    render();
    if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  }

  // ---------- Rendering ----------

  function participantItem(p) {
    const sent = Boolean(state().sent[p.id]);
    return el(
      'li',
      { class: `send-item${sent ? ' is-sent' : ''}` },
      el(
        'div',
        { class: 'send-item-header' },
        el('span', { class: 'send-item-name', text: p.name }),
        el('span', { class: 'sent-badge', text: '✓ Enviado', hidden: !sent }),
      ),
      el('p', { class: 'send-item-contacts', text: contactSummary(p) }),
      el(
        'div',
        { class: 'send-actions' },
        el(
          'button',
          {
            type: 'button',
            id: `whatsapp-${p.id}`,
            class: 'btn btn-sm btn-whatsapp',
            disabled: !p.phone,
            'aria-label': p.phone ? `Enviar por WhatsApp a ${p.name}` : `WhatsApp indisponível: ${p.name} não tem telemóvel`,
            onclick: () => sendWhatsApp(p),
          },
          '💬 WhatsApp',
        ),
        el(
          'button',
          {
            type: 'button',
            id: `email-${p.id}`,
            class: 'btn btn-sm btn-email',
            disabled: !p.email,
            'aria-label': p.email ? `Enviar por email a ${p.name}` : `Email indisponível: ${p.name} não tem email`,
            onclick: () => sendEmail(p),
          },
          '✉️ Email',
        ),
        el(
          'button',
          { type: 'button', id: `copy-${p.id}`, class: 'btn btn-sm btn-copy', 'aria-label': `Copiar o link de ${p.name}`, onclick: () => copyLink(p) },
          '🔗 Copiar link',
        ),
      ),
      el(
        'label',
        { class: 'sent-check', for: `sent-${p.id}` },
        el('input', { type: 'checkbox', id: `sent-${p.id}`, checked: sent, onchange: (event) => markSent(p.id, event.target.checked) }),
        'Enviado',
      ),
    );
  }

  function render() {
    const { draw, participants, sent } = state();

    const summary = [drawName(draw)];
    if (draw.budget.trim()) summary.push(`Orçamento ${draw.budget.trim()}`);
    if (draw.date) summary.push(formatDate(draw.date));
    summary.push(`${participants.length} participantes`);
    ui.summary.textContent = summary.join(' · ');

    ui.localWarning.hidden = !isLocalLocation(window.location);

    const total = participants.length;
    const done = participants.filter((p) => sent[p.id]).length;
    ui.progressText.textContent = done === total ? '✅ Todos os links foram enviados!' : `Enviados: ${done} de ${total}`;
    ui.progressBar.setAttribute('aria-valuemax', String(total));
    ui.progressBar.setAttribute('aria-valuenow', String(done));
    ui.progressBar.firstElementChild.style.width = `${total ? (done / total) * 100 : 0}%`;

    ui.list.replaceChildren(...participants.map(participantItem));
  }

  return {
    render,
    focusTitle: () => ui.title.focus(),
  };
}
