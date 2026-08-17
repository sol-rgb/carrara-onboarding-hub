/* "My Onboarding": the hire's own section.
 *
 * Pure logic only -- no DOM, no localStorage, no fetch. app.js owns all three
 * and passes their contents in, which is what lets scripts/verify-my-onboarding.js
 * require this file in Node and drive every decision directly. Loaded in the
 * browser like links.js and pages.js: a plain script that sets one global.
 *
 * Loaded AFTER markdown.js -- renderSection puts the manager's text through it.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./markdown.js'));
  else root.MyOnboarding = factory(root.CarraraMarkdown);
})(typeof window !== 'undefined' ? window : globalThis, function (md) {
  'use strict';

  var SECTION_ID = 'my-onboarding';
  /* New keys, in the store() idiom app.js already uses for carrara_tour and
     carrara_checklist. VISITED_KEY is what the reveal is decided from; SEEN_KEY
     is only the NEW badge's memory. */
  var VISITED_KEY = 'carrara_sections_visited';
  var SEEN_KEY = 'carrara_my_onboarding_seen';

  var esc = md.escapeHtml;

  /* A section id joins the visited list once. Returns a NEW array so a caller
     can tell whether anything changed by comparing lengths. */
  function addVisit(visited, id) {
    var list = Array.isArray(visited) ? visited.slice() : [];
    if (!id || id === SECTION_ID) return list;
    if (list.indexOf(id) === -1) list.push(id);
    return list;
  }

  /* Every OTHER section seen at least once. otherIds is SECTIONS minus this
     one, passed in by app.js so the list has exactly one home. */
  function allVisited(visited, otherIds) {
    var list = Array.isArray(visited) ? visited : [];
    return otherIds.length > 0 && otherIds.every(function (id) { return list.indexOf(id) > -1; });
  }

  /* What the nav should show. 'hidden' until the hub has been walked; 'new'
     until the section itself has been opened once; 'plain' after that. A hire
     whose section never appears is a visible pipeline failure -- the reveal
     doubles as a health check (spec decision 2), so it is never shown early. */
  function navState(visited, otherIds, seen) {
    if (!allVisited(visited, otherIds)) return 'hidden';
    return seen ? 'plain' : 'new';
  }

  /* The manager's free-text answer, one sync per line.
     "River Slate - runs the pod" -> { name: 'River Slate', why: 'runs the pod' }
     A line with no delimiter is all name: guessing harder would split
     "Jean-Luc Picard" down the middle, and a name with no reason still renders.

     The two delimiters are spaced differently ON PURPOSE, because people type
     them differently:
       - a DASH must have whitespace on BOTH sides, so the hyphen inside
         "Jean-Luc Picard" or "Mary-Kate Olsen-Smith" is not a delimiter;
       - a COLON needs whitespace only AFTER it, because nobody writes
         "River Slate : runs the pod" -- they write "River Slate: runs the pod".
         Requiring the trailing space is what keeps "Standup at 10:30" whole. */
  var SYNC_SPLIT = /(?:\s+[-–—]|\s*:)\s+/;
  function parseSyncWith(text) {
    if (typeof text !== 'string') return [];
    return text.split(/\r?\n/)
      .map(function (line) { return line.replace(/^\s*[-*•]\s+/, '').trim(); })
      .filter(function (line) { return line.length > 0; })
      .map(function (line) {
        var at = line.search(SYNC_SPLIT);
        if (at === -1) return { name: line, why: '' };
        var delim = line.slice(at).match(SYNC_SPLIT)[0];
        return { name: line.slice(0, at).trim(), why: line.slice(at + delim.length).trim() };
      });
  }

  return {
    SECTION_ID: SECTION_ID,
    VISITED_KEY: VISITED_KEY,
    SEEN_KEY: SEEN_KEY,
    addVisit: addVisit,
    allVisited: allVisited,
    navState: navState,
    parseSyncWith: parseSyncWith,
    esc: esc
  };
});
