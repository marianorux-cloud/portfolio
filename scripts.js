/**
 * Minimal vanilla JS for the coming-soon landing page.
 * Theme toggle with localStorage and prefers-color-scheme support.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme';
  const html = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    updateToggleIcon(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }

  function updateToggleIcon(theme) {
    if (!toggle) return;
    const sun = toggle.querySelector('.theme-toggle__icon--sun');
    const moon = toggle.querySelector('.theme-toggle__icon--moon');
    if (sun && moon) {
      sun.style.display = theme === 'dark' ? 'none' : 'block';
      moon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function init() {
    const saved = getSavedTheme();
    const theme = saved || getSystemTheme();
    setTheme(theme);

    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme') || 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
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
})();
