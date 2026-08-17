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
 * The function bodies are character-for-character identical to the source, and
 * so are the comments inside them -- they carry the SECURITY RATIONALE (why the
 * close-bracket escape exists, why the NUL strip has to precede inline()), and
 * a copy that keeps the code but drops the reasons is a copy the next person
 * edits confidently and wrongly. The only differences are mechanical:
 *
 *   1. no `export` keywords (this file sets one global instead);
 *   2. no TypeScript type annotations (`s: string`, `: string`, `string[]`);
 *   3. the UMD-ish module wrapper around the whole file, and the `return`
 *      at the bottom that exports the two functions.
 *
 * TO RE-VENDOR: copy the CURRENT markdown.ts again, redo those three
 * mechanical edits, update the header above, and run
 * `node scripts/verify-my-onboarding.js`. Never patch a divergence by hand --
 * a hub-only fix is a hub-only escape bug waiting to be found. A diff of this
 * file against the source should show ONLY the three edits above.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.CarraraMarkdown = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /**
   * Deliberately tiny Markdown subset for comms templates: bold, italic,
   * dash/numbered lists, http(s) links, paragraphs with <br /> line breaks.
   * Escape-first: the ENTIRE input is HTML-escaped before any transform, so
   * neither template text nor substituted placeholder values can inject
   * markup. Client-safe (used by the editor preview) — no server-only.
   */
  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Delimits backslash-escape placeholders below: the NUL control character,
  // code point zero, built via fromCharCode so it never sits as a raw byte in
  // this source file. escapeHtml never produces it and plain text never
  // contains it, so it can't collide with real content.
  const ESCAPE_PLACEHOLDER_DELIM = String.fromCharCode(0);
  const ESCAPE_PLACEHOLDER_RE = new RegExp(
    `${ESCAPE_PLACEHOLDER_DELIM}(\\d+)${ESCAPE_PLACEHOLDER_DELIM}`,
    "g",
  );
  const NUL_RE = new RegExp(ESCAPE_PLACEHOLDER_DELIM, "g");

  // A line-leading list marker that was backslash-escaped: "\- item",
  // "\• item", "\2. item", "\1) item". renderMarkdown's block-level isUl/isOl
  // detectors run BEFORE inline(), and they already refuse such a line —
  // neither /^\s*[-*•]\s+/ nor /^\s*\d+[.)]\s+/ can match once a backslash sits
  // where the marker should start — so by the time we get here the line is
  // safely a paragraph line and all that's left is to drop that one backslash.
  // (An asterisk bullet needs no entry: "\*" is handled by the general escape
  // pass below, which also defeats the detector.)
  const LEADING_MARKER_ESCAPE_RE = /^(\s*)\\(?=[-•]\s|\d+[.)]\s)/;

  function inline(escaped) {
    // inline() is called with one line at a time, so "^" here is a line start.
    let out = escaped.replace(LEADING_MARKER_ESCAPE_RE, "$1");

    // Additive backslash-escapes for the control characters this subset gives
    // special meaning to mid-line: a backslash before another backslash, an
    // asterisk, an open bracket, or a close bracket. Written by
    // src/lib/richtext/serialize.ts so a user who types a literal asterisk,
    // double asterisk, or bracket into the rich-text editor gets that literal
    // character back on render, not bold/italic/link syntax. Protect them
    // BEFORE the link/bold/italic regexes run — an escaped bracket would
    // otherwise still be seen as a plain one by the link regex, which doesn't
    // look behind for the backslash — then restore the literal character at the
    // end. Close bracket matters for the same reason open bracket does: a "]"
    // inside link text would otherwise close the link early and hand the
    // remainder of the text to the link regex as a second, attacker-chosen URL.
    const escapes = [];
    out = out.replace(/\\([\\*[\]])/g, (_, ch) => {
      escapes.push(ch);
      return `${ESCAPE_PLACEHOLDER_DELIM}${escapes.length - 1}${ESCAPE_PLACEHOLDER_DELIM}`;
    });

    // Whitespace inside the parens is tolerated — authors naturally write
    // [text]( {{survey_link}} ) and the merge value is a bare URL.
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
    // Strip the placeholder delimiter (the NUL control character) from the
    // input up front: it can never appear in legitimate template text, and
    // removing it makes it impossible to forge a placeholder that the restore
    // pass in inline() would resolve against someone else's escape table.
    const normalized = text.replace(NUL_RE, "").replace(/\r\n/g, "\n");
    const blocks = escapeHtml(normalized).split(/\n{2,}/);
    const html = blocks.map((block) => {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (lines.length === 0) return "";
      // Both detectors deliberately fail on a backslash-prefixed line: a
      // literal "- "/"• "/"2. "/"1) " the user typed arrives here escaped as
      // "\- " etc., and neither character class can match a backslash. That is
      // what keeps a plain paragraph beginning "2. Follow up Monday" from
      // becoming an <ol> (and from having its number rewritten to 1).
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
