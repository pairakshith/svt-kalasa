# 📸 Sri Venkataramana Temple (SVT Kalasa) — Photo Gallery & Zero-Budget Submission System

This guide outlines both the **Developer Setup & Maintenance Workflow** and **Devotee / User Instructions** for the 100% free, zero-budget Photo Gallery and Contribution system.

---

## 🏛️ System Architecture Overview
- **Gallery Display:** Data-driven via `data/gallery.json`, rendered dynamically into a responsive grid with lazy loading.
- **Viewing Experience:** Responsive cards with aspect-ratio preservation, sticky category filter pills, and a swipe/keyboard-navigable Lightbox modal.
- **Photo Contribution:** Zero-budget architecture supporting both local file selection (with instant `FileReader` preview) and public cloud links (Google Drive / Photos / ImgBB).
- **Graceful Fallbacks:** If the server endpoint encounters an error or returns a 404, users receive a friendly Kannada modal with one-click pre-filled **WhatsApp** and **Email** dispatch buttons.

---

# Section A: Developer Setup & Maintenance

### 1. Free Formspree Setup (Zero-Budget Text Responses)
Formspree allows 50 free monthly form submissions for text data (no credit card required):
1. Sign up for a free account at [https://formspree.io](https://formspree.io).
2. Create a new form (e.g., name it `SVT Kalasa Gallery Submissions`).
3. Set the notification email to the temple administrator's email.
4. Copy the unique form ID from the provided endpoint (e.g., `https://formspree.io/f/mqaejvyb` -> ID is `mqaejvyb`).
5. Open `js/gallery.js` and update the constant on line 12:
   ```javascript
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
   ```

---

### 2. Free Image Upload Setup (ImgBB API or Seamless Fallback)
Because Formspree charges for binary file attachments, we provide two 100% free ways to handle devotee-selected local photos:

#### Strategy 1: Free ImgBB Public API (Direct Anonymous Hosting)
1. Register for a free API key at [https://api.imgbb.com/](https://api.imgbb.com/).
2. Insert your key into `js/gallery.js`:
   ```javascript
   const IMGBB_API_KEY = 'your_free_imgbb_api_key_here';
   ```
3. When devotees pick a local file from their device, `gallery.js` automatically uploads it to ImgBB and attaches the resulting public image URL to Formspree without any user friction.

#### Strategy 2: Seamless WhatsApp / Email Forwarding (Default - No API Key Needed)
- If `IMGBB_API_KEY` is left blank, the system automatically redirects local photo submissions to a clean, pre-filled WhatsApp or Email modal.
- Devotees can send the image directly to the temple management's WhatsApp number in one click with the description already drafted.
- Update the temple contact details in `js/gallery.js`:
   ```javascript
   const TEMPLE_PHONE = '+919481234567'; // Temple WhatsApp number (with country code)
   const TEMPLE_EMAIL = 'svtkalasa@gmail.com'; // Temple admin email
   ```

---

### 3. How Photo Details Are Stored & Linked Together
When a devotee submits a photo and its information, the architecture pairs them in real time:

```
Devotee submits photo (PNG / JPG / JPEG / WebP) + Name + Category + Description
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   1. The Image File              2. The Text Details
   Uploaded to ImgBB              Sent to Formspree
   (Generates public URL,         (Stores Name, Contact, Category,
    e.g., https://i.ibb.co/abc)    Description, and the ImgBB Link)
          │                               ▲
          └─────── Image Link ────────────┘
```

1. **Image Storage (ImgBB)**: The photo is uploaded directly to ImgBB via your free API key. ImgBB hosts the full-resolution file and returns a permanent public image URL.
2. **Details Storage (Formspree)**: Formspree receives and saves a unified submission entry containing the devotee's details alongside the ImgBB image link.

---

### 4. Reviewing Submissions & Connecting Photos with Details
Whenever a devotee submits a photo, you receive an instant email notification from Formspree, or you can check your [Formspree Submissions Dashboard](https://formspree.io/forms/xjyvjoww/submissions).

Each submission record displays the complete context together:

| Field in Formspree | Value Received | How to Use |
| :--- | :--- | :--- |
| **`ಭಕ್ತರ ಹೆಸರು (Name)`** | e.g. ರಮೇಶ್ ರಾವ್ (Ramesh Rao) | Contributor credit / Acknowledgement |
| **`ಸಂಪರ್ಕ (Contact)`** | e.g. 9876543210 / email | Contact devotee if higher resolution needed |
| **`ವಿಭಾಗ (Category)`** | e.g. ಉತ್ಸವಗಳು (Festivals) | Gallery filter category |
| **`ಚಿತ್ರದ ವಿವರಣೆ (Description)`** | e.g. 2026 ರ ರಥೋತ್ಸವದ ಭವ್ಯ ಮೆರವಣಿಗೆ | Caption for the photo card |
| **`ಚಿತ್ರದ ನೇರ ಲಿಂಕ್ (Direct Image Link)`** | **`https://i.ibb.co/xyz123/utsava.jpg`** | **Click to view full photo directly** |

Because the **`Direct Image Link`** is saved in the very same submission card, you will never lose track of which details belong to which photo.

---

### 5. Adding Reviewed Devotee Photos to the Website
Once you review and approve a submission from Formspree, you have two flexible options to publish it:

#### Option A: Instant Live Publishing (Zero File Downloads)
You can directly use the ImgBB URL without downloading anything. Open `data/gallery.json` and append:
```json
{
  "id": "svt-fest-05",
  "title": "ರಥೋತ್ಸವದ ಭವ್ಯ ಮೆರವಣಿಗೆ",
  "category": "festivals",
  "categoryKn": "ಉತ್ಸವಗಳು",
  "imagePath": "https://i.ibb.co/xyz123/utsava.jpg", (direct link)
  "caption": "ಭಕ್ತರಾದ ರಮೇಶ್ ರಾವ್ ರವರು ಹಂಚಿಕೊಂಡ 2026 ರ ರಥೋತ್ಸವದ ಸುಂದರ ದೃಶ್ಯ.",
  "date": "2026-03-26"
}
```

#### Option B: Saving Locally in Repository
If you prefer keeping the image files in your Git repository:
1. Click the ImgBB link from your Formspree dashboard/email.
2. Right-click and save the image into:
   ```
   assets/images/gallery/utsava_2026.jpg
   ```
3. Open `data/gallery.json` and add:
   ```json
   {
     "id": "svt-fest-05",
     "title": "ರಥೋತ್ಸವದ ಭವ್ಯ ಮೆರವಣಿಗೆ",
     "category": "festivals",
     "categoryKn": "ಉತ್ಸವಗಳು",
     "imagePath": "../assets/images/gallery/utsava_2026.jpg",
     "caption": "ಭಕ್ತರಾದ ರಮೇಶ್ ರಾವ್ ರವರು ಹಂಚಿಕೊಂಡ 2026 ರ ರಥೋತ್ಸವದ ಸುಂದರ ದೃಶ್ಯ.",
     "date": "2026-03-26"
   }
   ```

#### Supported Category Keys:
| `category` | `categoryKn` | Description |
| :--- | :--- | :--- |
| `festivals` | `ಉತ್ಸವಗಳು` | Rathotsava, Pete Utsava, Deepotsava, Car Festival |
| `rituals` | `ಪೂಜೆಗಳು` | Deevatige Salaam, Ashtaavadhaana, Abhisheka, Pooja rituals |
| `premises` | `ದೇವಸ್ಥಾನ` | Temple architecture, Rajagopura, Sanctum Sanctorum, Surroundings |
| `archives` | `ಹಳೆಯ ಚಿತ್ರಗಳು` | Vintage photographs, archival records, historical events |

---

### 6. Fixing "Form Not Found" (404) Errors
If you test submission and encounter a 404 error:
1. Verify that `FORMSPREE_ENDPOINT` contains a valid, active Formspree Form ID.
2. Confirm you activated the form by clicking the confirmation link sent to your registration email.
3. Check the **CORS / Allowed Domains** setting in the Formspree dashboard if deploying to a custom domain.
4. **Built-in Safety Net:** Even if Formspree is temporarily down, the website automatically catches the 404 and displays the **WhatsApp / Email Fallback Modal**, ensuring zero devotee contributions are lost!

---

# Section B: Devotee / User Instructions (ಬಳಕೆದಾರರಿಗೆ ಸೂಚನೆಗಳು)

### 1. ಛಾಯಾಚಿತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸುವುದು (Browsing the Gallery)
- **ವಿಭಾಗಗಳ ಫಿಲ್ಟರ್ (Category Filters):** ಪುಟದ ಮೇಲ್ಭಾಗದಲ್ಲಿರುವ `ಉತ್ಸವಗಳು`, `ಪೂಜೆಗಳು`, `ದೇವಸ್ಥಾನ` ಅಥವಾ `ಹಳೆಯ ಚಿತ್ರಗಳು` ಗುಂಡಿಗಳನ್ನು ಒತ್ತಿ ಆಯಾ ವಿಭಾಗದ ಚಿತ್ರಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ವೀಕ್ಷಿಸಬಹುದು.
- **ದೊಡ್ಡದಾಗಿ ವೀಕ್ಷಣೆ (Lightbox View):** ಯಾವುದೇ ಚಿತ್ರದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ (ಅಥವಾ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ) ಪೂರ್ಣ ಪರದೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಬಹುದು.
- **ಮುಂದೆ / ಹಿಂದೆ ಚಲನೆ (Navigation):** 
  - ಕೀಬೋರ್ಡ್‌ನಲ್ಲಿ <kbd>←</kbd> (ಹಿಂದಿನ) ಮತ್ತು <kbd>→</kbd> (ಮುಂದಿನ) ಬಾಣದ ಗುರುತುಗಳನ್ನು ಬಳಸಿ.
  - ಮೊಬೈಲ್‌ನಲ್ಲಿ ಎಡಕ್ಕೆ ಅಥವಾ ಬಲಕ್ಕೆ ಸ್ವೈಪ್ (Swipe) ಮಾಡಿ.
  - ಮುಚ್ಚಲು <kbd>Esc</kbd> ಕೀ ಅಥವಾ `×` ಗುರುತಿನ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.

---

### 2. ನಿಮ್ಮಲ್ಲಿರುವ ಚಿತ್ರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದು (Submitting Photos)
1. ಪುಟದ ಮೇಲಿರುವ **"📸 ನಿಮ್ಮಲ್ಲಿರುವ ಚಿತ್ರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ"** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.
2. **ಚಿತ್ರ ನೀಡುವ ಎರಡು ಸರಳ ವಿಧಾನಗಳು:**
   - **ಆಯ್ಕೆ ೧ (ಮೊಬೈಲ್ / ಗ್ಯಾಲರಿಯಿಂದ):** `Choose File` ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಫೋನ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿರುವ ಫೋಟೋವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ತಕ್ಷಣವೇ ಚಿತ್ರದ ಪ್ರಿವ್ಯೂ ಕಾಣಿಸುತ್ತದೆ.
   - **ಆಯ್ಕೆ ೨ (ವೆಬ್ ಲಿಂಕ್):** ನಿಮ್ಮ ಬಳಿ Google Drive, Google Photos ಅಥವಾ ImgBB ಲಿಂಕ್ ಇದ್ದರೆ ಅದನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ.
3. ಭಕ್ತರ ಹೆಸರು, ವಿವರಣೆ ಇತ್ಯಾದಿ ವಿವರಗಳು **ಸಂಪೂರ್ಣವಾಗಿ ಐಚ್ಛಿಕ**.
4. **"ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ"** ಕ್ಲಿಕ್ ಮಾಡಿ.
5. ನೇರವಾಗಿ ಕಳುಹಿಸಲು ಬಯಸಿದರೆ, ಪಾಪ್-ಅಪ್‌ನಲ್ಲಿ ಬರುವ **"WhatsApp ಮೂಲಕ ಕಳುಹಿಸಿ"** ಅಥವಾ **"Email ಮೂಲಕ ಕಳುಹಿಸಿ"** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನೇರವಾಗಿ ದೇವಸ್ಥಾನದ ಆಡಳಿತಕ್ಕೆ ತಲುಪಿಸಬಹುದು!

