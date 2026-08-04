/* Carrara Onboarding Hub */
(function () {
  'use strict';

  var SECTIONS = [
    { id: 'start',     label: 'Start here' },
    { id: 'who',       label: 'Who we are' },
    { id: 'week',      label: 'Your first week' },
    { id: 'team',      label: 'The team' },
    { id: 'slack',     label: 'Slack' },
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
      { t: 'Submit your Top 5', d: 'Share your Top 5 with the team so everyone knows how you work best.', links: [{ t: 'Top 5 form', k: 'top5Form' }] },
      { t: 'Look through open roles', d: 'Browse the roles we are currently hiring for across clients. It is the fastest way to understand what the talent side of the business actually does.', links: [{ t: 'Open roles', k: 'openRoles' }] }
    ]},
    { g: 'week one', cls: 'blue', items: [
      { t: 'Attend the tool tips session', d: 'A live walkthrough of the tools the team runs on, with tips from people who use them daily.', links: [{ t: 'The tools we use', k: '#/tools' }] },
      { t: 'Set up a recurring 1:1 with your manager', d: 'Get a weekly slot on the calendar before the week ends.' },
      { t: "Confirm you're added to all team calls", d: 'Standing team meetings, the monthly Team Roundup, and any client syncs relevant to your role.', links: [{ t: 'Team Roundup', k: 'teamRoundup' }] },
      { t: 'Get oriented on our Notion', d: 'Start at Home Base and click around.', links: [{ t: 'Home Base', k: 'notionHomeBase' }] },
      { t: 'Review the PTO policy', d: 'Read the Time off section of this hub, then the full policy on Notion. Two minutes now saves confusion later.', links: [{ t: 'Time off section', k: '#/timeoff' }, { t: 'Full policy on Notion', k: 'timeOffPolicy' }] },
      { t: 'Set up time tracking', d: 'Set up time tracking following your team lead’s instructions for your role and client.', links: [{ t: 'Time tracking', k: 'timeTracking' }] },
      { t: 'Explore and fill out the People Pavilion', d: 'The team directory in Notion. Fill in your entry so people can get to know you.', links: [{ t: 'People Pavilion', k: 'peoplePavilion' }] }
    ]},
    { g: 'week two', cls: '', items: [
      { t: 'Meet with teammates', d: 'Grab meet and greet 1:1s with the people you will work with most.', links: [{ t: 'The team wall', k: '#/team' }] },
      { t: 'Read the company operating principles', d: 'The Ways of Working page in Notion: what the four principles look like in practice.', links: [{ t: 'Ways of Working', k: 'waysOfWorking' }] },
      { t: 'Read the company context docs', d: 'Company history, direction, and how we engage clients.', links: [{ t: 'Company context', k: 'companyContext' }, { t: 'Home Base', k: 'notionHomeBase' }] },
      { t: 'Read tips on people and management', d: 'A short Notion read on how we think about people, feedback and management.', links: [{ t: 'Read it on Notion', k: 'peopleMgmtTips' }] },
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
    nav.appendChild(a);
    var o = document.createElement('option');
    o.value = s.id; o.textContent = s.label;
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
    nextNav(el, sec);
    syncTourChrome();
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
    syncTourChrome();
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
    var role = cleanTitle(m.title);
    var av = m.avatar ? '<img src="' + m.avatar + '" alt="">' : initials(m.name);
    var html = '<div class="m-eyebrow">[the team]</div>'
      + '<div class="member-head"><div class="avatar big">' + av + '</div><div>'
      + '<h3>' + esc(m.name) + '</h3>'
      + (role ? '<div class="rl">' + esc(role) + (m.extra ? ' · ' + esc(m.extra) : '') + '</div>' : (m.extra ? '<div class="rl">' + esc(m.extra) + '</div>' : ''))
      + '</div></div><div class="pg">';
    if (p && p.summary) html += '<p>' + esc(p.summary) + '</p>';
    if (p && p.prior && p.prior.length) {
      html += '<div class="wk-sec"><div class="wk-lbl">[before carrara]</div><ul>'
        + p.prior.map(function (x) {
            return '<li>' + (x.role ? '<b>' + esc(x.role) + '</b>, ' + esc(x.company) : '<b>' + esc(x.company) + '</b>') + '</li>';
          }).join('') + '</ul></div>';
    }
    var linksH = [];
    if (m.email) linksH.push('<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>');
    if (p && p.linkedin) linksH.push('<a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener">LinkedIn ↗</a>');
    if (linksH.length) html += '<div class="wk-sec"><div class="wk-lbl">[reach them]</div><div class="wk-links">' + linksH.join('') + '</div></div>';
    html += '</div>';
    if (!p) html += '<p class="pg-note">No enriched profile yet. Share a LinkedIn link to add one.</p>';
    openModal(html);
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
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      var av = m.avatar ? '<img src="' + m.avatar + '" alt="" loading="lazy">' : initials(m.name);
      var p = profileData[m.name];
      d.innerHTML = '<div class="avatar">' + av + '</div><div class="info">'
        + '<div class="nm">' + esc(m.name) + (m.isNew ? ' <span class="newtag">[new]</span>' : '') + '</div>'
        + (p && p.linkedin ? '<div class="em"><a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener">LinkedIn ↗</a></div>' : '')
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
  }
  $('#team-search').addEventListener('input', function (e) { renderTeam(e.target.value); });
  var profileData = {};
  Promise.all([
    (window.__TEAM__ ? Promise.resolve(window.__TEAM__) : fetch('/api/team').then(function (r) { if (!r.ok) throw 0; return r.json(); }))
      .catch(function () { return fetch('/team.json').then(function (r) { return r.json(); }); }),
    fetch('/profiles.json').then(function (r) { return r.json(); }).catch(function () { return { profiles: {} }; })
  ])
    .then(function (both) {
      var data = both[0];
      profileData = (both[1] && both[1].profiles) || {};
      teamData = data.members || [];
      renderTeam('');
      if (data.source === 'slack') {
        $('#team-note').textContent = 'Live from the #f-company-ops-general Slack channel, refreshed every two weeks. Photos and roles come from Slack profiles: set yours and it shows here.';
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
      + '<div class="m-actions"><button class="btn-primary" id="pf-save">Add me to the wall</button></div>'
      + '<p class="m-note">Your intro is shared with the team so they can give you a proper welcome.</p>'
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
      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prof) }).catch(function () {});
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
        + ' Open your welcome kit at the bottom right for who to meet and how your team works.';
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
    clientData = data.clients || [];
    clientData.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'client-row';
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      var logo = c.domain
        ? '<img src="' + favicon(c.domain, 64) + '" alt="" loading="lazy" onerror="this.parentNode.textContent=\'' + esc(c.name.charAt(0)) + '\'">'
        : esc(c.name.charAt(0));
      d.innerHTML = '<div class="clogo">' + logo + '</div><div><div class="cn">' + esc(c.name) + '</div>'
        + (c.lead ? '<div class="lead">lead: ' + esc(c.lead) + '</div>' : '')
        + (c.description ? '<div class="cdesc">' + esc(c.description) + '</div>' : '')
        + (c.work && c.work.length ? '<div class="client-tags">' + c.work.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '')
        + '</div>';
      d.addEventListener('click', function () { location.hash = '#/client/' + clientSlug(c.name); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = '#/client/' + clientSlug(c.name); } });
      grid.appendChild(d);
    });
    $('#client-note').textContent = (data.source === 'notion'
      ? 'Live from the Client Codex in Notion, refreshed hourly. Last update: '
      : 'Sourced from the Client Codex and the Quarry Brain. Last update: ')
      + (data.updated || '') + '. Click a client for its full page.';
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

  /* ---------- welcome kit popup ---------- */
  (function () {
    var wk = $('#wk');
    if (!wk) return;
    var pill = $('#wk-pill'), pillLabel = $('#wk-pill-label'), panel = $('#wk-panel'), body = $('#wk-body'), closeBtn = $('#wk-close');
    var saved = store('carrara_welcome'); /* { code, data } */

    function open() { panel.hidden = false; pill.setAttribute('aria-expanded', 'true'); pill.style.display = 'none'; }
    function close() { panel.hidden = true; pill.setAttribute('aria-expanded', 'false'); pill.style.display = ''; store('carrara_welcome_seen', true); }
    pill.addEventListener('click', open);
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
            renderKit(res.j);
          })
          .catch(function () { renderLocked('Could not reach the hub. Check your connection and try again.'); });
      }
      $('#wk-unlock').addEventListener('click', go);
      $('#wk-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    }

    function renderKit(d) {
      kitData = d;
      applyKitToHub();
      var html = '<h3>Welcome, ' + esc(d.firstName) + '.</h3>'
        + '<p>Here is your personal starting point. Everything below is specific to you.</p>';
      if (d.manager && d.manager.name) {
        html += '<div class="wk-sec"><div class="wk-lbl">[your hiring manager]</div>'
          + '<p><b style="color:var(--ink);font-weight:500">' + esc(d.manager.name) + '</b>. Your day-one 1:1 is with them: your 90-day plan and week-one priorities.</p></div>';
      }
      if (d.syncWith && d.syncWith.length) {
        html += '<div class="wk-sec"><div class="wk-lbl">[sync with them in week one]</div><ul>'
          + d.syncWith.map(function (s) { return '<li><b>' + esc(s.name) + '</b>: ' + esc(s.why) + '</li>'; }).join('')
          + '</ul></div>';
      }
      if (d.client) {
        html += '<div class="wk-sec"><div class="wk-lbl">[your first client]</div>'
          + '<p><b style="color:var(--ink);font-weight:500">' + esc(d.client.name) + '</b>'
          + (d.client.lead ? ', led by ' + esc(d.client.lead.replace(/\.+$/, '')) : '') + '.</p>'
          + (d.client.work && d.client.work.length ? '<div class="wk-tags">' + d.client.work.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '')
          + '</div>';
      }
      if (d.team && d.team.how && d.team.how.length) {
        html += '<div class="wk-sec"><div class="wk-lbl">[how ' + esc(d.team.label.toLowerCase()) + ' works here]</div><ul>'
          + d.team.how.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>';
      }
      if (d.country && d.country.notes && d.country.notes.length) {
        html += '<div class="wk-sec"><div class="wk-lbl">[joining from ' + esc(d.country.label.toLowerCase()) + ']</div><ul>'
          + d.country.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
      }
      /* enneagram: the test is external and free; results are not sent anywhere
         automatically, so the kit asks the joiner to share their type with their manager */
      var mgrDm = d.manager && d.manager.id ? window.LINKS.slackWorkspace + '/team/' + d.manager.id : '';
      html += '<div class="wk-sec"><div class="wk-lbl">[before your first 1:1]</div>'
        + '<p>Take the free Enneagram test below (about 10 minutes, no signup). When you have your type, send it'
        + (d.manager && d.manager.name ? ' to ' + esc(d.manager.name) : ' to your manager')
        + ' so they can shape how you two work together.</p>'
        + '<div class="wk-links">'
        + '<a href="https://www.eclecticenergies.com/enneagram/test" target="_blank" rel="noopener">Take the Enneagram test ↗</a>'
        + (mgrDm ? '<a href="' + esc(mgrDm) + '" target="_blank" rel="noopener">DM your result to ' + esc(d.manager.name) + ' ↗</a>' : '')
        + '</div></div>';
      if (d.links && d.links.length) {
        html += '<div class="wk-sec"><div class="wk-lbl">[start with these]</div><div class="wk-links">'
          + d.links.map(function (l) {
              var ext = l.external || /^https?:/.test(l.href);
              return '<a href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label) + (ext ? ' ↗' : '') + '</a>';
            }).join('') + '</div></div>';
      }
      html += '<button class="wk-reset" id="wk-reset">Not you? Enter a different code</button>';
      body.innerHTML = html;
      pillLabel.textContent = 'Your welcome kit, ' + d.firstName;
      $('#wk-reset').addEventListener('click', function () {
        saved = null; store('carrara_welcome', null);
        pillLabel.textContent = 'New here? Open your welcome kit';
        renderLocked();
      });
      body.querySelectorAll('.wk-links a[href^="#/"]').forEach(function (a) { a.addEventListener('click', close); });
    }

    if (saved && saved.data) {
      renderKit(saved.data);
      pillLabel.textContent = 'Your welcome kit, ' + saved.data.firstName;
    } else {
      renderLocked();
      /* nudge first-time visitors once */
      if (!store('carrara_welcome_seen')) setTimeout(open, 1400);
    }
  })();

  /* ---------- search palette (Cmd/Ctrl+K) ---------- */
  (function () {
    var back = $('#pal-back'), input = $('#pal-input'), list = $('#pal-list');
    if (!back) return;
    var sel = 0;

    function buildIndex() {
      var ix = [];
      SECTIONS.forEach(function (s) { ix.push({ label: s.label, hint: 'section', go: function () { location.hash = '#/' + s.id; } }); });
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

  if (tour.active && TOUR[tour.step]) {
    location.hash = '#/' + TOUR[tour.step].id;
  }
  syncHome();
  route();
})();
