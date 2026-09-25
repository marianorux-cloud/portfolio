(function () {
  "use strict";

  function track(name, props) {
    if (typeof window.umami === "function") {
      window.umami.track(name, props);
    }
  }

  window.Analytics = { track: track };
})();
