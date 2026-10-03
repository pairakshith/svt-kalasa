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