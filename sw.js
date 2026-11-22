/**
 * Service Worker for SVT Kalasa (svtkalasa.org)
 * Progressive Web App (PWA) Offline Engine
 * 
 * Caching Strategies:
 * - Cache-First for static assets (CSS, JS, fonts, images, audio, icons)
 * - Network-First with Cache Fallback for HTML pages and dynamic JSON content (data & locales)
 * - Automatic outdated cache cleanup on activation
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `svt-static-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `svt-data-${CACHE_VERSION}`;

// Core Shell Assets to pre-cache on Service Worker installation
const PRECACHE_ASSETS = [
    // Core HTML pages
    '/',
    '/index.html',
    '/pages/traditions.html',
    '/pages/ashtaavadhaana.html',
    '/pages/deevatige_salaam.html',
    '/pages/mangala.html',
    '/pages/events.html',
    '/pages/photos.html',
    '/pages/temple_background.html',
    '/pages/references.html',
    '/pages/footer.html',

    // Stylesheets
    '/css/style.css',
    '/css/header.css',
    '/css/feedback.css',
    '/css/ashta.css',
    '/css/audio.css',
    '/css/back-to-top.css',
    '/css/gallery.css',
    '/css/svt-main.css',
    '/css/tranlate_header.css',

    // Client Scripts
    '/js/main.js',
    '/js/localeEngine.js',
    '/js/header.js',
    '/js/footer-loader.js',
    '/js/back-to-top.js',
    '/js/feedback.js',
    '/js/gallery.js',
    '/js/vendor/sanscript.min.js',

    // Web App Manifest & App Icons
    '/manifest.json',
    '/manifest.webmanifest',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/icons/apple-touch-icon.png',
    '/assets/images/icon_image.jpeg',
    '/assets/images/header_left.jpeg',
    '/assets/images/header_right.jpg',

    // JSON Translation / Content Dictionaries
    '/locales/en.json',
    '/locales/en_ashtaavadhaana.json',
    '/locales/en_deevatige_salam.json',
    '/locales/en_events.json',
    '/locales/en_mangala.json',

    // Content JSON & Data
    '/data/events.json',
    '/data/gallery.json',
    '/data/glossary.json'
];

/**
 * Install Event: Pre-cache core shell assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(async (cache) => {
                // Cache assets with fallback so one 404 does not prevent SW install
                await Promise.all(
                    PRECACHE_ASSETS.map(async (assetUrl) => {
                        try {
                            const response = await fetch(assetUrl, { cache: 'no-cache' });
                            if (response && response.ok) {
                                await cache.put(assetUrl, response);
                            } else {
                                console.warn('[SW] Precache non-OK response for:', assetUrl, response && response.status);
                            }
                        } catch (err) {
                            console.warn('[SW] Precache failed for:', assetUrl, err);
                        }
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate Event: Clean up legacy caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * Message listener for user-triggered skipWaiting
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Helper: Determine if request is an HTML page navigation
 */
function isHtmlRequest(request) {
    return request.mode === 'navigate' ||
           (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

/**
 * Helper: Determine if request is a JSON API or Content document
 */
function isJsonRequest(url) {
    return url.pathname.endsWith('.json') || url.pathname.endsWith('.csv');
}

/**
 * Helper: Determine if request is a Static asset
 */
function isStaticAsset(url) {
    const extRegex = /\.(css|js|woff2?|ttf|otf|eot|svg|png|jpe?g|gif|webp|ico|mp3|pdf)$/i;
    return extRegex.test(url.pathname);
}

/**
 * Helper: Normalize request URL for cache matching (e.g., path without query params if needed)
 */
function normalizeRequestUrl(requestUrl) {
    const url = new URL(requestUrl);
    // Ignore cache-busting timestamp queries for Google Sheet or fresh fetch where applicable
    return url;
}

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') {
        return; // Allow POST / Formspree / external APIs to proceed normally
    }

    const url = new URL(request.url);

    // 1. HTML Pages: Network-First with Cache Fallback
    if (isHtmlRequest(request)) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const copy = networkResponse.clone();
                        caches.open(STATIC_CACHE_NAME).then((cache) => {
                            cache.put(request, copy);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // Cache match exact path
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;

                    // Try matching path without origin or root fallback
                    const urlPath = url.pathname;
                    const altMatch = await caches.match(urlPath) || await caches.match('/index.html');
                    return altMatch;
                })
        );
        return;
    }

    // 2. JSON Data & Locales: Stale-While-Revalidate / Network-First with Cache Fallback
    if (isJsonRequest(url)) {
        // Exclude 3rd-party non-local APIs unless cached
        if (url.origin === self.location.origin) {
            event.respondWith(
                fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.ok) {
                            const copy = networkResponse.clone();
                            caches.open(DATA_CACHE_NAME).then((cache) => {
                                cache.put(request, copy);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(async () => {
                        const cached = await caches.match(request) || await caches.match(url.pathname);
                        if (cached) return cached;
                        return new Response(JSON.stringify({ error: 'offline', offline: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    })
            );
            return;
        }
    }

    // 3. Static Assets (CSS, JS, Fonts, Images, Audio): Cache-First Strategy
    if (isStaticAsset(url) || url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((networkResponse) => {
                    if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
                        const copy = networkResponse.clone();
                        const cacheName = url.origin === self.location.origin ? STATIC_CACHE_NAME : DATA_CACHE_NAME;
                        caches.open(cacheName).then((cache) => {
                            cache.put(request, copy);
                        });
                    }
                    return networkResponse;
                }).catch((fetchErr) => {
                    // Try fallback without query parameters
                    return caches.match(url.pathname);
                });
            })
        );
        return;
    }

    // 4. Default: Network with Cache Fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
