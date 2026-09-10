/**
 * Floating Feedback Modal with Formspree
 */

document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------------------------
    // Configuration
    // Replace 'YOUR_FORMSPREE_FORM_ID' with your actual Formspree ID
    // (Get a free ID at https://formspree.io by adding your email)
    // ----------------------------------------------------
    const formspreeEndpoint = "https://formspree.io/f/xjyvjoww";

    // ----------------------------------------------------
    // 1. Inject Styles for Modal
    // ----------------------------------------------------
    const style = document.createElement("style");
    style.textContent = `
        .feedback-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex; justify-content: center; align-items: center;
            z-index: 10000; opacity: 0; pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .feedback-modal-overlay.active {
            opacity: 1; pointer-events: auto;
        }
        .feedback-modal {
            background: #ffffff;
            padding: 24px;
            border-radius: 12px;
            width: 90%; max-width: 420px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-family: 'Noto Sans Kannada', sans-serif;
            position: relative;
        }
        .feedback-modal h3 {
            margin: 0 0 12px;
            color: #800000;
            font-size: 1.2rem;
        }
        .feedback-modal textarea {
            width: 100%;
            height: 110px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            resize: none;
            font-family: inherit;
            font-size: 0.95rem;
            box-sizing: border-box;
            margin-bottom: 12px;
        }
        .feedback-modal textarea:focus {
            outline: none;
            border-color: #800000;
        }
        .feedback-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .feedback-btn-submit {
            background-color: #800000;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }
        .feedback-btn-cancel {
            background-color: #f1f1f1;
            color: #333;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            cursor: pointer;
        }
        .feedback-status {
            font-size: 0.85rem;
            margin-top: 8px;
        }
    `;
    document.head.appendChild(style);

    // ----------------------------------------------------
    // 2. Inject Modal HTML
    // ----------------------------------------------------
    const modalHTML = `
        <div class="feedback-modal-overlay" id="feedbackModal">
            <div class="feedback-modal">
                <h3>ಮಾಹಿತಿ/ ಅಭಿಪ್ರಾಯ / ಸಲಹೆ (Info / Feedback)</h3>
                <form id="feedbackForm">
                    <textarea id="feedbackText" name="message" placeholder="ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಾದರೂ ಬರೆಯಿರಿ / Write in any language..." required></textarea>
                    <div class="feedback-modal-actions">
                        <button type="button" class="feedback-btn-cancel" id="closeFeedback">ರದ್ದುಮಾಡಿ / Exit</button>
                        <button type="submit" class="feedback-btn-submit" id="submitFeedback">ಸಲ್ಲಿಸಿ / Submit</button>
                    </div>
                    <div id="feedbackStatus" class="feedback-status"></div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // ----------------------------------------------------
    // 3. Inject Trigger Button
    // ----------------------------------------------------
    if (!document.getElementById("feedbackBtn")) {
        const feedbackBtn = document.createElement("button");
        feedbackBtn.id = "feedbackBtn";
        feedbackBtn.type = "button";
        feedbackBtn.setAttribute("aria-label", "Feedback Form");
        feedbackBtn.setAttribute("title", "ಅಭಿಪ್ರಾಯ / ಸಲಹೆ (Feedback)");
        feedbackBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
        `;
        document.body.appendChild(feedbackBtn);

        // Open modal on click
        feedbackBtn.addEventListener("click", () => {
            document.getElementById("feedbackModal").classList.add("active");
        });
    }

    // Modal Close Logic
    const modal = document.getElementById("feedbackModal");
    document.getElementById("closeFeedback").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    function closeModal() {
        modal.classList.remove("active");
        document.getElementById("feedbackStatus").textContent = "";
        document.getElementById("feedbackForm").reset();
    }

    // ----------------------------------------------------
    // 4. Form Submission Handling
    // ----------------------------------------------------
    document.getElementById("feedbackForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const statusDiv = document.getElementById("feedbackStatus");
        const submitBtn = document.getElementById("submitFeedback");
        const message = document.getElementById("feedbackText").value;

        submitBtn.disabled = true;
        statusDiv.style.color = "#666";
        statusDiv.textContent = "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...";

        try {
            const response = await fetch(formspreeEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ message: message })
            });

            if (response.ok) {
                statusDiv.style.color = "green";
                statusDiv.textContent = "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಅಭಿವ್ಯಕ್ತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.";
                setTimeout(closeModal, 2000);
            } else {
                throw new Error("Form submission failed");
            }
        } catch (error) {
            statusDiv.style.color = "red";
            statusDiv.textContent = "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.";
        } finally {
            submitBtn.disabled = false;
        }
    });
});
