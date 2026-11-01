/**
 * gallery.js - Optimized Photo Gallery & Full-Resolution Lightbox System
 * Sri Venkataramana Temple, Melangadi, Kalasa
 *
 * Architecture Highlights:
 * 1. Thumbnail-First Strategy:
 *    - Renders low-bandwidth, optimized thumbnail URLs (transforms / preset=thumb) in the main grid
 *    - Native loading="lazy" and decoding="async" for LCP and bandwidth optimization
 *    - LQIP shimmer / skeleton placeholder state while thumbnail fetches
 * 2. Interactive Lightbox State:
 *    - Captures high-res URL, alt text, and rich metadata (date, author/devotee, category)
 *    - Full-screen backdrop blur modal (bg-black/80, z-50)
 *    - Smooth preloading of high-resolution asset via new Image() with spinner over blurred thumbnail LQIP
 * 3. User Experience & Navigation:
 *    - Keyboard navigation (Esc to close, Left/Right arrow keys to step through gallery)
 *    - Focus trapping locked inside the modal while open
 *    - Deep linking / URL state management via URL query parameter (?photo=id)
 * 4. Upload Waiting Popup Integration:
 *    - Shows animated processing modal on upload
 *    - Immediately prepends newly uploaded photos into the DOM gallery grid with optimized thumbnail state
 */

// ==========================================================================
// 1. CONFIGURATION (Zero-Budget Architecture & Cloudinary/ImgBB Transform Helpers)
// ==========================================================================

// Formspree endpoint (collects devotee details paired with the uploaded image URL)
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjyvjoww';

// Free ImgBB API Key (Uploads local images and creates a public web link)
const IMGBB_API_KEY = '66c04660b388ef7e482286c1a9530545';
const IMGBB_MAX_FILE_BYTES = 32 * 1024 * 1024;

// Temple Contact for Fallback Direct Sharing
const TEMPLE_PHONE = '+919481234567';
const TEMPLE_EMAIL = 'test@gmail.com';

// Published Google Sheet CSV export URL for live gallery management
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgXwif2SrNyp5FIgrjhDhzMg7jQMFefvqRGl5IPzRRacz0tZyKuUrFwnPpovFBW6d4a2CTfv23RnSm/pub?output=csv';

// Local gallery fallbacks
const LOCAL_GALLERY_JSON = '../data/gallery.json';
const LOCAL_GALLERY_CSV = '../data/gallery.csv';

/**
 * Thumbnail URL Transformer (Preset = thumb)
 * Adapts Cloudinary, Imgix, ImgBB, or query-based image endpoints to fetch lightweight thumbnails.
 * If local or plain static image, returns the optimized path.
 */
function getThumbnailUrl(rawUrl, width = 450) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();

    // 1. Cloudinary auto-compression and scale transform
    if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
        return trimmed.replace('/upload/', `/upload/c_scale,w_${width},q_auto,f_auto/`);
    }

    // 2. Imgix / Unsplash or standard image API endpoint with preset=thumb
    if (trimmed.includes('imgix.net') || trimmed.includes('/api/images')) {
        const separator = trimmed.includes('?') ? '&' : '?';
        return `${trimmed}${separator}preset=thumb&w=${width}&auto=format,compress`;
    }

    // 3. ImgBB / Google Drive / Static relative links
    return trimmed;
}

/**
 * High-Resolution Full Asset URL Transformer
 * Strips out thumb constraints if present so lightbox gets full-resolution detail.
 */
function getFullResolutionUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    return rawUrl.trim();
}

// ==========================================================================
// 2. MAIN LOGIC & DOM INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Gallery State
    let galleryData = [];
    let currentFiltered = [];
    let currentLightboxIndex = -1;
    let activeCategory = 'all';
    let displayItems = [];

    // Selected Local Files State for Instant Preview & Upload
    let selectedLocalFiles = [];

    // Preloader tracker for lightbox streaming
    let activePreloaderImg = null;

    // Element focus keeper before lightbox open (for WCAG focus return)
    let previousFocusedElement = null;

    // DOM Elements - Gallery Grid & Filters
    const galleryGrid = document.getElementById('galleryGrid');
    const photoCountEl = document.getElementById('photoCount');
    const filterButtons = document.querySelectorAll('.filter-pill');

    // DOM Elements - Lightbox Modal
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxBlurBackdrop = document.getElementById('lightboxBlurBackdrop');
    const lightboxSpinner = document.getElementById('lightboxSpinner');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCategory = document.getElementById('lightboxCategory');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxDate = document.getElementById('lightboxDate');
    const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
    const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
    const lightboxNextBtn = document.getElementById('lightboxNextBtn');

    // DOM Elements - Upload Waiting Popup
    const uploadWaitingOverlay = document.getElementById('uploadWaitingOverlay');
    const uploadWaitingTitle = document.getElementById('uploadWaitingTitle');
    const uploadWaitingDesc = document.getElementById('uploadWaitingDesc');

    // DOM Elements - Submission Modal & Form
    const openSubmitModalBtn = document.getElementById('openSubmitModalBtn');
    const submissionModal = document.getElementById('submissionModal');
    const closeSubmitModalBtn = document.getElementById('closeSubmitModalBtn');
    const photoSubmissionForm = document.getElementById('photoSubmissionForm');
    const formStatusMsg = document.getElementById('formStatusMsg');
    const submitBtn = document.getElementById('submitBtn');

    // Dual Input & Preview Elements
    const localPhotoInput = document.getElementById('localPhotoInput');
    const photoUrlInput = document.getElementById('photoUrlInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewList = document.getElementById('previewList');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const removePreviewBtn = document.getElementById('removePreviewBtn');

    // Fallback Modal Elements
    const fallbackModal = document.getElementById('fallbackModal');
    const closeFallbackModalBtn = document.getElementById('closeFallbackModalBtn');
    const fallbackSummary = document.getElementById('fallbackSummary');
    const fallbackWhatsAppBtn = document.getElementById('fallbackWhatsAppBtn');
    const fallbackEmailBtn = document.getElementById('fallbackEmailBtn');
    const fallbackBackBtn = document.getElementById('fallbackBackBtn');
    const fallbackModalTitle = document.getElementById('fallbackModalTitle');
    const fallbackModalSubtitle = document.getElementById('fallbackModalSubtitle');

    /**
     * Scroll lock scoped to this page. Compensates for scrollbar width so the page
     * does not layout-shift sideways when modal opens.
     */
    function lockBodyScroll() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const currentPad = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
            document.body.style.paddingRight = `${currentPad + scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';
    }

    function unlockBodyScroll() {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Parse CSV text with support for quotes, commas, and linebreaks.
     * Header row: imagePath,id,title,category,categoryKn,caption,date,author
     */
    function parseGalleryCsv(csvText) {
        if (!csvText || typeof csvText !== 'string') return [];
        
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentField.trim());
                currentField = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                currentRow.push(currentField.trim());
                if (currentRow.some(field => field.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field.length > 0)) {
                rows.push(currentRow);
            }
        }
        
        if (rows.length < 2) return [];

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const headerIndexMap = {};
        headers.forEach((h, idx) => {
            headerIndexMap[h] = idx;
        });

        const items = [];
        for (let r = 1; r < rows.length; r++) {
            const rowValues = rows[r];
            const getVal = (name, fallbackIdx) => {
                const key = name.toLowerCase();
                if (headerIndexMap[key] !== undefined) {
                    return rowValues[headerIndexMap[key]] || '';
                }
                return rowValues[fallbackIdx] || '';
            };

            const imagePath = getVal('imagePath', 0).trim();
            if (!imagePath) continue;

            const publishVal = (getVal('publish', -1) || getVal('published', -1) || getVal('status', -1)).trim().toLowerCase();
            if (publishVal === 'no' || publishVal === 'false' || publishVal === '0' || publishVal === 'draft') {
                continue;
            }

            const category = (getVal('category', 3) || 'festivals').toLowerCase().trim();
            const categoryKnFallback = {
                festivals: 'ಉತ್ಸವಗಳು',
                rituals: 'ಧಾರ್ಮಿಕ ವಿಧಿಗಳು',
                premises: 'ದೇವಸ್ಥಾನದ ಆವರಣ',
                archives: 'ಹಳೆಯ ಚಿತ್ರಗಳು'
            }[category] || 'ಉತ್ಸವಗಳು';

            const categoryKn = getVal('categoryKn', 4).trim() || categoryKnFallback;
            const id = getVal('id', 1).trim() || `svt-${category.slice(0, 4)}-${r}`;

            const entry = {
                imagePath: imagePath,
                id: id,
                title: getVal('title', 2).trim() || '',
                category: category,
                categoryKn: categoryKn
            };

            const caption = getVal('caption', 5).trim();
            if (caption) entry.caption = caption;

            const date = getVal('date', 6).trim();
            if (date) entry.date = date;

            const author = getVal('author', 7).trim() || getVal('credit', 7).trim();
            if (author) entry.author = author;

            items.push(entry);
        }

        return items;
    }

    /**
     * ----------------------------------------------------------------------
     * Step 1: Initialize & Fetch Gallery Data
     * ----------------------------------------------------------------------
     */
    async function initGallery() {
        let loadedData = null;

        // 1. Try Google Sheets Published CSV
        if (GOOGLE_SHEET_CSV_URL && !GOOGLE_SHEET_CSV_URL.includes('placeholder')) {
            try {
                const freshUrl = GOOGLE_SHEET_CSV_URL + (GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
                const sheetRes = await fetch(freshUrl, { cache: 'no-cache' });
                if (sheetRes.ok) {
                    const csvText = await sheetRes.text();
                    const parsed = parseGalleryCsv(csvText);
                    if (parsed.length > 0) {
                        loadedData = parsed;
                    }
                }
            } catch (sheetErr) {
                console.warn('[Gallery] Google Sheet CSV fetch failed, checking local fallbacks:', sheetErr);
            }
        }

        // 2. Try local gallery.json fallback
        if (!loadedData) {
            try {
                const jsonRes = await fetch(LOCAL_GALLERY_JSON);
                if (jsonRes.ok) {
                    const text = await jsonRes.text();
                    if (text.trim().length > 0) {
                        const parsedJson = JSON.parse(text);
                        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
                            loadedData = parsedJson;
                        }
                    }
                }
            } catch (jsonErr) {
                console.warn('[Gallery] Local gallery.json empty or missing:', jsonErr);
            }
        }

        // 3. Try local gallery.csv fallback
        if (!loadedData) {
            try {
                const csvRes = await fetch(LOCAL_GALLERY_CSV);
                if (csvRes.ok) {
                    const csvText = await csvRes.text();
                    const parsed = parseGalleryCsv(csvText);
                    if (parsed.length > 0) {
                        loadedData = parsed;
                    }
                }
            } catch (csvErr) {
                console.warn('[Gallery] Local gallery.csv fallback failed:', csvErr);
            }
        }

        try {
            galleryData = loadedData || [];
            if (galleryData.length > 0) {
                await Promise.all(galleryData.map(detectOrientation));
                currentFiltered = [...galleryData];
                updateCategoryCounts();
                renderGallery(currentFiltered);
                checkUrlDeepLink();
            } else {
                updateCategoryCounts();
                renderGallery([]);
            }
        } catch (error) {
            console.error('Error rendering gallery data:', error);
            if (galleryGrid) {
                galleryGrid.innerHTML = `
                    <div class="gallery-empty-state">
                        <span class="gallery-empty-icon">⚠️</span>
                        <div class="gallery-empty-text">ಚಿತ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.</div>
                    </div>
                `;
            }
        }
    }

    /**
     * Update photo counts on category pills
     */
    function updateCategoryCounts() {
        const counts = {
            all: galleryData.length,
            festivals: 0,
            rituals: 0,
            premises: 0,
            archives: 0
        };

        galleryData.forEach(item => {
            if (counts[item.category] !== undefined) {
                counts[item.category]++;
            }
        });

        filterButtons.forEach(btn => {
            const cat = btn.getAttribute('data-category');
            const badge = btn.querySelector('.pill-badge');
            if (badge && counts[cat] !== undefined) {
                badge.textContent = counts[cat];
            }
        });

        if (photoCountEl) {
            photoCountEl.textContent = `${galleryData.length} Photos`;
        }
    }

    /**
     * ----------------------------------------------------------------------
     * Step 2: Render Responsive Photo Grid (Thumbnail-First Optimization)
     * ----------------------------------------------------------------------
     */
    const JUSTIFY_GAP = 6;
    let justifiedGroups = [];

    function layoutJustifiedRows(group, targetH, gap) {
        const { container, entries } = group;
        const W = container.clientWidth;
        if (!W || entries.length === 0) return;

        const rows = [];
        let current = [];
        let ratioSum = 0;
        entries.forEach(entry => {
            current.push(entry);
            ratioSum += entry.ratio;
            const naturalWidth = ratioSum * targetH + (current.length - 1) * gap;
            if (naturalWidth >= W) {
                rows.push({ items: current, full: true });
                current = [];
                ratioSum = 0;
            }
        });
        if (current.length) rows.push({ items: current, full: false });

        container.innerHTML = '';
        rows.forEach(row => {
            const sum = row.items.reduce((s, e) => s + e.ratio, 0);
            const h = row.full ? (W - (row.items.length - 1) * gap) / sum : targetH;

            const rowEl = document.createElement('div');
            rowEl.className = 'gallery-row';
            rowEl.style.gap = `${gap}px`;
            rowEl.style.marginBottom = `${gap}px`;

            row.items.forEach(({ el, ratio }) => {
                el.style.width = `${ratio * h}px`;
                el.style.height = `${h}px`;
                rowEl.appendChild(el);
            });
            container.appendChild(rowEl);
        });
    }

    function layoutJustifiedGroups() {
        const targetH = window.innerWidth <= 640 ? 120 : 220;
        justifiedGroups.forEach(group => layoutJustifiedRows(group, targetH, JUSTIFY_GAP));
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layoutJustifiedGroups, 120);
    });

    function detectOrientation(item) {
        if (item.orientation) return Promise.resolve(item.orientation);

        if (item.width && item.height) {
            item.orientation = item.height > item.width ? 'portrait' : 'landscape';
            return Promise.resolve(item.orientation);
        }

        return new Promise(resolve => {
            const fallback = setTimeout(() => {
                item.orientation = item.orientation || 'landscape';
                resolve(item.orientation);
            }, 8000);

            const probe = new Image();
            probe.onload = () => {
                clearTimeout(fallback);
                item.width = probe.naturalWidth;
                item.height = probe.naturalHeight;
                item.orientation = item.height > item.width ? 'portrait' : 'landscape';
                resolve(item.orientation);
            };
            probe.onerror = () => {
                clearTimeout(fallback);
                item.orientation = 'landscape';
                resolve(item.orientation);
            };
            probe.src = getThumbnailUrl(item.imagePath, 300);
        });
    }

    /**
     * Render photo grid cards with:
     * - loading="lazy" and decoding="async"
     * - Low-bandwidth compressed thumbnail URL (preset=thumb)
     * - Skeleton shimmer placeholder until thumbnail load finishes
     */
    function renderGallery(items) {
        if (!galleryGrid) return;

        if (items.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-empty-state">
                    <span class="gallery-empty-icon">📷</span>
                    <div class="gallery-empty-text">ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಚಿತ್ರಗಳು ಲಭ್ಯವಿಲ್ಲ.</div>
                </div>
            `;
            return;
        }

        const landscape = items.filter(item => item.orientation !== 'portrait');
        const portrait = items.filter(item => item.orientation === 'portrait');

        displayItems = [...landscape, ...portrait];

        const renderCards = (list, offset) => list.map((item, i) => {
            const sizeAttrs = item.width && item.height
                ? `width="${item.width}" height="${item.height}"`
                : '';
            const thumbUrl = getThumbnailUrl(item.imagePath, 500);
            const fullUrl = getFullResolutionUrl(item.imagePath);

            return `
            <article class="photo-card" role="button" tabindex="0" data-index="${offset + i}" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title || 'ಛಾಯಾಚಿತ್ರ')}">
                <img
                    src="${escapeHtml(thumbUrl)}"
                    data-full="${escapeHtml(fullUrl)}"
                    alt="${escapeHtml(item.title || 'ಛಾಯಾಚಿತ್ರ')}"
                    class="photo-thumb"
                    loading="lazy"
                    decoding="async"
                    ${sizeAttrs}
                    onload="this.classList.add('is-loaded'); this.closest('.photo-card')?.classList.add('loaded');"
                    onerror="this.closest('.photo-card')?.classList.add('loaded');"
                />
                <div class="photo-zoom-hint" title="ದೊಡ್ಡದಾಗಿ ನೋಡಿ">🔍</div>
            </article>`;
        }).join('');

        const renderGroup = (list, orientation, label, offset) => {
            if (list.length === 0) return '';
            return `
            <section class="gallery-group gallery-group--${orientation}" aria-label="${label}">
                <div class="gallery-justified">
                    ${renderCards(list, offset)}
                </div>
            </section>`;
        };

        galleryGrid.innerHTML =
            renderGroup(landscape, 'landscape', 'ಅಡ್ಡ ಚಿತ್ರಗಳು', 0) +
            renderGroup(portrait, 'portrait', 'ಲಂಬ ಚಿತ್ರಗಳು', landscape.length);

        justifiedGroups = [...galleryGrid.querySelectorAll('.gallery-justified')].map(container => ({
            container,
            entries: [...container.querySelectorAll('.photo-card')].map(card => {
                const item = displayItems[parseInt(card.getAttribute('data-index'), 10)];
                const ratio = item && item.width && item.height ? item.width / item.height : 1;
                return { el: card, ratio };
            })
        }));
        layoutJustifiedGroups();

        // Attach Card Click & Keydown
        galleryGrid.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.getAttribute('data-index'), 10);
                openLightbox(index);
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const index = parseInt(card.getAttribute('data-index'), 10);
                    openLightbox(index);
                }
            });
        });
    }

    /**
     * ----------------------------------------------------------------------
     * Step 3: Category Filtering Logic
     * ----------------------------------------------------------------------
     */
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            activeCategory = btn.getAttribute('data-category');
            if (activeCategory === 'all') {
                currentFiltered = [...galleryData];
            } else {
                currentFiltered = galleryData.filter(item => item.category === activeCategory);
            }

            renderGallery(currentFiltered);
        });
    });

    /**
     * ----------------------------------------------------------------------
     * Step 4: Interactive Lightbox Modal & Lazy Full-Resolution Preloader
     * ----------------------------------------------------------------------
     */
    function getCategoryLabel(item) {
        return (item.categoryKn || item.category || 'ಇತರೆ').trim();
    }

    /**
     * Open Lightbox at specified index
     */
    function openLightbox(index) {
        if (!displayItems || displayItems.length === 0) return;
        if (index < 0 || index >= displayItems.length) return;

        previousFocusedElement = document.activeElement;
        currentLightboxIndex = index;
        updateLightboxView();

        lightboxModal.classList.add('open');
        lightboxModal.setAttribute('aria-hidden', 'false');
        lockBodyScroll();

        // Set focus inside modal for accessibility & focus trapping
        if (lightboxCloseBtn) {
            lightboxCloseBtn.focus();
        }

        // Deep-linking URL State Management (?photo=id)
        updateUrlState(displayItems[currentLightboxIndex].id);
    }

    /**
     * Close Lightbox
     */
    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        lightboxModal.setAttribute('aria-hidden', 'true');
        unlockBodyScroll();
        currentLightboxIndex = -1;

        // Cancel any pending preloader
        if (activePreloaderImg) {
            activePreloaderImg.onload = null;
            activePreloaderImg.onerror = null;
            activePreloaderImg = null;
        }

        // Reset elements
        if (lightboxImg) {
            lightboxImg.src = '';
            lightboxImg.classList.remove('loaded');
        }
        if (lightboxBlurBackdrop) {
            lightboxBlurBackdrop.style.backgroundImage = 'none';
            lightboxBlurBackdrop.classList.remove('active');
        }
        if (lightboxSpinner) {
            lightboxSpinner.classList.remove('active');
        }
        if (lightboxDate) {
            lightboxDate.textContent = '';
        }
        if (lightboxCounter) {
            lightboxCounter.textContent = '';
        }

        // Remove photo query param from URL without page reload
        clearUrlState();

        // Return focus back to caller
        if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
            previousFocusedElement.focus();
        }
    }

    /**
     * Lazy Load and Stream High-Resolution Image into Lightbox
     */
    function updateLightboxView() {
        if (currentLightboxIndex < 0 || currentLightboxIndex >= displayItems.length) return;
        const item = displayItems[currentLightboxIndex];

        const thumbUrl = getThumbnailUrl(item.imagePath, 400);
        const fullResUrl = getFullResolutionUrl(item.imagePath);

        // Cancel previous preloader if in flight
        if (activePreloaderImg) {
            activePreloaderImg.onload = null;
            activePreloaderImg.onerror = null;
            activePreloaderImg = null;
        }

        // 1. Show low-quality blurred thumbnail underneath immediately (LQIP)
        if (lightboxBlurBackdrop) {
            lightboxBlurBackdrop.style.backgroundImage = `url("${thumbUrl}")`;
            lightboxBlurBackdrop.classList.add('active');
        }

        // 2. Hide previous high-res image and show smooth loading spinner
        if (lightboxImg) {
            lightboxImg.classList.remove('loaded');
            lightboxImg.alt = item.title || 'ಛಾಯಾಚಿತ್ರ';
        }
        if (lightboxSpinner) {
            lightboxSpinner.classList.add('active');
        }

        // 3. Preload full-resolution asset via new Image()
        const preloader = new Image();
        activePreloaderImg = preloader;

        preloader.onload = () => {
            if (activePreloaderImg !== preloader) return; // Stale request check
            if (lightboxImg) {
                lightboxImg.src = fullResUrl;
                lightboxImg.classList.add('loaded');
            }
            if (lightboxSpinner) {
                lightboxSpinner.classList.remove('active');
            }
            // Once high-res image is visible, fade out the blur backdrop
            if (lightboxBlurBackdrop) {
                lightboxBlurBackdrop.classList.remove('active');
            }
        };

        preloader.onerror = () => {
            if (activePreloaderImg !== preloader) return;
            // Fallback to thumbnail if high-res failed
            if (lightboxImg) {
                lightboxImg.src = thumbUrl;
                lightboxImg.classList.add('loaded');
            }
            if (lightboxSpinner) {
                lightboxSpinner.classList.remove('active');
            }
        };

        preloader.src = fullResUrl;

        // 4. Update rich metadata display (Title, Category, Caption, Date, Author)
        if (lightboxTitle) {
            lightboxTitle.textContent = item.title || '';
            lightboxTitle.style.display = item.title ? 'block' : 'none';
        }
        if (lightboxCategory) {
            lightboxCategory.textContent = getCategoryLabel(item);
        }

        if (lightboxCaption) {
            let metaHtml = '';
            if (item.caption) metaHtml += escapeHtml(item.caption);
            if (item.author) {
                metaHtml += (metaHtml ? '<br>' : '') + `<small style="color: #cbd5e1;">ಛಾಯಾಗ್ರಹಣ / ಕೃಪೆ: ${escapeHtml(item.author)}</small>`;
            }
            lightboxCaption.innerHTML = metaHtml;
            lightboxCaption.style.display = (item.caption || item.author) ? 'block' : 'none';
        }

        if (lightboxDate) {
            lightboxDate.textContent = item.date ? formatDate(item.date) : '';
        }
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${displayItems.length}`;
        }

        // Update URL hash/query param for deep linking
        updateUrlState(item.id);
    }

    function prevLightboxImage() {
        if (displayItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + displayItems.length) % displayItems.length;
        updateLightboxView();
    }

    function nextLightboxImage() {
        if (displayItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % displayItems.length;
        updateLightboxView();
    }

    // Attach Lightbox Modal Controls
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevLightboxImage(); });
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextLightboxImage(); });

    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }

    /**
     * Deep Linking & URL State Management (?photo=id)
     */
    function updateUrlState(photoId) {
        if (!photoId) return;
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('photo', photoId);
            window.history.replaceState({ photoId }, '', url.toString());
        } catch (e) {
            // Ignore URL state errors in sandboxed environments
        }
    }

    function clearUrlState() {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('photo')) {
                url.searchParams.delete('photo');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (e) {}
    }

    function checkUrlDeepLink() {
        try {
            const url = new URL(window.location.href);
            const photoId = url.searchParams.get('photo');
            if (photoId && displayItems.length > 0) {
                const targetIdx = displayItems.findIndex(p => p.id === photoId);
                if (targetIdx >= 0) {
                    openLightbox(targetIdx);
                }
            }
        } catch (e) {}
    }

    // Handle browser Back / Forward buttons with deep linking
    window.addEventListener('popstate', (e) => {
        try {
            const url = new URL(window.location.href);
            const photoId = url.searchParams.get('photo');
            if (photoId && displayItems.length > 0) {
                const targetIdx = displayItems.findIndex(p => p.id === photoId);
                if (targetIdx >= 0 && targetIdx !== currentLightboxIndex) {
                    openLightbox(targetIdx);
                }
            } else if (!photoId && lightboxModal && lightboxModal.classList.contains('open')) {
                closeLightbox();
            }
        } catch (err) {}
    });

    /**
     * Touch Swipe Gesture Support for Mobile Lightbox
     */
    let touchStartX = 0;
    let touchEndX = 0;

    if (lightboxModal) {
        lightboxModal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightboxModal.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) {
                nextLightboxImage();
            } else if (touchEndX > touchStartX + threshold) {
                prevLightboxImage();
            }
        }, { passive: true });
    }

    /**
     * ----------------------------------------------------------------------
     * Step 5: Accessibility - Keyboard Navigation & Focus Trapping
     * ----------------------------------------------------------------------
     */
    window.addEventListener('keydown', (e) => {
        if (lightboxModal && lightboxModal.classList.contains('open')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevLightboxImage();
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextLightboxImage();
                return;
            }

            // Focus trapping inside Lightbox
            if (e.key === 'Tab') {
                const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
                const focusables = Array.from(lightboxModal.querySelectorAll(focusableSelectors))
                    .filter(el => !el.disabled && el.offsetParent !== null);
                
                if (focusables.length === 0) return;

                const firstEl = focusables[0];
                const lastEl = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        } else if (submissionModal && submissionModal.classList.contains('open')) {
            if (e.key === 'Escape') closeSubmissionModal();
        } else if (fallbackModal && fallbackModal.classList.contains('open')) {
            if (e.key === 'Escape') closeFallbackModal();
        }
    });

    /**
     * ----------------------------------------------------------------------
     * Step 6: Upload Waiting Overlay Controls & DOM Appending
     * ----------------------------------------------------------------------
     */
    function showUploadWaiting(title, desc) {
        if (!uploadWaitingOverlay) return;
        if (uploadWaitingTitle && title) uploadWaitingTitle.textContent = title;
        if (uploadWaitingDesc && desc) uploadWaitingDesc.textContent = desc;
        uploadWaitingOverlay.classList.add('open');
        lockBodyScroll();
    }

    function hideUploadWaiting() {
        if (!uploadWaitingOverlay) return;
        uploadWaitingOverlay.classList.remove('open');
        unlockBodyScroll();
    }

    /**
     * Instantly appends newly uploaded photos to the active DOM state without full page reload.
     */
    async function appendUploadedPhotosToGallery(newItems) {
        if (!Array.isArray(newItems) || newItems.length === 0) return;

        // Detect orientations for new photos
        await Promise.all(newItems.map(detectOrientation));

        // Prepend new items to galleryData
        galleryData = [...newItems, ...galleryData];
        currentFiltered = activeCategory === 'all'
            ? [...galleryData]
            : galleryData.filter(item => item.category === activeCategory);

        updateCategoryCounts();
        renderGallery(currentFiltered);

        // Highlight newly appended card gently
        setTimeout(() => {
            const firstCard = galleryGrid?.querySelector('.photo-card');
            if (firstCard) {
                firstCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                firstCard.style.outline = '3px solid #16a34a';
                setTimeout(() => { firstCard.style.outline = ''; }, 2500);
            }
        }, 300);
    }

    /**
     * ----------------------------------------------------------------------
     * Step 7: Instant Local Preview with FileReader
     * ----------------------------------------------------------------------
     */
    if (localPhotoInput) {
        localPhotoInput.addEventListener('change', (e) => {
            const picked = Array.from(e.target.files || []);
            e.target.value = '';
            if (picked.length === 0) return;

            hideFormStatus();

            const rejectedType = [];
            const rejectedSize = [];

            picked.forEach(file => {
                if (!file.type.startsWith('image/')) {
                    rejectedType.push(file.name);
                } else if (file.size > IMGBB_MAX_FILE_BYTES) {
                    rejectedSize.push(file.name);
                } else {
                    selectedLocalFiles.push({ file, previewUrl: URL.createObjectURL(file) });
                }
            });

            renderLocalPreviews();

            const messages = [];
            if (rejectedType.length) {
                messages.push('ಚಿತ್ರಗಳ ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಆಯ್ಕೆಮಾಡಿ: ' + rejectedType.join(', '));
            }
            if (rejectedSize.length) {
                messages.push(`ಈ ಚಿತ್ರಗಳು 32 MB ಗಿಂತ ದೊಡ್ಡದಾಗಿವೆ: ${rejectedSize.join(', ')}`);
            }
            if (messages.length) {
                showFormStatus(messages.join(' | '), 'error');
            }
        });
    }

    if (previewList) {
        previewList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove-preview');
            if (!btn) return;
            const index = Number(btn.dataset.index);
            const [removed] = selectedLocalFiles.splice(index, 1);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            renderLocalPreviews();
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            clearLocalPreview();
        });
    }

    function renderLocalPreviews() {
        if (!previewList || !previewContainer) return;
        previewList.innerHTML = '';

        if (selectedLocalFiles.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }

        selectedLocalFiles.forEach((item, index) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'position: relative; width: 72px; height: 72px;';

            const img = document.createElement('img');
            img.src = item.previewUrl;
            img.alt = item.file.name;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 6px;';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-remove-preview';
            removeBtn.textContent = '✕';
            removeBtn.title = item.file.name;
            removeBtn.dataset.index = index;
            removeBtn.style.cssText = 'position: absolute; top: 2px; right: 2px;';

            wrap.append(img, removeBtn);
            previewList.appendChild(wrap);
        });

        const totalBytes = selectedLocalFiles.reduce((sum, item) => sum + item.file.size, 0);
        if (previewFileName) previewFileName.textContent = `ಆಯ್ಕೆಮಾಡಿದ ಚಿತ್ರಗಳು: ${selectedLocalFiles.length}`;
        if (previewFileSize) previewFileSize.textContent = formatBytes(totalBytes);
        previewContainer.style.display = 'flex';
    }

    function clearLocalPreview() {
        selectedLocalFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
        selectedLocalFiles = [];
        if (localPhotoInput) localPhotoInput.value = '';
        renderLocalPreviews();
    }

    /**
     * ----------------------------------------------------------------------
     * Step 8: Photo Submission Handler + Waiting Overlay Integration
     * ----------------------------------------------------------------------
     */
    function openSubmissionModal() {
        if (!submissionModal) return;
        submissionModal.classList.add('open');
        lockBodyScroll();
        hideFormStatus();
    }

    function closeSubmissionModal() {
        if (!submissionModal) return;
        submissionModal.classList.remove('open');
        unlockBodyScroll();
    }

    if (openSubmitModalBtn) openSubmitModalBtn.addEventListener('click', openSubmissionModal);
    if (closeSubmitModalBtn) closeSubmitModalBtn.addEventListener('click', closeSubmissionModal);

    if (submissionModal) {
        submissionModal.addEventListener('click', (e) => {
            if (e.target === submissionModal) closeSubmissionModal();
        });
    }

    if (photoSubmissionForm) {
        photoSubmissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const devoteeName = document.getElementById('devoteeName')?.value.trim() || 'ಭಕ್ತರು (ಹೆಸರು ನಮೂದಿಸಿಲ್ಲ)';
            const devoteeContact = document.getElementById('devoteeContact')?.value.trim() || 'ತಿಳಿಸಿಲ್ಲ';
            const rawCategory = document.getElementById('photoCategory')?.value || 'ಉತ್ಸವಗಳು (Festivals)';
            const photoDescription = document.getElementById('photoDescription')?.value.trim() || '';
            let photoUrl = photoUrlInput?.value.trim() || '';

            const hasLocalPhoto = selectedLocalFiles.length > 0;
            const hasUrl = Boolean(photoUrl);

            // Determine simple category slug
            let categorySlug = 'festivals';
            if (rawCategory.includes('Rituals') || rawCategory.includes('ಪೂಜೆಗಳು')) categorySlug = 'rituals';
            else if (rawCategory.includes('Premises') || rawCategory.includes('ಆವರಣ')) categorySlug = 'premises';
            else if (rawCategory.includes('Archives') || rawCategory.includes('ಹಳೆಯ')) categorySlug = 'archives';

            if (!hasLocalPhoto && !hasUrl) {
                showFormStatus('ದಯವಿಟ್ಟು ಚಿತ್ರದ ಫೈಲ್ ಆರಿಸಿ ಅಥವಾ ಚಿತ್ರದ ವೆಬ್ ಲಿಂಕ್ ನಮೂದಿಸಿ.', 'error');
                return;
            }

            setSubmitButtonState(true, 'ಚಿತ್ರವನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...');
            closeSubmissionModal();

            // Display immersive Upload Waiting Popup
            showUploadWaiting(
                'ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
                'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ಚಿತ್ರವನ್ನು ಸ್ವೀಕರಿಸಿ ಗ್ಯಾಲರಿಯಲ್ಲಿ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...'
            );

            const newlyCreatedEntries = [];

            try {
                // Upload files to ImgBB if local files were picked
                if (hasLocalPhoto) {
                    if (IMGBB_API_KEY && IMGBB_API_KEY.trim() !== '') {
                        const uploadedUrls = [];
                        for (let i = 0; i < selectedLocalFiles.length; i++) {
                            if (uploadWaitingDesc) {
                                uploadWaitingDesc.textContent = `ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ (${i + 1}/${selectedLocalFiles.length})...`;
                            }
                            const uploadResult = await uploadToImgBB(selectedLocalFiles[i].file);
                            if (!uploadResult || !uploadResult.url) {
                                throw new Error('ImgBB Upload Error');
                            }
                            uploadedUrls.push(uploadResult.url);

                            newlyCreatedEntries.push({
                                id: `svt-upload-${Date.now()}-${i}`,
                                title: devoteeName !== 'ಭಕ್ತರು (ಹೆಸರು ನಮೂದಿಸಿಲ್ಲ)' ? `${devoteeName} ಅವರ ಸಲ್ಲಿಕೆ` : 'ಭಕ್ತರ ಸಲ್ಲಿಕೆ',
                                category: categorySlug,
                                categoryKn: rawCategory.split(' ')[0],
                                imagePath: uploadResult.url,
                                caption: photoDescription,
                                author: devoteeName,
                                date: new Date().toISOString().split('T')[0]
                            });
                        }
                        photoUrl = uploadedUrls.join(', ');
                    } else {
                        // Without API key, route to Fallback
                        hideUploadWaiting();
                        setSubmitButtonState(false);
                        openFallbackModal({
                            name: devoteeName,
                            contact: devoteeContact,
                            category: rawCategory,
                            description: photoDescription,
                            imageUrl: 'ಮೊಬೈಲ್ / ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿದ ಚಿತ್ರ',
                            localFileSelected: true,
                            isFallbackError: false
                        });
                        return;
                    }
                } else if (hasUrl) {
                    newlyCreatedEntries.push({
                        id: `svt-upload-${Date.now()}`,
                        title: devoteeName !== 'ಭಕ್ತರು (ಹೆಸರು ನಮೂದಿಸಿಲ್ಲ)' ? `${devoteeName} ಅವರ ಸಲ್ಲಿಕೆ` : 'ಭಕ್ತರ ಸಲ್ಲಿಕೆ',
                        category: categorySlug,
                        categoryKn: rawCategory.split(' ')[0],
                        imagePath: photoUrl,
                        caption: photoDescription,
                        author: devoteeName,
                        date: new Date().toISOString().split('T')[0]
                    });
                }

                // Send notification payload to Formspree
                if (uploadWaitingDesc) {
                    uploadWaitingDesc.textContent = 'ವಿವರಗಳನ್ನು ಸಮಿತಿಗೆ ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...';
                }

                const payload = {
                    "ಭಕ್ತರ ಹೆಸರು (Name)": devoteeName,
                    "ಸಂಪರ್ಕ (Contact)": devoteeContact,
                    "ವಿಭಾಗ (Category)": rawCategory,
                    "ಚಿತ್ರದ ವಿವರಣೆ (Description)": photoDescription,
                    "ಚಿತ್ರದ ನೇರ ಲಿಂಕ್ (Direct Image Link)": photoUrl,
                    "_subject": `[SVT Photo Submission] ${rawCategory} - ${devoteeName}`
                };

                const response = await fetch(FORMSPREE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }).catch(() => null);

                // Instantly append newly uploaded photos to DOM
                if (newlyCreatedEntries.length > 0) {
                    await appendUploadedPhotosToGallery(newlyCreatedEntries);
                }

                if (uploadWaitingTitle) uploadWaitingTitle.textContent = '✅ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!';
                if (uploadWaitingDesc) uploadWaitingDesc.textContent = 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಚಿತ್ರವನ್ನು ತಕ್ಷಣ ಗ್ಯಾಲರಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.';

                photoSubmissionForm.reset();
                clearLocalPreview();

                setTimeout(() => {
                    hideUploadWaiting();
                }, 2000);

            } catch (err) {
                console.warn('Upload / Formspree issue:', err);
                hideUploadWaiting();
                handleFormspreeEndpointFailure({
                    name: devoteeName,
                    contact: devoteeContact,
                    category: rawCategory,
                    description: photoDescription,
                    imageUrl: photoUrl || selectedLocalFiles.map(item => item.file.name).join(', ')
                });
            } finally {
                setSubmitButtonState(false);
            }
        });
    }

    /**
     * Upload image directly to Free ImgBB API
     */
    async function uploadToImgBB(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', IMGBB_API_KEY);

        const res = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('ImgBB HTTP error ' + res.status);
        const data = await res.json();
        if (data && data.success) {
            return {
                url: data.data.url,
                display_url: data.data.display_url
            };
        }
        throw new Error('ImgBB API returned failure');
    }

    function setSubmitButtonState(isLoading, text) {
        if (!submitBtn) return;
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = text || 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ';
        }
    }

    function showFormStatus(message, type) {
        if (!formStatusMsg) return;
        formStatusMsg.textContent = message;
        formStatusMsg.className = `form-status-msg ${type}`;
        formStatusMsg.style.display = 'block';
    }

    function hideFormStatus() {
        if (!formStatusMsg) return;
        formStatusMsg.className = 'form-status-msg';
        formStatusMsg.style.display = 'none';
    }

    /**
     * Fallback Direct WhatsApp & Email Handler
     */
    function handleFormspreeEndpointFailure(submissionData) {
        closeSubmissionModal();
        openFallbackModal({
            ...submissionData,
            isFallbackError: true
        });
    }

    function openFallbackModal(data) {
        if (!fallbackModal) return;

        if (data.isFallbackError) {
            if (fallbackModalTitle) fallbackModalTitle.textContent = 'ಆನ್‌ಲೈನ್ ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ';
            if (fallbackModalSubtitle) fallbackModalSubtitle.textContent = 'ಚಿಂತಿಸಬೇಡಿ! ನಿಮ್ಮ ಅಮೂಲ್ಯ ಚಿತ್ರ ಮತ್ತು ವಿವರಗಳನ್ನು ಈ ಕೆಳಗಿನ ನೇರ ಬಟನ್ ಮೂಲಕ WhatsApp ಅಥವಾ Email ನಲ್ಲಿ ಕಳುಹಿಸಬಹುದು:';
        } else {
            if (fallbackModalTitle) fallbackModalTitle.textContent = 'ನೇರ ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ!';
            if (fallbackModalSubtitle) fallbackModalSubtitle.textContent = 'ನಿಮ್ಮ ಚಿತ್ರ ಮತ್ತು ವಿವರಗಳನ್ನು ಕೆಳಗಿನ ಒಂದು-ಕ್ಲಿಕ್ ಬಟನ್ ಮೂಲಕ ದೇವಸ್ಥಾನದ ಸಮಿತಿಗೆ ಸುಲಭವಾಗಿ ತಲುಪಿಸಿ:';
        }

        if (fallbackSummary) {
            fallbackSummary.innerHTML = `
                <div class="fallback-summary-item"><strong>ಭಕ್ತರ ಹೆಸರು:</strong> ${escapeHtml(data.name)}</div>
                <div class="fallback-summary-item"><strong>ಸಂಪರ್ಕ:</strong> ${escapeHtml(data.contact)}</div>
                <div class="fallback-summary-item"><strong>ವಿಭಾಗ:</strong> ${escapeHtml(data.category)}</div>
                <div class="fallback-summary-item"><strong>ವಿವರಣೆ:</strong> ${escapeHtml(data.description)}</div>
                <div class="fallback-summary-item"><strong>ಚಿತ್ರ / ಲಿಂಕ್:</strong> ${escapeHtml(data.imageUrl || 'ಸ್ಥಳೀಯ ಫೋಟೋ')}</div>
            `;
        }

        const waText = 
`*ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ - ಛಾಯಾಚಿತ್ರ ಸಲ್ಲಿಕೆ*
----------------------------------------
👤 *ಭಕ್ತರ ಹೆಸರು:* ${data.name}
📞 *ಸಂಪರ್ಕ:* ${data.contact}
🏷️ *ವಿಭಾಗ:* ${data.category}
📝 *ವಿವರಣೆ:* ${data.description}
🔗 *ಚಿತ್ರ / ಲಿಂಕ್:* ${data.imageUrl || 'ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ'}
----------------------------------------
(SVT Kalasa Website Submission)`;

        const waUrl = `https://wa.me/${TEMPLE_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`;
        if (fallbackWhatsAppBtn) {
            fallbackWhatsAppBtn.href = waUrl;
        }

        const emailSubject = `SVT Kalasa - ಛಾಯಾಚಿತ್ರ ಸಲ್ಲಿಕೆ (${data.category})`;
        const emailBody = 
`ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ ಸಮಿತಿಗೆ ನಮಸ್ಕಾರಗಳು,

ದೇವಸ್ಥಾನದ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಛಾಯಾಚಿತ್ರ ವಿವರಗಳು:
- ಭಕ್ತರ ಹೆಸರು: ${data.name}
- ಸಂಪರ್ಕ: ${data.contact}
- ವಿಭಾಗ: ${data.category}
- ವಿವರಣೆ: ${data.description}
- ಚಿತ್ರದ ಲಿಂಕ್: ${data.imageUrl || 'ಇಮೇಲ್ ಜೊತೆಗೆ ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ'}

ಧನ್ಯವಾದಗಳು,
${data.name}`;

        const mailtoUrl = `mailto:${TEMPLE_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        if (fallbackEmailBtn) {
            fallbackEmailBtn.href = mailtoUrl;
        }

        fallbackModal.classList.add('open');
        lockBodyScroll();
    }

    function closeFallbackModal() {
        if (!fallbackModal) return;
        fallbackModal.classList.remove('open');
        unlockBodyScroll();
    }

    if (closeFallbackModalBtn) closeFallbackModalBtn.addEventListener('click', closeFallbackModal);
    if (fallbackBackBtn) fallbackBackBtn.addEventListener('click', closeFallbackModal);

    if (fallbackModal) {
        fallbackModal.addEventListener('click', (e) => {
            if (e.target === fallbackModal) closeFallbackModal();
        });
    }

    /**
     * Helpers
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    function formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Launch gallery
    initGallery();
});
