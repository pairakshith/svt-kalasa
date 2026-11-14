/**
 * Event Table & Cards Search Filter Logic & Unified Event State
 * 
 * Features:
 * - Unified State Management (raw data, translated data, search query, active lang)
 * - Robust Debounce wrapper (250ms) to prevent excessive DOM filtering re-renders
 * - Normalized Matching (lowercase, trim, diacritics / accent stripping)
 * - Multi-field search across title, description/tithi, sevadaarara, keywords, date
 * - Seamless language switching preserving active search query and filters
 * - Batched / non-flicker DOM visibility updates with comprehensive Empty State & Reset button
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.EventManager = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Unified State Object
    const state = {
        eventsData: [],          // Raw events from events.json
        enEventsData: {},        // Translation map from en_events.json
        searchQuery: '',         // Current active search query
        activeFilters: {},       // Extensible filter state
        currentLang: 'kn',       // 'kn' | 'en'
        isLoaded: false,
        isLoading: false
    };

    /**
     * Helper: Debounce function execution
     */
    function debounce(func, wait = 250) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Kannada digit mapping for Indian / Kannada numerals (೦-೯ <-> 0-9)
     */
    const kannadaDigits = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];

    function convertKannadaNumeralsToAscii(str) {
        if (!str) return '';
        let res = '';
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code >= 0x0CE6 && code <= 0x0CEF) {
                // Kannada digits ೦-೯ (U+0CE6 to U+0CEF)
                res += (code - 0x0CE6).toString();
            } else {
                res += str[i];
            }
        }
        return res;
    }

    /**
     * Map of month abbreviations and aliases to month indices (1-12)
     */
    const monthAliases = {
        'jan': 1, 'january': 1, 'ಜನವರಿ': 1,
        'feb': 2, 'february': 2, 'ಫೆಬ್ರವರಿ': 2,
        'mar': 3, 'march': 3, 'ಮಾರ್ಚ್': 3,
        'apr': 4, 'april': 4, 'ಏಪ್ರಿಲ್': 4,
        'may': 5, 'ಮೇ': 5,
        'jun': 6, 'june': 6, 'ಜೂನ್': 6,
        'jul': 7, 'july': 7, 'ಜುಲೈ': 7,
        'aug': 8, 'august': 8, 'ಆಗಸ್ಟ್': 8,
        'sep': 9, 'sept': 9, 'september': 9, 'ಸೆಪ್ಟೆಂಬರ್': 9,
        'oct': 10, 'october': 10, 'ಅಕ್ಟೋಬರ್': 10,
        'nov': 11, 'november': 11, 'ನವೆಂಬರ್': 11,
        'dec': 12, 'december': 12, 'ಡಿಸೆಂಬರ್': 12
    };

    /**
     * Helper: Normalize string by trimming, lowercasing, converting Kannada numerals, and stripping diacritics/accents
     */
    function normalizeText(text) {
        if (!text) return '';
        const asciiConverted = convertKannadaNumeralsToAscii(String(text));
        return asciiConverted
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    /**
     * Helper: Escape HTML special characters
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Helper: Fetch JSON with error handling
     */
    async function fetchJson(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path} (Status ${response.status})`);
        }
        return await response.json();
    }

    /**
     * Helper: Detect current page context to resolve relative data paths
     */
    function getDataPaths() {
        const isPages = window.location.pathname.indexOf('/pages/') !== -1;
        return {
            events: isPages ? '../data/events.json' : 'data/events.json',
            enEvents: isPages ? '../locales/en_events.json' : 'locales/en_events.json'
        };
    }

    /**
     * Translate an event item based on current language and dictionary
     */
    function getTranslatedEvent(rawEvent, lang) {
        if (lang === 'kn') {
            return { ...rawEvent };
        }

        // If LocaleEngine is available, delegate translation
        if (window.LocaleEngine && typeof window.LocaleEngine.translateEventData === 'function') {
            return window.LocaleEngine.translateEventData(rawEvent);
        }

        // Fallback translation via state.enEventsData
        const dict = state.enEventsData || {};
        return {
            ...rawEvent,
            title: dict[`title:${rawEvent.title}`] || rawEvent.title,
            tithi: dict[`tithi:${rawEvent.tithi}`] || rawEvent.tithi,
            sevadaarara: dict[`sevadaarara:${rawEvent.sevadaarara}`] || rawEvent.sevadaarara
        };
    }

    /**
     * Load raw event data and translation dictionary once cleanly
     */
    async function loadEvents() {
        if (state.isLoaded) return state.eventsData;
        if (state.isLoading) return;

        state.isLoading = true;
        const paths = getDataPaths();

        try {
            // Synchronize active language from LocaleEngine or localStorage
            if (window.LocaleEngine && typeof window.LocaleEngine.getLanguage === 'function') {
                state.currentLang = window.LocaleEngine.getLanguage();
            } else {
                try {
                    const stored = localStorage.getItem('svt_kalasa_lang');
                    state.currentLang = (stored === 'en' || stored === 'kn') ? stored : 'kn';
                } catch (e) {
                    state.currentLang = 'kn';
                }
            }

            // Ensure LocaleEngine event dictionary is loaded if available
            if (window.LocaleEngine && typeof window.LocaleEngine.loadEventTranslations === 'function') {
                try {
                    await window.LocaleEngine.loadEventTranslations();
                } catch (err) {
                    console.warn('[EventManager] LocaleEngine event translation load warning:', err);
                }
            }

            // Fetch events data and translations in parallel with resilience
            const [eventsResult, enEventsResult] = await Promise.allSettled([
                fetchJson(paths.events),
                fetchJson(paths.enEvents)
            ]);

            if (eventsResult.status === 'fulfilled') {
                state.eventsData = eventsResult.value;
            } else {
                throw eventsResult.reason;
            }

            if (enEventsResult.status === 'fulfilled') {
                state.enEventsData = enEventsResult.value;
            } else {
                console.warn('[EventManager] en_events.json load fallback:', enEventsResult.reason);
                state.enEventsData = {};
            }

            state.isLoaded = true;
            return state.eventsData;
        } catch (error) {
            console.error('[EventManager] Error loading events data:', error);
            throw error;
        } finally {
            state.isLoading = false;
        }
    }

    /**
     * Render festival cards into #eventsContainer
     */
    function renderCards() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        if (!state.eventsData || state.eventsData.length === 0) {
            return;
        }

        const fragment = document.createDocumentFragment();

        state.eventsData.forEach(rawEvent => {
            const event = getTranslatedEvent(rawEvent, state.currentLang);

            // Fetch English translations regardless of current page language for bilingual search
            const dict = state.enEventsData || {};
            const enTitle = (window.LocaleEngine && typeof window.LocaleEngine.getEventFieldTranslation === 'function')
                ? window.LocaleEngine.getEventFieldTranslation(rawEvent.title, 'title')
                : (dict[`title:${rawEvent.title}`] || '');
            const enTithi = (window.LocaleEngine && typeof window.LocaleEngine.getEventFieldTranslation === 'function')
                ? window.LocaleEngine.getEventFieldTranslation(rawEvent.tithi, 'tithi')
                : (dict[`tithi:${rawEvent.tithi}`] || '');
            const enSeva = (window.LocaleEngine && typeof window.LocaleEngine.getEventFieldTranslation === 'function')
                ? window.LocaleEngine.getEventFieldTranslation(rawEvent.sevadaarara, 'sevadaarara')
                : (dict[`sevadaarara:${rawEvent.sevadaarara}`] || '');

            const article = document.createElement('article');
            article.className = 'festival-card';
            article.setAttribute('data-date', event.date || '');
            article.setAttribute('data-day', event.day || '');
            article.setAttribute('data-month-year', event.monthYear || '');
            article.setAttribute('data-keywords', rawEvent.keywords || '');
            article.setAttribute('data-original-title', rawEvent.title || '');
            article.setAttribute('data-original-tithi', rawEvent.tithi || '');
            article.setAttribute('data-original-sevadaarara', rawEvent.sevadaarara || '');
            article.setAttribute('data-en-title', enTitle || '');
            article.setAttribute('data-en-tithi', enTithi || '');
            article.setAttribute('data-en-sevadaarara', enSeva || '');

            article.innerHTML = `
                <div class="date-badge">
                    <span class="day" data-trans-type="transliterate" data-source-script="kannada">${escapeHtml(event.day)}</span>
                    <span class="month-year" data-trans-type="transliterate" data-source-script="kannada">${escapeHtml(event.monthYear)}</span>
                </div>
                <div class="card-content">
                    <div class="card-top">
                        <h3 class="event-title" data-original-kannada="${escapeHtml(rawEvent.title)}">${escapeHtml(event.title)}</h3>
                        <span class="tithi-tag" data-original-kannada="${escapeHtml(rawEvent.tithi)}">${escapeHtml(event.tithi)}</span>
                    </div>
                    <div class="card-bottom">
                        <div class="sevadaara-info">
                            <span class="label" data-trans-id="events_page.sevadaara_label"> ಸೇವಾದಾರರು:</span>
                            <span class="name" data-original-kannada="${escapeHtml(rawEvent.sevadaarara)}">${escapeHtml(event.sevadaarara)}</span>
                        </div>
                    </div>
                </div>
            `;

            fragment.appendChild(article);
        });

        container.innerHTML = '';
        container.appendChild(fragment);

        // Update DOM elements for static tags (like sevadaara_label, month transliteration)
        if (window.LocaleEngine && typeof window.LocaleEngine.updateDomElements === 'function') {
            window.LocaleEngine.updateDomElements(container);
        }

        // Highlight upcoming events
        initUpcomingEvents();

        // Apply any active search filter
        applyFilter();
    }

    /**
     * Build rich date representation variations for flexible date searching
     * e.g., for "2026-03-19", day "19", monthYear "March 2026":
     * returns: ["2026-03-19", "19-03-2026", "19/03/2026", "19-3-2026", "19/3/2026", "19 march", "19 march 2026", "march 19", "03-19", "03/19", "march 2026", "19 ಮಾರ್ಚ್", "ಮಾರ್ಚ್ 19", "ಮಾರ್ಚ್ 2026"]
     */
    function buildDateVariations(dateStr, dayStr, monthYearStr) {
        const variants = [];
        if (dateStr) {
            variants.push(dateStr); // "2026-03-19"
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];
                const monthInt = parseInt(month, 10);
                const dayInt = parseInt(day, 10);

                variants.push(`${day}-${month}-${year}`);
                variants.push(`${day}/${month}/${year}`);
                variants.push(`${dayInt}-${monthInt}-${year}`);
                variants.push(`${dayInt}/${monthInt}/${year}`);
                variants.push(`${day}-${month}`);
                variants.push(`${day}/${month}`);
                variants.push(`${dayInt}-${monthInt}`);
                variants.push(`${dayInt}/${monthInt}`);
                variants.push(`${month}-${day}`);
                variants.push(`${month}/${day}`);
                variants.push(`${year}-${month}`);
                variants.push(`${year}/${month}`);
            }
        }

        if (dayStr) {
            variants.push(String(dayStr));
        }

        if (monthYearStr) {
            variants.push(monthYearStr);
            // Reverse order if day is present
            if (dayStr) {
                variants.push(`${dayStr} ${monthYearStr}`);
                const monthOnly = monthYearStr.split(' ')[0];
                if (monthOnly) {
                    variants.push(`${dayStr} ${monthOnly}`);
                    variants.push(`${monthOnly} ${dayStr}`);
                }
            }

            // Kannada month transliteration / representation
            for (const [engMonth, num] of Object.entries(monthAliases)) {
                if (monthYearStr.toLowerCase().startsWith(engMonth)) {
                    for (const [alias, aliasNum] of Object.entries(monthAliases)) {
                        if (aliasNum === num && alias !== engMonth) {
                            variants.push(alias);
                            if (dayStr) {
                                variants.push(`${dayStr} ${alias}`);
                                variants.push(`${alias} ${dayStr}`);
                            }
                        }
                    }
                    break;
                }
            }
        }

        return variants.map(v => normalizeText(v)).join(' ');
    }

    /**
     * Check if an event card matches the search query across multiple normalized fields
     */
    function matchesQuery(card, normalizedQuery) {
        if (!normalizedQuery) return true;

        const rawKeywords = normalizeText(card.getAttribute('data-keywords') || '');
        const date = normalizeText(card.getAttribute('data-date') || '');
        const day = normalizeText(card.getAttribute('data-day') || '');
        const monthYear = normalizeText(card.getAttribute('data-month-year') || '');
        const dateVariations = buildDateVariations(date, day, monthYear);

        const origTitle = normalizeText(card.getAttribute('data-original-title') || '');
        const origTithi = normalizeText(card.getAttribute('data-original-tithi') || '');
        const origSeva = normalizeText(card.getAttribute('data-original-sevadaarara') || '');
        const enTitle = normalizeText(card.getAttribute('data-en-title') || '');
        const enTithi = normalizeText(card.getAttribute('data-en-tithi') || '');
        const enSeva = normalizeText(card.getAttribute('data-en-sevadaarara') || '');
        const cardText = normalizeText(card.textContent || card.innerText || '');

        // 1. Direct substring match against content, date variations, Kannada fields, or English translations
        if (
            cardText.indexOf(normalizedQuery) > -1 ||
            rawKeywords.indexOf(normalizedQuery) > -1 ||
            dateVariations.indexOf(normalizedQuery) > -1 ||
            origTitle.indexOf(normalizedQuery) > -1 ||
            origTithi.indexOf(normalizedQuery) > -1 ||
            origSeva.indexOf(normalizedQuery) > -1 ||
            enTitle.indexOf(normalizedQuery) > -1 ||
            enTithi.indexOf(normalizedQuery) > -1 ||
            enSeva.indexOf(normalizedQuery) > -1
        ) {
            return true;
        }

        // 2. Token-based multi-term match (e.g., "19 mar", "mar 2026", "27 march", "ugadi 2026", "ಯುಗಾದಿ march")
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
            const combinedHaystack = `${cardText} ${rawKeywords} ${dateVariations} ${origTitle} ${origTithi} ${origSeva} ${enTitle} ${enTithi} ${enSeva}`;
            const allTokensMatch = tokens.every(token => combinedHaystack.indexOf(token) > -1);
            if (allTokensMatch) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filter festival cards based on current search query
     */
    function applyFilter() {
        const cards = document.querySelectorAll('.festival-card');
        const normalizedQuery = normalizeText(state.searchQuery);
        let visibleCount = 0;

        cards.forEach(card => {
            if (matchesQuery(card, normalizedQuery)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Manage Empty State Display
        const noResults = document.getElementById('noResultsMsg');
        if (noResults) {
            if (cards.length > 0 && visibleCount === 0) {
                noResults.style.display = 'block';
                // Ensure reset button has click listener
                const resetBtn = noResults.querySelector('.btn-reset-search');
                if (resetBtn && !resetBtn.dataset.bound) {
                    resetBtn.dataset.bound = 'true';
                    resetBtn.addEventListener('click', resetSearch);
                }
            } else {
                noResults.style.display = 'none';
            }
        }
    }

    /**
     * Update search wrapper UI typing state (hides icon & PDF button while user is typing)
     */
    function updateSearchWrapperState(query) {
        const wrapper = document.getElementById('searchWrapper');
        if (!wrapper) return;
        if (query && query.trim().length > 0) {
            wrapper.classList.add('is-typing');
        } else {
            wrapper.classList.remove('is-typing');
        }
    }

    /**
     * Reset search query, input field, and restore full event view
     */
    function resetSearch() {
        state.searchQuery = '';
        const searchInput = document.getElementById('eventSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        updateSearchWrapperState('');
        applyFilter();
    }

    /**
     * Debounced search handler for input element
     */
    const debouncedFilter = debounce(function (query) {
        state.searchQuery = query;
        applyFilter();
    }, 200);

    /**
     * Handle input on event search bar
     */
    function onSearchInput(event) {
        const query = event ? event.target.value : (document.getElementById('eventSearch')?.value || '');
        updateSearchWrapperState(query);
        debouncedFilter(query);
    }

    /**
     * Table filter support for legacy / standalone table views
     */
    function filterTable() {
        const input = document.getElementById('tableSearch');
        if (!input) return;

        const filter = normalizeText(input.value);
        const table = document.getElementById('eventsTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0]?.getElementsByTagName('tr') || [];
        for (let i = 0; i < rows.length; i++) {
            const rowText = normalizeText(rows[i].textContent || rows[i].innerText);
            rows[i].style.display = (rowText.indexOf(filter) > -1) ? '' : 'none';
        }
    }

    /**
     * Highlight next upcoming event and mark past events
     */
    let upcomingListenerAdded = false;
    let hasScrolledToNext = false;

    function initUpcomingEvents() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const cards = document.querySelectorAll('.festival-card');
        let foundUpcoming = false;

        cards.forEach(card => {
            const eventDate = card.getAttribute('data-date');
            if (!eventDate) return;

            // Clear old badge if already present
            const oldBadge = card.querySelector('.upcoming-badge');
            if (oldBadge) oldBadge.remove();

            if (!foundUpcoming && eventDate >= todayStr) {
                card.classList.add('upcoming-next');

                const cardTop = card.querySelector('.card-top');
                if (cardTop) {
                    const badge = document.createElement('span');
                    badge.className = 'upcoming-badge';

                    const badgeText = (window.LocaleEngine && typeof window.LocaleEngine.translateText === 'function')
                        ? window.LocaleEngine.translateText('events_page.upcoming_badge', 'ಮುಂದಿನ ಉತ್ಸವ')
                        : (state.currentLang === 'en' ? 'Next event' : 'ಮುಂದಿನ ಉತ್ಸವ');

                    badge.textContent = `🌟 ${badgeText}`;
                    cardTop.appendChild(badge);
                }

                foundUpcoming = true;

                // Scroll only once on initial load
                if (!hasScrolledToNext) {
                    hasScrolledToNext = true;
                    setTimeout(() => {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            } else if (eventDate < todayStr) {
                card.classList.add('past-event');
            }
        });

        // Register language change listener once to refresh badge text
        if (!upcomingListenerAdded && window.LocaleEngine && typeof window.LocaleEngine.onLanguageChange === 'function') {
            upcomingListenerAdded = true;
            window.LocaleEngine.onLanguageChange(() => {
                initUpcomingEvents();
            });
        }
    }

    /**
     * Handle language switch: re-render or re-translate cards while maintaining active search query
     */
    function onLanguageSwitch(newLang) {
        state.currentLang = newLang;
        const searchInput = document.getElementById('eventSearch');
        if (searchInput) {
            state.searchQuery = searchInput.value;
        }

        if (state.isLoaded && state.eventsData.length > 0) {
            renderCards();
        }
    }

    /**
     * Bootstrap event page data, search listeners, and translation sync
     */
    async function initEventsPage() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        // Sync input field value to state if pre-populated
        const searchInput = document.getElementById('eventSearch');
        if (searchInput && searchInput.value) {
            state.searchQuery = searchInput.value;
        }

        try {
            await loadEvents();
            renderCards();
        } catch (error) {
            console.error('[EventManager] Failed to initialize events page:', error);
            container.innerHTML = `
                <div style="text-align: center; color: #cc0000; padding: 20px;">
                    <p><strong data-trans-id="events_page.error_loading">ಕಾರ್ಯಕ್ರಮದ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</strong></p>
                    <p style="font-size: 0.85em; color: #666;">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/events.json</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
                </div>
            `;
            if (window.LocaleEngine && typeof window.LocaleEngine.updateDomElements === 'function') {
                window.LocaleEngine.updateDomElements(container);
            }
        }
    }

    // Attach DOM listener for search input and table search
    function setupDOMListeners() {
        const searchInput = document.getElementById('eventSearch');
        if (searchInput && !searchInput.dataset.bound) {
            searchInput.dataset.bound = 'true';
            searchInput.addEventListener('input', onSearchInput);
            
            // If user cleared input with 'x' (or keyboard delete), restore full view immediately
            searchInput.addEventListener('search', () => {
                state.searchQuery = searchInput.value;
                updateSearchWrapperState(searchInput.value);
                applyFilter();
            });
        }

        const tableSearchInput = document.getElementById('tableSearch');
        if (tableSearchInput && !tableSearchInput.dataset.bound) {
            tableSearchInput.dataset.bound = 'true';
            tableSearchInput.addEventListener('input', filterTable);
        }

        const noResults = document.getElementById('noResultsMsg');
        if (noResults) {
            const resetBtn = noResults.querySelector('.btn-reset-search');
            if (resetBtn && !resetBtn.dataset.bound) {
                resetBtn.dataset.bound = 'true';
                resetBtn.addEventListener('click', resetSearch);
            }
        }
    }

    // Register with LocaleEngine if present
    if (typeof window !== 'undefined' && window.LocaleEngine && typeof window.LocaleEngine.onLanguageChange === 'function') {
        window.LocaleEngine.onLanguageChange(onLanguageSwitch);
    }

    // Initialize listeners on DOM ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupDOMListeners();
            });
        } else {
            setupDOMListeners();
        }
    }

    // Public API
    return {
        state: state,
        loadEvents: loadEvents,
        renderCards: renderCards,
        applyFilter: applyFilter,
        filterCards: applyFilter,        // Backwards compatibility alias
        filterTable: filterTable,        // Backwards compatibility alias
        initUpcomingEvents: initUpcomingEvents, // Backwards compatibility alias
        initEventsPage: initEventsPage,
        resetSearch: resetSearch,
        onSearchInput: onSearchInput,
        onLanguageSwitch: onLanguageSwitch,
        normalizeText: normalizeText,
        matchesQuery: matchesQuery,
        debounce: debounce
    };
}));

// Expose legacy global function names for existing scripts / inline calls
function filterCards() {
    if (window.EventManager) {
        window.EventManager.applyFilter();
    }
}

function filterTable() {
    if (window.EventManager) {
        window.EventManager.filterTable();
    }
}

function initUpcomingEvents() {
    if (window.EventManager) {
        window.EventManager.initUpcomingEvents();
    }
}

function loadEventsData() {
    if (window.EventManager) {
        return window.EventManager.initEventsPage();
    }
}
