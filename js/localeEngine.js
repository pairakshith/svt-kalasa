/**
 * localeEngine.js
 * 
 * Client-Side Multilingual Translation & Transliteration Engine for svt-kalasa
 * 
 * Features:
 * 1. Language state management with localStorage persistence (Default: 'kn')
 * 2. Instantaneous DOM re-rendering on language switch without full page reloads
 * 3. Semantic translation (translateText) using locales/en.json with Kannada fallback
 * 4. Sloka/Mantra IAST script transliteration (transliterateText) via Sanscript (kannada -> iast)
 * 5. Full Markdown directive parsing for block (:::) and inline (:) directives:
 *    - :::translate{id="..."} ... :::
 *    - :translate[...]{id="..."}
 *    - :::transliterate{sourceScript="kannada"} ... :::
 *    - :transliterate[...]{sourceScript="kannada"}
 * 6. HTML DOM translation: elements with data-trans-id or data-trans-type
 * 7. LanguageProvider global context / state & sticky navbar Header language dropdown
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LocaleEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var STORAGE_KEY = 'svt_kalasa_lang';
    var DEFAULT_LANG = 'kn'; // Default: ಕನ್ನಡ

    // Current State
    var currentLang = (function () {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            return (stored === 'en' || stored === 'kn') ? stored : DEFAULT_LANG;
        } catch (e) {
            return DEFAULT_LANG;
        }
    })();

    var enDictionary = null;
    var listeners = [];
    var isInitialized = false;

    /**
     * Resolves root-relative path to locales/en.json regardless of whether page is in / or /pages/
     */
    function getLocalesPath() {
        var isPages = window.location.pathname.indexOf('/pages/') !== -1;
        return isPages ? '../locales/en.json' : 'locales/en.json';
    }

    /**
     * Nested key traversal: 'nav.home' -> enDictionary.nav.home
     */
    function getNestedTranslation(dictionary, key) {
        if (!dictionary || !key) return null;
        var parts = key.split('.');
        var cur = dictionary;
        for (var i = 0; i < parts.length; i++) {
            if (cur && typeof cur === 'object' && parts[i] in cur) {
                cur = cur[parts[i]];
            } else {
                return null;
            }
        }
        return typeof cur === 'string' ? cur : null;
    }

    /**
     * Translates a given key id. If key is missing or target is 'kn', falls back to fallbackText.
     */
    function translateText(id, fallbackText, targetLang) {
        var lang = targetLang || currentLang;
        if (lang === 'kn' || !id) {
            return fallbackText;
        }
        if (!enDictionary) {
            return fallbackText;
        }
        var trans = getNestedTranslation(enDictionary, id);
        return (trans !== null && trans !== undefined) ? trans : fallbackText;
    }

    /**
     * Transliterates text from sourceScript (e.g., 'kannada') to IAST (diacritics) using Sanscript.
     * If targetLang is 'kn', returns original text.
     */
    function transliterateText(text, sourceScript, targetLang) {
        if (!text) return '';
        var lang = targetLang || currentLang;
        if (lang === 'kn') {
            return text;
        }
        var script = (sourceScript || 'kannada').toLowerCase();

        // Verify Sanscript engine
        if (typeof window !== 'undefined' && window.Sanscript && typeof window.Sanscript.t === 'function') {
            try {
                return window.Sanscript.t(text, script, 'iast');
            } catch (err) {
                console.warn('[LocaleEngine] Sanscript error:', err);
                return text;
            }
        }
        return text;
    }

    /**
     * Fetches English dictionary asynchronously
     */
    function loadDictionary() {
        if (enDictionary) {
            return Promise.resolve(enDictionary);
        }
        return fetch(getLocalesPath())
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load en.json');
                return res.json();
            })
            .then(function (data) {
                enDictionary = data;
                return enDictionary;
            })
            .catch(function (err) {
                console.warn('[LocaleEngine] en.json load error:', err);
                enDictionary = {};
                return enDictionary;
            });
    }

    /**
     * Updates document metadata (<html lang="...">, translate="no", meta notranslate)
     */
    function updateHtmlAttributes() {
        var html = document.documentElement;
        if (!html) return;

        html.setAttribute('lang', currentLang);
        html.setAttribute('translate', 'no');
        if (!html.classList.contains('notranslate')) {
            html.classList.add('notranslate');
        }

        var head = document.head;
        if (head && !head.querySelector('meta[name="google"][content="notranslate"]')) {
            var meta = document.createElement('meta');
            meta.setAttribute('name', 'google');
            meta.setAttribute('content', 'notranslate');
            head.appendChild(meta);
        }
    }

    /**
     * Updates all DOM elements bearing translation/transliteration attributes:
     * - [data-trans-id]: lookup translation in en.json with fallback to original Kannada
     * - [data-trans-type="translate"]: block/inline semantic translation
     * - [data-trans-type="transliterate"]: block/inline IAST transliteration
     */
    function updateDomElements(container) {
        var rootEl = container || document.body;
        if (!rootEl) return;

        // 1. Elements with data-trans-id
        var transIdNodes = rootEl.querySelectorAll('[data-trans-id]');
        for (var i = 0; i < transIdNodes.length; i++) {
            var node = transIdNodes[i];
            var key = node.getAttribute('data-trans-id');
            // Cache original source text (Kannada)
            if (!node.hasAttribute('data-trans-fallback')) {
                node.setAttribute('data-trans-fallback', node.innerHTML.trim());
            }
            var fallback = node.getAttribute('data-trans-fallback');

            if (currentLang === 'kn') {
                node.innerHTML = fallback;
            } else {
                node.innerHTML = translateText(key, fallback, 'en');
            }
        }

        // 2. Elements with data-trans-type="transliterate"
        var transNodes = rootEl.querySelectorAll('[data-trans-type="transliterate"]');
        for (var j = 0; j < transNodes.length; j++) {
            var tNode = transNodes[j];
            var script = tNode.getAttribute('data-source-script') || 'kannada';

            if (!tNode.hasAttribute('data-trans-fallback')) {
                tNode.setAttribute('data-trans-fallback', tNode.textContent);
            }
            var originalVerse = tNode.getAttribute('data-trans-fallback');

            if (currentLang === 'kn') {
                tNode.textContent = originalVerse;
            } else {
                tNode.textContent = transliterateText(originalVerse, script, 'en');
            }
        }

        // 3. Elements with data-trans-type="translate" without explicit data-trans-id
        var typeTransNodes = rootEl.querySelectorAll('[data-trans-type="translate"]:not([data-trans-id])');
        for (var k = 0; k < typeTransNodes.length; k++) {
            var typeNode = typeTransNodes[k];
            var typeId = typeNode.getAttribute('data-trans-id');
            if (typeId) {
                if (!typeNode.hasAttribute('data-trans-fallback')) {
                    typeNode.setAttribute('data-trans-fallback', typeNode.innerHTML.trim());
                }
                var fb = typeNode.getAttribute('data-trans-fallback');
                typeNode.innerHTML = (currentLang === 'kn') ? fb : translateText(typeId, fb, 'en');
            }
        }

        // 4. Update placeholder attributes for inputs with data-trans-placeholder-id
        var placeholderNodes = rootEl.querySelectorAll('[data-trans-placeholder-id]');
        for (var p = 0; p < placeholderNodes.length; p++) {
            var pNode = placeholderNodes[p];
            var pKey = pNode.getAttribute('data-trans-placeholder-id');
            if (!pNode.hasAttribute('data-trans-placeholder-fallback')) {
                pNode.setAttribute('data-trans-placeholder-fallback', pNode.getAttribute('placeholder') || '');
            }
            var pFallback = pNode.getAttribute('data-trans-placeholder-fallback');
            pNode.setAttribute('placeholder', currentLang === 'kn' ? pFallback : translateText(pKey, pFallback, 'en'));
        }
    }

    /**
     * Synchronizes state with UI elements and triggers all listeners
     */
    function triggerReRender() {
        updateHtmlAttributes();
        updateDomElements(document.body);

        // Update language dropdown selects if any exist
        var selectors = document.querySelectorAll('.lang-selector-select');
        for (var s = 0; s < selectors.length; s++) {
            selectors[s].value = currentLang;
        }

        // Update active class on pill buttons if used
        var buttons = document.querySelectorAll('.lang-btn');
        for (var b = 0; b < buttons.length; b++) {
            if (buttons[b].getAttribute('data-lang') === currentLang) {
                buttons[b].classList.add('active');
            } else {
                buttons[b].classList.remove('active');
            }
        }

        // Notify all registered change listeners
        for (var l = 0; l < listeners.length; l++) {
            try {
                listeners[l](currentLang);
            } catch (err) {
                console.error('[LocaleEngine] Listener callback error:', err);
            }
        }
    }

    /**
     * Switch application language instantaneously without page refresh
     */
    function setLanguage(lang) {
        if (lang !== 'kn' && lang !== 'en') return;
        currentLang = lang;
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}

        if (lang === 'en' && !enDictionary) {
            loadDictionary().then(function () {
                triggerReRender();
            });
        } else {
            triggerReRender();
        }
    }

    function getLanguage() {
        return currentLang;
    }

    function onLanguageChange(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
        }
    }

    /**
     * Parse Remark/Unified Directive syntax in Markdown strings:
     * - Block :::translate{id="..."} ... :::
     * - Inline :translate[...]{id="..."}
     * - Block :::transliterate{sourceScript="kannada"} ... :::
     * - Inline :transliterate[...]{sourceScript="kannada"}
     * 
     * Transforms them into standard HTML elements with:
     * data-trans-type, data-trans-id, and data-source-script attributes.
     */
    function parseDirectives(markdown) {
        if (!markdown || typeof markdown !== 'string') return '';

        var parsed = markdown;

        // 1. Block Level: :::translate{id="about.book_info"} ... :::
        parsed = parsed.replace(
            /:::translate(?:\{id="([^"]+)"\}|\{id='([^']+)'\})?\s*([\s\S]*?):::/g,
            function (match, id1, id2, content) {
                var id = id1 || id2 || '';
                var inner = content.trim();
                return '<div data-trans-type="translate" data-trans-id="' + id + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        // 2. Inline Level: :translate[ಪುಸ್ತಕ ಮತ್ತು ಸ್ಥಳೀಯರ ಮಾಹಿತಿಯ ಮೇರೆಗೆ.]{id="about.book_info"}
        parsed = parsed.replace(
            /:translate\[([^\]]+)\](?:\{id="([^"]+)"\}|\{id='([^']+)'\})/g,
            function (match, text, id1, id2) {
                var id = id1 || id2 || '';
                return '<span data-trans-type="translate" data-trans-id="' + id + '" data-trans-fallback="' + text.replace(/"/g, '&quot;') + '">' + text + '</span>';
            }
        );

        // 3. Block Level: :::transliterate{sourceScript="kannada"} ... :::
        parsed = parsed.replace(
            /:::transliterate(?:\{sourceScript="([^"]+)"\}|\{sourceScript='([^']+)'\})?\s*([\s\S]*?):::/g,
            function (match, s1, s2, content) {
                var script = s1 || s2 || 'kannada';
                var inner = content.trim();
                return '<div data-trans-type="transliterate" data-source-script="' + script + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        // 4. Inline Level: :transliterate[ವೈದೇಹೀಹರಣಂ]{sourceScript="kannada"}
        parsed = parsed.replace(
            /:transliterate\[([^\]]+)\](?:\{sourceScript="([^"]+)"\}|\{sourceScript='([^']+)'\})/g,
            function (match, text, s1, s2) {
                var script = s1 || s2 || 'kannada';
                return '<span data-trans-type="transliterate" data-source-script="' + script + '" data-trans-fallback="' + text.replace(/"/g, '&quot;') + '">' + text + '</span>';
            }
        );

        return parsed;
    }

    /**
     * Markdown preprocessing helper to be used before passing markdown to marked.parse()
     */
    function preprocessMarkdown(markdown) {
        return parseDirectives(markdown);
    }

    /**
     * Renders sticky top navbar language selector component if not already present
     */
    function injectLanguageNavbar() {
        if (document.getElementById('topLanguageNav')) return;

        var nav = document.createElement('div');
        nav.id = 'topLanguageNav';
        nav.className = 'top-language-bar notranslate';
        nav.setAttribute('translate', 'no');

        nav.innerHTML = '' +
            '<div class="lang-bar-container">' +
                '<div class="lang-brand">' +
                    '<span class="temple-om">ॐ</span>' +
                    '<span class="lang-brand-text" data-trans-id="header.temple_title">ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ</span>' +
                '</div>' +
                '<div class="lang-control">' +
                    '<label for="languageSelect" class="lang-label">' +
                        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<line x1="2" y1="12" x2="22" y2="12"></line>' +
                            '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' +
                        '</svg>' +
                        '<span class="lang-label-text">ಭಾಷೆ / Language:</span>' +
                    '</label>' +
                    '<select id="languageSelect" class="lang-selector-select" aria-label="Select Language">' +
                        '<option value="kn"' + (currentLang === 'kn' ? ' selected' : '') + '>ಕನ್ನಡ (Kannada)</option>' +
                        '<option value="en"' + (currentLang === 'en' ? ' selected' : '') + '>English (IAST)</option>' +
                    '</select>' +
                '</div>' +
            '</div>';

        // Prepend to body so it sticks to the absolute top of every page
        if (document.body.firstChild) {
            document.body.insertBefore(nav, document.body.firstChild);
        } else {
            document.body.appendChild(nav);
        }

        var selectEl = document.getElementById('languageSelect');
        if (selectEl) {
            selectEl.addEventListener('change', function (e) {
                setLanguage(e.target.value);
            });
        }
    }

    /**
     * Initializes the locale engine
     */
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        updateHtmlAttributes();
        injectLanguageNavbar();

        // If English is saved preference, load dictionary and update DOM
        if (currentLang === 'en') {
            loadDictionary().then(function () {
                triggerReRender();
            });
        } else {
            triggerReRender();
        }
    }

    // Auto-init on DOMContentLoaded
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    return {
        init: init,
        setLanguage: setLanguage,
        getLanguage: getLanguage,
        translateText: translateText,
        transliterateText: transliterateText,
        parseDirectives: parseDirectives,
        preprocessMarkdown: preprocessMarkdown,
        updateDomElements: updateDomElements,
        onLanguageChange: onLanguageChange,
        loadDictionary: loadDictionary
    };
}));
