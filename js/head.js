// js/head.js
(function initHead() {
    const head = document.head;

    // Set page title dynamically (or default if omitted)
    if (!document.title) {
        document.title = "ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ";
    }

    // Insert Meta Tags
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    head.prepend(metaCharset);

    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1.0';
    head.appendChild(metaViewport);

    // Insert Google Fonts Preconnect
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    head.appendChild(preconnect2);

    // Load Google Fonts (Noto Sans Kannada & Noto Serif Kannada)
    const fontCSS = document.createElement('link');
    fontCSS.rel = 'stylesheet';
    fontCSS.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@300;400;600;700&family=Noto+Serif+Kannada:wght@400;700&display=swap';
    head.appendChild(fontCSS);

    // Load Master CSS File
    const masterCSS = document.createElement('link');
    masterCSS.rel = 'stylesheet';
    masterCSS.href = '../css/svt-main.css';
    head.appendChild(masterCSS);

    // Load Markdown Parser (Marked.js)
    const markedJS = document.createElement('script');
    markedJS.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    head.appendChild(markedJS);
})();