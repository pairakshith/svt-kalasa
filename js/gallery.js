/**
 * gallery.js - Photo Gallery and Zero-Budget Photo Submission System
 * Sri Venkataramana Temple, Melangadi, Kalasa
 */

// ==========================================================================
// 1. CONFIGURATION (Zero-Budget Architecture)
// ==========================================================================

// Formspree endpoint (collects devotee details paired with the uploaded image URL)
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjyvjoww';

// Free ImgBB API Key (Uploads local images and creates a public web link)
const IMGBB_API_KEY = '66c04660b388ef7e482286c1a9530545';

// Temple Contact for Fallback Direct Sharing
// const TEMPLE_PHONE = '+919481234567'; // Replace with temple committee official WhatsApp/Phone
const TEMPLE_EMAIL = 'test@gmail.com'; // Replace with temple official email

// ==========================================================================
// 2. MAIN LOGIC & DOM INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Gallery State
    let galleryData = [];
    let currentFiltered = [];
    let currentLightboxIndex = -1;
    let activeCategory = 'all';
    let lightboxItems = [];
    let lightboxActiveCategory = 'all';
    let displayItems = [];

    // Selected Local File State for Instant Preview & Upload
    let selectedLocalFile = null;

    // DOM Elements - Gallery Grid & Filters
    const galleryGrid = document.getElementById('galleryGrid');
    const photoCountEl = document.getElementById('photoCount');
    const filterButtons = document.querySelectorAll('.filter-pill');

    // DOM Elements - Lightbox Modal
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCategory = document.getElementById('lightboxCategory');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
    const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
    const lightboxNextBtn = document.getElementById('lightboxNextBtn');

    // Category filter bar, generated inside the enlarged (lightbox) view
    const lightboxFilterBar = document.createElement('div');
    lightboxFilterBar.className = 'lightbox-filter-bar';
    lightboxFilterBar.setAttribute('role', 'group');
    lightboxFilterBar.setAttribute('aria-label', 'ವಿಭಾಗಗಳ ಫಿಲ್ಟರ್');
    if (lightboxModal) {
        const lightboxDialog = lightboxModal.querySelector('.lightbox-dialog');
        const lightboxImageWrapper = lightboxModal.querySelector('.lightbox-image-wrapper');
        if (lightboxDialog && lightboxImageWrapper) {
            lightboxDialog.insertBefore(lightboxFilterBar, lightboxImageWrapper);
        }
    }

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
    const previewImage = document.getElementById('previewImage');
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
     * Scroll lock scoped to this page. Compensates for the scrollbar width so the
     * page does not shift sideways when the lightbox or a modal opens.
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
     * ----------------------------------------------------------------------
     * Step 1: Initialize & Fetch gallery.json
     * ----------------------------------------------------------------------
     */
    async function initGallery() {
        try {
            const response = await fetch('../data/gallery.json');
            if (!response.ok) {
                throw new Error(`Failed to load gallery data: ${response.status}`);
            }
            galleryData = await response.json();
            await Promise.all(galleryData.map(detectOrientation));
            currentFiltered = [...galleryData];
            updateCategoryCounts();
            renderGallery(currentFiltered);
        } catch (error) {
            console.error('Error fetching gallery data:', error);
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
            photoCountEl.textContent = `${galleryData.length} ಚಿತ್ರಗಳು`;
        }
    }

    /**
     * ----------------------------------------------------------------------
     * Step 2: Render Responsive Photo Grid
     * ----------------------------------------------------------------------
     */
    // Justified-row layout (Google Photos style)
    const JUSTIFY_GAP = 6;
    let justifiedGroups = [];

    /**
     * Fills each row to the full container width by scaling its photos together.
     * Every photo keeps its exact aspect ratio, so nothing is cropped or padded.
     * The last row of each group keeps the target height and is not stretched.
     */
    function layoutJustifiedRows(group, targetH, gap) {
        const { container, entries } = group;
        const W = container.clientWidth;
        if (!W || entries.length === 0) return;

        // 1. Collect photos into rows until a row at target height would fill the width
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

        // 2. Scale each full row to span the width exactly; last row uses target height
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

    /**
     * Determine each photo's orientation from its real pixel size, so portrait and
     * landscape photos can be laid out in their own containers. Uses JSON width/height
     * when present, otherwise probes the image once.
     */
    function detectOrientation(item) {
        if (item.orientation) return Promise.resolve(item.orientation);

        if (item.width && item.height) {
            item.orientation = item.height > item.width ? 'portrait' : 'landscape';
            return Promise.resolve(item.orientation);
        }

        return new Promise(resolve => {
            // Never let one slow or broken image hold up the whole gallery
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
            probe.src = item.imagePath;
        });
    }

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

        // Lightbox order matches the order the photos appear on the page
        displayItems = [...landscape, ...portrait];

        const renderCards = (list, offset) => list.map((item, i) => {
            const sizeAttrs = item.width && item.height
                ? `width="${item.width}" height="${item.height}"`
                : '';
            return `
            <article class="photo-card" role="button" tabindex="0" data-index="${offset + i}" aria-label="${escapeHtml(item.title)}">
                <img
                    src="${escapeHtml(item.imagePath)}"
                    alt="${escapeHtml(item.title)}"
                    class="photo-thumb"
                    loading="lazy"
                    ${sizeAttrs}
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
                const ratio = item.width && item.height ? item.width / item.height : 1;
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
     * Step 4: Lightbox Modal & Gestures
     * ----------------------------------------------------------------------
     */
    function getCategoryLabel(item) {
        return (item.categoryKn || item.category || 'ಇತರೆ').trim();
    }

    /** Lightbox navigation set = all photos, or only photos in the active category */
    function buildLightboxItems() {
        lightboxItems = lightboxActiveCategory === 'all'
            ? [...displayItems]
            : displayItems.filter(item => getCategoryLabel(item) === lightboxActiveCategory);
    }

    /**
     * Generates one filter pill per distinct categoryKn value found in gallery.json,
     * plus an "all" pill. Re-rendered whenever the active category changes.
     */
    function renderLightboxFilters() {
        if (!lightboxFilterBar) return;

        const counts = new Map();
        displayItems.forEach(item => {
            const label = getCategoryLabel(item);
            counts.set(label, (counts.get(label) || 0) + 1);
        });

        const pills = [{ key: 'all', label: 'ಎಲ್ಲಾ ಚಿತ್ರಗಳು', count: displayItems.length }];
        counts.forEach((count, label) => pills.push({ key: label, label, count }));

        lightboxFilterBar.innerHTML = pills.map(pill => {
            const isActive = pill.key === lightboxActiveCategory;
            return `
                <button type="button" class="lightbox-filter-pill${isActive ? ' active' : ''}"
                        data-filter="${escapeHtml(pill.key)}" aria-pressed="${isActive}">
                    <span>${escapeHtml(pill.label)}</span>
                    <span class="pill-badge">${pill.count}</span>
                </button>`;
        }).join('');
    }

    function openLightbox(index) {
        if (!currentFiltered || currentFiltered.length === 0) return;
        const clickedItem = displayItems[index];

        // Opening from the grid always starts with the full set
        lightboxActiveCategory = 'all';
        buildLightboxItems();
        currentLightboxIndex = Math.max(0, lightboxItems.indexOf(clickedItem));

        renderLightboxFilters();
        updateLightboxView();
        lightboxModal.classList.add('open');
        lockBodyScroll();
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        unlockBodyScroll();
        currentLightboxIndex = -1;
    }

    /** Switch the lightbox to a category, keeping the current photo if it still matches */
    function setLightboxCategory(category) {
        const currentItem = lightboxItems[currentLightboxIndex];
        lightboxActiveCategory = category;
        buildLightboxItems();

        const newIndex = lightboxItems.indexOf(currentItem);
        currentLightboxIndex = newIndex >= 0 ? newIndex : 0;

        renderLightboxFilters();
        updateLightboxView();
    }

    function updateLightboxView() {
        if (currentLightboxIndex < 0 || currentLightboxIndex >= lightboxItems.length) return;
        const item = lightboxItems[currentLightboxIndex];

        lightboxImg.src = item.imagePath;
        lightboxImg.alt = item.title || '';
        lightboxTitle.textContent = item.title || '';
        lightboxCategory.textContent = getCategoryLabel(item);

        lightboxCaption.textContent = item.caption || '';
        lightboxCaption.style.display = item.caption ? '' : 'none';

        const dateText = item.date ? ` · ${formatDate(item.date)}` : '';
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxItems.length}${dateText}`;
    }

    function prevLightboxImage() {
        if (lightboxItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        updateLightboxView();
    }

    function nextLightboxImage() {
        if (lightboxItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
        updateLightboxView();
    }

    lightboxFilterBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.lightbox-filter-pill');
        if (pill) setLightboxCategory(pill.getAttribute('data-filter'));
    });

    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevLightboxImage(); });
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextLightboxImage(); });

    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }

    // Touch Swipe Gesture Support for Mobile
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
     * Step 5: Instant Local Preview with FileReader
     * ----------------------------------------------------------------------
     */
    if (localPhotoInput) {
        localPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                // Verify image mime type
                if (!file.type.startsWith('image/')) {
                    showFormStatus('ದಯವಿಟ್ಟು ಚಿತ್ರದ ಫೈಲ್ (Image file) ಮಾತ್ರ ಆರಿಸಿ.', 'error');
                    clearLocalPreview();
                    return;
                }

                selectedLocalFile = file;

                // FileReader for Instant Preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    previewImage.src = event.target.result;
                    previewFileName.textContent = file.name;
                    previewFileSize.textContent = formatBytes(file.size);
                    previewContainer.style.display = 'flex';
                    hideFormStatus();
                };
                reader.readAsDataURL(file);
            } else {
                clearLocalPreview();
            }
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            clearLocalPreview();
        });
    }

    function clearLocalPreview() {
        selectedLocalFile = null;
        if (localPhotoInput) localPhotoInput.value = '';
        if (previewImage) previewImage.src = '';
        if (previewContainer) previewContainer.style.display = 'none';
    }

    /**
     * ----------------------------------------------------------------------
     * Step 6: Zero-Budget Free Photo Submission Handler
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

            // Extract optional form fields
            const devoteeName = document.getElementById('devoteeName')?.value.trim() || 'ಭಕ್ತರು (ಹೆಸರು ನಮೂದಿಸಿಲ್ಲ)';
            const devoteeContact = document.getElementById('devoteeContact')?.value.trim() || 'ತಿಳಿಸಿಲ್ಲ';
            const photoCategory = document.getElementById('photoCategory')?.value || 'ಉತ್ಸವಗಳು';
            const photoDescription = document.getElementById('photoDescription')?.value.trim() || 'ವಿವರಣೆ ನೀಡಿಲ್ಲ';
            let photoUrl = photoUrlInput?.value.trim() || '';

            // Check if user provided at least a local photo OR a link OR text
            const hasLocalPhoto = Boolean(selectedLocalFile);
            const hasUrl = Boolean(photoUrl);

            setSubmitButtonState(true, 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...');

            try {
                // Free ImgBB Handling if a local file is picked and API key exists
                if (hasLocalPhoto) {
                    if (IMGBB_API_KEY && IMGBB_API_KEY.trim() !== '') {
                        setSubmitButtonState(true, 'ಸರ್ವರ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...');
                        const uploadResult = await uploadToImgBB(selectedLocalFile);
                        if (uploadResult && uploadResult.url) {
                            photoUrl = uploadResult.url;
                        } else {
                            throw new Error('ImgBB Upload Error');
                        }
                    } else {
                        // Without ImgBB key, Formspree free cannot take binary attachments.
                        // Seamlessly route to WhatsApp/Email fallback modal with pre-filled details!
                        setSubmitButtonState(false);
                        closeSubmissionModal();
                        openFallbackModal({
                            name: devoteeName,
                            contact: devoteeContact,
                            category: photoCategory,
                            description: photoDescription,
                            imageUrl: 'ಮೊಬೈಲ್ / ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿದ ಚಿತ್ರ (WhatsApp/Email ನಲ್ಲಿ ಲಗತ್ತಿಸಿ ಕಳುಹಿಸಿ)',
                            localFileSelected: true,
                            isFallbackError: false
                        });
                        return;
                    }
                }

                // If no local file and no URL entered, prompt gentle reminder
                if (!hasLocalPhoto && !hasUrl) {
                    showFormStatus('ದಯವಿಟ್ಟು ಚಿತ್ರದ ಫೈಲ್ ಆರಿಸಿ ಅಥವಾ ಚಿತ್ರದ ವೆಬ್ ಲಿಂಕ್ ನಮೂದಿಸಿ.', 'error');
                    setSubmitButtonState(false);
                    return;
                }

                // Prepare Payload for Formspree
                setSubmitButtonState(true, 'ವಿವರಗಳನ್ನು ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...');

                // Prepare clean, structured payload for Formspree dashboard & email notifications
                const payload = {
                    "ಭಕ್ತರ ಹೆಸರು (Name)": devoteeName,
                    "ಸಂಪರ್ಕ (Contact)": devoteeContact,
                    "ವಿಭಾಗ (Category)": photoCategory,
                    "ಚಿತ್ರದ ವಿವರಣೆ (Description)": photoDescription,
                    "ಚಿತ್ರದ ನೇರ ಲಿಂಕ್ (Direct Image Link)": photoUrl,
                    "_subject": `[SVT Photo Submission] ${photoCategory} - ${devoteeName}`
                };

                const response = await fetch(FORMSPREE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showFormStatus('ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಚಿತ್ರದ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಪರಿಶೀಲನೆಯ ನಂತರ ಗ್ಯಾಲರಿಯಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗುವುದು.', 'success');
                    photoSubmissionForm.reset();
                    clearLocalPreview();
                    setTimeout(() => {
                        closeSubmissionModal();
                    }, 3500);
                } else {
                    // Check for 404 Form Not Found or Invalid endpoint
                    if (response.status === 404 || response.status === 400 || response.status === 403) {
                        handleFormspreeEndpointFailure({
                            name: devoteeName,
                            contact: devoteeContact,
                            category: photoCategory,
                            description: photoDescription,
                            imageUrl: photoUrl
                        });
                    } else {
                        const data = await response.json().catch(() => ({}));
                        const errMsg = (data && data.errors) ? data.errors.map(err => err.message).join(', ') : 'ಸರ್ವರ್ ದೋಷ ಸಂಭವಿಸಿದೆ.';
                        showFormStatus(`ದೋಷ: ${errMsg}. ಕೆಳಗಿನ ಪರ್ಯಾಯ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿ.`, 'error');
                        setTimeout(() => {
                            handleFormspreeEndpointFailure({
                                name: devoteeName,
                                contact: devoteeContact,
                                category: photoCategory,
                                description: photoDescription,
                                imageUrl: photoUrl
                            });
                        }, 1200);
                    }
                }
            } catch (err) {
                console.warn('Formspree connection failed or blocked:', err);
                handleFormspreeEndpointFailure({
                    name: devoteeName,
                    contact: devoteeContact,
                    category: photoCategory,
                    description: photoDescription,
                    imageUrl: photoUrl || (selectedLocalFile ? selectedLocalFile.name : '')
                });
            } finally {
                setSubmitButtonState(false);
            }
        });
    }

    /**
     * Upload Image directly to Free ImgBB API
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
     * ----------------------------------------------------------------------
     * Step 7: 404 / Endpoint Fallback Modal with Direct WhatsApp & Email
     * ----------------------------------------------------------------------
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

        // Customise title/subtitle depending on whether it was a direct choice or server 404
        if (data.isFallbackError) {
            if (fallbackModalTitle) fallbackModalTitle.textContent = 'ಆನ್‌ಲೈನ್ ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ';
            if (fallbackModalSubtitle) fallbackModalSubtitle.textContent = 'ಚಿಂತಿಸಬೇಡಿ! ನಿಮ್ಮ ಅಮೂಲ್ಯ ಚಿತ್ರ ಮತ್ತು ವಿವರಗಳನ್ನು ಈ ಕೆಳಗಿನ ನೇರ ಬಟನ್ ಮೂಲಕ WhatsApp ಅಥವಾ Email ನಲ್ಲಿ ಕಳುಹಿಸಬಹುದು:';
        } else {
            if (fallbackModalTitle) fallbackModalTitle.textContent = 'ನೇರ ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ!';
            if (fallbackModalSubtitle) fallbackModalSubtitle.textContent = 'ನಿಮ್ಮ ಚಿತ್ರ ಮತ್ತು ವಿವರಗಳನ್ನು ಕೆಳಗಿನ ಒಂದು-ಕ್ಲಿಕ್ ಬಟನ್ ಮೂಲಕ ದೇವಸ್ಥಾನದ ಸಮಿತಿಗೆ ಸುಲಭವಾಗಿ ತಲುಪಿಸಿ:';
        }

        // Render Summary
        if (fallbackSummary) {
            fallbackSummary.innerHTML = `
                <div class="fallback-summary-item"><strong>ಭಕ್ತರ ಹೆಸರು:</strong> ${escapeHtml(data.name)}</div>
                <div class="fallback-summary-item"><strong>ಸಂಪರ್ಕ:</strong> ${escapeHtml(data.contact)}</div>
                <div class="fallback-summary-item"><strong>ವಿಭಾಗ:</strong> ${escapeHtml(data.category)}</div>
                <div class="fallback-summary-item"><strong>ವಿವರಣೆ:</strong> ${escapeHtml(data.description)}</div>
                <div class="fallback-summary-item"><strong>ಚಿತ್ರ / ಲಿಂಕ್:</strong> ${escapeHtml(data.imageUrl || 'ಸ್ಥಳೀಯ ಫೋಟೋ')}</div>
            `;
        }

        // Build Pre-filled WhatsApp message
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

        // Build Pre-filled Email link
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
     * ----------------------------------------------------------------------
     * Step 8: Global Keyboard Navigation (Esc, Left, Right)
     * ----------------------------------------------------------------------
     */
    window.addEventListener('keydown', (e) => {
        if (lightboxModal && lightboxModal.classList.contains('open')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') prevLightboxImage();
            else if (e.key === 'ArrowRight') nextLightboxImage();
        } else if (submissionModal && submissionModal.classList.contains('open')) {
            if (e.key === 'Escape') closeSubmissionModal();
        } else if (fallbackModal && fallbackModal.classList.contains('open')) {
            if (e.key === 'Escape') closeFallbackModal();
        }
    });

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