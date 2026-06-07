const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `${CACHE_VERSION}-static`,
  DYNAMIC: `${CACHE_VERSION}-dynamic`,
  IMAGES: `${CACHE_VERSION}-images`,
  API: `${CACHE_VERSION}-api`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/haris-logo.png',
  '/offline.html',
];

const API_CACHE_PATTERNS = [
  /^https:\/\/api\..*\/v1\//,
  /^https:\/\/api\.landlords\.com\//,
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache all static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== CACHE_NAMES.STATIC &&
              cacheName !== CACHE_NAMES.DYNAMIC &&
              cacheName !== CACHE_NAMES.IMAGES &&
              cacheName !== CACHE_NAMES.API
            );
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except API)
  if (url.origin !== self.location.origin && !isAPIRequest(url)) {
    return;
  }

  // Route to appropriate caching strategy
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.IMAGES));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstAPI(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.STATIC));
  } else {
    event.respondWith(networkFirst(request, CACHE_NAMES.DYNAMIC));
  }
});

// Background sync for messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAMES.DYNAMIC);
    caches.delete(CACHE_NAMES.API);
  }
});

// ============ Caching Strategies ============

async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) {
      const cached = await caches.match(request);
      return cached || new Response('Offline', { status: 503 });
    }

    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(async (response) => {
    if (!response || response.status !== 200) {
      return response;
    }

    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        error: 'Offline. Please check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============ Helpers ============

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url.pathname);
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.toString()));
}

function isStaticAsset(url) {
  return (
    /\.(js|css|woff|woff2|ttf|eot)(\?.*)?$/i.test(url.pathname) ||
    url.pathname === '/' ||
    url.pathname === '/manifest.json'
  );
}

async function syncMessages() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('/messages') && request.method === 'POST') {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.delete(request);
          }
        } catch (error) {
          console.warn('Failed to sync message:', error);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
