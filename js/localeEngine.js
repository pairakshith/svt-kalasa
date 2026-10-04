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

        var transIdNodes = rootEl.querySelectorAll('[data-trans-id]');
        for (var i = 0; i < transIdNodes.length; i++) {
            var node = transIdNodes[i];
            var key = node.getAttribute('data-trans-id');
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

        var transNodes = rootEl.querySelectorAll('[data-trans-type="transliterate"]');
        for (var j = 0; j < transNodes.length; j++) {
            var tNode = transNodes[j];
            var script = tNode.getAttribute('data-source-script') || 'kannada';

            if (!tNode.hasAttribute('data-trans-fallback')) {
                tNode.setAttribute('data-trans-fallback', tNode.innerHTML);
            }
            var originalVerse = tNode.getAttribute('data-trans-fallback');

            if (currentLang === 'kn') {
                tNode.innerHTML = originalVerse;
            } else {
                var lines = originalVerse.split('<br>');
                var convertedLines = lines.map(function(line) {
                    return transliterateText(line, script, 'en');
                });
                tNode.innerHTML = convertedLines.join('<br>');
            }
        }

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

    function triggerReRender() {
        updateHtmlAttributes();
        updateDomElements(document.body);

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

    function parseDirectives(markdown) {
        if (!markdown || typeof markdown !== 'string') return '';

        var parsed = markdown;

        parsed = parsed.replace(
            /:::translate(?:\{id="([^"]+)"\}|\{id='([^']+)'\})?\s*([\s\S]*?):::/g,
            function (match, id1, id2, content) {
                var id = id1 || id2 || '';
                var inner = content.trim();
                return '<div data-trans-type="translate" data-trans-id="' + id + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        parsed = parsed.replace(
            /:translate\[([^\]]+)\](?:\{id="([^"]+)"\}|\{id='([^']+)'\})/g,
            function (match, text, id1, id2) {
                var id = id1 || id2 || '';
                return '<span data-trans-type="translate" data-trans-id="' + id + '" data-trans-fallback="' + text.replace(/"/g, '&quot;') + '">' + text + '</span>';
            }
        );

        parsed = parsed.replace(
            /:::transliterate(?:\{sourceScript="([^"]+)"\}|\{sourceScript='([^']+)'\})?\s*([\s\S]*?):::/g,
            function (match, s1, s2, content) {
                var script = s1 || s2 || 'kannada';
                var inner = content.trim().replace(/\n/g, '<br>');
                return '<div data-trans-type="transliterate" data-source-script="' + script + '" data-trans-fallback="' + inner.replace(/"/g, '&quot;') + '">' + inner + '</div>';
            }
        );

        parsed = parsed.replace(
            /:transliterate\[([^\]]+)\](?:\{sourceScript="([^"]+)"\}|\{sourceScript='([^']+)'\})/g,
            function (match, text, s1, s2) {
                var script = s1 || s2 || 'kannada';
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
                    '<span class="temple-om">ॐ</span>' +
                    '<span class="lang-brand-text" data-trans-id="header.temple_title">ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ</span>' +
                '</div>' +
                '<div class="lang-control">' +
                    '<label for="languageSelect" class="lang-label">' +
                        '<span class="lang-label-text">ಭಾಷೆ / Language:</span>' +
                    '</label>' +
                    '<select id="languageSelect" class="lang-selector-select" aria-label="Select Language">' +
                        '<option value="kn"' + (currentLang === 'kn' ? ' selected' : '') + '>ಕನ್ನಡ (Kannada)</option>' +
                        '<option value="en"' + (currentLang === 'en' ? ' selected' : '') + '>English (IAST)</option>' +
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
            loadDictionary().then(function () {
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
        onLanguageChange: onLanguageChange,
        loadDictionary: loadDictionary
    };
}));