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
  /* What the nav should show: 'new' until the section has been opened once,
     'plain' after that. It used to be hidden until the hire had visited every
     section, which made sense while reading the hub WAS the onboarding. The
     checklist is the onboarding now, reading is one item of eighteen, and a
     hire could do seventeen real things and still not see their own plan
     because they had not clicked through four reference pages. The gate is
     gone (see onboarding-hub-gaps.md). */
  function navState(seen) {
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
     directory team yet, so their card shows the label and the team page.
     Applies when the roster did NOT come from POps grouped by practices, or
     when the hire's plan carries no practices: the snapshot and Slack paths,
     the POps department path, and older plans. With POps practices, "your
     team" is everyone who shares a practice with the hire (practicePeers). */
  var TEAM_DIRECTORY = {
    talent: ['Talent Acquisition', 'Talent Management'],
    finance: ['Strategic Finance', 'Managed Services / BizOps']
  };

  /* ---- grouping: practices or department ----
     Pure helpers app.js uses on the team page and in this section, kept here
     so scripts/verify-my-onboarding.js can drive them in Node. */

  /* What the team page groups by. "practices" only when the roster came from
     POps and POps says exactly that; anything else is "department". */
  function groupingOf(data) {
    return data && data.source === 'pops' && data.grouping === 'practices' ? 'practices' : 'department';
  }

  /* The filter's label and its empty option. */
  function groupLabels(grouping) {
    return grouping === 'practices'
      ? { label: 'Practices', all: 'All practices' }
      : { label: 'Department', all: 'All departments' };
  }

  /* The groups as card text. Practices: up to three, then "+N" for the rest.
     Department: joined as today. */
  function groupsText(groups, grouping) {
    var g = Array.isArray(groups) ? groups : [];
    if (grouping !== 'practices' || g.length <= 3) return g.join(', ');
    return g.slice(0, 3).join(', ') + ' +' + (g.length - 3);
  }

  /* A member's clients. POps wins when the roster came from POps and it names
     at least one; otherwise fallback() gives today's sources. */
  function pickClients(fromPops, member, fallback) {
    var c = member && member.clients;
    if (fromPops && Array.isArray(c)) {
      var list = c.filter(function (x) { return typeof x === 'string' && x.trim(); });
      if (list.length) return list.slice();
    }
    return typeof fallback === 'function' ? fallback() : [];
  }

  /* "Your team" under practices: roster members (not the manager, not the hire,
     both by name) who share at least one practice with the hire, sorted by
     name, as { name, avatar }. */
  function practicePeers(hirePractices, members, managerName, hireName) {
    var mine = Array.isArray(hirePractices) ? hirePractices : [];
    if (!mine.length) return [];
    return (Array.isArray(members) ? members : []).filter(function (m) {
      if (!m || !m.name || m.name === managerName || m.name === hireName) return false;
      return (Array.isArray(m.practices) ? m.practices : []).some(function (p) { return mine.indexOf(p) > -1; });
    }).map(function (m) { return { name: m.name, avatar: m.avatar || '', email: m.email || ''  }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  /* My onboarding's "your team" card under POps practices: the hire's first
     practice as the team page filter, and practicePeers as the faces. null when
     it does not apply (no practices on the plan, a roster not from POps, or a
     POps roster grouped by department), and app.js then keeps TEAM_DIRECTORY. */
  function practiceTeam(kit, fromPops, grouping, members, managerName) {
    var plan = kit && kit.plan;
    var practices = plan && Array.isArray(plan.practices) ? plan.practices : [];
    if (!practices.length || !fromPops || grouping !== 'practices') return null;
    return { teamFilter: practices[0], peers: practicePeers(practices, members, managerName, kit.name) };
  }

  /* A plan is either not there at all (null) or there with every field blank
     (POps answers the shape but the manager has not written anything yet).
     Both read as "nothing to show", the SAME "empty" a refetch must never let
     overwrite real content. practices is not the manager's words, so it never
     counts as content. */
  function planIsEmpty(plan) {
    return !plan || !Object.keys(plan).some(function (k) { return k !== 'practices' && plan[k]; });
  }

  /* Who a hire asks when the answer is not their manager's to give. Content,
     not plumbing: edit freely. */

  /* A person's profile on the Carrara Hub, which is the profile the company
     keeps. The team page has sent people there for a while; the faces on this
     page do now too, so the address is written once -- here, in the module the
     verifier can drive, rather than twice in two files. */
  function hubProfileUrl(p) {
    return 'https://hub.carrara.is/people?person='
      + encodeURIComponent((p && (p.email || p.name)) || '');
  }

  /* "Led by Sol S." ended in a full stop this page supplied, so the stop was
     stripped off the name before it was printed. The line is "Anthropic, Sol S."
     now, with no sentence around it, and a blanket strip turns an initial into
     a typo: Sol S. becomes Sol S. So the dot comes off only when it is not the
     last letter of an initial. */
  function dropFullStop(v) {
    var t = String(v == null ? '' : v).trim();
    return /(^|\s)[A-Za-z]\.$/.test(t) ? t : t.replace(/\.+$/, '');
  }

  /* THE HEAD OF A STRETCH. The manager writes a bold first line for each one,
     in the shape "<when>: <what>" -- "By day 60: Increased responsibility". The
     box is headed with the number and the WHAT, because the when is what the
     number already says, and the line is not printed twice.

     Nothing is assumed about how they write: no bold first line and the head is
     the number alone, no colon and the whole line is used. Uppercasing is left
     to CSS, so what a screen reader says is still what the manager typed. */
  function leafHead(day, body) {
    var m = /^\s*\*\*(.+?)\*\*\s*(?:\n|$)/.exec(body || '');
    var title = m ? m[1].trim() : '';
    var colon = title.indexOf(':');
    if (colon > -1 && title.slice(colon + 1).trim()) title = title.slice(colon + 1).trim();
    return { head: title ? day + '/ ' + title : day, rest: m ? body.slice(m[0].length) : body };
  }

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

  /* The checklist card, with progress when app.js passes it. Shown with or
     without an access code: the checklist is everyone's, the plan is the
     manager's. app.js makes the whole card open the checklist popup; the
     #/checklist link is the same door for anything that only has a link. */
  /* checklistBlock is gone. It drew a card pointing at the checklist, and the
     checklist is what opens this page -- true with a kit and without one, so
     keeping it for the empty state was keeping a circle for the reader least
     able to tell it was one. */

  function renderSection(kit, ctx) {
    if (!kit) {
      /* The section is in the nav from the start now, so this is what most
         people see first and it has to stand on its own. It used to send them
         to the welcome kit popup at the bottom right, which is not in the
         markup any more (see onboarding-hub-gaps.md, 35). */
      return '<p class="label">For you</p>'
        + '<h1 class="page-title">Read your 30/60/90 plan.</h1>'
        + '<p class="body-copy">Your hiring manager writes this part: your first client, who to '
        + 'meet, and your first 90 days. It appears here once they have written it.</p>';
    }
    ctx = ctx || {};

    var plan = kit.plan || {};
    var mgrName = kit.manager && kit.manager.name ? kit.manager.name : '';
    /* The hub's page opening, which this section had never used: the eyebrow
       that names the page and the 28 serif title under it. It used to lead with
       <h1 class="display">, and `display` has no rule anywhere in styles.css --
       nor does `h1` -- so that heading was the browser's own default, Manrope
       32 bold, the only heading in the hub not set by the type system. It did
       not look like a decision because it was not one. */
    /* The row that opens this page and the page say the same thing, which is
       what entry 53 asks for. The greeting moved out: the cover letter already
       says the hire's name, and a second hello two pages in is one too many. */
    var h = '<p class="label">For you</p>'
      + '<h1 class="page-title">Read your 30/60/90 plan.</h1>';

    /* The manager's note is not here any more: it is the letter on the cover,
       which is where a note written to the hire belongs and where they read it
       first (register, 71). It rendered here as a quote block, two screens in,
       while the cover carried a fixed paragraph set signed by somebody else.
       `plan.manager_intro` is still plan content for planIsEmpty -- it is the
       manager's writing either way, it is just printed somewhere else. */

    /* ---- the two top cards: your manager, then your team ----
       The manager comes first because they are the one person on this page the
       hire will actually talk to on day one; the team is the room behind them.
       Left to right says that, so it is the order the markup is written in. */
    var top = '';

    if (mgrName) {
      var m = ctx.manager || {};
      var dm = kit.manager.id && typeof window !== 'undefined' && window.LINKS
        ? window.LINKS.slackWorkspace + '/team/' + kit.manager.id : '';
      /* This card used to flip: the face on the front, how to reach them on the
         back. Two ways to reach one person is not a second side's worth of
         content, and a card that hides half of itself asks to be discovered --
         on the one card whose whole job is to be used. Both ways stand on the
         front now, and nothing else does. */
      top += '<div class="mo-card mo-top"><div class="mo-card-title">Your manager</div>'
        + avatar({ name: mgrName, avatar: m.avatar }, 'mo-mgr-av')
        + '<div class="mo-card-name">' + esc(mgrName) + '</div>'
        + (m.role ? '<p class="mo-card-line">' + esc(m.role) + '</p>' : '')
        /* Not wk-links: that is a stack of ember rows with a rule under each,
           which is a LIST of destinations. These two are the same sentence said
           twice -- how to reach one person -- so they take the hub's one inline
           link: the ink they sit in, with a dotted rule under the words. */
        + '<div class="mo-reach">'
        + (dm ? '<a href="' + esc(dm) + '" target="_blank" rel="noopener">Message on Slack ↗</a>' : '')
        + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '')
        + '</div></div>';
    }

    /* The card is already labelled "Your team"; naming it again under the label
       said the same words twice, because team.label falls back to exactly that
       string. It is printed only when POps has a real name for the team that is
       not the label over it. */
    var teamLabel = kit.team && kit.team.label ? kit.team.label : 'Your team';
    var namesTheTeam = teamLabel.trim().toLowerCase() !== 'your team';
    var peers = Array.isArray(ctx.peers) ? ctx.peers : [];
    top += '<div class="mo-card mo-top"><div class="mo-card-title">Your team</div>'
      + (namesTheTeam ? '<div class="mo-card-name">' + esc(teamLabel) + '</div>' : '')
      + (peers.length
          ? '<p class="mo-card-line">' + peers.length + (peers.length === 1 ? ' person does' : ' people do')
            + ' the same kind of work you do.</p>'
            /* Each face is the door to that person's profile on the Carrara Hub,
               which is what the team page's cards already open. The link that
               used to sit under them went to the hub's own team page filtered by
               practice, which is not where their profile lives. */
            /* Everyone, not eight and a tally. "+5" named five people the
               hire is about to work with and showed them a number instead, on
               the one card whose job is to say who they are -- and the five it
               hid were the five at the end of the alphabet, every time. */
            + '<div class="mo-faces">' + peers.map(function (p) {
                return '<a class="mo-face-link" href="' + esc(hubProfileUrl(p)) + '"'
                  + ' target="_blank" rel="noopener" title="' + esc(p.name) + '">'
                  + avatar(p, 'mo-face') + '</a>';
              }).join('')
            + '</div>'
          : '<p class="mo-card-line">The people you will work alongside.</p>')
      + '</div>';

    /* Two cards, not three. The third was [questions] -- "Ask early, ask often"
       and a list of who to ask -- which is advice rather than this hire's team
       or this hire's plan, and this page is those two things now.

       The checklist card went with it: the checklist is what sends people HERE
       now that this section is a row on it, so a card pointing back was a
       circle. The no-kit state keeps one, because there it is the only thing
       on the page worth offering. */
    h += '<div class="mo-cards mo-cards-top">' + top + '</div>';

    /* ---- the plan ---- */
    var steps = STEPS.filter(function (s) { return text(plan[s[1]]); });
    if (steps.length) {
      /* It used to open straight on "Written by your manager", which is a
         caption with nothing above it to caption: the reader met the sentence
         before they met the thing. The head names what follows, the line under
         it says who wrote it, in that order. */
      h += '<h2 class="sub">Your first 90 days</h2>'
        + '<p class="body-copy">Written by your manager. Bring questions to your day-one 1:1.</p>'
        /* Three boxes, one under the next, each headed in caps and then its
           prose. It was a left column of big numbers against a right column of
           text, joined by rules: a timeline with no thread, where the number
           was the only thing holding a stretch together and it held it from
           outside. A box holds its own. */
        + '<div class="mo-plan">'
        + steps.map(function (s) {
            var leaf = leafHead(s[0], plan[s[1]]);
            return '<section class="mo-leaf"><h3 class="mo-leaf__head">' + esc(leaf.head) + '</h3>'
              + '<div class="mo-body">' + md.renderMarkdown(leaf.rest) + '</div></section>';
          }).join('')
        + '</div>';
    }

    /* ---- client and week-one people ---- */
    var cards = '';
    if (kit.client && kit.client.name) {
      /* What the card IS leads it, and what it holds follows in one line.
         It read the other way round: a grey label, then the client's name as
         the heading, then "Led by" on its own line, then the practice as a tag.
         Four weights for two facts. */
      cards += '<div class="mo-card"><div class="mo-card-title">Your first client</div>'
        + '<p class="mo-card-fact">' + esc(kit.client.name)
        + (kit.client.lead ? ', ' + esc(dropFullStop(kit.client.lead)) : '')
        + '</p></div>';
    }
    if (kit.syncWith && kit.syncWith.length) {
      /* The manager's own words about their own people: names and reasons are
         free text, NOT markdown. esc() is the only path they take. */
      cards += '<div class="mo-card"><div class="mo-card-title">Book time with them in week one</div>'
        + '<ul class="mo-syncs">'
        + kit.syncWith.map(function (s) {
            return '<li><b>' + esc(s.name) + '</b>' + (s.why ? ': ' + esc(s.why) : '') + '</li>';
          }).join('')
        + '</ul></div>';
    }
    if (cards) h += '<h2 class="sub">Who you will work with</h2><div class="mo-cards">' + cards + '</div>';

    /* "How your team works here" is gone, and with it the last thing on this
       page that was about Carrara rather than about this hire: three bullets
       saying the manager will explain the team, that we are async first, and to
       read Ways of Working in week two. The first is what the 1:1 is; the other
       two are the hub's own pages, which the checklist already walks them to.
       kit.team.how is still in the wire contract and still arrives; this page
       simply is not where it belongs. */

    return h;
  }

  return {
    SECTION_ID: SECTION_ID,
    VISITED_KEY: VISITED_KEY,
    SEEN_KEY: SEEN_KEY,
    addVisit: addVisit,
    navState: navState,
    parseSyncWith: parseSyncWith,
    renderSection: renderSection,
    hubProfileUrl: hubProfileUrl,
    TEAM_DIRECTORY: TEAM_DIRECTORY,
    groupingOf: groupingOf,
    groupLabels: groupLabels,
    groupsText: groupsText,
    pickClients: pickClients,
    practicePeers: practicePeers,
    practiceTeam: practiceTeam,
    planIsEmpty: planIsEmpty,
    esc: esc
  };
});
