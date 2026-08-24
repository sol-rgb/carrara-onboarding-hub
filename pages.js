/* Popup content for destinations that used to live on Notion.
   Snapshot taken from Notion on Jul 24, 2026 — edit here, or ask Claude to
   re-snapshot. Keys match links.js; anything with an entry here opens as an
   in-hub popup instead of linking out. */
window.PAGES = {
  timeOffPolicy: {
    title: 'Time-Off & Holiday Policy',
    html: '<p>We operate at a high level, which means we also need time to reset. Time off is built on trust, responsibility and impact:</p>'
      + '<ul><li>Take time off before you need it, not once you are already burned out.</li>'
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
      + '<ul><li><b>Portrait Serif:</b> headlines and large figures. Bold and Regular. Fallback when unavailable: PT Serif.</li>'
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
      + '<div class="wk-links">'
      + '<a href="https://app.notion.com/p/carrara/Roundup-Archive-13d6b1a6e6e780a6bc3ff12e110e42b0" target="_blank" rel="noopener">Roundup Archive on Notion ↗</a>'
      + '</div>'
  },
  talentTeamMeeting: {
    title: 'Weekly Talent Jam',
    html: '<p>The full talent team syncs once a week: open roles across clients, process questions, hiring experiments worth copying, and team news.</p>'
      + '<p>If you are on the talent side you will be added to the invite in week one. Past jams are archived; day to day the conversation lives in #f-talent-general.</p>'
  },
  skuEmbeddedRecruiting: {
    title: 'Embedded Recruiting',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Operates as an extension of the client’s team, using data and tight operating cadences to improve hiring speed, quality, and candidate experience.</li>'
      + '<li>Runs the full recruiting workflow: sourcing, outreach, screening, candidate management, interview coordination, and closing support.</li>'
      + '<li>Adds dedicated recruiting capacity against a defined set of roles, functions, or hiring goals.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="a16z|Altana|Hinge|Modal Labs|Runlayer|Profound"></div>'
  },
  skuTalentPlatform: {
    title: 'Talent Platform',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Acts as a fractional Head of Talent, owning the strategy and operating system behind the entire talent function rather than simply filling roles.</li>'
      + '<li>Builds hiring plans, role prioritization, assessment processes, interview architecture, recruiting analytics, tooling, and agency strategy.</li>'
      + '<li>Improves the broader talent proposition through candidate experience, talent brand, compensation inputs, onboarding design, and stronger talent-density decisions.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="Hinge|Modal Labs|Altana|Runlayer|Profound|Untitled"></div>'
  },
  skuExecutiveSearch: {
    title: 'Executive Search',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Runs high-touch searches for mission-critical leadership roles, typically at the C-suite, VP, or other highly specialized level.</li>'
      + '<li>Develops the success profile, maps the market, activates Carrara’s network, conducts targeted outreach, and manages assessment, references, and closing.</li>'
      + '<li>Usually builds on an existing Carrara relationship, giving the search team a deeper understanding of the client’s strategy, culture, and leadership needs than a standalone search firm would have.</li>'
      + '</ul>'
      + '<p class="pg-clients">Searches usually grow out of an account we already run, so ask the client lead rather than looking for a standalone list.</p>'
  },
  skuPeopleOps: {
    title: 'People Ops',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Builds and runs the infrastructure supporting employees after they join: contracts, onboarding, offboarding, payroll, benefits, HR systems, policies, and compliance.</li>'
      + '<li>Supports higher-order people strategy, including headcount planning, compensation philosophy and pay bands, performance management, engagement, and people analytics.</li>'
      + '<li>Designs systems and automations that can scale with the company, then helps transition ownership to an internal team when appropriate.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="Modal Labs|Profound|Magic AI|Fundamental Technologies"></div>'
  },
  skuFinance: {
    title: 'Finance',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Provides an embedded finance function spanning bookkeeping, monthly close, AP/AR, management reporting, forecasting, budgeting, and KPI dashboards.</li>'
      + '<li>Acts as a strategic finance partner on unit economics, pricing, capital allocation, growth planning, board reporting, fundraising, and investor readiness.</li>'
      + '<li>Supports major transactions and inflection points, including M&amp;A diligence and execution, post-acquisition integration, scenario modeling, and building the eventual in-house finance team.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="Bee AI|Deeptune|Luminai"></div>'
  },
  skuBizOps: {
    title: 'BizOps',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Takes the important, ambiguous problems that do not sit inside any one department. Internally this is the special projects team.</li>'
      + '<li>Reads the business across product, customers, GTM, operations, finance and org design, works out which problems matter most, then goes and fixes them.</li>'
      + '<li>Can operate as a fractional Chief of Staff, Head of Ops, Head of Strategy or cross-functional delivery team, building the processes, systems, automations and operating cadences, and keeping the work moving.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="a16z|Brave Health|Hertz|Basis"></div>'
  },
  skuMarketingGrowth: {
    title: 'Marketing and Growth',
    eyebrow: '',
    note: '',
    html: '<ul>'
      + '<li>Finds what is holding growth back across positioning, acquisition, activation, retention, monetization and go-to-market, then fixes it.</li>'
      + '<li>Work can include product launches, growth strategy, funnel and channel audits, performance marketing, pricing, lifecycle campaigns, brand and narrative, creative, and GTM operations.</li>'
      + '<li>Carrara assembles the right mix of strategists, performance marketers, designers, writers, analysts, and product or engineering talent to launch experiments, measure results, and scale what works.</li>'
      + '</ul>'
      + '<div class="pg-clients" data-clients="Modal Labs|Village Global|Grindr|Better|Sphere"></div>'
  },
  bvLogo: {
    title: 'Logo',
    eyebrow: '[brand vault]',
    note: 'Source files live on Drive. Those links are marked inside.',
    html: '<div class="pg-brand">'
      + '<p class="body-copy">The Carrara logo is inspired by Carrara marble and the centuries-old craft of turning raw stone into art. The wordmark\'s geometric letterforms carry angular cuts and subtle interior curves that echo a sculptor\'s chisel against marble. The modular block system represents the raw material itself: solid forms waiting to be shaped. Like Michelangelo believed the statue already existed within the block, we see potential in foundations that need the right craft to be revealed.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/logo-main.jpg" alt="Carrara logo, main application" loading="lazy"><figcaption>Main application. Ember on light, white on dark, black on light as an alternative.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/logo-secondary.jpg" alt="Carrara logo in the secondary palette" loading="lazy"><figcaption>Secondary applications: Cielo, Moss, Lavender, Lemon and Nuvola. Use sparingly, for events, merch and campaigns.</figcaption></figure>'
      + '<div class="bv-cols">'
      + '<div><h4 class="bv-sh">Using it</h4><ul class="bv-ul">'
      + '<li>Always preserve the logo\'s integrity. Shape, proportions, color and typeface stay unaltered.</li>'
      + '<li>Give it breathing room. It should never feel crowded.</li>'
      + '<li>Minimum size: 20px high on digital, 0.25 inches in print.</li>'
      + '</ul></div>'
      + '<div><h4 class="bv-sh">Never</h4><ul class="bv-ul">'
      + '<li>Alter the proportions</li>'
      + '<li>Change the colors</li>'
      + '<li>Add effects or modifications</li>'
      + '<li>Rotate or distort it</li>'
      + '</ul></div>'
      + '</div>'
      + '<h4 class="bv-sh">The icon</h4>'
      + '<p class="body-copy">A simplified mark derived from the modular block in the logo architecture. It is reserved for places the full wordmark cannot go: social profile pictures, app icons, favicons, spaces under 100px, and animation or loading states. Everywhere else, including presentations, documents and marketing, default to the full wordmark.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/logo-icon.jpg" alt="The Carrara block icon" loading="lazy"><figcaption>The block icon, in Ember and Grafite, on light and dark grounds.</figcaption></figure>'
      + '<p class="bv-assets"><b>Source files</b> <a href="https://drive.google.com/drive/folders/1AJKXCRdQ0kZn4OQLbMCx1Z05-q40_HKr?usp=sharing" target="_blank" rel="noopener">Logo, PNG and SVG on Drive ↗</a></p>'
      + '</div>'
  },
  bvTypography: {
    title: 'Typography',
    eyebrow: '[brand vault]',
    note: 'Source files live on Drive. Those links are marked inside.',
    html: '<div class="pg-brand">'
      + '<p class="body-copy">Two typefaces, each with a job. <b>Portrait Serif</b> is for moments that need impact: headlines, large figures, anywhere the brand should speak confidently. Bold and Regular. <b>Manrope</b> is the workhorse for body copy and interface text, clean and highly legible, and the default for all functional text. Bold and Medium. When Portrait is not available, for instance in a document without the font licence, fall back to <b>PT Serif</b>.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/type-combination.jpg" alt="Portrait and Manrope in combination" loading="lazy"><figcaption>Portrait for the statement, Manrope for everything that has to be read.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/type-fallback.jpg" alt="Fallback typography" loading="lazy"><figcaption>PT Serif as the Portrait fallback.</figcaption></figure>'
      + '<p class="bv-assets"><b>Source files</b>'
      + '<a href="https://drive.google.com/drive/folders/1cJ_VECEbT53qVC7S660a7MvyvHc5fxp9?usp=sharing" target="_blank" rel="noopener">Portrait on Drive ↗</a>'
      + '<a href="https://fonts.google.com/specimen/Manrope" target="_blank" rel="noopener">Manrope on Google Fonts ↗</a>'
      + '<a href="https://fonts.google.com/specimen/PT+Serif" target="_blank" rel="noopener">PT Serif on Google Fonts ↗</a></p>'
      + '</div>'
  },
  bvColor: {
    title: 'Color',
    eyebrow: '[brand vault]',
    note: 'Source files live on Drive. Those links are marked inside.',
    html: '<div class="pg-brand">'
      + '<p class="body-copy">The palette draws on the marble quarries of northern Italy: quarry neutrals plus Ember as the signature. This is the default for everyday work, presentations, documents, web and marketing.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/color-primary.jpg" alt="Primary palette" loading="lazy"><figcaption>Primary palette.</figcaption></figure>'
      + '<div class="scroll"><table class="bv-table">'
      + '<thead><tr><th>Color</th><th>Hex</th><th>Use</th></tr></thead>'
      + '<tbody>'
      + '<tr><td><span class="sw" style="background:#FFFFFF;border:1px solid var(--hairline)"></span>White</td><td>#FFFFFF</td><td>Backgrounds and contrast</td></tr>'
      + '<tr><td><span class="sw" style="background:#EB4E19"></span>Ember</td><td>#EB4E19</td><td>Our signature brand color</td></tr>'
      + '<tr><td><span class="sw" style="background:#2D2A2A"></span>Grafite</td><td>#2D2A2A</td><td>Primary dark, used instead of pure black</td></tr>'
      + '<tr><td><span class="sw" style="background:#9A938E"></span>Nuvola</td><td>#9A938E</td><td>Mid-tone neutral</td></tr>'
      + '<tr><td><span class="sw" style="background:#59534F"></span>Ardesia</td><td>#59534F</td><td>Warm neutral alternative</td></tr>'
      + '<tr><td><span class="sw" style="background:#EDEBEA"></span>Marmol</td><td>#EDEBEA</td><td>Light neutral</td></tr>'
      + '</tbody>'
      + '</table></div>'
      + '<h4 class="bv-sh">Secondary accents</h4>'
      + '<p class="body-copy">For special occasions, merchandise, event branding and campaigns. Use them intentionally and sparingly.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/color-accent.jpg" alt="Accent palette" loading="lazy"><figcaption>Accent palette.</figcaption></figure>'
      + '<div class="scroll"><table class="bv-table">'
      + '<thead><tr><th>Color</th><th>Hex</th><th>Use</th></tr></thead>'
      + '<tbody>'
      + '<tr><td><span class="sw" style="background:#B2CDED"></span>Cielo</td><td>#B2CDED</td><td></td></tr>'
      + '<tr><td><span class="sw" style="background:#A2C59B"></span>Moss</td><td>#A2C59B</td><td>Off-the-grid event</td></tr>'
      + '<tr><td><span class="sw" style="background:#9F73AB"></span>Lavender</td><td>#9F73AB</td><td></td></tr>'
      + '<tr><td><span class="sw" style="background:#FFFF80"></span>Lemon</td><td>#FFFF80</td><td></td></tr>'
      + '</tbody>'
      + '</table></div>'
      + '<p class="body-copy muted" style="font-size:13px">Each family also carries shades from 50 to 950 following Tailwind conventions, for UI states, depth and hierarchy.</p>'
      + '</div>'
  },
  bvExpressions: {
    title: 'Expressions',
    eyebrow: '[brand vault]',
    note: 'Source files live on Drive. Those links are marked inside.',
    html: '<div class="pg-brand">'
      + '<p class="body-copy">Beyond logo, type and color, the system includes graphic elements and treatments that give our communications flexibility and character.</p>'
      + '<figure class="bv-fig"><img src="/assets/brand/expr-illustration.jpg" alt="Halftone illustration" loading="lazy"><figcaption><b>Halftone illustrations.</b> A stipple treatment that reads handcrafted and engraved. Used for editorial imagery, iconography and decorative elements.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/expr-texture.jpg" alt="Noise texture" loading="lazy"><figcaption><b>Texture overlay.</b> A subtle noise applied to photography, backgrounds and large color fields. It softens digital precision without losing the brutalist edge.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/expr-blocks.jpg" alt="Color blocks" loading="lazy"><figcaption><b>Color blocks.</b> Geometric blocks with angular cuts, derived from the logo architecture. Standalone graphics, image containers, or framing devices.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/expr-block-pattern.jpg" alt="Block pattern" loading="lazy"><figcaption><b>Block pattern.</b> The blocks repeated for backgrounds and dividers, keeping the irregular quality of stacked marble.</figcaption></figure>'
      + '<figure class="bv-fig"><img src="/assets/brand/expr-photography.jpg" alt="Quarry photography" loading="lazy"><figcaption><b>Photography library.</b> Curated Carrara quarry photography, anchoring the identity in the landscape that inspired it.</figcaption></figure>'
      + '<h4 class="bv-sh">Block levels</h4>'
      + '<p class="body-copy">A visual system for stages of work, from empty outline blocks to fully solid ones. It connects to the idea of revealing potential inside raw material, and is used for process visualisation, progress indicators and infographics.</p>'
      + '<h4 class="bv-sh">AI prompts</h4>'
      + '<p class="body-copy">We use AI imagery to extend the visual language while staying on brand. These prompts are tuned to our halftone aesthetic.</p>'
      + '<p class="bv-lbl">Stipple illustrations</p>'
      + '<pre class="bv-code">Create an image of [subject], brutalism style, stippled dots technique, high contrast, monochromatic black and white, dramatic lighting, detailed features, artistic illustration. Composition must be balanced and sculptural.</pre>'
      + '<ul class="bv-ul">'
      + '<li>Works well for: "a woman and a man working on a big block of Carrara marble", "a person using traditional carving tools", "hands sculpting stone"</li>'
      + '<li>Tool: Midjourney. Style references: stippled dots, pointillism, brutalism.</li>'
      + '<li>Always specify monochromatic, high contrast, dramatic lighting, and state the background (black or white) at the start of the prompt.</li>'
      + '<li>Generated images should feel handcrafted, not digitally smooth. Use them for proposals and presentations when photography is not available.</li>'
      + '</ul>'
      + '<p class="bv-lbl">Team member portraits</p>'
      + '<pre class="bv-code">Professional portrait illustration of the exact person from reference image, head and shoulders composition, artistic interpretation in pointillism stippled dots technique, high contrast black and white, dramatic side lighting, organic stippling with natural transitions to background, artistic freedom in hair and edge details while maintaining core facial features and expression from reference, handcrafted engraving aesthetic. Portrait crop from mid-chest up.</pre>'
      + '<ul class="bv-ul">'
      + '<li>These are hard to get right. AI tends to beautify or alter facial features.</li>'
      + '<li>Push back in the prompt: "preserve original facial features", "no modifications", "raw authentic likeness". Expect several attempts.</li>'
      + '<li>The Nano Banana model tends to hold likeness better.</li>'
      + '<li>Use a close-up reference with good lighting, front-facing or slightly angled, no group shots or busy backgrounds. The clearer the reference, the more faithful the output.</li>'
      + '</ul>'
      + '<p class="bv-assets"><b>Source files</b>'
      + '<a href="https://drive.google.com/drive/folders/1b5PzG1YinbMbLwIa8IOVPtJN-_SjSmqk?usp=drive_link" target="_blank" rel="noopener">Images on Drive ↗</a>'
      + '<a href="https://drive.google.com/drive/folders/1b5PzG1YinbMbLwIa8IOVPtJN-_SjSmqk?usp=sharing" target="_blank" rel="noopener">Blocks and patterns on Drive ↗</a></p>'
      + '</div>'
  },
  thisIsCarrara: {
    title: 'This is Carrara',
    html: '<p>The brand guidelines home: logo, color palette, typography and the elements that define the visual identity. It holds the most up-to-date branding, logos and templates.</p>'
      + '<p>Everything you can download (logos, banners, templates) is in the <a class="textlink" href="#/templates">Templates and brand</a> section of this hub, which stays in sync with the branding folder.</p>'
  }
};
