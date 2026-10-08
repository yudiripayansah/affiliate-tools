// Self-check lib/markdown.js: node scripts/check-markdown.mjs
import assert from 'node:assert/strict';
import { renderMarkdown as r } from '../lib/markdown.js';

assert.match(r('## Judul\n\n**tebal**'), /<h2>Judul<\/h2>[\s\S]*<strong>tebal<\/strong>/);
assert.ok(!r('<script>alert(1)</script>').includes('<script>'), 'script di-escape');
assert.ok(r('<script>alert(1)</script>').includes('&lt;script&gt;'));
assert.ok(!r('<img src=x onerror=alert(1)>').includes('<img'), 'html img di-escape');
assert.ok(!r('[klik](javascript:alert(1))').includes('href'), 'javascript: link dibuang');
assert.ok(!r('[klik](//evil.com)').includes('href'), 'protocol-relative dibuang');
assert.match(r('[Kontak](/kontak)'), /<a href="\/kontak">Kontak<\/a>/);
assert.match(r('[IG](https://instagram.com/fauqa)'), /target="_blank" rel="noopener noreferrer"/);
assert.match(r('[Email](mailto:halo@fauqa.id)'), /href="mailto:halo@fauqa.id"/);
assert.ok(!r('![x](http://a.com/x.png)').includes('<img'), 'gambar http ditolak');
assert.match(r('![foto](https://a.com/x.png)'), /<img src="https:\/\/a.com\/x.png" alt="foto"/);
assert.ok(!r('[a](https://x.com" onmouseover="alert(1))').includes('onmouseover="'), 'atribut tidak bisa disisipkan');
console.log('markdown: ALL OK');
