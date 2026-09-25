(function () {
  "use strict";

  function track(name, props) {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name, props);
    }
  }

  window.Analytics = { track: track };
})();
