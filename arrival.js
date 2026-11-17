/* THE ARRIVAL -- a ticket.

   What this replaced was a sheet of glassine with a perforated strip you
   dragged to tear open: 370 lines of pointer maths to draw a tear that moved
   under your finger. The ticket says the same thing with a button, so almost
   all of that is gone. What is kept is the contract around it:

     - it is the way in, so it is shown every time someone enters at the root;
       landing deeper in -- a #/team link, a bookmark mid-read -- skips it,
       because that is not an arrival;
     - ?replay forces it anywhere, ?replay=0 skips it anywhere;
     - while it is up the page behind holds still and blurs (body.is-sealed).

   Figma: Carrara Website 2.0, node 383:1412. */

(function () {
  'use strict';

  var arrival = document.getElementById('arrival');
  if (!arrival) return;

  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sealed = false;

  /* The passenger is the hire, when the hub knows who that is: the welcome kit
     is stored under this key once they have entered their code, or once POps'
     ?code= link has unlocked it for them. Before that the ticket is simply
     made out to you.

     A ?code= link changes who that is, and app.js only learns the answer after
     the ticket is drawn. Until then the saved kit may be the last hire who used
     this browser, so while the link is in flight the ticket names nobody. A
     non-breaking space holds the line's height so the ticket does not jump
     when the name arrives. */
  function passenger() {
    if (window.CarraraKitPending) return '\u00a0';
    try {
      var saved = JSON.parse(localStorage.getItem('carrara_welcome') || 'null');
      var d = saved && saved.data;
      return (d && (d.name || d.firstName)) || 'You';
    } catch (e) { return 'You'; }
  }

  /* The design dates the ticket 11 . 18 . 2026. There is no start date in what
     POps mints -- the access code carries name, country, project, client and
     manager, and nothing else -- so the ticket is dated the day it is opened,
     which is the day the journey it is a ticket for begins. */
  function today() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return pad(d.getMonth() + 1) + '  .  ' + pad(d.getDate()) + '  .  ' + d.getFullYear();
  }

  function fill() {
    var nm = document.getElementById('tk-name');
    var dt = document.getElementById('tk-date');
    if (nm) nm.textContent = passenger();
    if (dt) dt.textContent = today();
  }

  function seal() {
    sealed = true;
    arrival.hidden = false;
    arrival.classList.remove('is-open');
    arrival.classList.add('is-loading');
    document.body.classList.add('is-sealed', 'is-loading');
    fill();
    if (window.ArrivalSky) window.ArrivalSky.start();
    window.scrollTo(0, 0);
    /* one frame to lay the ticket out before it is faded in, so it does not
       arrive half-drawn */
    requestAnimationFrame(function () {
      arrival.classList.remove('is-loading');
      /* The page behind stays hidden until the ticket is actually opaque. It
         used to come back on a timer that had to agree with a duration in the
         stylesheet and did not -- the ticket faded in over 620ms and the page
         was shown again at 400 -- so for a fifth of a second the checklist
         read straight through the ticket. `transitionend` knows when, and the
         timer is only the fallback for when no transition runs at all: a
         background tab never fires one, and neither does a browser that has
         already settled the property. */
      var guard = 0;
      function show() {
        clearTimeout(guard);
        arrival.removeEventListener('transitionend', onEnd);
        document.body.classList.remove('is-loading');
      }
      function onEnd(e) {
        if (e.target === arrival && e.propertyName === 'opacity') show();
      }
      if (reduced) { show(); return; }
      arrival.addEventListener('transitionend', onEnd);
      guard = setTimeout(show, 1200);
    });
  }

  function openUp() {
    if (!sealed) return;
    sealed = false;
    arrival.classList.add('is-open');
    document.body.classList.remove('is-sealed');
    if (window.ArrivalSky) window.ArrivalSky.stop();
    setTimeout(function () { arrival.hidden = true; }, reduced ? 0 : 640);
    /* Focus has to leave the ticket, because the ticket is about to be hidden
       and focus on a hidden element is focus nowhere. It goes to the TOP of the
       letter rather than to the first button: the button lives a long way down
       inside the checklist now, and focusing it scrolled the window to it, so
       the hub opened on the list instead of on the welcome. preventScroll says
       the same thing a second way, and the scroll is put at the top outright,
       because opening the hub is arriving at the beginning of it. */
    var first = document.getElementById('start-title')
      || document.querySelector('#view-start .btn-cover');
    if (first) {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }
    window.scrollTo(0, 0);
  }

  /* The name is filled again when the link's answer lands (a new kit is saved)
     and when the lookup settles either way. A failed lookup saves nothing, so
     the ticket falls back to whoever was saved before, or to you. */
  function refillName() {
    var nm = document.getElementById('tk-name');
    if (nm) nm.textContent = passenger();
  }
  window.addEventListener('carrara:kit-updated', refillName);
  window.addEventListener('carrara:kit-settled', refillName);

  var go = document.getElementById('tk-go');
  if (go) go.addEventListener('click', function (e) { e.preventDefault(); openUp(); });
  /* Escape is the other way in, for anyone who would rather not reach for it */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sealed) openUp();
  });

  /* the root is the hub with nothing after it, or its first step: the two
     addresses that mean someone is arriving rather than returning */
  function atTheRoot() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return h === '' || h === 'start';
  }
  function skip() {
    if (params.has('replay')) return params.get('replay') === '0';
    return !atTheRoot();
  }

  if (skip()) {
    arrival.hidden = true;
  } else {
    seal();
  }
})();
