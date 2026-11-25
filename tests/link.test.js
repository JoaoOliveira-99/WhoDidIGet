import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { baseUrl, buildLink, decode, encode, extractToken, isLocalLocation } from '../js/core/link.js';

const sample = {
  name: 'Natal 2026',
  budget: '20€',
  date: '2026-12-24',
  message: 'Jantar às 20h 🎄\nTragam embrulho!',
  giver: 'João',
  receiver: 'Inês Conceição',
};

describe('encode / decode', () => {
  it('round-trips accents, emoji and line breaks', () => {
    assert.deepEqual(decode(encode(sample)), sample);
  });

  it('produces a URL-safe token where the name is not readable at a glance', () => {
    const token = encode(sample);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    // Plain base64 would not be enough: decoding it by hand must not reveal the name.
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    assert.ok(!raw.includes('Inês') && !raw.includes('"para"'));
  });

  it('keeps the documented wire format', () => {
    const raw = Buffer.from(encode(sample), 'base64url');
    const key = new TextEncoder().encode('WhoDidIGET·amigo-secreto·🎁');
    const json = new TextDecoder().decode(raw.map((byte, i) => byte ^ key[i % key.length]));
    assert.deepEqual(Object.keys(JSON.parse(json)), ['sorteio', 'orcamento', 'data', 'mensagem', 'de', 'para']);
  });

  it('rejects broken, truncated or empty tokens', () => {
    const token = encode(sample);
    for (const bad of ['', 'not-a-real-link', token.slice(0, 20), token.slice(0, -3), 'a+b/c=', null, undefined, 42]) {
      assert.equal(decode(bad), null, `should reject ${String(bad).slice(0, 30)}`);
    }
  });

  it('rejects tokens without a giver or receiver', () => {
    assert.equal(decode(encode({ ...sample, receiver: '' })), null);
    assert.equal(decode(encode({ ...sample, giver: '   ' })), null);
  });
});

describe('extractToken', () => {
  it('strips the # and trailing punctuation', () => {
    assert.equal(extractToken('#abc_DEF-123'), 'abc_DEF-123');
    assert.equal(extractToken('#abc123.'), 'abc123');
    assert.equal(extractToken('#abc123)!'), 'abc123');
  });

  it('decodes %XX escapes', () => {
    assert.equal(extractToken('#abc%2D123'), 'abc-123');
  });

  it('does not throw on an invalid % escape (the token is then rejected)', () => {
    const token = extractToken('#abc%E0');
    assert.equal(token, 'abc%E0');
    assert.equal(decode(token), null);
  });
});

describe('baseUrl / buildLink / isLocalLocation', () => {
  it('uses origin + pathname on hosted sites', () => {
    const location = {
      protocol: 'https:',
      origin: 'https://example.github.io',
      pathname: '/whodidiget/',
      href: 'https://example.github.io/whodidiget/?x=1#abc',
      hostname: 'example.github.io',
    };
    assert.equal(baseUrl(location), 'https://example.github.io/whodidiget/');
    assert.equal(buildLink(baseUrl(location), 'TOKEN'), 'https://example.github.io/whodidiget/#TOKEN');
    assert.equal(isLocalLocation(location), false);
  });

  it('works on file://', () => {
    const location = { protocol: 'file:', origin: 'null', pathname: '/C:/site/index.html', href: 'file:///C:/site/index.html#x', hostname: '' };
    assert.equal(baseUrl(location), 'file:///C:/site/index.html');
    assert.equal(isLocalLocation(location), true);
  });

  it('treats localhost as local', () => {
    for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'laptop.local']) {
      assert.equal(isLocalLocation({ protocol: 'http:', hostname }), true, hostname);
    }
  });
});
