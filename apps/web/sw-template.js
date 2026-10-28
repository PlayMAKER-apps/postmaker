const CACHE = '__CACHE_VERSION__';
const APP_SHELL = __APP_SHELL__;
const shellUrl = path => new URL(path, self.registration.scope).href;
const SHELL_BY_PATH = new Map(APP_SHELL.map(path => [new URL(path, self.registration.scope).pathname, path]));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL.map(shellUrl))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('postmaker-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(shellUrl('index.html'))));
    return;
  }
  const shellPath = SHELL_BY_PATH.get(requestUrl.pathname);
  if (!shellPath) return;
  event.respondWith(caches.match(shellUrl(shellPath)).then(cached => cached || fetch(request)));
});
