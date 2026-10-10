# Sri Venkataramana Temple (SVT Kalasa) — Photo Gallery & Contribution Guide

This guide covers the setup, maintenance, and user workflow for the zero-budget photo gallery and contribution system.

---

## 1. System Architecture

* **Gallery Display:** Driven by `data/gallery.json` and rendered into a responsive grid with lazy loading.
* **Photo Submission:** Supports local file uploads via ImgBB and text data routing via Formspree.
* **Graceful Fallbacks:** If API endpoints return errors, users receive a fallback modal with pre-filled WhatsApp and Email dispatch buttons.

---

## 2. Developer Setup & Maintenance

### Formspree & ImgBB Configuration

1. **Formspree:** Set up a free account at [Formspree](https://formspree.io), create a form, and update `FORMSPREE_ENDPOINT` in `js/gallery.js` with your unique endpoint URL.
2. **ImgBB API:** Register for a free key at [ImgBB API](https://api.imgbb.com/) and assign it to `IMGBB_API_KEY` in `js/gallery.js` to enable automatic direct image hosting.
<!-- 3. **WhatsApp / Email Fallback:** If `IMGBB_API_KEY` is left blank, submissions redirect to WhatsApp and Email. Configure your contact details in `js/gallery.js`:
* `TEMPLE_PHONE` = `+91948123457`
* `TEMPLE_EMAIL` = `test@gmail.com` -->



### Publishing Devotee Photos

When you receive a submission from Formspree, you can publish it using two methods:

* **Option A (Direct Link):** Use the ImgBB link provided in the submission and add it directly to `data/gallery.json`.
* **Option B (Local Storage):** Save the image into `assets/images/gallery/` and reference its local path inside `data/gallery.json`.

#### Sample ImgBB JSON Structure (`data/gallery.json`)

```json
{
  "id": "svt-fest-05",
  "title": "ರಥೋತ್ಸವದ ಭವ್ಯ ಮೆರವಣಿಗೆ",
  "category": "festivals",
  "categoryKn": "ಉತ್ಸವಗಳು",
  "imagePath": "https://i.ibb.co/xyz123/utsava.jpg", <direct link option in imgbb>
  "caption": "ಭಕ್ತರಾದ ರಮೇಶ್ ರಾವ್ ರವರು ಹಂಚಿಕೊಂಡ 2026 ರ ರಥೋತ್ಸವದ ಸುಂದರ ದೃಶ್ಯ.",
  "date": "2026-03-26"
}

```

#### Supported Category Keys:

* `festivals` (`ಉತ್ಸವಗಳು`) — Rathotsava, Deepotsava, Car Festival
* `rituals` (`ಪೂಜೆಗಳು`) — Abhisheka, Pooja rituals
* `premises` (`ದೇವಸ್ಥಾನ`) — Temple architecture and surroundings
* `archives` (`ಹಳೆಯ ಚಿತ್ರಗಳು`) — Vintage photographs and historical events

Can be added more categories in gallery.json

---

## 3. Devotee / User Instructions

### Browsing the Gallery

* **Category Filters:** Click filters like `ಉತ್ಸವಗಳು` or `ಪೂಜೆಗಳು` to view specific categories.
* **Lightbox View:** Click any image for full-screen viewing. Use arrow keys or swipe left/right to navigate, and press Esc to close.

### Submitting Photos

1. Click the **"📸 Share Photos"** button on the page.
2. Choose a file from your device or paste a cloud link (Google Drive, Photos, ImgBB).
3. Fill out optional devotee name and description details.
4. Click **Submit** or use the **WhatsApp / Email** fallback option to send directly to temple management.