(function () {
  "use strict";

  function makePlaceholder() {
    return "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"220\" height=\"220\">" +
        "<rect width=\"220\" height=\"220\" fill=\"%23d0d0d0\"/>" +
      "</svg>"
    );
  }

  const photos = [
  { src: "../assets/images/film/webp/IMG_0001.webp", alt: "hand holding coffee", lightboxSrc: "../assets/images/film/IMG_0001.jpg" },
  { src: "../assets/images/film/webp/IMG_0002.webp", alt: "music express carnival ride", lightboxSrc: "../assets/images/film/IMG_0002.jpg" },
  { src: "../assets/images/film/webp/IMG_0003.webp", alt: "lemonade stand at carnival", lightboxSrc: "../assets/images/film/IMG_0003.jpg" },
  { src: "../assets/images/film/webp/IMG_0004.webp", alt: "ferris wheel", lightboxSrc: "../assets/images/film/IMG_0004.jpg" },
  { src: "../assets/images/film/webp/IMG_0005.webp", alt: "beach shore", lightboxSrc: "../assets/images/film/IMG_0005.jpg" },
  { src: "../assets/images/film/webp/IMG_0006.webp", alt: "two coffees on counter", lightboxSrc: "../assets/images/film/IMG_0006.jpg" },
  { src: "../assets/images/film/webp/IMG_0007.webp", alt: "all day coffee shop", lightboxSrc: "../assets/images/film/IMG_0007.jpg" },
  { src: "../assets/images/film/webp/IMG_0008.webp", alt: "power to the people protest sign", lightboxSrc: "../assets/images/film/IMG_0008.jpg" },
  { src: "../assets/images/film/webp/IMG_0009.webp", alt: "carnival ride", lightboxSrc: "../assets/images/film/IMG_0009.jpg" },
  { src: "../assets/images/film/webp/IMG_0010.webp", alt: "carnival games", lightboxSrc: "../assets/images/film/IMG_0010.jpg" },
  { src: "../assets/images/film/webp/IMG_0011.webp", alt: "no kings protest", lightboxSrc: "../assets/images/film/IMG_0011.jpg" },
  { src: "../assets/images/film/webp/IMG_0012.webp", alt: "all day coffee shop ventanita", lightboxSrc: "../assets/images/film/IMG_0012.jpg" },
  { src: "../assets/images/film/webp/IMG_0014.webp", alt: "no witchcraft sign on a tree", lightboxSrc: "../assets/images/film/IMG_0014.jpg" },
  { src: "../assets/images/film/webp/IMG_0015.webp", alt: "witchcraft behind tree", lightboxSrc: "../assets/images/film/IMG_0015.jpg" },
  { src: "../assets/images/film/webp/IMG_0016.webp", alt: "all day coffee shop 2", lightboxSrc: "../assets/images/film/IMG_0016.jpg" },
];

  function init() {
    const grid = document.getElementById("film-grid");
    if (!grid) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const cell = entry.target;
        const targetImg = cell.querySelector(".film-grid__image");
        if (!targetImg || targetImg.dataset.loaded) return;
        targetImg.dataset.loaded = "true";
        const fullSrc = cell.dataset.src;
        const fullImg = new Image();
        fullImg.onload = () => {
          targetImg.src = fullSrc;
          targetImg.classList.remove("film-grid__image--placeholder");
          targetImg.classList.add("film-grid__image--loaded");
          if (fullImg.naturalWidth < fullImg.naturalHeight) {
            targetImg.classList.add("film-grid__image--portrait");
          }
        };
        fullImg.src = fullSrc;
        observer.unobserve(cell);
      });
    }, { rootMargin: "200px" });

    photos.forEach((photo, index) => {
      const cell = document.createElement("div");
      cell.className = "film-grid__cell";
      cell.dataset.index = index;
      cell.dataset.src = photo.src;
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");

      const placeholder = makePlaceholder();
      const img = document.createElement("img");
      img.className = "film-grid__image film-grid__image--placeholder";
      img.src = placeholder;
      img.alt = photo.alt;
      img.decoding = "async";

      cell.appendChild(img);
      observer.observe(cell);
      grid.appendChild(cell);
    });

    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".film-grid__cell");
      if (!cell) return;
      const index = parseInt(cell.dataset.index, 10);
      window.Lightbox.open({ items: photos, startIndex: index, showNav: true });
    });

    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cell = e.target.closest(".film-grid__cell");
      if (!cell) return;
      e.preventDefault();
      const index = parseInt(cell.dataset.index, 10);
      window.Lightbox.open({ items: photos, startIndex: index, showNav: true });
    });

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
