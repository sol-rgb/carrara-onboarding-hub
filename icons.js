/* Feather Icons, the hub's one source of icons.

   Version 4.29.2. MIT License, Copyright (c) 2013-2023 Cole Bemis.
   https://feathericons.com

   Only the icons the hub uses are here, each one the verbatim contents of
   feather-icons/dist/icons/<name>.svg with its <svg> wrapper left off: the
   wrapper is written once, below, so every icon is drawn the same way.
   Feather's own attributes are kept exactly -- viewBox 0 0 24 24, stroke-width 2,
   round caps and joins, fill none, stroke currentColor -- so an icon takes the
   colour and the size of the text it sits in.

   To use one: <span data-icon="arrow-up-right" aria-hidden="true"></span>.
   Markup that arrives later asks for its icons with Icons.draw(element). */

(function () {
  'use strict';

  var FEATHER = {
    'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline>',
    'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
    'minus': '<line x1="5" y1="12" x2="19" y2="12"></line>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"></polyline>',
    'x': '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
  };

  var OPEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

  /* An icon that is not in the set draws nothing rather than a broken box: a name
     that does not exist is a typo, and a typo should be visible in review, not on
     the page. It says so in the console once. */
  var missing = {};

  function draw(root) {
    var scope = root || document;
    [].forEach.call(scope.querySelectorAll('[data-icon]'), function (el) {
      if (el.firstElementChild) return;   /* drawn already */
      var name = el.getAttribute('data-icon');
      var body = FEATHER[name];
      if (!body) {
        if (!missing[name]) { missing[name] = true; console.warn('icons.js: no Feather icon named "' + name + '"'); }
        return;
      }
      el.innerHTML = OPEN + body + '</svg>';
    });
  }

  window.Icons = { draw: draw, names: Object.keys(FEATHER) };
  draw(document);
})();
