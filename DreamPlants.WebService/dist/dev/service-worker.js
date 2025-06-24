const CACHE_NAME = 'dreamplants-cache-v22';
const OFFLINE_URL = './offline.html';

const STATIC_ASSETS = [
	'./offline.html',
	'./app.js',
	'./vendors.js',
	'./app.css',
	'./vendors.css',
	'./assets/Logo (DarkMode).c12f65c9851e43e5cdac.svg',
	'./assets/hero-banner.d580aca72e86771912d7.webp',
	'./assets/manifest.0f12352f4b062e42c62b.json',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.mode === 'navigate') {
		// Navigation request = page load
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match(OFFLINE_URL);
			})
		);
	}
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k !== CACHE_NAME)
						.map((k) => caches.delete(k))
				)
			)
	);
});
