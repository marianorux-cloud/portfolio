/**
 * Sync partials - simple client-side template injection for GitHub Pages
 * Includes navbar, footer, and privacy modal into each page
 */
(function() {
  "use strict";

  const PARTIALS = {
    'navbar': '_includes/navbar.html',
    'footer': '_includes/footer.html',
    'privacy-modal': '_includes/privacy-modal.html'
  };

  // Fetch and inject a partial
  async function injectPartial(name, targetContainer) {
    try {
      const response = await fetch(PARTIALS[name]);
      if (!response.ok) throw new Error(`Failed to load ${name}`);
      const html = await response.text();
      targetContainer.innerHTML = html;
    } catch (e) {
      console.warn(`Could not load partial: ${name}`, e);
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
    document.querySelectorAll('header[data-partial="navbar"]').forEach(el => {
      injectPartial('navbar', el);
    });

    // Inject footer after each main content
    document.querySelectorAll('footer[data-partial="footer"]').forEach(el => {
      injectPartial('footer', el);
    });

    // Inject privacy modal before </body>
    document.querySelectorAll('div[data-partial="privacy-modal"]').forEach(el => {
      injectPartial('privacy-modal', el);
    });
  }
})();