(function () {
  "use strict";

  var modal = null;
  var configs = {};
  var currentProjectId = null;
  var lastFocused = null;
  var pushedState = false;
  var closingViaHistory = false;

  var FOCUSABLE_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createModal() {
    var el = document.createElement("div");
    el.className = "project-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Project details");
    el.setAttribute("aria-labelledby", "project-modal__title");
    el.setAttribute("tabindex", "-1");

    el.innerHTML =
      '<button class="project-modal__close btn--icon" aria-label="Close">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"/>' +
      "</svg></button>" +
      '<div class="project-modal__content" id="project-modal__content"></div>';

    document.body.appendChild(el);
    return el;
  }

  function renderContent(config) {
    var html = "";
    html += '<div class="project-modal__header">';
    html += '<h2 class="project-modal__title" id="project-modal__title">' + esc(config.title || config.overline) + "</h2>";
    html += "</div>";

    var imageIndex = 0;
    (config.sections || []).forEach(function (section) {
      if (section.type === "text") {
        var paragraphs = String(section.content || "").split(/\n{2,}/);
        html += '<div class="project-modal__section">';
        paragraphs.forEach(function (para) {
          html += '<p class="project-modal__text">' + esc(para) + "</p>";
        });
        html += "</div>";
      } else if (section.type === "image") {
        html += '<div class="project-modal__section">';
        html += '<div class="project-modal__media">';
        html += '<img class="project-modal__image" src="' + esc(section.src || "") + '" alt="' + esc(section.alt || "") + '" loading="lazy" data-image-index="' + imageIndex + '">';
        if (section.caption) {
          html += '<p class="project-modal__caption">' + esc(section.caption) + "</p>";
        }
        html += "</div>";
        html += "</div>";
        imageIndex++;
      } else if (section.type === "flow") {
        html += '<div class="project-modal__flow">';
        html += '<div class="project-modal__flow-pair">';
        var items = section.items || [];
        items.forEach(function (item, idx) {
          html += '<div class="project-modal__flow-item">';
          html += '<img class="project-modal__image" src="' + esc(item.src || "") + '" alt="' + esc(item.alt || "") + '" loading="lazy" data-image-index="' + imageIndex + '">';
          html += "</div>";
          imageIndex++;
          if (idx < items.length - 1) {
            html += '<svg class="project-modal__flow-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">';
            html += '<path d="M16.1716 10.9999H4V12.9999H16.1716L10.8076 18.3638L12.2218 19.778L20 11.9999L12.2218 4.22168L10.8074 5.63589L16.1716 10.9999Z" />';
            html += "</svg>";
          }
        });
        html += "</div>";
        html += '<div class="project-modal__flow-captions">';
        items.forEach(function (item, idx) {
          html += '<p class="project-modal__caption">' + esc(item.caption || "") + "</p>";
          if (idx < items.length - 1) {
            html += '<span class="project-modal__flow-caption-spacer"></span>';
          }
        });
        html += "</div>";
        html += "</div>";
      }
    });

    return html;
  }

  function collectImages(config) {
    var images = [];
    (config.sections || []).forEach(function (section) {
      if (section.type === "image") {
        images.push({
          src: section.lightboxSrc || section.src,
          alt: section.alt || ""
        });
      } else if (section.type === "flow") {
        (section.items || []).forEach(function (item) {
          images.push({
            src: item.lightboxSrc || item.src,
            alt: item.alt || ""
          });
        });
      }
    });
    return images;
  }

  function open(projectId, trigger) {
    var config = configs[projectId];
    if (!config) return;
    currentProjectId = projectId;

    var content = modal.querySelector("#project-modal__content");
    content.innerHTML = renderContent(config);

    modal.classList.add("project-modal--open");
    document.body.classList.add("modal-open");

    lastFocused = document.activeElement;
    var closeBtn = modal.querySelector(".project-modal__close");
    closeBtn.focus();

    // URL sync
    if (trigger !== "url") {
      pushedState = true;
      if (history.pushState) {
        history.pushState({ projectModal: projectId }, "", "#" + projectId);
      }
    } else {
      pushedState = false;
    }

    // Analytics
    if (window.Analytics && typeof window.Analytics.track === "function") {
      window.Analytics.track(projectId + ":open", { slug: projectId, trigger: trigger });
    }
  }

  function teardown() {
    if (!modal) return;
    modal.classList.remove("project-modal--open");
    document.body.classList.remove("modal-open");
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
    currentProjectId = null;
  }

  function close() {
    if (!currentProjectId) return;

    if (pushedState) {
      closingViaHistory = true;
      history.back();
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      teardown();
    }
  }

  function init() {
    var grid = document.getElementById("projects-grid");
    if (!grid) return;

    // Load configs
    document.querySelectorAll('script[type="application/json"][id^="project--"]').forEach(function (el) {
      var id = el.id.replace("project--", "");
      configs[id] = JSON.parse(el.textContent);
    });

    // Create modal
    modal = createModal();

    var closeBtn = modal.querySelector(".project-modal__close");

    // Close triggers
    closeBtn.addEventListener("click", function () { close(); });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        close();
      }
    });

    // Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("project-modal--open")) {
        e.preventDefault();
        close();
      }
    });

    // Tab trap
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !modal.classList.contains("project-modal--open")) return;
      var focusable = modal.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Popstate (back button)
    window.addEventListener("popstate", function () {
      if (currentProjectId) {
        teardown();
      }
      pushedState = false;
      closingViaHistory = false;
    });

    // Delegated click on details button
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".project-card__details");
      if (btn) {
        e.preventDefault();
        open(btn.dataset.projectId, "button");
      }
    });

    // Delegated click on card image (in grid)
    grid.addEventListener("click", function (e) {
      var img = e.target.closest(".project-card__image");
      if (!img) return;
      var card = img.closest(".project-card");
      if (card && card.dataset.details) {
        open(card.dataset.details, "image");
      }
    });

    // Enter/Space on focused details button
    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var btn = e.target.closest(".project-card__details");
      if (!btn) return;
      e.preventDefault();
      open(btn.dataset.projectId, "button");
    });

    // Modal image click → lightbox
    modal.addEventListener("click", function (e) {
      var img = e.target.closest(".project-modal__image");
      if (!img) return;
      var config = configs[currentProjectId];
      if (!config) return;
      var images = collectImages(config);
      if (images.length === 0) return;
      var startIndex = parseInt(img.dataset.imageIndex, 10);
      if (isNaN(startIndex)) startIndex = 0;
      if (window.Lightbox && typeof window.Lightbox.open === "function") {
        window.Lightbox.open({
          items: images,
          startIndex: startIndex,
          showNav: true
        }, {
          prefix: "project-modal",
          identity: currentProjectId
        });
      }
    });

    // Auto-open on load
    var hash = window.location.hash.slice(1);
    if (hash && configs[hash]) {
      open(hash, "url");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();