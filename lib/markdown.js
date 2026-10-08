// Render Markdown halaman statis. Konten ditulis admin, tapi tetap dibuat aman:
// HTML mentah di-escape, link hanya https/http/mailto/path internal, gambar hanya https.
import { Marked } from 'marked';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SAFE_LINK = /^(https?:\/\/|mailto:|\/(?!\/))/i;

const md = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escape(text),
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!SAFE_LINK.test(href)) return text;
      const external = /^https?:\/\//i.test(href);
      return `<a href="${escape(href)}"${title ? ` title="${escape(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
    image: ({ href, text }) => (/^https:\/\//i.test(href) ? `<img src="${escape(href)}" alt="${escape(text)}" loading="lazy">` : escape(text)),
  },
});

export const renderMarkdown = (src) => md.parse(String(src ?? ''));
