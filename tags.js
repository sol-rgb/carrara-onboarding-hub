/* The nine business lines a client can be tagged with, and the rules that map
   the Client Codex onto them. One file so the site and the weekly refresh job
   can never disagree about what a client is.

   Notion's "Project Type" is close but not identical to the nine: it carries
   Managed Services and Strategic Finance, splits nothing for Marketing/Growth,
   and has no concept of a special situation. Everything else in the codex row
   (the engagement bullets, the about line) is used to fill those gaps. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TAGS = api;
}(typeof window !== 'undefined' ? window : null, function () {

  var LINES = [
    'Embedded Recruiting', 'Executive Search', 'Talent Platform', 'People Ops',
    'Finance', 'Marketing', 'Growth', 'BizOps', 'Special Situations'
  ];

  /* Notion Project Type -> one or more of the nine. Marketing/Growth is a single
     Notion option but two tags here, so it maps to both and the engagement text
     narrows it below when it clearly leans one way. */
  var FROM_NOTION = {
    'embedded recruiting': ['Embedded Recruiting'],
    'executive search': ['Executive Search'],
    'talent platform': ['Talent Platform'],
    'people': ['People Ops'],
    'people ops': ['People Ops'],
    'finance': ['Finance'],
    'strategic finance': ['Finance'],
    'bizops': ['BizOps'],
    'biz ops': ['BizOps'],
    'managed services': ['BizOps'],
    'marketing/growth': ['Marketing', 'Growth'],
    'marketing': ['Marketing'],
    'growth': ['Growth']
  };

  /* Phrases in the engagement or about text that mean a line even when Notion
     never tagged it. Kept deliberately narrow: a false tag is worse than none. */
  var FROM_TEXT = [
    ['Special Situations', /\b(spin[- ]?out|spun out|joint venture|acquisition|acquired|m&a|diligence|incubat|zero[- ]to[- ]one|0 to 1|holdco|entity creation|new venture)\b/i],
    ['Executive Search', /\b(executive search|c-suite|exec search|founding (cto|cfo|cpo)|leadership search)\b/i],
    ['People Ops', /\b(people ops|onboarding|payroll|benefits|hris|rippling|401k|handbook|compliance)\b/i],
    ['Finance', /\b(bookkeep|month(ly)? close|fp&a|forecast|board (materials|reporting)|unit economics|ap\/ar)\b/i],
    ['Marketing', /\b(brand|narrative|comms|content|paid media|creative|employer brand|case stud|social)\b/i],
    ['Growth', /\b(growth|funnel|acquisition channel|seo|aeo|performance marketing|conversion|top of funnel)\b/i],
    ['Embedded Recruiting', /\b(embedded recruit|sourcing|pipeline|candidate|hiring (sprint|event)|recops|recruiter)\b/i],
    ['Talent Platform', /\b(talent platform|comp bands|leveling|interview architecture|hiring plan|talent strategy|ats)\b/i],
    ['BizOps', /\b(bizops|biz ops|headcount model|operating cadence|chief of staff|special projects|analytics|dashboard)\b/i]
  ];

  function order(tags) {
    return LINES.filter(function (l) { return tags.indexOf(l) !== -1; });
  }

  /* codexEntry: { projectTypes, engagement, about }. fallback: clients.json work[]. */
  function forClient(codexEntry, fallbackWork) {
    var e = codexEntry || {};
    var out = [];
    function add(t) { if (t && out.indexOf(t) === -1) out.push(t); }

    var declared = (e.projectTypes && e.projectTypes.length) ? e.projectTypes : (fallbackWork || []);
    declared.forEach(function (t) {
      (FROM_NOTION[String(t).trim().toLowerCase()] || []).forEach(add);
    });

    var text = [e.about || ''].concat(e.engagement || [], declared).join(' . ');
    FROM_TEXT.forEach(function (rule) {
      if (rule[1].test(text)) add(rule[0]);
    });

    return order(out);
  }

  return { LINES: LINES, forClient: forClient };
}));
