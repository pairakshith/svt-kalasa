# How to Add & Update Content (ಹೊಸ ಮಾಹಿತಿ ಸೇರಿಸುವ ವಿಧಾನ)

This guide explains how to add new temple history, rituals, or festival information received in **Kannada**, and have the English version generated automatically.

---

## 📌 Summary Checklist

```
Step 1: Paste Kannada text into data/temple_background.md or data/traditions.md
Step 2: (Optional) Add unique names/proper nouns to data/glossary.json
Step 3: Run: python scripts/build_translations.py
Step 4: (Optional - only if creating a new tab) Add the button in the HTML file
Step 5: View the result in your browser!
```

---

## Step 1: Where to Add Your Kannada Information

You **only write Kannada** in the Markdown files inside the `data/` folder:

| If your information is about... | Edit this file |
| :--- | :--- |
| Temple history, kings, architecture, miracles, idols | [`data/temple_background.md`](../data/temple_background.md) |
| Festivals, vratas, rituals, yearly traditions | [`data/traditions.md`](../data/traditions.md) |

### Block Structure Rules
- Every distinct topic/tab is separated by three dashes on a line by itself: `---`
- Each block begins with `# CATEGORY: category_name`
- Followed by a title (`## ಶೀರ್ಷಿಕೆ`) and paragraphs.

---

## Step 2: (Optional) Protect Unique Temple Names in Glossary

If your text has unique proper nouns (e.g., deities, priests, places, specific rituals) that Google Translate might translate incorrectly (like translating "ಮಂಗಳ" to "Mars"), add them to [`data/glossary.json`](../data/glossary.json):

```json
{
  "ಶ್ರೀ ವೆಂಕಟರಮಣ": "Sri Venkataramana",
  "ದಕ್ಷಿಣ ಕಾಶಿ": "Dakshina Kashi",
  "ದೀಪೋತ್ಸವ": "Deepotsava"
}
```

---

## Step 3: Run the Auto-Translation Script

Open your terminal or command prompt in the project root directory and run:

```bash
python scripts/build_translations.py
```

### What this command does:
1. Detects which file you changed.
2. Replaces glossary terms with safe placeholders so names are never mistranslated.
3. Automatically translates Kannada text into English.
4. Generates the translated file in [`data/en/traditions.md`](../data/en/traditions.md) or [`data/en/temple_background.md`](../data/en/temple_background.md).

> **Tip:** If you updated `glossary.json` and want to force a re-translation of all files, run:
> ```bash
> python scripts/build_translations.py --force
> ```

---

## Step 4: (Only if creating a brand new filter tab) Update HTML

- **If adding text to an existing festival or section:** **No HTML changes needed!** Refresh your browser to see your changes.
- **If adding a completely new festival/tab:** Add a tab button in [`pages/traditions.html`](../pages/traditions.html) or [`pages/temple_background.html`](../pages/temple_background.html):

```html
<button class="tab-btn" onclick="filterTraditions('your_category_name', this)">
    <span class="pn-kn">ಕನ್ನಡ ಹೆಸರು</span>
    <span class="pn-en">English Name</span>
</button>
```

---

# 📖 Complete Walkthrough Example: Adding "ದೀಪೋತ್ಸವ (Deepotsava)"

Let's say you receive the following Kannada text from the temple:

> **ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ**  
> ಕಾರ್ತಿಕ ಮಾಸದಲ್ಲಿ ಶ್ರೀ ದೇವಸ್ಥಾನದಲ್ಲಿ ಸಹಸ್ರ ದೀಪಾಲಂಕಾರದೊಂದಿಗೆ ದೀಪೋತ್ಸವವನ್ನು ಅತ್ಯಂತ ಭಕ್ತಿಪೂರ್ವಕವಾಗಿ ಆಚರಿಸಲಾಗುತ್ತದೆ. ಈ ದಿನ ದೇವಾಲಯದ ಆವರಣವೆಲ್ಲ ಮಣ್ಣಿನ ಹಣತೆಗಳಿಂದ ಕಂಗೊಳಿಸುತ್ತದೆ.

Here are the exact actions you take:

### 1. Add to `data/traditions.md`
Open [`data/traditions.md`](../data/traditions.md), go to the bottom of the file, and append:

```markdown
---

# CATEGORY: deepotsava
## ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ

ಕಾರ್ತಿಕ ಮಾಸದಲ್ಲಿ ಶ್ರೀ ದೇವಸ್ಥಾನದಲ್ಲಿ ಸಹಸ್ರ ದೀಪಾಲಂಕಾರದೊಂದಿಗೆ ದೀಪೋತ್ಸವವನ್ನು ಅತ್ಯಂತ ಭಕ್ತಿಪೂರ್ವಕವಾಗಿ ಆಚರಿಸಲಾಗುತ್ತದೆ. ಈ ದಿನ ದೇವಾಲಯದ ಆವರಣವೆಲ್ಲ ಮಣ್ಣಿನ ಹಣತೆಗಳಿಂದ ಕಂಗೊಳಿಸುತ್ತದೆ.
```

### 2. Add Proper Nouns to `data/glossary.json` (Optional)
Open [`data/glossary.json`](../data/glossary.json) and add:
```json
"ದೀಪೋತ್ಸವ": "Deepotsava"
```

### 3. Run the Build Script
In terminal, run:
```bash
python scripts/build_translations.py
```
*The script automatically creates the English content in `data/en/traditions.md`.*

### 4. Add the Tab Button in `pages/traditions.html`
Open [`pages/traditions.html`](../pages/traditions.html) and add this inside the `<div class="filter-tabs ...">` list:

```html
<button class="tab-btn" onclick="filterTraditions('deepotsava', this)">
    <span class="pn-kn">ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ</span>
    <span class="pn-en">Kartika Deepotsava</span>
</button>
```

### 5. Done!
Open `traditions.html` in your browser:
- In **Kannada mode**, clicking "ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ" shows the Kannada description.
- In **English mode**, clicking "Kartika Deepotsava" shows the translated English description with proper nouns like "Deepotsava" perfectly preserved.

