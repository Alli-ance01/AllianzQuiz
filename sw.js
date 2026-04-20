const CACHE_NAME = 'allianz-quiz-v3';
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

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
