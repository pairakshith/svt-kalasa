/**
 * Floating Feedback / WhatsApp Button
 */

document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------------------------
    // Configuration
    // ----------------------------------------------------
    const whatsappNumber = "919483183977"; // Replace with your actual WhatsApp number with country code
    const defaultMessage = encodeURIComponent("ನಮಸ್ತೆ, ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ ಜಾಲತಾಣದ ಕುರಿತು ನನ್ನ ಸಲಹೆ/ಅಭಿಪ್ರಾಯ: ");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

    // ----------------------------------------------------
    // Inject Feedback Button
    // ----------------------------------------------------
    if (!document.getElementById("feedbackBtn")) {
        const feedbackBtn = document.createElement("a");
        feedbackBtn.id = "feedbackBtn";
        feedbackBtn.href = whatsappUrl;
        feedbackBtn.target = "_blank";
        feedbackBtn.rel = "noopener noreferrer";
        feedbackBtn.setAttribute("aria-label", "Feedback on WhatsApp");
        feedbackBtn.setAttribute("title", "ಅಭಿಪ್ರಾಯ / ಸಲಹೆ (Feedback)");
        feedbackBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
        `;
        document.body.appendChild(feedbackBtn);
    }
});