import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDate } from '../js/core/dates.js';
import { buildMessage, contactSummary, emailSubject, mailtoUrl, smsUrl, whatsappUrl } from '../js/core/messages.js';

const draw = { name: 'Natal 2026', budget: '20€', date: '2026-12-24' };
const message = buildMessage({ name: 'João', draw, link: 'https://x.pt/#TOKEN' });

describe('buildMessage', () => {
  it('includes the link, budget and date', () => {
    assert.match(message, /^Olá João! 🎁/);
    assert.ok(message.includes('https://x.pt/#TOKEN'));
    assert.ok(message.includes('Orçamento: 20€ · Troca: 24 de dezembro de 2026'));
  });

  it('omits budget and date when empty', () => {
    const short = buildMessage({ name: 'J', draw: { name: '', budget: '', date: '' }, link: 'L' });
    assert.ok(!short.includes('\n'));
    assert.ok(short.includes('Amigo Secreto'));
  });
});

describe('sharing URLs', () => {
  it('builds the WhatsApp URL with a normalized number', () => {
    const url = whatsappUrl('912 345 678', message);
    assert.ok(url.startsWith('https://wa.me/351912345678?text='));
    assert.equal(decodeURIComponent(url.split('?text=')[1]), message);
  });

  it('builds the SMS URL with the right separator for each platform', () => {
    const android = smsUrl('912 345 678', message);
    const ios = smsUrl('912 345 678', message, { ios: true });
    assert.ok(android.startsWith('sms:+351912345678?body='));
    assert.ok(ios.startsWith('sms:+351912345678&body='));
    assert.equal(decodeURIComponent(android.split('body=')[1]), message);
  });

  it('builds the mailto URL with encoded subject and CRLF body', () => {
    const url = mailtoUrl('joao@exemplo.pt', emailSubject(draw), message);
    assert.ok(url.startsWith('mailto:joao@exemplo.pt?subject='));
    assert.equal(decodeURIComponent(url.split('&body=')[1]), message.replace(/\n/g, '\r\n'));
  });
});

describe('contactSummary', () => {
  it('joins the available contacts', () => {
    assert.equal(contactSummary({ phone: '912', email: 'a@b.pt' }), '📱 912 · ✉️ a@b.pt');
    assert.equal(contactSummary({ phone: '', email: 'a@b.pt' }), '✉️ a@b.pt');
  });
});

describe('formatDate', () => {
  it('formats ISO dates in pt-PT', () => {
    assert.equal(formatDate('2026-12-24'), '24 de dezembro de 2026');
    assert.match(formatDate('2026-12-24', { weekday: true }), /quinta-feira/);
  });

  it('returns non-ISO input unchanged', () => {
    assert.equal(formatDate('amanhã'), 'amanhã');
    assert.equal(formatDate(''), '');
  });
});
