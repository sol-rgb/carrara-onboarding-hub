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
//   6. practices  -- the plan's sixth field reaches the kit as a string array,
//                    planIsEmpty never counts it, and the grouping helpers
//                    app.js uses (labels, card text, POps clients, peers from
//                    shared practices) pick practices only on the POps
//                    practices path and keep today's answer everywhere else
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
  check('a plan without practices carries practices: []', withPlan.body.plan && Array.isArray(withPlan.body.plan.practices) && withPlan.body.plan.practices.length === 0, withPlan.body.plan && withPlan.body.plan.practices);

  stubPops(() => ({ ok: true, json: async () => Object.assign({}, PLAN, { practices: [' Talent Platform ', 'Finance', '', 3, null, 'BizOps'] }) }));
  const withPractices = await callWelcome(codeFor('KEY-123'));
  check('practices reach the kit as strings, trimmed, blanks and non-strings dropped, in order',
    JSON.stringify(withPractices.body.plan && withPractices.body.plan.practices) === JSON.stringify(['Talent Platform', 'Finance', 'BizOps']),
    withPractices.body.plan && withPractices.body.plan.practices);
  stubPops(() => ({ ok: true, json: async () => Object.assign({}, PLAN, { practices: 'Talent Platform' }) }));
  const oddPractices = await callWelcome(codeFor('KEY-123'));
  check('non-array practices read as []', JSON.stringify(oddPractices.body.plan && oddPractices.body.plan.practices) === '[]',
    oddPractices.body.plan && oddPractices.body.plan.practices);
  check('the plan carries exactly the five content fields plus practices',
    JSON.stringify(Object.keys(withPractices.body.plan || {}).sort()) === JSON.stringify(['manager_intro', 'ninety_days', 'practices', 'sixty_days', 'thirty_days']),
    Object.keys(withPractices.body.plan || {}));
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
  console.log('\n[reveal] the nav badge');
  /* navState used to be navState(visited, sections, seen) and could return
     'hidden': the section stayed out of sight until the hire had opened every
     other one. That gate was removed on purpose -- the checklist is the
     onboarding now, and a hire could do seventeen real things and still not see
     their own plan for want of clicking through four reference pages.
     my-onboarding.js carries the reasoning.

     Eight checks here were still calling the three-argument signature and
     asserting 'hidden', so they had failed from the day the gate went: the
     first argument landed in `seen`, and a non-empty array is truthy. They
     assert the one-argument contract that exists now. */
  check('new before the section has been opened', mo.navState(false) === 'new');
  check('plain once the section itself has been opened', mo.navState(true) === 'plain');
  check('nothing hides it any more: the walk gate is gone',
    [undefined, null, 0, ''].every((v) => mo.navState(v) === 'new'),
    [undefined, null, 0, ''].map((v) => mo.navState(v)));
  check('addVisit is idempotent', mo.addVisit(mo.addVisit([], 'who'), 'who').length === 1);
  check('addVisit never records the section itself', mo.addVisit([], mo.SECTION_ID).length === 0);
  check('addVisit survives a missing list', mo.addVisit(null, 'who').length === 1, mo.addVisit(null, 'who'));
  check('addVisit does not mutate its input', (function () {
    const before = ['who'];
    mo.addVisit(before, 'team');
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
  /* The page is titled with the words of the row that opens it, and it does
     NOT greet the hire: the cover letter already said their name, and a second
     hello two pages in is one too many (register, 73). */
  check('is titled with the words of its checklist row',
    full.indexOf('Read your 30/60/90 plan.') > -1 && full.indexOf('For you') > -1);
  check('and does not greet the hire a second time', full.indexOf(', Ada.') === -1);
  /* The note moved to the cover letter (register, 71), so the section must not
     print it twice. The renderer it goes through, and the escaping that comes
     with it, are app.js's business now; what this file owns is that the section
     has let go of it. */
  check("does not render the manager's note: the cover letter has it",
    full.indexOf('<strong>Ada</strong>') === -1 && full.indexOf('quote-block') === -1);
  check("still names the manager, on their card", full.indexOf('Sol Silbenberg') > -1);
  check('renders the first client', full.indexOf('Anthropic') > -1);
  check('renders the syncs', full.indexOf('River Slate') > -1 && full.indexOf('runs the pod') > -1);
  check('renders the 30 and 90 steps', full.indexOf('>30<') > -1 && full.indexOf('>90<') > -1);
  check('omits the blank 60 step rather than opening it empty', full.indexOf('>60<') === -1);
  check('renders plan bullets as a list', full.indexOf('<li>Shadow two engagements</li>') > -1);
  check('no longer carries the pay line', full.indexOf('day-one email covers it') === -1);
  check('no longer carries the Enneagram', full.toLowerCase().indexOf('enneagram') === -1);
  /* The checklist is what sends people to this section now, so a card pointing
     back at it would be a circle. Only the no-kit state keeps one, and it is
     checked further down where that state is. */
  check('does not point back at the checklist it is reached from',
    full.indexOf('href="#/checklist"') === -1);
  /* Two cards: the hire's team and the hire's manager. The third was
     [questions], advice rather than this hire's team or plan. */
  check('renders the team and manager cards',
    full.indexOf('>Your team<') > -1 && full.indexOf('>Your manager<') > -1);
  /* The brackets were the style, not the words (register, 72), so this also
     guards against them creeping back into the strings. */
  check('and no longer the questions card or the bracket idiom',
    full.indexOf('questions]') === -1 && full.indexOf('[your') === -1);

  const withCtx = mo.renderSection(KIT, {
    manager: { avatar: '/assets/people/sol.jpg', email: 'sol@carrara.is', role: 'Partner' },
    peers: [{ name: 'River Slate', avatar: '' }, { name: 'Ana Lee', avatar: '/a.jpg' }],
    teamFilter: 'Talent Acquisition',
    checklist: { done: 3, total: 12 }
  });
  check("the manager card carries the roster photo and email",
    withCtx.indexOf('/assets/people/sol.jpg') > -1 && withCtx.indexOf('mailto:sol@carrara.is') > -1);
  check('the team card counts the peers', withCtx.indexOf('2 people do the same kind of work') > -1);
  /* The link under the faces went to the team page filtered by practice, which
     is not where a person's profile lives. Each face is the door now. */
  check('each face opens that person on the Carrara Hub',
    withCtx.indexOf('hub.carrara.is/people?person=') > -1);
  check('and the team page link under them is gone', withCtx.indexOf('Meet your team') === -1);
  /* The Slack link is built from window.LINKS, which this file does not have,
     so the mail link is the one reachable thing to assert on here. What matters
     either way is that both stand on the card's front. */
  check('the manager is reachable on the card itself, not behind a flip',
    withCtx.indexOf('mo-flip') === -1 && withCtx.indexOf('Flip for how to reach') === -1
    && withCtx.indexOf('mailto:sol@carrara.is') > -1);
  check('the manager card comes before the team card',
    withCtx.indexOf('Your manager') < withCtx.indexOf('Your team'));
  check('the team card does not name itself twice',
    withCtx.split('Your team').length - 1 === 1, withCtx.indexOf('Your team'));
  check('the plan has a head of its own above its caption',
    withCtx.indexOf('<h2 class="sub">Your first 90 days</h2>') > -1
    && withCtx.indexOf('Your first 90 days') < withCtx.indexOf('Written by your manager'));
  check('the lower cards lead with what they are',
    withCtx.indexOf('<div class="mo-card-title">Your first client</div>') > -1
    && withCtx.indexOf('<div class="mo-card-title">Book time with them in week one</div>') > -1);
  check('the client is one line: the name, then who leads it',
    withCtx.indexOf('<p class="mo-card-fact">Anthropic, Sol S.</p>') > -1);
  /* and nothing under it: the card is the fact. The clients page is in the nav
     and on the checklist, so a third door to it from inside this card was the
     page offering what the hub already offers twice. */
  check('and nothing under it', withCtx.indexOf('All clients and who leads them') === -1);
  check('a lead\'s initial keeps its dot, a sentence does not',
    mo.renderSection(Object.assign({}, KIT, { client: { name: 'LiteLLM', lead: 'Joe Penn.' } }))
      .indexOf('LiteLLM, Joe Penn<') > -1);
  check('"How your team works here" is not on this page any more',
    withCtx.toLowerCase().indexOf('works here') === -1 && withCtx.indexOf('Pods per client.') === -1);
  const hostileCtx = mo.renderSection(KIT, {
    manager: { avatar: '"><script>alert(6)</script>', email: '"><b>x', role: '<i>r</i>' },
    peers: [{ name: '<script>alert(7)</script>', avatar: '' }],
    teamFilter: '"><script>alert(8)</script>'
  });
  check('escapes hostile roster context', hostileCtx.indexOf('<script>alert(') === -1 && hostileCtx.indexOf('<i>r</i>') === -1);
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
  /* Vacuous here on purpose, and kept as the guard that says so: the section no
     longer prints manager_intro at all, so a hostile one cannot reach it. If
     this ever starts passing for a different reason -- the note coming back --
     the check above it fails first and says which. */
  check('a hostile plan body cannot reach the section', hostile.indexOf('alert(3)') === -1);

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
  check('and still renders the client and syncs',
    emptyPlan.indexOf('Read your 30/60/90 plan.') > -1 && emptyPlan.indexOf('Anthropic') > -1
      && emptyPlan.indexOf('River Slate') > -1);
  check('and still renders the top cards', emptyPlan.indexOf('>Your team<') > -1);

  const planless = mo.renderSection(Object.assign({}, KIT, { plan: null }));
  check('a planless kit still renders the client and syncs', planless.indexOf('Anthropic') > -1 && planless.indexOf('River Slate') > -1);
  check('and opens no empty timeline', planless.indexOf('mo-timeline') === -1);

  const locked = mo.renderSection(null);
  /* This used to send the reader to the welcome kit popup, which is not in the
     markup any more (register, 35). The state has to stand on its own now, so
     what it owes the reader is a plain account of what will appear here and who
     writes it -- and NOT a pointer to a popup that no longer exists. */
  check('no kit says what will appear here', locked.indexOf('first 90 days') > -1, locked);
  check('and no longer points at a welcome kit that is gone', locked.indexOf('access code') === -1, locked);
  /* Not even here. The checklist is what opens this page, with a kit and
     without one, so a card pointing back at it was a circle either way -- and
     the empty state is where the reader is least able to see that it is one. */
  check('no kit does not point back at the checklist either',
    locked.indexOf('href="#/checklist"') === -1 && locked.indexOf('mo-checklist') === -1);
  check('and never claims to be somebody', locked.indexOf('undefined') === -1, locked);

  // The kit /api/welcome actually returns has to render: the two sides of this
  // wire are checked against each other here, not assumed to match.
  stubPops(okPlan);
  const live = await callWelcome(codeFor('KEY-123'));
  global.fetch = realFetch;
  const liveHtml = mo.renderSection(live.body);
  check('the live /api/welcome payload renders a section',
    liveHtml.indexOf('Read your 30/60/90 plan.') > -1 && liveHtml.indexOf('mo-timeline') > -1, liveHtml.slice(0, 160));
  check('without the payload\'s pay pointer', liveHtml.indexOf(live.body.payNote) === -1);
  check('and the manager\'s syncs, not the derivation', liveHtml.indexOf('River Slate') > -1);

  // ------------------------------------------------------------- practices
  console.log('\n[practices] planIsEmpty and the grouping helpers');
  check('planIsEmpty: null is empty', mo.planIsEmpty(null) === true);
  check('planIsEmpty: all blank is empty', mo.planIsEmpty({ manager_intro: null, thirty_days: null, sixty_days: null, ninety_days: null }) === true);
  check('planIsEmpty: practices alone is still empty',
    mo.planIsEmpty({ manager_intro: null, thirty_days: null, sixty_days: null, ninety_days: null, practices: ['Talent Platform'] }) === true);
  check('planIsEmpty: an empty practices array is still empty',
    mo.planIsEmpty({ manager_intro: null, thirty_days: null, sixty_days: null, ninety_days: null, practices: [] }) === true);
  check('planIsEmpty: a manager field is content', mo.planIsEmpty({ thirty_days: 'Shadow two engagements', practices: [] }) === false);
  check('planIsEmpty: the live kit payload with practices: [] is not empty', mo.planIsEmpty(withPlan.body.plan) === false);

  check('groupingOf: POps with practices', mo.groupingOf({ source: 'pops', grouping: 'practices' }) === 'practices');
  check('groupingOf: POps without grouping is department', mo.groupingOf({ source: 'pops' }) === 'department');
  check('groupingOf: POps with an unknown grouping is department', mo.groupingOf({ source: 'pops', grouping: 'Practices' }) === 'department');
  check('groupingOf: Slack is department even if a grouping appeared', mo.groupingOf({ source: 'slack', grouping: 'practices' }) === 'department');
  check('groupingOf: the snapshot is department', mo.groupingOf(require('../team.json')) === 'department');
  check('groupingOf: nothing is department', mo.groupingOf(null) === 'department');

  check('labels under practices', JSON.stringify(mo.groupLabels('practices')) === JSON.stringify({ label: 'Practices', all: 'All practices' }));
  check('labels under department', JSON.stringify(mo.groupLabels('department')) === JSON.stringify({ label: 'Department', all: 'All departments' }));

  check('card text: three practices joined', mo.groupsText(['A', 'B', 'C'], 'practices') === 'A, B, C');
  check('card text: five practices show three and +2', mo.groupsText(['A', 'B', 'C', 'D', 'E'], 'practices') === 'A, B, C +2', mo.groupsText(['A', 'B', 'C', 'D', 'E'], 'practices'));
  check('card text: four practices show three and +1', mo.groupsText(['A', 'B', 'C', 'D'], 'practices') === 'A, B, C +1');
  check('card text: none is blank', mo.groupsText([], 'practices') === '');
  check('card text: the department and Notion paths join everything, as today',
    mo.groupsText(['Talent Acquisition', 'Talent Management', 'Strategic Finance', 'Managed Services / BizOps'], 'department')
      === 'Talent Acquisition, Talent Management, Strategic Finance, Managed Services / BizOps');

  const fallback = () => ['Codex Client'];
  check('clients: POps wins when it names any', JSON.stringify(mo.pickClients(true, { clients: ['Acme Rocketry'] }, fallback)) === JSON.stringify(['Acme Rocketry']));
  check('clients: POps empty falls back to today\'s sources', JSON.stringify(mo.pickClients(true, { clients: [] }, fallback)) === JSON.stringify(['Codex Client']));
  check('clients: POps missing falls back', JSON.stringify(mo.pickClients(true, {}, fallback)) === JSON.stringify(['Codex Client']));
  check('clients: not from POps ignores a clients field', JSON.stringify(mo.pickClients(false, { clients: ['Acme Rocketry'] }, fallback)) === JSON.stringify(['Codex Client']));
  check('clients: non-strings in POps\' list are ignored', JSON.stringify(mo.pickClients(true, { clients: [7, ''] }, fallback)) === JSON.stringify(['Codex Client']));

  const ROSTER = [
    { name: 'Zed Marlowe', avatar: 'z.png', practices: ['Finance', 'Talent Platform'] },
    { name: 'Sol Silbenberg', avatar: 's.png', practices: ['Talent Platform'] },
    { name: 'Ada Lovelace', avatar: 'a.png', practices: ['Talent Platform'] },
    { name: 'Bea Corvid', avatar: '', practices: ['Embedded Recruiting'] },
    { name: 'Cy Ardent', practices: ['Embedded Recruiting', 'Finance'] },
    { name: 'Dot Ember', avatar: 'd.png', practices: [] },
    { name: 'Eli Fathom', avatar: 'e.png' }
  ];
  const peers = mo.practicePeers(['Talent Platform', 'Embedded Recruiting'], ROSTER, 'Sol Silbenberg', 'Ada Lovelace');
  check('peers: everyone sharing a practice, minus the manager and the hire, sorted by name',
    JSON.stringify(peers) === JSON.stringify([
      { name: 'Bea Corvid', avatar: '', email: '' }, { name: 'Cy Ardent', avatar: '', email: '' },
      { name: 'Zed Marlowe', avatar: 'z.png', email: '' }
    ]), peers);
  check('peers: a hire with no practices has none', mo.practicePeers([], ROSTER, 'Sol Silbenberg', 'Ada Lovelace').length === 0);

  const KITP = Object.assign({}, KIT, { name: 'Ada Lovelace', plan: Object.assign({}, KIT.plan, { practices: ['Embedded Recruiting', 'Talent Platform'] }) });
  const pt = mo.practiceTeam(KITP, true, 'practices', ROSTER, 'Sol Silbenberg');
  check('practiceTeam: the filter is the hire\'s first practice', pt && pt.teamFilter === 'Embedded Recruiting', pt);
  check('practiceTeam: the faces are the shared-practice peers', pt && pt.peers.map((p) => p.name).join('|') === 'Bea Corvid|Cy Ardent|Zed Marlowe', pt && pt.peers);
  check('practiceTeam: the POps department path keeps TEAM_DIRECTORY', mo.practiceTeam(KITP, true, 'department', ROSTER, 'Sol Silbenberg') === null);
  check('practiceTeam: the snapshot and Slack paths keep TEAM_DIRECTORY', mo.practiceTeam(KITP, false, 'department', ROSTER, 'Sol Silbenberg') === null);
  check('practiceTeam: no practices on the plan keeps TEAM_DIRECTORY',
    mo.practiceTeam(Object.assign({}, KITP, { plan: Object.assign({}, KIT.plan, { practices: [] }) }), true, 'practices', ROSTER, 'Sol Silbenberg') === null);
  check('practiceTeam: a planless kit keeps TEAM_DIRECTORY', mo.practiceTeam(Object.assign({}, KITP, { plan: null }), true, 'practices', ROSTER, 'Sol Silbenberg') === null);
  check('TEAM_DIRECTORY still holds talent and finance for the snapshot path',
    JSON.stringify(Object.keys(mo.TEAM_DIRECTORY).sort()) === JSON.stringify(['finance', 'talent']));
  const ptHtml = mo.renderSection(KITP, { teamFilter: pt.teamFilter, peers: pt.peers });
  check('the section renders the practice peers, each one a door to their profile',
    ptHtml.indexOf('3 people do') > -1
    && ptHtml.indexOf('hub.carrara.is/people?person=Bea%20Corvid') > -1, ptHtml.slice(0, 200));

  console.log('');
  finished = true;
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('my-onboarding OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
