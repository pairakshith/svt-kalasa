# ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ (SVT Kalasa)

**Live site:** <https://pairakshith.github.io/svt-kalasa/>

A digital information hub for **Sri Venkataramana Temple, Melangadi, Kalasa**. It gives devotees festival schedules, religious traditions, daily rituals, and the temple's history, in **Kannada** with key terms in **English**.

[CONTRIBUTIONS ARE WELCOME !!!](#contributions-are-welcome)

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Updating Content](#updating-content)
- [License](#license)
- [Contact](#contact)

---

## Features

- **Event Timetables:** Festival calendar and daily ritual schedules.
- **Traditions & Festivals:** Descriptions of 15+ temple festivals, loaded dynamically from Markdown (`traditions.md`).
- **Photo Gallery:** Browse temple photos with a lightbox viewer, category filters, and a submission form for devotees.
- **Bilingual Content:** Primarily Kannada, with key terms in English.
- **Anonymous Feedback:** A floating feedback modal powered by Formspree, which keeps contact details private.
- **Interactive Location:** Embedded Google Maps routing from the site header.
- **Responsive Design:** Glassmorphism styling, optimized for mobile screens.

---

## Project Structure

```
svt-kalasa/
├── index.html          # Home page
├── pages/              # Subpages (events, rituals, history, photos, ...)
├── css/                # Stylesheets (including gallery styles)
├── js/                 # Scripts (gallery, feedback, footer loader, back-to-top)
├── data/               # Content data (gallery.json)
├── assets/             # Images and other static files
├── how_to/             # Information on updatig data/image
├── IMPROVEMENT_POINTS.md
├── .nojekyll           # Tells GitHub Pages to serve files as-is
└── LICENSE
```

---

## Getting Started

The site is plain HTML, CSS, and JavaScript. It needs no build step.

1. Clone the repository:
   ```bash
   git clone https://github.com/pairakshith/svt-kalasa.git
   cd svt-kalasa
   ```
2. Open `index.html` in a browser.

   The gallery loads its data with `fetch`, so some browsers block it when a page is opened straight from the file system. If the gallery shows "ಚಿತ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ", run a local server instead:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit <http://localhost:8000>.

**Deployment:** The site is published with GitHub Pages from the `main` branch.

---

### Festivals and traditions

Festival descriptions are in `traditions.md`. Edit the Markdown file, and the page updates the next time it loads.

---

## Contributions are welcome 

Especially corrections to religious content, Kannada translations, and fixes for mobile layout.

1. Fork the repository and create a branch for your change.
2. Make your change and test it in a browser, including on a narrow screen. (e.g.: MobileView extension in VS code)
3. Open a pull request that describes what you changed and why.

For bugs or suggestions, please [open an issue](https://github.com/pairakshith/svt-kalasa/issues). Check `IMPROVEMENT_POINTS.md` first, since some improvements are already planned.

For religious content (rituals, dates, and traditions), please contact the temple or the below contact.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

**Website feedback:** Use the feedback button on any page of the site. Your details **stay private**.

**Report a bug or suggest a feature:** [GitHub Issues](https://github.com/pairakshith/svt-kalasa/issues)

**Project maintainer:** [@pairakshith](https://github.com/pairakshith)

**Currently maintained by this profile only:**

- Email: `[rakshithpai17@gmail.com]`

