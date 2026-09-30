(function () {
  "use strict";

  const ENGAGEMENT_KEY = "umami-consent-engagement";
  const WEBSITE_ID = "20473bbb-aaa3-4d65-a1da-4b8870e56e31";
  const REFUSED_MS = 600;
  const HIDE_FALLBACK_MS = 300;

  /* The gate stops every event this codebase sends, and nothing more. It does
     not stop Umami's own pageview for the current page view: a third-party
     script that has already executed cannot be reliably unloaded, and removing
     its <script> element halts nothing, so do not add that. Without storage the
     choice also cannot survive a navigation — there is no way to carry it
     across a page-load boundary. */
  function track(name, props) {
    if (!hasConsent()) return;
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name, props);
    }
  }

  /* The user's own choice, which outranks storage in both directions so it
     still holds when the write below throws. null means no choice yet. */
  let consentOverride = null;

  /* A throwing read must answer "opted in", same as an absent key. load() calls
     this at module top level, before window.Analytics is assigned, so a throw
     here aborts the rest of the file and every `if (window.Analytics)` guard in
     the repo goes false. The failure itself surfaces as an uncaught page error;
     it is the resulting loss of analytics that nothing reports. */
  function hasConsent() {
    if (consentOverride !== null) return consentOverride;
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
      /* Same hidden-subtree filter as the lightbox, project modal and mobile
         menu (lightbox.js, project-modal.js, scripts.js): FOCUSABLE_SELECTOR
         screens out a removed tabindex only, so a control that is `hidden`
         while the modal is open would still land in the cycle. Test the
         attribute, not getComputedStyle — .btn--icon sets display:inline-flex
         and beats the UA [hidden] rule, so a computed-style check reports
         these as visible and the filter silently does nothing. The invasive
         toggle is excluded for a different and already-sufficient reason: it
         carries tabindex="-1", which the shared selector rejects. If the
         modal itself is hidden, every element filters out, length is 0, and
         the early return below handles it exactly as before. */
      const focusable = Array.from(
        modal.querySelectorAll(window.DialogUtil.FOCUSABLE_SELECTOR)
      ).filter((el) => !el.closest("[hidden]"));
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
      consentOverride = toggle.checked;
      try {
        localStorage.setItem(ENGAGEMENT_KEY, toggle.checked ? "true" : "false");
      } catch {
        // Not persisted. track() still honours the choice for this page view.
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
    // the tracker with no page-load error. See ai/tools-skills/procedures/analytics-verify.md.
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
