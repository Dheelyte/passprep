import "server-only";
import { Marked, type TokenizerAndRendererExtension } from "marked";
import katex from "katex";

// Markdown + KaTeX for questions and explanations, rendered on the server so
// phones download HTML instead of a maths library.
// Raw HTML in content is escaped and only http(s)/mailto links are allowed.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tex(src: string, displayMode: boolean) {
  try {
    return katex.renderToString(src, { displayMode, throwOnError: false, output: "html", strict: "ignore" });
  } catch {
    return `<code>${escapeHtml(src)}</code>`;
  }
}

const blockMath: TokenizerAndRendererExtension = {
  name: "blockMath",
  level: "block",
  start: (src) => src.indexOf("$$"),
  tokenizer(src) {
    const m = /^\$\$([\s\S]+?)\$\$(?:\n|$)/.exec(src);
    if (m) return { type: "blockMath", raw: m[0], text: m[1].trim() };
  },
  renderer: (t) => `<div class="math-block">${tex(t.text, true)}</div>`,
};

const inlineMath: TokenizerAndRendererExtension = {
  name: "inlineMath",
  level: "inline",
  start: (src) => src.indexOf("$"),
  tokenizer(src) {
    const m = /^\$(?!\s)((?:\\\$|[^$\n])+?)(?<!\s)\$/.exec(src);
    if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
  },
  renderer: (t) => tex(t.text, false),
};

const md = new Marked({ gfm: true, breaks: true });
md.use({
  extensions: [blockMath, inlineMath],
  renderer: {
    html: ({ text }) => escapeHtml(text),
    link({ href, text }) {
      const safe = /^(https?:|mailto:)/i.test(href) ? href : "#";
      return `<a href="${escapeHtml(safe)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
    },
    image: ({ text }) => escapeHtml(text), // no remote images: keeps pages light and safe
  },
});

export function renderMarkdown(src: string): string {
  return md.parse(src, { async: false }) as string;
}

export function renderInline(src: string): string {
  return md.parseInline(src, { async: false }) as string;
}
