/**
 * Layout Loader Module
 * Dynamically injects the shared <header> and <nav> elements across all pages,
 * setting the .active link based on window.location.pathname.
 */

(function () {
    function getRootPrefix() {
        const path = window.location.pathname.replace(/\\/g, '/');
        return path.includes('/pages/') ? '../' : '';
    }

    function getCurrentPageKey() {
        const path = window.location.pathname.replace(/\\/g, '/');
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return filename.toLowerCase();
    }

    function renderHeaderAndNav() {
        const prefix = getRootPrefix();
        const currentPage = getCurrentPageKey();

        // 1. Injected Header HTML
        const headerHtml = `
        <div class="header-container">
            <!-- Left Header Photo -->
            <img src="${prefix}assets/images/BG_1.jpeg" alt="Left Deity / Temple Photo" class="header-photo header-photo--left">

            <!-- Center Text Content -->
            <div class="header-text-content">
                <h1 class="kn-heading">ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ</h1>
                <div class="subheading-pill">
                    <span class="eng">Amgel Devasthana</span>
                    <span class="dot">•</span>
                    <a href="https://maps.app.goo.gl/RGkNivay814sF8WE7" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       title="ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ನೋಡಿ (View on Google Maps)"
                       class="location-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>ಮೇಲಂಗಡಿ, ಕಳಸ</span>
                    </a>
                </div>
            </div>

            <!-- Right Header Photo -->
            <img src="${prefix}assets/images/icon_image.jpg" alt="Right Deity / Temple Photo" class="header-photo header-photo--right">
        </div>
        `;

        // Navigation links definition
        const navLinks = [
            { href: `${prefix}index.html`, key: 'index.html', title: 'ಮುಖ ಪುಟ' },
            { href: `${prefix}pages/events.html`, key: 'events.html', title: 'ಉತ್ಸವಗಳ ವೇಳಾಪಟ್ಟಿ' },
            { href: `${prefix}pages/deevatige_salaam.html`, key: 'deevatige_salaam.html', title: 'ದೀವಟಿಗೆ ಸಲಾಂ' },
            { href: `${prefix}pages/ashtaavadhaana.html`, key: 'ashtaavadhaana.html', title: 'ಅಷ್ಟಾವಧಾನ' },
            { href: `${prefix}pages/mangala.html`, key: 'mangala.html', title: 'ಮಂಗಳ' },
            { href: `${prefix}pages/traditions.html`, key: 'traditions.html', title: 'ಆಚರಣೆಗಳು' },
            { href: `${prefix}pages/temple_background.html`, key: 'temple_background.html', title: 'ಇತಿಹಾಸ' },
            { href: `${prefix}pages/photos.html`, key: 'photos.html', title: 'ಛಾಯಾಚಿತ್ರಗಳು' },
            { href: `${prefix}pages/references.html`, key: 'references.html', title: 'ಉಲ್ಲೇಖಗಳು' }
        ];

        // 2. Injected Nav HTML
        const navHtml = navLinks.map(link => {
            const isActive = (currentPage === link.key) || (currentPage === '' && link.key === 'index.html');
            const activeClass = isActive ? ' active' : '';
            return `<a href="${link.href}" class="nav-link${activeClass}">${link.title}</a>`;
        }).join('\n        ');

        // Locate or create header
        let headerEl = document.querySelector('header.site-header');
        if (!headerEl) {
            headerEl = document.createElement('header');
            headerEl.className = 'site-header site-header--glass';
            document.body.insertBefore(headerEl, document.body.firstChild);
        } else {
            headerEl.className = 'site-header site-header--glass';
        }
        headerEl.innerHTML = headerHtml;

        // Locate or create nav
        let navEl = document.querySelector('nav.main-nav');
        if (!navEl) {
            navEl = document.createElement('nav');
            navEl.className = 'main-nav';
            headerEl.insertAdjacentElement('afterend', navEl);
        }
        navEl.innerHTML = navHtml;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderHeaderAndNav);
    } else {
        renderHeaderAndNav();
    }
})();
