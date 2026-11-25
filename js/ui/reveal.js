/**
 * Screen 3 — Reveal (participant). Only used when the page opens with a #.
 */

import { formatDate } from '../core/dates.js';
import { DEFAULT_DRAW_NAME } from '../core/messages.js';
import { decode, extractToken } from '../core/link.js';
import { launchConfetti } from './confetti.js';
import { $, el, focusQuietly, prefersReducedMotion } from './dom.js';

const SHAKE_MS = 700;
const OPEN_MS = 500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {string} hash The URL fragment (with or without "#"). */
export function startReveal(hash) {
  $('#screen-setup').hidden = true;
  $('#screen-send').hidden = true;
  $('#site-footer').hidden = true;
  $('#screen-reveal').hidden = false;

  const data = decode(extractToken(hash));
  if (!data) {
    document.title = 'Link incompleto · WhoDidIGET';
    $('#reveal-error').hidden = false;
    return;
  }

  document.title = 'O teu amigo secreto · WhoDidIGET';
  $('#reveal-card').hidden = false;
  $('#reveal-draw-name').textContent = `🎄 ${data.name || DEFAULT_DRAW_NAME}`;
  $('#reveal-greeting').textContent = `Olá ${data.giver} 👋`;

  renderDetails(data);
  bindButtons(data);
}

function renderDetails({ budget, date, message }) {
  const details = $('#reveal-details');
  const row = (label, value) => el('div', {}, el('dt', { text: label }), el('dd', { text: value }));

  if (budget) details.append(row('💶 Orçamento', budget));
  if (date) details.append(row('📅 Troca de presentes', formatDate(date, { weekday: true })));
  details.hidden = !details.childElementCount;

  if (message) {
    $('#reveal-message-text').textContent = message;
    $('#reveal-message').hidden = false;
  }
}

function bindButtons({ receiver }) {
  const revealButton = $('#reveal-button');
  const gift = $('#gift');
  const result = $('#reveal-result');
  const name = $('#reveal-name');
  const hideButton = $('#hide-name-button');

  revealButton.addEventListener(
    'click',
    async () => {
      const instant = prefersReducedMotion();
      revealButton.disabled = true;

      gift.classList.add('is-shaking');
      await wait(instant ? 0 : SHAKE_MS);
      gift.classList.remove('is-shaking');
      gift.classList.add('is-open');
      await wait(instant ? 0 : OPEN_MS);

      revealButton.hidden = true;
      name.textContent = receiver; // the name only enters the DOM after the click
      result.hidden = false;
      void result.offsetWidth; // force a reflow so the transition runs
      result.classList.add('is-visible');
      focusQuietly(name);
      launchConfetti();
    },
    { once: true },
  );

  hideButton.addEventListener('click', () => {
    const blurred = name.classList.toggle('is-blurred');
    hideButton.setAttribute('aria-pressed', String(blurred));
    hideButton.textContent = blurred ? '👀 Mostrar nome' : '🙈 Esconder nome';
  });
}
