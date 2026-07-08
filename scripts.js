/**
 * Minimal vanilla JS for the coming-soon landing page.
 * Theme toggle with localStorage and prefers-color-scheme support.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "theme";
  const html = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const THEME_ORDER = ["light", "neutral", "dark"];

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }

  function init() {
    if (toggle) {
      toggle.addEventListener("click", function () {
        const current = html.getAttribute("data-theme") || "light";
        const currentIndex = THEME_ORDER.indexOf(current);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        setTheme(THEME_ORDER[nextIndex]);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = window.innerWidth;
  let cursorY = window.innerHeight;
  let currentScale = 1;
  let targetScale = 1;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const scaleLerpFactor = prefersReducedMotion ? 1 : 0.15;

  function updateTargetScale() {
    const isActive = cursor.classList.contains("cursor--active");
    const isHover = cursor.classList.contains("cursor--hover");
    const isText = cursor.classList.contains("cursor--text");

    if (isHover) {
      targetScale = isActive ? 0.5 : 0.6;
    } else if (isText) {
      targetScale = isActive ? 0.64 : 0.8;
    } else {
      targetScale = isActive ? 0.8 : 1;
    }
  }

  if (cursor && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      if (t.closest("a, button, .project-card__image-wrapper, .film-grid__cell")) {
        cursor.classList.add("cursor--hover");
        cursor.classList.remove("cursor--text");
      } else if (
        t.closest(
          "p, h1, h2, h3, h4, h5, h6, li, figcaption, blockquote, label",
        )
      ) {
        cursor.classList.add("cursor--text");
        cursor.classList.remove("cursor--hover");
      } else {
        cursor.classList.remove("cursor--hover", "cursor--text");
      }
      updateTargetScale();
    });

    function animateCursor() {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.5;
      cursorY += dy * 0.5;
      cursor.style.setProperty("--translate-x", `${cursorX}px`);
      cursor.style.setProperty("--translate-y", `${cursorY}px`);

      const scaleDelta = targetScale - currentScale;
      currentScale += scaleDelta * scaleLerpFactor;
      cursor.style.setProperty("--cursor-scale", currentScale);

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
    document.body.classList.add("custom-cursor-active");

    document.addEventListener("mousedown", () => {
      if (cursor) {
        cursor.classList.add("cursor--active");
        updateTargetScale();
      }
    });

    document.addEventListener("mouseup", () => {
      if (cursor) {
        cursor.classList.remove("cursor--active");
        updateTargetScale();
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  const mobileMenuToggle = document.querySelector(".navbar__toggle");
  const mobileMenuClose = document.querySelector(".mobile-menu__close");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
    const FOCUSABLE_SELECTOR =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      mobileMenu.hidden = false;
      requestAnimationFrame(() => {
        mobileMenu.classList.add("mobile-menu--open");
      });
      mobileMenuToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      mobileMenuClose.focus();
    }

    function closeMenu() {
      mobileMenu.classList.remove("mobile-menu--open");
      mobileMenuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      mobileMenuToggle.focus();
    }

    mobileMenu.addEventListener("transitionend", (e) => {
      if (
        e.target === mobileMenu &&
        !mobileMenu.classList.contains("mobile-menu--open")
      ) {
        mobileMenu.hidden = true;
      }
    });

    mobileMenuToggle.addEventListener("click", openMenu);
    mobileMenuClose.addEventListener("click", closeMenu);

    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key !== "Escape" ||
        !mobileMenu.classList.contains("mobile-menu--open")
      )
        return;
      e.preventDefault();
      closeMenu();
    });

    mobileMenu.addEventListener("keydown", (e) => {
      if (
        e.key !== "Tab" ||
        !mobileMenu.classList.contains("mobile-menu--open")
      )
        return;
      const focusable = mobileMenu.querySelectorAll(FOCUSABLE_SELECTOR);
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
  }

  /* ---------- Work page: filter ---------- */
  const filterPills = document.querySelectorAll(".filter-pill");

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("filter-pill--active"));
      pill.classList.add("filter-pill--active");
      const filterValue = pill.dataset.company;
      document.querySelectorAll(".project-card").forEach((card) => {
        card.classList.toggle(
          "filter-hidden",
          filterValue !== "all" && card.dataset.company !== filterValue,
        );
      });
      const statusEl = document.getElementById("filter-status");
      if (statusEl) {
        statusEl.textContent = filterValue === "all" ? "Showing all projects" : `Showing ${filterValue} projects`;
      }
    });
  });

  /* ---------- Work page: year sort ---------- */
  const projectGrid = document.getElementById("projects-grid");
  if (projectGrid) {
    const projectCards = Array.from(
      projectGrid.querySelectorAll(".project-card"),
    );
    projectCards.sort(
      (a, b) => parseInt(b.dataset.year) - parseInt(a.dataset.year),
    );
    projectCards.forEach((card) => projectGrid.appendChild(card));
  }

  /* ---------- Lightbox ---------- */
  const projectsGrid = document.getElementById("projects-grid");
  if (projectsGrid) {
    function openLightboxForElement(el) {
      const items = [{
        src: el.dataset.full || el.src,
        alt: el.alt,
        video: el.dataset.video || null
      }];
      window.Lightbox.open({ items, startIndex: 0, showNav: false });
    }

    projectsGrid.addEventListener("click", (e) => {
      const img = e.target.closest(".project-card__image");
      if (!img) return;
      openLightboxForElement(img);
    });

    projectsGrid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const img = e.target.closest(".project-card__image");
      if (!img) return;
      e.preventDefault();
      openLightboxForElement(img);
    });
  }
})();
