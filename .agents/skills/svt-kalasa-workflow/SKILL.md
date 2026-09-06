---
name: svt-kalasa-workflow
description: >-
  Workflow guide for developing, managing calendar events, mobile optimization, and styling pages in the SVT Kalasa website.
  Use this skill when modifying event cards, updating page layouts, refining mobile UI/UX, or adding new festival records.
---

# SVT Kalasa Website Development & Event Management Skill

This skill provides guidelines and procedures for building and maintaining pages, calendar event cards, mobile-first responsive design, and styles for the SVT Kalasa project.

## Directory Layout & File Organization

- **HTML Pages**: `index.html`, `pages/*.html`
- **Styles**: `css/style.css`
- **Scripts**: `js/main.js`
- **Data References**: `pages/dummy.html` (contains source table data for temple events)

---

## Core Guidelines & Best Practices

### 📱 1. Mobile-First View & UX Priority
- **Primary Focus**: Always design and test UI components with a mobile-first mindset, as the majority of visitors access the website on mobile devices.
- **Card Stacking**: On small viewports (`@media (max-width: 640px)`), event cards must stack vertically (`flex-direction: column`) with horizontal date banners (`flex-direction: row`).
- **Touch Targets**: Buttons, search inputs, and navigation links must have at least `44px` height/padding to ensure effortless touch interaction.
- **Kannada Font Readability**: Maintain comfortable line-height (`1.8`) and font size (`>= 17px`) to prevent glyph overlap on small screens.
- **Viewport Meta Tag**: Always ensure `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is included in all page headers.

### 📅 2. Calendar Event Cards (`pages/events.html`)
When adding or updating festival event cards:
- Use standard `<article class="festival-card" data-keywords="...">` structure.
- Include English date badges:
  ```html
  <div class="date-badge">
      <span class="day">19</span>
      <span class="month-year">March 2026</span>
  </div>
  ```
- Set `data-keywords` on each card to include transliterated English titles, tithis, donor names, and dates for dual-language search support.

### 🔍 3. Search & Interactivity (`js/main.js`)
- Ensure `filterCards()` checks both card text and `data-keywords` attributes case-insensitively.
- Show/hide `#noResultsMsg` when no search matches exist.

### 🎨 4. Styling Guidelines (`css/style.css`)
- Follow the color palette:
  - Deep crimson page headings: `#800020`
  - Golden accent highlights: `#f59e0b` / `#d97706`
  - Tithi pill tag background: `#fef3c7`, text: `#92400e`
- Use fluid padding/margins (`rem` / `%`) to prevent horizontal scrolling on mobile screens.
