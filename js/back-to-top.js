/**
 * Floating Navigation Controls
 * Automatically handles Back to Top (Right) & Back to Home (Left)
 */

document.addEventListener("DOMContentLoaded", function () {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = "smooth";

    // --- 1. Create Back to Top Button ---
    const topBtn = document.createElement("button");
    topBtn.id = "backToTopBtn";
    topBtn.setAttribute("type", "button");
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.setAttribute("title", "ಮೇಲಕ್ಕೆ ಹೋಗಿ (Back to Top)");
    topBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 15l-6-6-6 6"/>
        </svg>
    `;
    document.body.appendChild(topBtn);

    // --- 2. Create Home Button (For Inner Pages) ---
    const path = window.location.pathname;
    const isHomePage = path.endsWith("index.html") || path === "/" || path.endsWith("/");

    if (!isHomePage) {
        const homeBtn = document.createElement("a");
        homeBtn.className = "home-btn";
        
        // Auto-detect relative path to index.html
        homeBtn.href = path.includes("/pages/") ? "../index.html" : "index.html";
        homeBtn.setAttribute("title", "ಮುಖ್ಯ ಪುಟ (Home)");
        homeBtn.setAttribute("aria-label", "Go to Home");
        homeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        `;
        document.body.appendChild(homeBtn);
    }

    // --- 3. Toggle Back-to-Top Visibility on Scroll ---
    function checkScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollTop > 50) {
            topBtn.classList.add("show");
        } else {
            topBtn.classList.remove("show");
        }
    }

    window.addEventListener("scroll", checkScroll, { passive: true });
    document.addEventListener("scroll", checkScroll, { passive: true });

    // Smooth scroll trigger
    topBtn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});