const CACHE_PREFIX = 'clinical-letter-generators-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_SHELL = [
    '/',
    '/index.html',
    '/site.webmanifest',
    '/favicon.ico',
    '/css/fonts.css',
    '/css/style.css',
    '/js/common.js',
    '/js/offline.js',
    '/media/favicon/android-chrome-192x192.png',
    '/media/favicon/android-chrome-512x512.png',
    '/media/favicon/apple-touch-icon.png',
    '/media/favicon/favicon-16x16.png',
    '/media/favicon/favicon-32x32.png',
    '/media/logo/logo.png',
    '/vendor/fonts/NotoSans-Bold.ttf',
    '/vendor/fonts/NotoSans-Regular.ttf',
    '/vendor/fonts/NotoSansThai-Bold.ttf',
    '/vendor/fonts/NotoSansThai-Regular.ttf',
    '/vendor/pdfmake/pdfmake.min.js',
    '/shared/pdf-generator.js',
    '/shared/pdf-templates.js',
    '/shared/print-header-footer.css',
    '/shared/print-header-footer.js',
    '/referral/',
    '/referral/index.html',
    '/referral/print-letter.html',
    '/referral/referral-data.js',
    '/referral/script.js',
    '/certificate-medication-letter/',
    '/certificate-medication-letter/index.html',
    '/certificate-medication-letter/print-certificate.html',
    '/certificate-medication-letter/certificate-script.js',
    '/medical-certificate/',
    '/medical-certificate/index.html',
    '/medical-certificate/print-medical-certificate.html',
    '/medical-certificate/medical-certificate-script.js',
    '/free-form-letter/',
    '/free-form-letter/index.html',
    '/free-form-letter/print-letter.html',
    '/free-form-letter/script.js'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(APP_SHELL);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(cacheNames
                    .filter(function (cacheName) {
                        return cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME;
                    })
                    .map(function (cacheName) {
                        return caches.delete(cacheName);
                    }));
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

function cachedResponse(request) {
    return caches.match(request, { ignoreSearch: true });
}

function fetchAndCache(request) {
    return fetch(request).then(function (response) {
        if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(request, copy);
            });
        }
        return response;
    });
}

self.addEventListener('fetch', function (event) {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetchAndCache(request).catch(function () {
                return cachedResponse(request).then(function (response) {
                    return response || caches.match('/index.html');
                });
            })
        );
        return;
    }

    event.respondWith(
        cachedResponse(request).then(function (response) {
            return response || fetchAndCache(request);
        })
    );
});
