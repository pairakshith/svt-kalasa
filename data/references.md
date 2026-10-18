# References & Sources

This document outlines the background sources, books, and third-party services integrated into the application.

---

## Books & Audio Sources

* **Bhakti Mala (ಭಕ್ತಿ ಮಾಲಾ)** — Written by Vivekananda Bhat.
* [Prathosh.in Vagdhenu](https://prathosh.in/vagdhenu/) — Platform used for converting stotras and shlokas into MP3 audio format.
* [ದಶಾವತಾರ ಮಂಗಳ ](https://kannada.indiaforyou.in/%E0%B2%AA%E0%B2%B0%E0%B2%AE-%E0%B2%AA%E0%B3%81%E0%B2%B0%E0%B3%81%E0%B2%B7-%E0%B2%B9%E0%B2%B0%E0%B2%BF-%E0%B2%97%E0%B3%8B%E0%B2%B5%E0%B2%BF%E0%B2%82%E0%B2%A6/)
* [ಜಯಮಂಗಳಂ](https://kannadanudi.com/geethavihaara/bhaktisudhe/Mangalam%20Jaya%20Mangalam)
* Photo credits (Home page and icon): [paiz_shutter](https://www.instagram.com/paiz_shutter?psln=NTl1dHR6aWI1cDhl)
---

## External Services & Public Endpoints

This section outlines the third-party services, APIs, and public endpoints integrated into the application.

### 1. Form Handling Service

* **Service Provider:** [Formspree](https://formspree.io)
* **Purpose:** Manages and processes user input from application forms (contact forms, feedback).
* **Endpoint / Usage:** `https://formspree.io/f/<key>`
* **Integration Notes:** Replace `<key>` with your unique Formspree form ID/endpoint token.

### 2. Image Storage & Hosting

* **Service Provider:** [ImgBB](https://imgbb.com)
* **Purpose:** Handles cloud image hosting, media uploads, and asset management.
* **Storage Structure:** `https://<account_name>.imgbb.com/`
* **Integration Notes:**
  * Requires a valid ImgBB account and an API key for authorized uploads.
  * Uploaded images are routed to your account-specific bucket/domain URL.

### 3. Dynamic Photo Gallery CMS

* **Service Provider:** [Google Sheets](https://docs.google.com/spreadsheets/)
* **Purpose:** Serves as a zero-maintenance, live Content Management System (CMS) for the photo gallery.
* **Format:** Published CSV (`.../pub?output=csv` or `.../export?format=csv`).
* **Columns:** `imagePath,id,title,category,categoryKn,caption,date`
* **Integration Notes:** Allows managing, adding, and reordering gallery items dynamically without editing code or committing files.

<!-- ### 4. Privacy-Friendly Analytics

* **Service Provider:** [GoatCounter](https://www.goatcounter.com)
* **Purpose:** Tracks anonymous page visits and site popularity privately without cookies or collecting personal visitor data.
* **Dashboard:** `https://svt-kalasa.goatcounter.com`
* **Beacon Endpoint:** `https://svt-kalasa.goatcounter.com/count`
* **Integration Notes:** Loaded asynchronously with zero frontend badges or visual widgets to preserve clean UI. -->

---
---
### With the help of: 
Free models of- 
<a href="https://gemini.google.com"><img src="../assets/images/google-gemini-icon.svg"  alt="Google-Gemini" style="height:2em; width:auto; vertical-align:middle;"></a> <a href="https://antigravity.google"><img src="../assets/images/google-antigravity-icon.svg" alt="Google Antigravity" style="height:2em; width:auto; vertical-align:middle;"></a> <a href="https://claude.ai"><img src="../assets/images/claude-ai-icon.svg" alt="Claude" style="height:2em; width:auto; vertical-align:middle;"></a> <a href="https://chatgpt.com"><img src="../assets/images/chatgpt-icon.svg" alt="ChatGPT" style="height:2em; width:auto; vertical-align:middle;"> </a> 
