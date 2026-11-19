/**
 * Sync components - simple client-side template injection for GitHub Pages
 * Includes navbar, footer, and privacy modal into each page
 */
(function() {
  "use strict";

  const COMPONENTS = {
    'navbar': '/assets/components/navbar.html',
    'navbar-secondary': '/assets/components/navbar-secondary.html',
    'footer': '/assets/components/footer.html',
    'privacy-modal': '/assets/components/privacy-modal.html'
  };

  // Fetch and inject a component
  async function injectComponent(name, targetContainer) {
    try {
      const response = await fetch(COMPONENTS[name]);
      if (!response.ok) throw new Error(`Failed to load ${name}`);
      const html = await response.text();
      targetContainer.innerHTML = html;
    } catch (e) {
      console.warn(`Could not load component: ${name}`, e);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Inject navbar before each <header>
    const injections = [];
    
    // Inject navbar/mobile menu into placeholder containers
    document.querySelectorAll('[data-component="navbar-mobile"]').forEach(el => {
      injections.push(injectComponent('navbar', el));
    });

    // Inject secondary navbar (work/film pages with back button)
    document.querySelectorAll('[data-component="navbar-secondary"]').forEach(el => {
      injections.push(injectComponent('navbar-secondary', el));
    });

    // Inject footer after each main content
    document.querySelectorAll('[data-component="footer"]').forEach(el => {
      injections.push(injectComponent('footer', el));
    });

    // Inject privacy modal before </body>
    document.querySelectorAll('[data-component="privacy-modal"]').forEach(el => {
      injections.push(injectComponent('privacy-modal', el));
    });

    // Dispatch event after all injections complete
    Promise.all(injections).then(() => {
      // Set active nav link based on current page
      setActiveNavLink();
      document.dispatchEvent(new CustomEvent('components:loaded'));
    }).catch(() => {
      console.warn('Some components failed to load');
      setActiveNavLink();
      document.dispatchEvent(new CustomEvent('components:loaded'));
    });
  }

  function setActiveNavLink() {
    const path = window.location.pathname;
    const isWork = path.includes('/work/');
    const isFilm = path.includes('/film/');
    
    // Remove all active states first
    document.querySelectorAll('.navbar__item--active').forEach(el => {
      el.classList.remove('navbar__item--active');
    });
    document.querySelectorAll('.navbar__item a[aria-current="page"]').forEach(el => {
      el.removeAttribute('aria-current');
    });
    document.querySelectorAll('.mobile-menu__item--active').forEach(el => {
      el.classList.remove('mobile-menu__item--active');
    });
    document.querySelectorAll('.mobile-menu__item a[aria-current="page"]').forEach(el => {
      el.removeAttribute('aria-current');
    });
    
    // Set active based on current page
    const navLinks = document.querySelectorAll('.navbar__list a, .mobile-menu__list a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      const isHome = href === '../' || href === './' || href === '/';
      const isWorkLink = href.includes('work');
      const isFilmLink = href.includes('film');
      
      let isActive = false;
      if (isHome && !isWork && !isFilm) isActive = true;
      if (isWorkLink && isWork) isActive = true;
      if (isFilmLink && isFilm) isActive = true;
      
      if (isActive) {
        link.setAttribute('aria-current', 'page');
        const parent = link.closest('.navbar__item, .mobile-menu__item');
        if (parent) {
          parent.classList.add(parent.classList.contains('mobile-menu__item') ? 'mobile-menu__item--active' : 'navbar__item--active');
        }
      }
    });
  }
})();