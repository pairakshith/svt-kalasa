/*
 * header.js
 * Sets the temple name in the language bar.
 * Keeps data-trans-id so localeEngine.js can translate it to English.
 * The Kannada name is stored as the fallback, so Kannada mode and any missing key show it.
 */
(function () {
    var TEMPLATE_NAME = 'ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ';

    function fixName(el) {
        // Overwrite the fallback: the engine may already have stored an empty one
        el.setAttribute('data-trans-fallback', TEMPLATE_NAME);
        el.textContent = TEMPLATE_NAME;
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

function fixName(el) {
    // Page already provides bilingual spans (pn-kn / pn-en): don't overwrite them
    if (el.querySelector('.pn-kn, .pn-en')) return;

    el.setAttribute('data-trans-fallback', TEMPLATE_NAME);
    el.textContent = TEMPLATE_NAME;
}
// <span class="temple-om">ॐ</span>