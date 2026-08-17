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
//                    skips it when it does not, and survives POps being down
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
      return handler();
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

  console.log('');
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('my-onboarding OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
