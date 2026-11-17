/* Checklist progress saved in POps (roadmap #114): the page's decisions.
 *
 * Pure logic only, like my-onboarding.js: no DOM, no localStorage, no fetch.
 * app.js owns all three and passes their contents in, which is what lets
 * scripts/verify-checklist.js require this file in Node and drive every
 * decision directly. Loaded in the browser as a plain script that sets one
 * global, window.ChecklistSync, before app.js.
 *
 * Three modes, decided from what /api/checklist answers:
 *   local   no kit, role "unknown", or any failure: today's checklist, ticks
 *           in the browser (carrara_checklist) only
 *   hire    POps holds the ticks; the browser keeps a copy and saves the
 *           full set to POps shortly after each change
 *   viewer  someone else opened the hire's link: the hire's ticks, read only,
 *           and the viewer's own browser ticks are never read or written
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.ChecklistSync = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* POps' rule for an item id. Every CHECKLIST id must fit it (verified). */
  var ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
  /* Both flags hold the access code they belong to, so a different code on
     the same browser never inherits them. app.js clears both on a kit reset. */
  var SYNCED_KEY = 'carrara_checklist_synced';   /* the first sync happened */
  var PENDING_KEY = 'carrara_checklist_unsaved'; /* ticks POps may not have yet */
  var DEBOUNCE_MS = 800;

  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }

  /* [{ id, t }] in CHECKLIST order. */
  function itemsOf(checklist) {
    var out = [];
    (checklist || []).forEach(function (g) {
      (g.items || []).forEach(function (it) { out.push({ id: it.id, t: it.t }); });
    });
    return out;
  }

  function modeOf(answer) {
    if (!isObj(answer)) return 'local';
    return answer.role === 'hire' || answer.role === 'viewer' ? answer.role : 'local';
  }

  /* POps' { id: time } as the page's { 'k:id': true }, known items only. */
  function stateFromDone(done, keys) {
    var out = {};
    if (!isObj(done)) return out;
    (keys || []).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(done, k.slice(2))) out[k] = true;
    });
    return out;
  }

  function flagSet(stored, code) { return typeof stored === 'string' && stored === code; }

  /* What the list shows after /api/checklist answers, and whether to save it.
     local and pending are the browser's ticks and the "not saved yet" flag. */
  function decideLoad(o) {
    var mode = modeOf(o.answer);
    if (mode === 'local') return { mode: mode, state: o.local, save: false };
    var remote = stateFromDone(o.answer.done, o.keys);
    if (mode === 'viewer') return { mode: mode, state: remote, save: false };
    var local = o.local || {};
    if (!o.synced) {
      /* first sync in this browser: nobody who already ticked restarts at zero */
      var union = {};
      (o.keys || []).forEach(function (k) { if (local[k] || remote[k]) union[k] = true; });
      return { mode: mode, state: union, save: true };
    }
    if (o.pending) {
      /* the browser has ticks POps may not: they win over an older answer */
      var mine = {};
      (o.keys || []).forEach(function (k) { if (local[k]) mine[k] = true; });
      return { mode: mode, state: mine, save: true };
    }
    return { mode: mode, state: remote, save: false };
  }

  /* The body's save: the full current set, ids without the k: prefix. */
  function savePayload(state, items) {
    var done = [];
    (items || []).forEach(function (it) {
      if (state && state['k:' + it.id]) done.push({ id: it.id, label: String(it.t).slice(0, 160) });
    });
    return { done: done, total: (items || []).length };
  }

  /* How the page reads the answer to a save. 403 { refused: true } is the
     handler's one refusal: stop saving. Anything else that is not the hire's
     progress is a failed save, kept as "not saved yet". */
  function saveOutcome(status, body) {
    if (status === 403 && isObj(body) && body.refused === true) return 'refused';
    if (status === 200 && isObj(body) && body.role === 'hire') return 'saved';
    return 'failed';
  }

  /* The checklist popup's line for a viewer. Plain text (app.js sets textContent). */
  function ownerNote(firstName) {
    var n = String(firstName || '').trim();
    return n ? 'This is ' + n + '\'s checklist. Only ' + n + ' can tick items.'
      : 'This is someone else\'s checklist. Only they can tick items.';
  }

  /* The cover list's title and intro line for a viewer. Plain text: app.js
     escapes them where it writes them into HTML. */
  function ownerTitle(firstName) {
    var n = String(firstName || '').trim();
    return n ? n + '\'s checklist' : 'Their checklist';
  }
  function ownerOnly(firstName) {
    var n = String(firstName || '').trim();
    return 'Only ' + (n || 'they') + ' can tick items.';
  }

  /* Saves shortly after the last change, one in flight at a time; send()
     reads the state when it runs, so the latest state always wins.
     send() returns (a promise of) 'saved' | 'failed' | 'refused'.
     onDone(outcome, busy): busy is true when another save is still coming. */
  function createSaver(opts) {
    var delay = opts.delay == null ? DEBOUNCE_MS : opts.delay;
    var setT = opts.setTimer || function (f, ms) { return setTimeout(f, ms); };
    var clearT = opts.clearTimer || function (t) { clearTimeout(t); };
    var timer = null, inFlight = false, again = false, stopped = false;

    function busy() { return !stopped && (!!timer || inFlight || again); }
    function fire() {
      if (timer) { clearT(timer); timer = null; }
      if (stopped) return;
      if (inFlight) { again = true; return; }
      inFlight = true;
      var p;
      try { p = Promise.resolve(opts.send()); } catch (e) { p = Promise.resolve('failed'); }
      p.then(null, function () { return 'failed'; }).then(function (outcome) {
        inFlight = false;
        if (outcome === 'refused') stopped = true;
        var more = again && !stopped;
        again = false;
        if (more) fire();
        if (opts.onDone) opts.onDone(outcome, busy());
      });
    }
    return {
      queue: function () {
        if (stopped) return;
        if (timer) clearT(timer);
        timer = setT(function () { timer = null; fire(); }, delay);
      },
      now: fire,
      busy: busy,
      stop: function () { stopped = true; if (timer) { clearT(timer); timer = null; } }
    };
  }

  return {
    ID_RE: ID_RE,
    SYNCED_KEY: SYNCED_KEY,
    PENDING_KEY: PENDING_KEY,
    DEBOUNCE_MS: DEBOUNCE_MS,
    itemsOf: itemsOf,
    modeOf: modeOf,
    stateFromDone: stateFromDone,
    flagSet: flagSet,
    decideLoad: decideLoad,
    savePayload: savePayload,
    saveOutcome: saveOutcome,
    ownerNote: ownerNote,
    ownerTitle: ownerTitle,
    ownerOnly: ownerOnly,
    createSaver: createSaver
  };
});
