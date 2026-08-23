// Verifies the "My Onboarding" surface end to end, without a browser and
// without a test runner (this repo has no package.json on purpose).
//
//   WELCOME_SECRET=test-secret node scripts/verify-my-onboarding.js
//
// It requires the handlers and modules as plain CommonJS and checks:
//   1. markdown   -- the vendored renderer escapes first and honours backslash
//                    escapes, exactly like the POps original
//   2. sync lines -- the manager's free text splits into names and reasons, and
//                    prose with no delimiter still renders
//   3. plan call  -- /api/welcome calls POps when the code carries a plan key,
//                    skips it when it does not, and survives POps being down,
//                    including a POps that answers the socket and then hangs
//   4. reveal     -- the section is hidden until every other section is
//                    visited, then NEW, then plain
//   5. section    -- renderSection escapes hostile content and omits blank
//                    blocks
// Exits non-zero on the first failure count > 0.
//
// scripts/verify-mint.js owns the ACCESS CODE FORMAT (six and seven fields).
// This file owns everything the plan key unlocks. Run both after any change to
// either side of the wire.

const md = require('../markdown.js');
const mo = require('../my-onboarding.js');

// A verifier that STOPS EARLY must never look like a verifier that passed.
// Node exits with status 0 the moment the event loop empties, and an await that
// never settles empties it -- so a truncated run would otherwise be silent
// green. Completion is asserted here, not assumed.
let finished = false;
process.on('exit', (code) => {
  if (!finished && code === 0) {
    console.error('\nFAILED: the verifier exited before finishing -- something awaited never settled');
    process.exitCode = 1;
  }
});

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log('  ok   ' + label);
  else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

async function main() {
  // ------------------------------------------------------------- markdown
  console.log('\n[markdown] the vendored renderer');
  check('escapes first', md.renderMarkdown('<img src=x onerror=alert(1)>').indexOf('<img') === -1,
    md.renderMarkdown('<img src=x onerror=alert(1)>'));
  check('escaped angle brackets survive as entities',
    md.renderMarkdown('a < b').indexOf('&lt;') > -1, md.renderMarkdown('a < b'));
  check('bold', md.renderMarkdown('**hi**') === '<p><strong>hi</strong></p>', md.renderMarkdown('**hi**'));
  check('italic', md.renderMarkdown('*hi*') === '<p><em>hi</em></p>', md.renderMarkdown('*hi*'));
  check('dash list', md.renderMarkdown('- one\n- two') === '<ul><li>one</li><li>two</li></ul>',
    md.renderMarkdown('- one\n- two'));
  check('numbered list', md.renderMarkdown('1. one\n2. two') === '<ol><li>one</li><li>two</li></ol>',
    md.renderMarkdown('1. one\n2. two'));
  check('single newline is a line break',
    md.renderMarkdown('one\ntwo') === '<p>one<br />two</p>', md.renderMarkdown('one\ntwo'));
  check('http link', md.renderMarkdown('[docs](https://carrara.is)') === '<p><a href="https://carrara.is">docs</a></p>',
    md.renderMarkdown('[docs](https://carrara.is)'));
  // The escapes are the half that distinguishes the CURRENT renderer from any
  // earlier copy -- a stale vendoring fails right here.
  check('backslash-escaped asterisk stays literal',
    md.renderMarkdown('a \\*literal\\* word') === '<p>a *literal* word</p>',
    md.renderMarkdown('a \\*literal\\* word'));
  check('backslash-escaped leading dash stays a paragraph',
    md.renderMarkdown('\\- not a bullet') === '<p>- not a bullet</p>',
    md.renderMarkdown('\\- not a bullet'));
  check('backslash-escaped bracket cannot open a link',
    md.renderMarkdown('\\[text\\](https://evil.test)').indexOf('<a ') === -1,
    md.renderMarkdown('\\[text\\](https://evil.test)'));
  // A forged placeholder cannot resolve against anyone's escape table, because
  // renderMarkdown strips the NUL delimiter from the input BEFORE inline() runs.
  // What is left behind is the inert digit, as literal text: POps renders this
  // input as "<p>a0b</p>" too, and the vendored copy must agree exactly.
  var forged = 'a' + String.fromCharCode(0) + '0' + String.fromCharCode(0) + 'b';
  check('a forged NUL placeholder is defused, its digit left as literal text',
    md.renderMarkdown(forged) === '<p>a0b</p>', md.renderMarkdown(forged));
  check('and no NUL survives into the output',
    md.renderMarkdown(forged).indexOf(String.fromCharCode(0)) === -1, md.renderMarkdown(forged));
  // The attack the strip exists to stop: a forged placeholder sitting next to a
  // REAL escape must not resolve to that escape's character. "\*x<NUL>0<NUL>"
  // would render "*x*" if the forgery could read the escape table; it renders
  // "*x0" instead.
  var forgedWithEscape = '\\*x' + String.fromCharCode(0) + '0' + String.fromCharCode(0);
  check('a forged placeholder cannot steal a real escape',
    md.renderMarkdown(forgedWithEscape) === '<p>*x0</p>', md.renderMarkdown(forgedWithEscape));
  check('javascript: is not linkified',
    md.renderMarkdown('[x](javascript:alert(1))').indexOf('<a ') === -1,
    md.renderMarkdown('[x](javascript:alert(1))'));

  // ----------------------------------------------------------- sync lines
  console.log('\n[syncs] the manager\'s free text');
  const dashed = mo.parseSyncWith('River Slate - runs the pod\nMorgan Marble - your manager');
  check('two lines, two syncs', dashed.length === 2, dashed);
  check('name before the dash', dashed[0].name === 'River Slate', dashed[0]);
  check('reason after it', dashed[0].why === 'runs the pod', dashed[0]);
  const colon = mo.parseSyncWith('River Slate: runs the pod');
  check('colon works too', colon[0].name === 'River Slate' && colon[0].why === 'runs the pod', colon);
  const emdash = mo.parseSyncWith('River Slate — runs the pod');
  check('em dash works too', emdash[0].name === 'River Slate' && emdash[0].why === 'runs the pod', emdash);
  const bare = mo.parseSyncWith('River Slate');
  check('a bare name renders as a name with no reason',
    bare.length === 1 && bare[0].name === 'River Slate' && bare[0].why === '', bare);
  const bulleted = mo.parseSyncWith('- River Slate - runs the pod\n* Morgan Marble');
  check('leading bullets are stripped, not shown',
    bulleted[0].name === 'River Slate' && bulleted[1].name === 'Morgan Marble', bulleted);
  check('blank lines are dropped', mo.parseSyncWith('a\n\n\nb').length === 2, mo.parseSyncWith('a\n\n\nb'));
  check('empty text is no syncs at all', mo.parseSyncWith('').length === 0);
  check('whitespace-only text is no syncs at all', mo.parseSyncWith('   \n  ').length === 0);
  // Hyphenated names must survive: a DASH only delimits when spaced on both
  // sides. A colon is the exception -- it delimits unspaced, the way people
  // actually type it -- so the cases below pin both halves of that asymmetry.
  const hyphen = mo.parseSyncWith('Jean-Luc Picard');
  check('a hyphenated name is not split', hyphen[0].name === 'Jean-Luc Picard', hyphen);
  const hyphenWhy = mo.parseSyncWith('Jean-Luc Picard - runs the pod');
  check('a hyphenated name still splits on a spaced dash',
    hyphenWhy[0].name === 'Jean-Luc Picard' && hyphenWhy[0].why === 'runs the pod', hyphenWhy);
  const hyphenColon = mo.parseSyncWith('Jean-Luc Picard: runs the pod');
  check('a hyphenated name still splits on an unspaced colon',
    hyphenColon[0].name === 'Jean-Luc Picard' && hyphenColon[0].why === 'runs the pod', hyphenColon);
  const spacedColon = mo.parseSyncWith('River Slate : runs the pod');
  check('a spaced colon works too', spacedColon[0].name === 'River Slate' && spacedColon[0].why === 'runs the pod', spacedColon);
  // The colon needs the trailing space, which is what keeps a clock time whole.
  const clock = mo.parseSyncWith('Standup at 10:30');
  check('a time of day is not a delimiter', clock[0].name === 'Standup at 10:30' && clock[0].why === '', clock);
  const clockWhy = mo.parseSyncWith('Sol: sync at 10:30 daily');
  check('only the FIRST delimiter splits', clockWhy[0].name === 'Sol' && clockWhy[0].why === 'sync at 10:30 daily', clockWhy);
  // A line that OPENS with a delimiter has nothing to the left of it. Splitting
  // there would render a bullet with an empty name, so the line stays whole --
  // the same answer a line with no delimiter at all gets.
  const leadingDelim = mo.parseSyncWith(': runs the pod');
  check('a line that opens with a delimiter keeps its whole text as the name',
    leadingDelim.length === 1 && leadingDelim[0].name === ': runs the pod' && leadingDelim[0].why === '', leadingDelim);
  const garbled = mo.parseSyncWith('River Slate - runs the pod\n: leftover\n:\n- : x');
  check('no parsed sync ever has an empty name, however the manager typed it',
    garbled.length === 4 && garbled.every((s) => s.name.trim().length > 0), garbled);

  // ------------------------------------------------------------- plan call
  console.log('\n[plan] /api/welcome and POps');
  const crypto = require('crypto');
  const welcome = require('../api/welcome.js');

  function fakeRes() {
    const res = { statusCode: 0, body: null, headers: {} };
    res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
  }
  function codeFor(planKey) {
    const secret = process.env.WELCOME_SECRET || process.env.SLACK_SIGNING_SECRET || 'carrara-onboarding-hub';
    const packed = ['Ada Lovelace', 'US', 'talent', 'Anthropic', 'Sol Silbenberg', 'U0SOL', planKey]
      .map((v) => encodeURIComponent(v == null ? '' : String(v))).join('|');
    const b64 = Buffer.from(packed, 'utf8').toString('base64url');
    return b64 + '.' + crypto.createHmac('sha256', secret).update(b64).digest('hex').slice(0, 10);
  }
  async function callWelcome(code) {
    const res = fakeRes();
    await welcome({ method: 'POST', headers: { host: 'hub.example.com' }, body: { code } }, res);
    return res;
  }

  const PLAN = {
    manager_intro: 'Glad you are here.',
    thirty_days: '- Shadow two engagements\n- Own the notes',
    sixty_days: 'Run the weekly report.',
    ninety_days: 'Own the account.',
    sync_with: 'River Slate - runs the pod\nMorgan Marble - your manager'
  };

  const realFetch = global.fetch;
  let calls = [];
  function stubPops(handler) {
    calls = [];
    global.fetch = async (url, init) => {
      calls.push({ url: String(url), init: init || {} });
      return handler(String(url), init || {});
    };
  }
  const okPlan = () => ({ ok: true, json: async () => PLAN });

  process.env.POPS_PLAN_TOKEN = 'plan-token-for-tests';
  process.env.POPS_PLAN_URL = 'https://pops.example.test/api/hub-plan';

  stubPops(okPlan);
  const withPlan = await callWelcome(codeFor('KEY-123'));
  check('a code with a plan key reaches POps exactly once', calls.length === 1, calls.map((c) => c.url));
  check('at the keyed URL', calls[0] && calls[0].url === 'https://pops.example.test/api/hub-plan/KEY-123', calls[0] && calls[0].url);
  check('with the bearer', calls[0] && calls[0].init.headers.Authorization === 'Bearer plan-token-for-tests', calls[0] && calls[0].init.headers);
  check('the kit carries the plan', withPlan.body.plan && withPlan.body.plan.thirty_days === PLAN.thirty_days, withPlan.body.plan);
  check('sync_with is NOT echoed on the plan', withPlan.body.plan && withPlan.body.plan.sync_with === undefined, withPlan.body.plan);
  check("the manager's syncs replace the derivation",
    withPlan.body.syncWith.length === 2 && withPlan.body.syncWith[0].name === 'River Slate', withPlan.body.syncWith);

  stubPops(okPlan);
  const noKey = await callWelcome(codeFor(''));
  check('a code with no plan key makes NO call', calls.length === 0, calls.map((c) => c.url));
  check('and carries no plan', noKey.body.plan === null, noKey.body.plan);
  check('and still derives syncs from the client lead and team defaults', noKey.body.syncWith.length > 0, noKey.body.syncWith);

  stubPops(() => ({ ok: false, status: 404, json: async () => ({ error: 'not found' }) }));
  const stale = await callWelcome(codeFor('RETIRED-KEY'));
  check('a retired key renders a kit, planless', stale.statusCode === 200 && stale.body.plan === null, stale.body.plan);

  stubPops(() => { throw new Error('POps is down'); });
  const down = await callWelcome(codeFor('KEY-123'));
  check('POps unreachable renders a kit, planless', down.statusCode === 200 && down.body.plan === null, down.body.plan);
  check('and the rest of the kit is intact', down.body.firstName === 'Ada' && !!down.body.client, down.body.firstName);

  // The worst kind of down: POps accepts the connection and then says nothing.
  // fetchPlan carries AbortSignal.timeout(2500) and the catch maps the
  // AbortError to null, so the hire still gets a kit. The stub answers the way
  // a real hung socket does -- it settles ONLY when the abort fires -- so this
  // check exercises the deadline itself, and spends about 2.5s of wall clock
  // doing it. If the signal ever goes missing the stub rejects immediately
  // rather than hanging this verifier forever; the signal check below is what
  // then fails, loudly.
  stubPops((url, init) => new Promise((_resolve, reject) => {
    if (!init.signal) { reject(new Error('fetchPlan passed no AbortSignal')); return; }
    init.signal.addEventListener('abort', () => {
      const e = new Error('The operation was aborted due to timeout');
      e.name = 'AbortError';
      reject(e);
    });
  }));
  // Node's AbortSignal.timeout() timer is UNREF'D: on its own it does not hold
  // the event loop open, and with a stub in place of a real socket there is
  // nothing else pending, so the process would simply exit mid-await. A live
  // request (or a real hung socket) is what refs the loop in production; this
  // interval stands in for it, and is cleared the moment the call returns.
  const keepAlive = setInterval(() => {}, 100);
  const t0 = Date.now();
  const hung = await callWelcome(codeFor('KEY-123'));
  const hungMs = Date.now() - t0;
  clearInterval(keepAlive);
  check('a POps that never answers still renders a kit, planless',
    hung.statusCode === 200 && hung.body.plan === null, { status: hung.statusCode, plan: hung.body.plan });
  check('and the rest of that kit is intact too',
    hung.body.firstName === 'Ada' && !!hung.body.client && hung.body.syncWith.length > 0, hung.body.firstName);
  check('the plan fetch carries an abort signal',
    !!(calls[0] && calls[0].init && calls[0].init.signal), calls[0] && Object.keys(calls[0].init || {}));
  check('and gives up in about 2.5s rather than never', hungMs >= 2000 && hungMs < 6000, hungMs + 'ms');

  delete process.env.POPS_PLAN_TOKEN;
  stubPops(okPlan);
  const dormant = await callWelcome(codeFor('KEY-123'));
  check('no POPS_PLAN_TOKEN means no call at all', calls.length === 0, calls.map((c) => c.url));
  check('and no plan', dormant.body.plan === null, dormant.body.plan);
  process.env.POPS_PLAN_TOKEN = 'plan-token-for-tests';

  global.fetch = realFetch;

  // ------------------------------------------------- country block removed
  console.log('\n[country] the country notes are gone, one generic line remains');
  stubPops(okPlan);
  const kit = await callWelcome(codeFor('KEY-123'));
  global.fetch = realFetch;
  check('country carries a key and a label', kit.body.country.key === 'US' && kit.body.country.label === 'United States', kit.body.country);
  check('and no notes', kit.body.country.notes === undefined, kit.body.country);
  check('the generic pay pointer ships instead', typeof kit.body.payNote === 'string' && kit.body.payNote.length > 0, kit.body.payNote);
  const config = require('../welcome.json');
  check('welcome.json carries no country notes either',
    Object.keys(config.countries).every((k) => config.countries[k].notes === undefined), config.countries);

  // ---------------------------------------------------------------- reveal
  console.log('\n[reveal] the section appears when the hub has been walked');
  const OTHERS = ['start', 'who', 'week', 'team', 'slack', 'checklist', 'business', 'clients', 'tools', 'templates', 'timeoff', 'resources'];
  check('hidden with nothing visited', mo.navState([], OTHERS, false) === 'hidden');
  check('hidden one section short', mo.navState(OTHERS.slice(0, -1), OTHERS, false) === 'hidden', OTHERS.slice(0, -1));
  check('NEW once every other section is visited', mo.navState(OTHERS, OTHERS, false) === 'new');
  check('plain once the section itself has been opened', mo.navState(OTHERS, OTHERS, true) === 'plain');
  check('order does not matter', mo.navState(OTHERS.slice().reverse(), OTHERS, false) === 'new');
  check('a stale extra id does not block the reveal', mo.navState(OTHERS.concat(['retired-section']), OTHERS, false) === 'new');
  check('an empty section list never reveals', mo.navState([], [], false) === 'hidden');
  // Bad input hides. A missing list is a bug somewhere else; revealing early
  // because of one would be the failure nobody notices.
  check('a missing visited list never reveals', mo.navState(null, OTHERS, false) === 'hidden');
  check('a missing section list never reveals', mo.navState(OTHERS, null, false) === 'hidden');
  check('addVisit is idempotent', mo.addVisit(mo.addVisit([], 'who'), 'who').length === 1);
  check('addVisit never records the section itself', mo.addVisit([], mo.SECTION_ID).length === 0);
  check('addVisit survives a missing list', mo.addVisit(null, 'who').length === 1, mo.addVisit(null, 'who'));
  check('addVisit does not mutate its input', (function () {
    const before = ['who'];
    mo.addVisit(before, 'week');
    return before.length === 1;
  })());

  // --------------------------------------------------------------- section
  console.log('\n[section] renderSection');
  const KIT = {
    firstName: 'Ada',
    manager: { name: 'Sol Silbenberg', id: 'U0SOL' },
    client: { name: 'Anthropic', domain: 'anthropic.com', lead: 'Sol S.', work: ['Embedded recruiting'] },
    team: { key: 'talent', label: 'Talent', how: ['Pods per client.'] },
    syncWith: [{ name: 'River Slate', why: 'runs the pod' }],
    payNote: 'Questions about pay or invoicing? Your day-one email covers it, or ping People Ops.',
    links: [{ label: 'The onboarding checklist', href: '#/checklist' }],
    plan: {
      manager_intro: 'Glad you are here, **Ada**.',
      thirty_days: '- Shadow two engagements\n- Own the notes',
      sixty_days: null,
      ninety_days: 'Own the account.'
    }
  };
  const full = mo.renderSection(KIT);
  check('names the hire in the display heading', full.indexOf('Your onboarding, Ada.') > -1);
  check("renders the manager's note through the vendored renderer", full.indexOf('<strong>Ada</strong>') > -1);
  check("attributes it to the manager", full.indexOf('Sol Silbenberg') > -1);
  check('renders the first client', full.indexOf('Anthropic') > -1);
  check('renders the syncs', full.indexOf('River Slate') > -1 && full.indexOf('runs the pod') > -1);
  check('renders the 30 and 90 steps', full.indexOf('>30<') > -1 && full.indexOf('>90<') > -1);
  check('omits the blank 60 step rather than opening it empty', full.indexOf('>60<') === -1);
  check('renders plan bullets as a list', full.indexOf('<li>Shadow two engagements</li>') > -1);
  check('carries the generic pay line', full.indexOf('day-one email covers it') > -1);
  check('carries no country notes block', full.toLowerCase().indexOf('joining from') === -1);

  const hostile = mo.renderSection(Object.assign({}, KIT, {
    firstName: '<img src=x onerror=alert(1)>',
    manager: { name: '</p><script>alert(2)</script>', id: '' },
    syncWith: [{ name: '<b>x</b>', why: '"quoted"' }],
    plan: Object.assign({}, KIT.plan, { manager_intro: '<script>alert(3)</script>' })
  }));
  check('escapes a hostile first name', hostile.indexOf('<img src=x') === -1, hostile.slice(0, 200));
  check('escapes a hostile manager name', hostile.indexOf('<script>alert(2)') === -1);
  check('escapes a hostile sync name', hostile.indexOf('<b>x</b>') === -1);
  check('escapes a hostile plan body', hostile.indexOf('<script>alert(3)') === -1);

  // The manager's sync lines are free text, not markdown: they take esc() and
  // nothing else. This walks the WHOLE path -- the raw answer POps returns,
  // through parseSyncWith, into the HTML -- because that is the path a manager
  // pasting from anywhere actually takes.
  const hostileSyncs = mo.parseSyncWith(
    '<script>alert(4)</script> - "runs" the pod\n<img src=x onerror=alert(5)>: leads it\nJean-Luc Picard'
  );
  const syncSection = mo.renderSection(Object.assign({}, KIT, { syncWith: hostileSyncs }));
  check('a script tag in a sync line never reaches the page as markup',
    syncSection.indexOf('<script') === -1, syncSection.slice(syncSection.indexOf('mo-syncs'), syncSection.indexOf('mo-syncs') + 260));
  check('an img/onerror in a sync line does not either', syncSection.indexOf('<img') === -1);
  check('the escaped text is still shown, not swallowed',
    syncSection.indexOf('&lt;script&gt;alert(4)&lt;/script&gt;') > -1);
  check('a quote in a reason is escaped', syncSection.indexOf('&quot;runs&quot; the pod') > -1);
  check('an undelimited name still renders whole', syncSection.indexOf('Jean-Luc Picard') > -1);

  // POps answers with all five keys and nulls in them when the manager has not
  // written anything yet. A non-null plan is therefore NOT a renderable plan:
  // every block is decided on its own text, never on the plan object existing.
  const emptyPlan = mo.renderSection(Object.assign({}, KIT, {
    plan: { manager_intro: null, thirty_days: null, sixty_days: null, ninety_days: null }
  }));
  check('an all-null plan opens no note and no timeline',
    emptyPlan.indexOf('quote-block') === -1 && emptyPlan.indexOf('mo-timeline') === -1, emptyPlan.slice(0, 200));
  check('and still names the hire and renders the client and syncs',
    emptyPlan.indexOf('Your onboarding, Ada.') > -1 && emptyPlan.indexOf('Anthropic') > -1
      && emptyPlan.indexOf('River Slate') > -1);
  check('and still carries the pay pointer', emptyPlan.indexOf('day-one email covers it') > -1);

  const planless = mo.renderSection(Object.assign({}, KIT, { plan: null }));
  check('a planless kit still renders the client and syncs', planless.indexOf('Anthropic') > -1 && planless.indexOf('River Slate') > -1);
  check('and opens no empty timeline', planless.indexOf('mo-timeline') === -1);

  const locked = mo.renderSection(null);
  check('no kit at all points at the welcome kit', locked.indexOf('access code') > -1, locked);
  check('and never claims to be somebody', locked.indexOf('undefined') === -1, locked);

  // The kit /api/welcome actually returns has to render: the two sides of this
  // wire are checked against each other here, not assumed to match.
  stubPops(okPlan);
  const live = await callWelcome(codeFor('KEY-123'));
  global.fetch = realFetch;
  const liveHtml = mo.renderSection(live.body);
  check('the live /api/welcome payload renders a section',
    liveHtml.indexOf('Your onboarding, Ada.') > -1 && liveHtml.indexOf('mo-timeline') > -1, liveHtml.slice(0, 160));
  check('with the payload\'s own pay pointer', liveHtml.indexOf(live.body.payNote) > -1);
  check('and the manager\'s syncs, not the derivation', liveHtml.indexOf('River Slate') > -1);

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('my-onboarding OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
