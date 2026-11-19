/**
 * Focus helpers shared by every dialog on the site.
 *
 * Load order: this file must load before umami-helpers.js, project-modal.js,
 * lightbox.js and scripts.js on every page. It comes after theme-init.js,
 * which is declared in <head> and does not use it. The consumers read these
 * members at interaction time, not at load, so a failure here is DEFERRED:
 * the page loads clean, and the first Tab inside any dialog throws a TypeError
 * reading FOCUSABLE_SELECTOR off undefined. There are deliberately no local
 * fallback copies in the consumers to absorb that: a silent fallback is how
 * the four copies drifted apart in the first place.
 */
(function () {
  "use strict";

  /* The :not() has to repeat per selector: in a comma list it would otherwise
     bind to [tabindex] alone, and a bare `input` would still match an input
     that is explicitly out of the tab order. */
  const FOCUSABLE_SELECTOR =
    'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

  /* Shared pre-check for a focus-restore target. Rejects document.body
     because .focus() cannot move focus to it in Chrome, and rejects
     disconnected nodes because focusing a detached element is a silent no-op
     that strands focus on body. This is a function, not a value: the
     `el !== document.body` comparison has to run against the live document
     on every call, not once at load. */
  function isRestorable(el) {
    return (
      el &&
      el !== document.body &&
      el.isConnected &&
      typeof el.focus === "function"
    );
  }

  window.DialogUtil = { FOCUSABLE_SELECTOR, isRestorable };
})();
