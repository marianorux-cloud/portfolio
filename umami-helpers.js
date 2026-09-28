(function () {
  "use strict";

  const ENGAGEMENT_KEY = "umami-consent-engagement";
  const WEBSITE_ID = "20473bbb-aaa3-4d65-a1da-4b8870e56e31";
  const REFUSED_MS = 600;

  function track(name, props) {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name, props);
    }
  }

  function hasConsent() {
    return localStorage.getItem(ENGAGEMENT_KEY) !== "false";
  }

  function initPrivacyModal() {
    const modal = document.getElementById("privacy-modal");
    const trigger = document.querySelector(".footer__privacy-btn");
    const closeBtn = modal && modal.querySelector(".privacy-modal__close");
    const toggle = document.getElementById("toggle-engagement-tracking");
    const invasive = document.getElementById("toggle-invasive-tracking");
    if (!modal || !trigger || !closeBtn || !toggle) return;

    toggle.checked = hasConsent();

    function open() {
      modal.hidden = false;
      requestAnimationFrame(() => {
        modal.classList.add("privacy-modal--open");
      });
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      track("privacy-modal:open");
    }

    function close() {
      modal.classList.remove("privacy-modal--open");
      document.body.style.overflow = "";
      trigger.focus();
      track("privacy-modal:close");
      modal.addEventListener(
        "transitionend",
        function onEnd(e) {
          if (e.target !== modal) return;
          modal.removeEventListener("transitionend", onEnd);
          if (!modal.classList.contains("privacy-modal--open")) modal.hidden = true;
        },
        { once: true },
      );
    }

    trigger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    modal.querySelector(".privacy-modal__overlay").addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("privacy-modal--open")) close();
    });

    toggle.addEventListener("change", () => {
      localStorage.setItem(ENGAGEMENT_KEY, toggle.checked ? "true" : "false");
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
