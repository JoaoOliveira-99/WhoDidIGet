/**
 * Organizer controller: wires screens 1 (setup) and 2 (send) together and
 * handles the actions that switch screens (draw, redraw, edit, start over).
 */

import { runDraw } from '../core/run-draw.js';
import { createStore } from '../store.js';
import { $, toast } from './dom.js';
import { createSendScreen } from './send.js';
import { createSetupScreen } from './setup.js';

export function startOrganizer() {
  const store = createStore({
    onSaveError: () => toast('Atenção: este navegador não deixa guardar os dados. Não recarregues a página.', 6000),
  });

  const setupSection = $('#screen-setup');
  const sendSection = $('#screen-send');

  const setup = createSetupScreen(store, { onDraw: draw });
  const send = createSendScreen(store, { onRedraw: redraw, onEdit: edit });

  function render() {
    const drawn = store.state.links !== null;
    setupSection.hidden = drawn;
    sendSection.hidden = !drawn;
    if (drawn) send.render();
    else setup.render();
  }

  /** Runs the draw and stores only the links. Returns null on success, or the list of errors. */
  function performDraw() {
    const result = runDraw(store.state);
    if (!result.ok) return result.errors;
    store.state.links = result.links;
    store.state.sent = {};
    store.save();
    return null;
  }

  function goToSend() {
    render();
    window.scrollTo(0, 0);
    send.focusTitle();
  }

  function goToSetup() {
    render();
    window.scrollTo(0, 0);
    setup.focusFirstField();
  }

  function draw() {
    const errors = performDraw();
    setup.showDrawErrors(errors ?? []);
    if (!errors) goToSend();
  }

  function redraw() {
    const confirmed = window.confirm(
      'Fazer um NOVO sorteio?\n\n' +
        'Os links que já enviaste ficam com o resultado antigo e deixam de valer. ' +
        'Vais ter de reenviar o novo link a TODAS as pessoas.',
    );
    if (!confirmed) return;

    const errors = performDraw();
    if (errors) {
      window.alert(errors.join('\n'));
      return;
    }
    goToSend();
    toast('Novo sorteio feito. Reenvia o link a todos!');
  }

  function edit() {
    const confirmed = window.confirm(
      'Para alterar participantes ou dados é preciso anular este sorteio.\n\n' +
        'Os links já enviados deixam de valer e vais ter de fazer um novo sorteio e reenviar a todos. Continuar?',
    );
    if (!confirmed) return;

    store.state.links = null;
    store.state.sent = {};
    store.save();
    goToSetup();
  }

  function startOver() {
    const confirmed = window.confirm(
      'Apagar tudo e recomeçar?\n\nPerdes os participantes, as exclusões e o sorteio. Não dá para desfazer.',
    );
    if (!confirmed) return;

    store.reset();
    setup.reset();
    goToSetup();
    toast('Tudo limpo. Vamos começar!');
  }

  for (const button of document.querySelectorAll('[data-action="start-over"]')) {
    button.addEventListener('click', startOver);
  }

  render();
}
