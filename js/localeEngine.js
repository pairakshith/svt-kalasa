/**
 * localeEngine.js
 * 
 * Client-Side Multilingual Translation & Transliteration Engine for svt-kalasa
 * 
 * Features:
 * 1. Language state management with localStorage persistence (Default: 'kn')
 * 2. Instantaneous DOM re-rendering on language switch without full page reloads
 * 3. Semantic translation (translateText) using locales/en.json with Kannada fallback
 * 4. Sloka/Mantra ISO 15919 script transliteration (transliterateText)
 * 5. Full Markdown directive parsing for block (:::) and inline (:) directives
 * 6. HTML DOM translation: elements with data-trans-id, data-trans-type, data-trans-attr, or data-trans-placeholder-id
 * 7. LanguageProvider global context / state & sticky navbar Header language dropdown
 * 8. Dynamic container translation API (translateContainer)
 * 9. translateEventData() for event title/tithi/sevadaarara
 * 10. Bilingual search support
 * 11. Language persistence for events
 * 12. Graceful fallback if translation file missing
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
    var DEFAULT_LANG = 'kn';

    var currentLang = (function () {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            return (stored === 'en' || stored === 'kn') ? stored : DEFAULT_LANG;
        } catch (e) {
            return DEFAULT_LANG;
        }
    })();

    var enDictionary = null;
    var eventTranslations = null;  // [NEW] Cache for event translations
    var listeners = [];
    var isInitialized = false;

    function getLocalesPath() {
        var isPages = window.location.pathname.indexOf('/pages/') !== -1;
        return isPages ? '../locales/en.json' : 'locales/en.json';
    }

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
     * Precision Kannada to ISO 15919 Transliteration Engine
     */
    function transliterateText(text, sourceScript, targetLang) {
        if (!text) return '';
        var lang = targetLang || currentLang;
        if (lang === 'kn') {
            return text;
        }

        var consonants = {
            'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ṅ',
            'ಚ': 'c', 'ಛ': 'ch', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ñ',
            'ಟ': 'ṭ', 'ಠ': 'ṭh', 'ಡ': 'ḍ', 'ಢ': 'ḍh', 'ಣ': 'ṇ',
            'ತ': 't', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
            'ಪ': 'p', 'ಫ': 'ph', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
            'ಯ': 'y', 'ರ': 'r', 'ಲ': 'l', 'ವ': 'v', 'ಶ': 'ś',
            'ಷ': 'ṣ', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'ḷ', 'ೞ': 'ḻ'
        };

        var matras = {
            'ಾ': 'ā', 'ಿ': 'i', 'ೀ': 'ī', 'ು': 'u', 'ೂ': 'ū',
            'ೃ': 'r̥', 'ೄ': 'r̥̄', 'ೆ': 'e', 'ೇ': 'ē', 'ೈ': 'ai',
            'ೊ': 'o', 'ೋ': 'ō', 'ೌ': 'au'
        };

        var vowels = {
            'ಅ': 'a', 'ಆ': 'ā', 'ಇ': 'i', 'ಈ': 'ī', 'ಉ': 'u', 'ಊ': 'ū',
            'ಋ': 'r̥', 'ೠ': 'r̥̄', 'ಎ': 'e', 'ಏ': 'ē', 'ಐ': 'ai', 'ಒ': 'o',
            'ಓ': 'ō', 'ಔ': 'au'
        };

        var res = [];
        var i = 0;
        var n = text.length;

        while (i < n) {
            var ch = text[i];
            if (consonants[ch]) {
                var base = consonants[ch];
                if (i + 1 < n && text[i + 1] === '್') {
                    res.push(base);
                    i += 2;
                } else if (i + 1 < n && matras[text[i + 1]]) {
                    res.push(base + matras[text[i + 1]]);
                    i += 2;
                } else {
                    res.push(base + 'a');
                    i += 1;
                }
            } else if (vowels[ch]) {
                res.push(vowels[ch]);
                i += 1;
            } else if (ch === 'ಂ') {
                res.push('ṃ');
                i += 1;
            } else if (ch === 'ಃ') {
                res.push('ḥ');
                i += 1;
            } else {
                res.push(ch);
                i += 1;
            }
        }

        var str = res.join('');

        return str
            .replace(/ṃ(?=[kg]|kh|gh)/g, 'ṅ')
            .replace(/ṃ(?=[cj]|ch|jh)/g, 'ñ')
            .replace(/ṃ(?=[ṭḍ]|ṭh|ḍh)/g, 'ṇ')
            .replace(/ṃ(?=[td]|th|dh)/g, 'n')
            .replace(/ṃ(?=[pb]|ph|bh)/g, 'm');
    }

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

    // [NEW] Load event-specific translations
    function loadEventTranslations() {
        if (eventTranslations) {
            return Promise.resolve(eventTranslations);
        }
        
        var translationsPath = (window.location.pathname.indexOf('/pages/') !== -1) 
            ? '../locales/en_events.json' 
            : '/en_events.json';
        
        return fetch(translationsPath)
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load en_events.json');
                return res.json();
            })
            .then(function (data) {
                eventTranslations = data;
                return eventTranslations;
            })
            .catch(function (err) {
                console.warn('[LocaleEngine] en_events.json not found - using Kannada fallback:', err);
                eventTranslations = {};
                return eventTranslations;
            });
    }

    // [NEW] Get translation for an event field with fallback
    function getEventFieldTranslation(kannada_text, field_type) {
        if (currentLang === 'kn' || !eventTranslations || !kannada_text) {
            return kannada_text;
        }
        
        var cacheKey = field_type + ':' + kannada_text;
        if (eventTranslations[cacheKey]) {
            return eventTranslations[cacheKey];
        }
        
        return kannada_text;
    }

    // [NEW] Translate entire event object
    function translateEventData(event) {
        if (currentLang === 'kn' || !event) {
            return event;
        }
        
        var translated = Object.assign({}, event);
        
        if (translated.title) {
            translated.title = getEventFieldTranslation(translated.title, 'title');
        }
        
        if (translated.tithi) {
            translated.tithi = getEventFieldTranslation(translated.tithi, 'tithi');
        }
        
        if (translated.sevadaarara) {
            translated.sevadaarara = getEventFieldTranslation(translated.sevadaarara, 'sevadaarara');
        }
        
        return translated;
    }

    // [NEW] Re-translate event cards on language switch
    function retranslateEventCards() {
        if (currentLang === 'kn') {
            return;
        }
        
        var cards = document.querySelectorAll('.festival-card');
        for (var c = 0; c < cards.length; c++) {
            var card = cards[c];
            
            var titleEl = card.querySelector('.event-title');
            if (titleEl && titleEl.getAttribute('data-original-kannada')) {
                var originalTitle = titleEl.getAttribute('data-original-kannada');
                titleEl.textContent = getEventFieldTranslation(originalTitle, 'title');
            }
            
            var tithiEl = card.querySelector('.tithi-tag');
            if (tithiEl && tithiEl.getAttribute('data-original-kannada')) {
                var originalTithi = tithiEl.getAttribute('data-original-kannada');
                tithiEl.textContent = getEventFieldTranslation(originalTithi, 'tithi');
            }
            
            var sevadaaraEl = card.querySelector('.sevadaara-info .name');
            if (sevadaaraEl && sevadaaraEl.getAttribute('data-original-kannada')) {
                var originalSevadaara = sevadaaraEl.getAttribute('data-original-kannada');
                sevadaaraEl.textContent = getEventFieldTranslation(originalSevadaara, 'sevadaarara');
            }
        }
    }

    // [NEW] Build searchable text from event (bilingual)
    function getEventSearchableText(event) {
        if (!event) return '';
        
        var parts = [];
        if (event.title) parts.push(event.title);
        if (event.tithi) parts.push(event.tithi);
        if (event.sevadaarara) parts.push(event.sevadaarara);
        if (event.keywords) parts.push(event.keywords);
        if (event.monthYear) parts.push(event.monthYear);
        if (event.day) parts.push(event.day);
        
        return parts.join(' ').toLowerCase();
    }

    // [NEW] Check if event matches search query (bilingual)
    function eventMatchesQuery(event, query) {
        if (!query) return true;
        var searchText = getEventSearchableText(event);
        var queryLower = query.toLowerCase();
        return searchText.includes(queryLower);
    }

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

    function updateDomElements(container) {
        var rootEl = container || document.body;
        if (!rootEl) return;

        // 1. Semantic Translation (data-trans-id)
        var transIdNodes = rootEl.querySelectorAll('[data-trans-id]');
        for (var i = 0; i < transIdNodes.length; i++) {
            var node = transIdNodes[i];
            var key = node.getAttribute('data-trans-id');
            
            if (!node.hasAttribute('data-trans-fallback')) {
                node.setAttribute('data-trans-fallback', node.innerHTML.trim());
            }
            var fallback = node.getAttribute('data-trans-fallback');

            if (node.tagName === 'INPUT' && (node.type === 'button' || node.type === 'submit')) {
                var translatedVal = (currentLang === 'kn') ? fallback : translateText(key, fallback, 'en');
                node.value = translatedVal;
            } else {
                if (currentLang === 'kn') {
                    node.innerHTML = fallback;
                } else {
                    node.innerHTML = translateText(key, fallback, 'en');
                }
            }
        }

        // 2. Transliteration (data-trans-type="transliterate")
        var transNodes = rootEl.querySelectorAll('[data-trans-type="transliterate"]');
        for (var t = 0; t < transNodes.length; t++) {
            var tNode = transNodes[t];
            if (!tNode.hasAttribute('data-trans-fallback')) {
                tNode.setAttribute('data-trans-fallback', tNode.innerHTML.trim());
            }
            var tFallback = tNode.getAttribute('data-trans-fallback');
            var tScript = tNode.getAttribute('data-source-script') || 'kannada';

            if (currentLang === 'kn') {
                tNode.innerHTML = tFallback;
            } else {
                tNode.innerHTML = transliterateText(tFallback, tScript, 'en');
            }
        }

        // 3. Translatable Block (data-trans-type="translate")
        var tBlockNodes = rootEl.querySelectorAll('[data-trans-type="translate"]');
        for (var b = 0; b < tBlockNodes.length; b++) {
            var bNode = tBlockNodes[b];
            var bKey = bNode.getAttribute('data-trans-id');
            if (!bNode.hasAttribute('data-trans-fallback')) {
                bNode.setAttribute('data-trans-fallback', bNode.innerHTML.trim());
            }
            var bFallback = bNode.getAttribute('data-trans-fallback');

            if (currentLang === 'kn') {
                bNode.innerHTML = bFallback;
            } else {
                bNode.innerHTML = translateText(bKey, bFallback, 'en');
            }
        }

        // 4. Placeholder Attributes (data-trans-placeholder-id)
        var pNodes = rootEl.querySelectorAll('[data-trans-placeholder-id]');
        for (var p = 0; p < pNodes.length; p++) {
            var pNode = pNodes[p];
            var pKey = pNode.getAttribute('data-trans-placeholder-id');
            if (!pNode.hasAttribute('data-trans-placeholder-fallback')) {
                pNode.setAttribute('data-trans-placeholder-fallback', pNode.getAttribute('placeholder') || '');
            }
            var pFallback = pNode.getAttribute('data-trans-placeholder-fallback');
            pNode.setAttribute('placeholder', currentLang === 'kn' ? pFallback : translateText(pKey, pFallback, 'en'));
        }

        // 5. Dynamic HTML Attributes (data-trans-attr="attr1:key1,attr2:key2")
        var attrNodes = rootEl.querySelectorAll('[data-trans-attr]');
        for (var a = 0; a < attrNodes.length; a++) {
            var aNode = attrNodes[a];
            var attrConfig = aNode.getAttribute('data-trans-attr');
            if (!attrConfig) continue;

            var pairs = attrConfig.split(',');
            for (var x = 0; x < pairs.length; x++) {
                var pair = pairs[x].split(':');
                if (pair.length === 2) {
                    var attrName = pair[0].trim();
                    var attrKey = pair[1].trim();

                    var fbAttrKey = 'data-trans-' + attrName + '-fallback';
                    if (!aNode.hasAttribute(fbAttrKey)) {
                        aNode.setAttribute(fbAttrKey, aNode.getAttribute(attrName) || '');
                    }
                    var attrFallback = aNode.getAttribute(fbAttrKey);
                    var finalAttrVal = (currentLang === 'kn') ? attrFallback : translateText(attrKey, attrFallback, 'en');
                    aNode.setAttribute(attrName, finalAttrVal);
                }
            }
        }
    }

    function translateContainer(container) {
        if (!container) return;
        updateDomElements(container);
    }

    function triggerReRender() {
        updateHtmlAttributes();
        updateDomElements(document.body);
        retranslateEventCards();  // [NEW] Re-translate event cards

        var selectors = document.querySelectorAll('.lang-selector-select');
        for (var s = 0; s < selectors.length; s++) {
            selectors[s].value = currentLang;
        }

        var buttons = document.querySelectorAll('.lang-btn');
        for (var b = 0; b < buttons.length; b++) {
            if (buttons[b].getAttribute('data-lang') === currentLang) {
                buttons[b].classList.add('active');
            } else {
                buttons[b].classList.remove('active');
            }
        }

        for (var l = 0; l < listeners.length; l++) {
            try {
                listeners[l](currentLang);
            } catch (err) {
                console.error('[LocaleEngine] Listener callback error:', err);
            }
        }
    }

    // [UPDATED] setLanguage function with event translation loading
    function setLanguage(lang) {
        if (lang !== 'kn' && lang !== 'en') return;
        currentLang = lang;
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}

        if (lang === 'en' && !enDictionary) {
            Promise.all([
                loadDictionary(),
                loadEventTranslations()  // [NEW]
            ]).then(function () {
                triggerReRender();
            });
        } else if (lang === 'en' && !eventTranslations) {
            loadEventTranslations().then(function () {  // [NEW]
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

    function parseDirectives(markdown) {
        if (!markdown || typeof markdown !== 'string') return '';

        var parsed = markdown;

        // Block :::translate{...}
        parsed = parsed.replace(
            /:::translate(?:\{[^}]*id=["']([^"']+)["'][^}]*\})?\s*([\s\S]*?):::/g,
            function (match, id, content) {
                var key = id || '';
                var inner = content.trim();
                return '<div data-trans-type="translate" data-trans-id="' + key + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        // Inline :translate[...] {id="..."}
        parsed = parsed.replace(
            /:translate\[([^\]]+)\](?:\{[^}]*id=["']([^"']+)["'][^}]*\})/g,
            function (match, text, id) {
                var key = id || '';
                return '<span data-trans-type="translate" data-trans-id="' + key + '" data-trans-fallback="' + text.replace(/"/g, '&quot;') + '">' + text + '</span>';
            }
        );

        // Block :::transliterate
        parsed = parsed.replace(
            /:::transliterate(?:\{[^}]*sourceScript=["']([^"']+)["'][^}]*\})?\s*([\s\S]*?):::/g,
            function (match, s1, content) {
                var script = s1 || 'kannada';
                var inner = content.trim().replace(/\n/g, '<br>');
                return '<div data-trans-type="transliterate" data-source-script="' + script + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        // Inline :transliterate[...]
        parsed = parsed.replace(
            /:transliterate\[([^\]]+)\](?:\{[^}]*sourceScript=["']([^"']+)["'][^}]*\})/g,
            function (match, text, s1) {
                var script = s1 || 'kannada';
                return '<span data-trans-type="transliterate" data-source-script="' + script + '" data-trans-fallback="' + text.replace(/"/g, '&quot;') + '">' + text + '</span>';
            }
        );

        return parsed;
    }

    function preprocessMarkdown(markdown) {
        return parseDirectives(markdown);
    }

    function injectLanguageNavbar() {
        if (document.getElementById('topLanguageNav')) return;

        var nav = document.createElement('div');
        nav.id = 'topLanguageNav';
        nav.className = 'top-language-bar notranslate';
        nav.setAttribute('translate', 'no');

        nav.innerHTML = '' +
            '<div class="lang-bar-container">' +
                '<div class="lang-brand">' +
                    '<span class="temple-om"></span>' +
                    '<span class="lang-brand-text" data-trans-id="header.temple_title"></span>' +
                '</div>' +
                '<div class="lang-control">' +
                    '<label for="languageSelect" class="lang-label">' +
                        '<span class="lang-label-text">ಭಾಷೆ / Language:</span>' +
                    '</label>' +
                    '<select id="languageSelect" class="lang-selector-select" aria-label="Select Language">' +
                        '<option value="kn"' + (currentLang === 'kn' ? ' selected' : '') + '>ಕನ್ನಡ (Kannada)</option>' +
                        '<option value="en"' + (currentLang === 'en' ? ' selected' : '') + '>English </option>' +
                    '</select>' +
                '</div>' +
            '</div>';

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

    function init() {
        if (isInitialized) return;
        isInitialized = true;

        updateHtmlAttributes();
        injectLanguageNavbar();

        if (currentLang === 'en') {
            Promise.all([
                loadDictionary(),
                loadEventTranslations()  // [NEW]
            ]).then(function () {
                triggerReRender();
            });
        } else {
            triggerReRender();
        }
    }

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
        translateContainer: translateContainer,
        onLanguageChange: onLanguageChange,
        loadDictionary: loadDictionary,
        
        // [NEW] Event data translation API
        translateEventData: translateEventData,
        getEventFieldTranslation: getEventFieldTranslation,
        loadEventTranslations: loadEventTranslations,
        retranslateEventCards: retranslateEventCards,
        getEventSearchableText: getEventSearchableText,
        eventMatchesQuery: eventMatchesQuery
    };
}));