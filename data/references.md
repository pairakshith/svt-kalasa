# Credits, Sources & Acknowledgments

This document outlines the background sources, books, media attributions, and third-party services integrated into the application.

---

## Acknowledgments

I extend our deepest gratitude to everyone who lent a hand, shared feedback, or offered encouragement throughout the creation of this platform. Whether your support was direct or behind the scenes, it played a vital role in bringing this initiative to life. 

---

## Books & Audio Sources

- **Bhakti Mala (ಭಕ್ತಿ ಮಾಲಾ)** — Written by Vivekananda Bhat.
- [Prathosh.in: Vagdhenu](https://prathosh.in/vagdhenu/) — Platform used for converting stotras and shlokas into MP3 audio format.
- [ದಶಾವತಾರ ಮಂಗಳ](https://kannada.indiaforyou.in/)
- [ಜಯಮಂಗಳಂ](https://kannadanudi.com/geethavihaara/bhaktisudhe/Mangalam%20Jaya%20Mangalam)
- **Photo Credits** (Home page & icon): [paiz_shutter](https://www.instagram.com/paiz_shutter?psln=NTl1dHR6aWI1cDhl)

---

## External Services & Public Endpoints

This section outlines the third-party services, APIs, and public endpoints integrated into the application.

### 1. Form Handling Service
- **Service Provider:** [Formspree](https://formspree.io)
- **Purpose:** Manages and processes user input from application forms (contact forms, feedback).
- **Endpoint / Usage:** `https://formspree.io/f/<key>`
- **Integration Notes:** Replace `<key>` with your unique Formspree form ID/endpoint token.

### 2. Image Storage & Hosting
- **Service Provider:** [ImgBB](https://imgbb.com)
- **Purpose:** Handles cloud image hosting, media uploads, and asset management.
- **Storage Structure:** `https://<account_name>.imgbb.com/`
- **Integration Notes:**
  * Requires a valid ImgBB account and an API key for authorized uploads.
  * Uploaded images are routed to your account-specific bucket/domain URL.

### 3. Dynamic Photo Gallery CMS
- **Service Provider:** [Google Sheets](https://docs.google.com/spreadsheets/)
- **Purpose:** Serves as a zero-maintenance, live Content Management System (CMS) for the photo gallery.
- **Format:** Published CSV (`.../pub?output=csv` or `.../export?format=csv`).
- **Columns:** `imagePath, caption, category, date, title, author, publish`
- **Integration Notes:** Allows managing, adding, and reordering gallery items dynamically without editing code or committing files.

---

### Built with the assistance of free models from:
<div style="display: flex; gap: 15px; align-items: center; margin-top: 10px;">
    <a href="https://gemini.google.com"><img src="../assets/images/google-gemini-icon.svg" alt="Google Gemini" style="height:2em; width:auto; vertical-align:middle;"></a>
    <a href="https://antigravity.google"><img src="../assets/images/google-antigravity-icon.svg" alt="Google Antigravity" style="height:2em; width:auto; vertical-align:middle;"></a>
    <a href="https://claude.ai"><img src="../assets/images/claude-ai-icon.svg" alt="Claude AI" style="height:2em; width:auto; vertical-align:middle;"></a>
    <a href="https://chatgpt.com"><img src="../assets/images/chatgpt-icon.svg" alt="ChatGPT" style="height:2em; width:auto; vertical-align:middle;"></a>
</div>

---
<p align="center" style="font-size: 1.1em; margin-top: 20px;"><em>|| ಸರ್ವೇ ಜನಾಃ ಸುಖಿನೋ ಭವಂತು ||</em></p>