/* Central link map: the one place to add or fix a destination.
   Everything JS-rendered (checklist, channels, palette, welcome kit hooks)
   reads from here. Keys with '' are known destinations we don't have a URL
   for yet: fill them in and the UI picks them up automatically. */
window.LINKS = {
  slackWorkspace: 'https://carrarais.slack.com',

  /* Slack channel IDs -> deep links via channelUrl() */
  channels: {
    'g-announcements': 'C27MYMF3K',
    'g-no-dumb-questions': 'C08A7K39DT4',
    'g-ooo': 'C08LWESBUFL',
    'g-team-updates': 'C08ALADLNE5',
    'g-hired': 'C08A4QX41PF',
    'g-amplify': 'C08AWEBKY8G',
    'g-celebrations': 'C0BBFHQ5929',
    'g-brainstorm': 'C08A115NCQN',
    'g-share-the-goods': 'C099Q8FFQH2',
    'w-ideas-library': 'C084279TZ8S',
    'f-talent-general': 'C07EXB3TX5H',
    'g-ashby-support': 'C083UPPKC4W',
    'f-company-ops-general': 'C08A7KYJTEE'
  },

  /* Notion */
  notionHomeBase: 'https://app.notion.com/p/a0d65c510b1344b59b5fea56210ecd4b',
  quarry: 'https://app.notion.com/p/34b6b1a6e6e780f6b170e6a9124c7fd4',
  brandVault: 'https://app.notion.com/p/1516b1a6e6e78010be78fef3dd8e4b7b',
  brandVaultArchive: 'https://app.notion.com/p/3996b1a6e6e7802c85def97c8ba20631',
  teamRoundup: 'https://app.notion.com/p/13d6b1a6e6e780a6bc3ff12e110e42b0',
  talentTeamMeeting: 'https://app.notion.com/p/1ab6b1a6e6e78087a25fe67b3ccb2f5c',
  timeOffPolicy: 'https://app.notion.com/p/1146b1a6e6e780f29e3aeda26a9f91f8',
  coordinatorOOO: 'https://app.notion.com/p/35f6b1a6e6e7817084d7df4fa8c79e4b',
  thisIsCarrara: 'https://app.notion.com/p/2bc6b1a6e6e78024bc4ac3dd7cfb3833',

  /* Tools and systems */
  ashby: 'https://app.ashbyhq.com',
  deel: 'https://app.deel.com',
  bill: 'https://app.bill.com',
  ramp: 'https://app.ramp.com',
  granola: 'https://granola.ai',

  /* Carrara web */
  site: 'https://www.carrara.is',
  ideas: 'https://www.carrara.is/ideas',
  letter: 'https://www.carrara.is/ideas/focus-on-the-work-by-carrara',

  /* Known destinations, URL still needed — fill these in */
  top5Form: '',
  peoplePavilion: '',
  waysOfWorking: '',
  companyContext: '',
  peopleMgmtTips: '',
  openRoles: '',
  timeTracking: ''
};
window.channelUrl = function (name) {
  var id = window.LINKS.channels[name.replace(/^#/, '')];
  return id ? window.LINKS.slackWorkspace + '/archives/' + id : '';
};
