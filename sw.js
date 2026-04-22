const CACHE_NAME = 'allianz-quiz-v6';
const ASSETS_TO_CACHE = [
    'index.html',
    'dashboard.html',
    'admin.html',
    'quiz.html',
    'result.html',
    'leaderboard.html',
    'assets/css/style.css',
    'assets/js/logic.js',
    'assets/js/script.js',
    'assets/js/admin.js',
    'assets/js/quiz.js',
    'assets/js/leaderboard.js',
    'assets/js/calculator.js',
    'assets/js/firebase-config.js',
    'assets/js/firebase-auth.js',
    'assets/js/firebase-db.js',
    'assets/js/ui-helpers.js',
    'assets/js/nav-handler.js',
    'assets/img/app_icon_512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching shell assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network First Strategy
// Always try to fetch from network first, fall back to cache if offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
