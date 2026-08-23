/* Carrara Onboarding Hub */
(function () {
  'use strict';

  /* my-onboarding.js, loaded just above this file. Read once, at parse time:
     if the script order in index.html ever slips, this throws here rather than
     failing quietly somewhere downstream. */
  var MO = window.MyOnboarding;

  var SECTIONS = [
    { id: 'start',     label: 'Start here' },
    { id: 'who',       label: 'Who we are' },
    { id: 'team',      label: 'The team' },
    { id: 'slack',     label: 'Slack' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'business',  label: 'The business' },
    { id: 'clients',   label: 'Clients' },
    { id: 'tools',     label: 'Tools' },
    { id: 'templates', label: 'Templates and brand' },
    { id: 'timeoff',   label: 'Time off' },
    { id: 'resources', label: 'Resources' },
    /* locked: reachable, but marked so nobody expects content yet */
    { id: 'conduct',   label: 'Code of conduct', locked: true },
    /* LAST, and hidden until every section above has been visited. */
    { id: MO.SECTION_ID, label: 'My onboarding' }
  ];
  /* every id except the hire's own section: what the reveal is decided from */
  var OTHER_IDS = SECTIONS.filter(function (s) { return s.id !== MO.SECTION_ID; })
    .map(function (s) { return s.id; });

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
    { n: '#f-talent-general', d: 'everything talent services.', ex: ['Weekly Talent Jam prep and open roles reminders', 'Client interview process questions', 'Hiring experiments worth copying'] }
  ];

  /* item.links: [{t, k}] where k is a LINKS key, a '#/section' hash, a full URL,
     or 'ch:<channel>' for a Slack channel. Unresolvable keys simply do not render,
     so filling a blank in links.js lights the link up everywhere at once. */
  var CHECKLIST = [
    { g: 'day one', cls: '', items: [
      { t: 'Set up your Slack workspace', d: 'Join carrarais.slack.com. Set your photo, title and timezone: the team page pulls from your Slack profile. Then read the Slack section of this hub so the channel prefixes make sense.', links: [{ t: 'Open Slack', k: 'slackWorkspace' }, { t: 'The Slack guide', k: '#/slack' }] },
      { t: 'Ensure tool and system access', d: 'Confirm you can open Google, Notion, Slack and the tools for your role. Anything blocked, ping Eric on Slack.', links: [{ t: 'Notion Home Base', k: 'notionHomeBase' }] },
      { t: 'Payroll setup (Deel, Bill.com, or Ramp)', d: 'Deel for full-time employees, Bill.com for US contractors, Ramp for international contractors. You will get an invite for the one that applies to you.', links: [{ t: 'Deel', k: 'deel' }, { t: 'Bill.com', k: 'bill' }, { t: 'Ramp', k: 'ramp' }] },
      { t: 'Set up email signature and Slack profile', d: 'Use the Carrara signature format from the brand templates, and fill out your Slack profile completely.', links: [{ t: 'Brand templates', k: '#/templates' }] },
      { t: 'Day 1 manager 1:1', d: 'Your first 1:1: align on your 90-day plan, week one priorities, and how you will work together.' },
      { t: 'Submit your Top 5', d: 'Name the five best people you have ever worked with, one submission per person. It seeds our network with people we already trust, and it is one of the highest-leverage things you can do in week one.', links: [{ t: 'Top 5 form', k: 'top5Form' }] },
      { t: 'Look through open roles', d: 'Browse the roles we are currently hiring for across clients. It is the fastest way to understand what the talent side of the business actually does.', links: [{ t: 'Open roles', k: 'openRoles' }] },
      { t: 'Attend your orientation session', d: 'Eric walks you through admin items, the plan for your first week, and anything you want to ask. It happens on day one; your manager books it.' },
      { t: 'I-9 verification (full-time employees only)', d: 'US full-time employees complete I-9 employment eligibility verification. Eric sends this over; get it back the same week so payroll is not held up.' }
    ]},
    { g: 'week one', cls: 'blue', items: [
      { t: 'Set up the Quarry', d: 'Our AI harness. Download the Claude app and log in with your Carrara Google account, set up an Obsidian vault, point Cowork at it, then run /workspace-initialization, /workspace-migration and /sync. Do this in week one: most of how we work assumes it.', links: [{ t: 'Quarry setup guide', k: 'quarry' }, { t: 'The tools we use', k: '#/tools' }] },
      { t: 'Learn the skills we share', d: 'Skills are the reusable prompts and playbooks the team builds together, pre-installed on Cowork. Learn which ones exist and which to reach for when you are writing a doc, building a deck or researching a candidate. Ask in Slack for a walkthrough if anything is unclear.', links: [{ t: 'Quarry setup guide', k: 'quarry' }] },
      { t: 'Attend the tool tips session', d: 'A live walkthrough of the tools the team runs on, with tips from people who use them daily.', links: [{ t: 'The tools we use', k: '#/tools' }] },
      { t: 'Set up a recurring 1:1 with your manager', d: 'Get a weekly slot on the calendar before the week ends.' },
      { t: "Confirm you're added to all team calls", d: 'Standing team meetings, the monthly Team Roundup, and any client syncs relevant to your role.', links: [{ t: 'Team Roundup', k: 'teamRoundup' }] },
      { t: 'Get oriented on our Notion', d: 'Start at Home Base and click around.', links: [{ t: 'Home Base', k: 'notionHomeBase' }] },
      { t: 'Review the PTO policy', d: 'Read the Time off section of this hub, then the full policy on Notion. Two minutes now saves confusion later.', links: [{ t: 'Time off section', k: '#/timeoff' }, { t: 'Full policy on Notion', k: 'timeOffPolicy' }] },
      { t: 'Set up time tracking', d: 'Set up time tracking following your team lead’s instructions for your role and client.', links: [{ t: 'Time tracking', k: 'timeTracking' }] },
      { t: 'Explore and fill out the People Pavilion', d: 'The team directory in Notion. Fill in your entry so people can get to know you.', links: [{ t: 'People Pavilion', k: 'peoplePavilion' }] },
      { t: 'Understand your benefits', d: 'What you are enrolled in, what you need to elect, and by when. Ask Eric on Slack if anything is unclear or if you are a contractor and not sure what applies to you.' }
    ]},
    { g: 'week two', cls: '', items: [
      { t: 'Meet the people on your list', d: 'Your manager picks who you should meet in your first two weeks: your client lead, the people on your account, and a couple of others. Enter your access code in the welcome kit (bottom right) to see your names, then book the 1:1s.', links: [{ t: 'The team wall', k: '#/team' }] },
      { t: 'Read the company operating principles', d: 'The Ways of Working page in Notion: what the four principles look like in practice.', links: [{ t: 'Ways of Working', k: 'waysOfWorking' }] },
      { t: 'Read the company context docs', d: 'Company history, direction, and how we engage clients.', links: [{ t: 'Company context', k: 'companyContext' }, { t: 'Home Base', k: 'notionHomeBase' }] },
      { t: 'Review the Carrara Brand Vault', d: 'Brand story, messaging and visual identity. Everything you make should feel like Carrara.', links: [{ t: 'Brand Vault', k: 'brandVault' }] },
      { t: 'Talent team only: get oriented on Ashby', d: 'Our ATS. Ask in #g-ashby-support if you get stuck.', links: [{ t: 'Open Ashby', k: 'ashby' }, { t: '#g-ashby-support', k: 'ch:g-ashby-support' }] }
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
  function openPage(k) {
    var pg = pageFor(k);
    if (!pg) return;
    openModal((pg.eyebrow === undefined ? '<div class="m-eyebrow">[from the carrara library]</div>'
        : (pg.eyebrow ? '<div class="m-eyebrow">' + esc(pg.eyebrow) + '</div>' : ''))
      + '<h3>' + esc(pg.title) + '</h3><div class="pg">' + pg.html + '</div>'
      + (pg.note === undefined ? '<p class="pg-note">Snapshot from Notion, Jul 24, 2026.</p>'
        : (pg.note ? '<p class="pg-note">' + esc(pg.note) + '</p>' : '')));
  }
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
    { n: 'Claude', dmn: 'claude.ai', url: 'https://claude.ai', d: 'Our go-to AI, and the base of the Quarry. Log in with your Carrara Google account on the Team plan, then run the Quarry setup so you get the shared skills. Cowork for most work, Claude Code in the terminal.', tag: 'carrara provided' },
    { n: 'Obsidian', dmn: 'obsidian.md', url: 'https://obsidian.md', d: 'Where your Quarry vault lives: notes, memories and skills that Claude reads and writes. Sync needs a paid subscription, which fits inside your monthly SaaS stipend on Ramp.', tag: '' },
    { n: 'Ashby', dmn: 'ashbyhq.com', url: 'https://app.ashbyhq.com', d: 'Our ATS, and the system of record for every search. Talent team gets oriented in week one; ask anything in #g-ashby-support.', tag: 'talent team' },
    { n: 'Granola', dmn: 'granola.ai', url: 'https://granola.ai', d: 'AI meeting notes so you stay present. We run it on every client call.', tag: 'carrara provided' },
    { n: 'Loom', dmn: 'loom.com', url: 'https://loom.com', d: 'Async walkthroughs and client handoffs instead of another meeting.', tag: 'carrara provided' },
    { n: 'Reclaim', dmn: 'reclaim.ai', url: 'https://reclaim.ai', d: 'Merges calendars across the multiple client accounts you will juggle.', tag: 'carrara provided' },
    { n: 'ChatGPT', dmn: 'chatgpt.com', url: 'https://chat.openai.com', d: 'Everyday copilot for quick brainstorms and rewrites.', tag: '' },
    { n: 'Whisper Flow', dmn: 'whisperflow.com', url: 'https://whisperflow.com', d: 'Voice keyboard. Dictate Slack messages and notes while juggling threads.', tag: '' },
    { n: 'CleanShot', dmn: 'cleanshot.com', url: 'https://cleanshot.com', d: 'Screenshots, GIFs, scrolling capture. Our default for async documentation.', tag: '' },
    { n: 'Paste', dmn: 'pasteapp.io', url: 'https://pasteapp.io', d: 'Infinite clipboard history. You will copy a lot between clients.', tag: '' },
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
  function openModal(html) { $('#modal-content').innerHTML = html; mBack.classList.add('show'); }
  function closeModal() { mBack.classList.remove('show'); }
  $('#modal-close').addEventListener('click', closeModal);
  mBack.addEventListener('click', function (e) { if (e.target === mBack) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- nav ---------- */
  var nav = $('#nav'), mnav = $('#mobile-nav');
  SECTIONS.forEach(function (s, i) {
    var a = document.createElement('a');
    a.href = '#/' + s.id;
    a.dataset.id = s.id;
    a.textContent = s.label;
    if (s.locked) {
      a.classList.add('nav-locked');
      /* inline svg, not an emoji: it inherits colour and stays at text weight */
      a.insertAdjacentHTML('beforeend',
        '<svg class="nav-lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        + '<rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.8"/>'
        + '<path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>');
    }
    nav.appendChild(a);
    var o = document.createElement('option');
    o.value = s.id; o.textContent = s.label;
    mnav.appendChild(o);
  });
  mnav.addEventListener('change', function () { location.hash = '#/' + mnav.value; });

  /* ---------- my onboarding: visits, reveal, badge ---------- */
  var visited = store(MO.VISITED_KEY) || [];

  function revealed() { return MO.allVisited(visited, OTHER_IDS); }

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
    var state = MO.navState(visited, OTHER_IDS, !!store(MO.SEEN_KEY));
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
      // were current. But only once the section has actually been REVEALED --
      // a direct #/my-onboarding hash visit before the walk is complete must
      // not spend a badge that was never earned, or the hire loses the NEW
      // indicator (and their UI route back to it) the moment they finish the
      // walk for real.
      if (revealed()) store(MO.SEEN_KEY, true);
      mountMyOnboarding();
      refreshKit();
    }
    syncMyOnboardingNav();
    $$('.view').forEach(function (v) { v.classList.remove('visible'); });
    var el = $('#view-' + sec);
    if (el) el.classList.add('visible');
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.id === sec); });
    if (SECTIONS.some(function (s) { return s.id === sec; })) mnav.value = sec;
    window.scrollTo(0, 0);
    reveal(el);
    if (sec === 'start') countUp();
    if (sec === 'templates') mountTemplates();
    nextNav(el, sec);
    setTimeout(function () { if (typeof updateRail === 'function') updateRail(); }, 60);
  }
  function showClientPage(slug) {
    current = 'clientpage';
    $$('.view').forEach(function (v) { v.classList.remove('visible'); });
    if (window.renderClientPage) window.renderClientPage(slug);
    var el = $('#view-clientpage');
    if (el) el.classList.add('visible');
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.id === 'clients'); });
    mnav.value = 'clients';
    window.scrollTo(0, 0);
    reveal(el);
    setTimeout(function () { if (typeof updateRail === 'function') updateRail(); }, 60);
  }
  function route() {
    var h = (location.hash || '#/start').replace('#/', '');
    if (h.indexOf('client/') === 0) { showClientPage(h.slice(7)); return; }
    show(h);
  }
  window.addEventListener('hashchange', route);

  /* footer link so the hub reads front to back without going via the sidebar */
  function nextNav(root, sec) {
    if (!root) return;
    var old = root.querySelector('.next-nav');
    if (old) old.parentNode.removeChild(old);
    var i = SECTIONS.findIndex(function (s) { return s.id === sec; });
    if (i < 0 || i >= SECTIONS.length - 1) return;
    var nxt = SECTIONS[i + 1];
    /* Resources' "next" is the hire's own section, which must not be announced
       here before the reveal announces it -- a footer link would give away a
       section the sidebar is still hiding. */
    if (nxt.id === MO.SECTION_ID && !revealed()) return;
    var d = document.createElement('div');
    d.className = 'next-nav';
    d.innerHTML = '<a href="#/' + nxt.id + '">Next: ' + esc(nxt.label) + ' →</a>';
    root.appendChild(d);
  }

  /* orange progress rail: the fill tip tracks the active section item, growing through it as you scroll */
  function updateRail() {
    var fill = $('#nav-rail-fill');
    if (!fill) return;
    var active = document.querySelector('#nav a.active');
    if (!active) { fill.style.height = '0'; return; }
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    var frac = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 1;
    var wrap = document.querySelector('.nav-wrap');
    var navTop = document.querySelector('#nav').offsetTop;
    var h = navTop + active.offsetTop + active.offsetHeight * frac;
    fill.style.height = Math.max(6, h) + 'px';
  }
  window.addEventListener('scroll', updateRail, { passive: true });
  window.addEventListener('resize', updateRail);

  /* ---------- motion ---------- */
  function reveal(root) {
    if (!root || reduced) return;
    var kids = Array.prototype.slice.call(root.children);
    kids.forEach(function (k, i) {
      k.classList.add('reveal');
      k.classList.remove('in');
      setTimeout(function () { k.classList.add('in'); }, 40 + i * 90);
    });
  }
  var counted = false;
  function countUp() {
    if (counted && !reduced) return;
    $$('[data-count]').forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      var plus = el.dataset.plus === '1';
      if (reduced) { el.textContent = target + (plus ? '+' : ''); return; }
      var t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 800, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (plus && p === 1 ? '+' : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    counted = true;
  }

  /* ---------- checklist ---------- */
  var chkState = store('carrara_checklist') || {};
  var groupsEl = $('#chk-groups');
  var flat = [];
  CHECKLIST.forEach(function (grp, gi) {
    var g = document.createElement('div');
    g.className = 'chk-group';
    g.innerHTML = '<div class="glabel ' + grp.cls + '">[' + grp.g + ']</div>';
    grp.items.forEach(function (item, ii) {
      var key = 'g' + gi + 'i' + ii;
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
        var linksHtml = '';
        (item.links || []).forEach(function (l) {
          if (pageFor(l.k)) {
            linksHtml += '<a class="textlink" style="margin-right:16px" href="#" data-page="' + esc(l.k) + '">' + esc(l.t) + '</a>';
            return;
          }
          var u = linkFor(l.k);
          if (!u) return;
          var internal = u.charAt(0) === '#';
          linksHtml += '<a class="textlink" style="margin-right:16px" href="' + esc(u) + '"'
            + (internal ? ' onclick="document.getElementById(\'modal-back\').classList.remove(\'show\')"' : ' target="_blank" rel="noopener"')
            + '>' + esc(l.t) + (internal ? '' : ' ↗') + '</a>';
        });
        openModal('<div class="m-eyebrow">[' + grp.g + ']</div><h3>' + esc(item.t) + '</h3><p>' + esc(item.d) + '</p>'
          + (linksHtml ? '<p style="margin-top:14px">' + linksHtml + '</p>' : ''));
      }
      row.querySelector('.box').addEventListener('click', toggle);
      row.querySelector('.box').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      row.querySelector('.txt').addEventListener('click', details);
      row.querySelector('.info').addEventListener('click', details);
      g.appendChild(row);
    });
    groupsEl.appendChild(g);
  });
  function chkCount() { return flat.filter(function (k) { return chkState[k]; }).length; }
  function renderProgress() {
    var done = chkCount(), total = flat.length;
    var pct = Math.round(done / total * 100);
    $('#chk-fill').style.width = pct + '%';
    $('#chk-pct').textContent = pct + '%';
    $('#meta-checklist').textContent = 'checklist: ' + done + '/' + total;
    $('#done-moment').classList.toggle('show', pct === 100);
  }
  $('#chk-reset').addEventListener('click', function () {
    chkState = {}; store('carrara_checklist', chkState);
    $$('.chk-item').forEach(function (r) { r.classList.remove('done'); });
    renderProgress();
  });
  renderProgress();

  /* ---------- team ---------- */
  var teamData = [];
  var myProfile = store('carrara_profile');
  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function cleanTitle(t) {
    if (!t) return '';
    return t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').trim();
  }
  function openMemberModal(m) {
    var p = profileData[m.name];
    var pv = pavilion[m.name] || {};
    var role = pv.role || cleanTitle(m.title);
    var av = m.avatar ? '<img src="' + m.avatar + '" alt="">' : initials(m.name);
    var html = '<div class="m-eyebrow">[the team]</div>'
      + '<div class="member-head"><div class="avatar big">' + av + '</div><div>'
      + '<h3>' + esc(m.name) + '</h3>'
      + (role ? '<div class="rl">' + esc(role) + (m.extra ? ' · ' + esc(m.extra) : '') + '</div>' : (m.extra ? '<div class="rl">' + esc(m.extra) + '</div>' : ''))
      + '</div></div><div class="pg">';
    if (pv.location) html += '<div class="mm-loc">' + esc(pv.location) + (pv.teams && pv.teams.length ? ' · ' + esc(pv.teams.join(', ')) : '') + '</div>';
    /* their own words first, then the researched summary as a fallback */
    if (pv.about) html += '<p>' + esc(pv.about) + '</p>';
    else if (p && p.summary) html += '<p>' + esc(p.summary) + '</p>';
    if (pv.values) {
      html += '<div class="wk-sec"><div class="wk-lbl">[core values]</div><p>' + esc(pv.values) + '</p></div>';
    }
    if (pv.clients && pv.clients.length) {
      /* logo above, company name below: a name alone makes you read, a logo
         alone makes you guess. Falls back to the initial when we have no domain. */
      html += '<div class="wk-sec"><div class="wk-lbl">[clients]</div><div class="cl-grid">'
        + pv.clients.map(function (cn) {
            var c = clientData.filter(function (x) { return x.name === cn; })[0];
            var mark = c && c.domain
              ? '<img src="' + favicon(c.domain, 64) + '" alt="" loading="lazy">'
              : '<span class="cl-init">' + esc(cn.charAt(0)) + '</span>';
            return '<div class="cl-cell"><div class="cl-mark">' + mark + '</div>'
              + '<div class="cl-name">' + esc(cn) + '</div></div>';
          }).join('') + '</div></div>';
    }
    /* People Pavilion answers, question above each one so the card reads on its own */
    if (pv.answers && pv.answers.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">[in their own words]</div>'
        + pv.answers.map(function (a) {
            return '<div class="qa"><div class="q">' + esc(a.q) + '</div>'
              + '<ul>' + (a.a || []).map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') + '</ul></div>';
          }).join('') + '</div>';
    }
    if (p && p.prior && p.prior.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">[before carrara]</div><ul>'
        + p.prior.map(function (x) {
            return '<li>' + (x.role ? '<b>' + esc(x.role) + '</b>, ' + esc(x.company) : '<b>' + esc(x.company) + '</b>') + '</li>';
          }).join('') + '</ul></div>';
    }
    var linksH = [];
    if (m.email) linksH.push('<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>');
    var li = pv.linkedin || (p && p.linkedin);
    if (li) linksH.push('<a href="' + esc(/^https?:/.test(li) ? li : 'https://' + li) + '" target="_blank" rel="noopener">LinkedIn ↗</a>');
    if (linksH.length) html += '<div class="wk-sec"><div class="wk-lbl">[reach them]</div><div class="wk-links">' + linksH.join('') + '</div></div>';
    html += '</div>';
    if (!pv.answers || !pv.answers.length) {
      html += '<p class="pg-note">They have not filled in their People Pavilion answers yet.</p>';
    }
    openModal(html);
  }
  var teamFilter = { team: '', client: '', loc: '' };
  /* options come from the data, not a hardcoded list, so a new team or location
     in Notion shows up in the dropdown on the next refresh without a code change */
  function populateFilters() {
    var teams = {}, clients = {}, locs = {};
    Object.keys(pavilion).forEach(function (n) {
      var x = pavilion[n];
      (x.teams || []).forEach(function (t) { teams[t] = 1; });
      (x.clients || []).forEach(function (c) { clients[c] = 1; });
      if (x.location) locs[x.location] = 1;
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
    fill('#f-team', teams, 'All teams');
    fill('#f-client', clients, 'All clients');
    fill('#f-loc', locs, 'Anywhere');
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
    var clear = $('#f-clear');
    if (clear) clear.addEventListener('click', function () {
      teamFilter = { team: '', client: '', loc: '' };
      ['#f-team', '#f-client', '#f-loc'].forEach(function (x) { if ($(x)) $(x).value = ''; });
      renderTeam($('#team-search').value);
    });
  }

  /* Every hero number is derived, never typed. Partners come from the partner
     flag in people.json, team members from the rendered roster, and companies
     served counts current plus archived so the number only ever goes up. */
  function setStat(sel, n, plus) {
    var el = $(sel);
    if (!el) return;
    el.dataset.count = n;
    if (el.textContent !== '0') el.textContent = n + (plus ? '+' : '');
  }
  function refreshStats() {
    if (teamData.length) {
      var partners = teamData.filter(function (m) {
        var pv = pavilion[m.name];
        return pv && pv.partner;
      }).length;
      if (partners) setStat('#stat-partners', partners, false);
      setStat('#stat-team', teamData.length, false);
      var factEl = $('#fact-team');
      if (factEl) factEl.textContent = teamData.length + '';
      var factP = $('#fact-partners');
      if (factP && partners) factP.textContent = partners + '';
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
        clients: myProfile.client ? [myProfile.client] : [],
        about: myProfile.background || '', values: myProfile.values || '',
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
      if (teamFilter.team && (pv.teams || []).indexOf(teamFilter.team) === -1) return false;
      if (teamFilter.client && (pv.clients || []).indexOf(teamFilter.client) === -1) return false;
      if (teamFilter.loc && pv.location !== teamFilter.loc) return false;
      var hay = [m.name, m.title || '', m.email || '', pv.role || '', pv.location || '',
        (pv.teams || []).join(' '), (pv.clients || []).join(' ')].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    });
    shown.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'member';
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      var av = m.avatar ? '<img src="' + m.avatar + '" alt="" loading="lazy">' : initials(m.name);
      var pv = pavilion[m.name] || {};
      var role = pv.role || cleanTitle(m.title);
      var logos = (pv.clients || []).slice(0, 5).map(function (cn) {
        var c = clientData.filter(function (x) { return x.name === cn; })[0];
        return c && c.domain
          ? '<img class="cl-dot" src="' + favicon(c.domain, 32) + '" alt="' + esc(cn) + '" title="' + esc(cn) + '" loading="lazy">'
          : '<span class="cl-dot txt" title="' + esc(cn) + '">' + esc(cn.charAt(0)) + '</span>';
      }).join('');
      d.innerHTML = '<div class="avatar">' + av + '</div><div class="info">'
        + '<div class="nm">' + esc(m.name) + (m.isNew ? ' <span class="newtag">[new]</span>' : '') + '</div>'
        + (role ? '<div class="rl-sm">' + esc(role) + '</div>' : '')
        + (pv.location ? '<div class="loc-sm">' + esc(pv.location) + '</div>' : '')
        + (logos ? '<div class="cl-row">' + logos + '</div>' : '')
        + '</div>';
      d.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        openMemberModal(m);
      });
      d.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); openMemberModal(m); }
      });
      grid.appendChild(d);
    });
    $('#team-count').textContent = shown.length + ' people';
    var anyFilter = !!(teamFilter.team || teamFilter.client || teamFilter.loc);
    if ($('#f-clear')) $('#f-clear').hidden = !anyFilter;
  }
  $('#team-search').addEventListener('input', function (e) { renderTeam(e.target.value); });
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
      teamData = data.members || [];
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
      if (data.source === 'slack') {
        $('#team-note').textContent = 'Live from the #f-company-ops-general Slack channel, refreshed every two weeks. Photos and roles come from Slack profiles: set yours and it shows here.';
      }
    })
    .catch(function () { $('#team-note').textContent = 'Team list is unavailable right now.'; });

  /* profile form */
  /* The People Pavilion question set, verbatim. Kept here as data so the form,
     the team card and any future survey all read from one list. */
  var PAVILION_Q = [
    { group: 'about you', qs: [
      ['honest', 'What are some honest, unfiltered things about you?'],
      ['nuts', 'What drives you nuts?'],
      ['quirks', 'What are your quirks?'],
      ['goldstar', 'How can people earn an extra gold star with you?'],
      ['qualities', 'What qualities do you particularly value in people who work with you?'],
      ['misunderstand', 'What are some things that people might misunderstand about you that you should clarify?']
    ]},
    { group: 'how you work with others', qs: [
      ['coach', 'How do you coach people to do their best work and develop their talents?'],
      ['communicate', "What's the best way to communicate with you?"],
      ['convince', "What's the best way to convince you to do something?"],
      ['givefb', 'How do you like to give feedback?'],
      ['getfb', 'How do you like to get feedback?']
    ]}
  ];
  var TEAM_OPTIONS = ['Managed Services / BizOps', 'Talent Acquisition', 'Talent Management',
    'Strategic Finance', 'Internal Operations'];

  $('#btn-profile').addEventListener('click', function () {
    var p = myProfile || {};
    var a = p.answers || {};
    function opts(list, sel) {
      return '<option value="">Select one</option>' + list.map(function (v) {
        return '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(v) + '</option>';
      }).join('');
    }
    var clientNames = clientData.map(function (c) { return c.name; }).sort();
    var qHtml = PAVILION_Q.map(function (g) {
      return '<div class="pf-group">' + esc(g.group) + '</div>'
        + g.qs.map(function (q) {
            return '<label>' + esc(q[1]) + '</label>'
              + '<textarea id="pf-q-' + q[0] + '" rows="2">' + esc(a[q[0]] || '') + '</textarea>';
          }).join('');
    }).join('');

    openModal(
      '<div class="m-eyebrow">[your profile]</div><h3>Add yourself to the wall</h3>'
      + '<p class="m-note" style="margin:0 0 18px">This replaces the People Pavilion. Everything here shows on your card, so other people can work out how to work with you.</p>'
      + '<div class="pf-group">the basics</div>'
      + '<label>Name</label><input id="pf-name" value="' + esc(p.name || '') + '">'
      + '<label>Team</label><select id="pf-team">' + opts(TEAM_OPTIONS, p.team) + '</select>'
      + '<label>Email</label><input id="pf-email" type="email" placeholder="you@carrara.is" value="' + esc(p.email || '') + '">'
      + '<label>LinkedIn</label><input id="pf-li" placeholder="https://linkedin.com/in/…" value="' + esc(p.linkedin || '') + '">'
      + '<label>Where you are based</label><input id="pf-loc" placeholder="City, country" value="' + esc(p.location || '') + '">'
      + '<label>Phone number <span class="pf-opt">optional</span></label><input id="pf-phone" value="' + esc(p.phone || '') + '">'
      + '<label>Start date</label><input id="pf-start" type="date" value="' + esc(p.startDate || '') + '">'
      + '<label>Photo</label><input id="pf-photo" type="file" accept="image/*">'
      + '<div class="pf-hint" id="pf-photo-hint">' + (p.photo ? 'A photo is saved. Choose a new file to replace it.' : 'A real photo of your face. It stays in your browser until you save.') + '</div>'
      + '<label>Client you are working on</label><select id="pf-client">' + opts(clientNames, p.client) + '</select>'
      + '<div class="pf-group">in your own words</div>'
      + '<label>My quick background</label><textarea id="pf-bg" rows="3">' + esc(p.background || '') + '</textarea>'
      + '<label>These are my core values</label><textarea id="pf-values" rows="3">' + esc(p.values || '') + '</textarea>'
      + qHtml
      + '<div class="m-actions"><button class="btn-primary" id="pf-save">Add me to the wall</button></div>'
      + '<p class="m-note">Your intro is shared with the team so they can give you a proper welcome.</p>'
    );

    /* the photo is read to a data URL so the card can show it with no upload
       endpoint. Capped so a 12MP phone photo cannot blow out localStorage. */
    var photoData = p.photo || '';
    $('#pf-photo').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) {
        $('#pf-photo-hint').textContent = 'That file is over 3MB. Pick a smaller one.';
        return;
      }
      var fr = new FileReader();
      fr.onload = function () { photoData = fr.result; $('#pf-photo-hint').textContent = 'Photo ready: ' + f.name; };
      fr.readAsDataURL(f);
    });

    $('#pf-save').addEventListener('click', function () {
      var answers = {};
      PAVILION_Q.forEach(function (g) {
        g.qs.forEach(function (q) {
          var v = $('#pf-q-' + q[0]).value.trim();
          if (v) answers[q[0]] = v;
        });
      });
      var prof = {
        name: $('#pf-name').value.trim(),
        team: $('#pf-team').value,
        email: $('#pf-email').value.trim(),
        linkedin: $('#pf-li').value.trim(),
        location: $('#pf-loc').value.trim(),
        phone: $('#pf-phone').value.trim(),
        startDate: $('#pf-start').value,
        client: $('#pf-client').value,
        photo: photoData,
        background: $('#pf-bg').value.trim(),
        values: $('#pf-values').value.trim(),
        answers: answers
      };
      if (!prof.name) { $('#pf-name').focus(); return; }
      myProfile = prof; store('carrara_profile', prof);
      /* the photo is big and only matters in this browser, so it never leaves */
      var forSlack = {};
      Object.keys(prof).forEach(function (k) { if (k !== 'photo') forSlack[k] = prof[k]; });
      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(forSlack) }).catch(function () {});
      renderTeam($('#team-search').value);
      closeModal();
    });
  });

  /* ---------- welcome kit -> hub personalization ---------- */
  var kitData = null;
  function applyKitToHub() {
    if (!kitData) return;
    var brief = $('#brief-desc');
    if (brief && kitData.client) {
      brief.innerHTML = 'Your first client is <b>' + esc(kitData.client.name) + '</b>'
        + (kitData.client.lead ? ', led by ' + esc(kitData.client.lead.replace(/\.+$/, '')) + '.' : '.')
        + (kitData.manager && kitData.manager.name ? ' Your manager is ' + esc(kitData.manager.name) + '.' : '')
        /* The popup no longer holds any of this, so it is no longer where this
           line sends people: before the reveal there is nowhere to send them
           yet, and after it there is exactly one place. */
        + (revealed()
            ? ' <a class="textlink" href="#/' + MO.SECTION_ID + '">My onboarding</a> has who to meet and your first 90 days.'
            : ' Work your way through the hub: a section made just for you appears at the end.');
    }
    if (kitData.client) {
      $$('#client-grid .client-row').forEach(function (row) {
        var nm = row.querySelector('.cn');
        if (nm && nm.textContent === kitData.client.name && !row.querySelector('.mine-tag')) {
          row.classList.add('mine');
          nm.insertAdjacentHTML('beforeend', '<span class="mine-tag">your first client</span>');
        }
      });
    }
  }

  /* The hire's own section, rendered from whatever kit we currently hold --
     including none, which renders the "enter your access code" state. */
  function mountMyOnboarding() {
    var el = $('#view-' + MO.SECTION_ID);
    if (!el) return;
    el.innerHTML = MO.renderSection(kitData);
    var reset = el.querySelector('#mo-reset');
    if (reset) reset.addEventListener('click', function () { window.dispatchEvent(new Event('carrara:kit-reset')); });
  }

  /* The saved kit is a FALLBACK for an offline or failed refresh, never the
     source of truth: the manager can still be editing the plan, the client's
     lead can change, and the plan itself lives in POps. One refresh in flight
     at a time -- a hire clicking between sections must not queue five. */
  var kitRefreshing = false;
  // A plan is either not there at all (null) or there with every field blank
  // (POps answers the shape but the manager hasn't written anything yet) --
  // both read as "nothing to show" and both are the SAME "empty" a refetch
  // must never let overwrite real content.
  function planIsEmpty(plan) {
    return !plan || !Object.keys(plan).some(function (k) { return plan[k]; });
  }
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
        if (planIsEmpty(j.plan) && !planIsEmpty(stored.plan)) {
          j.plan = stored.plan;
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

  /* ---------- clients ---------- */
  var codexData = { clients: {} };
  function clientSlug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  window.renderClientPage = function (slug) {
    var el = $('#view-clientpage');
    if (!el) return;
    var c = clientData.filter(function (x) { return clientSlug(x.name) === slug; })[0];
    if (!c) {
      el.innerHTML = '<div class="client-page"><a class="textlink" href="#/clients">← All clients</a>'
        + '<p class="body-copy" style="margin-top:24px">' + (clientData.length ? 'No client with that address.' : 'Loading…') + '</p></div>';
      return;
    }
    var cx = (codexData.clients || {})[c.name] || {};
    var types = (cx.projectTypes && cx.projectTypes.length) ? cx.projectTypes : (c.work || []);
    var logo = c.domain
      ? '<img src="' + favicon(c.domain, 128) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
      : esc(c.name.charAt(0));
    var html = '<div class="client-page"><a class="textlink" href="#/clients">← All clients</a>'
      + '<div class="cp-head"><div class="clogo cp-logo">' + logo + '</div><div>'
      + '<h1 class="cp-name">' + esc(c.name)
      + (cx.status ? ' <span class="cstatus' + (cx.status === 'Active' ? ' on' : '') + '">' + esc(cx.status.toLowerCase()) + '</span>' : '')
      + '</h1>'
      + (types.length ? '<div class="wk-tags">' + types.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '')
      + '</div></div>';
    var about = cx.about || c.description || '';
    if (about) html += '<p class="body-copy cp-about">' + esc(about) + '</p>';
    var ov = cx.overview || {};
    var facts = [
      ['Location', ov.location], ['Founded', ov.founded], ['Stage', ov.stage],
      ['Team', ov.teamSize], ['Key people', ov.leaders], ['Revenue model', ov.howTheyMakeMoney]
    ].filter(function (f) { return f[1]; });
    if (facts.length || cx.background) {
      html += '<div class="wk-sec"><div class="wk-lbl">[the company]</div>';
      if (facts.length) html += '<ul>' + facts.map(function (f) { return '<li><b>' + esc(f[0]) + '</b>: ' + esc(f[1]) + '</li>'; }).join('') + '</ul>';
      if (cx.background) html += '<p class="cp-bg">' + esc(cx.background) + '</p>';
      html += '</div>';
    }
    var lowerTypes = types.map(function (t) { return t.toLowerCase(); });
    var streams = (c.work || []).filter(function (w) { return lowerTypes.indexOf(w.toLowerCase()) === -1; });
    if ((cx.engagement && cx.engagement.length) || streams.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">[what we do for them]</div><ul>'
        + (cx.engagement || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('')
        + (streams.length ? '<li><b>Active workstreams</b>: ' + streams.map(esc).join(', ') + '</li>' : '')
        + '</ul></div>';
    }
    var team = [];
    if (c.lead) team.push(['Engagement lead', [c.lead]]);
    if (cx.accountManagers && cx.accountManagers.length) team.push(['Account manager' + (cx.accountManagers.length > 1 ? 's' : ''), cx.accountManagers]);
    if (cx.talentPartners && cx.talentPartners.length) team.push(['Talent partner' + (cx.talentPartners.length > 1 ? 's' : ''), cx.talentPartners]);
    if (cx.coordination && cx.coordination.length) team.push(['Coordination support', cx.coordination]);
    if (team.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">[who runs it at carrara]</div><ul>'
        + team.map(function (t) { return '<li><b>' + esc(t[0]) + '</b>: ' + esc(t[1].join(', ')) + '</li>'; }).join('') + '</ul></div>';
    }
    var linksH = [];
    if (c.domain) linksH.push('<a href="https://' + esc(c.domain) + '" target="_blank" rel="noopener">' + esc(c.domain) + ' ↗</a>');
    (cx.docs || []).forEach(function (d2) {
      linksH.push('<a href="' + esc(d2.url) + '" target="_blank" rel="noopener">' + esc(d2.label) + ' ↗</a>');
    });
    if (linksH.length) html += '<div class="wk-sec"><div class="wk-lbl">[links and docs]</div><div class="wk-links">' + linksH.join('') + '</div></div>';
    html += '</div>';
    el.innerHTML = html;
  };
  /* live from Notion via /api/clients when NOTION_TOKEN is set; bundled snapshots otherwise */
  (window.__CLIENTS__ ? Promise.resolve({ clients: window.__CLIENTS__.clients, codex: null, updated: window.__CLIENTS__.updated })
    : fetch('/api/clients').then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { return { clients: d.clients, codex: { clients: d.codex }, updated: d.updated, source: d.source }; })
        .catch(function () {
          return Promise.all([
            fetch('/clients.json').then(function (r) { return r.json(); }),
            fetch('/codex.json').then(function (r) { return r.json(); }).catch(function () { return { clients: {} }; })
          ]).then(function (both) { return { clients: both[0].clients, codex: both[1], updated: both[0].updated, source: 'snapshot' }; });
        })
  ).then(function (data) {
    codexData = data.codex || { clients: {} };
    if (!data.codex) {
      fetch('/codex.json').then(function (r) { return r.json(); }).then(function (d) { codexData = d; }).catch(function () {});
    }
    var grid = $('#client-grid');
    var archGrid = $('#client-grid-archived');
    clientData = data.clients || [];
    /* tags are the business lines from the Client Codex, not the per-project
       workstream names. Kenna's call: a new joiner should see "Marketing/Growth",
       not "Paid Media". Fall back to the workstreams only when Notion has nothing. */
    /* the nine business lines live in tags.js so this page and the weekly
       refresh job can never disagree about what a client is */
    function tagsFor(c) {
      return window.TAGS
        ? window.TAGS.forClient((codexData.clients || {})[c.name], c.work)
        : (c.work || []);
    }
    /* current means the Codex's "Active Clients" view: Status is exactly Active.
       Paused, Archived and blank all belong in the past-engagements list. */
    function isActive(c) {
      var cx = (codexData.clients || {})[c.name] || {};
      return cx.status === 'Active';
    }
    function row(c) {
      var d = document.createElement('div');
      d.className = 'client-row';
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      var logo = c.domain
        ? '<img src="' + favicon(c.domain, 64) + '" alt="" loading="lazy" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
        : esc(c.name.charAt(0));
      var tags = tagsFor(c);
      d.innerHTML = '<div class="clogo">' + logo + '</div><div><div class="cn">' + esc(c.name) + '</div>'
        + (c.lead ? '<div class="lead">lead: ' + esc(c.lead) + '</div>' : '')
        + (c.description ? '<div class="cdesc">' + esc(c.description) + '</div>' : '')
        + (tags.length ? '<div class="client-tags">' + tags.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '')
        + '</div>';
      d.addEventListener('click', function () { location.hash = '#/client/' + clientSlug(c.name); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = '#/client/' + clientSlug(c.name); } });
      return d;
    }
    var current = clientData.filter(isActive);
    var archived = clientData.filter(function (c) { return !isActive(c); });
    current.forEach(function (c) { grid.appendChild(row(c)); });
    if (archGrid) {
      archived.forEach(function (c) { archGrid.appendChild(row(c)); });
      var wrap = $('#archived-wrap');
      if (wrap) wrap.hidden = archived.length === 0;
      var cnt = $('#archived-count');
      if (cnt) cnt.textContent = archived.length + (archived.length === 1 ? ' company' : ' companies');
    }
    $('#client-note').textContent = (data.source === 'notion'
      ? 'Live from the Client Codex in Notion, refreshed hourly. Last update: '
      : 'Sourced from the Client Codex. Last update: ')
      + (data.updated || '') + '. Click a client for its full page.';
    refreshStats();
    applyKitToHub();
    /* deep links to a client page arriving before data loaded */
    if (location.hash.indexOf('#/client/') === 0 && window.renderClientPage) window.renderClientPage(location.hash.slice(9));
  });
  var clientData = [];

  /* ---------- slack channels ---------- */
  (function () {
    var grid = $('#channel-grid');
    if (!grid) return;
    CHANNELS.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'flat-row ch-row';
      var u = window.channelUrl ? window.channelUrl(c.n) : '';
      var nameHtml = u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(c.n) + '</a>' : esc(c.n);
      d.innerHTML = '<b>' + nameHtml + '</b><span class="d">: ' + esc(c.d) + '</span>'
        + '<div class="hovercard"><div class="hlbl">[what gets posted here]</div><ul>'
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
        + '<div class="ta"><a href="' + t.url + '" target="_blank" rel="noopener">Get it</a></div>';
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
        var wrap = document.createElement('div');
        wrap.className = 'tpl';
        wrap.innerHTML = '<div class="tpl-head"><span class="tn">Branding folder</span><span class="tt">drive</span>'
          + '<span class="acts"><a href="https://drive.google.com/drive/folders/' + BRAND_FOLDER + '" target="_blank" rel="noopener">Open in Drive</a></span></div>'
          + '<div class="tpl-frame" style="height:500px"><iframe loading="lazy" src="https://drive.google.com/embeddedfolderview?id=' + BRAND_FOLDER + '#list" title="Branding folder"></iframe></div>';
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
      if (saved && saved.data && MO.navState(visited, OTHER_IDS, true) !== 'hidden') {
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
      var hasSection = MO.navState(visited, OTHER_IDS, true) !== 'hidden';
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
        pillLabel.textContent = (MO.navState(visited, OTHER_IDS, true) !== 'hidden' ? 'Your onboarding, ' : 'Your welcome kit, ') + saved.data.firstName;
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
      /* the same reveal the sidebar honours: a hidden section is not findable */
      SECTIONS.forEach(function (s) {
        if (s.id === MO.SECTION_ID && !revealed()) return;
        ix.push({ label: s.label, hint: 'section', go: function () { location.hash = '#/' + s.id; } });
      });
      CHECKLIST.forEach(function (g) { g.items.forEach(function (it) {
        ix.push({ label: it.t, hint: 'checklist · ' + g.g, go: function () { location.hash = '#/checklist'; } });
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
      [['Home Base', 'notionHomeBase'], ['The Quarry', 'quarry'], ['Brand Vault', 'brandVault'], ['Team Roundup', 'teamRoundup'],
       ['Time-off policy', 'timeOffPolicy'], ['Brand palette & typography', 'brandVaultArchive'], ['This is Carrara', 'thisIsCarrara'],
       ['Coordinator OOO template', 'coordinatorOOO'], ['Weekly Talent Jam', 'talentTeamMeeting'], ['Ashby', 'ashby'],
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
