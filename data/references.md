# References & Sources

This document outlines the background sources, books, and third-party services integrated into the application.

---

## Books & Audio Sources

* **Bhakti Mala (ಭಕ್ತಿ ಮಾಲಾ)** — Written by Vivekananda Bhat.
* [Prathosh.in Vagdhenu](https://prathosh.in/vagdhenu/) — Platform used for converting stotras and shlokas into MP3 audio format.
* [ದಶಾವತಾರ ಮಂಗಳ ](https://kannada.indiaforyou.in/%E0%B2%AA%E0%B2%B0%E0%B2%AE-%E0%B2%AA%E0%B3%81%E0%B2%B0%E0%B3%81%E0%B2%B7-%E0%B2%B9%E0%B2%B0%E0%B2%BF-%E0%B2%97%E0%B3%8B%E0%B2%B5%E0%B2%BF%E0%B2%82%E0%B2%A6/)
* [ಜಯಮಂಗಳಂ](https://kannadanudi.com/geethavihaara/bhaktisudhe/Mangalam%20Jaya%20Mangalam)
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
* **Storage Structure:** `https://<account_name>[.imgbb.com/](https://.imgbb.com/)`
* **Integration Notes:**
* Requires a valid ImgBB account and an API key for authorized uploads.
* Uploaded images are routed to your account-specific bucket/domain URL.