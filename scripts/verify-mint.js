// Verifies /api/mint end to end, without a server and without a test runner
// (this repo has no package.json on purpose).
//
//   WELCOME_SECRET=test-secret node scripts/verify-mint.js
//
// It calls the two handlers as functions with fake req/res objects and checks:
//   1. round-trip  — every field minted by api/mint.js survives api/welcome.js's decode
//   2. auth gate   — unset POPS_HUB_TOKEN refuses everything (dormant), wrong bearer 401,
//                    right bearer 200 with a warnings array
//   3. warnings    — unknown project / country / client each report themselves
//   4. pass-through— extra, location and employmentType are accepted and ignored
// Exits non-zero on the first failure count > 0.

const mint = require('../api/mint.js');
const welcome = require('../api/welcome.js');

const TOKEN = 'pops-hub-test-token';
let failures = 0;

function check(label, cond, detail) {
  if (cond) {
    console.log('  ok   ' + label);
  } else {
    failures++;
    console.log('  FAIL ' + label + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
  }
}

function fakeRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

// bearer === null means "send no Authorization header at all"
async function callMint(body, bearer, opts) {
  const headers = Object.assign({ host: 'hub.example.com' }, (opts && opts.headers) || {});
  if (bearer !== null && bearer !== undefined) headers.authorization = 'Bearer ' + bearer;
  const req = { method: (opts && opts.method) || 'POST', headers, body };
  const res = fakeRes();
  await mint(req, res);
  return res;
}

async function callWelcome(code) {
  const res = fakeRes();
  await welcome({ method: 'POST', headers: { host: 'hub.example.com' }, body: { code } }, res);
  return res;
}

async function main() {
  console.log('secret in use: WELCOME_SECRET=' + (process.env.WELCOME_SECRET ? 'set' : 'UNSET (falling back)'));

  // ---------------------------------------------------------------- auth gate
  console.log('\n[auth] dormant: POPS_HUB_TOKEN unset refuses every request');
  delete process.env.POPS_HUB_TOKEN;
  const valid = { name: 'Ada Lovelace', country: 'US', project: 'talent', client: 'Anthropic', manager: 'Sol Silbenberg', managerId: 'U0SOL' };
  const noEnvNoHeader = await callMint(valid, null);
  check('no bearer at all -> 401', noEnvNoHeader.statusCode === 401, noEnvNoHeader.body);
  const noEnvWithHeader = await callMint(valid, TOKEN);
  check('a bearer that would be correct -> 401', noEnvWithHeader.statusCode === 401, noEnvWithHeader.body);
  check('no code is minted while dormant', !noEnvWithHeader.body.code, noEnvWithHeader.body);
  const noEnvEmptyBearer = await callMint(valid, '');
  check('empty bearer -> 401 (no crash)', noEnvEmptyBearer.statusCode === 401, noEnvEmptyBearer.body);

  console.log('\n[auth] with POPS_HUB_TOKEN set');
  process.env.POPS_HUB_TOKEN = TOKEN;
  const wrong = await callMint(valid, 'not-the-token');
  check('wrong bearer -> 401', wrong.statusCode === 401, wrong.body);
  const wrongSameLength = await callMint(valid, 'x'.repeat(TOKEN.length));
  check('wrong bearer of the same length -> 401', wrongSameLength.statusCode === 401, wrongSameLength.body);
  // same character count, different byte count: must 401, not throw
  const multibyte = await callMint(valid, 'é'.repeat(TOKEN.length));
  check('multibyte bearer of the same character count -> 401', multibyte.statusCode === 401, multibyte.body);
  const missingHeader = await callMint(valid, null);
  check('missing Authorization header -> 401', missingHeader.statusCode === 401, missingHeader.body);
  const notPost = await callMint(valid, TOKEN, { method: 'GET' });
  check('GET -> 405', notPost.statusCode === 405, notPost.body);

  const ok = await callMint(valid, TOKEN);
  check('right bearer -> 200', ok.statusCode === 200, ok.body);
  check('response carries a warnings array', Array.isArray(ok.body.warnings), ok.body);
  check('fully known payload warns about nothing', ok.body.warnings.length === 0, ok.body.warnings);
  check('response carries a code', typeof ok.body.code === 'string' && ok.body.code.includes('.'), ok.body.code);
  check('url is built from the request host', ok.body.url === 'https://hub.example.com/?code=' + encodeURIComponent(ok.body.code), ok.body.url);
  check('response is no-store', ok.headers['cache-control'] === 'no-store', ok.headers);

  console.log('\n[auth] required fields');
  const noName = await callMint({ manager: 'Sol Silbenberg' }, TOKEN);
  check('missing name -> 400', noName.statusCode === 400, noName.body);
  const noManager = await callMint({ name: 'Ada Lovelace' }, TOKEN);
  check('missing manager -> 400', noManager.statusCode === 400, noManager.body);

  // ------------------------------------------------------------- round trip
  console.log('\n[round-trip] mint -> api/welcome.js decode');
  const cases = [
    { label: 'plain payload', payload: valid },
    {
      label: 'separators and non-ASCII in the name',
      payload: {
        name: "Renée | O'Brien-Vásquez",
        country: 'AR',
        project: 'gtm',
        client: 'Modal Labs',
        manager: 'Kenna | Reyes',
        managerId: 'U0KENNA|X'
      }
    }
  ];
  for (const c of cases) {
    const minted = await callMint(c.payload, TOKEN);
    check(c.label + ': minted 200', minted.statusCode === 200, minted.body);
    const back = await callWelcome(minted.body.code);
    check(c.label + ': welcome.js accepted the code', back.statusCode === 200, back.body);
    const w = back.body || {};
    check(c.label + ': name', w.name === c.payload.name, { got: w.name, want: c.payload.name });
    check(c.label + ': country', w.country && w.country.key === c.payload.country, { got: w.country, want: c.payload.country });
    check(c.label + ': project', w.team && w.team.key === c.payload.project, { got: w.team, want: c.payload.project });
    check(c.label + ': client', w.client && w.client.name === c.payload.client, { got: w.client, want: c.payload.client });
    check(c.label + ': manager', w.manager && w.manager.name === c.payload.manager, { got: w.manager, want: c.payload.manager });
    check(c.label + ': managerId', w.manager && w.manager.id === c.payload.managerId, { got: w.manager, want: c.payload.managerId });
  }

  console.log('\n[round-trip] a tampered code is rejected by welcome.js');
  const mintedForTamper = await callMint(valid, TOKEN);
  const tampered = 'A' + mintedForTamper.body.code.slice(1);
  const tamperedBack = await callWelcome(tampered);
  check('tampered code -> 401', tamperedBack.statusCode === 401, tamperedBack.body);

  // --------------------------------------------------------------- warnings
  console.log('\n[warnings] unknown values are reported, not swallowed');
  const badProject = await callMint(Object.assign({}, valid, { project: 'wizardry' }), TOKEN);
  check('unknown project -> 200', badProject.statusCode === 200, badProject.body);
  check("unknown project warning", badProject.body.warnings.includes("unknown project 'wizardry'"), badProject.body.warnings);
  const badCountry = await callMint(Object.assign({}, valid, { country: 'ZZ' }), TOKEN);
  check("unknown country warning", badCountry.body.warnings.includes("unknown country 'ZZ'"), badCountry.body.warnings);
  const badClient = await callMint(Object.assign({}, valid, { client: 'Nowhere Inc' }), TOKEN);
  check("unknown client warning", badClient.body.warnings.includes("unknown client 'Nowhere Inc'"), badClient.body.warnings);
  const allBad = await callMint(Object.assign({}, valid, { project: 'wizardry', country: 'ZZ', client: 'Nowhere Inc' }), TOKEN);
  check('all three warn at once', allBad.body.warnings.length === 3, allBad.body.warnings);
  check('a warned code still mints', typeof allBad.body.code === 'string' && allBad.body.code.length > 0, allBad.body);
  const omitted = await callMint({ name: 'Ada Lovelace', manager: 'Sol Silbenberg' }, TOKEN);
  check('omitted project/country/client warn about nothing', omitted.body.warnings.length === 0, omitted.body.warnings);

  // ------------------------------------------------- accepted-and-ignored fields
  console.log('\n[pass-through] extra, location and employmentType are accepted and ignored');
  // deliberately unique values: the real welcome kit copy already contains words
  // like "contractor", so a sentinel is the only honest absence check.
  const withExtras = await callMint(Object.assign({}, valid, {
    extra: [{ q: 'Dietary restrictions?', a: 'sentinel-extra-9f3' }],
    location: 'sentinel-location-9f3',
    employmentType: 'sentinel-employment-9f3'
  }), TOKEN);
  check('request with the three fields -> 200', withExtras.statusCode === 200, withExtras.body);
  check('code is byte-identical to the same payload without them', withExtras.body.code === ok.body.code, { with: withExtras.body.code, without: ok.body.code });
  check('they add no warnings', withExtras.body.warnings.length === 0, withExtras.body.warnings);
  check('response shape is unchanged', JSON.stringify(Object.keys(withExtras.body).sort()) === JSON.stringify(['code', 'url', 'warnings']), Object.keys(withExtras.body));
  const extrasBack = await callWelcome(withExtras.body.code);
  check('they do not reach the welcome kit', JSON.stringify(extrasBack.body).indexOf('sentinel-') === -1, extrasBack.body);

  console.log('');
  if (failures) {
    console.error(failures + ' check(s) FAILED');
    process.exit(1);
  }
  console.log('round-trip OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
