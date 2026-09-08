document.addEventListener('DOMContentLoaded', () => {
    // Inject Modal & Floating Button HTML into body dynamically
    const feedbackHTML = `
        <button id="openFeedbackBtn" class="feedback-float-btn" aria-label="Feedback">
            💬 <span>ಅಭಿಪ್ರಾಯ</span>
        </button>

        <div id="feedbackModal" class="feedback-modal-overlay">
            <div class="feedback-modal">
                <div class="feedback-modal-header">
                    <h3>ನಿಮ್ಮ ಅನಿಸಿಕೆ / ಸಲಹೆಗಳು</h3>
                    <button id="closeFeedbackBtn" class="feedback-close-btn">&times;</button>
                </div>
                
                <div class="feedback-info-box">
                    💡 <strong>ಸಲಹೆ ಅಥವಾ ನೇರ ಸಂಪರ್ಕಕ್ಕಾಗಿ:</strong>
                    <div>ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ <strong>8888888888</strong> ಮೂಲಕ ನಮಗೆ ತಿಳಿಸಿ.</div>
                    <a href="https://wa.me/918888888888?text=%E0%B2%A8%E0%B2%AE%E0%B2%B8%E0%B3%8D%E0%B2%A5%E0%B3%87%20%E0%B2%A8%E0%B2%A8%E0%B3%8D%E0%B2%A8%20%E0%B2%85%E0%B2%AD%E0%B2%BF%E0%B2%AA%E0%B3%8D%E0%B2%B0%E0%B2%BE%E0%B2%AF:" target="_blank" class="whatsapp-link">
                        📲 WhatsApp ಮೂಲಕ ನೇರ ಸಂದೇಶ ಕಳುಹಿಸಿ
                    </a>
                </div>

                <form id="feedbackForm">
                    <textarea 
                        class="feedback-textarea" 
                        placeholder="ಇಲ್ಲಿ ನಿಮ್ಮ ಸಲಹೆ ಅಥವಾ ಅನಿಸಿಕೆಯನ್ನು ಬರೆಯಿರಿ..." 
                        required></textarea>
                    <button type="submit" class="feedback-submit-btn">ಕಳುಹಿಸಿ (Send)</button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', feedbackHTML);

    const openBtn = document.getElementById('openFeedbackBtn');
    const closeBtn = document.getElementById('closeFeedbackBtn');
    const modal = document.getElementById('feedbackModal');
    const form = document.getElementById('feedbackForm');

    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Close when clicking outside content area
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Form submit action
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಅನಿಸಿಕೆ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.');
        form.reset();
        modal.classList.remove('active');
    });
});