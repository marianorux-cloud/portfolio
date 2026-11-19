(function () {
  "use strict";

  var modal = null;
  var configs = {};
  var currentProjectId = null;
  var lastFocused = null;
  var pushedState = false;
  var closingViaHistory = false;
  var closeMethod = null;
  var modalScrollFired = new Set();
  var hideTimer = null;
  var shouldBeOpen = false;
  var HIDE_FALLBACK_MS = 300;

  /* Arrow paths shared with the lightbox controls (lightbox.js). */
  var ARROW_LEFT_PATH =
    "M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z";
  var ARROW_RIGHT_PATH =
    "M16.1716 10.9999H4V12.9999H16.1716L10.8076 18.3638L12.2218 19.778L20 11.9999L12.2218 4.22168L10.8074 5.63589L16.1716 10.9999Z";

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
          arrows: section.arrows === true,
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

  function renderContent(config, navHtml) {
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
            '<h3 class="project-modal__overline">' + esc(section.label) + '</h3>';
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
            '<h3 class="project-modal__overline">' +
            esc(section.text.label) +
            "</h3>";
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

    return html + (navHtml || "");
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

  /* Live chain of the projects the visitor can currently see on the grid.
     scripts.js has already year-sorted the cards and the filter pills only
     toggle .filter-hidden on them, so the grid is re-read on every render
     instead of cached: there is no filter state to subscribe to. */
  function getNavigableProjects() {
    var grid = document.getElementById("projects-grid");
    if (!grid) return [];
    var items = [];
    Array.prototype.forEach.call(
      grid.querySelectorAll(".project-card"),
      function (card) {
        if (card.classList.contains("filter-hidden")) return;
        var btn = card.querySelector(".project-card__details[data-project-id]");
        var id = btn ? btn.dataset.projectId : card.dataset.details;
        if (!id || !configs[id]) return;
        items.push({ id: id, config: configs[id] });
      }
    );
    return items;
  }

  function getNavIndex(items, projectId) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === projectId) return i;
    }
    return -1;
  }

  function getProjectTitle(config, fallbackId) {
    return config.title || config.overline || fallbackId;
  }

  function renderNavButton(visibleText, ariaText, direction, target, path) {
    var svg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="' +
      path +
      '" /></svg>';
    var children =
      direction < 0
        ? svg + "<span>" + visibleText + "</span>"
        : "<span>" + visibleText + "</span>" + svg;
    return (
      '<button class="project-modal__nav-btn" type="button" data-nav-direction="' +
      direction +
      '" aria-label="' +
      esc(ariaText + ": " + getProjectTitle(target.config, target.id)) +
      '">' +
      children +
      "</button>"
    );
  }

  function renderNav(projectId) {
    var items = getNavigableProjects();
    if (items.length < 2) return "";
    var index = getNavIndex(items, projectId);
    /* No position in the chain means no footer. The only way there is no
       position is a deep link to a project the active filter hides: there is
       no honest PREVIOUS/NEXT pair for a project that is not in the chain. */
    if (index === -1) return "";
    var prev = items[(index - 1 + items.length) % items.length];
    var next = items[(index + 1) % items.length];
    return (
      '<div class="project-modal__nav">' +
      renderNavButton("PREVIOUS", "Previous project", -1, prev, ARROW_LEFT_PATH) +
      renderNavButton("NEXT", "Next project", 1, next, ARROW_RIGHT_PATH) +
      "</div>"
    );
  }

  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      hideTimer = null;
      if (!modal.classList.contains("project-modal--open")) modal.hidden = true;
    }, HIDE_FALLBACK_MS);
  }

  /* A URL deep link opens the modal with focus on <body>, which .focus() cannot
     move in Chrome, so closing would strand focus on a button inside the closed
     dialog. The card control for this project is the honest return target. */
  function getDeepLinkTarget(projectId) {
    var grid = document.getElementById("projects-grid");
    if (grid) {
      var btn = grid.querySelector(
        '.project-card__details[data-project-id="' + projectId + '"]'
      );
      if (btn && !btn.closest(".filter-hidden")) return btn;
    }
    return null;
  }

  function focusRestoreTarget() {
    if (window.DialogUtil.isRestorable(lastFocused)) return lastFocused;
    return getDeepLinkTarget(currentProjectId) || document.querySelector(window.DialogUtil.FOCUSABLE_SELECTOR) || document.body;
  }

  function showProject(projectId) {
    var config = configs[projectId];
    if (!config) return false;
    currentProjectId = projectId;
    modalScrollFired = new Set();

    var content = modal.querySelector("#project-modal__content");
    content.innerHTML = renderContent(config, renderNav(projectId));

    var live = modal.querySelector("#project-modal__live");
    if (live) {
      live.textContent = getProjectTitle(config, projectId);
    }

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    modal.hidden = false;
    shouldBeOpen = true;
    requestAnimationFrame(function () {
      if (shouldBeOpen) modal.classList.add("project-modal--open");
    });
    document.body.classList.add("modal-open");
    return true;
  }

  function navigate(direction) {
    if (!currentProjectId) return;
    var items = getNavigableProjects();
    if (items.length < 2) return;
    var index = getNavIndex(items, currentProjectId);
    /* Unreachable: renderNav omits the footer for a project outside the chain,
       so there is no button to press. */
    if (index === -1) return;
    var target = items[(index + direction + items.length) % items.length];
    if (!target) return;

    var fromId = currentProjectId;
    showProject(target.id);

    /* replaceState, not pushState: Back must still close the modal instead of
       stepping back through the chain. */
    if (history.replaceState) {
      history.replaceState({ projectModal: target.id }, "", "#" + target.id);
    }

    var live = modal.querySelector("#project-modal__live");
    if (live) {
      live.textContent = getProjectTitle(target.config, target.id);
    }

    /* Focus follows the pressed control so the same key walks the chain.
       lastFocused is untouched: closing must still restore focus to the card
       that opened the modal. */
    var btn = modal.querySelector(
      '.project-modal__nav-btn[data-nav-direction="' + direction + '"]'
    );
    /* preventScroll, and the reset after it: .project-modal is the scroll
       container, and focusing the footer would otherwise scroll it back into
       view. */
    if (btn) {
      btn.focus({ preventScroll: true });
    } else {
      modal.focus({ preventScroll: true });
    }
    modal.scrollTop = 0;

    if (window.Analytics && typeof window.Analytics.track === "function") {
      window.Analytics.track(
        "modal-" + fromId + ":" + (direction === 1 ? "next" : "previous"),
        { slug: target.id, direction: direction }
      );
    }
  }

  function open(projectId, trigger) {
    if (!showProject(projectId)) return;

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
      window.Analytics.track("modal-" + projectId + ":open", {
        slug: projectId,
        trigger: trigger
      });
    }
  }

  function teardown(method) {
    if (!modal) return;
    var actualMethod = method || closeMethod || "unknown";
    closeMethod = null;
    if (
      currentProjectId &&
      window.Analytics &&
      typeof window.Analytics.track === "function"
    ) {
      window.Analytics.track("modal-" + currentProjectId + ":close", { slug: currentProjectId });
      window.Analytics.track("modal:" + currentProjectId + "-close-method", { slug: currentProjectId, method: actualMethod });
    }
    shouldBeOpen = false;
    modal.classList.remove("project-modal--open");
    document.body.classList.remove("modal-open");
    var restoreTo = focusRestoreTarget();
    if (restoreTo && restoreTo.focus) {
      restoreTo.focus();
    }
    scheduleHide();
    currentProjectId = null;
  }

  function close(method) {
    if (!currentProjectId) return;
    closeMethod = method || null;

    if (pushedState) {
      closingViaHistory = true;
      history.back();
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      teardown(closeMethod);
      closeMethod = null;
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

    closeBtn.addEventListener("click", function () { close("button"); });

    modal.addEventListener("transitionend", function (e) {
      if (e.target !== modal) return;
      if (modal.classList.contains("project-modal--open")) return;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      modal.hidden = true;
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        close("overlay");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        modal.classList.contains("project-modal--open") &&
        !e.lightboxHandled &&
        !(window.Lightbox && window.Lightbox.isOpen())
      ) {
        e.preventDefault();
        close("escape");
      }
    });

    modal.addEventListener("keydown", function (e) {
      if (
        e.key !== "Tab" ||
        !modal.classList.contains("project-modal--open")
      )
        return;
      /* Same hidden-subtree filter as the lightbox's getTabbableElements
         (lightbox.js): FOCUSABLE_SELECTOR screens out a removed tabindex
         only, so a button that is `hidden` while the dialog is open would
         still land in the cycle. Test the attribute, not getComputedStyle —
         .btn--icon sets display:inline-flex and beats the UA [hidden] rule,
         so a computed-style check reports these buttons as visible and the
         filter silently does nothing. If the modal itself is hidden, every
         element filters out, length is 0, and the early return below
         handles it exactly as before. */
      var focusable = Array.prototype.filter.call(
        modal.querySelectorAll(window.DialogUtil.FOCUSABLE_SELECTOR),
        function (el) { return !el.closest("[hidden]"); }
      );
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

    modal.addEventListener("click", function (e) {
      var navBtn = e.target.closest(".project-modal__nav-btn");
      if (!navBtn) return;
      var direction = parseInt(navBtn.dataset.navDirection, 10);
      if (direction === 1 || direction === -1) {
        navigate(direction);
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
      var videoSrc = "https://player.vimeo.com/video/" + videoId + "?dnt=1&badge=0&autopause=0&app_id=122963";
      if (
        window.Analytics &&
        typeof window.Analytics.track === "function" &&
        currentProjectId
      ) {
        window.Analytics.track("video:play-click", {
          projectId: currentProjectId,
          projectName: getProjectTitle(configs[currentProjectId], currentProjectId),
          videoId: videoId,
          videoSrc: videoSrc
        });
      }
      var iframe = document.createElement("iframe");
      iframe.src = videoSrc;
      iframe.title = title;
      iframe.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share";
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
    el.hidden = true;

    el.innerHTML =
      '<button class="project-modal__close btn--icon" aria-label="Close">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"/>' +
      "</svg></button>" +
      '<div class="project-modal__content" id="project-modal__content"></div>' +
      '<div class="sr-only" id="project-modal__live" aria-live="polite"></div>';

    document.body.appendChild(el);
    return el;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
