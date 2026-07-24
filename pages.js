/* Popup content for destinations that used to live on Notion.
   Snapshot taken from Notion on Jul 24, 2026 — edit here, or ask Claude to
   re-snapshot. Keys match links.js; anything with an entry here opens as an
   in-hub popup instead of linking out. */
window.PAGES = {
  timeOffPolicy: {
    title: 'Time-Off & Holiday Policy',
    html: '<p>We operate at a high level, which means we also need time to reset. Time off is built on trust, responsibility and impact:</p>'
      + '<ul><li>Take time off proactively, not just when you are burned out.</li>'
      + '<li>Aim for at least two days off per quarter (with prior approval) to recharge.</li>'
      + '<li>Communicate early and clearly so the team can plan around it.</li></ul>'
      + '<h4>Taking time off</h4>'
      + '<ul><li><b>Plan in advance:</b> give as much notice as possible, ideally two weeks. You own load balancing and outcomes while out.</li>'
      + '<li><b>Mind team and client commitments:</b> check deadlines and collaborate so nothing slips.</li>'
      + '<li><b>Balance personal and business needs:</b> pace time off with well-being and team goals in mind.</li></ul>'
      + '<h4>Requesting time off</h4>'
      + '<p>All requests need manager approval. Once approved, post in #g-ooo as:</p>'
      + '<p><b>Your Name - OOO (Start Date - End Date)</b>, optionally with a short note. Example: <b>Eric - OOO (01/01/2026 - 01/05/2026)</b>, out of town visiting my grandparents.</p>'
      + '<h4>Unplanned absences</h4>'
      + '<p>Personal emergency or illness: tell your manager or team as soon as possible, and keep them updated if you need more days.</p>'
      + '<h4>Holidays</h4>'
      + '<ul><li><b>Christmas to New Year:</b> work is slower; unplug and recharge as much as possible.</li>'
      + '<li><b>Thanksgiving to Christmas:</b> all-hands-on-deck season; limit time off where you can.</li></ul>'
      + '<p>Common client-observed holidays: New Year’s Day, MLK Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas.</p>'
      + '<h4>FAQs</h4>'
      + '<ul><li><b>Contractors:</b> check your agreement; usually time off is deducted from hours worked that week.</li>'
      + '<li><b>Questions:</b> talk to your manager first.</li>'
      + '<li><b>Emergencies:</b> humans first. Take the time you need and keep your manager in the loop.</li></ul>'
  },
  coordinatorOOO: {
    title: 'Coordinator OOO template',
    html: '<p>A ready-made structure for going out of office as a coordinator. Duplicate it, rename it to "[Your Name] OOO", fill in the placeholders, and share with your coverage team and Carrara POCs at least one week before leaving.</p>'
      + '<h4>What it covers</h4>'
      + '<ul><li>Basic info: dates, availability while out, emergency contact.</li>'
      + '<li>A coverage table per client: who covers, primary and secondary, and the scope.</li>'
      + '<li>Per-client breakdown: POCs, open roles, active candidates, quirks.</li>'
      + '<li>Recurring tasks and meetings that need covering.</li>'
      + '<li>Known risks, escalation order, and your communication plan (auto-reply, Slack status).</li>'
      + '<li>A return plan and a pre-departure checklist (confirm with Hayley, add to calendars, post in #g-ooo).</li></ul>'
      + '<p>Ask your team lead for the current template document to duplicate.</p>'
  },
  notionHomeBase: {
    title: 'Carrara HQ',
    html: '<p><b>Carrara is an operating firm that helps founders and leaders build exceptional companies through an unrelenting focus on the work.</b></p>'
      + '<p>HQ is the central source of truth: core values and guiding principles, team member profiles, the Client Codex (detailed profiles of all clients, past and present), the Wisdom Warehouse (reusable client-facing content and how-to guides), and the brand pages.</p>'
      + '<h4>The four principles</h4>'
      + '<ul><li>Obsess over craft</li><li>Take agency</li><li>Progress over process</li><li>Build collective understanding</li></ul>'
      + '<p>Most of what HQ held now lives in this hub: the team wall, the clients section, and the brand templates.</p>'
  },
  quarry: {
    title: 'Quarry setup',
    html: '<p>The Quarry is Carrara’s AI harness: a curated mix of tools, best practices and conventions so every Carrarian has a shared way of doing AI, and we co-build new skills together.</p>'
      + '<ul><li><b>Files:</b> viewed and edited in Obsidian.</li>'
      + '<li><b>AI:</b> Claude Cowork or Claude Code.</li>'
      + '<li><b>Skills:</b> structured and shared through the Quarry (pre-installed on Cowork).</li></ul>'
      + '<h4>Set up</h4>'
      + '<ul><li>Download the Claude macOS app (claude.com/download) and log in with your Carrara account (Continue with Google). Make sure you are on the Carrara workspace, Team plan.</li>'
      + '<li>Download Obsidian (obsidian.md) and create a synced vault. Sync needs a subscription; use your SaaS card.</li>'
      + '<li>In the Cowork tab: select your Obsidian vault as the root folder, pick the latest Opus model, and run <b>/workspace-initialization</b>, then <b>/workspace-migration</b> (moves your memories over), then <b>/sync</b>.</li>'
      + '<li>Terminal users: in Claude Code run <b>/plugin marketplace add Carrara-Labs/carrara-ai-harness</b>, install the Productivity, Quarry Create and Workspace Management plugins, then run the same three commands.</li></ul>'
      + '<p>Stuck? Ask in Slack and someone will get you sorted.</p>'
  },
  brandVault: {
    title: 'Brand Vault',
    html: '<p><b>The brand story:</b> labor and capital trend toward entropy. Misalignment wastes time, talent and energy. After the pandemic, labor and capital are finding a new balance, and Carrara exists to create meaningful relationships between work and the people delivering it.</p>'
      + '<p>We were inspired by Michelangelo: "The sculpture is already complete within the marble block… I just have to chisel away the superfluous material." Carrara is the quarry where he found stone par excellence. Potential and excellence exist and need to be revealed. Where others see blocks, we see opportunities.</p>'
      + '<h4>Messaging</h4>'
      + '<p>Carrara is an operating firm that helps founders and leaders build exceptional companies through an unrelenting focus on the work.</p>'
      + '<ul><li><b>Find humans:</b> executive search and embedded recruiting, delivering the people who drive critical work forward.</li>'
      + '<li><b>Form organizations:</b> embedded leadership and operational delivery across talent, finance and business management.</li></ul>'
      + '<h4>Beliefs</h4>'
      + '<ul><li>Companies will win based on how they orchestrate resources, not "humans in seats".</li>'
      + '<li>Excellence and mediocrity both compound.</li>'
      + '<li>Human agency through work: your work gives you self.</li>'
      + '<li>Hire for higher order: critical thinking, judgement and taste.</li>'
      + '<li>Build systems that amplify rather than administrate.</li>'
      + '<li>Focus on progress, not process. Leadership is presence, not absence.</li></ul>'
      + '<h4>Customers</h4>'
      + '<p>Companies (we find the right people and shape organizations), talent (we connect exceptional humans to organizations that share their worldview), and VC + PE firms (we amplify their portfolios).</p>'
  },
  brandVaultArchive: {
    title: 'Brand colors, typography & logo',
    html: '<p>The palette draws from the marble quarries of northern Italy: natural stone tones plus our signature Ember.</p>'
      + '<h4>Primary palette</h4>'
      + '<div class="pg-swatches">'
      + '<div class="pg-swatch"><span style="background:#FFFFFF;border:1px solid rgba(45,42,42,0.15)"></span><b>White #FFFFFF</b> pure white for backgrounds and contrast</div>'
      + '<div class="pg-swatch"><span style="background:#EB4E19"></span><b>Ember #EB4E19</b> our signature brand color</div>'
      + '<div class="pg-swatch"><span style="background:#2D2A2A"></span><b>Grafite #2D2A2A</b> primary dark, use instead of pure black</div>'
      + '<div class="pg-swatch"><span style="background:#9A938E"></span><b>Nuvola #9A938E</b> mid-tone neutral</div>'
      + '<div class="pg-swatch"><span style="background:#59534F"></span><b>Ardesia #59534F</b> warm neutral alternative</div>'
      + '<div class="pg-swatch"><span style="background:#EDEBEA;border:1px solid rgba(45,42,42,0.15)"></span><b>Marmol #EDEBEA</b> light neutral</div>'
      + '</div>'
      + '<h4>Secondary accents, use sparingly</h4>'
      + '<div class="pg-swatches">'
      + '<div class="pg-swatch"><span style="background:#B2CDED"></span><b>Cielo #B2CDED</b></div>'
      + '<div class="pg-swatch"><span style="background:#A2C59B"></span><b>Moss #A2C59B</b> off-the-grid event</div>'
      + '<div class="pg-swatch"><span style="background:#9F73AB"></span><b>Lavender #9F73AB</b></div>'
      + '<div class="pg-swatch"><span style="background:#FFFF80"></span><b>Lemon #FFFF80</b></div>'
      + '</div>'
      + '<h4>Typography</h4>'
      + '<ul><li><b>Portrait Serif:</b> for moments that demand impact — headlines and large figures. Bold and Regular. Fallback when unavailable: PT Serif.</li>'
      + '<li><b>Manrope:</b> the workhorse for body copy and interface text, from paragraphs to UI. Bold and Medium. Default for all functional text.</li></ul>'
      + '<h4>Logo rules</h4>'
      + '<ul><li>Primary logo is the wordmark in <b>Ember</b> on light backgrounds; White on dark; Grafite as the light-background alternative.</li>'
      + '<li>Never alter proportions, colors or typeface; no effects, rotation or distortion.</li>'
      + '<li>Minimum size: 20px tall digital, 0.25in print. Give it clear breathing room.</li>'
      + '<li>The block icon is only for small spaces: social avatars, app icons, favicons, under 100px. Default to the full wordmark everywhere else.</li></ul>'
      + '<h4>Expressions</h4>'
      + '<ul><li><b>Halftone/stipple illustrations:</b> handcrafted, engraved aesthetic for portraits and editorial imagery.</li>'
      + '<li><b>Noise texture:</b> subtle grain over photos and color fields to add tactility.</li>'
      + '<li><b>Color blocks and patterns:</b> geometric blocks with angular cuts, derived from the logo, as graphic elements, image containers and backgrounds.</li>'
      + '<li><b>Block levels:</b> outline-to-solid blocks for process and progress visuals.</li></ul>'
      + '<h4>Assets</h4>'
      + '<div class="wk-links">'
      + '<a href="https://drive.google.com/drive/folders/1cJ_VECEbT53qVC7S660a7MvyvHc5fxp9" target="_blank" rel="noopener">Portrait font, Drive folder ↗</a>'
      + '<a href="https://fonts.google.com/specimen/Manrope" target="_blank" rel="noopener">Manrope on Google Fonts ↗</a>'
      + '<a href="https://fonts.google.com/specimen/PT+Serif" target="_blank" rel="noopener">PT Serif on Google Fonts ↗</a>'
      + '<a href="https://drive.google.com/drive/folders/1b5PzG1YinbMbLwIa8IOVPtJN-_SjSmqk" target="_blank" rel="noopener">Images, blocks and patterns, Drive folder ↗</a>'
      + '</div>'
  },
  teamRoundup: {
    title: 'Team Roundup',
    html: '<p>The monthly company-wide catch-up: wins, client updates, and where the business is heading. Everyone joins.</p>'
      + '<p>Agendas and recaps are archived after each session. Your manager will make sure the invite is on your calendar; if it is not there by week one, ask.</p>'
  },
  talentTeamMeeting: {
    title: 'Weekly Talent Jam',
    html: '<p>The full talent team syncs once a week: open roles across clients, process questions, hiring experiments worth copying, and team news.</p>'
      + '<p>If you are on the talent side you will be added to the invite in week one. Past jams are archived; day to day the conversation lives in #f-talent-general.</p>'
  },
  thisIsCarrara: {
    title: 'This is Carrara',
    html: '<p>The brand guidelines home: logo, color palette, typography and the elements that define the visual identity. It holds the most up-to-date branding, logos and templates.</p>'
      + '<p>Everything you can download (logos, banners, templates) is in the <a class="textlink" href="#/templates">Templates and brand</a> section of this hub, which stays in sync with the branding folder.</p>'
  }
};
