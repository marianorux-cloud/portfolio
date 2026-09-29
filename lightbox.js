(function () {
  "use strict";

  const LIGHTBOX_IMG_ID = "lightbox__img";

  /* ── DOM creation ── */
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image preview");
  lightbox.setAttribute("aria-describedby", LIGHTBOX_IMG_ID);
  lightbox.hidden = true;

  const backdrop = document.createElement("div");
  backdrop.className = "lightbox__backdrop";
  lightbox.appendChild(backdrop);

  lightbox.innerHTML += `
    <button class="lightbox__close btn--icon" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"/>
      </svg>
    </button>
    <img class="lightbox__img" id="lightbox__img" alt="">
    <button class="lightbox__prev btn--icon" aria-label="Previous image">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"/>
      </svg>
    </button>
    <button class="lightbox__next btn--icon" aria-label="Next image">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.1716 10.9999H4V12.9999H16.1716L10.8076 18.3638L12.2218 19.778L20 11.9999L12.2218 4.22168L10.8076 5.63589L16.1716 10.9999Z"/>
      </svg>
    </button>
    <div class="lightbox__counter sr-only" aria-live="polite"></div>
  `;

  const imgEl = lightbox.querySelector(".lightbox__img");
  const closeEl = lightbox.querySelector(".lightbox__close");
  const prevEl = lightbox.querySelector(".lightbox__prev");
  const nextEl = lightbox.querySelector(".lightbox__next");
  const counterEl = lightbox.querySelector(".lightbox__counter");
  let videoEl = null;

  document.body.appendChild(lightbox);

   /* ── Helpers ── */
  function deriveSlug(src) {
    const basename = src.split("/").pop();
    return basename.replace(/\.\w+$/, "").toLowerCase().replace(/_/g, "-");
  }

  function isRestorable(el) {
    return (
      el &&
      el !== document.body &&
      el.isConnected &&
      typeof el.focus === "function"
    );
  }

  function focusRestoreTarget() {
    if (isRestorable(lastFocusedElement)) return lastFocusedElement;
    return document.querySelector(FOCUSABLE_SELECTOR) || document.body;
  }

  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      hideTimer = null;
      if (!lightbox.classList.contains("lightbox--open")) lightbox.hidden = true;
    }, HIDE_FALLBACK_MS);
  }

  /* ── Internal state ── */
  let items = [];
  let currentIndex = 0;
  let showNav = true;
  let lastFocusedElement = null;
  let analyticsContext = null;
  let hideTimer = null;
  let shouldBeOpen = false;
  const HIDE_FALLBACK_MS = 300;

  const FOCUSABLE_SELECTOR =
    'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

  /* A [hidden] subtree is not tabbable, but FOCUSABLE_SELECTOR only screens
     out a removed tabindex, so a button hidden on open still matches. The
     attribute is the source of truth here, never the stylesheet: .btn--icon
     sets display:inline-flex and beats the UA [hidden] rule, so a computed
     style check would report these buttons as visible. */
  function getTabbableElements(root) {
    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      function (el) { return !el.closest("[hidden]"); }
    );
  }

  /* ── Render ── */
  function renderCurrentItem() {
    const item = items[currentIndex];

    if (item.video) {
      imgEl.style.display = "none";
      if (!videoEl) {
        videoEl = document.createElement("iframe");
        videoEl.className = "lightbox__video";
        videoEl.allow = "autoplay; fullscreen; picture-in-picture";
        videoEl.setAttribute("frameborder", "0");
        lightbox.appendChild(videoEl);
      }
      videoEl.style.display = "block";
      videoEl.src = item.video;
    } else {
      imgEl.style.display = "block";
      if (videoEl) {
        videoEl.style.display = "none";
        videoEl.src = "";
      }
      imgEl.src = item.lightboxSrc || item.src;
      imgEl.alt = item.alt || "";
    }

    counterEl.textContent = (currentIndex + 1) + " / " + items.length + " — " + (imgEl.alt || "");

    if (!item.video && imgEl.alt) {
      lightbox.setAttribute("aria-describedby", LIGHTBOX_IMG_ID);
    } else {
      lightbox.removeAttribute("aria-describedby");
    }
  }

  /* ── API ── */
  function open(config, context) {
    items = config.items || [];
    showNav = config.showNav !== undefined ? config.showNav : true;
    currentIndex = Math.max(0, Math.min(config.startIndex || 0, items.length - 1));
    analyticsContext = context || null;

    lastFocusedElement = document.activeElement;

    renderCurrentItem();

    prevEl.hidden = !showNav;
    nextEl.hidden = !showNav;
    counterEl.hidden = !showNav;

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    lightbox.hidden = false;
    shouldBeOpen = true;
    requestAnimationFrame(function () {
      if (shouldBeOpen) lightbox.classList.add("lightbox--open");
    });
    document.body.style.overflow = "hidden";
    closeEl.focus({ preventScroll: true });
  }

  function close(method) {
    const ctx = analyticsContext;
    analyticsContext = null;

    shouldBeOpen = false;
    lightbox.classList.remove("lightbox--open");
    document.body.style.overflow = "";
    const restoreTo = focusRestoreTarget();
    if (restoreTo && restoreTo.focus) {
      restoreTo.focus();
    }
    scheduleHide();
    if (videoEl) {
      videoEl.src = "";
      videoEl.style.display = "none";
    }
    if (window.Analytics && typeof window.Analytics.track === "function") {
      const safeIdentity = (ctx && ctx.identity) || "unknown";
      window.Analytics.track("lightbox:close", {
        index: currentIndex,
        slug: safeIdentity,
        method: method || "unknown",
      });
    }
  }

  function navigate(direction) {
    if (items.length === 0) return;
    currentIndex = (currentIndex + direction + items.length) % items.length;
    renderCurrentItem();
    if (window.Analytics && typeof window.Analytics.track === "function" && analyticsContext) {
      const identity = analyticsContext.identity || "unknown";
      const directionLabel = direction === 1 ? 'next' : 'previous';
      if (analyticsContext.prefix === "film-grid") {
        const slug = deriveSlug(items[currentIndex].src || items[currentIndex].lightboxSrc || "");
        window.Analytics.track(`film-${slug}:${directionLabel}`, { direction, slug });
      } else {
        window.Analytics.track(`lightbox-${identity}:${directionLabel}`, { direction, slug: identity });
      }
    }
  }

  function isOpen() {
    return lightbox.classList.contains("lightbox--open");
  }

  window.Lightbox = { open, close, navigate, isOpen };

  /* ── Event listeners ── */
  closeEl.addEventListener("click", function () { close("button"); });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close("backdrop");
  });

  lightbox.addEventListener("transitionend", function (e) {
    if (e.target !== lightbox) return;
    if (lightbox.classList.contains("lightbox--open")) return;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    lightbox.hidden = true;
  });

  prevEl.addEventListener("click", function () { navigate(-1); });

  nextEl.addEventListener("click", function () { navigate(1); });

  lightbox.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !lightbox.classList.contains("lightbox--open"))
      return;
    const focusable = getTabbableElements(lightbox);
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

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("lightbox--open")) return;
    if (e.key === "Escape") {
      e.lightboxHandled = true;
      close("escape");
      return;
    }
    if (!showNav) return;
    if (e.key === "ArrowLeft") {
      if (items.length === 0) return;
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      renderCurrentItem();
    }
    if (e.key === "ArrowRight") {
      if (items.length === 0) return;
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      renderCurrentItem();
    }
  });
})();
