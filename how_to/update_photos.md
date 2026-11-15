# Guide: How to Add New Images to the Photo Gallery

This guide explains how to add new photos to the gallery (`photos.html`), whether you are using **local images** or **ImgBB / web-hosted images**.

---

## Quick Architecture Overview

The gallery loads images from `data/gallery.json` (for instant rendering) and falls back to `data/gallery.csv` or the Google Sheet CSV.

- **Full Resolution Images:** `assets/images/<filename>` (used in full-screen Lightbox)
- **Grid Thumbnails:** `assets/images/thumbs/<filename>` (used in fast grid loading)
- **Metadata Catalog:** `data/gallery.json` and `data/gallery.csv`

---

## Method 1: Adding a Local Image (Saved in the Repository)

Use this method when you have image files (e.g., `new_photo.jpg`) on your computer to add to the repository.

### Step 1: Place the Full-Resolution Image
Copy your image into the `assets/images/` directory:
```text
assets/images/my_new_photo.jpeg
```

### Step 2: Generate or Add a Thumbnail
To keep page loading lightning-fast, create a compressed thumbnail copy (max width ~480px) and place it in `assets/images/thumbs/`:
```text
assets/images/thumbs/my_new_photo.jpeg
```

> **Tip:** You can generate thumbnails automatically for all images in `assets/images/` by running this PowerShell command:
```powershell
Add-Type -AssemblyName System.Drawing
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)

$src = [System.Drawing.Image]::FromFile((Resolve-Path "assets/images/my_new_photo.jpeg"))
$w = 480
$h = [int]($src.Height * (480 / $src.Width))
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.DrawImage($src, 0, 0, $w, $h)
$bmp.Save("assets/images/thumbs/my_new_photo.jpeg", $codec, $params)
$gfx.Dispose(); $bmp.Dispose(); $src.Dispose()
```

### Step 3: Add Metadata to `data/gallery.json`
Open `data/gallery.json` and add a new entry to the array:

```json
{
  "id": "svt-fest-28",
  "imagePath": "../assets/images/my_new_photo.jpeg",
  "title": "ವಿಶೇಷ ರಥೋತ್ಸವ",
  "caption": "ರಥೋತ್ಸವದ ವೈಭವ",
  "category": "festivals",
  "categoryKn": "ಉತ್ಸವಗಳು",
  "date": "15/11/2026",
  "author": "",
  "width": 1280,
  "height": 720,
  "orientation": "landscape"
}
```

- **`imagePath`**: Path relative to `pages/`, e.g., `../assets/images/my_new_photo.jpeg`.
- **`width` & `height`**: Natural dimensions of the full-resolution image (prevents layout shift).
- **`orientation`**: `"landscape"` (width ≥ height) or `"portrait"` (height > width).

### Step 4 (Optional): Update `data/gallery.csv`
Add the corresponding line to `data/gallery.csv` (and your linked Google Sheet):
```csv
../assets/images/my_new_photo.jpeg,ರಥೋತ್ಸವದ ವೈಭವ,festivals,15/11/2026,ವಿಶೇಷ ರಥೋತ್ಸವ,,yes
```

---

## Method 2: Adding an ImgBB (or Web-Hosted) Image

Use this method when you upload photos to [ImgBB](https://imgbb.com) or another cloud host.

### Step 1: Upload to ImgBB and Get the Direct Image Link
1. Go to [ImgBB](https://imgbb.com) and upload your photo.
2. Under embed codes, select **Direct links** (URL ending in `.jpg` or `.png`, e.g. `https://i.ibb.co/example/photo.jpg`).

### Step 2: Add Metadata to `data/gallery.json`
Open `data/gallery.json` and append the new entry:

```json
{
  "id": "svt-fest-29",
  "imagePath": "https://i.ibb.co/example/photo.jpg",
  "title": "ದೇವಸ್ಥಾನದ ದೀಪಾಲಂಕಾರ",
  "caption": "ಕಾರ್ತಿಕ ಮಾಸದ ದೀಪಾಲಂಕಾರ",
  "category": "festivals",
  "categoryKn": "ಉತ್ಸವಗಳು",
  "date": "15/11/2026",
  "author": "ಭಕ್ತರೊಬ್ಬರು",
  "width": 1600,
  "height": 900,
  "orientation": "landscape"
}
```

*Note: If you don't know the exact width/height, you can omit them; the gallery engine will detect them automatically, but specifying them gives faster, zero-layout-shift rendering.*

### Step 3 (Optional): Add to `data/gallery.csv` & Google Sheet
Add the line to `data/gallery.csv`:
```csv
https://i.ibb.co/example/photo.jpg,ಕಾರ್ತಿಕ ಮಾಸದ ದೀಪಾಲಂಕಾರ,festivals,15/11/2026,ದೇವಸ್ಥಾನದ ದೀಪಾಲಂಕಾರ,ಭಕ್ತರೊಬ್ಬರು,yes
```

---

## Category Reference

When assigning `"category"` and `"categoryKn"`:

| `category` | `categoryKn` | Description |
| :--- | :--- | :--- |
| `festivals` | `ಉತ್ಸವಗಳು` | Annual chariot festivals, Pete Utsava, special celebrations |
| `rituals` | `ಧಾರ್ಮಿಕ ವಿಧಿಗಳು` | Daily pooja, abhishekha, deevatige salaam |
| `premises` | `ದೇವಸ್ಥಾನದ ಆವರಣ` | Sanctum sanctorum, temple architecture, entrance |
| `archives` | `ಹಳೆಯ ಚಿತ್ರಗಳು` | Vintage / historical photographs and past events |
| `others` | `ಇತರ ಚಿತ್ರಗಳು` | Miscellaneous community photos |

---

## Quick Verification
After saving the files:
1. Open `pages/photos.html` in your browser.
2. Check that the new image renders cleanly in the justified grid.
3. Click the photo to confirm that the full-resolution image loads properly in the lightbox modal.
