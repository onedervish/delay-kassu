/* db.js — слой доступа к IndexedDB. Без модулей: работает по file://. */
(function (global) {
  'use strict';

  var DB_NAME = 'courier-earnings';
  var DB_VERSION = 1;
  var STORE_SHIFTS = 'shifts';
  var STORE_SETTINGS = 'settings';
  var SETTINGS_KEY = 'main';

  // Плашки для выбора цвета службы. Первые пять — цвета служб по умолчанию.
  var PALETTE = ['#2BD46F', '#FF5A5A', '#3D8BFF', '#8DC63F', '#FFCC00',
                 '#24E0CE', '#B06BFF', '#FF8A3D'];

  /* ЦВЕТА СЛУЖБ — ОДНО МЕСТО НА ВСЁ ПРИЛОЖЕНИЕ.
     Отсюда берут: список служб по умолчанию, подстановка цвета по названию
     и разовое дополнение списка Самокатом.
     Два набора: обычный и затемнённый для Мяты — на почти белом экране
     яркие брендовые цвета не читаются. */
  var SERVICE_COLORS = [
    { name: 'Купер',    color: '#58D63C', light: '#2E8C1C' },
    { name: 'Магнит',   color: '#FF4D6A', light: '#C2123A' },
    { name: 'Ozon',     color: '#2E6BFF', light: '#0A46D6' },
    { name: 'ВкусВилл', color: '#63C860', light: '#2C7A34' },
    { name: 'Яндекс',   color: '#FFCC33', light: '#A8720A' },
    { name: 'Самокат',  color: '#FF5C8A', light: '#C41E57' }
  ];

  /* Схемы, на которых службы берут затемнённый набор. */
  var LIGHT_THEMES = ['myata'];

  /* Цвета служб до этапа 19. Нужны ровно для одного: понять задним числом,
     красил ли человек службу руками. Совпал цвет со старым значением по
     умолчанию — значит не трогал. Больше нигде не используются. */
  var LEGACY_COLORS = {
    'купер': '#2BD46F',
    'магнит': '#FF5A5A',
    'ozon': '#3D8BFF',
    'вкусвилл': '#8DC63F',
    'яндекс': '#FFCC00',
    'самокат': '#FF3D8B'
  };

  /** Цвет готовой службы по названию и схеме; регистр не важен. */
  function serviceColorOf(name, theme) {
    var key = String(name).toLowerCase();
    var light = LIGHT_THEMES.indexOf(theme) !== -1;
    for (var i = 0; i < SERVICE_COLORS.length; i++) {
      if (SERVICE_COLORS[i].name.toLowerCase() === key) {
        return light ? SERVICE_COLORS[i].light : SERVICE_COLORS[i].color;
      }
    }
    return null;
  }

  /** Список служб по умолчанию — копия таблицы, чтобы её нельзя было испортить. */
  function defaultServices() {
    return SERVICE_COLORS.map(function (s) {
      return { name: s.name, color: s.color, custom: false };
    });
  }

  var DEFAULT_SETTINGS = {
    id: SETTINGS_KEY,
    services: defaultServices(),
    samokatAdded: true,   // см. migrateSettings: разовое дополнение списка
    theme: 'glubina',     // схема оформления; по умолчанию тёмная «Глубина»
    fuelPerKm: 0,
    currency: '₽',
    hideSums: true,
    // Для напоминания о резервной копии
    lastExportAt: null,   // когда выгружали в последний раз
    shiftsAtExport: 0,    // сколько смен было в базе на тот момент
    remindAfter: null     // до какой даты напоминание отложено кнопкой «Потом»
  };

  /** Свободный цвет из палитры; повторы только когда палитра кончилась. */
  function nextColor(services) {
    var used = (services || []).map(function (s) {
      return String(s && s.color).toLowerCase();
    });
    for (var i = 0; i < PALETTE.length; i++) {
      if (used.indexOf(PALETTE[i].toLowerCase()) === -1) return PALETTE[i];
    }
    return PALETTE[(services || []).length % PALETTE.length];
  }

  /**
   * Настройки из старых версий: службы были списком строк, цвета не было.
   * Переводим в новый вид при чтении — версию базы не трогаем, там смены.
   */
  function migrateSettings(found) {
    var changed = false;
    var services = [];

    (found.services || []).forEach(function (entry) {
      if (entry && typeof entry === 'object' && entry.name) {
        if (!entry.color) {
          entry.color = serviceColorOf(entry.name) || nextColor(services);
          changed = true;
        }
        services.push(entry);
        return;
      }
      var name = String(entry);
      services.push({
        name: name,
        color: serviceColorOf(name) || nextColor(services)
      });
      changed = true;
    });

    found.services = services;

    /* Самокат появился на этапе 17. У тех, кто уже пользуется приложением,
       список служб лежит в базе телефона, а не в коде, поэтому добавляем его
       один раз и сразу запоминаем, что добавили: скрытый или удалённый Самокат
       не должен возвращаться при каждом запуске. */
    if (found.samokatAdded !== true) {
      found.samokatAdded = true;
      changed = true;
      var hasSamokat = services.some(function (s) {
        return String(s.name).toLowerCase() === 'самокат';
      });
      if (!hasSamokat) {
        services.push({ name: 'Самокат', color: serviceColorOf('Самокат'), custom: false });
      }
    }

    /* Признак ручной покраски появился на этапе 19. У тех, кто уже пользуется
       приложением, его нет, и догадаться можно только так: сравнить цвет
       в базе со старым значением по умолчанию для этой службы. Совпал —
       человек не трогал, цвет будет меняться вместе со схемой. Не совпал
       или службы нет в таблице — это его выбор, схема на него не влияет. */
    services.forEach(function (entry) {
      if (typeof entry.custom === 'boolean') return;
      var was = LEGACY_COLORS[String(entry.name).toLowerCase()];
      entry.custom = !(was && String(entry.color).toLowerCase() === was.toLowerCase());
      changed = true;
    });

    if (typeof found.theme !== 'string') {
      found.theme = 'glubina';
      changed = true;
    }

    if (typeof found.hideSums !== 'boolean') {
      found.hideSums = true;
      changed = true;
    }

    ['lastExportAt', 'remindAfter'].forEach(function (key) {
      if (!(key in found)) { found[key] = null; changed = true; }
    });
    if (typeof found.shiftsAtExport !== 'number') {
      found.shiftsAtExport = 0;
      changed = true;
    }

    return changed;
  }

  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error('IndexedDB недоступна в этом браузере'));
        return;
      }

      var req;
      try {
        req = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        reject(e);
        return;
      }

      req.onupgradeneeded = function (event) {
        var db = req.result;

        if (!db.objectStoreNames.contains(STORE_SHIFTS)) {
          var shifts = db.createObjectStore(STORE_SHIFTS, {
            keyPath: 'id',
            autoIncrement: true
          });
          shifts.createIndex('date', 'date', { unique: false });
          shifts.createIndex('service', 'service', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
          // Настройки по умолчанию пишем в той же транзакции апгрейда.
          event.target.transaction
            .objectStore(STORE_SETTINGS)
            .put(clone(DEFAULT_SETTINGS));
        }
      };

      req.onsuccess = function () {
        var db = req.result;
        db.onversionchange = function () { db.close(); };
        resolve(db);
      };

      req.onerror = function () {
        reject(req.error || new Error('Не удалось открыть базу'));
      };

      req.onblocked = function () {
        reject(new Error('База заблокирована другой вкладкой'));
      };
    });

    return dbPromise;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function tx(storeName, mode) {
    return open().then(function (db) {
      return db.transaction(storeName, mode).objectStore(storeName);
    });
  }

  function request(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  /* --- Смены --- */

  var lastStamp = 0;

  /**
   * Метка создания должна быть уникальной: по ней отличаются дубли при
   * импорте. Две записи, созданные в одну миллисекунду, получали одинаковую
   * метку и считались одной и той же сменой.
   */
  function nextStamp() {
    var now = Date.now();
    lastStamp = (now > lastStamp) ? now : lastStamp + 1;
    return lastStamp;
  }

  /**
   * Новая смена получает свежий createdAt, импортированная сохраняет свой —
   * по нему потом отличаются дубли. Чужой id не переносим, его выдаёт база.
   */
  function addShift(shift) {
    var record = clone(shift);
    delete record.id;
    if (!record.createdAt) record.createdAt = nextStamp();
    return tx(STORE_SHIFTS, 'readwrite').then(function (store) {
      return request(store.add(record));
    });
  }

  function getShift(id) {
    return tx(STORE_SHIFTS, 'readonly').then(function (store) {
      return request(store.get(Number(id)));
    });
  }

  /** Правка существующей смены. Дата создания сохраняется, пишем время правки. */
  function updateShift(shift) {
    if (!shift || shift.id === undefined || shift.id === null) {
      return Promise.reject(new Error('Нет id смены'));
    }
    var record = clone(shift);
    record.id = Number(record.id);

    return tx(STORE_SHIFTS, 'readwrite').then(function (store) {
      return request(store.get(record.id)).then(function (existing) {
        if (!existing) throw new Error('Смена не найдена');
        record.createdAt = existing.createdAt;
        record.updatedAt = Date.now();
        return request(store.put(record));
      });
    });
  }

  /** Полная очистка смен — нужна для загрузки копии с заменой. */
  function clearShifts() {
    return tx(STORE_SHIFTS, 'readwrite').then(function (store) {
      return request(store.clear());
    });
  }

  function deleteShift(id) {
    return tx(STORE_SHIFTS, 'readwrite').then(function (store) {
      return request(store.delete(Number(id)));
    });
  }

  /**
   * Последние смены: по убыванию даты, внутри одной даты — сначала свежие.
   * Идём обратным курсором по индексу date.
   */
  function listShifts(limit) {
    var max = limit || 30;
    return tx(STORE_SHIFTS, 'readonly').then(function (store) {
      return new Promise(function (resolve, reject) {
        var out = [];
        var req = store.index('date').openCursor(null, 'prev');
        req.onsuccess = function () {
          var cursor = req.result;
          if (!cursor || out.length >= max) {
            resolve(out);
            return;
          }
          out.push(cursor.value);
          cursor.continue();
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  /** Последняя добавленная смена — нужна, чтобы подставить службу по умолчанию. */
  function getLastShift() {
    return tx(STORE_SHIFTS, 'readonly').then(function (store) {
      return new Promise(function (resolve, reject) {
        var req = store.openCursor(null, 'prev');
        req.onsuccess = function () {
          var cursor = req.result;
          resolve(cursor ? cursor.value : null);
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  /* --- Настройки --- */

  function getSettings() {
    return tx(STORE_SETTINGS, 'readonly')
      .then(function (store) { return request(store.get(SETTINGS_KEY)); })
      .then(function (found) {
        if (!found) return clone(DEFAULT_SETTINGS);

        // Подстраховка на случай неполной записи.
        if (!found.services || !found.services.length) {
          found.services = clone(DEFAULT_SETTINGS.services);
        }
        if (!found.currency) found.currency = DEFAULT_SETTINGS.currency;

        // Старый формат приводим к новому и сразу записываем обратно.
        if (migrateSettings(found)) return saveSettings(found).then(function () { return found; });
        return found;
      });
  }

  function saveSettings(settings) {
    var record = clone(settings);
    record.id = SETTINGS_KEY;
    return tx(STORE_SETTINGS, 'readwrite').then(function (store) {
      return request(store.put(record));
    });
  }

  global.DB = {
    open: open,
    addShift: addShift,
    getShift: getShift,
    updateShift: updateShift,
    deleteShift: deleteShift,
    clearShifts: clearShifts,
    listShifts: listShifts,
    getLastShift: getLastShift,
    getSettings: getSettings,
    saveSettings: saveSettings,
    nextColor: nextColor,
    PALETTE: PALETTE,
    SERVICE_COLORS: SERVICE_COLORS,
    serviceColorOf: serviceColorOf,
    LIGHT_THEMES: LIGHT_THEMES,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})(window);
