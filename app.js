/* Carrara Onboarding Hub */
(function () {
  'use strict';

  var SECTIONS = [
    { id: 'start',     label: 'Start here' },
    { id: 'who',       label: 'Who we are' },
    { id: 'how',       label: 'How we work' },
    { id: 'week',      label: 'Your first week' },
    { id: 'team',      label: 'The team' },
    { id: 'slack',     label: 'Slack' },
    { id: 'sessions',  label: 'Sessions' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'business',  label: 'The business' },
    { id: 'clients',   label: 'Clients' },
    { id: 'tools',     label: 'Tools' },
    { id: 'templates', label: 'Templates and brand' },
    { id: 'timeoff',   label: 'Time off' },
    { id: 'resources', label: 'Resources' }
  ];
  var TOTAL = SECTIONS.length;
  /* the guided tour skips Start here so the first click takes you somewhere new */
  var TOUR = SECTIONS.slice(1);
  var TOUR_TOTAL = TOUR.length;
  var NEW_HIRES_URL = 'https://carrarais.slack.com/archives/C0BK7NG1PMM';

  var CHANNELS = [
    { n: '#new-hires', d: 'intro threads and week one briefs for every new joiner.', ex: ['New joiner intros: name, location, first client', 'Week one briefs posted by managers'] },
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

  var CHECKLIST = [
    { g: 'day one', cls: '', items: [
      { t: 'Set up your Slack workspace', d: 'Join carrarais.slack.com. Set your photo, title and timezone: the team page pulls from your Slack profile. Then read the Slack section of this hub so the channel prefixes make sense.' },
      { t: 'Ensure tool and system access', d: 'Confirm you can open Google, Notion, Slack and the tools for your role. Anything blocked, ping Eric on Slack.' },
      { t: 'Payroll setup (Deel, Bill.com, or Ramp)', d: 'Deel for full-time employees, Bill.com for US contractors, Ramp for international contractors. You will get an invite for the one that applies to you.' },
      { t: 'Set up email signature and Slack profile', d: 'Use the Carrara signature format from the brand templates, and fill out your Slack profile completely.' },
      { t: 'Day 1 manager 1:1', d: 'Your first 1:1: align on your 90-day plan, week one priorities, and how you will work together.' },
      { t: 'Submit your Top 5', d: 'Share your Top 5 with the team so everyone knows how you work best. Your manager will point you to the form.' },
      { t: 'Look through open roles', d: 'Browse the roles we are currently hiring for across clients. It is the fastest way to understand what the talent side of the business actually does.' }
    ]},
    { g: 'week one', cls: 'blue', items: [
      { t: 'Attend the tool tips session', d: 'A live walkthrough of the tools the team runs on, with tips from people who use them daily.' },
      { t: 'Set up a recurring 1:1 with your manager', d: 'Get a weekly slot on the calendar before the week ends.' },
      { t: "Confirm you're added to all team calls", d: 'Standing team meetings, the monthly Team Roundup, and any client syncs relevant to your role.' },
      { t: 'Get oriented on our Notion', d: 'Start at Home Base and click around. The good-places-to-start list is linked from your Notion onboarding page.' },
      { t: 'Review the PTO policy', d: 'Read the Time off section of this hub, then the full policy on Notion. Two minutes now saves confusion later.', link: '#/timeoff' },
      { t: 'Set up time tracking', d: 'Set up time tracking following your team lead’s instructions for your role and client.' },
      { t: 'Explore and fill out the People Pavilion', d: 'The team directory in Notion. Fill in your entry so people can get to know you.' }
    ]},
    { g: 'week two', cls: '', items: [
      { t: 'Meet with teammates', d: 'Grab meet and greet 1:1s with the people you will work with most.' },
      { t: 'Read the company operating principles', d: 'The Ways of Working page in Notion: what the four principles look like in practice.' },
      { t: 'Read the company context docs', d: 'Company history, direction, and how we engage clients. Linked from Home Base.' },
      { t: 'Read tips on people and management', d: 'A short Notion read on how we think about people, feedback and management.' },
      { t: 'Review the Carrara Brand Vault', d: 'Brand story, messaging and visual identity. Everything you make should feel like Carrara.' },
      { t: 'Talent team only: get oriented on Ashby', d: 'Our ATS. Ask in #g-ashby-support if you get stuck.' }
    ]}
  ];

  var TOOLS = [
    { n: 'Claude', dmn: 'claude.ai', url: 'https://claude.ai', d: 'Our go-to AI. Deep research, client deliverables, coding, MCP workflows. The Quarry is built on it.', tag: '' },
    { n: 'Granola', dmn: 'granola.ai', url: 'https://granola.ai', d: 'AI meeting notes so you stay present. We run it on every client call.', tag: 'carrara provided' },
    { n: 'Loom', dmn: 'loom.com', url: 'https://loom.com', d: 'Async walkthroughs and client handoffs instead of another meeting.', tag: 'carrara provided' },
    { n: 'Reclaim', dmn: 'reclaim.ai', url: 'https://reclaim.ai', d: 'Merges calendars across the multiple client accounts you will juggle.', tag: 'carrara provided' },
    { n: 'ChatGPT', dmn: 'chatgpt.com', url: 'https://chat.openai.com', d: 'Everyday copilot for quick brainstorms and rewrites.', tag: '' },
    { n: 'Whisper Flow', dmn: 'whisperflow.com', url: 'https://whisperflow.com', d: 'Voice keyboard. Dictate Slack messages and notes while juggling threads.', tag: '' },
    { n: 'CleanShot', dmn: 'cleanshot.com', url: 'https://cleanshot.com', d: 'Screenshots, GIFs, scrolling capture. Our default for async documentation.', tag: '' },
    { n: 'Paste', dmn: 'pasteapp.io', url: 'https://pasteapp.io', d: 'Infinite clipboard history. You will copy a lot between clients.', tag: '' },
    { n: 'Zapier', dmn: 'zapier.com', url: 'https://zapier.com', d: 'Automations between tools. Kill the repetitive stuff.', tag: '' }
  ];

  var CORE_TEMPLATES = [
    { name: 'Base doc', type: 'doc', id: '12m40X2CCW2d-sLEwVbCAXvGulfDPzng4wCGzWUPkZBs', kind: 'document' },
    { name: 'Memo', type: 'doc', id: '1Ah-no2QSKuhgJSEU26-zwB0PLl-EXgcV4vRE-bpi-AM', kind: 'document' },
    { name: 'Deck', type: 'deck', id: '12BrVVJrFzqdXM3_RvTBI2oJrVFmqnlK-TqVi53Kg_Eo', kind: 'presentation' },
    { name: 'Sheets', type: 'sheet', id: '1Az9Bdv8E9CrGxKoyLRFzGHoQ1ETDL45V1gdjZVjXwBk', kind: 'spreadsheets' },
    { name: 'Weekly sync agenda', type: 'doc', id: '1fsD8N-7-i3XSNtV-RrNzEnTyZyCzOYghIbulRz6jIDc', kind: 'document' },
    { name: 'Retrospective', type: 'doc', id: '1HrcW0cfglGwjKQ_YTtvXJyWE4cKuDUpUNOXjLAwoEpA', kind: 'document' },
    { name: 'Weekly hiring report', type: 'doc', id: '1RTy89hMeGi56JgcCJLabv8n35nlzHSU5skknu28GcMA', kind: 'document' },
    { name: 'Graph with brand colors', type: 'sheet', id: '1tYiJNUJE9SQembM-e-okfplldhwRJ-LO2JJ_AfSk8YM', kind: 'spreadsheets' }
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
    a.innerHTML = '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>' + s.label;
    nav.appendChild(a);
    var o = document.createElement('option');
    o.value = s.id; o.textContent = String(i + 1).padStart(2, '0') + '  ' + s.label;
    mnav.appendChild(o);
  });
  mnav.addEventListener('change', function () { location.hash = '#/' + mnav.value; });

  /* ---------- router ---------- */
  var current = null;
  function show(id) {
    var sec = SECTIONS.some(function (s) { return s.id === id; }) || id === 'complete' ? id : 'start';
    current = sec;
    $$('.view').forEach(function (v) { v.classList.remove('visible'); });
    var el = $('#view-' + sec);
    if (el) el.classList.add('visible');
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.id === sec); });
    if (SECTIONS.some(function (s) { return s.id === sec; })) mnav.value = sec;
    window.scrollTo(0, 0);
    reveal(el);
    if (sec === 'start') countUp();
    if (sec === 'templates') mountTemplates();
    syncTourChrome();
    setTimeout(function () { if (typeof updateRail === 'function') updateRail(); }, 60);
  }
  function route() { show((location.hash || '#/start').replace('#/', '')); }
  window.addEventListener('hashchange', route);

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
        openModal('<div class="m-eyebrow">[' + grp.g + ']</div><h3>' + esc(item.t) + '</h3><p>' + esc(item.d) + '</p>'
          + (item.link ? '<p style="margin-top:12px"><a class="textlink" href="' + item.link + '" onclick="document.getElementById(\'modal-back\').classList.remove(\'show\')">Read it here</a></p>' : ''));
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
  function renderTeam(filter) {
    var grid = $('#team-grid');
    grid.innerHTML = '';
    var q = (filter || '').toLowerCase();
    var list = teamData.slice();
    if (myProfile && !list.some(function (m) { return m.email === myProfile.email; })) {
      list.unshift({ name: myProfile.name, title: myProfile.work, email: '', avatar: '', isNew: true, extra: myProfile.location });
    }
    var shown = list.filter(function (m) {
      return !q || m.name.toLowerCase().indexOf(q) >= 0 || (m.title || '').toLowerCase().indexOf(q) >= 0 || (m.email || '').toLowerCase().indexOf(q) >= 0;
    });
    shown.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'member';
      var av = m.avatar ? '<img src="' + m.avatar + '" alt="" loading="lazy">' : initials(m.name);
      var role = cleanTitle(m.title);
      d.innerHTML = '<div class="avatar">' + av + '</div><div class="info">'
        + '<div class="nm">' + esc(m.name) + (m.isNew ? ' <span class="newtag">[new]</span>' : '') + '</div>'
        + (role ? '<div class="rl">' + esc(role) + (m.extra ? ' · ' + esc(m.extra) : '') + '</div>' : (m.extra ? '<div class="rl">' + esc(m.extra) + '</div>' : ''))
        + (m.email ? '<div class="em"><a href="mailto:' + m.email + '">' + m.email + '</a></div>' : '')
        + '</div>';
      grid.appendChild(d);
    });
    $('#team-count').textContent = shown.length + ' people';
  }
  $('#team-search').addEventListener('input', function (e) { renderTeam(e.target.value); });
  (window.__TEAM__ ? Promise.resolve(window.__TEAM__) : fetch('/api/team').then(function (r) { if (!r.ok) throw 0; return r.json(); }))
    .catch(function () { return fetch('/team.json').then(function (r) { return r.json(); }); })
    .then(function (data) {
      teamData = data.members || [];
      renderTeam('');
      if (data.source === 'slack') {
        $('#team-note').textContent = 'Live from the #g-announcements Slack channel. Photos and roles come from Slack profiles: set yours and it shows here.';
      }
    })
    .catch(function () { $('#team-note').textContent = 'Team list is unavailable right now.'; });

  /* profile form */
  $('#btn-profile').addEventListener('click', function () {
    var p = myProfile || {};
    openModal(
      '<div class="m-eyebrow">[your profile]</div><h3>Add yourself to the wall</h3>'
      + '<label>Name</label><input id="pf-name" value="' + esc(p.name || '') + '">'
      + '<label>Location</label><input id="pf-loc" placeholder="City, country" value="' + esc(p.location || '') + '">'
      + '<label>A fun fact about you</label><textarea id="pf-fact" rows="2">' + esc(p.fact || '') + '</textarea>'
      + '<label>What you’ll be working on at Carrara</label><input id="pf-work" placeholder="e.g. Talent Partner, Modal + Hinge" value="' + esc(p.work || '') + '">'
      + '<div class="m-actions"><button class="btn-primary" id="pf-save">Post to #new-hires</button></div>'
      + '<p class="m-note">Your intro is copied to your clipboard and #new-hires opens: paste it there so the team can welcome you.</p>'
    );
    $('#pf-save').addEventListener('click', function () {
      var prof = {
        name: $('#pf-name').value.trim(),
        location: $('#pf-loc').value.trim(),
        fact: $('#pf-fact').value.trim(),
        work: $('#pf-work').value.trim()
      };
      if (!prof.name) { $('#pf-name').focus(); return; }
      myProfile = prof; store('carrara_profile', prof);
      var msg = 'New joiner: ' + prof.name
        + (prof.location ? '\nLocation: ' + prof.location : '')
        + (prof.work ? '\nWorking on: ' + prof.work : '')
        + (prof.fact ? '\nFun fact: ' + prof.fact : '');
      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prof) }).catch(function () {});
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(function () {});
      renderTeam($('#team-search').value);
      closeModal();
      window.open(NEW_HIRES_URL, '_blank');
    });
  });

  /* ---------- clients ---------- */
  (window.__CLIENTS__ ? Promise.resolve(window.__CLIENTS__) : fetch('/clients.json').then(function (r) { return r.json(); })).then(function (data) {
    var grid = $('#client-grid');
    (data.clients || []).forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'client-row';
      var logo = c.domain
        ? '<img src="' + favicon(c.domain, 64) + '" alt="" loading="lazy" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
        : esc(c.name.charAt(0));
      d.innerHTML = '<div class="clogo">' + logo + '</div><div><div class="cn">' + esc(c.name) + '</div>'
        + (c.lead ? '<div class="lead">lead: ' + esc(c.lead) + '</div>' : '')
        + (c.work && c.work.length ? '<div class="client-tags">' + c.work.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '')
        + '</div>';
      grid.appendChild(d);
    });
    $('#client-note').textContent = 'Snapshot from the Quarry Brain, ' + (data.updated || '') + '. Channels and owners live in Slack.';
  });

  /* ---------- slack channels ---------- */
  (function () {
    var grid = $('#channel-grid');
    if (!grid) return;
    CHANNELS.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'flat-row ch-row';
      d.innerHTML = '<b>' + esc(c.n) + '</b><span class="d">: ' + esc(c.d) + '</span>'
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
    var url;
    if (t.kind === 'presentation') url = 'https://docs.google.com/presentation/d/' + t.id + '/embed?start=false&loop=false';
    else if (t.kind === 'spreadsheets') url = 'https://docs.google.com/spreadsheets/d/' + t.id + '/preview';
    else url = 'https://docs.google.com/document/d/' + t.id + '/preview';
    var open = 'https://docs.google.com/' + (t.kind === 'presentation' ? 'presentation' : t.kind === 'spreadsheets' ? 'spreadsheets' : 'document') + '/d/' + t.id + '/edit';
    var copy = open.replace(/\/edit$/, '/copy');
    var wrap = document.createElement('div');
    wrap.className = 'tpl';
    wrap.innerHTML = '<div class="tpl-head"><span class="tn">' + esc(t.name) + '</span><span class="tt">' + t.type + '</span>'
      + '<span class="acts"><a href="' + open + '" target="_blank" rel="noopener">Open</a><a href="' + copy + '" target="_blank" rel="noopener">Make a copy</a></span></div>'
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

  /* ---------- tour ---------- */
  var tour = store('carrara_tour') || { active: false, step: 0 };
  if (tour.step >= TOUR_TOTAL) tour.step = 0;
  function syncHome() {
    var btn = $('#btn-tour'), so = $('#btn-startover');
    if (tour.step > 0 && !tour.done) {
      btn.textContent = 'Resume onboarding, step ' + (tour.step + 1) + ' of ' + TOUR_TOTAL;
      so.hidden = false;
    } else {
      btn.textContent = 'See full onboarding';
      so.hidden = true;
    }
  }
  function syncTourChrome() {
    document.body.classList.toggle('tour-active', !!tour.active);
    if (!tour.active) { $('#meta-tour').hidden = true; return; }
    var n = tour.step + 1;
    $('#tour-stepnum').textContent = '[step ' + n + ' of ' + TOUR_TOTAL + ']';
    $('#tour-fill').style.width = (n / TOUR_TOTAL * 100) + '%';
    $('#meta-tour').hidden = false;
    $('#meta-tour').textContent = 'tour: step ' + n + ' of ' + TOUR_TOTAL;
    $('#tour-back').style.visibility = tour.step === 0 ? 'hidden' : 'visible';
    $('#tour-next').textContent = current === 'checklist' ? "I'll keep working on this" : (tour.step === TOUR_TOTAL - 1 ? 'Finish' : 'Next');
  }
  function tourGo(step) {
    tour.step = Math.max(0, step);
    if (tour.step >= TOUR_TOTAL) {
      tour.active = false; tour.done = true; tour.step = 0;
      store('carrara_tour', tour);
      location.hash = '#/complete';
      return;
    }
    tour.active = true; tour.done = false;
    store('carrara_tour', tour);
    var target = '#/' + TOUR[tour.step].id;
    if (location.hash === target) { show(TOUR[tour.step].id); } else { location.hash = target; }
    syncTourChrome();
  }
  $('#btn-tour').addEventListener('click', function () { tourGo(tour.step && !tour.done ? tour.step : 0); });
  $('#btn-startover').addEventListener('click', function () { tour = { active: false, step: 0 }; store('carrara_tour', tour); tourGo(0); });
  $('#tour-next').addEventListener('click', function () { tourGo(tour.step + 1); });
  $('#tour-back').addEventListener('click', function () { tourGo(tour.step - 1); });
  $('#tour-exit').addEventListener('click', function () {
    tour.active = false; store('carrara_tour', tour);
    location.hash = '#/start'; syncHome(); syncTourChrome();
  });
  $('#btn-home').addEventListener('click', function () { location.hash = '#/start'; syncHome(); });

  if (tour.active && TOUR[tour.step]) {
    location.hash = '#/' + TOUR[tour.step].id;
  }
  syncHome();
  route();
})();
