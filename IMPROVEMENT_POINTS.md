# Improvement Points & Future Roadmap

## 1. Open Source & Public Repository Adaptation

* Explore how open-source public repositories and community-driven tools can be adapted. Specifically, integrate or reference tools like [Aksharamukha](https://www.google.com/search?q=https://github.com/auplat/aksharamukha)—an open-source Python library and web tool for script conversion and transliteration across numerous Indic scripts—to enhance multi-script accessibility.
* Refine pull request templates and contribution guidelines to streamline community-driven updates.

## 2. Repository Architecture & Maintainability

* Restructure the current repository to be robust, modular, and easy to maintain over time.
* Clean up file directory paths, separate styling/scripts efficiently, and organize documentation to ensure scalability for future contributors.

## 3. Local History & Ritual Documentation

* Gather and archive more granular data regarding local temple history, architectural milestones, and traditional rituals.
* Collaborate with local sources and authoritative texts to verify historical accuracy.

## 4. Stories Behind Practices

* Document the folklore, historical origins, and spiritual significance behind specific daily and annual temple practices.
* Integrate multimedia resources—such as MP3 audio conversions for shlokas and stotras—to enrich the user experience.

## 5. Reusable Template & Scalability

* Design a generalized, modular repository template based on this project's structure.
* Clean up repetitive code and remove unused code to optimize performance.
* Plan the expansion of this framework to support similar heritage, cultural, or religious institution documentation projects.

---


# Site Visit Tracking (GoatCounter)

## What it does
Counts site visits and shows them in a private dashboard. Nothing is displayed on the website.

## Setup
1. Sign up at goatcounter.com and choose a code, e.g. `svt-kalasa`.
2. Add this tag before `</body>` on each page (or once in `js/footer-loader.js` if every page loads it):

```html
<script data-goatcounter="https://svt-kalasa.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
```

3. Open the dashboard to view visits, pages, and referrers.

## Reset (before going live)
Settings → Manage pageviews → enter `%` → delete.
Verify the counts drop to zero.

## Notes
- Don't delete the whole site. Deleted sites are kept for about a week and can come back.
- Deleted data can't be recovered.
- Free for non-commercial use.
- Data is privacy-friendly: no cookies, no personal data.