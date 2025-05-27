const CACHE_NAME = 'user-info-cache-v1'; // اسم ذاكرة التخزين المؤقت
const FILES_TO_CACHE = [
  'https://sszzo.github.io/userinfo/',         // للصفحة الرئيسية
  'index.html',
  'mony.html',
  'info.html',
  'payment.html',
  'make.html',
  'manifest.json',
  // إذا كان لديك ملف CSS:
  // 'https://sszzo.github.io/userinfo/css/style.css',
  // إذا كان لديك ملف JS:
  // 'https://sszzo.github.io/userinfo/js/main.js',
  // إذا كانت أيقونات manifest في مجلد 'img':
  // 'img/192.png',
  // 'img/512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match('https://sszzo.github.io/userinfo/index.html'); // استخدام الرابط الكامل
            });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {

          if (response) {
            return response;
          }


          return fetch(event.request).then(
            function(response) {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // الكائن المستجيب صالح - قم بتخزينه مؤقتًا وإرجاعه.
              var responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
    );
  }
});
