/* Carrara Onboarding Hub */
(function () {
  'use strict';

  /* my-onboarding.js, loaded just above this file. Read once, at parse time:
     if the script order in index.html ever slips, this throws here rather than
     failing quietly somewhere downstream. */
  var MO = window.MyOnboarding;

  /* The hub is no longer one road through everything. The checklist is, and
     these pages are what its items open.

     walk: true marks the five that make up a single item -- "About Carrara" --
     and they are chained front to back in this order, ending in a button that
     ticks that item off. The rest are what a task opens: a hire reaches them
     from their item and goes back to the list, not on to the next page. */
  var SECTIONS = [
    { id: 'start',     label: 'Start here' },
    { id: 'who',       label: 'Who we are',        walk: true },
    { id: 'team',      label: 'The team',          walk: true },
    { id: 'business',  label: 'The business',      walk: true },
    { id: 'clients',   label: 'Our clients',       walk: true },
    { id: 'resources', label: 'Resources',         walk: true },
    { id: 'slack',     label: 'How we communicate' },
    { id: 'tools',     label: 'Our tools' },
    { id: 'timeoff',   label: 'Time off policy' },
    { id: MO.SECTION_ID, label: 'My onboarding' }
  ];
  var WALK = SECTIONS.filter(function (s) { return s.walk; });

  var CHANNELS = [
    { n: '#g-announcements', d: 'team-wide announcements.', ex: ['Company-wide updates from the partners', 'Policy and process changes everyone should see'] },
    { n: '#g-no-dumb-questions', d: 'ask anything.', ex: ['"Anyone know a freelancer for podcast booking?"', '"Has anyone used Noon.ai?"', '"What do people use to track event attendees?"'] },
    { n: '#g-ooo', d: 'post your time off here.', ex: ['"Eric - OOO (01/01 - 01/05) | Visiting family"', 'Coverage notes before longer trips'] },
    { n: '#g-team-updates', d: 'hires, departures, role changes.', ex: ['"Welcome Nathan!" intros with fun facts', 'Farewells and thank-yous', 'Role and DRI changes'] },
    { n: '#g-hired', d: 'celebrate placements.', ex: ['"HIRE MADE: founding SA for EMEA at Modal"', '"Security GRC Specialist closed after 25 candidates vetted"'] },
    { n: '#g-amplify', d: 'new client signings and launches.', ex: ['"Deeptune is being acquired by Mercor!"', '"Runlayer raised a $30M Series A, go like the post"', 'Product Hunt launches to upvote'] },
    { n: '#g-celebrations', d: 'wins worth cheering.', ex: ['Personal and team wins, big and small'] },
    { n: '#g-brainstorm', d: 'ideas in the open.', ex: ['Carrara-centric ideas looking for a second brain'] },
    { n: '#g-share-the-goods', d: 'useful finds.', ex: ['The Carrara Current weekly newsletter drops', 'A shared NYC + SF venue list for client events', 'Playbooks people are hunting for'] },
    { n: '#w-ideas-library', d: 'articles the team shares.', ex: ['"Lessons from Palantir alums" reads', 'Essays on taste, priorities and how we work'] },
    { n: '#f-talent-general', d: 'everything talent services.', ex: ['Weekly Talent Jam prep and open roles reminders', 'Client interview process questions', 'Hiring experiments worth copying'] },
    { n: '#f-gtm-general', d: 'the GTM team.', ex: ['Weekly GTM sync agenda and client priorities', 'Narrative, comms and paid media work'] },
    { n: '#f-coordination-general', d: 'recruiting coordination.', ex: ['Ashby scheduling and reporting questions', 'Coord weekly and shared how-tos'] },
    { n: '#f-company-ops-general', d: 'our own internal ops.', ex: ['Payroll, 1099s and holiday questions', 'Performance cycle announcements'] },
    { n: '#g-ashby-support', d: 'help with Ashby.', ex: ['Config questions, reporting, and anything the ATS will not do'] },
    { n: '#g-tech-rec-sourcing', d: 'technical sourcing.', ex: ['Boolean strings, tools and hard-to-find profiles'] }
  ];

  /* w- is the watercooler prefix. It is not in the day-one list because none of
     it is required reading, but a new joiner should know these exist. */
  var WATERCOOLER = [
    { n: '#w-you-rock', d: 'shout out good work.' },
    { n: '#w-small-wins', d: 'the little stuff worth celebrating.' },
    { n: '#w-random', d: 'anything at all.' },
    { n: '#w-investing', d: 'markets and investing talk.' },
    { n: '#w-ai-tips', d: 'prompts, tools and things that worked.' },
    { n: '#w-ai-projects', d: 'what people are building.' },
    { n: '#w-productivity-toolz', d: 'apps and workflows the team swears by.' },
    { n: '#w-ways-of-working', d: 'how we work, discussed in the open.' },
    { n: '#w-ideas-library', d: 'articles worth reading.' },
    { n: '#w-design-inspo', d: 'design people like.' },
    { n: '#w-sports', d: 'sports.' },
    { n: '#w-fam-and-pets', d: 'families and animals.' }
  ];

  /* item.links: [{t, k}] where k is a LINKS key, a '#/section' hash, a full URL,
     or 'ch:<channel>' for a Slack channel. Unresolvable keys simply do not render,
     so filling a blank in links.js lights the link up everywhere at once. */
  var CHECKLIST = [
    { g: 'start here', cls: 'blue', items: [
      { id: 'welcome', when: 'day one', t: 'About Carrara', d: 'Walk through who we are, how we work and our clients.', tour: true },
      /* The page says all of this, and better: how to get in, what each
         profile field is for, what the prefixes mean. The item is the task and
         the arrow; it used to carry its own shorter copy of the same thing. */
      { id: 'slack', when: 'day one', t: 'Set up your Slack workspace', d: 'Join the workspace, then fill in your profile properly: it is how the rest of the company finds you.',
        links: [{ t: 'How we communicate', k: '#/slack' }] },
      { id: 'tool-access', when: 'day one', t: 'Ensure tool and system access', d: 'Confirm you can open Google, Notion, Slack and the tools for your role. Anything blocked, ping Eric on Slack.', links: [{ t: 'Our tools', k: '#/tools' }] },
      { id: 'payroll', when: 'day one', t: 'Payroll setup (Deel, Bill.com, or Ramp)', d: 'Deel for full-time employees, Bill.com for US contractors, Ramp for international contractors. You\'ll get an invite for the one that applies to you.', links: [{ t: 'Deel', k: 'deel' }, { t: 'Bill.com', k: 'bill' }, { t: 'Ramp', k: 'ramp' }] },
      { id: 'email-signature', when: 'day one', t: 'Set up email signature', d: 'Use the Carrara signature format from the brand templates.',
        html: '<div class="m-eyebrow">Start here · day one</div><h3>Set up email signature</h3>'
          + '<p>You do this in your Carrara Gmail.</p>'
          + '<div class="pg"><ol>'
          + '<li><a class="textlink" href="' + window.LINKS.emailSigTemplate + '" target="_blank" rel="noopener">Open the email signature template ↗</a> (a Google Doc) and copy the signature.</li>'
          + '<li>Go to your Carrara Gmail inbox.</li>'
          + '<li>Click the <b>Settings</b> icon (top right), then <b>See all Settings</b>.</li>'
          + '<li>Scroll down to <b>Signature</b> and click <b>Create New</b>. Name it <b>Carrara</b>.</li>'
          + '<li>Paste the signature you copied from the template.</li>'
          + '<li>Change the text to your own name and role.</li>'
          + '<li>Under <b>Signature Defaults</b>, set <b>For New Emails Use</b> to <b>Carrara</b>, and <b>On Reply/Forward Use</b> to <b>Carrara</b>.</li>'
          + '<li>Scroll to the bottom and click <b>Save Changes</b>.</li>'
          + '</ol></div>',
        links: [{ t: 'Full guide on Notion', k: 'emailSignatureGuide' }] },
      { id: 'time-tracking', when: 'week one', t: 'Set up time tracking', d: 'Your hours help us accurately track client work, allocate expenses, and support client billing and internal reporting, so please make sure they\'re complete and submitted on time.', links: [{ t: 'Strata: Logging Client Hours', k: 'strataLogging' }] },
      { id: 'i9', when: 'day one', t: 'I-9 verification (full-time employees only)', d: 'US full-time employees complete I-9 employment eligibility verification. Eric sends this over; get it back the same week so payroll isn\'t held up.' },
      { id: 'benefits', when: 'week one', t: 'Understand your benefits (full-time employees only)', d: 'What you\'re enrolled in, what you need to elect, and by when. Ask Eric on Slack if anything is unclear or if you\'re a contractor and not sure what applies to you.' }
    ]},
    { g: 'get to know carrara', cls: '', items: [
      /* The tools page is what "Ensure tool and system access" opens now, so
         this item goes where its own task is written: the setup guide. The
         page still names the guide, which is a page pointing at a document
         rather than two items opening the same place. */
      { id: 'quarry', when: 'week one', t: 'Set up the Quarry', d: 'Our AI harness: Claude, an Obsidian vault and Cowork. Do this in week one, because most of how we work assumes it.', links: [{ t: 'Quarry setup guide', k: 'quarry' }] },
      { id: 'carrara-hub', when: 'week one', t: 'Get oriented on the Carrara Hub', d: 'Start at hub.carrara.is and click around.', links: [{ t: 'Open the Carrara Hub', k: 'https://hub.carrara.is' }] },
      { id: 'time-off', when: 'week one', t: 'Review Time-Off Policy', d: 'Read the Time-Off & Holiday Policy page in this hub. Two minutes now saves confusion later.', links: [{ t: 'Time-Off & Holiday Policy', k: '#/timeoff' }] },
      { id: 'ashby', when: 'week two', t: 'Talent team only: get oriented on Ashby', d: 'Our ATS. Ask in #g-ashby-support if you get stuck.', links: [{ t: 'Open Ashby', k: 'ashby' }, { t: '#g-ashby-support', k: 'ch:g-ashby-support' }] }
    ]},
    { g: 'connect with people', cls: '', items: [
      { id: 'manager-1on1', when: 'day one', t: 'Day 1 manager 1:1', d: 'Your first 1:1: align on your 90-day plan, week one priorities, and how you\'ll work together.' },
      { id: 'recurring-1on1', when: 'week one', t: 'Set up a recurring 1:1 with your manager', d: 'Get a weekly slot on the calendar before the week ends.' },
      { id: 'team-calls', when: 'week one', t: "Confirm you're added to all team calls", d: 'Standing team meetings, the monthly Team Roundup, and any client syncs relevant to your role.', links: [{ t: 'Team Roundup', k: 'teamRoundup' }] },
      { id: 'profile', when: 'week one', t: 'Fill out your people profile', d: 'Create your profile in the Carrara Hub so the team can get to know you.', links: [{ t: 'The team directory', k: '#/team' }], survey: 'profile' },
      { id: 'meet-people', when: 'week two', t: 'Meet the people on your list', d: 'Your manager picks who you should meet in your first two weeks: your client lead, the people on your account, and a couple of others.', links: [{ t: 'The team wall', k: '#/team' }] },
      { id: 'top5', t: 'Submit your Top 5', d: 'Name the five best people you have ever worked with, one submission per person. It seeds our network with people we already trust, and it\'s one of the most useful things you can do in your first week.', survey: 'top5' }
    ]}
  ];

  /* resolve a link key from links.js to a real destination */
  function linkFor(k) {
    if (!k) return '';
    if (k.charAt(0) === '#' || /^https?:/.test(k)) return k;
    if (k.indexOf('ch:') === 0) return (window.channelUrl && window.channelUrl(k.slice(3))) || '';
    return (window.LINKS && window.LINKS[k]) || '';
  }

  /* pages.js content opens as an in-hub popup instead of linking out */
  function pageFor(k) { return (window.PAGES && window.PAGES[k]) || null; }

  /* A checklist item's links, as they are written in both places that show them:
     the popup's details and the row standing open on the cover. A key that
     resolves to nothing simply does not render, so filling a blank in links.js
     lights the link up in both at once. With firstAsButton the first one that
     resolves is drawn as the hub's button -- on the cover an open item should
     say what to do now, not offer a row of equal links. */
  function itemLinks(item, firstAsButton) {
    var html = '', n = 0;
    (item.links || []).forEach(function (l) {
      var page = pageFor(l.k);
      var u = page ? '#' : linkFor(l.k);
      if (!page && !u) return;
      n++;
      var btn = firstAsButton && n === 1;
      var internal = page || u.charAt(0) === '#';
      html += '<a class="' + (btn ? 'btn' : 'textlink') + '" href="' + esc(u) + '"'
        + (page ? ' data-page="' + esc(l.k) + '"' : '')
        /* a hash link leaves the popup behind it; a pages.js key opens its own */
        + (page ? ''
           : internal ? ' onclick="document.getElementById(\'modal-back\').classList.remove(\'show\')"'
                      : ' target="_blank" rel="noopener"')
        + '>' + esc(l.t)
        + (btn ? '<span data-icon="arrow-' + (internal ? 'right' : 'up-right') + '" aria-hidden="true"></span>'
               : (internal ? '' : ' ↗'))
        + '</a>';
    });
    return html;
  }

  /* Offering pages declare their clients by name; the logos are drawn at open
     time from live client data, so a client that changes domain or drops off
     the roster updates here without anyone editing pages.js. When the Knowledge
     Hub export (knowledge.json) knows the offering, its list of active clients
     replaces the one written in pages.js, so both hubs show the same clients. */
  function fillClientLogos(root, pageKey) {
    var kp = pageKey ? knowledgePractice(pageKey) : null;
    (root || document).querySelectorAll('.pg-clients[data-clients]').forEach(function (el) {
      var names = (kp && kp.clients && kp.clients.length) ? kp.clients : el.dataset.clients.split('|').filter(Boolean);
      var known = names.filter(function (n) {
        return clientData.some(function (c) { return c.name === n; });
      });
      if (!known.length) { el.remove(); return; }
      el.innerHTML = '<div class="pg-cl-lbl">' + (kp ? 'Current clients' : 'Recent clients') + '</div><div class="cl-grid">'
        + known.map(function (n) { return clientTile(n, 64); }).join('') + '</div>';
    });
  }

  /* What the Knowledge Hub adds under an offering page: the services it runs,
     who leads it, and a link to the full practice page on the hub. */
  function knowledgePracticeHtml(pageKey) {
    var kp = knowledgePractice(pageKey);
    if (!kp) return '';
    var html = '';
    if (kp.services && kp.services.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">How we run it</div><ul>'
        + kp.services.map(function (s) {
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' + (s.summary ? ': ' + esc(s.summary) : '') + '</li>';
        }).join('') + '</ul></div>';
    }
    if (kp.leads && kp.leads.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">Who to ask</div><ul>'
        + kp.leads.map(function (p) { return '<li>' + esc(p.name) + (p.role ? ', ' + esc(p.role) : '') + '</li>'; }).join('') + '</ul></div>';
    }
    html += '<div class="wk-sec wk-out"><a class="btn" href="' + esc(kp.url) + '" target="_blank" rel="noopener">'
      + esc(kp.name) + ' on the Carrara Hub <span data-icon="arrow-up-right" aria-hidden="true"></span></a></div>';
    return html;
  }

  /* A popup whose source page is in Notion gets a button to the full page. The URL
     comes from links.js under the same key; a popup with no Notion URL there has no button. */
  function notionButtonHtml(k) {
    var u = linkFor(k);
    return /^https:\/\/app\.notion\.com\//.test(u)
      ? '<div class="m-actions"><a class="btn-primary" href="' + esc(u) + '" target="_blank" rel="noopener">Read the full page in Notion</a></div>'
      : '';
  }

  function openPage(k) {
    var pg = pageFor(k);
    if (!pg) return;
    openModal((pg.eyebrow === undefined ? '<div class="m-eyebrow">From the Carrara library</div>'
        : (pg.eyebrow ? '<div class="m-eyebrow">' + esc(pg.eyebrow) + '</div>' : ''))
      + '<h3>' + esc(pg.title) + '</h3><div class="pg">' + pg.html + knowledgePracticeHtml(k) + '</div>'
      + notionButtonHtml(k)
      + (pg.note === undefined ? '<p class="pg-note">Snapshot from Notion, Jul 24, 2026.</p>'
        : (pg.note ? '<p class="pg-note">' + esc(pg.note) + '</p>' : '')));
    fillClientLogos($('#modal-back'), k);
  }
  /* an anchor can name a key from links.js rather than carry the URL itself, so the
     destination is kept in one place. A key with no link loses its anchor. */
  [].forEach.call(document.querySelectorAll('a[data-link]'), function (a) {
    var u = linkFor(a.getAttribute('data-link'));
    if (!u) { a.replaceWith(a.textContent); return; }
    a.href = u; a.target = '_blank'; a.rel = 'noopener';
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-page]') : null;
    if (!t) return;
    e.preventDefault();
    openPage(t.dataset.page);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest ? e.target.closest('[data-page][role="button"]') : null;
    if (!t) return;
    e.preventDefault();
    openPage(t.dataset.page);
  });

  var TOOLS = [
    { n: 'Claude', dmn: 'claude.ai', url: 'https://claude.ai', d: 'Our go-to AI, and the base of the Quarry. Log in with your Carrara Google account on the Team plan, then run the Quarry setup so you get the shared skills. Cowork for most work, Claude Code in the terminal.', tag: 'Carrara provided' },
    { n: 'Obsidian', dmn: 'obsidian.md', url: 'https://obsidian.md', d: 'Where your Quarry vault lives: notes, memories and skills that Claude reads and writes. Sync needs a paid subscription, which fits inside your monthly SaaS stipend on Ramp.', tag: '' },
    { n: 'Ashby', dmn: 'ashbyhq.com', url: 'https://app.ashbyhq.com', d: 'Our ATS, and the system of record for every search. Talent team gets oriented in week one; ask anything in #g-ashby-support.', tag: 'talent team' },
    { n: 'Granola', dmn: 'granola.ai', url: 'https://granola.ai', d: 'AI meeting notes so you stay present. We run it on every client call.', tag: 'Carrara provided' },
    { n: 'Loom', dmn: 'loom.com', url: 'https://loom.com', d: 'Async walkthroughs and client handoffs instead of another meeting.', tag: 'Carrara provided' },
    { n: 'Reclaim', dmn: 'reclaim.ai', url: 'https://reclaim.ai', d: 'Merges calendars across the multiple client accounts you\'ll juggle.', tag: 'Carrara provided' },
    { n: 'ChatGPT', dmn: 'chatgpt.com', url: 'https://chat.openai.com', d: 'Everyday copilot for quick brainstorms and rewrites.', tag: '' },
    { n: 'Whisper Flow', dmn: 'whisperflow.com', url: 'https://whisperflow.com', d: 'Voice keyboard. Dictate Slack messages and notes while juggling threads.', tag: '' },
    { n: 'CleanShot', dmn: 'cleanshot.com', url: 'https://cleanshot.com', d: 'Screenshots, GIFs, scrolling capture. Our default for async documentation.', tag: '' },
    { n: 'Paste', dmn: 'pasteapp.io', url: 'https://pasteapp.io', d: 'Infinite clipboard history. You\'ll copy a lot between clients.', tag: '' },
    { n: 'Zapier', dmn: 'zapier.com', url: 'https://zapier.com', d: 'Automations between tools. Kill the repetitive stuff.', tag: '' }
  ];

  /* the [MASTER] templates on the current brand; kind 'pptx' = an Office file on Drive */
  var CORE_TEMPLATES = [
    { name: 'Template doc', type: 'doc', id: '1unt6z2OuRNQp6n0yWZYuaANZV41YDnwhN0WUI_vjJs8', kind: 'document' },
    { name: 'Template sheet', type: 'sheet', id: '1klabm2NzLaoleA0gRMHNWUdPiiERtCim-INpTGJXyLE', kind: 'spreadsheets' },
    { name: 'What is Carrara', type: 'deck', id: '1wMkxaNbMhm1AUhRVs26rVFaU2kafOiYVSYT25O9aKWY', kind: 'presentation' },
    { name: 'Generic deck', type: 'deck', id: '1efBsbpLq8aTsao2sulAUddJ_Uzty2PEu', kind: 'pptx' },
    { name: 'All Hands deck', type: 'deck', id: '1Y--CeCXloO0Pk91UjtKnprimiwBIWQP0', kind: 'pptx' }
  ];
  var BRAND_FOLDER = '1z2fPx_iK4xBdTGiTrwo6JNQ1OQxDkzoM';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function favicon(domain, size) { return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=' + (size || 64); }
  function store(k, v) { try { if (v === undefined) { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ---------- modal ---------- */
  var mBack = $('#modal-back');
  function openModal(html) {
    var box = $('#modal-content');
    box.innerHTML = html;
    Icons.draw(box);
    mBack.classList.add('show');
    /* the page behind holds still while a sheet is over it, the way it already
       does behind the checklist */
    document.body.classList.add('modal-open');
    /* the sheet is the scroller and it is the same element every time, so a new
       one has to be put back to its top rather than opening where the last was
       left */
    var sheet = mBack.querySelector('.modal');
    if (sheet) { void sheet.offsetHeight; sheet.scrollTop = 0; }
  }
  function closeModal() {
    mBack.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
  $('#modal-close').addEventListener('click', closeModal);
  mBack.addEventListener('click', function (e) { if (e.target === mBack) closeModal(); });
  /* Escape closes the top layer only: an item's details sit above the checklist */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mBack.classList.contains('show')) closeModal();
    else closeChecklist();
  });

  /* ---------- checklist popup ----------
     The checklist is no longer a section: it lives in a popup the hire opens
     from their own section. Item details still open in the generic modal,
     which stacks above it. */
  var chkPop = $('#chk-pop');
  function openChecklist() {
    chkPop.hidden = false;
    document.body.classList.add('chk-open');
    var close = $('#chk-pop-close');
    if (close) close.focus();
  }
  function closeChecklist() {
    if (chkPop.hidden) return;
    chkPop.hidden = true;
    document.body.classList.remove('chk-open');
  }
  $('#chk-pop-close').addEventListener('click', closeChecklist);
  chkPop.addEventListener('click', function (e) { if (e.target === chkPop) closeChecklist(); });

  /* ---------- nav ---------- */
  var nav = $('#nav'), mnav = $('#mobile-nav');
  /* The index holds the walk and nothing else. It is About Carrara's table of
     contents -- that item is the only one with pages inside it -- so it is
     numbered like the letter's rail and it appears only on those pages. */
  WALK.forEach(function (s, i) {
    var a = document.createElement('a');
    a.href = '#/' + s.id;
    a.dataset.id = s.id;
    a.innerHTML = '<span class="rail__num">' + ('0' + (i + 1)).slice(-2) + '</span>'
      + '<span class="rail__info"><span class="rail__name">' + esc(s.label) + '</span></span>';
    nav.appendChild(a);
  });
  SECTIONS.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s.id; o.textContent = s.label;
    mnav.appendChild(o);
  });
  mnav.addEventListener('change', function () { location.hash = '#/' + mnav.value; });

  /* ---------- my onboarding: visits, reveal, badge ---------- */
  var visited = store(MO.VISITED_KEY) || [];

  function recordVisit(id) {
    // Re-read the store rather than trusting this tab's in-memory `visited`:
    // two tabs open at once each hold their own snapshot from load time, and
    // writing that stale snapshot wholesale would erase whatever the OTHER
    // tab persisted since (a completed walkthrough, section and all). Union
    // the freshest known state with this visit before writing, so no other
    // tab's progress is ever clobbered.
    var latest = store(MO.VISITED_KEY) || [];
    var next = MO.addVisit(latest, id);
    visited = next;
    if (next.length === latest.length) return;
    store(MO.VISITED_KEY, visited);
  }

  /* The nav link and the mobile option exist from load and are hidden, rather
     than being created on reveal: one place builds them, and the reveal is a
     single attribute flip that also survives a hashchange. */
  function syncMyOnboardingNav() {
    var state = MO.navState(!!store(MO.SEEN_KEY));
    var link = document.querySelector('#nav a[data-id="' + MO.SECTION_ID + '"]');
    var opt = mnav.querySelector('option[value="' + MO.SECTION_ID + '"]');
    if (link) {
      link.hidden = state === 'hidden';
      var badge = link.querySelector('.nav-new');
      if (state === 'new' && !badge) link.insertAdjacentHTML('beforeend', '<span class="nav-new">new</span>');
      if (state !== 'new' && badge) badge.parentNode.removeChild(badge);
    }
    if (opt) opt.hidden = state === 'hidden';
  }

  /* ---------- router ---------- */
  var current = null;
  function show(id) {
    var sec = SECTIONS.some(function (s) { return s.id === id; }) || id === 'complete' ? id : 'start';
    current = sec;
    recordVisit(sec);
    if (sec === MO.SECTION_ID) {
      // The badge is spent the moment the section is opened, and the visit is
      // what triggers the refetch: the section re-verifies with the saved code
      // on EVERY visit (spec decision 6), never renders a cached copy as if it
      // were current. The badge is spent by opening the section, which is the
      // only thing it ever meant: there is no walk to finish first any more.
      store(MO.SEEN_KEY, true);
      mountMyOnboarding();
      refreshKit();
    }
    syncMyOnboardingNav();
    $$('.view').forEach(function (v) { v.classList.remove('visible'); });
    var el = $('#view-' + sec);
    if (el) el.classList.add('visible');
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.id === sec); });
    /* the index belongs to About Carrara: on any other page there is nothing
       to index, and the body says so for the narrow layout to read */
    var onWalk = WALK.some(function (w) { return w.id === sec; });
    var aside = $('#walk-index');
    if (aside) aside.hidden = !onWalk;
    document.body.classList.toggle('has-index', onWalk);
    if (SECTIONS.some(function (s) { return s.id === sec; })) mnav.value = sec;
    window.scrollTo(0, 0);
    if (sec === 'start') countUp();
    if (sec === 'templates') mountTemplates();
    nextNav(el, sec);
  }
  /* #/client/<slug> was a page of its own. The client is a sheet now, so the old
     address opens the list with that sheet over it; links already sent still land.
     The slug is kept when the client data has not arrived yet (the hash is read
     before the fetch returns), and the list tries it again once it has. */
  var pendingClient = '';
  function showClientPage(slug) {
    /* the address becomes the list's, the way the old #/checklist link does:
       closing the sheet should not leave a client's address standing */
    history.replaceState(null, '', location.pathname + location.search + '#/clients');
    show('clients');
    pendingClient = (window.openClientSheet && window.openClientSheet(slug)) ? '' : slug;
  }
  window.retryPendingClient = function () {
    if (pendingClient && window.openClientSheet && window.openClientSheet(pendingClient)) pendingClient = '';
  };
  function route() {
    var h = (location.hash || '#/start').replace('#/', '');
    /* Old #/checklist links (emails, welcome.json, bookmarks) still land: they
       open the hire's section with the checklist popped over it. replaceState
       swaps the address without firing another hashchange. */
    if (h === 'checklist') {
      history.replaceState(null, '', location.pathname + location.search + '#/' + MO.SECTION_ID);
      show(MO.SECTION_ID);
      openChecklist();
      return;
    }
    closeChecklist();
    if (h.indexOf('client/') === 0) { showClientPage(h.slice(7)); return; }
    show(h);
  }
  window.addEventListener('hashchange', route);

  /* The foot of a page, which is where a page says what it is part of.

     On the walk it is the next page, and on the last one it is the end of an
     item: a button that ticks "About Carrara" off and puts the hire back on
     their list. Every other page is something a task opened, so its way out is
     back to the list rather than on to a page nobody asked for -- reading the
     Slack guide used to push you into Our clients. */
  function nextNav(root, sec) {
    if (!root) return;
    var old = root.querySelector('.next-nav');
    if (old) old.parentNode.removeChild(old);
    /* the cover is the list; it does not need a way back to itself */
    if (sec === 'start') return;
    var i = WALK.findIndex(function (s) { return s.id === sec; });
    var d = document.createElement('div');
    d.className = 'next-nav';
    if (i > -1 && i < WALK.length - 1) {
      d.innerHTML = '<a href="#/' + WALK[i + 1].id + '">Next: ' + esc(WALK[i + 1].label)
        + ' <span class="btn-cover__arrow" data-icon="arrow-right" aria-hidden="true"></span></a>';
    } else if (i === WALK.length - 1) {
      d.innerHTML = '<button type="button" class="btn" id="walk-done">Done! Mark as completed'
        + ' <span data-icon="check" aria-hidden="true"></span></button>';
    } else {
      d.innerHTML = '<a href="#/start">Back to your checklist</a>';
    }
    root.appendChild(d);
    var mark = d.querySelector('#walk-done');
    if (mark) mark.addEventListener('click', function () {
      /* The walk ends on the list, at the item it belongs to, and the item is
         crossed off while the hire is watching: finishing something is worth
         seeing come off the list, and arriving back at a page is not that.
         The two waits are the route and the scroll, in that order. */
      location.hash = '#/start';
      setTimeout(function () {
        var row = $('#cover-checklist .ck-row[data-id="welcome"]');
        if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(function () {
          var api = itemApi.welcome;
          if (!api || chkState['k:welcome']) return;
          justTicked = 'welcome';
          api.toggle();
          justTicked = null;
        }, 600);
      }, 160);
    });
    if (window.Icons) Icons.draw(d);
  }

  /* ---------- motion ---------- */
  var counted = false;
  function countUp() {
    if (counted && !reduced) return;
    $$('[data-count]').forEach(function (el) {
      /* read live on every frame: setStat may replace the static target with
         the roster count while the count-up is running */
      function read() { return { target: parseInt(el.dataset.count, 10), plus: el.dataset.plus === '1' }; }
      if (reduced) { var r0 = read(); el.textContent = r0.target + (r0.plus ? '+' : ''); return; }
      el.dataset.animating = '1';
      var t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 800, 1);
        var r = read();
        el.textContent = Math.round(r.target * (1 - Math.pow(1 - p, 3))) + (r.plus && p === 1 ? '+' : '');
        if (p < 1) requestAnimationFrame(tick); else el.removeAttribute('data-animating');
      }
      requestAnimationFrame(tick);
    });
    counted = true;
  }

  /* ---------- top 5 survey: one submission per person, rows land in a Google Sheet via /api/top5 ---------- */
  function renderTop5(yourName) {
    var box = $('#t5-box');
    if (!box) return;
    box.innerHTML = '<div class="pf-group">5 best people you\'ve worked with</div>'
      + '<p class="m-note" style="margin:0">Please be sure to submit each person individually, five in total.</p>'
      + '<label>Your name</label><input id="t5-you" value="' + esc(yourName) + '">'
      + '<label>Name</label><input id="t5-name">'
      + '<label>LinkedIn</label><input id="t5-li">'
      + '<div class="pf-group">where you worked together</div>'
      + '<label>What company?</label><input id="t5-company">'
      + '<label>Relationship type</label><input id="t5-rel" placeholder="Manager, Direct Report, Peer, etc.">'
      + '<label>When did you work together?</label><input id="t5-year" inputmode="numeric" maxlength="4" placeholder="What year. Ex: 2021">'
      + '<div class="pf-group">about them</div>'
      + '<label>Relationship strength: what were they amazing at?</label><textarea id="t5-strength" rows="3"></textarea>'
      + '<label>Notes</label><textarea id="t5-notes" rows="3"></textarea>'
      + '<input id="t5-website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">'
      + '<div class="m-actions"><button class="btn-primary" id="t5-send">Submit this person</button></div>'
      + '<p class="m-note" id="t5-msg" role="status"></p>';

    $('#t5-send').addEventListener('click', function () {
      var v = function (id) { return $('#t5-' + id).value.trim(); };
      var data = { yourName: v('you'), name: v('name'), linkedin: v('li'), company: v('company'),
        relationship: v('rel'), year: v('year'), strength: v('strength'), notes: v('notes'), website: $('#t5-website').value };
      var msg = $('#t5-msg'), btn = $('#t5-send');
      if (!data.yourName) { msg.textContent = 'Add your name.'; $('#t5-you').focus(); return; }
      if (!data.name) { msg.textContent = 'Add the name of the person you are submitting.'; $('#t5-name').focus(); return; }
      if (data.year && !/^(19|20)\d{2}$/.test(data.year)) { msg.textContent = 'Use a four-digit year, like 2021.'; $('#t5-year').focus(); return; }
      btn.disabled = true;
      msg.textContent = 'Sending...';
      fetch('/api/top5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw 0; })
        .then(function () {
          var n = (store('carrara_top5_count') || 0) + 1;
          store('carrara_top5_count', n);
          box.innerHTML = '<div class="pf-group">submitted</div>'
            + '<p>Thanks. ' + esc(data.name) + ' is in. ' + (n >= 5 ? 'That is your five.' : n + ' of 5 so far.') + '</p>'
            + '<div class="m-actions"><button class="btn-primary" id="t5-another">Submit another person</button></div>';
          $('#t5-another').addEventListener('click', function () { renderTop5(data.yourName); });
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'That did not send. Try again in a moment.'; });
    });
  }

  /* One profile editor and one database, in the signed-in Knowledge Hub. */
  function mountProfileSurvey() {
    var box = $('#pv-box');
    if (!box) return;
    var links = $('#chk-links');
    if (links) links.remove();
    box.innerHTML = '<p>Your profile lives in the Carrara Hub.</p>'
      + '<div class="m-actions"><a class="btn-primary" href="https://hub.carrara.is/people?profile=edit" target="_blank" rel="noopener">Create or edit my profile ↗</a></div>'
      + '<p class="m-note">Sign in with your Carrara account. Return here and mark this step complete after saving.</p>';
  }

  /* ---------- checklist ---------- */
  var chkState = store('carrara_checklist') || {};
  /* Ticks used to be saved by position (g0i3). Positions moved when the groups did, so
     carry any old tick over to the item it belonged to, once. */
  (function () {
    var legacy = { g0i0: 'slack', g0i1: 'tool-access', g0i2: 'payroll', g0i3: 'email-signature', g0i4: 'manager-1on1',
      g0i5: 'buddy', g0i6: 'top5', g0i7: 'i9', g1i0: 'quarry', g1i1: 'recurring-1on1', g1i2: 'team-calls',
      g1i3: 'offsite-talks', g1i4: 'notion', g1i5: 'time-off', g1i6: 'time-tracking', g1i7: 'profile',
      g1i8: 'benefits', g2i0: 'meet-people', g2i1: 'principles', g2i2: 'ashby' };
    var moved = false;
    Object.keys(legacy).forEach(function (k) {
      if (!(k in chkState)) return;
      if (chkState[k]) chkState['k:' + legacy[k]] = true;
      delete chkState[k];
      moved = true;
    });
    if (moved) store('carrara_checklist', chkState);
  })();
  var groupsEl = $('#chk-groups');
  var flat = [];
  /* An item's two actions -- tick it, open what it asks of you -- are written
     once, in the popup's loop below, and kept here by id so the cover's own
     list can call them. Both lists read and write the same chkState, and
     renderProgress redraws the cover whenever either of them changes it. */
  var itemApi = {};
  CHECKLIST.forEach(function (grp, gi) {
    var g = document.createElement('div');
    g.className = 'chk-group';
    g.innerHTML = '<div class="glabel ' + grp.cls + '">[' + grp.g + ']</div>';
    grp.items.forEach(function (item, ii) {
      var key = 'k:' + item.id;
      flat.push(key);
      var row = document.createElement('div');
      row.className = 'chk-item' + (chkState[key] ? ' done' : '');
      row.innerHTML = '<div class="box" role="checkbox" tabindex="0"></div><div class="txt">' + esc(item.t) + '</div><div class="info" title="Details">i</div>';
      function toggle() {
        chkState[key] = !chkState[key];
        row.classList.toggle('done', !!chkState[key]);
        store('carrara_checklist', chkState);
        renderProgress();
      }
      function details() {
        var linksHtml = itemLinks(item);
        var body = item.html || ('<div class="m-eyebrow">' + grp.g + (item.when ? ' · ' + item.when : '') + '</div><h3>' + esc(item.t) + '</h3><p>' + esc(item.d) + '</p>');
        openModal(body + (item.survey === 'top5' ? '<div id="t5-box"></div>' : '')
          + (item.survey === 'profile' ? '<div id="pv-box"></div>' : '')
          + (linksHtml ? '<p id="chk-links" class="ck-acts">' + linksHtml + '</p>' : ''));
        if (item.survey === 'top5') renderTop5((myProfile && myProfile.name) || '');
        if (item.survey === 'profile') mountProfileSurvey(function () { if (!chkState[key]) toggle(); });
      }
      itemApi[item.id] = { toggle: toggle, details: details };
      row.querySelector('.box').addEventListener('click', toggle);
      row.querySelector('.box').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      row.querySelector('.txt').addEventListener('click', details);
      row.querySelector('.info').addEventListener('click', details);
      g.appendChild(row);
    });
    groupsEl.appendChild(g);
  });
  function chkCount() { return flat.filter(function (k) { return chkState[k]; }).length; }
  /* The checklist IS the start page. It used to sit at the end of the walk,
     reachable only once you had read everything in front of it. The letter still
     opens the page -- it is the welcome, and it is read, not done -- but the
     plan begins right under it, and reading it is the list's first item rather
     than a gate standing before the list.

     Nothing folds. An item is a name, what it asks of you under it, and an
     arrow to where it is done: three things, all of them on the page, so the
     whole plan can be read without opening anything. The tick on the left is
     the only other thing a row holds. */
  (function () {
    /* the way into the walk is the first item's own arrow now, so the cover's
       button goes; it stays in the markup for a page that never ran this */
    var btn = $('#btn-tour');
    if (btn) btn.parentNode.removeChild(btn);
  })();

  /* Where an item's arrow goes. One link and nothing else to say: straight
     there. Steps, a survey, or more than one link: the popup, which is the one
     place that can hold all of them. Nothing to open at all -- a 1:1, an I-9
     someone sends you -- and there is no arrow, because there is nowhere to go. */
  function coverGoes(item) {
    /* The arrow starts the walk; it does not finish it. It used to tick the item
       on the way out, which crossed off a thing the hire had not done yet. */
    if (item.tour) return { how: 'hash', url: '#/who' };
    if (item.survey || item.html) return { how: 'modal' };
    var links = (item.links || []).filter(function (l) { return pageFor(l.k) || linkFor(l.k); });
    if (!links.length) return null;
    if (links.length > 1) return { how: 'modal' };
    if (pageFor(links[0].k)) return { how: 'page', key: links[0].k };
    var u = linkFor(links[0].k);
    return { how: u.charAt(0) === '#' ? 'hash' : 'ext', url: u };
  }

  /* the id the walk just crossed off, held for the one render that draws it */
  var justTicked = null;

  function coverRow(item) {
    var on = !!chkState['k:' + item.id];
    var go = coverGoes(item);
    var open = '<div class="ck-go ck-go--flat">';
    if (go && go.how === 'modal') open = '<button type="button" class="ck-go" data-open="' + esc(item.id) + '">';
    else if (go && go.how === 'page') open = '<a class="ck-go" href="#" data-page="' + esc(go.key) + '">';
    else if (go && go.how === 'ext') open = '<a class="ck-go" href="' + esc(go.url) + '" target="_blank" rel="noopener">';
    else if (go) open = '<a class="ck-go" href="' + esc(go.url) + '">';
    return '<div class="ck-row' + (on ? ' done' : '')
      + (item.id === justTicked ? ' ck-row--ticked' : '') + '" data-id="' + esc(item.id) + '">'
      + '<span class="ck-box" role="checkbox" tabindex="0" aria-checked="' + (on ? 'true' : 'false') + '"'
      + ' aria-label="Mark ' + esc(item.t) + ' done">'
      + '<span data-icon="check" aria-hidden="true"></span></span>'
      + open
      + '<span class="ck-text"><span class="ck-t">' + esc(item.t) + '</span>'
      + (item.d ? '<span class="ck-d">' + esc(item.d) + '</span>' : '') + '</span>'
      + (go ? '<span class="ck-arrow" data-icon="arrow-' + (go.how === 'ext' ? 'up-right' : 'right')
            + '" aria-hidden="true"></span>' : '')
      + (go && go.how === 'modal' ? '</button>' : go ? '</a>' : '</div>')
      + '</div>';
  }

  function renderCoverChecklist() {
    var box = $('#cover-checklist');
    if (!box) return;
    var done = chkCount(), total = flat.length;
    var pct = total ? Math.round(done / total * 100) : 0;
    var h = '<h2 class="ck-title">Your checklist</h2>'
      + '<p class="ck-intro">We put this list together so you can set yourself up for success.'
      + ' Tick each one off as you go.</p>'
      + '<div class="ck-meter"><div class="progress-bar"><span style="width:' + pct + '%"></span></div>'
      + '<p class="ck-count"><b>' + done + ' of ' + total + '</b> done</p></div>';
    CHECKLIST.forEach(function (grp) {
      h += '<div class="ck-group"><div class="ck-label">' + esc(grp.g) + '</div>';
      grp.items.forEach(function (item) { h += coverRow(item); });
      h += '</div>';
    });
    box.innerHTML = h;
    if (window.Icons) Icons.draw(box);
  }
  function renderProgress() {
    var done = chkCount(), total = flat.length;
    var pct = Math.round(done / total * 100);
    $('#chk-fill').style.width = pct + '%';
    $('#chk-pct').textContent = pct + '%';
    renderCoverChecklist();
    var meta = $('#meta-checklist');
    if (meta) meta.textContent = 'checklist: ' + done + '/' + total;
    $('#done-moment').classList.toggle('show', pct === 100);
    if (current === MO.SECTION_ID) mountMyOnboarding();
  }
  $('#chk-reset').addEventListener('click', function () {
    chkState = {}; store('carrara_checklist', chkState);
    $$('.chk-item').forEach(function (r) { r.classList.remove('done'); });
    renderProgress();
  });
  renderProgress();
  /* The box is refilled, never replaced, so one pair of listeners on it serves
     every row. A row that goes somewhere is a real link and needs nothing from
     here; only the tick and the rows that open the popup are handled. Nothing
     ticks itself: every item on this list is crossed off by the hire. */
  (function () {
    var box = $('#cover-checklist');
    if (!box) return;
    function act(e) {
      if (!e.target.closest) return;
      var row = e.target.closest('.ck-row');
      if (!row) return;
      var id = row.getAttribute('data-id');
      var api = itemApi[id];
      if (!api) return;
      var tick = e.target.closest('.ck-box');
      var opens = e.target.closest('[data-open]');
      if (!tick && !opens) return;
      /* only the tick answers the keyboard here: a button and a link answer it
         themselves, and a click is what reaches this either way */
      if (e.type === 'keydown') {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (!tick) return;
      }
      e.preventDefault();
      if (opens) api.details(); else api.toggle();
    }
    box.addEventListener('click', act);
    box.addEventListener('keydown', act);
  })();

  /* ---------- team ---------- */
  var teamData = [];
  /* true when /api/team answered from POps: then every field POps has wins, and
     Notion, the Knowledge Hub and the Slack snapshot only fill the gaps */
  var fromPops = false;
  /* what the filter, cards and modal group people by: "practices" (POps, several
     per person) or "department". Set from data.grouping; absent reads department. */
  var grouping = 'department';
  var myProfile = null; // Shared profiles are edited in the Knowledge Hub.
  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function cleanTitle(t) {
    if (!t) return '';
    return t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').trim();
  }
  /* On the POps path the groups come from POps only, no Notion fallback: the
     member's practices when POps groups by practices, else their department.
     Anything that shows them (filter, card, modal) stays hidden until someone
     has one. On the Slack and snapshot paths, the Notion business areas, as today. */
  function deptsOf(m) {
    if (fromPops && grouping === 'practices') return Array.isArray(m.practices) ? m.practices : [];
    if (fromPops) return m.department ? [m.department] : [];
    return ((pavilion[m.name] || {}).teams) || [];
  }
  /* A member's clients: POps' list wins when it names any, else today's
     Codex and Knowledge Hub answer. Names resolve against clientData for the
     domain and logo either way. */
  function clientsFor(m) {
    return MO.pickClients(fromPops, m, function () { return clientsOf(m.name); });
  }
  /* POps title and location win when the roster came from POps; otherwise
     today's precedence, Notion first. */
  function roleOf(m) {
    var pv = pavilion[m.name] || {};
    return fromPops ? (cleanTitle(m.title) || pv.role || '') : (pv.role || cleanTitle(m.title));
  }
  function locOf(m) {
    var pv = pavilion[m.name] || {};
    return fromPops ? (m.location || pv.location || '') : (pv.location || '');
  }
  /* A person used to open a sheet of their own, assembled here out of a public
     web-search summary, their Pavilion answers and prior roles. Their profile on
     the Carrara Hub is the one that is kept, so the card goes straight there and
     the sheet is gone. */
  function hubProfileUrl(m) {
    return 'https://hub.carrara.is/people?person=' + encodeURIComponent(m.email || m.name);
  }
  var teamFilter = { team: '', client: '', loc: '' };
  /* options come from the data, not a hardcoded list, so a new team or location
     in Notion shows up in the dropdown on the next refresh without a code change */
  function populateFilters() {
    var teams = {}, clients = {}, locs = {};
    teamData.forEach(function (m) {
      deptsOf(m).forEach(function (t) { teams[t] = 1; });
      if (fromPops && locOf(m)) locs[locOf(m)] = 1;
      /* POps' client lists are options too, so filtering by one finds the
         people whose card shows it */
      if (fromPops) clientsFor(m).forEach(function (c) { clients[c] = 1; });
    });
    Object.keys(pavilion).forEach(function (n) {
      var x = pavilion[n];
      clientsOf(n).forEach(function (c) { clients[c] = 1; });
      if (!fromPops && x.location) locs[x.location] = 1;
    });
    function fill(sel, values, keep) {
      var el = $(sel);
      if (!el) return;
      var cur = el.value;
      el.innerHTML = '<option value="">' + keep + '</option>'
        + Object.keys(values).sort().map(function (v) {
            return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
          }).join('');
      el.value = cur;
    }
    var labels = MO.groupLabels(fromPops ? grouping : 'department');
    fill('#f-team', teams, labels.all);
    var teamLabel = $('#f-team') && $('#f-team').closest('label');
    if (teamLabel) {
      var lt = teamLabel.querySelector('span');
      if (lt) lt.textContent = labels.label;
      /* .tf sets display: flex, which beats the hidden attribute, so set both */
      teamLabel.hidden = !Object.keys(teams).length;
      teamLabel.style.display = teamLabel.hidden ? 'none' : '';
    }
    fill('#f-client', clients, 'All clients');
    fill('#f-loc', locs, 'Anywhere');
  }
  /* A filter that is on says so in its own control: the chosen value is already
     the select's own text, so what is missing is the way back out. The chevron
     gives way to a cross that takes that one filter off, and the search carries
     the same cross once there is something typed in it. */
  function markFilters() {
    $$('.team-tools .tf').forEach(function (shell) {
      var ctrl = shell.querySelector('select, input');
      var x = shell.querySelector('.tf-x');
      if (!ctrl || !x) return;
      var on = !!ctrl.value;
      shell.classList.toggle('is-set', on);
      x.hidden = !on;
    });
  }
  function wireFilters() {
    [['#f-team', 'team'], ['#f-client', 'client'], ['#f-loc', 'loc']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.addEventListener('change', function () {
        teamFilter[pair[1]] = el.value;
        renderTeam($('#team-search').value);
      });
    });
    $$('.team-tools .tf-x').forEach(function (x) {
      x.addEventListener('click', function () {
        var ctrl = document.getElementById(x.getAttribute('data-clears'));
        if (!ctrl) return;
        ctrl.value = '';
        if (ctrl.id === 'f-team') teamFilter.team = '';
        if (ctrl.id === 'f-client') teamFilter.client = '';
        if (ctrl.id === 'f-loc') teamFilter.loc = '';
        renderTeam($('#team-search').value);
      });
    });
  }

  /* Every hero number is derived, never typed, except partners: the partner
     flag in people.json is under-counted right now (7 flagged, 8 is the real
     number) and nobody's assigned the 8th yet, so that one stat stays the
     static "8" baked into index.html instead of being overwritten here. Team
     members come from the rendered roster, and companies served counts
     current plus archived so the number only ever goes up. */
  /* The live value wins whenever it arrives (2026-11-05, the welcome page
     showed 75+, 84+ or 84 depending on how the roster's fetch raced the
     count-up): the dataset is the one source the animation reads on every
     frame, and the text is only written directly when no animation is
     running, so a count-up in flight lands on the live number instead of
     overwriting it with the static one it started from. */
  function setStat(sel, n, plus) {
    var el = $(sel);
    if (!el) return;
    el.dataset.count = n;
    el.dataset.plus = plus ? '1' : '0';
    if (el.textContent !== '0' && el.dataset.animating !== '1') el.textContent = n + (plus ? '+' : '');
  }
  function refreshStats() {
    if (teamData.length) {
      setStat('#stat-team', teamData.length, false);
      var factEl = $('#fact-team');
      if (factEl) factEl.textContent = teamData.length + '';
    }
    if (clientData.length) setStat('#stat-clients', clientData.length, false);
  }

  function renderTeam(filter) {
    var grid = $('#team-grid');
    grid.innerHTML = '';
    var q = (filter || '').toLowerCase();
    var list = teamData.slice();
    if (myProfile && !list.some(function (m) { return m.email === myProfile.email; })) {
      /* their own entry renders through the same path as everyone else's, so the
         photo, clients and answers they just typed show immediately */
      list.unshift({ name: myProfile.name, title: myProfile.team || '', email: myProfile.email || '',
        avatar: myProfile.photo || '', isNew: true, extra: myProfile.location });
      pavilion[myProfile.name] = {
        role: myProfile.team || '', location: myProfile.location || '',
        teams: myProfile.team ? [myProfile.team] : [],
        /* a hire who just joined is not in the Codex yet: their own pick shows */
        isMine: true,
        clients: myProfile.client ? [myProfile.client] : [],
        about: myProfile.background || '',
        linkedin: myProfile.linkedin || '',
        answers: Object.keys(myProfile.answers || {}).map(function (k) {
          var q = null;
          PAVILION_Q.forEach(function (g) { g.qs.forEach(function (x) { if (x[0] === k) q = x[1]; }); });
          return q ? { q: q, a: [myProfile.answers[k]] } : null;
        }).filter(Boolean)
      };
    }
    var shown = list.filter(function (m) {
      var pv = pavilion[m.name] || {};
      if (teamFilter.team && deptsOf(m).indexOf(teamFilter.team) === -1) return false;
      var mine = clientsFor(m);
      if (teamFilter.client && mine.indexOf(teamFilter.client) === -1) return false;
      if (teamFilter.loc && locOf(m) !== teamFilter.loc) return false;
      var hay = [m.name, m.nickname || '', m.title || '', m.email || '', pv.role || '', locOf(m),
        deptsOf(m).join(' '), mine.join(' ')].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    });
    shown.forEach(function (m) {
      var d = document.createElement('a');
      d.className = 'member';
      d.href = hubProfileUrl(m);
      d.target = '_blank';
      d.rel = 'noopener';
      var av = m.avatar ? '<img src="' + m.avatar + '" alt="" loading="lazy">' : initials(m.name);
      var pv = pavilion[m.name] || {};
      var role = roleOf(m);
      /* the marks say who someone works with and nothing more: a name on hover,
         no link of their own. The card underneath is the one thing to click. */
      var logos = clientsFor(m).slice(0, 5).map(function (cn) {
        var c = clientData.filter(function (x) { return x.name === cn; })[0];
        return c && c.domain
          ? '<img class="cl-dot" src="' + favicon(c.domain, 32) + '" alt="' + esc(cn) + '" title="' + esc(cn) + '" loading="lazy">'
          : '<span class="cl-dot txt" title="' + esc(cn) + '">' + esc(cn.charAt(0)) + '</span>';
      }).join('');
      /* four things and no more: the face, the name, the role, and the marks of
         who they work with. Department and location are what the filters above
         are for, so the card does not repeat them. The footer is a sibling of
         .info, not a child: an auto margin only reaches the card's own free
         space from one level up */
      d.innerHTML = '<div class="avatar">' + av + '</div><div class="info">'
        + '<div class="nm">' + esc(m.name) + (m.isNew ? '<span class="newtag">new</span>' : '') + '</div>'
        + '<div class="rl-sm">' + esc(role || '') + '</div>'
        + '</div>'
        + (logos ? '<div class="mb-foot"><div class="cl-row">' + logos + '</div></div>' : '')
        + '<span class="row-arrow" data-icon="arrow-up-right" aria-hidden="true"></span>';
      Icons.draw(d);
      grid.appendChild(d);
    });
    $('#team-count').textContent = shown.length + ' people';
    markFilters();
  }
  $('#team-search').addEventListener('input', function (e) { renderTeam(e.target.value); });
  /* Who works on which client comes from the Client Codex staffing (account
     managers, talent partners, coordination) on Active clients, not from what
     people typed into the Team Directory. Keyed by the Codex's (Notion) name;
     clientsOf() bridges from a roster name through the Pavilion match. Null
     until the Codex has loaded. */
  var codexByPerson = null;
  /* the roster and the Codex load separately; whichever lands second redraws */
  function codexLoaded() {
    buildCodexPeople();
    if (!teamData.length) return;
    populateFilters();
    renderTeam($('#team-search').value);
  }
  function buildCodexPeople() {
    codexByPerson = {};
    var cx = codexData.clients || {};
    Object.keys(cx).sort().forEach(function (name) {
      var row = cx[name] || {};
      if (row.status !== 'Active') return;
      [].concat(row.accountManagers || [], row.talentPartners || [], row.coordination || []).forEach(function (p) {
        var list = codexByPerson[p] || (codexByPerson[p] = []);
        if (list.indexOf(name) === -1) list.push(name);
      });
    });
  }
  function clientsOf(name) {
    var pv = pavilion[name] || {};
    if (pv.isMine) return pv.clients || [];
    if (!codexByPerson) return [];
    var out = (codexByPerson[pv.name || name] || codexByPerson[name] || []).slice();
    /* plus the active client teams the Knowledge Hub keeps from Slack and the owner survey */
    ((knowledgeByPerson || {})[pv.name || name] || (knowledgeByPerson || {})[name] || []).forEach(function (c) {
      if (out.indexOf(c) === -1) out.push(c);
    });
    return out;
  }
  var profileData = {};
  var pavilion = {};   /* name -> Notion Team Directory entry (role, location, clients, answers) */
  Promise.all([
    (window.__TEAM__ ? Promise.resolve(window.__TEAM__) : fetch('/api/team').then(function (r) { if (!r.ok) throw 0; return r.json(); }))
      .catch(function () { return fetch('/team.json').then(function (r) { return r.json(); }); }),
    fetch('/profiles.json').then(function (r) { return r.json(); }).catch(function () { return { profiles: {} }; }),
    fetch('/people.json').then(function (r) { return r.json(); }).catch(function () { return { people: [] }; })
  ])
    .then(function (both) {
      var data = both[0];
      profileData = (both[1] && both[1].profiles) || {};
      /* the Notion directory is the richer source: role, location, clients and the
         People Pavilion answers. Slack still owns the photo and who is on the roster. */
      fromPops = data.source === 'pops';
      grouping = MO.groupingOf(data);
      teamData = data.members || [];
      applyKnowledgePeople();
      /* Slack and Notion spell people differently: Slack has "Heath" and "Ben",
         Notion has "Heath Jamieson" and "Ben Munns". Match on email first, then
         exact name, and only then on a first name -- and only when the Slack
         entry is a single word, so "Chris Hubli" can never bind to "Chris
         Gonzalez". Anything still ambiguous is left unmatched on purpose. */
      var byEmail = {}, byName = {}, firstCount = {};
      teamData.forEach(function (m) {
        if (m.email) byEmail[m.email.trim().toLowerCase()] = m.name;
        byName[m.name] = m.name;
        var f = m.name.split(/\s+/)[0].toLowerCase();
        firstCount[f] = (firstCount[f] || 0) + 1;
      });
      var singleWord = {};
      teamData.forEach(function (m) {
        if (m.name.trim().indexOf(' ') === -1) singleWord[m.name.trim().toLowerCase()] = m.name;
      });
      ((both[2] && both[2].people) || []).forEach(function (x) {
        var key = byName[x.name]
          || (x.email && byEmail[x.email.trim().toLowerCase()])
          || null;
        if (!key) {
          var f = x.name.split(/\s+/)[0].toLowerCase();
          if (singleWord[f] && firstCount[f] === 1) key = singleWord[f];
        }
        pavilion[key || x.name] = x;
      });
      renderTeam('');
      populateFilters();
      wireFilters();
      refreshStats();
      mountMyOnboarding();
      /* where the list comes from used to be written out under it. The note is
         gone; the line below it is kept for when there is no list to show. */
    })
    .catch(function () { $('#team-note').textContent = 'Team list is unavailable right now.'; });

  /* ---------- welcome kit -> hub personalization ---------- */
  var kitData = null;
  function applyKitToHub() {
    if (!kitData) return;
    /* The cover greets the hire by name once we know it, and reads "Welcome."
       until then -- the hub is minted per hire, but the name only arrives with
       the kit. */
    var coverTitle = $('#start-title');
    if (coverTitle && kitData.firstName) {
      coverTitle.innerHTML = 'Welcome ' + esc(kitData.firstName)
        + '.<br>You\u2019re part of the team now.';
    }
    var brief = $('#brief-desc');
    if (brief && kitData.client) {
      brief.innerHTML = 'Your first client is <b>' + esc(kitData.client.name) + '</b>'
        + (kitData.client.lead ? ', led by ' + esc(kitData.client.lead.replace(/\.+$/, '')) + '.' : '.')
        + (kitData.manager && kitData.manager.name ? ' Your manager is ' + esc(kitData.manager.name) + '.' : '')
        /* The popup no longer holds any of this, and the section is no longer
           hidden until the hub has been walked, so there is one place to send
           people and it is always there. */
        + ' <a class="textlink" href="#/' + MO.SECTION_ID + '">My onboarding</a> has who to meet and your first 90 days.';
    }
    if (kitData.client) {
      $$('#client-grid .cl-item').forEach(function (row) {
        var nm = row.querySelector('.cl-nm');
        if (nm && nm.textContent === kitData.client.name && !row.querySelector('.mine-tag')) {
          row.classList.add('mine');
          nm.insertAdjacentHTML('beforeend', '<span class="mine-tag">your first client</span>');
        }
      });
    }
  }

  /* The hire's own section, rendered from whatever kit we currently hold --
     including none, which renders the "enter your access code" state. */
  /* What the section knows beyond the kit: the manager's photo and email from
     the roster, the people on the hire's team, and checklist progress. Any of
     it can be missing (roster still loading, offline); the section copes. */
  function sameFirstAndInitial(a, b) {
    var pa = String(a || '').trim().toLowerCase().split(/\s+/);
    var pb = String(b || '').trim().toLowerCase().split(/\s+/);
    if (!pa[0] || pa[0] !== pb[0]) return false;
    var la = (pa[1] || '').replace(/\./g, ''), lb = (pb[1] || '').replace(/\./g, '');
    return !!la && !!lb && la.charAt(0) === lb.charAt(0);
  }
  function myOnboardingCtx() {
    var ctx = {};
    if (typeof flat !== 'undefined' && flat.length) ctx.checklist = { done: chkCount(), total: flat.length };
    if (!kitData) return ctx;
    var mgr = kitData.manager || {};
    if (mgr.name && teamData && teamData.length) {
      var m = teamData.filter(function (x) { return x.name === mgr.name; })[0]
        || teamData.filter(function (x) { return sameFirstAndInitial(x.name, mgr.name); })[0];
      if (m) {
        ctx.manager = { avatar: m.avatar || '', email: m.email || '', role: roleOf(m) };
      }
    }
    /* Under POps practices, "your team" is everyone who shares a practice with
       the hire, and the team link filters to their first practice. */
    var pt = MO.practiceTeam(kitData, fromPops, grouping, teamData, mgr.name);
    if (pt) {
      ctx.teamFilter = pt.teamFilter;
      ctx.peers = pt.peers;
      return ctx;
    }
    var dirTeams = MO.TEAM_DIRECTORY[(kitData.team && kitData.team.key) || ''] || [];
    if (dirTeams.length) {
      ctx.teamFilter = dirTeams[0];
      var avatars = {};
      (teamData || []).forEach(function (x) { avatars[x.name] = x.avatar || ''; });
      var dir = pavilion || {};
      ctx.peers = Object.keys(dir).filter(function (n) {
        if (n === mgr.name || n === kitData.name) return false;
        return (dir[n].teams || []).some(function (t) { return dirTeams.indexOf(t) > -1; });
      }).sort().map(function (n) { return { name: n, avatar: avatars[n] || '' }; });
    }
    return ctx;
  }

  function mountMyOnboarding() {
    var el = $('#view-' + MO.SECTION_ID);
    if (!el) return;
    el.innerHTML = MO.renderSection(kitData, myOnboardingCtx());
    var reset = el.querySelector('#mo-reset');
    if (reset) reset.addEventListener('click', function () { window.dispatchEvent(new Event('carrara:kit-reset')); });
    var chk = el.querySelector('.mo-checklist');
    if (chk) {
      var openChk = function (e) {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openChecklist();
      };
      chk.addEventListener('click', openChk);
      chk.addEventListener('keydown', openChk);
    }
    var flip = el.querySelector('.mo-flip');
    if (flip) {
      var turn = function (e) {
        if (e.target.closest('a')) return;
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        flip.classList.toggle('flipped');
      };
      flip.addEventListener('click', turn);
      flip.addEventListener('keydown', turn);
    }
    /* "Meet your team" opens the team page already filtered to their team */
    el.querySelectorAll('a[data-team-filter]').forEach(function (a) {
      a.addEventListener('click', function () {
        var sel = $('#f-team');
        /* TEAM_DIRECTORY still carries Notion names; until it is switched to POps
           department names the link must never strand a hire on an empty grid. */
        var v = a.dataset.teamFilter;
        var ok = sel && Array.prototype.some.call(sel.options, function (o) { return o.value === v; });
        teamFilter.team = ok ? v : '';
        if (sel) sel.value = ok ? v : '';
        renderTeam($('#team-search').value);
      });
    });
  }

  /* The saved kit is a FALLBACK for an offline or failed refresh, never the
     source of truth: the manager can still be editing the plan, the client's
     lead can change, and the plan itself lives in POps. One refresh in flight
     at a time -- a hire clicking between sections must not queue five. */
  var kitRefreshing = false;
  // A plan is either not there at all (null) or there with every field blank;
  // both are the SAME "empty" a refetch must never let overwrite real content.
  // practices never counts as content: it is not the manager's words. The rule
  // lives in my-onboarding.js (MO.planIsEmpty) so the verifier can drive it.
  function refreshKit() {
    var saved = store('carrara_welcome');
    if (!saved || !saved.code || kitRefreshing) return;
    kitRefreshing = true;
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: saved.code })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        // A manager cannot un-submit: a fresh empty plan (POps down, a
        // retired/stale plan key, an upstream gap) must never overwrite a
        // plan already on screen -- that always means the READ failed, never
        // that the content was deleted. The manager's syncs travel WITH the
        // plan (they are the same submission), so both are kept together;
        // everything else -- client, team, links, country -- still comes
        // from the fresh response. A real update still replaces stored: this
        // is not a one-way freeze, only a floor under real content.
        var stored = saved.data || {};
        if (MO.planIsEmpty(j.plan) && !MO.planIsEmpty(stored.plan)) {
          /* a fresh answer's practices still win: they come from POps' roster,
             not the manager, so a blank manager plan does not make them stale */
          var freshPractices = j.plan && Array.isArray(j.plan.practices) ? j.plan.practices : null;
          j.plan = Object.assign({}, stored.plan, freshPractices ? { practices: freshPractices } : {});
          j.syncWith = stored.syncWith;
        }
        store('carrara_welcome', { code: saved.code, data: j });
        kitData = j;
        applyKitToHub();
        mountMyOnboarding();
        window.dispatchEvent(new Event('carrara:kit-updated'));
      })
      .catch(function () { /* offline: the saved copy stands */ })
      .then(function () { kitRefreshing = false; });
  }

  /* One place that renders a client as a logo. Used by the team grid, a person's
     card and the offering popups, so a logo means the same thing everywhere and
     always opens the client's own site. Falls back to a letter when we have no
     domain, and that fallback is not a link, because there is nowhere to go. */
  function clientTile(name, size) {
    var c = clientData.filter(function (x) { return x.name === name; })[0];
    var mark = c && c.domain
      ? '<img src="' + favicon(c.domain, size || 64) + '" alt="" loading="lazy">'
      : '<span class="cl-init">' + esc(String(name).charAt(0)) + '</span>';
    var inner = '<div class="cl-mark">' + mark + '</div><div class="cl-name">' + esc(name) + '</div>';
    return (c && c.domain)
      ? '<a class="cl-cell" href="https://' + esc(c.domain) + '" target="_blank" rel="noopener" title="' + esc(name) + '">' + inner + '</a>'
      : '<div class="cl-cell" title="' + esc(name) + '">' + inner + '</div>';
  }
  window.clientTile = clientTile;

  /* ---------- watercooler channels ---------- */
  (function () {
    var grid = document.getElementById('water-grid');
    if (!grid) return;
    grid.innerHTML = WATERCOOLER.map(function (c) {
      var u = window.channelUrl && window.channelUrl(c.n);
      var name = u
        ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(c.n) + '</a>'
        : esc(c.n);
      return '<div class="ch-cell"><div class="ch-name">' + name + '</div>'
        + '<div class="ch-what">' + esc(c.d) + '</div></div>';
    }).join('');
  })();

  /* ---------- the brand skill handoff ---------- */
  (function () {
    var timers = {};
    document.querySelectorAll('.bv-skill-copy').forEach(function (btn, i) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      clearTimeout(timers[i]);
      btn.textContent = 'Copying\u2026';
      fetch(btn.dataset.skill)
        .then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (md) { return navigator.clipboard.writeText(md); })
        .then(function () { btn.textContent = 'Copied'; })
        /* Clipboard writes need a secure context and permission, and either can
           refuse. The download link beside this button is the way through. */
        .catch(function () { btn.textContent = 'Use Download'; })
        .then(function () { timers[i] = setTimeout(function () { btn.textContent = label; }, 4000); });
    });
    });
  })();

  /* ---------- clients ---------- */
  var codexData = { clients: {} };
  function clientSlug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  /* ---------- knowledge hub ----------
     knowledge.json is written into this repo by the Carrara Knowledge Hub
     (hub.carrara.is, carrara-knowledge-hub's hub-onboarding.yml) whenever its
     clients or practices change. It carries each client's status, one liner,
     practices, team and current workstreams, and each offering's services,
     leads and active clients. Where the Knowledge Hub and the Client Codex both
     know a client, the Knowledge Hub wins: it is kept current daily from the
     client channels and the owner survey, so the two hubs never disagree. The
     Codex still supplies what the hub doesn't hold (company facts, docs). */
  var knowledge = { clients: [], practices: [] };
  var knowledgeByName = {};     /* onboarding client name -> knowledge client */
  var knowledgeByPage = {};     /* pages.js key (skuFinance) -> knowledge practice */
  var knowledgeByPerson = {};   /* person name -> active client names they're on */
  function applyKnowledgePeople() {
    if (!knowledge || !knowledge.people) return;
    var byEmail = {};
    knowledge.people.forEach(function (p) { if (p.email) byEmail[p.email.toLowerCase()] = p; });
    teamData.forEach(function (m) {
      var p = m.email && byEmail[m.email.toLowerCase()];
      if (!p) return;
      // The roster still decides who is active. Shared workplace metadata only;
      // personal survey answers stay behind Carrara Hub sign in.
      if (fromPops) {
        // POps wins: the Knowledge Hub only fills what POps left empty
        if (!m.title) m.title = p.title || '';
        if (!m.avatar && p.photo) m.avatar = p.photo;
      } else {
        m.title = p.title || m.title;
        if (p.photo) m.avatar = p.photo;
      }
      profileData[m.name] = Object.assign({}, profileData[m.name], { linkedin: p.linkedin || '' });
    });
  }
  function knowledgeClient(name) { return knowledgeByName[name] || null; }
  function knowledgePractice(pageKey) { return knowledgeByPage[pageKey] || null; }
  function knowledgeLoaded(k) {
    knowledge = k && k.clients ? k : { clients: [], practices: [] };
    knowledgeByName = {}; knowledgeByPage = {}; knowledgeByPerson = {};
    knowledge.clients.forEach(function (c) {
      knowledgeByName[c.name] = c;
      if (c.status !== 'active') return;
      (c.team || []).forEach(function (m) {
        var list = knowledgeByPerson[m.name] || (knowledgeByPerson[m.name] = []);
        if (list.indexOf(c.name) === -1) list.push(c.name);
      });
    });
    (knowledge.practices || []).forEach(function (p) { knowledgeByPage[p.page] = p; });
    applyKnowledgePeople();
  }
  /* Clients the Knowledge Hub has and the Codex snapshot doesn't get a card too,
     built from the export. clients.json carries the same names so POps can
     match them (AGENTS.md). */
  function mergeKnowledgeClients(list) {
    knowledge.clients.forEach(function (k) {
      var c = list.filter(function (x) { return x.name === k.name; })[0];
      if (!c) {
        c = { name: k.name, domain: '', lead: '', description: '', work: [] };
        list.push(c);
      }
      if (!c.domain && k.website) c.domain = k.website;
      if (!c.lead && k.owner) c.lead = k.owner;
      if (!c.description && k.oneLiner) c.description = k.oneLiner;
      if (!(c.work && c.work.length) && k.practices) c.work = k.practices.map(function (p) { return p.name; });
    });
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return list;
  }
  /* A client reads as a sheet, the same one a product line opens: the mark, the
     name in the serif, then the sections under their labels and the way out at
     the foot. It used to be a page of its own at #/client/<slug>; that address
     still works and lands here, over the list. */
  function clientSheetHtml(c) {
    var cx = (codexData.clients || {})[c.name] || {};
    var kc = knowledgeClient(c.name);
    /* type of work: the Knowledge Hub's practices when it has the client, else the Codex's */
    var types = kc ? kc.practices.map(function (p) { return p.name; }) : (cx.projectTypes || []);
    var status = kc ? kc.status : (cx.status ? cx.status.toLowerCase() : '');
    var logo = kc && kc.logo
      ? '<img src="' + esc(kc.logo) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
      : c.domain
        ? '<img src="' + favicon(c.domain, 128) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
        : esc(c.name.charAt(0));
    var html = '<div class="cp-mark">' + logo + '</div>'
      + '<h3>' + esc(c.name)
      + (status ? '<span class="cstatus' + (status === 'active' ? ' on' : '') + '">' + esc(status) + '</span>' : '')
      + '</h3>';
    /* the kinds of work belong to the name, not to the body: they sit between
       the two, and the body starts 40 under them */
    if (types.length) {
      html += '<div class="client-tags">' + types.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
    }
    html += '<div class="pg">';
    var about = (kc && kc.oneLiner) || cx.about || c.description || '';
    if (about) html += '<p>' + esc(about) + '</p>';
    if (kc && kc.about && kc.about !== about) html += '<p>' + esc(kc.about) + '</p>';
    /* what we're doing now and who's on it come from the Knowledge Hub, which
       the daily sync and the owner survey keep current */
    if (kc && kc.workstreams && kc.workstreams.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">What we\'re doing now</div><ul>'
        + kc.workstreams.map(function (w) { return '<li><b>' + esc(w.title) + '</b>' + (w.detail ? ': ' + esc(w.detail) : '') + '</li>'; }).join('')
        + '</ul></div>';
    }
    if (kc && kc.team && kc.team.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">Who\'s on it</div><ul>'
        + kc.team.map(function (m) { return '<li><b>' + esc(m.name) + '</b>' + (m.role ? ': ' + esc(m.role) : '') + '</li>'; }).join('')
        + '</ul></div>';
    }
    var ov = cx.overview || {};
    var facts = [
      ['Location', ov.location], ['Founded', ov.founded], ['Stage', ov.stage],
      ['Team', ov.teamSize], ['Key people', ov.leaders], ['Revenue model', ov.howTheyMakeMoney]
    ].filter(function (f) { return f[1]; });
    if (facts.length || cx.background) {
      html += '<div class="wk-sec"><div class="wk-lbl">The company</div>';
      if (facts.length) html += '<ul>' + facts.map(function (f) { return '<li><b>' + esc(f[0]) + '</b>: ' + esc(f[1]) + '</li>'; }).join('') + '</ul>';
      if (cx.background) html += '<p>' + esc(cx.background) + '</p>';
      html += '</div>';
    }
    if (cx.engagement && cx.engagement.length && !(kc && kc.workstreams && kc.workstreams.length)) {
      html += '<div class="wk-sec"><div class="wk-lbl">What we do for them</div><ul>'
        + cx.engagement.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('')
        + '</ul></div>';
    }
    var team = [];
    if (cx.accountManagers && cx.accountManagers.length) team.push(['Account manager' + (cx.accountManagers.length > 1 ? 's' : ''), cx.accountManagers]);
    if (cx.talentPartners && cx.talentPartners.length) team.push(['Talent partner' + (cx.talentPartners.length > 1 ? 's' : ''), cx.talentPartners]);
    if (cx.coordination && cx.coordination.length) team.push(['Coordination support', cx.coordination]);
    if (team.length && !(kc && kc.team && kc.team.length)) {
      html += '<div class="wk-sec"><div class="wk-lbl">Who runs it at Carrara</div><ul>'
        + team.map(function (t) { return '<li><b>' + esc(t[0]) + '</b>: ' + esc(t[1].join(', ')) + '</li>'; }).join('') + '</ul></div>';
    }
    /* the site and whatever docs there are read as a list; the hub page is the
       way out of the sheet, so it takes the button, as a product line's does */
    var linksH = [];
    if (c.domain) linksH.push('<a href="https://' + esc(c.domain) + '" target="_blank" rel="noopener">' + esc(c.domain) + '</a>');
    (cx.docs || []).forEach(function (d2) {
      linksH.push('<a href="' + esc(d2.url) + '" target="_blank" rel="noopener">' + esc(d2.label) + '</a>');
    });
    if (linksH.length) html += '<div class="wk-sec"><div class="wk-lbl">Links and docs</div><div class="wk-links">' + linksH.join('') + '</div></div>';
    if (kc && kc.url) {
      html += '<div class="wk-sec wk-out"><a class="btn" href="' + esc(kc.url) + '" target="_blank" rel="noopener">'
        + esc(c.name) + ' on the Carrara Hub <span data-icon="arrow-up-right" aria-hidden="true"></span></a></div>';
    }
    return html + '</div>';
  }
  /* Opens a client by its slug. Returns false when the client data has not
     arrived yet, so the caller can try again once it has. */
  window.openClientSheet = function (slug) {
    var c = clientData.filter(function (x) { return clientSlug(x.name) === slug; })[0];
    if (!c) return false;
    openModal(clientSheetHtml(c));
    return true;
  };
  /* live from Notion via /api/clients when NOTION_TOKEN is set; bundled snapshots otherwise */
  Promise.all([
    (window.__CLIENTS__ ? Promise.resolve({ clients: window.__CLIENTS__.clients, codex: null, updated: window.__CLIENTS__.updated })
      : fetch('/api/clients').then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (d) { return { clients: d.clients, codex: { clients: d.codex }, updated: d.updated, source: d.source }; })
          .catch(function () {
            return Promise.all([
              fetch('/clients.json').then(function (r) { return r.json(); }),
              fetch('/codex.json').then(function (r) { return r.json(); }).catch(function () { return { clients: {} }; })
            ]).then(function (both) { return { clients: both[0].clients, codex: both[1], updated: both[0].updated, source: 'snapshot' }; });
          })),
    /* the Knowledge Hub export: live through /api/knowledge, else the bundled
       snapshot; the page works without either */
    fetch('/api/knowledge').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch('/knowledge.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }); })
      .catch(function () { return null; })
  ]).then(function (both) {
    var data = both[0];
    knowledgeLoaded(both[1]);
    codexData = data.codex || { clients: {} };
    codexLoaded();
    if (!data.codex) {
      fetch('/codex.json').then(function (r) { return r.json(); }).then(function (d) { codexData = d; codexLoaded(); }).catch(function () {});
    }
    var grid = $('#client-grid');
    var archGrid = $('#client-grid-archived');
    clientData = mergeKnowledgeClients(data.clients || []);
    /* tags are the business lines from the Client Codex, not the per-project
       workstream names. Kenna's call: a new joiner should see "Marketing/Growth",
       not "Paid Media". Fall back to the workstreams only when Notion has nothing. */
    /* the nine business lines live in tags.js so this page and the weekly
       refresh job can never disagree about what a client is */
    function tagsFor(c) {
      var kc = knowledgeClient(c.name);
      if (kc && kc.practices && kc.practices.length) return kc.practices.map(function (p) { return p.name; });
      return window.TAGS
        ? window.TAGS.forClient((codexData.clients || {})[c.name], c.work)
        : (c.work || []);
    }
    /* current means active on the Knowledge Hub when it has the client, else
       the Codex's "Active Clients" view: Status is exactly Active. Paused,
       Archived and blank all belong in the past-engagements list. */
    function isActive(c) {
      var kc = knowledgeClient(c.name);
      if (kc) return kc.status === 'active';
      var cx = (codexData.clients || {})[c.name] || {};
      return cx.status === 'Active';
    }
    /* A client is a row in a list, the same row the resources page uses: the
       name in ink, who leads it and what we do there under it, and an arrow out
       to its page on the Carrara Hub. The hub's own URL is the only one that can
       be trusted -- six of the thirty-three it gives do not follow from the name
       (Modal Labs is /modal, Deeptune is /mercor), so a derived one would send
       people to the wrong client, not just to nothing. A client the Knowledge
       Hub does not carry has no page to go to, and its row says so by being a
       row rather than a link. */
    function row(c) {
      var kc = knowledgeClient(c.name);
      var url = kc && kc.url;
      var d = document.createElement(url ? 'a' : 'div');
      d.className = 'res-item cl-item' + (url ? '' : ' res-item--flat');
      if (url) {
        d.href = url;
        d.target = '_blank';
        d.rel = 'noopener';
      }
      var mark = c.domain
        ? '<img src="' + favicon(c.domain, 64) + '" alt="" loading="lazy" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
        : esc(c.name.charAt(0));
      d.innerHTML = '<span class="cl-logo">' + mark + '</span>'
        + '<span class="cl-body"><span class="cl-nm">' + esc(c.name) + '</span>'
        + (c.lead ? '<span class="d">Lead: ' + esc(c.lead) + '</span>' : '')
        + (c.description ? '<span class="d">' + esc(c.description) + '</span>' : '')
        + '</span>'
        + (url ? '<span class="row-arrow" data-icon="arrow-up-right" aria-hidden="true"></span>' : '');
      if (window.Icons) Icons.draw(d);
      return d;
    }

    var current = clientData.filter(isActive);
    var archived = clientData.filter(function (c) { return !isActive(c); });
    current.forEach(function (c) { grid.appendChild(row(c)); });
    if (archGrid) {
      archived.forEach(function (c) { archGrid.appendChild(row(c)); });
      var wrap = $('#archived-wrap');
      if (wrap) wrap.hidden = archived.length === 0;
    }
    $('#client-note').textContent = (knowledge.clients.length
      ? 'Current work and teams from the Carrara Hub (updated ' + (knowledge.exported || '') + '), company facts from the Client Codex.'
      : (data.source === 'notion'
        ? 'Live from the Client Codex in Notion, refreshed hourly. Last update: ' + (data.updated || '') + '.'
        : 'Sourced from the Client Codex. Last update: ' + (data.updated || '') + '.'));
    refreshStats();
    /* the team grid draws client logos out of clientData, and team.json usually
       lands first. Re-render once the clients are in or every card falls back
       to an initial. */
    if (teamData.length) renderTeam($('#team-search') ? $('#team-search').value : '');
    applyKitToHub();
    /* deep links to a client page arriving before data loaded */
    if (window.retryPendingClient) window.retryPendingClient();
  });
  var clientData = [];

  /* ---------- slack channels ---------- */
  (function () {
    var grid = $('#channel-grid');
    if (!grid) return;
    CHANNELS.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'ch-cell';
      var u = window.channelUrl ? window.channelUrl(c.n) : '';
      var nameHtml = u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(c.n) + '</a>' : esc(c.n);
      d.innerHTML = '<div class="ch-name">' + nameHtml + '</div>'
        + '<div class="ch-what">' + esc(c.d) + '</div>'
        + '<div class="hovercard"><div class="hlbl">What gets posted here</div><ul>'
        + c.ex.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
      grid.appendChild(d);
    });
  })();

  /* ---------- tools ---------- */
  (function () {
    var grid = $('#tool-grid');
    TOOLS.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'tool-row';
      d.innerHTML = '<div class="tlogo"><img src="' + favicon(t.dmn, 64) + '" alt="" loading="lazy"></div>'
        + '<div><div class="tn">' + esc(t.n) + (t.tag ? '<span class="tag">' + esc(t.tag) + '</span>' : '') + '</div>'
        + '<div class="td">' + esc(t.d) + (t.tag ? ' Request access from Eric on Slack.' : '') + '</div></div>'
        + '<div class="ta"><a class="btn" href="' + t.url + '" target="_blank" rel="noopener">'
        + 'Get it <span data-icon="arrow-up-right" aria-hidden="true"></span></a></div>';
      Icons.draw(d);
      grid.appendChild(d);
    });
  })();

  /* ---------- templates ---------- */
  var tplMounted = false;
  function frameFor(t) {
    var url, open, copy;
    if (t.kind === 'pptx') {
      // Office file stored on Drive: preview via Drive, open via Slides office-compat
      url = 'https://drive.google.com/file/d/' + t.id + '/preview';
      open = 'https://docs.google.com/presentation/d/' + t.id + '/edit';
      copy = '';
    } else {
      if (t.kind === 'presentation') url = 'https://docs.google.com/presentation/d/' + t.id + '/embed?start=false&loop=false';
      else if (t.kind === 'spreadsheets') url = 'https://docs.google.com/spreadsheets/d/' + t.id + '/preview';
      else url = 'https://docs.google.com/document/d/' + t.id + '/preview';
      open = 'https://docs.google.com/' + (t.kind === 'presentation' ? 'presentation' : t.kind === 'spreadsheets' ? 'spreadsheets' : 'document') + '/d/' + t.id + '/edit';
      copy = open.replace(/\/edit$/, '/copy');
    }
    var wrap = document.createElement('div');
    wrap.className = 'tpl';
    wrap.innerHTML = '<div class="tpl-head"><span class="tn">' + esc(t.name) + '</span><span class="tt">' + t.type + '</span>'
      + '<span class="acts"><a href="' + open + '" target="_blank" rel="noopener">Open</a>' + (copy ? '<a href="' + copy + '" target="_blank" rel="noopener">Make a copy</a>' : '') + '</span></div>'
      + '<div class="tpl-frame"><iframe loading="lazy" src="' + url + '" title="' + esc(t.name) + '"></iframe></div>';
    return wrap;
  }
  function mountTemplates() {
    if (tplMounted) return;
    tplMounted = true;
    var list = $('#tpl-list');

    var lbl1 = document.createElement('div');
    lbl1.className = 'section-lbl';
    lbl1.style.marginTop = '38px';
    lbl1.textContent = '[core templates]';
    list.appendChild(lbl1);
    var grid = document.createElement('div');
    grid.className = 'tpl-grid';
    CORE_TEMPLATES.forEach(function (t) { grid.appendChild(frameFor(t)); });
    list.appendChild(grid);

    var lbl2 = document.createElement('div');
    lbl2.className = 'section-lbl';
    lbl2.style.marginTop = '52px';
    lbl2.textContent = '[branding folder, live]';
    list.appendChild(lbl2);
    var note = document.createElement('p');
    note.className = 'body-copy';
    note.style.marginBottom = '16px';
    note.textContent = 'Everything the team adds to the branding folder shows up here automatically.';
    list.appendChild(note);

    fetch('/api/templates').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) {
        if (!data.files || !data.files.length) throw 0;
        var g2 = document.createElement('div');
        g2.className = 'tpl-grid';
        data.files.forEach(function (f) { g2.appendChild(frameFor(f)); });
        list.appendChild(g2);
      })
      .catch(function () {
        /* The embedded Drive folder view 403s unless the folder is public, so it
           rendered a Google error page inside the hub. A plain link is honest:
           it works, and it fails in Drive's own UI rather than ours. */
        var wrap = document.createElement('div');
        wrap.className = 'tpl';
        wrap.innerHTML = '<div class="tpl-head"><span class="tn">Branding folder</span><span class="tt">drive</span>'
          + '<span class="acts"><a href="https://drive.google.com/drive/folders/' + BRAND_FOLDER + '" target="_blank" rel="noopener">Open in Drive ↗</a></span></div>';
        list.appendChild(wrap);
      });
  }

  /* The guided tour is gone. Sequential movement lives in the "Next: <section>"
     link at the foot of every page, and visits are recorded by show() either
     way, so My onboarding still reveals itself once the hub has been walked. */
  $('#btn-home').addEventListener('click', function () { location.hash = '#/start'; });

  /* ---------- welcome kit popup ---------- */
  (function () {
    var wk = $('#wk');
    if (!wk) return;
    var pill = $('#wk-pill'), pillLabel = $('#wk-pill-label'), panel = $('#wk-panel'), body = $('#wk-body'), closeBtn = $('#wk-close');
    var saved = store('carrara_welcome'); /* { code, data } */

    function open() { panel.hidden = false; pill.setAttribute('aria-expanded', 'true'); pill.style.display = 'none'; }
    function close() { panel.hidden = true; pill.setAttribute('aria-expanded', 'false'); pill.style.display = ''; store('carrara_welcome_seen', true); }
    pill.addEventListener('click', function () {
      // After the reveal the popup is a doorway, not a container (spec decision
      // 1): everything it used to hold lives in the section now.
      if (saved && saved.data && MO.navState(true) !== 'hidden') {
        location.hash = '#/' + MO.SECTION_ID;
        return;
      }
      open();
    });
    closeBtn.addEventListener('click', close);

    function renderLocked(errMsg) {
      body.innerHTML = '<h3>Welcome to Carrara</h3>'
        + '<p>Your hiring manager set up a welcome kit just for you: your first client, who to meet, and how your team works.</p>'
        + '<label>Access code</label><input id="wk-code" autocomplete="off" spellcheck="false" placeholder="Paste the code you were sent">'
        + '<div class="wk-err" id="wk-error"></div>'
        + '<div class="wk-actions"><button class="btn-primary" id="wk-unlock">Unlock</button></div>'
        + '<p style="margin-top:14px;font-size:12px">No code? Ask your hiring manager for it.</p>';
      if (errMsg) { var e = $('#wk-error'); e.textContent = errMsg; e.classList.add('show'); }
      function go() {
        var code = $('#wk-code').value.trim();
        if (!code) { $('#wk-code').focus(); return; }
        $('#wk-unlock').textContent = 'Unlocking…';
        fetch('/api/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { renderLocked(res.j.error || 'That code does not look right.'); return; }
            saved = { code: code, data: res.j };
            store('carrara_welcome', saved);
            renderUnlocked(res.j);
          })
          .catch(function () { renderLocked('Could not reach the hub. Check your connection and try again.'); });
      }
      $('#wk-unlock').addEventListener('click', go);
      $('#wk-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    }

    /* The popup unlocks the hub and then gets out of the way. It used to hold
       the whole kit -- manager, syncs, client, team, country notes, Enneagram,
       links -- in a 320px panel; all of that lives in the hire's own section
       now, at full width, and the popup carries content again never (spec
       decision 1). Before the reveal it says where the section will appear;
       after it, it is a door to it. */
    function renderUnlocked(d) {
      kitData = d;
      applyKitToHub();
      mountMyOnboarding();
      syncMyOnboardingNav();
      // NOT named `open` — that is this IIFE's own panel-opening function, and
      // shadowing it here would break resetKit below.
      var hasSection = MO.navState(true) !== 'hidden';
      body.innerHTML = '<h3>Welcome, ' + esc(d.firstName) + '.</h3>'
        + (hasSection
            ? '<p>Your section is ready. <a class="textlink" href="#/' + MO.SECTION_ID + '">Open My onboarding</a> '
              + 'for your first client, who to sync with, and your first 90 days.</p>'
            : '<p>You are all set. Work your way through the hub: a section made just for you appears '
              + 'at the end, with a note from your manager, your first client, who to sync with in week '
              + 'one, and your first 90 days.</p>')
        + '<button class="wk-reset" id="wk-reset">Not you? Enter a different code</button>';
      pillLabel.textContent = hasSection
        ? 'Your onboarding, ' + d.firstName
        : 'Your welcome kit, ' + d.firstName;
      $('#wk-reset').addEventListener('click', resetKit);
      body.querySelectorAll('a[href^="#/"]').forEach(function (a) { a.addEventListener('click', close); });
    }

    function resetKit() {
      saved = null;
      store('carrara_welcome', null);
      kitData = null;
      mountMyOnboarding();
      pillLabel.textContent = 'New here? Open your welcome kit';
      renderLocked();
      open();
    }

    /* POps welcome emails link here with ?code=…; unlock with it automatically so
       the joiner never has to paste. The param is scrubbed from the address bar right
       away (the code is the whole authorization — it should not linger anywhere
       shareable), then fed through the exact same path as a manual paste: same
       endpoint, same error message, and the input stays there if the code is bad.
       A code in the link outranks a kit saved on this browser — on a shared machine
       the link belongs to whoever just clicked it. */
    var urlCode = new URLSearchParams(location.search).get('code');
    if (urlCode) history.replaceState(null, '', location.pathname + location.hash);

    if (urlCode) {
      renderLocked();
      $('#wk-code').value = urlCode;
      open();
      $('#wk-unlock').click();
    } else if (saved && saved.data) {
      /* renderUnlocked owns the pill's label: before the reveal it is the
         welcome kit, after it the hire's own section. */
      renderUnlocked(saved.data);
    } else {
      renderLocked();
      /* nudge first-time visitors once */
      if (!store('carrara_welcome_seen')) setTimeout(open, 1400);
    }

    /* The two events the outer scope raises. A refetch that lands while the
       panel is open re-renders it; otherwise only the pill's label moves, so a
       background refresh never reopens something the hire just closed. */
    window.addEventListener('carrara:kit-updated', function () {
      saved = store('carrara_welcome');
      if (saved && saved.data && !panel.hidden) renderUnlocked(saved.data);
      else if (saved && saved.data) {
        pillLabel.textContent = (MO.navState(true) !== 'hidden' ? 'Your onboarding, ' : 'Your welcome kit, ') + saved.data.firstName;
      }
    });
    /* the section's own "Not you?" button, which lives outside this IIFE */
    window.addEventListener('carrara:kit-reset', resetKit);
  })();

  /* ---------- search palette (Cmd/Ctrl+K) ---------- */
  (function () {
    var back = $('#pal-back'), input = $('#pal-input'), list = $('#pal-list');
    if (!back) return;
    var sel = 0;

    function buildIndex() {
      var ix = [];
      SECTIONS.forEach(function (s) {
        ix.push({ label: s.label, hint: 'section', go: function () { location.hash = '#/' + s.id; } });
      });
      CHECKLIST.forEach(function (g) { g.items.forEach(function (it) {
        ix.push({ label: it.t, hint: 'checklist · ' + g.g, go: openChecklist });
      }); });
      teamData.forEach(function (m) {
        ix.push({ label: m.name, hint: (m.title ? cleanTitle(m.title) + ' · ' : '') + 'team', go: function () {
          location.hash = '#/team';
          setTimeout(function () { var f = $('#team-search'); f.value = m.name; renderTeam(m.name); }, 60);
        } });
      });
      clientData.forEach(function (c) {
        ix.push({ label: c.name, hint: 'client' + (c.lead ? ' · lead: ' + c.lead : ''), go: function () { location.hash = '#/clients'; } });
      });
      CHANNELS.forEach(function (c) {
        var u = window.channelUrl ? window.channelUrl(c.n) : '';
        ix.push({ label: c.n, hint: 'slack channel', go: function () { if (u) window.open(u, '_blank'); else location.hash = '#/slack'; } });
      });
      TOOLS.forEach(function (t) { ix.push({ label: t.n, hint: 'tool', go: function () { window.open(t.url, '_blank'); } }); });
      ix.push({ label: 'Coordinator OOO template', hint: 'time off', go: function () {
        location.hash = '#/timeoff';
        var d = document.getElementById('faq-ooo-template');
        if (!d) return;
        d.open = true;
        setTimeout(function () { d.scrollIntoView({ block: 'center' }); }, 60);
      } });
      [['Home Base', 'notionHomeBase'], ['The Quarry', 'quarry'], ['Brand Vault', 'brandVault'],
       ['Team Roundup', 'teamRoundup'], ['Brand palette & typography', 'brandVaultArchive'], ['This is Carrara', 'thisIsCarrara'],
       ['Weekly Talent Jam', 'talentTeamMeeting'], ['Ashby', 'ashby'],
       ['carrara.is', 'site']].forEach(function (r) {
        if (pageFor(r[1])) { ix.push({ label: r[0], hint: 'library', go: function () { openPage(r[1]); } }); return; }
        var u = linkFor(r[1]);
        if (u) ix.push({ label: r[0], hint: 'resource', go: function () { window.open(u, '_blank'); } });
      });
      return ix;
    }

    var results = [];
    function render(q) {
      var ix = buildIndex();
      q = (q || '').toLowerCase().trim();
      results = !q ? ix.slice(0, 8) : ix.filter(function (r) {
        return r.label.toLowerCase().indexOf(q) >= 0 || r.hint.toLowerCase().indexOf(q) >= 0;
      }).slice(0, 10);
      sel = 0;
      list.innerHTML = results.length
        ? results.map(function (r, i) {
            return '<div class="pal-item' + (i === sel ? ' sel' : '') + '" data-i="' + i + '">' + esc(r.label) + '<span>' + esc(r.hint) + '</span></div>';
          }).join('')
        : '<div class="pal-empty">Nothing found. Try a section, a name, a client, or a channel.</div>';
      $$('.pal-item').forEach(function (el) {
        el.addEventListener('click', function () { pick(parseInt(el.dataset.i, 10)); });
      });
    }
    function pick(i) { if (results[i]) { closePal(); results[i].go(); } }
    function openPal() { back.classList.add('show'); input.value = ''; render(''); input.focus(); }
    function closePal() { back.classList.remove('show'); }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') pick(sel);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = Math.max(0, Math.min(results.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
        $$('.pal-item').forEach(function (el, i) { el.classList.toggle('sel', i === sel); });
      }
    });
    back.addEventListener('click', function (e) { if (e.target === back) closePal(); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); back.classList.contains('show') ? closePal() : openPal(); }
      if (e.key === 'Escape') closePal();
    });
    var btn = $('#btn-search');
    if (btn) btn.addEventListener('click', openPal);
  })();

  route();
  /* Every load re-verifies the saved code with POps behind it (spec decision 6).
     The section itself refetches on every visit; this is the boot copy, so a
     hire who lands straight on the hub sees a current kit, not yesterday's. */
  refreshKit();
})();
