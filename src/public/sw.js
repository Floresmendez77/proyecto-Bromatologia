/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * FitMate Service Worker (Offline-First PWA & Smart Sync)
 */

const CACHE_STATIC_NAME = 'fitmate-static-v4';
const CACHE_RUNTIME_NAME = 'fitmate-runtime-v4';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/config.js',
  '/app.js',
  '/modules/FitState.js',
  '/modules/FitComponent.js',
  '/modules/GymRestTimer.js',
  '/modules/firebase.js',
  '/modules/gamification.js',
  '/modules/spotlightCoordinator.js',
  '/modules/apiClient.js',
  '/modules/imageProcessor.js',
  '/modules/nutritionCalc.js',
  '/modules/renderer.js',
  '/modules/routineData.js',
  '/modules/storage.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_RUNTIME_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Global rule: ignore cross-origin requests
  if (new URL(event.request.url).origin !== location.origin) return;

  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache Gemini multimodal API endpoints
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Stale-While-Revalidate for same-origin GET
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        // Global rule: call res.clone() before returning, cache only with res.ok
        if (networkRes && networkRes.ok && request.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_RUNTIME_NAME).then((cache) => {
            cache.put(request, resClone);
          }).catch(() => {});
        }
        return networkRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
