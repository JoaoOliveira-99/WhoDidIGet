import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isValidEmail, isValidPhone, normalizePhone } from '../js/core/contacts.js';
import { cleanName, nameKey, validateExclusion, validateForDraw, validateParticipant } from '../js/core/validation.js';

const participants = [
  { id: '1', name: 'Ana Rita', phone: '912345678', email: '' },
  { id: '2', name: 'João', phone: '', email: 'joao@exemplo.pt' },
];
const fieldsOf = (errors) => errors.map((e) => e.field);

describe('names', () => {
  it('compares ignoring case and spaces', () => {
    assert.equal(nameKey('  ana   RITA '), nameKey('Ana Rita'));
    assert.equal(nameKey('AnaRita'), nameKey('Ana Rita'));
  });

  it('cleans extra spaces', () => {
    assert.equal(cleanName('  Ana   Rita  '), 'Ana Rita');
  });
});

describe('contacts', () => {
  it('normalizes Portuguese and international phone numbers', () => {
    assert.equal(normalizePhone('912 345 678'), '351912345678');
    assert.equal(normalizePhone('+351 912-345-678'), '351912345678');
    assert.equal(normalizePhone('00351912345678'), '351912345678');
    assert.equal(normalizePhone('+44 (20) 7946.0958'), '442079460958');
  });

  it('validates phone numbers', () => {
    assert.ok(isValidPhone('912 345 678'));
    assert.ok(isValidPhone('+33 6 12 34 56 78'));
    assert.ok(!isValidPhone('1234'));
    assert.ok(!isValidPhone('91234567a'));
  });

  it('validates emails', () => {
    assert.ok(isValidEmail('nome@exemplo.pt'));
    assert.ok(!isValidEmail('nome@exemplo'));
    assert.ok(!isValidEmail('nome exemplo.pt'));
    assert.ok(!isValidEmail('@exemplo.pt'));
  });
});

describe('validateParticipant', () => {
  it('accepts a valid participant', () => {
    assert.deepEqual(validateParticipant({ name: 'Rui', phone: '913 000 000', email: '' }, participants), []);
  });

  it('requires a name', () => {
    assert.deepEqual(fieldsOf(validateParticipant({ name: '', phone: '913000000', email: '' }, participants)), ['name']);
  });

  it('rejects duplicate names (case/spaces)', () => {
    assert.deepEqual(fieldsOf(validateParticipant({ name: 'ANA  rita', phone: '913000000', email: '' }, participants)), ['name']);
  });

  it('allows keeping your own name when editing', () => {
    assert.deepEqual(validateParticipant({ name: 'Ana Rita', phone: '913000000', email: '' }, participants, '1'), []);
  });

  it('requires a phone or an email', () => {
    assert.deepEqual(fieldsOf(validateParticipant({ name: 'Rui', phone: '', email: '' }, participants)), ['phone']);
  });

  it('validates email and phone formats', () => {
    assert.deepEqual(fieldsOf(validateParticipant({ name: 'Rui', phone: '12', email: 'rui@' }, participants)), ['phone', 'email']);
  });
});

describe('validateForDraw', () => {
  it('requires at least 3 participants', () => {
    assert.equal(validateForDraw(participants).length, 1);
    assert.deepEqual(validateForDraw([...participants, { id: '3', name: 'Rui', phone: '913000000', email: '' }]), []);
  });
});

describe('validateExclusion', () => {
  it('accepts a new pair and rejects invalid ones', () => {
    assert.equal(validateExclusion('1', '2', participants, []), null);
    assert.ok(validateExclusion('1', '1', participants, []));
    assert.ok(validateExclusion('1', '', participants, []));
    assert.ok(validateExclusion('1', '99', participants, []));
    assert.ok(validateExclusion('2', '1', participants, [{ a: '1', b: '2' }]), 'duplicate in reverse order');
  });
});
