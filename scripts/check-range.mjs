// Self-check resolveRange (lib/admin/analytics.js): node --env-file=.env.local scripts/check-range.mjs
import assert from 'node:assert/strict';
import { resolveRange } from '../lib/admin/range.js';

// 8 Okt 2026 pukul 02:30 WIB = 7 Okt 19:30 UTC -> "hari ini" WIB adalah 8 Okt.
const now = Date.parse('2026-10-07T19:30:00Z');
const r7 = resolveRange({ days: '7' }, now);
assert.equal(r7.from, '2026-10-02');
assert.equal(r7.to, '2026-10-08');
assert.equal(r7.since.toISOString(), '2026-10-01T17:00:00.000Z', '00:00 WIB 2 Okt');
assert.equal(r7.until.getTime(), now);

assert.equal(resolveRange({}, now).days, 30, 'default 30 hari');
assert.equal(resolveRange({ days: '999' }, now).days, 30, 'preset tak dikenal -> 30');

const c = resolveRange({ from: '2026-09-01', to: '2026-09-30' }, now);
assert.equal(c.mode, 'custom');
assert.equal(c.since.toISOString(), '2026-08-31T17:00:00.000Z');
assert.equal(c.until.toISOString(), '2026-09-30T17:00:00.000Z', 'to inklusif -> 00:00 WIB hari berikutnya');

assert.equal(resolveRange({ from: '2026-09-30', to: '2026-09-01' }, now).mode, 'preset', 'from > to ditolak');
assert.equal(resolveRange({ from: 'kemarin', to: '2026-09-01' }, now).mode, 'preset', 'format salah ditolak');
console.log('range: ALL OK');
