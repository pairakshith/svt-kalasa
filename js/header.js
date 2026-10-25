/*
 * temple-name.js
 * Keeps the temple name in the language bar from being blanked by localeEngine.js.
 * The name is the same in both languages, so the engine doesn't need to change it.
 * Load this after localeEngine.js on any page that shows the language bar.
 */
(function () {
    var TEMPLE_NAME = 'ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ';

    function fixName(el) {
        el.removeAttribute('data-trans-id');
        el.removeAttribute('data-trans-fallback');
        el.textContent = TEMPLE_NAME;
    }

    var existing = document.querySelector('.lang-brand-text');
    if (existing) {
        fixName(existing);
        return;
    }

    // The bar is built after the engine starts, so wait for it to appear
    var observer = new MutationObserver(function () {
        var el = document.querySelector('.lang-brand-text');
        if (el) {
            fixName(el);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();