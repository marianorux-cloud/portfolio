# Project Agent Instructions

## Commands

```bash
# Serve locally
npx serve .  # http://localhost:3000

# Convert PNG to WebP (quality 92)
cwebp -q 92 input.png -o output.webp

# Verify no PNG references
grep -rn "\.png" --include="*.html" --include="*.js" --include="*.css" .
```

## Boundaries

**Never:**
- Add PNG fallbacks (WebP only, 99%+ browser support)
- Push directly to `main` (use PR from v2)
- Invent content or facts (ask if unclear)
- Overwrite files without approval
- Add `console.log` to production code

**Ask first:**
- Large refactors affecting multiple files
- New dependencies
- Destructive git operations
- Changes to deployment workflow

## Project Overview
Portfolio website for Mariano Rodriguez (Principal UX Designer).
Static site deployed to GitHub Pages. No build step.

## Tech Stack
- HTML5, CSS3, vanilla JavaScript
- WebP images (quality 92)
- Client-side component injection via `js/components.js`
- GitHub Pages deployment

## Directory Structure
```
/
├── assets/
│   ├── components/     # HTML component templates
│   ├── images/         # WebP images only
│   ├── fonts/          # WOFF2 fonts
│   └── icons/          # SVG icons
├── css/
│   └── styles.css      # Main stylesheet
├── js/
│   ├── components.js   # Component injection script
│   ├── theme-init.js   # Theme initialization (runs in <head>)
│   ├── dialog-util.js  # Dialog utilities
│   ├── umami-helpers.js # Analytics helpers
│   ├── scripts.js      # Main scripts
│   ├── lightbox.js     # Lightbox functionality
│   ├── project-modal.js # Project modal
│   └── film.js         # Film page scripts
├── work/               # Work portfolio page
├── film/               # Film photography page
├── index.html          # Home page
├── 404.html            # Error page
└── template.html       # Page template
```

## Component System
Components are HTML fragments in `assets/components/`:
- `navbar.html` — Home page navbar (menu toggle)
- `navbar-secondary.html` — Work/Film pages (back button)
- `footer.html` — Shared footer
- `privacy-modal.html` — Shared privacy consent modal

Injected via `js/components.js` using `data-component` attributes:
```html
<header data-component="navbar-mobile"></header>
<footer data-component="footer"></footer>
<div data-component="privacy-modal"></div>
```

Fetch paths must be absolute (`/assets/components/...`) for subpage compatibility.

## Image Guidelines
- **Format:** WebP only (quality 92)
- **No PNG fallbacks** (WebP support is 99%+)
- **File naming:** descriptive, lowercase, hyphen-separated
- **Lightbox full-size:** Use `data-full` attribute pointing to WebP
- **Social sharing:** OG/Twitter meta must use absolute WebP URLs

## CSS Conventions
- Design tokens as CSS custom properties in `:root`
- Redwood-inspired naming: `--color-text-primary`, `--color-icon-primary`, `--color-divider`, etc.
- Component-based naming (BEM-like: `.navbar__inner`, `.btn--primary`)
- Mobile-first responsive design
- Dark/light theme via `data-theme` attribute
- Relative paths in CSS must use `../` prefix (CSS is in `css/` directory)

## JavaScript Conventions
- Vanilla JS (no frameworks)
- Event delegation preferred
- No global namespace pollution
- Components fetched and injected on DOM ready
- Absolute paths for fetch (`/assets/components/...`)

## Testing
- Serve locally: `npx serve .`
- Visual verification of all pages
- Check console for errors
- Test mobile menu, theme toggle, lightbox

## Verification Checklist
- [ ] All pages render without console errors
- [ ] Components inject correctly (navbar, footer, privacy modal)
- [ ] Mobile menu opens/closes
- [ ] Theme toggle cycles through modes
- [ ] Lightbox opens with WebP images
- [ ] All images load (no broken paths)
- [ ] OG/Twitter meta tags present

## Git Workflow
- `main` branch = production (GitHub Pages deploys from main)
- `v2` branch = development/testing
- Create PR from v2 to main when ready
- Do NOT push directly to main

## Project-Level Skills
- `cove` — code review with severity classification
- `jev` — decision model for quick judgments
- `browser` — visual testing and screenshots
- `filesystem` MCP — file operations
- `websearch` — external research
- `caveman` — concise documentation style