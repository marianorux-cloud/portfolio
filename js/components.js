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
    document.querySelectorAll('header[data-component="navbar-secondary"]').forEach(el => {
      injections.push(injectComponent('navbar-secondary', el));
    });

    // Inject footer after each main content
    document.querySelectorAll('footer[data-component="footer"]').forEach(el => {
      injections.push(injectComponent('footer', el));
    });

    // Inject privacy modal before </body>
    document.querySelectorAll('div[data-component="privacy-modal"]').forEach(el => {
      injections.push(injectComponent('privacy-modal', el));
    });

    // Dispatch event after all injections complete
    Promise.all(injections).then(() => {
      document.dispatchEvent(new CustomEvent('components:loaded'));
    }).catch(() => {
      console.warn('Some components failed to load');
      document.dispatchEvent(new CustomEvent('components:loaded'));
    });
  }
})();