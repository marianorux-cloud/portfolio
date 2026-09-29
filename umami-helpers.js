(function () {
  "use strict";

  const ENGAGEMENT_KEY = "umami-consent-engagement";
  const WEBSITE_ID = "20473bbb-aaa3-4d65-a1da-4b8870e56e31";
  const REFUSED_MS = 600;
  const HIDE_FALLBACK_MS = 300;

  /* The :not() has to repeat per selector: in a comma list it would otherwise
     bind to [tabindex] alone, and a bare `input` would still match an input
     that is explicitly out of the tab order. */
  const FOCUSABLE_SELECTOR =
    'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

  function track(name, props) {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name, props);
    }
  }

  /* A throwing read must answer "opted in", same as an absent key. load() calls
     this at module top level, before window.Analytics is assigned, so a throw
     here aborts the rest of the file and every `if (window.Analytics)` guard in
     the repo goes false. The failure itself surfaces as an uncaught page error;
     it is the resulting loss of analytics that nothing reports. */
  function hasConsent() {
    try {
      return localStorage.getItem(ENGAGEMENT_KEY) !== "false";
    } catch {
      return true;
    }
  }

  function initPrivacyModal() {
    const modal = document.getElementById("privacy-modal");
    const trigger = document.querySelector(".footer__privacy-btn");
    const closeBtn = modal && modal.querySelector(".privacy-modal__close");
    const toggle = document.getElementById("toggle-engagement-tracking");
    const invasive = document.getElementById("toggle-invasive-tracking");
    if (!modal || !trigger || !closeBtn || !toggle) return;

    let hideTimer = null;
    let shouldBeOpen = false;

    toggle.checked = hasConsent();

    function open() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      modal.hidden = false;
      shouldBeOpen = true;
      requestAnimationFrame(() => {
        if (shouldBeOpen) modal.classList.add("privacy-modal--open");
      });
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      track("privacy-modal:open");
    }

    function close() {
      shouldBeOpen = false;
      modal.classList.remove("privacy-modal--open");
      document.body.style.overflow = "";
      trigger.focus();
      track("privacy-modal:close");
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        hideTimer = null;
        if (!modal.classList.contains("privacy-modal--open")) modal.hidden = true;
      }, HIDE_FALLBACK_MS);
    }

    /* Registered once, not per close: a once-listener is consumed by the first
       transitionend that bubbles up from a child (the switch track transitions
       too), which would leave the closed modal displayed and its controls in
       the tab order. */
    modal.addEventListener("transitionend", (e) => {
      if (e.target !== modal) return;
      if (modal.classList.contains("privacy-modal--open")) return;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      modal.hidden = true;
    });

    trigger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    modal.querySelector(".privacy-modal__overlay").addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("privacy-modal--open")) close();
    });

    modal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      if (!modal.classList.contains("privacy-modal--open")) return;
      const focusable = modal.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    toggle.addEventListener("change", () => {
      try {
        localStorage.setItem(ENGAGEMENT_KEY, toggle.checked ? "true" : "false");
      } catch {
        // Not persisted, but the switch keeps the new state for this session.
      }
      if (toggle.checked) load();
      track(toggle.checked ? "privacy-toggle:engagement:on" : "privacy-toggle:engagement:off", { enabled: toggle.checked });
    });

    if (invasive) {
      const row = invasive.closest(".privacy-switch");
      let timer;

      // Never enableable: revert the check, flash the row red, record the attempt.
      invasive.addEventListener("click", (e) => {
        e.preventDefault();
        invasive.checked = false;
        row.classList.add("privacy-switch--refused");
        clearTimeout(timer);
        timer = setTimeout(
          () => row.classList.remove("privacy-switch--refused"),
          REFUSED_MS,
        );
        track("privacy-toggle:invasive:click");
      });
    }
  }

  function load() {
    if (!hasConsent() || window.umami) return;
    var script = document.createElement("script");
    script.defer = true;
    script.src = "https://cloud.umami.is/script.js";
    script.setAttribute("data-website-id", WEBSITE_ID);
    // No `integrity` on purpose. cloud.umami.is is unversioned and served with
    // must-revalidate, so any pinned hash would break on the vendor's next
    // deploy. Because this tag is built at runtime, an integrity failure drops
    // the tracker with no page-load error. See ai/playbooks/verify-analytics.md.
    document.head.appendChild(script);
  }

  window.UmamiPrivacy = {
    reload: load,
    hasConsent: hasConsent,
    key: ENGAGEMENT_KEY,
  };

  load();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPrivacyModal);
  } else {
    initPrivacyModal();
  }

  window.Analytics = { track: track };
})();
