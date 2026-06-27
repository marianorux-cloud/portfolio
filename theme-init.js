(function () {
  var saved;
  try { saved = localStorage.getItem('theme'); } catch (e) { saved = null; }
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', saved);
  if ('startViewTransition' in document) {
    try {
      var nav = performance.getEntriesByType('navigation');
      if (nav.length > 0 && nav[0].type !== 'reload') {
        var ref = document.referrer;
         if (ref && ref.startsWith(location.origin + '/')) {
          document.documentElement.classList.add('vt-active');
        }
      }
    } catch(e) {}
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  var grainyElements = document.querySelectorAll('.text--grainy');
  grainyElements.forEach(function (el) {
    el.style.setProperty('--grainy-angle', Math.floor(Math.random() * 360));
  });
});
