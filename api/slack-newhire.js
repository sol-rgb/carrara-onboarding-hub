// New hires bot endpoint. One URL handles both:
//   - the /new-hire slash command (opens the survey modal)
//   - the modal submission (generates the welcome-kit access code and posts to #new-hires)
//
// Slack app setup (one time):
//   1. api.slack.com/apps, create "New Hires" app in the carrarais workspace
//   2. Slash command: /new-hire -> https://<your-domain>/api/slack-newhire
//   3. Interactivity: on, request URL -> https://<your-domain>/api/slack-newhire
//   4. Bot scopes: commands, chat:write, users:read
//   5. Install to workspace, invite the bot to #new-hires
//   6. Vercel env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, WELCOME_SECRET, then redeploy
//
// The access code is stateless: the survey answers are packed into the code itself and
// signed with WELCOME_SECRET, so /api/welcome can unpack them without a database.
// Keep WELCOME_SECRET identical between this function and api/welcome.js (it is, via env).

const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

const COUNTRIES = [
  { text: 'United States', value: 'US' },
  { text: 'Argentina', value: 'AR' },
  { text: 'Australia', value: 'AU' },
  { text: 'Other', value: 'OTHER' }
];
const PROJECTS = [
  { text: 'Talent', value: 'talent' },
  { text: 'Finance', value: 'finance' },
  { text: 'Go-to-market', value: 'gtm' },
  { text: 'Other', value: 'other' }
];

function welcomeSecret() {
  // fallback keeps the flow working before env vars are set; set WELCOME_SECRET in production
  return process.env.WELCOME_SECRET || process.env.SLACK_SIGNING_SECRET || 'carrara-onboarding-hub';
}

function makeCode(fields) {
  const packed = [fields.name, fields.country, fields.project, fields.client, fields.manager, fields.managerId]
    .map(encodeURIComponent).join('|');
  const b64 = Buffer.from(packed, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', welcomeSecret()).update(b64).digest('hex').slice(0, 10);
  return b64 + '.' + sig;
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verify(req, raw) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // not configured yet; do not block setup testing
  const ts = req.headers['x-slack-request-timestamp'];
  const sig = req.headers['x-slack-signature'];
  if (!ts || !sig || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const base = 'v0:' + ts + ':' + raw.toString('utf8');
  const mine = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(sig)); } catch (e) { return false; }
}

function select(options, placeholder) {
  return {
    type: 'static_select',
    action_id: 'v',
    placeholder: { type: 'plain_text', text: placeholder },
    options: options.map((o) => ({ text: { type: 'plain_text', text: o.text }, value: o.value }))
  };
}

function buildModal() {
  const clients = require('../clients.json').clients
    .map((c) => ({ text: c.name, value: c.name }))
    .concat([{ text: 'Not assigned yet', value: '' }]);
  return {
    type: 'modal',
    callback_id: 'new_hire_survey',
    title: { type: 'plain_text', text: 'New hire' },
    submit: { type: 'plain_text', text: 'Create welcome kit' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      { type: 'input', block_id: 'name', label: { type: 'plain_text', text: 'Name of the new joiner' },
        element: { type: 'plain_text_input', action_id: 'v', placeholder: { type: 'plain_text', text: 'First and last name' } } },
      { type: 'input', block_id: 'country', label: { type: 'plain_text', text: 'Country they are joining from' },
        element: select(COUNTRIES, 'Pick a country') },
      { type: 'input', block_id: 'project', label: { type: 'plain_text', text: 'Type of projects' },
        element: select(PROJECTS, 'Pick a project type') },
      { type: 'input', block_id: 'client', label: { type: 'plain_text', text: 'First client' },
        element: select(clients, 'Pick a client') }
    ]
  };
}

async function slackApi(method, body, token) {
  const r = await fetch('https://slack.com/api/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function managerName(userId, token) {
  try {
    const r = await fetch('https://slack.com/api/users.info?user=' + userId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const j = await r.json();
    if (j.ok) return (j.user.profile && j.user.profile.real_name) || j.user.real_name || j.user.name;
  } catch (e) { /* fall through */ }
  return '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  const raw = await rawBody(req);
  if (!verify(req, raw)) return res.status(401).send('bad signature');

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.NEW_HIRES_CHANNEL_ID || 'C0BK7NG1PMM';
  const params = new URLSearchParams(raw.toString('utf8'));

  // interactivity payloads arrive as a "payload" form field
  if (params.get('payload')) {
    const payload = JSON.parse(params.get('payload'));
    if (payload.type === 'view_submission' && payload.view.callback_id === 'new_hire_survey') {
      const v = payload.view.state.values;
      const text = (id) => (v[id] && v[id].v && v[id].v.value) || '';
      const picked = (id) => (v[id] && v[id].v && v[id].v.selected_option) || null;
      const fields = {
        name: text('name').trim(),
        country: (picked('country') || {}).value || 'OTHER',
        project: (picked('project') || {}).value || 'other',
        client: (picked('client') || {}).value || '',
        managerId: payload.user.id,
        manager: (await managerName(payload.user.id, token)) || payload.user.name || ''
      };
      const code = makeCode(fields);
      const countryLabel = (COUNTRIES.find((c) => c.value === fields.country) || {}).text || fields.country;
      const projectLabel = (PROJECTS.find((p) => p.value === fields.project) || {}).text || fields.project;
      const msg = [
        ':new: *New hire: ' + fields.name + '*',
        'Country: ' + countryLabel,
        'Projects: ' + projectLabel,
        'First client: ' + (fields.client || 'not assigned yet'),
        'Hiring manager: <@' + fields.managerId + '>',
        '',
        'Welcome kit access code (send it to ' + fields.name + '):',
        '`' + code + '`',
        '_They enter it in the welcome popup at the bottom right of the onboarding hub._'
      ].join('\n');
      await slackApi('chat.postMessage', { channel, text: msg }, token);
      // swap the modal for a confirmation so the manager can copy the code right away
      return res.status(200).json({
        response_action: 'update',
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: 'Welcome kit ready' },
          close: { type: 'plain_text', text: 'Done' },
          blocks: [
            { type: 'section', text: { type: 'mrkdwn', text: '*' + fields.name + '* is set up. Their access code:' } },
            { type: 'section', text: { type: 'mrkdwn', text: '`' + code + '`' } },
            { type: 'section', text: { type: 'mrkdwn', text: 'Send it to them directly. It is also posted in <#' + channel + '> with their details.' } }
          ]
        }
      });
    }
    return res.status(200).send('');
  }

  // slash command: open the modal
  if (params.get('command')) {
    const j = await slackApi('views.open', { trigger_id: params.get('trigger_id'), view: buildModal() }, token);
    if (!j.ok) return res.status(200).send('Could not open the survey: ' + j.error);
    return res.status(200).send('');
  }

  return res.status(200).send('');
};
