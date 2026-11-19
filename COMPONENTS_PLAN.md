# Component Implementation Plan

## Remaining Components

Based on the explorer subagent audit, here are the remaining components to implement, in priority order:

### 1. `modal` (dialog shell) — CSS base + JS util
**Priority:** High (4 independent implementations, focus trap ×4)

**Current state:** 4 separate implementations (privacy, project, lightbox, mobile menu) with duplicated focus trap logic.

**Implementation plan:**
1. Define CSS base: `.modal`, `.modal--open`, `.modal__overlay`, `.modal__content`, `.modal__close`
2. Add `trapFocus(container, e)` and `scheduleHide(el, class, cb)` to `dialog-util.js`
3. Update all 4 implementations to use shared utilities
4. Add design tokens: `--modal-width`, `--modal-backdrop`, `--modal-z-index`
5. Add accessibility: `aria-modal`, `aria-labelledby`, focus restoration

**Files to modify:**
- `css/styles.css` — modal CSS base
- `js/dialog-util.js` — shared focus trap + hide scheduling
- `js/umami-helpers.js` — privacy modal (use shared util)
- `js/project-modal.js` — project modal (use shared util)
- `js/lightbox.js` — lightbox (use shared util)
- `js/scripts.js` — mobile menu (use shared util)

**Design tokens needed:**
- `--modal-width: 480px`
- `--modal-backdrop: rgba(0, 0, 0, 0.5)`
- `--modal-z-index: 1000`

### 2. `container` (layout primitive) — CSS-only
**Priority:** High (8 occurrences, zero risk)

**Current state:** `max-width: var(--max-width); margin: 0 auto` repeated 8× with different padding.

**Implementation plan:**
1. Define `.container` class with max-width + margin auto + default padding
2. Add `.container--flush` variant (padding 0)
3. Update all 8 occurrences to use `.container`
4. Remove per-section max-width/padding (keep padding-block overrides)

**Files to modify:**
- `css/styles.css` — container CSS
- All HTML files — replace inline max-width with `.container`

**Design tokens needed:**
- `--container-max-width: var(--max-width)` (alias)
- `--container-padding: var(--space-md)`

### 3. `nav-list` (primary nav) — template component
**Priority:** High (2× full-file duplication, drift risk)

**Current state:** `navbar.html` and `navbar-secondary.html` duplicate 24 lines (nav list + theme toggle SVGs).

**Implementation plan:**
1. Create `assets/components/_nav-list.html` with placeholders
2. Add `render(name, vars)` to `components.js`
3. Update navbar.html and navbar-secondary.html to use template
4. Kill "NAVBAR: sync with 404.html" drift risk

**Files to modify:**
- `assets/components/_nav-list.html` — new template
- `assets/components/navbar.html` — use template
- `assets/components/navbar-secondary.html` — use template
- `js/components.js` — add render function

### 4. `section-header` (page title + rule) — CSS-only
**Priority:** Medium (already half-done)

**Current state:** Grouped selectors for `.work-header,.film-header` and `.work-title,.film-title`.

**Implementation plan:**
1. Define `.section-header`, `.section-header__title`, `.section-header__rule`, `.section-header__subhead`
2. Rename work/film/page blocks onto new classes
3. Update HTML to use new classes

**Files to modify:**
- `css/styles.css` — section-header CSS
- `work/index.html`, `film/index.html`, `404.html`, `template.html` — update classes

### 5. `experience-row` (experience row) — CSS-only
**Priority:** Medium (5 identical rows)

**Current state:** 5 identical rows in index.html using `.experience__row/__role/__title-primary/__company/__years`.

**Implementation plan:**
1. Define `.experience-row`, `.experience-row__primary`, `.experience-row__title`, `.experience-row__sub`, `.experience-row__meta`
2. Update index.html to use new classes
3. Absorb existing `.experience__*` classes

**Files to modify:**
- `css/styles.css` — experience-row CSS
- `index.html` — update classes

### 6. `card--project` — template component (document, don't restructure)
**Priority:** Medium (17 instances, data-attr contract)

**Current state:** Stable structure with data-attribute contract to scripts.js/project-modal.js.

**Implementation plan:**
1. Document the component structure and data-attribute contract
2. Collapse 5 image-wrapper modifiers to `--ratio` token
3. Create reference file in `assets/components/` (optional)
4. Do NOT rename data attributes (migration risk)

**Files to modify:**
- `css/styles.css` — collapse modifiers to `--ratio` token
- `assets/components/project-card.html` — reference file (optional)

### 7. `switch` (form control) — CSS-only
**Priority:** Low (only one instance)

**Current state:** `.privacy-switch` with `--refused` state.

**Implementation plan:**
1. Rename from `privacy-switch` to `switch`
2. Update privacy-modal.html and umami-helpers.js
3. Document as reusable pattern

**Files to modify:**
- `css/styles.css` — rename classes
- `assets/components/privacy-modal.html` — update classes
- `js/umami-helpers.js` — update selectors

### 8. `icon` (SVG paths) — template/snippet
**Priority:** Low (3× close-X, 3× arrow)

**Current state:** SVG paths duplicated across files.

**Implementation plan:**
1. Create `assets/icons/sprite.svg` with `<symbol>` elements
2. Update all references to use `<use href="/assets/icons/sprite.svg#icon-name">`
3. Or create `js/icons.js` returning path `d` strings

**Files to modify:**
- `assets/icons/sprite.svg` — new file
- All HTML/JS files — update SVG references

### 9. `<head>` boilerplate — template only
**Priority:** Low (all 5 pages duplicate ~30 lines)

**Current state:** `template.html` already has placeholders.

**Implementation plan:**
1. Formalize template.html as canonical source
2. Fix 404.html duplicate robots tags
3. Document the build process (if any)

**Files to modify:**
- `template.html` — canonical source
- `404.html` — remove duplicate robots tags

### 10. `btn` migration — update existing classes
**Priority:** High (20+ call sites)

**Current state:** `btn` component implemented but existing classes not migrated.

**Implementation plan:**
1. Update HTML to use `.btn .btn--primary` instead of `.hero__view-work-btn`
2. Update HTML to use `.btn .btn--primary` instead of `.project-card__details`
3. Update HTML to use `.btn .btn--secondary` instead of `.hero__linkedin-btn`
4. Update HTML to use `.btn .btn--secondary` instead of `.project-modal__nav-btn`
5. Keep old classes as aliases for backward compat (optional)
6. Remove dead classes: `.btn--solid`, `.experience__view-work`, `.navbar__left`, `.navbar__toggle-bar`

**Files to modify:**
- `index.html` — hero buttons
- `work/index.html` — project card details buttons
- `js/project-modal.js` — modal nav buttons
- `css/styles.css` — remove dead code

## Implementation Order

1. **Design tokens** (finalize simplified names) — ✅ Done
2. **btn component** (first implementation) — ✅ Done
3. **modal/dialog** (highest impact, 4 implementations)
4. **container** (8 occurrences, zero risk)
5. **nav-list** (2× duplication, drift risk)
6. **section-header** (already half-done)
7. **experience-row** (5 identical rows)
8. **card--project** (document, don't restructure)
9. **switch** (rename only)
10. **icon** (sprite or JS)
11. **head boilerplate** (template only)
12. **btn migration** (update existing classes)

## Subagent Guidelines

When implementing each component, use the `component-implementation` skill for:
- Design token naming convention
- BEM naming
- Dark mode overrides
- Accessibility requirements
- Testing checklist
- Documentation requirements

Dispatch one subagent per component. Verify each before moving to the next.

## Near-Duplicate Hardcoded Values

### Spacing (near-duplicates)
| Value | Count | Recommendation |
|-------|-------|----------------|
| `width: 20px` + `height: 20px` | 4× each | `--icon-size-md: 20px` |
| `width: 40px` + `height: 40px` | 3× each | `--icon-size-lg: 40px` |
| `width: 44px` + `height: 33px` | 2× each | `--logo-width: 44px`, `--logo-height: 33px` |
| `width: 16px` + `height: 16px` | 1× each | `--icon-size-sm: 16px` |
| `padding: 0.75rem` | 3× | Use `--space-sm` (1rem) or new `--space-md-sm` |
| `gap: 4%` | 2× | `--gap-sm: 4%` |

### Colors (near-duplicates)
| Value | Count | Recommendation |
|-------|-------|----------------|
| `#fff` | 18× | `--surface-inverted` (already defined) |
| `#000` | 12× | `--text-inverted` (already defined) |
| `#282828` | 3× | `--text` (light mode) |
| `#e5e5e5` | 5× | `--text` (dark mode) |
| `#3a3632` | 3× | `--text` (neutral mode) |
| `#1a1a1a` | 4× | `--bg` (dark mode) |
| `#f5f5f5` | 1× | `--bg` (light mode) |
| `#f5f0eb` | 1× | `--bg` (neutral mode) |
| `#0975f1` | 3× | `--accent` (already defined) |
| `rgba(128, 128, 128, 0.25)` | 3× | `--divider` (already defined) |
| `rgba(0, 0, 0, 0.75)` | 3× | `--overlay-lightbox` (already defined) |
| `rgba(0, 0, 0, 0.5)` | 3× | `--overlay-privacy` (already defined) |
| `rgba(255, 255, 255, 0.30)` | 4× | `--overlay-hover: rgba(255, 255, 255, 0.30)` |
| `rgba(255, 255, 255, 0.15)` | 2× | `--overlay-subtle: rgba(255, 255, 255, 0.15)` |
| `rgba(255, 255, 255, 0.4)` | 2× | `--cursor-border` (dark, already defined) |
| `rgba(255, 255, 255, 0.2)` | 2× | `--divider` (dark, already defined) |
| `rgba(0, 0, 0, 0.35)` | 2× | `--cursor-border` (light, already defined) |
| `#d63b3b` | 2× | `--color-danger: #d63b3b` |
| `rgba(9, 117, 241, 0.8)` | 1× | `--accent-glow: rgba(9, 117, 241, 0.8)` |
| `rgba(214, 59, 59, 0.55)` | 1× | `--danger-glow: rgba(214, 59, 59, 0.55)` |

### JS Quality Issues (Verify Before Fixing)

From oracle review:

**Critical (already fixed):**
1. ✅ Component injection race — Fixed (components:loaded event)
2. ✅ Work page missing scripts — Fixed (lightbox.js + project-modal.js)

**Major (pending verification):**
3. Cursor animation loop — requestAnimationFrame runs forever (no pause/idle)
4. Focus trap duplication — 4 copies, should consolidate in dialog-util.js
5. Lightbox empty items — crashes on empty items array

**Minor (pending verification):**
6. Lightbox iframe missing title attribute
7. aria-modal without inerting background
8. Layout read (scrollHeight) on every scroll event
9. film.js inconsistent null handling for photo.alt
10. project-modal.js videoId not validated
11. Event expando coupling (e.lightboxHandled)
12. project-modal.js monolith (240+ lines, 8 click handlers)
13. closingViaHistory dead state
14. deriveSlug duplicated (lightbox.js and film.js)
15. components.js fetch failure (no retry, no event)
16. umami-helpers.js trigger.focus() unconditional
17. umami-helpers.js invasive.closest() unguarded
18. umami-helpers.js stale comment
19. lightbox.js innerHTML += (replaces backdrop node)
20. scripts.js indentation of openLightboxForElement

### Where to Review Suggested Fixes

- **JS quality:** Oracle subagent results (critical: C1, C2; major: M1-M3; minor: m1-m15)
- **Accessibility:** Explorer subagent results (high: 3, medium: 3, low: 4)
- **CSS design system:** Designer subagent results (token audit + recommendations)
- **Component opportunities:** Explorer subagent results (10 components with priority)
- **AGENTS.md best practices:** Explorer subagent results (sections, conventions, boundaries)

### Suggested Fixes Location

All subagent findings are in the conversation history above. Key files to review:
- `css/styles.css` — CSS audit findings (lines referenced in designer results)
- `js/scripts.js` — JS quality findings (lines referenced in oracle results)
- `js/lightbox.js` — Lightbox issues (lines referenced in oracle results)
- `js/project-modal.js` — Project modal issues (lines referenced in oracle results)
- `js/umami-helpers.js` — Privacy modal issues (lines referenced in oracle results)
- `work/index.html` — 20 project card images needing accessibility fixes
- `assets/components/navbar-secondary.html` — duplicate aria-current
- `assets/components/navbar.html` — theme toggle aria-label

---

## Answers to User Questions

### 1. Why do we use "--" in CSS?
The `--` prefix is the CSS custom property convention (defined in the CSS spec). All CSS custom properties (variables) MUST start with `--`. This distinguishes them from standard CSS properties (like `color`, `margin`, etc.). The browser ignores any property not starting with `--` that isn't a known CSS property.

### 2. How to test the btn component?
1. **Visual:** Run `npx serve .` and visit pages with buttons (index.html hero, work/index.html project cards)
2. **Dark mode:** Toggle theme and verify button inversion
3. **Keyboard:** Tab to buttons, verify focus outline (2px solid, 2px offset)
4. **Disabled:** Add `disabled` attribute, verify opacity 0.5 and no pointer events
5. **Responsive:** Check button sizing on mobile
6. **Console:** No errors in browser console

### 3. Where to review suggested fixes?
All subagent findings are documented in the conversation history. See "Where to Review Suggested Fixes" section above for specific file/line references.

### 4. JS quality: verify each before fixing
Agreed. Each JS issue should be verified individually before implementing fixes. The oracle review provides confidence levels (95% for critical, etc.) and double-check verdicts.