/**
 * Minimal vanilla JS for the coming-soon landing page.
 * Theme toggle with localStorage and prefers-color-scheme support.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme';
  const html = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const THEME_ORDER = ['light', 'neutral', 'dark'];

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }

  function init() {
    const saved = getSavedTheme();
    const theme = saved || 'neutral';
    setTheme(theme);

    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme') || 'neutral';
        const currentIndex = THEME_ORDER.indexOf(current);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        setTheme(THEME_ORDER[nextIndex]);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector('.cursor');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  if (cursor && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
    document.body.classList.add('custom-cursor-active');

    const hoverTargets = document.querySelectorAll('a, button');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
    });
  }

  /* ---------- Shimmer color swap ---------- */
  const heroLink = document.querySelector('.hero__link');
  const altClasses = ['hero__link--alt-1', 'hero__link--alt-2', 'hero__link--alt-3'];
  let currentAlt = null;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  let queue = shuffle([...altClasses]);

  if (heroLink && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      if (currentAlt) {
        heroLink.classList.remove(currentAlt);
      }
      const next = queue.shift();
      if (next) {
        heroLink.classList.add(next);
        currentAlt = next;
      } else {
        currentAlt = null;
        queue = shuffle([...altClasses]);
      }
    }, 5000);
  }
  /* ---------- Mobile menu ---------- */
  const mobileMenuToggle = document.querySelector('.navbar__toggle');
  const mobileMenuClose = document.querySelector('.mobile-menu__close');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
    const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      mobileMenu.hidden = false;
      requestAnimationFrame(() => {
        mobileMenu.classList.add('mobile-menu--open');
      });
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      mobileMenuClose.focus();
    }

    function closeMenu() {
      mobileMenu.classList.remove('mobile-menu--open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      mobileMenuToggle.focus();
    }

    mobileMenu.addEventListener('transitionend', (e) => {
      if (e.target === mobileMenu && !mobileMenu.classList.contains('mobile-menu--open')) {
        mobileMenu.hidden = true;
      }
    });

    mobileMenuToggle.addEventListener('click', openMenu);
    mobileMenuClose.addEventListener('click', closeMenu);

    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !mobileMenu.classList.contains('mobile-menu--open')) return;
      e.preventDefault();
      closeMenu();
    });

    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !mobileMenu.classList.contains('mobile-menu--open')) return;
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

})();
