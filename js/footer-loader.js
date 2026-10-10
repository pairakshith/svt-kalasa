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
    var host = location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:';
    if (isLocal) return;
    var COUNTER_URL = 'https://script.google.com/macros/s/AKfycbyn-Y5j60oFRbB1k4Dt2M89fUl7WV0F2bip-PY0aH1Og--xc9MaXLWXMEErIfHXzF0q/exec';
    var KEY = 'svt_visit_counted';

    // Count once per browser session, so refreshing doesn't inflate the number
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');

    // no-cors: we only send the hit, and the number is never shown on the page
    fetch(COUNTER_URL + '?page=' + encodeURIComponent(location.pathname), {
        mode: 'no-cors',
        keepalive: true
    }).catch(function () { /* ignore network errors */ });
})();
