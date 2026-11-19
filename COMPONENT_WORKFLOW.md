# Component Workflow Pattern

## Overview

This document defines the standard workflow for creating and implementing design system components in this project. It serves as the pattern for subagents to follow when implementing remaining components.

## Component Types

### CSS-Only Components
Components defined purely in CSS (no HTML template needed). Examples: `btn`, `container`, `section-header`.

**Workflow:**
1. Define design tokens in `:root` (colors, spacing, radius, shadow)
2. Create base class with BEM naming (`.component`, `.component__element`, `.component--modifier`)
3. Add variant classes (`.component--primary`, `.component--secondary`)
4. Add size classes (`.component--sm`, `.component--lg`)
5. Add state classes (`.component--disabled`, `:focus-visible`)
6. Add dark-mode overrides using `!important` only when necessary
7. Document in AGENTS.md and this file

### Template Components
Components that need HTML templates (injected via `js/components.js`). Examples: `navbar`, `footer`, `modal`.

**Workflow:**
1. Create HTML template in `assets/components/`
2. Add component marker to HTML pages (`<div data-component="name"></div>`)
3. Add injection logic to `js/components.js`
4. Add CSS styles in `css/styles.css`
5. Add JavaScript behavior (event listeners, state management)
6. Test on all pages
7. Document in AGENTS.md and this file

### Hybrid Components
Components that need both CSS and JS (like `dialog`/`modal`).

**Workflow:**
1. Define CSS base (`.modal`, `.modal--open`, `.modal__overlay`, `.modal__content`)
2. Create JS utility functions in `dialog-util.js` (trapFocus, scheduleHide, etc.)
3. Create HTML template (if needed)
4. Add injection logic
5. Wire up event listeners after `components:loaded`
6. Test all interaction paths (open, close, escape, tab trap, backdrop click)

## Design Token Naming Convention

Use simplified names (drop redundant category prefixes):

| Category | Pattern | Examples |
|----------|---------|----------|
| Text colors | `--text-*` | `--text`, `--text-secondary`, `--text-disabled` |
| Icon colors | `--icon-*` | `--icon`, `--icon-secondary` |
| Dividers | `--divider*` | `--divider`, `--divider-strong` |
| Backgrounds | `--bg*` | `--bg`, `--bg-secondary`, `--bg-tertiary` |
| Borders | `--border*` | `--border`, `--border-focus` |
| Accent | `--accent` | `--accent` |
| Inversion | `--surface-inverted`, `--text-inverted` | For dark-mode hover |
| Radius | `--radius-*` | `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-full` |
| Shadow | `--shadow-*` | `--shadow-glow` |
| Overlay | `--overlay-*` | `--overlay-lightbox`, `--overlay-privacy` |

### Redwood-Inspired Patterns
- Primary/secondary/disabled for text and icons
- Divider with default and strong variants
- Background with primary/secondary/tertiary levels
- Border with default and focus variants

## CSS Conventions

### BEM Naming
- Block: `.component`
- Element: `.component__element`
- Modifier: `.component--modifier`
- State: `.component.is-active` or `.component--active`

### Token Usage
- Always use tokens, never hardcode values
- Use `var(--token)` in CSS rules
- Define new tokens in `:root` and theme overrides
- Document token purpose in comments

### Dark Mode
- Use `[data-theme="dark"]` for dark mode overrides
- Use `@media (prefers-color-scheme: dark)` for OS preference
- Use `!important` only for inversion overrides (white/black swap)
- Prefer `color-mix()` for derived colors

## JavaScript Conventions

### Component Injection
- Components are fetched and injected on DOM ready
- `components.js` dispatches `components:loaded` event after all injections
- Consumers listen for `components:loaded` before querying injected elements
- Use absolute paths (`/assets/components/...`) for fetch

### Event Handling
- Use event delegation where possible
- Clean up event listeners on teardown
- Use `DialogUtil` for focus management
- Use `aria-live` regions for dynamic updates

### Accessibility
- Add `role="button"` + `aria-label` to interactive images
- Update `aria-label` to reflect state changes
- Use `aria-current="page"` for active nav links (set by JS)
- Use `aria-expanded` for toggle buttons
- Use `aria-hidden` for decorative elements

## Workflow for Implementing a Component

1. **Research** — Identify the component pattern and all instances
2. **Design Tokens** — Define any new tokens needed
3. **CSS** — Create base class, variants, sizes, states
4. **HTML** — Update markup to use new classes (if needed)
5. **JavaScript** — Add behavior, event listeners, state management
6. **Accessibility** — Add ARIA attributes, keyboard handling, focus management
7. **Test** — Visual verification, console check, keyboard nav
8. **Document** — Update AGENTS.md, this file, code comments
9. **Commit** — Atomic commit with clear message

## Implementation Checklist

- [ ] Design tokens defined in `:root` and theme overrides
- [ ] Base CSS class created with BEM naming
- [ ] Variants created (primary, secondary, etc.)
- [ ] Size classes created (sm, md, lg)
- [ ] State classes created (disabled, active, focus)
- [ ] Dark mode overrides added
- [ ] HTML updated to use new classes
- [ ] JavaScript behavior added (if needed)
- [ ] Accessibility attributes added
- [ ] Focus styles added
- [ ] Tested on all pages
- [ ] No console errors
- [ ] Documented in AGENTS.md
- [ ] Committed with clear message

## Example: btn Component (First Implementation)

### Design Tokens Used
- `--text`, `--bg`, `--icon` (colors)
- `--space-2xs`, `--space-xs`, `--space-sm`, `--space-md`, `--space-lg` (spacing)
- `--radius-sm`, `--radius-full` (radius)
- `--transition-fast` (transition)
- `--border`, `--border-focus` (borders)
- `--text-xs`, `--text-sm`, `--text-base` (font sizes)
- `--font-weight-medium` (font weight)
- `--leading-normal` (line height)
- `--hover-bg` (hover background)
- `--surface-inverted`, `--text-inverted` (dark mode inversion)

### CSS Implementation
```css
/* Base button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-normal);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

/* Variants */
.btn--primary { background: var(--text); color: var(--bg); border-color: var(--text); }
.btn--primary:hover { background: var(--surface-inverted); color: var(--text-inverted); border-color: var(--surface-inverted); }

.btn--secondary { background: transparent; color: var(--text); border-color: var(--border); }
.btn--secondary:hover { background: var(--hover-bg); border-color: var(--text); }

.btn--ghost { background: transparent; color: var(--text); border-color: transparent; }
.btn--ghost:hover { background: var(--hover-bg); }

.btn--icon { width: 40px; height: 40px; padding: 0; border-radius: var(--radius-full); background: transparent; color: var(--icon); border: none; }
.btn--icon:hover { background: var(--hover-bg); }
.btn--icon svg { width: 20px; height: 20px; }

/* Sizes */
.btn--sm { padding: var(--space-2xs) var(--space-xs); font-size: var(--text-xs); }
.btn--lg { padding: var(--space-md) var(--space-lg); font-size: var(--text-base); }

/* States */
.btn:disabled, .btn--disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
.btn:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
```

### HTML Usage
```html
<!-- Primary button -->
<button class="btn btn--primary">View Work</button>

<!-- Secondary button -->
<button class="btn btn--secondary">Learn More</button>

<!-- Ghost button -->
<button class="btn btn--ghost">Cancel</button>

<!-- Icon button -->
<button class="btn btn--icon" aria-label="Close">
  <svg>...</svg>
</button>

<!-- Small button -->
<button class="btn btn--primary btn--sm">Submit</button>
```

### Migration Notes
- Existing `.hero__view-work-btn` → `.btn btn--primary`
- Existing `.project-card__details` → `.btn btn--primary`
- Existing `.hero__linkedin-btn` → `.btn btn--secondary`
- Existing `.project-modal__nav-btn` → `.btn btn--secondary`
- Existing `.btn--icon` → `.btn btn--icon`
- Existing `.btn--ghost` → `.btn btn--ghost`

---

## Subagent Skill: Component Implementation

When dispatching subagents to implement remaining components, include this skill reference:

**Skill:** `component-implementation`
**Location:** `~/.config/opencode/skills/component-implementation/SKILL.md`

The skill should contain:
1. This workflow document
2. The design token naming convention
3. The CSS conventions (BEM, tokens, dark mode)
4. The implementation checklist
5. The btn component as reference example
6. Testing requirements
7. Documentation requirements

Subagents should:
- Read this skill before starting
- Follow the implementation checklist
- Test on all pages
- Document changes
- Commit with clear message
- Report findings back to orchestrator