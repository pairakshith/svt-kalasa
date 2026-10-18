async function loadCommonFooter() {
    const footerContainer = document.getElementById('footerContainer');
    if (!footerContainer) return;

    try {
        // Root ಅಥವಾ Sub-folder (pages/) ಪುಟಗಳಿಗೆ ಸರಿಯಾದ File Path ಹೊಂದಿಸುತ್ತದೆ
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const footerPath = isInPagesFolder ? '../pages/footer.html' : 'pages/footer.html';

        const response = await fetch(footerPath);
        if (response.ok) {
            footerContainer.innerHTML = await response.text();
        } else {
            console.error('Failed to load footer:', response.status);
        }
    } catch (error) {
        console.error('Error fetching footer:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadCommonFooter);

(function () {
    // Skip raw file:// protocol (browsers require http/https to load external scripts)
    if (location.protocol === 'file:') return;

    // Allow testing on localhost / 127.0.0.1
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.allow_local = true;

    // GoatCounter Analytics (Private, no UI widgets)
    if (!document.querySelector('script[data-goatcounter]')) {
        var gcScript = document.createElement('script');
        gcScript.async = true;
        gcScript.src = '//gc.zgo.at/count.js';
        gcScript.setAttribute('data-goatcounter', 'https://svt-kalasa.goatcounter.com/count');
        gcScript.onload = function () {
            if (window.goatcounter && typeof window.goatcounter.count === 'function') {
                window.goatcounter.count();
            }
        };
        document.head.appendChild(gcScript);
    }
})();

