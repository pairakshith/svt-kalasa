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
    function sendHit() {
        if (window.goatcounter && typeof window.goatcounter.count === 'function') {
            window.goatcounter.count();
        } else {
            // Direct transparent pixel fallback for mobile browsers where script execution/CDN might be delayed
            var endpoint = 'https://svt-kalasa.goatcounter.com/count';
            var p = encodeURIComponent(location.pathname + location.search);
            var r = encodeURIComponent(document.referrer || '');
            var t = encodeURIComponent(document.title || '');
            var rnd = Math.random().toString(36).substring(2, 7);
            var url = endpoint + '?p=' + p + '&r=' + r + '&t=' + t + '&rnd=' + rnd;
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                var img = new Image();
                img.src = url;
            }
        }
    }

    if (!document.querySelector('script[data-goatcounter]')) {
        var gcScript = document.createElement('script');
        gcScript.async = true;
        gcScript.src = 'https://gc.zgo.at/count.js';
        gcScript.setAttribute('data-goatcounter', 'https://svt-kalasa.goatcounter.com/count');
        gcScript.onload = sendHit;
        gcScript.onerror = sendHit; // If CDN is blocked by mobile adblock/DNS, fallback sends count directly
        document.head.appendChild(gcScript);
    }
})();

