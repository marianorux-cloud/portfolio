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
    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme') || 'light';
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
   let mouseX = 0;
   let mouseY = 0;
   let cursorX = 0;
   let cursorY = 0;

   if (cursor && window.matchMedia('(hover: hover)').matches) {
     document.addEventListener('mousemove', (e) => {
       mouseX = e.clientX;
       mouseY = e.clientY;
     });

     function animateCursor() {
       const dx = mouseX - cursorX;
       const dy = mouseY - cursorY;
cursorX += dx * 0.35;
        cursorY += dy * 0.35;
       cursor.style.setProperty('--translate-x', `${cursorX}px`);
       cursor.style.setProperty('--translate-y', `${cursorY}px`);
       requestAnimationFrame(animateCursor);
     }
     animateCursor();
     document.body.classList.add('custom-cursor-active');

      const hoverTargets = document.querySelectorAll('a, button, .project-card__image-wrapper');
      hoverTargets.forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
      });

     // Add click feedback
     document.addEventListener('mousedown', () => {
       if (cursor) {
         cursor.classList.add('cursor--active');
       }
     });

     document.addEventListener('mouseup', () => {
       if (cursor) {
         cursor.classList.remove('cursor--active');
       }
     });
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

  /* ---------- Work page: filter ---------- */
  const filterPills = document.querySelectorAll('.filter-pill');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('filter-pill--active'));
      pill.classList.add('filter-pill--active');
      const filterValue = pill.dataset.filter;
      document.querySelectorAll('.project-card').forEach(card => {
        card.classList.toggle('filter-hidden', filterValue !== 'all' && card.dataset.company !== filterValue);
      });
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image preview');
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"/>
      </svg>
    </button>
    <img class="lightbox__img" alt="">
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const lightboxClose = lightbox.querySelector('.lightbox__close');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  const projectsGrid = document.getElementById('projects-grid');
  if (projectsGrid) {
    projectsGrid.addEventListener('click', (e) => {
      const img = e.target.closest('.project-card__image');
      if (!img) return;
      openLightbox(img.src, img.alt);
    });
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) closeLightbox();
  });

})();
