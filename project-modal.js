(function () {
  "use strict";

  var modal = null;
  var configs = {};
  var currentProjectId = null;
  var lastFocused = null;
  var pushedState = false;
  var closingViaHistory = false;
  var modalScrollFired = new Set();

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

  function getNormalizedSections(sections) {
    var result = [];
    (sections || []).forEach(function (section) {
      if (!section || !section.type) return;
      var type = section.type;

      if (type === "text") {
        result.push({
          type: "text",
          label: section.label || "",
          content: section.content || ""
        });
      } else if (type === "image") {
        var src = section.src || "";
        if (!src) return;
        result.push({
          type: "image",
          src: src,
          lightboxSrc: section.lightboxSrc || src,
          alt: section.alt || "",
          caption: section.caption || ""
        });
      } else if (type === "grid") {
        var items = (section.items || []).filter(function (item) {
          return item && item.src;
        }).map(function (item) {
          return {
            src: item.src,
            lightboxSrc: item.lightboxSrc || item.src,
            alt: item.alt || "",
            caption: item.caption || ""
          };
        });
        if (items.length === 0) return;
        var columns = Math.min(
          Math.max(1, section.columns || items.length),
          items.length
        );
        result.push({
          type: "grid",
          columns: columns,
          arrows: section.arrows !== false,
          items: items
        });
      } else if (type === "split") {
        var media = (section.media || []).filter(function (item) {
          return item && item.src;
        }).map(function (item) {
          return {
            src: item.src,
            lightboxSrc: item.lightboxSrc || item.src,
            alt: item.alt || "",
            caption: item.caption || ""
          };
        });
        if (!section.text && media.length === 0) return;
        var textWidth = Math.min(1, Math.max(0, section.textWidth || 0.5));
        result.push({
          type: "split",
          textWidth: textWidth,
          text: {
            label: section.text ? section.text.label || "" : "",
            content: section.text ? section.text.content || "" : ""
          },
          media: media
        });
      } else if (type === "video") {
        if (!section.videoId) return;
        result.push({
          type: "video",
          videoId: section.videoId,
          poster: section.poster || "",
          title: section.title || ""
        });
      } else {
        console.warn("Unknown section type:", type);
      }
    });
    return result;
  }

  function getGridTemplate(columns, arrows, totalItems) {
    if (!arrows || columns <= 1) {
      var w = (100 - 4 * (columns - 1)) / columns;
      return Array(Math.max(1, columns)).fill(w.toFixed(4) + "%").join(" ");
    }
    var imageCount = Math.min(columns, totalItems);
    var w = (100 - 12 * (imageCount - 1)) / imageCount;
    var parts = [];
    for (var i = 0; i < imageCount; i++) {
      parts.push(w.toFixed(4) + "%");
      if (i < imageCount - 1) {
        parts.push("4%");
      }
    }
    return parts.join(" ");
  }

  function renderContent(config) {
    var html = "";
    html += '<div class="project-modal__header">';
    html +=
      '<h2 class="project-modal__title" id="project-modal__title">' +
      esc(config.title || config.overline) +
      "</h2>";
    html += "</div>";

    var imageIndex = 0;
    var sections = getNormalizedSections(config.sections);

    sections.forEach(function (section) {
      if (section.type === "text") {
        html += '<div class="project-modal__section">';
        if (section.label) {
          html +=
            '<div class="project-modal__overline">' + esc(section.label) + "</div>";
        }
        var paragraphs = String(section.content || "").split(/\n{2,}/);
        paragraphs.forEach(function (para) {
          html += '<p class="project-modal__text">' + esc(para) + "</p>";
        });
        html += "</div>";
      } else if (section.type === "image") {
        html += '<div class="project-modal__section">';
        html += '<div class="project-modal__media">';
        html +=
          '<img class="project-modal__image" src="' +
          esc(section.src) +
          '" alt="' +
          esc(section.alt) +
          '" loading="lazy" data-image-index="' +
          imageIndex +
          '">';
        if (section.caption) {
          html +=
            '<p class="project-modal__caption">' + esc(section.caption) + "</p>";
        }
        html += "</div>";
        html += "</div>";
        imageIndex++;
      } else if (section.type === "grid") {
        var template = getGridTemplate(
          section.columns,
          section.arrows,
          section.items.length
        );
        html += '<div class="project-modal__section">';
        html +=
          '<div class="project-modal__grid" style="--grid-template:' +
          template +
          '">';
        section.items.forEach(function (item, idx) {
          html += '<div class="project-modal__grid-item">';
          html +=
            '<img class="project-modal__image" src="' +
            esc(item.src) +
            '" alt="' +
            esc(item.alt) +
            '" loading="lazy" data-image-index="' +
            imageIndex +
            '">';
          html += "</div>";
          imageIndex++;
          if (section.arrows && idx < section.items.length - 1) {
            html +=
              '<svg class="project-modal__grid-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">';
            html +=
              '<path d="M16.1716 10.9999H4V12.9999H16.1716L10.8076 18.3638L12.2218 19.778L20 11.9999L12.2218 4.22168L10.8074 5.63589L16.1716 10.9999Z" />';
            html += "</svg>";
          }
        });
        html += "</div>";
        var hasCaption = section.items.some(function (item) {
          return item.caption;
        });
        if (hasCaption) {
          html +=
            '<div class="project-modal__grid-captions" style="--grid-template:' +
            template +
            '">';
          section.items.forEach(function (item, idx) {
            if (item.caption) {
              html +=
                '<p class="project-modal__caption">' +
                esc(item.caption) +
                "</p>";
            } else {
              html += "<span></span>";
            }
            if (section.arrows && idx < section.items.length - 1) {
              html += '<span class="project-modal__grid-caption-spacer"></span>';
            }
          });
          html += "</div>";
        }
        html += "</div>";
      } else if (section.type === "split") {
        var splitTemplate =
          'calc((100% - var(--space-md)) * ' + section.textWidth.toFixed(4) + ') ' +
          'calc((100% - var(--space-md)) * ' + (1 - section.textWidth).toFixed(4) + ')';
        var splitRatio = section.media.reduce(function (sum, item) {
            if (item.width && item.height && item.height !== 0) {
                return sum + (item.width / item.height);
            }
            return sum;
        }, 0);

        html += '<div class="project-modal__section">';
        html +=
          '<div class="project-modal__split" style="--split-template:' +
          splitTemplate +
          '; --split-media-ratio: ' + splitRatio.toFixed(6) +
          '">';
        html += '<div class="project-modal__split-text">';
        if (section.text.label) {
          html +=
            '<div class="project-modal__overline">' +
            esc(section.text.label) +
            "</div>";
        }
        var splitParagraphs = String(
          section.text.content || ""
        ).split(/\n{2,}/);
        splitParagraphs.forEach(function (para) {
          html += '<p class="project-modal__text">' + esc(para) + "</p>";
        });
        html += "</div>";
        html += '<div class="project-modal__split-media">';
        section.media.forEach(function (item) {
          html += '<div class="project-modal__media">';
          html +=
            '<img class="project-modal__image" src="' +
            esc(item.src) +
            '" alt="' +
            esc(item.alt) +
            '" loading="lazy" data-image-index="' +
            imageIndex +
            '">';
          if (item.caption) {
            html +=
              '<p class="project-modal__caption">' +
              esc(item.caption) +
              "</p>";
          }
          html += "</div>";
          imageIndex++;
        });
        html += "</div>";
        html += "</div>";
        html += "</div>";
      } else if (section.type === "video") {
        html += '<div class="project-modal__section">';
        html += '<div class="project-modal__video">';
        html +=
          '<button class="project-modal__video-poster" type="button" data-video-id="' +
          esc(section.videoId) +
          '"';
        if (section.poster) {
          html += ' data-poster="' + esc(section.poster) + '"';
        }
        html += ' aria-label="' + esc(section.title || "Play video") + '">';
        if (section.poster) {
          html +=
            '<img src="' +
            esc(section.poster) +
            '" alt="" class="project-modal__video-poster-image">';
        }
        html +=
          '<span class="project-modal__video-play" aria-hidden="true">\u25B6</span>';
        html += "</button>";
        html += "</div>";
        html += "</div>";
      }
    });

    return html;
  }

  function collectImages(config) {
    var images = [];
    var sections = getNormalizedSections(config.sections);
    sections.forEach(function (section) {
      if (section.type === "image") {
        images.push({
          src: section.lightboxSrc || section.src,
          alt: section.alt || ""
        });
      } else if (section.type === "grid") {
        section.items.forEach(function (item) {
          images.push({
            src: item.lightboxSrc || item.src,
            alt: item.alt || ""
          });
        });
      } else if (section.type === "split") {
        section.media.forEach(function (item) {
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
    modalScrollFired = new Set();

    var content = modal.querySelector("#project-modal__content");
    content.innerHTML = renderContent(config);

    modal.classList.add("project-modal--open");
    document.body.classList.add("modal-open");

    lastFocused = document.activeElement;
    var closeBtn = modal.querySelector(".project-modal__close");
    closeBtn.focus();

    if (trigger !== "url") {
      pushedState = true;
      if (history.pushState) {
        history.pushState({ projectModal: projectId }, "", "#" + projectId);
      }
    } else {
      pushedState = false;
    }

    if (window.Analytics && typeof window.Analytics.track === "function") {
      window.Analytics.track(projectId + ":open", {
        slug: projectId,
        trigger: trigger
      });
    }
  }

  function teardown() {
    if (!modal) return;
    if (
      currentProjectId &&
      window.Analytics &&
      typeof window.Analytics.track === "function"
    ) {
      window.Analytics.track(currentProjectId + ":close", { slug: currentProjectId });
    }
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

    document.querySelectorAll('script[type="application/json"][id^="project--"]').forEach(function (el) {
      var id = el.id.replace("project--", "");
      try {
        configs[id] = JSON.parse(el.textContent);
      } catch (e) {
        console.warn("Failed to parse project config:", id, e);
      }
    });

    modal = createModal();

    var closeBtn = modal.querySelector(".project-modal__close");

    closeBtn.addEventListener("click", function () { close(); });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        modal.classList.contains("project-modal--open")
      ) {
        e.preventDefault();
        close();
      }
    });

    modal.addEventListener("keydown", function (e) {
      if (
        e.key !== "Tab" ||
        !modal.classList.contains("project-modal--open")
      )
        return;
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

    window.addEventListener("popstate", function () {
      if (currentProjectId) {
        teardown();
      }
      pushedState = false;
      closingViaHistory = false;
    });

    modal.addEventListener("scroll", function () {
      if (!currentProjectId) return;
      var scrollableHeight = modal.scrollHeight - modal.clientHeight;
      if (scrollableHeight <= 0) return;
      var percent = Math.round(
        (modal.scrollTop / scrollableHeight) * 100
      );
      [25, 50, 75, 100].forEach(function (threshold) {
        if (
          percent >= threshold &&
          !modalScrollFired.has(threshold)
        ) {
          modalScrollFired.add(threshold);
          if (
            window.Analytics &&
            typeof window.Analytics.track === "function"
          ) {
            window.Analytics.track(currentProjectId + ":scroll-depth", {
              slug: currentProjectId,
              percent: threshold
            });
          }
        }
      });
    });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".project-card__details");
      if (btn) {
        e.preventDefault();
        open(btn.dataset.projectId, "button");
      }
    });

    grid.addEventListener("click", function (e) {
      var img = e.target.closest(".project-card__image");
      if (!img) return;
      var card = img.closest(".project-card");
      if (card && card.dataset.details) {
        open(card.dataset.details, "image");
      }
    });

    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var btn = e.target.closest(".project-card__details");
      if (!btn) return;
      e.preventDefault();
      open(btn.dataset.projectId, "button");
    });

    modal.addEventListener("click", function (e) {
      var img = e.target.closest(".project-modal__image");
      if (!img) return;
      if (img.closest(".project-modal__video")) return;
      var config = configs[currentProjectId];
      if (!config) return;
      var images = collectImages(config);
      if (images.length === 0) return;
      var startIndex = parseInt(img.dataset.imageIndex, 10);
      if (isNaN(startIndex)) startIndex = 0;
      if (
        window.Analytics &&
        typeof window.Analytics.track === "function" &&
        currentProjectId
      ) {
        window.Analytics.track(currentProjectId + ":image-view", {
          slug: currentProjectId,
          imageIndex: startIndex,
          imageAlt: img.alt || ""
        });
      }
      if (window.Lightbox && typeof window.Lightbox.open === "function") {
        window.Lightbox.open(
          {
            items: images,
            startIndex: startIndex,
            showNav: true
          },
          {
            prefix: "project-modal",
            identity: currentProjectId
          }
        );
      }
    });

    modal.addEventListener("click", function (e) {
      var btn = e.target.closest(".project-modal__video-poster");
      if (!btn) return;
      var videoId = btn.dataset.videoId;
       var title = btn.getAttribute("aria-label") || "";
       var iframe = document.createElement("iframe");
       iframe.src = "https://player.vimeo.com/video/" + videoId + "?dnt=1&badge=0&autopause=0&player_id=0&app_id=58479";
       iframe.title = title;
       iframe.frameBorder = "0";
       iframe.allow = "autoplay; fullscreen; picture-in-picture";
       iframe.style.width = "100%";
       iframe.style.height = "315px";
       iframe.style.border = "none";
       btn.replaceWith(iframe);
    });

    var hash = window.location.hash.slice(1);
    if (hash && configs[hash]) {
      open(hash, "url");
    }
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
