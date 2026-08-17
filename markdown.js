/* VENDORED FROM POps -- DO NOT EDIT HERE.
 *
 * Source:  pops/src/lib/comms/markdown.ts
 * Commit:  4bc44838c4a52e5d6bd890b873969b1aeec25340
 * Copied:  2026-08-17
 *
 * The comms Markdown subset, INCLUDING BACKSLASH ESCAPES. This is the only
 * HTML-producing path the hub has that is fed by text somebody typed into
 * another app, and it is escape-first: the ENTIRE input is HTML-escaped before
 * any transform, so a manager's 30/60/90 plan cannot inject markup into a new
 * hire's page. It is also the renderer POps already had adversarially reviewed,
 * which is why the hub copies it rather than writing a second one.
 *
 * The function bodies are character-for-character identical to the source. The
 * only differences are mechanical: no `export` keywords, no TypeScript type
 * annotations, and the module wrapper at the bottom.
 *
 * TO RE-VENDOR: copy the CURRENT markdown.ts again, redo those three
 * mechanical edits, update the header above, and run
 * `node scripts/verify-my-onboarding.js`. Never patch a divergence by hand --
 * a hub-only fix is a hub-only escape bug waiting to be found.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.CarraraMarkdown = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const ESCAPE_PLACEHOLDER_DELIM = String.fromCharCode(0);
  const ESCAPE_PLACEHOLDER_RE = new RegExp(
    `${ESCAPE_PLACEHOLDER_DELIM}(\\d+)${ESCAPE_PLACEHOLDER_DELIM}`,
    "g",
  );
  const NUL_RE = new RegExp(ESCAPE_PLACEHOLDER_DELIM, "g");

  const LEADING_MARKER_ESCAPE_RE = /^(\s*)\\(?=[-•]\s|\d+[.)]\s)/;

  function inline(escaped) {
    let out = escaped.replace(LEADING_MARKER_ESCAPE_RE, "$1");

    const escapes = [];
    out = out.replace(/\\([\\*[\]])/g, (_, ch) => {
      escapes.push(ch);
      return `${ESCAPE_PLACEHOLDER_DELIM}${escapes.length - 1}${ESCAPE_PLACEHOLDER_DELIM}`;
    });

    out = out.replace(
      /\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/g,
      '<a href="$2">$1</a>',
    );
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*\s][^*\n]*?)\*/g, "<em>$1</em>");

    out = out.replace(ESCAPE_PLACEHOLDER_RE, (_, i) => escapes[Number(i)] ?? "");
    return out;
  }

  function renderMarkdown(text) {
    const normalized = text.replace(NUL_RE, "").replace(/\r\n/g, "\n");
    const blocks = escapeHtml(normalized).split(/\n{2,}/);
    const html = blocks.map((block) => {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (lines.length === 0) return "";
      const isUl = lines.every((l) => /^\s*[-*•]\s+/.test(l));
      const isOl = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
      if (isUl) {
        return `<ul>${lines
          .map((l) => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }
      if (isOl) {
        return `<ol>${lines
          .map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }
      return `<p>${lines.map(inline).join("<br />")}</p>`;
    });
    return html.filter(Boolean).join("\n");
  }

  return { escapeHtml: escapeHtml, renderMarkdown: renderMarkdown };
});
