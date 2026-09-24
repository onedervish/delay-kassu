/*
 * Проверка sw.js без браузера: node sw.selfcheck.js
 * Не входит в приложение и не попадает в кэш — это только тест.
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var assert = require('assert');

var listeners = {};
var store = {}; // имя кэша -> { url: 'ответ' }

var caches = {
  open: function (name) {
    store[name] = store[name] || {};
    var bucket = store[name];
    return Promise.resolve({
      addAll: function (urls) {
        urls.forEach(function (url) {
          if (!fs.existsSync(url.replace('./', '') || 'index.html')) {
            throw new Error('нет файла: ' + url);
          }
          bucket[url] = 'cached:' + url;
        });
        return Promise.resolve();
      }
    });
  },
  keys: function () { return Promise.resolve(Object.keys(store)); },
  delete: function (name) { delete store[name]; return Promise.resolve(true); },
  match: function (request) {
    var hit = null;
    Object.keys(store).forEach(function (name) {
      if (store[name][request.url]) hit = store[name][request.url];
    });
    return Promise.resolve(hit);
  }
};

var sandbox = {
  // sw.js подтягивает номер версии через importScripts — повторяем это здесь
  importScripts: function (path) {
    vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox);
  },
  caches: caches,
  URL: URL,
  Promise: Promise,
  fetch: function () { return Promise.resolve('from network'); },
  self: {
    location: { origin: 'http://localhost:8777' },
    addEventListener: function (name, fn) { listeners[name] = fn; },
    skipWaiting: function () { sandbox.self.skipWaitingCalls += 1; return Promise.resolve(); },
    skipWaitingCalls: 0,
    clients: { claim: function () { return Promise.resolve(); } }
  }
};
sandbox.self.self = sandbox.self;

vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), sandbox);

/* Номер в js/version.js и штамп в конце sw.js обязаны совпадать.
   Без штампа файл sw.js не меняется между версиями, браузер считает воркер
   прежним и обновление не доходит до людей. */
var versionSource = fs.readFileSync('js/version.js', 'utf8');
var swSource = fs.readFileSync('sw.js', 'utf8');
var appVersion = Number((versionSource.match(/APP_VERSION\s*=\s*(\d+)/) || [])[1]);
var buildStamp = Number((swSource.match(/\/\*\s*build\s+(\d+)\s*\*\/\s*$/) || [])[1]);

assert.ok(appVersion > 0, 'APP_VERSION читается из js/version.js');
assert.ok(buildStamp > 0, 'в конце sw.js должен стоять штамп /* build N */');
assert.strictEqual(buildStamp, appVersion,
  'штамп в sw.js и APP_VERSION должны совпадать');

function event(extra) {
  var waited = [], responded = [];
  return Object.assign({
    waitUntil: function (p) { waited.push(p); return p; },
    respondWith: function (p) { responded.push(p); return p; },
    waited: waited,
    responded: responded
  }, extra);
}

(async function () {
  // install кладёт в кэш все файлы приложения, включая шрифты
  var installEvent = event();
  listeners.install(installEvent);
  await Promise.all(installEvent.waited);
  var cacheName = Object.keys(store)[0];
  assert.strictEqual(Object.keys(store).length, 1, 'должен быть ровно один кэш');
  assert.strictEqual(cacheName, 'courier-earnings-v' + appVersion,
    'имя кэша собирается из общего номера версии');
  assert.strictEqual(Object.keys(store[cacheName]).length, 14, 'в кэше четырнадцать файлов');
  assert.ok(store[cacheName]['./index.html'], 'index.html в кэше');
  assert.ok(store[cacheName]['./js/version.js'], 'version.js в кэше');
  assert.ok(store[cacheName]['./fonts/unbounded-cyrillic.woff2'], 'Unbounded в кэше');
  assert.ok(store[cacheName]['./fonts/onest-cyrillic.woff2'], 'Onest в кэше');
  assert.ok(!JSON.stringify(store).match(/rubik/i), 'Rubik нигде не остался');

  // Новая версия НЕ подменяет старую сама: ждёт кнопки «Обновить»
  assert.strictEqual(sandbox.self.skipWaitingCalls, 0,
    'при установке новая версия не должна применяться сама');

  // Кнопка «Обновить» шлёт сообщение — вот теперь применяем
  listeners.message({ data: 'skip-waiting' });
  assert.strictEqual(sandbox.self.skipWaitingCalls, 1, 'сообщение применяет новую версию');

  listeners.message({ data: 'что-то-другое' });
  assert.strictEqual(sandbox.self.skipWaitingCalls, 1, 'чужие сообщения игнорируются');

  // activate убирает кэш прошлой версии и оставляет текущий
  store['courier-earnings-v0'] = { './old': 'x' };
  var activateEvent = event();
  listeners.activate(activateEvent);
  await Promise.all(activateEvent.waited);
  assert.deepStrictEqual(Object.keys(store), [cacheName], 'старый кэш удалён');

  // запрос своего файла берётся из кэша — это и есть офлайн
  var own = event({ request: { method: 'GET', url: 'http://localhost:8777/index.html' } });
  store[cacheName]['http://localhost:8777/index.html'] = 'cached:index';
  listeners.fetch(own);
  assert.strictEqual(await own.responded[0], 'cached:index', 'отдаём из кэша');

  // чего нет в кэше — идёт в сеть
  var missing = event({ request: { method: 'GET', url: 'http://localhost:8777/nope' } });
  listeners.fetch(missing);
  assert.strictEqual(await missing.responded[0], 'from network', 'запасной путь — сеть');

  // чужой домен и не-GET сервис-воркер не трогает
  var external = event({ request: { method: 'GET', url: 'https://example.com/x' } });
  listeners.fetch(external);
  assert.strictEqual(external.responded.length, 0, 'чужой домен не перехватываем');

  var post = event({ request: { method: 'POST', url: 'http://localhost:8777/index.html' } });
  listeners.fetch(post);
  assert.strictEqual(post.responded.length, 0, 'POST не перехватываем');

  console.log('sw.js: все проверки пройдены, версия ' + appVersion +
    ', штамп build ' + buildStamp);
})();
