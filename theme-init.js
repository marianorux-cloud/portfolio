(function () {
  var saved;
  try { saved = localStorage.getItem('theme'); } catch (e) { saved = null; }
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', saved);
})();
