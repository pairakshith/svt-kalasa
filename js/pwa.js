/**
 * PWA Service Worker Registration & Offline/Update UI Engine
 * Works seamlessly on root domain svtkalasa.org and subdirectories.
 */

(function () {
    'use strict';

    if (!('serviceWorker' in navigator)) {
        return;
    }

    // Determine correct sw.js path regardless of whether page is at root or inside /pages/
    const isPagesSubdir = window.location.pathname.includes('/pages/');
    const swPath = isPagesSubdir ? '../sw.js' : './sw.js';
    const swScope = isPagesSubdir ? '../' : './';

    window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath, { scope: swScope })
            .then((registration) => {
                // Check if an update was found
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version is available and ready
                            showUpdatePrompt(newWorker);
                        }
                    });
                });
            })
            .catch((error) => {
                console.warn('[PWA] Service Worker registration failed:', error);
            });

        // Listen for controllerchange so the page automatically reloads when updated
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    });

    /**
     * UI Toast / Banner when a new app version is ready
     */
    function showUpdatePrompt(worker) {
        if (document.getElementById('pwa-update-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'pwa-update-toast';
        toast.className = 'pwa-toast pwa-toast--update';
        toast.innerHTML = `
            <div class="pwa-toast__content">
                <span class="pwa-toast__icon">✨</span>
                <span class="pwa-toast__text">ಹೊಸ ಆವೃತ್ತಿ ಲಭ್ಯವಿದೆ (Update available)</span>
            </div>
            <div class="pwa-toast__actions">
                <button type="button" class="pwa-toast__btn pwa-toast__btn--refresh" id="pwa-update-btn">ರೀಫ್ರೆಶ್ (Refresh)</button>
                <button type="button" class="pwa-toast__btn pwa-toast__btn--close" id="pwa-close-btn" aria-label="Close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Refresh action
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            toast.remove();
        });

        // Close action
        document.getElementById('pwa-close-btn').addEventListener('click', () => {
            toast.remove();
        });
    }

    /**
     * Offline status indicator banner (appears when network disconnects)
     */
    function setupOfflineBanner() {
        const offlineToast = document.createElement('div');
        offlineToast.id = 'pwa-offline-toast';
        offlineToast.className = 'pwa-toast pwa-toast--offline';
        offlineToast.style.display = 'none';
        offlineToast.innerHTML = `
            <div class="pwa-toast__content">
                <span class="pwa-toast__icon">📡</span>
                <span class="pwa-toast__text">ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ - ಸಂಗ್ರಹಿಸಿದ ಪುಟಗಳನ್ನು ಓದಬಹುದು (Offline mode)</span>
            </div>
        `;
        document.body.appendChild(offlineToast);

        function updateOnlineStatus() {
            if (navigator.onLine) {
                offlineToast.style.display = 'none';
            } else {
                offlineToast.style.display = 'flex';
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        if (!navigator.onLine) {
            updateOnlineStatus();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupOfflineBanner);
    } else {
        setupOfflineBanner();
    }
})();
