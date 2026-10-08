/**
 * Service Worker for Fractial PWA
 * Provides offline support with cache-first strategy for static assets
 * Configured for GitHub Pages deployment at /fractial/
 */

const BASE_PATH = '/fractial';
const CACHE_NAME = 'fractial-v1';
const STATIC_ASSETS = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/css/style.css',
  BASE_PATH + '/js/app.js',
  BASE_PATH + '/js/fraction.js',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icons/icon.svg',
  BASE_PATH + '/icons/icon-72.png',
  BASE_PATH + '/icons/icon-96.png',
  BASE_PATH + '/icons/icon-128.png',
  BASE_PATH + '/icons/icon-144.png',
  BASE_PATH + '/icons/icon-152.png',
  BASE_PATH + '/icons/icon-192.png',
  BASE_PATH + '/icons/icon-384.png',
  BASE_PATH + '/icons/icon-512.png',
  // Fonts (preconnect, not cached directly)
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap',
  'https://fonts.gstatic.com/s/vazirmatn/v32/Vazirmatn-Regular.woff2',
  'https://fonts.gstatic.com/s/vazirmatn/v32/Vazirmatn-Medium.woff2',
  'https://fonts.gstatic.com/s/vazirmatn/v32/Vazirmatn-Bold.woff2',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map((url) => {
        return new Request(url, { credentials: 'same-origin' });
      })).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
        // Don't fail install if external resources fail
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (fonts, etc.) - let browser handle them
  if (url.origin !== location.origin) {
    return;
  }

  // Only handle requests under our base path
  if (!url.pathname.startsWith(BASE_PATH)) {
    return;
  }

  // HTML pages - network-first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets (CSS, JS, manifest) - cache-first
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstStrategy(request));
});

// Cache-first strategy: try cache, then network, update cache
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    }).catch(() => {
      // Ignore network errors
    });
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network fetch failed:', error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match(BASE_PATH + '/index.html');
    }
    throw error;
  }
}

// Network-first strategy: try network, then cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return cached index.html for navigation
    if (request.mode === 'navigate') {
      return cache.match(BASE_PATH + '/index.html');
    }
    throw error;
  }
}

// Handle messages from client (e.g., skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});