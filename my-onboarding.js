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

  /* Which Notion directory teams count as "your team" for each offering key
     the code carries (welcome.json's teams keys). gtm and other have no
     directory team yet, so their card shows the label and the team page. */
  var TEAM_DIRECTORY = {
    talent: ['Talent Acquisition', 'Talent Management'],
    finance: ['Strategic Finance', 'Managed Services / BizOps']
  };

  /* Who a hire asks when the answer is not their manager's to give. Content,
     not plumbing: edit freely. */
  var HELPERS = [
    { name: 'Eric Fernandez', what: 'access, tools, pay and paperwork' },
    { name: 'Kenna Meyerhoff', what: 'anything about how we work' }
  ];

  function initials(name) {
    return String(name || '').split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function avatar(person, cls) {
    return '<span class="' + cls + '">'
      + (person && person.avatar ? '<img src="' + esc(person.avatar) + '" alt="" loading="lazy">' : esc(initials(person && person.name)))
      + '</span>';
  }
  function channel(name) {
    return typeof window !== 'undefined' && window.channelUrl ? window.channelUrl(name) : '';
  }

  /* The whole section, as one HTML string.
     Every value from POps or from clients.json goes through esc() or through
     md.renderMarkdown(), which escapes first -- there is no third path.
     A missing block is omitted, never opened empty: the manager may have
     answered one question or none. Attribute values are interpolated inside
     DOUBLE quotes only -- esc() escapes " but not ', by design, because it is
     POps' escaper and POps' templates quote the same way.

     ctx is what app.js knows and the kit does not: the manager's photo and
     email from the team roster, the people on the hire's team, and checklist
     progress. Every field is optional; the section renders without any of it. */
  function renderSection(kit, ctx) {
    if (!kit) {
      /* Revealed by walking the hub, which anyone can do -- so this state is
         reachable and has to say something useful rather than nothing. */
      return '<h1 class="display">Your onboarding.</h1>'
        + '<p class="body-copy">Your hiring manager writes this part: your first client, who to '
        + 'meet, and your first 90 days. Open the welcome kit at the bottom right and enter your '
        + 'access code to see yours.</p>';
    }
    ctx = ctx || {};

    var plan = kit.plan || {};
    var mgrName = kit.manager && kit.manager.name ? kit.manager.name : '';
    var h = '<h1 class="display">Your onboarding, ' + esc(kit.firstName || 'welcome') + '.</h1>';

    var intro = text(plan.manager_intro);
    if (intro) {
      h += '<div class="quote-block mo-note">'
        + '<div class="pull">' + md.renderMarkdown(intro) + '</div>'
        /* Without a name the attribution is the role on its own. Appending the
           role to the fallback read "Your hiring manager, your hiring manager." */
        + '<p class="attr">'
        + (mgrName ? esc(mgrName) + ', your hiring manager.' : 'Your hiring manager.')
        + '</p></div>';
    }

    /* ---- the three cards: your team, your manager, questions ---- */
    var top = '';
    var teamLabel = kit.team && kit.team.label ? kit.team.label : 'Your team';
    var peers = Array.isArray(ctx.peers) ? ctx.peers : [];
    top += '<div class="mo-card mo-top"><div class="wk-lbl">[your team]</div>'
      + '<div class="mo-card-name">' + esc(teamLabel) + '</div>'
      + (peers.length
          ? '<p class="mo-card-line">' + peers.length + (peers.length === 1 ? ' person does' : ' people do')
            + ' the same kind of work you do.</p>'
            + '<div class="mo-faces">' + peers.slice(0, 8).map(function (p) {
                return '<span title="' + esc(p.name) + '">' + avatar(p, 'mo-face') + '</span>';
              }).join('')
            + (peers.length > 8 ? '<span class="mo-face mo-more">+' + (peers.length - 8) + '</span>' : '')
            + '</div>'
          : '<p class="mo-card-line">The people you will work alongside.</p>')
      + '<div class="wk-links"><a href="#/team"'
      + (ctx.teamFilter ? ' data-team-filter="' + esc(ctx.teamFilter) + '"' : '')
      + '>Meet your team</a></div></div>';

    if (mgrName) {
      var m = ctx.manager || {};
      var dm = kit.manager.id && typeof window !== 'undefined' && window.LINKS
        ? window.LINKS.slackWorkspace + '/team/' + kit.manager.id : '';
      /* A card that flips: the face on the front, how to reach them on the
         back. Hover flips it on a desktop, a tap (the button) everywhere. */
      top += '<div class="mo-card mo-top mo-flip" tabindex="0" role="button" aria-label="Flip to see how to reach '
        + esc(mgrName) + '"><div class="mo-flip-in">'
        + '<div class="mo-face-front"><div class="wk-lbl">[your manager]</div>'
        + avatar({ name: mgrName, avatar: m.avatar }, 'mo-mgr-av')
        + '<div class="mo-card-name">' + esc(mgrName) + '</div>'
        + (m.role ? '<p class="mo-card-line">' + esc(m.role) + '</p>' : '')
        + '<p class="mo-flip-hint">Flip for how to reach them</p></div>'
        + '<div class="mo-face-back"><div class="wk-lbl">[reach ' + esc(mgrName.split(/\s+/)[0]) + ']</div>'
        + '<div class="wk-links">'
        + (dm ? '<a href="' + esc(dm) + '" target="_blank" rel="noopener">Message on Slack ↗</a>' : '')
        + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '')
        + '</div><p class="mo-card-line">Your day-one 1:1 is with them. Bring your questions on the plan below.</p>'
        + '</div></div></div>';
    }

    var noDumb = channel('g-no-dumb-questions');
    top += '<div class="mo-card mo-top"><div class="wk-lbl">[questions]</div>'
      + '<div class="mo-card-name">Ask early, ask often.</div>'
      + '<ul class="mo-syncs">'
      + (mgrName ? '<li><b>' + esc(mgrName) + '</b>: your work, your client, your plan</li>' : '')
      + HELPERS.filter(function (x) { return x.name !== mgrName; }).map(function (x) {
          return '<li><b>' + esc(x.name) + '</b>: ' + esc(x.what) + '</li>';
        }).join('')
      + '</ul>'
      + (noDumb ? '<div class="wk-links"><a href="' + esc(noDumb) + '" target="_blank" rel="noopener">#g-no-dumb-questions ↗</a></div>' : '')
      + '</div>';
    h += '<div class="mo-cards mo-cards-3">' + top + '</div>';

    /* ---- the plan ---- */
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

    /* ---- client and week-one people ---- */
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
      cards += '<div class="mo-card"><div class="wk-lbl">[book time with them in week one]</div>'
        + '<ul class="mo-syncs">'
        + kit.syncWith.map(function (s) {
            return '<li><b>' + esc(s.name) + '</b>' + (s.why ? ': ' + esc(s.why) : '') + '</li>';
          }).join('')
        + '</ul></div>';
    }
    if (cards) h += '<h2 class="sub">Who you will work with</h2><div class="mo-cards">' + cards + '</div>';

    /* ---- the checklist lives here now, with its progress ---- */
    var extra = '';
    var chk = ctx.checklist;
    var pct = chk && chk.total ? Math.round(chk.done / chk.total * 100) : 0;
    extra += '<div class="wk-sec"><div class="wk-lbl">[your checklist]</div>'
      + '<p>Day one, week one and week two, in order: Slack, access, payroll, your 1:1s.'
      + (chk && chk.total ? ' You are at <b>' + chk.done + ' of ' + chk.total + '</b>.' : '') + '</p>'
      + (chk && chk.total ? '<div class="progress-wrap mo-progress"><div class="progress-bar"><span style="width:' + pct + '%"></span></div>'
          + '<div class="progress-pct">' + pct + '%</div></div>' : '')
      + '<div class="wk-links"><a href="#/checklist">' + (chk && chk.done ? 'Pick up your checklist' : 'Open your checklist') + '</a></div></div>';
    if (kit.team && kit.team.how && kit.team.how.length) {
      extra += '<div class="wk-sec"><div class="wk-lbl">[how ' + esc(String(kit.team.label || 'your team').toLowerCase()) + ' works here]</div><ul>'
        + kit.team.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    h += '<div class="mo-extra">' + extra + '</div>';

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
    TEAM_DIRECTORY: TEAM_DIRECTORY,
    esc: esc
  };
});
