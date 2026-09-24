/* sw.js — офлайн-кэш приложения. Меняете файлы — поднимите версию. */

/* Номер версии живёт в одном месте — js/version.js. Отсюда же его читает
   страница, поэтому кэш и надпись в настройках не могут разъехаться.
   Но регистрация воркера не должна срываться из-за вспомогательного файла:
   если он не доехал, берём запасное имя кэша и работаем дальше. */
var CACHE = 'courier-earnings-fallback';

try {
  importScripts('js/version.js');
  if (typeof APP_VERSION !== 'undefined') CACHE = 'courier-earnings-v' + APP_VERSION;
} catch (e) {
  /* остаёмся на запасном имени */
}

var FILES = [
  './',
  './index.html',
  './css/app.css',
  './js/version.js',
  './js/db.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fonts/unbounded-cyrillic.woff2',
  './fonts/unbounded-latin.woff2',
  './fonts/onest-cyrillic.woff2',
  './fonts/onest-latin.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES);
    })
    // skipWaiting здесь нет намеренно: новая версия ждёт кнопки «Обновить».
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        return name === CACHE ? null : caches.delete(name);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Страница просит применить новую версию — только после этого меняем воркер.
self.addEventListener('message', function (event) {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Файлов у приложения всего девять и они меняются только с новой версией,
  // поэтому кэш первый, сеть — запасной вариант.
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      return hit || fetch(event.request);
    })
  );
});

/* Штамп сборки. Браузер считает воркер новым, только если файл sw.js
   отличается от прошлого байт в байт. Номер версии живёт в js/version.js,
   поэтому сам sw.js от этапа к этапу не менялся ни на символ — и полоска
   «Доступно обновление» не появлялась никогда. Штамп это закрывает:
   номер в нём всегда равен APP_VERSION. */
/* build 23 */
