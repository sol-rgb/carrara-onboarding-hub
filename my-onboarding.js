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
     one, passed in by app.js so the list has exactly one home.

     Both arguments are treated as "an array or nothing": a caller that has not
     built its section list yet, or a localStorage read that returned null,
     gets 'hidden' rather than a TypeError. Hiding on bad input is the safe
     default -- the reveal is a reward for walking the hub, and showing it early
     because a list was missing would be the one failure nobody would notice.
     An EMPTY otherIds is never "all visited": with no sections to walk, there
     is nothing to have finished. */
  function allVisited(visited, otherIds) {
    var list = Array.isArray(visited) ? visited : [];
    var ids = Array.isArray(otherIds) ? otherIds : [];
    return ids.length > 0 && ids.every(function (id) { return list.indexOf(id) > -1; });
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
        /* at === 0 is a line that OPENS with a delimiter (": runs the pod").
           Splitting there would render a bullet with no name at all, so the
           line stays whole: the same answer a line with no delimiter gets. */
        if (at <= 0) return { name: line, why: '' };
        var delim = line.slice(at).match(SYNC_SPLIT)[0];
        return { name: line.slice(0, at).trim(), why: line.slice(at + delim.length).trim() };
      });
  }

  /* The 30/60/90 timeline's steps, in the wire contract's order. The keys are
     the manager_hub question keys POps returns verbatim. */
  var STEPS = [['30', 'thirty_days'], ['60', 'sixty_days'], ['90', 'ninety_days']];

  function text(v) { return typeof v === 'string' && v.trim() ? v : ''; }

  /* The whole section, as one HTML string.
     Every value from POps or from clients.json goes through esc() or through
     md.renderMarkdown(), which escapes first -- there is no third path.
     A missing block is omitted, never opened empty: the manager may have
     answered one question or none. Attribute values are interpolated inside
     DOUBLE quotes only -- esc() escapes " but not ', by design, because it is
     POps' escaper and POps' templates quote the same way. */
  function renderSection(kit) {
    if (!kit) {
      /* Revealed by walking the hub, which anyone can do -- so this state is
         reachable and has to say something useful rather than nothing. */
      return '<h1 class="display">Your onboarding.</h1>'
        + '<p class="body-copy">Your hiring manager writes this part: your first client, who to '
        + 'meet, and your first 90 days. Open the welcome kit at the bottom right and enter your '
        + 'access code to see yours.</p>';
    }

    var plan = kit.plan || {};
    var h = '<h1 class="display">Your onboarding, ' + esc(kit.firstName || 'welcome') + '.</h1>';

    var intro = text(plan.manager_intro);
    if (intro) {
      h += '<div class="quote-block mo-note">'
        + '<div class="pull">' + md.renderMarkdown(intro) + '</div>'
        + '<p class="attr">'
        + esc(kit.manager && kit.manager.name ? kit.manager.name : 'Your hiring manager')
        + ', your hiring manager.</p></div>';
    }

    var cards = '';
    if (kit.client && kit.client.name) {
      cards += '<div class="mo-card"><div class="wk-lbl">[your first client]</div>'
        + '<div class="mo-card-name">' + esc(kit.client.name) + '</div>'
        + (kit.client.lead ? '<p class="mo-card-line">Led by ' + esc(String(kit.client.lead).replace(/\.+$/, '')) + '.</p>' : '')
        + (kit.client.work && kit.client.work.length
            ? '<div class="wk-tags">' + kit.client.work.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>'
            : '')
        + '<div class="wk-links">'
        + (kit.client.domain ? '<a href="https://' + esc(kit.client.domain) + '" target="_blank" rel="noopener">' + esc(kit.client.domain) + ' ↗</a>' : '')
        + '<a href="#/clients">All clients and who leads them</a></div>'
        + '</div>';
    }
    if (kit.syncWith && kit.syncWith.length) {
      /* The manager's own words about their own people: names and reasons are
         free text, NOT markdown. esc() is the only path they take. */
      cards += '<div class="mo-card"><div class="wk-lbl">[sync with them in week one]</div>'
        + '<ul class="mo-syncs">'
        + kit.syncWith.map(function (s) {
            return '<li><b>' + esc(s.name) + '</b>' + (s.why ? ': ' + esc(s.why) : '') + '</li>';
          }).join('')
        + '</ul></div>';
    }
    if (cards) h += '<div class="mo-cards">' + cards + '</div>';

    var steps = STEPS.filter(function (s) { return text(plan[s[1]]); });
    if (steps.length) {
      h += '<h2 class="sub">Your first 90 days</h2>'
        + '<p class="body-copy muted" style="font-size:13px">Written by your manager. Bring questions to '
        + 'your day-one 1:1.</p>'
        + '<div class="mo-timeline">'
        + steps.map(function (s) {
            return '<div class="mo-step"><div class="mo-day">' + s[0] + '</div>'
              + '<div class="mo-body">' + md.renderMarkdown(plan[s[1]]) + '</div></div>';
          }).join('')
        + '</div>';
    }

    /* Everything the popup used to carry and the mockup does not name. It moves
       here rather than disappearing -- the popup "never carries content again"
       (spec decision 1), and none of this was content anybody decided to drop. */
    var extra = '';
    if (kit.team && kit.team.how && kit.team.how.length) {
      extra += '<div class="wk-sec"><div class="wk-lbl">[how ' + esc(String(kit.team.label || 'your team').toLowerCase()) + ' works here]</div><ul>'
        + kit.team.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    var mgrDm = kit.manager && kit.manager.id && typeof window !== 'undefined' && window.LINKS
      ? window.LINKS.slackWorkspace + '/team/' + kit.manager.id : '';
    extra += '<div class="wk-sec"><div class="wk-lbl">[before your first 1:1]</div>'
      + '<p>Take the free Enneagram test below (about 10 minutes, no signup). When you have your type, '
      + 'send it' + (kit.manager && kit.manager.name ? ' to ' + esc(kit.manager.name) : ' to your manager')
      + ' so they can shape how you two work together.</p><div class="wk-links">'
      + '<a href="https://www.eclecticenergies.com/enneagram/test" target="_blank" rel="noopener">Take the Enneagram test ↗</a>'
      + (mgrDm ? '<a href="' + esc(mgrDm) + '" target="_blank" rel="noopener">DM your result to ' + esc(kit.manager.name) + ' ↗</a>' : '')
      + '</div></div>';
    if (kit.links && kit.links.length) {
      extra += '<div class="wk-sec"><div class="wk-lbl">[start with these]</div><div class="wk-links">'
        + kit.links.map(function (l) {
            var ext = l.external || /^https?:/.test(l.href);
            return '<a href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>'
              + esc(l.label) + (ext ? ' ↗' : '') + '</a>';
          }).join('') + '</div></div>';
    }
    h += '<div class="mo-extra">' + extra + '</div>';

    if (text(kit.payNote)) h += '<p class="mo-note-line">' + esc(kit.payNote) + '</p>';
    h += '<button class="wk-reset mo-reset" id="mo-reset">Not you? Enter a different code</button>';
    return h;
  }

  return {
    SECTION_ID: SECTION_ID,
    VISITED_KEY: VISITED_KEY,
    SEEN_KEY: SEEN_KEY,
    addVisit: addVisit,
    allVisited: allVisited,
    navState: navState,
    parseSyncWith: parseSyncWith,
    renderSection: renderSection,
    esc: esc
  };
});
