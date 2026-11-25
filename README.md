# 🎁 WhoDidIGET

Organizador de amigo secreto. O organizador introduz os participantes, faz o sorteio e envia
a cada pessoa, por WhatsApp, SMS ou email, um link privado. Ninguém — nem o organizador — vê os pares:
só quem abre o seu link descobre a quem vai oferecer.

HTML, CSS e JavaScript puros (módulos ES), sem frameworks nem dependências.
O código está em inglês; a interface está em português de Portugal.

## Correr localmente

Os módulos ES não carregam a partir de `file://`, por isso é preciso um servidor:

```bash
npm start            # http://localhost:8080  (servidor incluído, sem dependências)
```

Também serve qualquer outro servidor estático (`python -m http.server`, extensão Live Server…).

## Testes

```bash
npm test             # node:test — requer Node 20+
```

No browser, na consola: `selfTest()` faz 10 000 sorteios e valida as regras.

## Publicar

É um site estático: basta publicar a pasta tal como está.

- **GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
- **Netlify:** arrastar a pasta para o painel, ou ligar o repositório (sem comando de build).

Os links usam o endereço onde a página está (`origin + pathname`), por isso funcionam em qualquer
domínio ou subpasta. Os testes, o `package.json` e a pasta `scripts/` não são usados pelo site.

## Estrutura

```
index.html              Markup of the 3 screens
favicon.svg
css/styles.css          All styles (mobile-first)
js/
  main.js               Entry point: with # → reveal; without # → organizer
  selftest.js           selfTest() for the browser console
  store.js              In-memory state + persistence
  storage.js            localStorage (always wrapped in try/catch)
  core/                 Pure logic, no DOM — tested in Node
    draw.js             Fisher–Yates with crypto.getRandomValues + circle + exclusions
    run-draw.js         Validation + draw + link generation (pairs never leave it)
    link.js             JSON → UTF-8 → XOR → base64url, and back
    validation.js       Unique names, contacts, exclusions
    contacts.js         Phone normalization (351) and emails
    messages.js         Message text, wa.me, sms: and mailto: URLs
    dates.js            pt-PT date formatting
    state.js            State shape and sanitizing of stored data
  ui/                   Screens (DOM)
    organizer.js        Wires screens 1 and 2 and the actions that switch screens
    setup.js            Screen 1 — draw details, participants, exclusions
    send.js             Screen 2 — WhatsApp, SMS, email, copy link, "sent" flag
    reveal.js           Screen 3 — gift, name, confetti
    confetti.js
    dom.js              Helpers ($, el, toast, copyText…)
tests/                  Logic tests (node --test)
scripts/server.js       Static server for development
```

## Privacidade

- Os pares só existem em memória durante o sorteio; o `localStorage` guarda apenas os links.
- Os dados de cada link vão no fragmento (`#…`), que os browsers não enviam ao servidor.
- A ofuscação (XOR + base64) só impede que o nome se leia à primeira vista. **Não é cifra**:
  quem souber JavaScript consegue descodificar um link.
- Os nomes dos campos dentro do link (`sorteio`, `orcamento`, `data`, `mensagem`, `de`, `para`)
  e a chave em `js/core/link.js` fazem parte do formato: mudá-los invalida os links já enviados.
