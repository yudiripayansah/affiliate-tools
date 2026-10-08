// Self-check lib/admin/form.js: node scripts/check-form.mjs
import assert from 'node:assert/strict';
import { slugify, money, lines, int, bool, isHttpsUrl, wibDate, toWibInput } from '../lib/admin/form.js';

const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };

assert.equal(slugify('TWS Earbuds X1 — Édition Spéciale!'), 'tws-earbuds-x1-edition-speciale');
assert.equal(slugify('  --Halo   Dunia--  '), 'halo-dunia');
assert.equal(slugify(''), '');
assert.equal(slugify('a'.repeat(150)).length, 100);

assert.equal(money(fd({ p: '249000' }), 'p'), 249000);
assert.equal(money(fd({ p: '249000.5' }), 'p'), 249000.5);
assert.equal(money(fd({ p: '' }), 'p'), null);
assert.equal(money(fd({}), 'p'), null);
assert.ok(Number.isNaN(money(fd({ p: '-1' }), 'p')));
assert.ok(Number.isNaN(money(fd({ p: 'abc' }), 'p')));

assert.deepEqual(lines(fd({ h: ' a \n\n b\r\n c ' }), 'h'), ['a', 'b', 'c']);
assert.equal(int(fd({ n: '7' }), 'n'), 7);
assert.equal(int(fd({ n: 'x' }), 'n', 3), 3);
assert.equal(bool(fd({ b: 'on' }), 'b'), true);
assert.equal(bool(fd({}), 'b'), false);
assert.equal(isHttpsUrl('https://s.shopee.co.id/abc'), true);
assert.equal(isHttpsUrl('http://x.com'), false);
assert.equal(isHttpsUrl('javascript:alert(1)'), false);
assert.equal(wibDate(fd({ d: '2026-10-10T08:00' }), 'd'), '2026-10-10T08:00:00+07:00');
assert.equal(new Date(wibDate(fd({ d: '2026-10-10T08:00' }), 'd')).toISOString(), '2026-10-10T01:00:00.000Z');
assert.equal(wibDate(fd({ d: '' }), 'd'), null);
assert.ok(Number.isNaN(wibDate(fd({ d: '2026-13-45T99:00' }), 'd')));
assert.ok(Number.isNaN(wibDate(fd({ d: 'besok' }), 'd')));
assert.equal(toWibInput('2026-10-10T01:00:00+00:00'), '2026-10-10T08:00');
assert.equal(toWibInput('2026-10-09T20:30:00Z'), '2026-10-10T03:30');
assert.equal(toWibInput(null), '');
console.log('form: ALL OK');
