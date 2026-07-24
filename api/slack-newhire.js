// New hires bot endpoint. One URL handles both:
//   - the /new-hire slash command (opens the survey modal)
//   - the modal submission (posts the formatted intro to #new-hires)
//
// Slack app setup (one time):
//   1. api.slack.com/apps, create "New Hires" app in the carrarais workspace
//   2. Slash command: /new-hire -> https://<your-domain>/api/slack-newhire
//   3. Interactivity: on, request URL -> https://<your-domain>/api/slack-newhire
//   4. Bot scopes: commands, chat:write
//   5. Install to workspace, invite the bot to #new-hires
//   6. Vercel env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, then redeploy

const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

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

const MODAL = {
  type: 'modal',
  callback_id: 'new_hire_survey',
  title: { type: 'plain_text', text: 'New hire' },
  submit: { type: 'plain_text', text: 'Post to #new-hires' },
  close: { type: 'plain_text', text: 'Cancel' },
  blocks: [
    { type: 'input', block_id: 'name', label: { type: 'plain_text', text: 'Name' },
      element: { type: 'plain_text_input', action_id: 'v' } },
    { type: 'input', block_id: 'position', label: { type: 'plain_text', text: 'Position' },
      element: { type: 'plain_text_input', action_id: 'v', placeholder: { type: 'plain_text', text: 'e.g. Talent Partner' } } },
    { type: 'input', block_id: 'projects', label: { type: 'plain_text', text: 'Type of projects' },
      element: { type: 'plain_text_input', action_id: 'v', placeholder: { type: 'plain_text', text: 'e.g. Embedded recruiting, events' } } },
    { type: 'input', block_id: 'client', label: { type: 'plain_text', text: 'First client' },
      element: { type: 'plain_text_input', action_id: 'v' } },
    { type: 'input', block_id: 'based', label: { type: 'plain_text', text: 'Based in' },
      element: { type: 'plain_text_input', action_id: 'v', placeholder: { type: 'plain_text', text: 'City, country' } } }
  ]
};

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
      const get = (id) => (v[id] && v[id].v && v[id].v.value) || '';
      const text = [
        ':new: *New hire: ' + get('name') + '*',
        'Position: ' + get('position'),
        'Projects: ' + get('projects'),
        'First client: ' + get('client'),
        'Based in: ' + get('based'),
        '_Added by <@' + payload.user.id + '>_'
      ].join('\n');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ channel, text })
      });
      return res.status(200).json({ response_action: 'clear' });
    }
    return res.status(200).send('');
  }

  // slash command: open the modal
  if (params.get('command')) {
    const r = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ trigger_id: params.get('trigger_id'), view: MODAL })
    });
    const j = await r.json();
    if (!j.ok) return res.status(200).send('Could not open the survey: ' + j.error);
    return res.status(200).send('');
  }

  return res.status(200).send('');
};
