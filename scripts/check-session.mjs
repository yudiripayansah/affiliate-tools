// Self-check lib/session.js: node --env-file=.env.local scripts/check-session.mjs
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken, checkPassword } from '../lib/session.js';

const t = createSessionToken();
assert.equal(verifySessionToken(t), true, 'token baru valid');
assert.equal(verifySessionToken(t, Date.now() + 8 * 864e5), false, 'kedaluwarsa setelah 7 hari');
const [exp, sig] = t.split('.');
assert.equal(verifySessionToken(`${Number(exp) + 1}.${sig}`), false, 'expiry diubah -> tanda tangan tidak cocok');
assert.equal(verifySessionToken(`${exp}.${'0'.repeat(64)}`), false, 'tanda tangan palsu');
for (const bad of [undefined, '', 'abc', '.', `${exp}.`, `x.${sig}`]) assert.equal(verifySessionToken(bad), false, `token rusak: ${bad}`);
assert.equal(checkPassword(process.env.ADMIN_PASSWORD), true, 'password benar');
for (const bad of ['', 'salah', undefined, process.env.ADMIN_PASSWORD + ' ']) assert.equal(checkPassword(bad), false, 'password salah');
console.log('session: ALL OK');
