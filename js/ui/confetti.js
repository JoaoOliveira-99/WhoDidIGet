/** CSS/JS confetti shower (skipped when the system asks for reduced motion). */

import { el, prefersReducedMotion } from './dom.js';

const COLORS = ['#8e1b1b', '#b3262b', '#1d5c3a', '#2f8a57', '#c99a2e', '#e8c766', '#ffffff'];
const PIECE_COUNT = 150;
const MAX_DURATION_MS = 6000;

const random = (min, max) => min + Math.random() * (max - min);

export function launchConfetti() {
  if (prefersReducedMotion()) return;

  const container = el('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < PIECE_COUNT; i++) {
    const piece = document.createElement('i');
    const width = random(6, 13);
    const { style } = piece;
    style.setProperty('--x', `${random(0, 100)}vw`);
    style.setProperty('--w', `${width}px`);
    style.setProperty('--h', `${width * random(0.6, 1.8)}px`);
    style.setProperty('--color', COLORS[i % COLORS.length]);
    style.setProperty('--piece-radius', Math.random() < 0.3 ? '50%' : '2px');
    style.setProperty('--duration', `${random(2.4, 4.6)}s`);
    style.setProperty('--delay', `${random(0, 0.8)}s`);
    style.setProperty('--dx', `${random(-110, 110)}px`);
    style.setProperty('--rotation', `${random(-720, 720)}deg`);
    container.append(piece);
  }
  document.body.append(container);
  setTimeout(() => container.remove(), MAX_DURATION_MS);
}
