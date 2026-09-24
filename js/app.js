/* app.js — экраны, панель дня, форма, настройки, обмен данными.
   Без модулей: работает по file://. */
(function () {
  'use strict';

  var el = {
    dbError: document.getElementById('db-error'),

    screens: {
      list: document.getElementById('screen-list'),
      form: document.getElementById('screen-form'),
      settings: document.getElementById('screen-settings')
    },

    list: document.getElementById('shift-list'),
    empty: document.getElementById('empty-state'),
    btnAdd: document.getElementById('btn-add'),
    addLabel: document.getElementById('add-label'),
    btnSettings: document.getElementById('btn-settings'),

    dayPanel: document.getElementById('day-panel'),
    dayLabel: document.getElementById('day-label'),
    daySum: document.getElementById('day-sum'),
    dayValue: document.getElementById('day-value'),
    dayHidden: document.getElementById('day-hidden'),
    dayTotals: document.getElementById('day-totals'),
    btnHide: document.getElementById('btn-hide'),
    weekBars: document.getElementById('week-bars'),
    weekSum: document.getElementById('week-sum'),
    weekSumDots: document.getElementById('week-sum-dots'),
    weekRest: document.getElementById('week-rest'),
    dayRate: document.getElementById('day-rate'),

    backupNote: document.getElementById('backup-note'),
    backupExport: document.getElementById('backup-export'),
    backupLater: document.getElementById('backup-later'),
    dataRow: document.getElementById('data-row'),
    rowExport: document.getElementById('row-export'),
    rowImport: document.getElementById('row-import'),

    importDialog: document.getElementById('import-dialog'),
    importTitle: document.getElementById('import-title'),
    importText: document.getElementById('import-text'),
    importAdd: document.getElementById('import-add'),
    importReplace: document.getElementById('import-replace'),
    importCancel: document.getElementById('import-cancel'),

    btnBack: document.getElementById('btn-back'),
    formTitle: document.getElementById('form-title'),
    form: document.getElementById('shift-form'),
    formError: document.getElementById('form-error'),
    more: document.getElementById('more'),
    deleteZone: document.getElementById('delete-zone'),
    btnDelete: document.getElementById('btn-delete'),

    date: document.getElementById('f-date'),
    btnToday: document.getElementById('btn-today'),
    btnYesterday: document.getElementById('btn-yesterday'),
    btnPickDate: document.getElementById('btn-pick-date'),
    dateChosen: document.getElementById('date-chosen'),

    serviceRow: document.getElementById('service-row'),
    serviceRowChip: document.getElementById('service-row-chip'),
    serviceRowName: document.getElementById('service-row-name'),
    sheet: document.getElementById('sheet'),
    sheetTitle: document.getElementById('sheet-title'),
    sheetBack: document.getElementById('sheet-back'),
    sheetClose: document.getElementById('sheet-close'),
    sheetBody: document.getElementById('sheet-body'),

    orders: document.getElementById('f-orders'),
    earnings: document.getElementById('f-earnings'),
    tips: document.getElementById('f-tips'),
    start: document.getElementById('f-start'),
    end: document.getElementById('f-end'),
    hours: document.getElementById('f-hours'),
    km: document.getElementById('f-km'),
    note: document.getElementById('f-note'),

    themes: document.getElementById('themes'),
    servicesList: document.getElementById('services-list'),
    serviceForm: document.getElementById('service-form'),
    newService: document.getElementById('f-new-service'),
    serviceError: document.getElementById('service-error'),
    hideSums: document.getElementById('f-hide-sums'),
    currency: document.getElementById('f-currency'),
    fuel: document.getElementById('f-fuel'),
    btnSettingsBack: document.getElementById('btn-settings-back'),
    btnSettingsDone: document.getElementById('btn-settings-done'),

    updateBar: document.getElementById('update-bar'),
    btnUpdate: document.getElementById('btn-update'),

    btnExportJson: document.getElementById('btn-export-json'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnImport: document.getElementById('btn-import'),
    importInput: document.getElementById('f-import'),
    dataReport: document.getElementById('data-report'),
    appVersion: document.getElementById('app-version')
  };

  var settings = null;
  var shifts = [];            // все смены, свежие сверху
  var sumsVisible = false;    // живёт до перезагрузки, в базу не пишется
  var hoursEditedByUser = false;
  var saving = false;
  var editingId = null;       // null — новая смена, иначе id правимой
  var currentService = '';    // служба, выбранная в форме
  var selectedDate = null;    // выбранный столбик недели; null — сегодня
  var openSwatches = null;    // у какой службы в настройках раскрыты плашки

  /* ---------- Даты ---------- */

  function toISO(d) {
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function fromISO(iso) {
    var p = String(iso).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function todayISO() { return toISO(new Date()); }

  function yesterdayISO() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return toISO(d);
  }

  var MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
                'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var MONTHS_FULL = ['ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
                     'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ'];
  var WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  function formatDay(iso) {
    if (iso === todayISO()) return 'Сегодня';
    if (iso === yesterdayISO()) return 'Вчера';
    var d = fromISO(iso);
    if (isNaN(d.getTime())) return iso;
    var text = d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + WEEKDAYS[d.getDay()];
    if (d.getFullYear() !== new Date().getFullYear()) text += ' ' + d.getFullYear();
    return text;
  }

  function formatDayLong(iso) {
    var d = fromISO(iso);
    return d.getDate() + ' ' + MONTHS_FULL[d.getMonth()];
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  /* ---------- Числа ---------- */

  /** Строка вида "1 250,50" превращается в 1250.5; пусто в null; мусор в NaN. */
  function parseNum(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
    return Number(s);
  }

  function formatMoney(value) {
    var n = Math.round(Number(value) * 100) / 100;
    var whole = Math.floor(Math.abs(n));
    var fraction = Math.round((Math.abs(n) - whole) * 100);

    // Пробелы по тысячам ставим только в целой части.
    var text = String(whole).replace(/\B(?=(\d{3})+$)/g, ' ');
    if (fraction) text += ',' + (fraction < 10 ? '0' + fraction : String(fraction));
    return (n < 0 ? '-' : '') + text + ' ' + settings.currency;
  }

  function formatNum(value) {
    return String(Math.round(Number(value) * 100) / 100).replace('.', ',');
  }

  function toField(value) {
    return (value === null || value === undefined) ? '' : String(value).replace('.', ',');
  }

  function shiftTotal(shift) {
    return (shift.earnings || 0) + (shift.tips || 0);
  }

  /** Ставка: до целого рубля, меньше рубля — «<1 ₽», а не «0 ₽». */
  function rateText(value) {
    return value < 1 ? '<1 ' + settings.currency : formatMoney(Math.round(value));
  }

  /**
   * Строка ставок по тому, что удалось посчитать. Нет денег — нет строки;
   * нет делителя — нет соответствующей половины.
   */
  function rateLine(money, orders, hours) {
    if (!money) return '';
    var parts = [];
    if (hours > 0) parts.push(rateText(money / hours) + ' в час');
    if (orders > 0) parts.push(rateText(money / orders) + ' за заказ');
    return parts.join(' · ');
  }

  /** Итоги набора смен: суммы, а не средние. */
  function totalsOf(group) {
    var t = { money: 0, orders: 0, hours: 0, count: group.length };
    group.forEach(function (s) {
      t.money += shiftTotal(s);
      t.orders += s.orders || 0;
      t.hours += s.hours || 0;
    });
    return t;   // часы не округляем: ставка должна считаться от точной суммы
  }

  /* ---------- Службы и цвета ---------- */

  function findService(name) {
    var key = String(name).toLowerCase();
    for (var i = 0; i < settings.services.length; i++) {
      if (String(settings.services[i].name).toLowerCase() === key) return settings.services[i];
    }
    return null;
  }

  /** Скрытые службы тоже участвуют: их цвет нужен старым сменам. */
  function serviceColor(name) {
    var found = findService(name);
    if (found) {
      /* Человек красил сам — его выбор держится за службой навсегда.
         Не красил — цвет берётся из таблицы схемы и меняется вместе с ней. */
      if (found.custom) return found.color;
      return DB.serviceColorOf(found.name, settings.theme) || found.color;
    }

    var hash = 0;
    for (var i = 0; i < String(name).length; i++) {
      hash = (hash * 31 + String(name).charCodeAt(i)) % DB.PALETTE.length;
    }
    return DB.PALETTE[hash];
  }

  function rgbOf(color) {
    var hex = String(color).replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)].join(', ');
  }

  function visibleServices() {
    return settings.services.filter(function (s) { return !s.hidden; });
  }

  /* Код отдаёт стилям только тройку чисел цвета службы. Прозрачности,
     градиенты и свечение собирает css/app.css — там они видят схему,
     а раньше цвет поверхности был вшит прямо сюда. */
  function paintChip(node, color) {
    node.style.setProperty('--svc-rgb', rgbOf(color));
  }

  /* ---------- Экраны ---------- */

  function showScreen(name) {
    Object.keys(el.screens).forEach(function (key) {
      el.screens[key].hidden = (key !== name);
    });
    window.scrollTo(0, 0);
  }

  /* ---------- Панель дня ---------- */

  function dayOf(iso) {
    return shifts.filter(function (s) { return s.date === iso; });
  }

  var WEEKDAYS_FULL = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА',
                       'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

  function dayLabelFor(iso) {
    if (iso === todayISO()) return 'СЕГОДНЯ · ' + formatDayLong(iso);
    if (iso === yesterdayISO()) return 'ВЧЕРА · ' + formatDayLong(iso);
    return WEEKDAYS_FULL[fromISO(iso).getDay()] + ' · ' + formatDayLong(iso);
  }

  function renderDay() {
    if (!shifts.length) {
      el.dayPanel.hidden = true;
      return;
    }
    el.dayPanel.hidden = false;

    var today = todayISO();
    var date, label;

    if (selectedDate) {
      date = selectedDate;
      label = dayLabelFor(date);
    } else if (dayOf(today).length) {
      date = today;
      label = 'СЕГОДНЯ · ' + formatDayLong(today);
    } else {
      // Нулевой день не показываем — вместо него последняя смена.
      date = shifts[0].date;
      label = 'ПОСЛЕДНЯЯ СМЕНА · ' + formatDayLong(date);
    }

    var group = dayOf(date);
    var t = totalsOf(group);

    el.dayLabel.textContent = label;
    el.dayValue.textContent = formatMoney(t.money);

    if (!group.length) {
      // Записей за дату нет вовсе — это не то же самое, что смена без денег.
      el.dayTotals.textContent = 'Смен не было';
    } else {
      var parts = [t.count + ' ' + plural(t.count, 'смена', 'смены', 'смен')];
      if (t.orders) parts.push(t.orders + ' ' + plural(t.orders, 'заказ', 'заказа', 'заказов'));
      // В строку итогов часы идут с одним знаком, в расчёт ставки — точные.
      if (t.hours) parts.push(formatNum(Math.round(t.hours * 10) / 10) + ' ч');
      el.dayTotals.textContent = parts.join(' · ');
    }

    // Ставка дня — общая сумма на общее количество, не среднее из ставок смен.
    el.dayRate.textContent = rateLine(t.money, t.orders, t.hours);

    renderWeek();
    renderWeekTotal();
    applySums();
  }

  /** Семь календарных дней: слева самый старый, справа сегодня. */
  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function renderWeek() {
    var today = todayISO();
    var active = selectedDate || today;
    var days = [];

    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var iso = toISO(d);
      var t = totalsOf(dayOf(iso));
      days.push({ iso: iso, sum: t.money, weekday: WEEKDAYS[d.getDay()], date: d });
    }

    var max = Math.max.apply(null, days.map(function (day) { return day.sum; }));

    el.weekBars.textContent = '';

    days.forEach(function (day) {
      var col = document.createElement('button');
      col.type = 'button';
      col.className = 'week__col' + (day.iso === active ? ' week__col--on' : '');
      col.setAttribute('data-date', day.iso);
      col.setAttribute('aria-pressed', day.iso === active ? 'true' : 'false');
      col.setAttribute('aria-label',
        WEEKDAYS_FULL[day.date.getDay()].charAt(0) +
        WEEKDAYS_FULL[day.date.getDay()].slice(1).toLowerCase() + ', ' +
        day.date.getDate() + ' ' + MONTHS_GEN[day.date.getMonth()] + ', ' +
        Math.round(day.sum) + ' ' + plural(Math.round(day.sum), 'рубль', 'рубля', 'рублей'));

      var bar = document.createElement('span');
      // Высота области графика — 40 пикселей. Доля от максимума недели,
      // но не ниже 8, иначе маленький заработок выглядит как пустой день.
      // Округляем до десятых: на целых пропорция заметно врала.
      var empty = !day.sum || !max;
      bar.className = 'week__bar' + (empty ? ' week__bar--empty' : '');
      bar.style.height = (empty ? 3 : Math.max(8, Math.round(400 * day.sum / max) / 10)) + 'px';

      var label = document.createElement('span');
      label.className = 'week__label';
      label.textContent = day.weekday;

      col.appendChild(bar);
      col.appendChild(label);
      el.weekBars.appendChild(col);
    });
  }

  /** Те же семь дней, что на графике: строка и график говорят об одном. */
  function weekShifts() {
    var from = new Date();
    from.setDate(from.getDate() - 6);
    var first = toISO(from);
    return shifts.filter(function (s) { return s.date >= first && s.date <= todayISO(); });
  }

  /**
   * Итог недели не зависит от выбранного дня и не прячется за жестом —
   * прячется только сумма, вместе с остальными деньгами.
   */
  function renderWeekTotal() {
    var t = totalsOf(weekShifts());

    el.weekSum.textContent = formatMoney(t.money);

    if (!t.count) {
      el.weekRest.textContent = ' · смен не было';
      return;
    }

    var parts = [t.count + ' ' + plural(t.count, 'смена', 'смены', 'смен')];
    if (t.hours) parts.push(formatNum(Math.round(t.hours * 10) / 10) + ' ч');
    el.weekRest.textContent = ' · ' + parts.join(' · ');
  }

  /** Выбор дня ничего не меняет в данных — это только показ. */
  function selectDay(iso) {
    selectedDate = (iso === todayISO() || iso === selectedDate) ? null : iso;
    renderDay();
    applySums();
    if (selectedDate) scrollToDay(selectedDate);
  }

  function scrollToDay(iso) {
    var head = el.list.querySelector('[data-date="' + iso + '"]');
    if (!head) return;

    head.scrollIntoView({ block: 'center' });

    var group = [head];
    var node = head.nextElementSibling;
    while (node && !node.classList.contains('day-head')) {
      group.push(node.firstChild || node);
      node = node.nextElementSibling;
    }

    group.forEach(function (n) { n.classList.add('flash'); });
    setTimeout(function () {
      group.forEach(function (n) { n.classList.remove('flash'); });
    }, 1200);
  }

  /* ---------- Скрытие сумм ---------- */

  /** Большая сумма не должна вылезать из блока: ужимаем кегль, пока не влезет. */
  function fitDayValue() {
    if (!sumsVisible) return;
    var size = 52; // как в макете; ужимается только если сумма не влезает
    el.dayValue.style.fontSize = size + 'px';
    while (size > 34 && el.dayValue.scrollWidth > el.daySum.clientWidth) {
      size -= 2;
      el.dayValue.style.fontSize = size + 'px';
    }
  }

  function applySums() {
    el.dayValue.hidden = !sumsVisible;
    el.dayHidden.hidden = sumsVisible;
    el.btnHide.hidden = !sumsVisible;

    var totals = el.list.querySelectorAll('.shift__total');
    var dots = el.list.querySelectorAll('.shift__dots');
    var tops = el.list.querySelectorAll('.shift__top');
    for (var i = 0; i < totals.length; i++) totals[i].hidden = !sumsVisible;
    for (var j = 0; j < dots.length; j++) dots[j].hidden = sumsVisible;

    // Ставка — те же деньги, прячется вместе с суммами.
    var rates = el.list.querySelectorAll('.shift__rate');
    var rateDots = el.list.querySelectorAll('.shift__rate-dots');
    for (var r = 0; r < rates.length; r++) rates[r].hidden = !sumsVisible;
    for (var q = 0; q < rateDots.length; q++) rateDots[q].hidden = sumsVisible;
    el.dayRate.hidden = !sumsVisible || !el.dayRate.textContent;
    el.weekSum.hidden = !sumsVisible;
    el.weekSumDots.hidden = sumsVisible;
    for (var k = 0; k < tops.length; k++) {
      tops[k].className = 'shift__top' + (sumsVisible ? '' : ' shift__top--hidden');
    }

    fitDayValue();
  }

  function toggleSums() {
    sumsVisible = !sumsVisible;
    applySums();
  }

  /* ---------- Список смен ---------- */

  function shiftNode(shift) {
    var li = document.createElement('li');
    var rgb = rgbOf(serviceColor(shift.service));

    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'shift';
    card.setAttribute('data-id', shift.id);
    // Тройка чисел наследуется внутрь карточки: кружок и рейка берут её же.
    card.style.setProperty('--svc-rgb', rgb);

    var rail = document.createElement('span');
    rail.className = 'rail';

    var chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = '₽';
    // Красить кружок отдельно не нужно: --svc-rgb наследуется от карточки.

    var line = document.createElement('span');
    line.className = 'rail__line';

    rail.appendChild(chip);
    rail.appendChild(line);
    card.appendChild(rail);

    var body = document.createElement('span');
    body.className = 'shift__body';

    var top = document.createElement('span');
    top.className = 'shift__top';

    var service = document.createElement('span');
    service.className = 'shift__service';
    service.textContent = shift.service;

    var total = document.createElement('span');
    total.className = 'shift__total';
    // Смена без денег: «0 ₽» не показываем, строка просто пустая.
    total.textContent = shiftTotal(shift) ? formatMoney(shiftTotal(shift)) : '';

    var dots = document.createElement('span');
    dots.className = 'shift__dots';
    for (var i = 0; i < 4; i++) dots.appendChild(document.createElement('i'));

    top.appendChild(service);
    top.appendChild(total);
    top.appendChild(dots);
    body.appendChild(top);

    var meta = [];
    if (shift.orders) meta.push(shift.orders + ' зак.');
    if (shift.hours) meta.push(formatNum(shift.hours) + ' ч');
    if (shift.km) meta.push(formatNum(shift.km) + ' км');
    if (shift.timeStart && shift.timeEnd) meta.push(shift.timeStart + '–' + shift.timeEnd);

    var metaEl = document.createElement('span');
    metaEl.className = 'shift__meta';
    metaEl.textContent = meta.join(' · ');
    body.appendChild(metaEl);

    var rate = rateLine(shiftTotal(shift), shift.orders, shift.hours);
    if (rate) {
      var rateEl = document.createElement('span');
      rateEl.className = 'shift__rate';
      rateEl.textContent = rate;
      body.appendChild(rateEl);

      var rateDots = document.createElement('span');
      rateDots.className = 'shift__rate-dots';
      for (var d = 0; d < 3; d++) rateDots.appendChild(document.createElement('i'));
      body.appendChild(rateDots);
    }

    if (shift.note) {
      var note = document.createElement('span');
      note.className = 'shift__note';
      note.textContent = shift.note;
      body.appendChild(note);
    }

    card.appendChild(body);
    li.appendChild(card);
    return li;
  }

  function renderList() {
    el.list.textContent = '';

    // Экран первого запуска живёт ровно до первой записи.
    var first = !shifts.length;
    el.empty.hidden = !first;
    el.list.hidden = first;
    el.addLabel.textContent = first ? 'Записать первую смену' : 'Добавить смену';
    document.body.classList.toggle('is-onboarding', first);
    if (first) return;

    var currentDay = null;
    shifts.slice(0, 50).forEach(function (shift) {
      if (shift.date !== currentDay) {
        currentDay = shift.date;
        var head = document.createElement('li');
        head.className = 'day-head';
        head.setAttribute('data-date', shift.date);
        head.textContent = formatDay(shift.date).toUpperCase();
        el.list.appendChild(head);
      }
      el.list.appendChild(shiftNode(shift));
    });
  }

  function refreshList(keepDay) {
    return DB.listShifts(Infinity).then(function (all) {
      shifts = all;
      // Правка смен возвращает панель на сегодня.
      if (!keepDay) selectedDate = null;
      renderList();
      renderDay();
      applySums();
      updateBackupUi();
    });
  }

  /* ---------- Выбор службы ---------- */

  /* Шторка открывается всегда с развилки: угадывать шаг не пытаемся. */
  var SHEET_FORK = 'fork';
  var SHEET_LIST = 'list';
  var SHEET_OWN = 'own';

  var sheetStep = '';       // текущий шаг; пустая строка — шторка закрыта
  var sheetSteps = 0;       // сколько шагов мы добавили в историю браузера
  var skipPop = false;      // свой же history.go — на него не отвечаем
  var ownColor = '';        // цвет, выбранный на шаге «Своя служба»
  var ownTimer = null;      // отложенное закрытие после сообщения

  /* Порядок готовых служб один и тот же всегда: он предсказуем,
     и Ozon не приходится искать глазами. */
  var BUILT_IN = ['ozon', 'купер', 'магнит', 'яндекс', 'вкусвилл', 'самокат'];

  /** Сначала готовые службы в заданном порядке, следом свои — как добавляли. */
  function servicesInOrder() {
    var known = {};
    var own = [];

    visibleServices().forEach(function (service) {
      var key = String(service.name).toLowerCase();
      if (BUILT_IN.indexOf(key) === -1) own.push(service);
      else known[key] = service;
    });

    var list = [];
    BUILT_IN.forEach(function (key) {
      if (known[key]) list.push(known[key]);
    });

    return list.concat(own);
  }

  function setService(name) {
    currentService = name;
    el.serviceRowName.textContent = name;
    el.serviceRowChip.textContent = '₽';
    paintChip(el.serviceRowChip, serviceColor(name));
  }

  function icon(paths) {
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round">' + paths + '</svg>';
  }

  /* ---------- Шаг 1: развилка ---------- */

  function forkRow(id, text, paths) {
    var li = document.createElement('li');
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'sheet-row';
    row.id = id;

    var mark = document.createElement('span');
    mark.className = 'sheet-row__icon';
    mark.innerHTML = icon(paths);

    var name = document.createElement('span');
    name.className = 'sheet-row__name sheet-row__name--fork';
    name.textContent = text;

    var chevron = document.createElement('span');
    chevron.className = 'sheet-row__chevron';
    chevron.innerHTML = icon('<path d="M9 5l7 7-7 7"/>');

    row.appendChild(mark);
    row.appendChild(name);
    row.appendChild(chevron);
    li.appendChild(row);
    return li;
  }

  function renderFork() {
    var list = document.createElement('ul');
    list.className = 'sheet__list';

    list.appendChild(forkRow('sheet-pick', 'Выбрать из готового списка',
      '<path d="M9 6h11M9 12h11M9 18h11"/>' +
      '<path d="M4 6h.01M4 12h.01M4 18h.01"/>'));

    list.appendChild(forkRow('sheet-own', 'Написать свою',
      '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/>' +
      '<path d="M14.5 6.5l3 3"/>'));

    el.sheetBody.textContent = '';
    el.sheetBody.appendChild(list);
  }

  /* ---------- Шаг 2: готовый список ---------- */

  function sheetRow(service) {
    var li = document.createElement('li');
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'sheet-row' + (service.name === currentService ? ' sheet-row--on' : '');
    row.setAttribute('data-name', service.name);

    var chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = '₽';
    paintChip(chip, serviceColor(service.name));

    var name = document.createElement('span');
    name.className = 'sheet-row__name';
    name.textContent = service.name;

    row.appendChild(chip);
    row.appendChild(name);

    if (service.name === currentService) {
      var check = document.createElement('span');
      check.className = 'sheet-row__check';
      check.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" ' +
        'stroke="currentColor" stroke-width="2.4"><path d="M4 12.5l5 5 11-11"/></svg>';
      row.appendChild(check);
    }

    li.appendChild(row);
    return li;
  }

  function renderServiceList() {
    var list = document.createElement('ul');
    list.className = 'sheet__list';
    servicesInOrder().forEach(function (service) {
      list.appendChild(sheetRow(service));
    });
    el.sheetBody.textContent = '';
    el.sheetBody.appendChild(list);
  }

  /* ---------- Шаг 2: своя служба ---------- */

  function renderOwn() {
    ownColor = DB.nextColor(settings.services);

    var form = document.createElement('form');
    form.className = 'sheet-own';
    form.id = 'sheet-own-form';

    var label = document.createElement('label');
    label.className = 'label';
    label.setAttribute('for', 'sheet-own-name');
    label.textContent = 'Название';

    var input = document.createElement('input');
    input.className = 'input';
    input.type = 'text';
    input.id = 'sheet-own-name';
    input.maxLength = 20;
    input.autocomplete = 'off';

    var colorLabel = document.createElement('span');
    colorLabel.className = 'label';
    colorLabel.textContent = 'Цвет';

    var error = document.createElement('p');
    error.className = 'form-error';
    error.id = 'sheet-own-error';
    error.hidden = true;

    var done = document.createElement('button');
    done.type = 'submit';
    done.className = 'btn btn--ghost sheet-own__done';
    done.id = 'sheet-own-done';
    done.textContent = 'Готово';
    done.disabled = true;

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(colorLabel);
    // Плашки цветов — те же, что в настройках; второго набора не заводим.
    form.appendChild(swatchRow({ name: '', color: ownColor }));
    form.appendChild(error);

    // Кнопка живёт в липкой подложке — см. .sheet-own__foot в стилях.
    var foot = document.createElement('div');
    foot.className = 'sheet-own__foot';
    foot.appendChild(done);
    form.appendChild(foot);

    el.sheetBody.textContent = '';
    el.sheetBody.appendChild(form);

    input.addEventListener('input', function () {
      done.disabled = input.value.trim() === '';
      error.hidden = true;
    });
    form.addEventListener('submit', submitOwn);

    input.focus();
  }

  /** Отмечает выбранную плашку, не перерисовывая форму: имя не должно пропасть. */
  function markSwatches() {
    var list = el.sheetBody.querySelectorAll('.swatch[data-color]');
    for (var i = 0; i < list.length; i++) {
      var on = list[i].getAttribute('data-color').toLowerCase() === ownColor.toLowerCase();
      list[i].className = 'swatch' + (on ? ' swatch--on' : '');
    }
  }

  function submitOwn(event) {
    event.preventDefault();

    var input = document.getElementById('sheet-own-name');
    var error = document.getElementById('sheet-own-error');
    var name = input.value.trim();
    if (!name) return;

    var existing = findService(name);

    if (existing && !existing.hidden) {
      error.textContent = 'Такая служба уже есть';
      error.hidden = false;
      return;
    }

    if (existing) {
      /* Служба была скрыта в настройках. Возвращаем её с прежним цветом и
         говорим об этом: иначе цвет окажется чужим и непонятно откуда. */
      existing.hidden = false;
      error.textContent = 'Такая служба уже была, она скрыта в настройках — возвращаем';
      error.hidden = false;
      renderServices();
      DB.saveSettings(settings);
      setService(existing.name);
      // Даём прочитать строку целиком и закрываем шторку сами.
      ownTimer = setTimeout(function () { closeSheet(); }, 3000);
      return;
    }

    settings.services.push({ name: name, color: ownColor, custom: true });
    renderServices();
    DB.saveSettings(settings).then(function () {
      setService(name);
      closeSheet();
    });
  }

  /* ---------- Шаги, возврат и закрытие ---------- */

  function showStep(step) {
    sheetStep = step;
    el.sheetBack.hidden = step === SHEET_FORK;

    if (step === SHEET_LIST) {
      el.sheetTitle.textContent = 'Готовые службы';
      renderServiceList();
      return;
    }

    if (step === SHEET_OWN) {
      el.sheetTitle.textContent = 'Своя служба';
      renderOwn();
      return;
    }

    el.sheetTitle.textContent = 'Где работаем?';
    renderFork();
  }

  /* Кнопка «назад» на телефоне — это шаг назад в истории браузера.
     При запуске файлом браузер может запретить запись в историю: тогда
     шторка работает без неё, но ошибки не возникает. */
  function pushStep() {
    try {
      history.pushState({ sheet: true }, '');
      sheetSteps += 1;
    } catch (e) { /* живём без кнопки «назад» */ }
  }

  function dropSteps() {
    if (!sheetSteps) return;
    var back = sheetSteps;
    sheetSteps = 0;
    skipPop = true;
    try {
      history.go(-back);
    } catch (e) {
      skipPop = false;
    }
  }

  function openSheet() {
    pushStep();
    showStep(SHEET_FORK);
    el.sheet.hidden = false;
  }

  function goStep(step) {
    pushStep();
    showStep(step);
  }

  function backToFork() {
    if (sheetSteps > 1) {
      history.back();   // на popstate вернёмся на развилку
      return;
    }
    showStep(SHEET_FORK);
  }

  function closeSheet() {
    if (ownTimer) { clearTimeout(ownTimer); ownTimer = null; }
    el.sheet.hidden = true;
    sheetStep = '';
    dropSteps();
  }

  /* ---------- Форма ---------- */

  function setDate(iso) {
    el.date.value = iso;

    var isToday = iso === todayISO();
    var isYesterday = iso === yesterdayISO();

    el.btnToday.className = 'date-btn' + (isToday ? ' date-btn--on' : '');
    el.btnYesterday.className = 'date-btn' + (isYesterday ? ' date-btn--on' : '');
    el.btnPickDate.className = 'date-btn date-btn--icon' +
      (!isToday && !isYesterday ? ' date-btn--on' : '');

    el.dateChosen.hidden = isToday || isYesterday;
    if (!el.dateChosen.hidden) el.dateChosen.textContent = formatDay(iso);
  }

  function pickDate() {
    try {
      if (typeof el.date.showPicker === 'function') {
        el.date.showPicker();
        return;
      }
    } catch (e) { /* браузер не дал открыть — падаем на фокус */ }
    el.date.focus();
  }

  function resetForm() {
    el.form.reset();
    el.formError.hidden = true;
    el.more.open = false;
    el.note.value = '';
    hoursEditedByUser = false;
    clearInvalid();
  }

  function openNewShift() {
    resetForm();
    editingId = null;
    el.formTitle.textContent = 'Новая смена';
    el.deleteZone.hidden = true;
    setDate(todayISO());

    var last = shifts[0];
    var known = last && findService(last.service);
    setService(known ? known.name : (visibleServices()[0] || settings.services[0]).name);

    showScreen('form');
    el.orders.focus();
  }

  function openEditShift(id) {
    DB.getShift(id).then(function (shift) {
      if (!shift) return;

      resetForm();
      editingId = shift.id;
      el.formTitle.textContent = 'Смена';
      el.deleteZone.hidden = false;

      setDate(shift.date);
      setService(shift.service);
      el.orders.value = shift.orders;
      el.earnings.value = toField(shift.earnings);
      el.tips.value = toField(shift.tips);
      el.start.value = shift.timeStart || '';
      el.end.value = shift.timeEnd || '';
      el.hours.value = toField(shift.hours);
      el.km.value = toField(shift.km);
      el.note.value = shift.note || '';

      hoursEditedByUser = !!shift.hours;
      el.more.open = !!(shift.tips || shift.hours || shift.timeStart ||
                        shift.timeEnd || shift.km || shift.note);

      showScreen('form');
    });
  }

  function calcHours() {
    if (hoursEditedByUser) return;
    if (!el.start.value || !el.end.value) return;

    var s = el.start.value.split(':');
    var e = el.end.value.split(':');
    var diff = (Number(e[0]) * 60 + Number(e[1])) - (Number(s[0]) * 60 + Number(s[1]));
    if (diff <= 0) diff += 24 * 60; // смена через полночь

    el.hours.value = toField(Math.round(diff / 60 * 100) / 100);
  }

  /* Вписал начало смены — курсор сам уходит в конец. Только в новой смене
     и только пока конец пустой: в правке уводить курсор нельзя.
     Колесо выбора не открываем — человек его не просил. */
  function jumpToEnd() {
    if (editingId !== null) return;
    if (el.end.value) return;
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(el.start.value)) return;
    el.end.focus();
  }

  function clearInvalid() {
    var marked = el.form.querySelectorAll('.input--invalid');
    for (var i = 0; i < marked.length; i++) marked[i].classList.remove('input--invalid');
  }

  function fail(input, message) {
    input.classList.add('input--invalid');
    el.formError.textContent = message;
    el.formError.hidden = false;
    if (input.closest('.more__body')) el.more.open = true;
    input.focus();
    return null;
  }

  function collect() {
    clearInvalid();
    el.formError.hidden = true;

    if (!el.date.value) return fail(el.orders, 'Укажите дату');
    if (!currentService) return fail(el.orders, 'Выберите службу');

    var optional = {};
    var fields = [
      ['orders', el.orders, 'Заказы указаны неверно'],
      ['earnings', el.earnings, 'Заработок указан неверно'],
      ['tips', el.tips, 'Чаевые указаны неверно'],
      ['hours', el.hours, 'Часы указаны неверно'],
      ['km', el.km, 'Километраж указан неверно']
    ];

    for (var i = 0; i < fields.length; i++) {
      var value = parseNum(fields[i][1].value);
      if (isNaN(value) || (value !== null && value < 0)) {
        return fail(fields[i][1], fields[i][2]);
      }
      optional[fields[i][0]] = value;
    }

    // Совсем пустую смену не сохраняем: хоть что-то из трёх должно быть.
    if (optional.earnings === null && optional.orders === null && optional.hours === null) {
      return fail(el.orders, 'Заполните хотя бы одно: заработок, заказы или часы');
    }

    var note = el.note.value.trim();

    var shift = {
      date: el.date.value,
      service: currentService,
      orders: optional.orders === null ? null : Math.round(optional.orders),
      earnings: optional.earnings,
      tips: optional.tips,
      hours: optional.hours,
      timeStart: el.start.value || null,
      timeEnd: el.end.value || null,
      km: optional.km,
      note: note || null
    };

    if (editingId !== null) shift.id = editingId;
    return shift;
  }

  function save(event) {
    event.preventDefault();
    if (saving) return;

    var shift = collect();
    if (!shift) return;

    saving = true;
    var write = (editingId === null) ? DB.addShift(shift) : DB.updateShift(shift);

    write
      .then(function () { return refreshList(); })
      .then(function () {
        saving = false;
        editingId = null;
        showScreen('list');
      })
      .catch(function (error) {
        saving = false;
        el.formError.textContent = 'Не удалось сохранить: ' + error.message;
        el.formError.hidden = false;
      });
  }

  function removeShift() {
    if (editingId === null || saving) return;
    if (!window.confirm('Удалить смену? Это нельзя отменить.')) return;

    saving = true;
    DB.deleteShift(editingId)
      .then(function () { return refreshList(); })
      .then(function () {
        saving = false;
        editingId = null;
        showScreen('list');
      })
      .catch(function (error) {
        saving = false;
        el.formError.textContent = 'Не удалось удалить: ' + error.message;
        el.formError.hidden = false;
      });
  }

  /* ---------- Оформление ---------- */

  var THEMES = [
    { id: 'glubina', name: 'Глубина' },
    { id: 'laguna', name: 'Лагуна' },
    { id: 'myata', name: 'Мята' },
    { id: 'indigo', name: 'Индиго' }
  ];

  /* Схема ставится атрибутом на корне. Зеркало в localStorage нужно шапке:
     она читает его до отрисовки, пока база ещё отвечает. Хозяин значения —
     настройки в базе. */
  function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);

    try {
      window.localStorage.setItem('theme', id);
    } catch (e) { /* приватный режим — переживём */ }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var deep = getComputedStyle(document.documentElement).getPropertyValue('--bg-deep');
    if (deep) meta.setAttribute('content', deep.replace(/\s/g, ''));
  }

  function renderThemes() {
    if (!el.themes) return;
    el.themes.textContent = '';

    THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme' + (settings.theme === theme.id ? ' theme--on' : '');
      btn.setAttribute('data-theme-id', theme.id);

      var preview = document.createElement('span');
      preview.className = 'theme__preview theme__preview--' + theme.id;

      var check = document.createElement('span');
      check.className = 'theme__check';
      check.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" ' +
        'stroke="currentColor" stroke-width="3"><path d="M4 12.5l5 5 11-11"/></svg>';
      preview.appendChild(check);

      var name = document.createElement('span');
      name.className = 'theme__name';
      name.textContent = theme.name;

      btn.appendChild(preview);
      btn.appendChild(name);
      el.themes.appendChild(btn);
    });
  }

  /** Смена схемы: видно сразу, без перезагрузки. */
  function chooseTheme(id) {
    if (settings.theme === id) return;
    settings.theme = id;
    applyTheme(id);
    renderThemes();
    // Службы, которые человек не красил, берут цвет из схемы — перерисуем.
    renderServices();
    renderList();
    renderDay();
    applySums();
    if (currentService) setService(currentService);
    DB.saveSettings(settings);
  }

  /* ---------- Настройки ---------- */

  function settingsError(message) {
    el.serviceError.textContent = message;
    el.serviceError.hidden = !message;
  }

  function swatchRow(service) {
    var box = document.createElement('div');
    box.className = 'swatches';
    // Отмечаем действующий цвет: у некрашеной службы он приходит из схемы.
    var now = service.name ? serviceColor(service.name) : service.color;

    DB.PALETTE.forEach(function (color) {
      var swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch' +
        (color.toLowerCase() === String(now).toLowerCase() ? ' swatch--on' : '');
      swatch.style.background = color;
      swatch.setAttribute('data-color', color);
      swatch.setAttribute('aria-label', 'Цвет ' + color);
      box.appendChild(swatch);
    });

    // Полный спектр — отдельной кнопкой, для тех, кому палитры мало.
    var custom = document.createElement('label');
    custom.className = 'swatch swatch--custom';
    custom.textContent = 'свой цвет';
    var input = document.createElement('input');
    input.type = 'color';
    input.value = now;
    input.setAttribute('data-custom', service.name);
    custom.appendChild(input);
    box.appendChild(custom);

    return box;
  }

  function renderServices() {
    el.servicesList.textContent = '';

    visibleServices().forEach(function (service) {
      var li = document.createElement('li');
      li.className = 'service';

      var row = document.createElement('div');
      row.className = 'service__row';

      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip service__chip';
      chip.textContent = '₽';
      chip.setAttribute('data-swatch', service.name);
      chip.setAttribute('aria-label', 'Цвет службы ' + service.name);
      paintChip(chip, serviceColor(service.name));

      var name = document.createElement('span');
      name.className = 'service__name';
      name.textContent = service.name;

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'service__remove';
      remove.textContent = '✕';
      remove.setAttribute('data-service', service.name);
      remove.setAttribute('aria-label', 'Удалить службу ' + service.name);

      row.appendChild(chip);
      row.appendChild(name);
      row.appendChild(remove);
      li.appendChild(row);

      if (openSwatches === service.name) li.appendChild(swatchRow(service));

      el.servicesList.appendChild(li);
    });
  }

  function setServiceColor(name, color) {
    var service = findService(name);
    if (!service) return;
    service.color = color;
    service.custom = true;   // теперь схема этот цвет не трогает
    DB.saveSettings(settings).then(function () {
      renderServices();
      renderList();
      applySums();
    });
  }

  function addService(event) {
    event.preventDefault();
    var name = el.newService.value.trim();
    if (!name) return;

    var existing = findService(name);
    if (existing && !existing.hidden) {
      settingsError('Такая служба уже есть');
      return;
    }

    if (existing) {
      existing.hidden = false; // была скрыта — просто возвращаем в список
    } else {
      settings.services.push({
        name: name, color: DB.nextColor(settings.services), custom: true
      });
    }

    settingsError('');
    el.newService.value = '';
    renderServices();
    DB.saveSettings(settings);
  }

  /**
   * Удаление службы. Если на неё ссылаются смены, запись остаётся скрытой —
   * иначе карточки этих смен потеряют свой цвет.
   */
  function removeService(name) {
    if (visibleServices().length <= 1) {
      settingsError('Должна остаться хотя бы одна служба');
      return;
    }

    var key = String(name).toLowerCase();
    var used = shifts.some(function (s) { return String(s.service).toLowerCase() === key; });
    var service = findService(name);
    if (!service) return;

    if (used) {
      service.hidden = true;
      settingsError('Служба убрана из списка. Цвет сохранён для её смен.');
    } else {
      settings.services.splice(settings.services.indexOf(service), 1);
      settingsError('');
    }

    if (openSwatches === name) openSwatches = null;
    renderServices();
    DB.saveSettings(settings);
  }

  function saveMoneySettings() {
    var currency = el.currency.value.trim();
    settings.currency = currency || DB.DEFAULT_SETTINGS.currency;
    el.currency.value = settings.currency;

    var fuel = parseNum(el.fuel.value);
    if (isNaN(fuel) || (fuel !== null && fuel < 0)) {
      settingsError('Расход топлива указан неверно');
      return false;
    }

    settings.fuelPerKm = fuel === null ? 0 : fuel;
    settingsError('');
    DB.saveSettings(settings);
    return true;
  }

  function openSettings() {
    settingsError('');
    el.dataReport.hidden = true;
    el.newService.value = '';
    openSwatches = null;
    el.currency.value = settings.currency;
    el.fuel.value = toField(settings.fuelPerKm || 0);
    el.hideSums.checked = settings.hideSums !== false;
    renderThemes();
    renderServices();
    showScreen('settings');
  }

  function closeSettings() {
    if (!saveMoneySettings()) return;
    refreshList().then(function () { showScreen('list'); });
  }

  /* ---------- Экспорт и импорт ---------- */

  function report(message, isError) {
    el.dataReport.textContent = message;
    el.dataReport.className = 'data-report' + (isError ? ' data-report--error' : '');
    el.dataReport.hidden = false;
  }

  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportJson() {
    Promise.all([DB.listShifts(Infinity), DB.getSettings()]).then(function (result) {
      var data = {
        app: 'courier-earnings',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: result[1],
        shifts: result[0]
      };
      download('delay-kassu-' + todayISO() + '.json', JSON.stringify(data, null, 2), 'application/json');
      report('Копия сохранена, смен в ней: ' + result[0].length);
      markExported();
    });
  }

  var CSV_HEAD = ['id', 'Дата', 'Служба', 'Заказы', 'Заработок', 'Чаевые',
                  'Часы', 'Начало', 'Конец', 'Км', 'Заметка'];

  function csvCell(value) {
    if (value === null || value === undefined) return '';
    var text = String(value);
    return /[";\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  /** В таблицу числа уходят с запятой — так их понимает русский Excel. */
  function csvNum(value) {
    return (value === null || value === undefined) ? '' : String(value).replace('.', ',');
  }

  function exportCsv() {
    DB.listShifts(Infinity).then(function (all) {
      // Незаполненное поле уходит пустой ячейкой, а не нулём: иначе после
      // кольца «выгрузил — загрузил» пустая сумма стала бы нулевой.
      var rows = all.map(function (s) {
        return [s.id, s.date, s.service, csvNum(s.orders), csvNum(s.earnings), csvNum(s.tips),
                csvNum(s.hours), s.timeStart, s.timeEnd, csvNum(s.km), s.note]
          .map(csvCell).join(';');
      });

      // \ufeff — метка кодировки, без неё Excel открывает кириллицу кракозябрами.
      var text = '\ufeff' + [CSV_HEAD.join(';')].concat(rows).join('\r\n');
      download('delay-kassu-' + todayISO() + '.csv', text, 'text/csv');
      report('Таблица сохранена, смен в ней: ' + all.length);
      markExported();
    });
  }

  /** Разбор CSV с учётом кавычек и метки кодировки в начале файла. */
  function parseCsv(text) {
    text = text.replace(/^\ufeff/, '');
    var rows = [], row = [], cell = '', quoted = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (quoted) {
        if (ch !== '"') { cell += ch; continue; }
        if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else { quoted = false; }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ';') {
        row.push(cell); cell = '';
      } else if (ch === '\n') {
        row.push(cell); rows.push(row); row = []; cell = '';
      } else if (ch !== '\r') {
        cell += ch;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  var CSV_FIELDS = {
    'id': 'id', 'дата': 'date', 'служба': 'service', 'заказы': 'orders',
    'заработок': 'earnings', 'чаевые': 'tips', 'часы': 'hours',
    'начало': 'timeStart', 'конец': 'timeEnd', 'км': 'km', 'заметка': 'note'
  };

  function parseCsvShifts(text) {
    var rows = parseCsv(text);
    if (!rows.length) return null;

    var map = {};
    rows[0].forEach(function (title, i) {
      var key = CSV_FIELDS[String(title).trim().toLowerCase()];
      if (key) map[key] = i;
    });
    if (map.date === undefined || map.service === undefined) return null;

    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row.length || row.join('').trim() === '') continue;

      var cell = function (name) {
        var i = map[name];
        if (i === undefined) return null;
        var v = String(row[i] === undefined ? '' : row[i]).trim();
        return v === '' ? null : v;   // пустая ячейка — это «не введено»
      };
      var num = function (name) {
        var v = cell(name);
        if (v === null) return null;
        var n = parseNum(v);
        return (n === null || isNaN(n)) ? null : n;
      };

      var date = cell('date');
      if (!date) continue;

      var orders = num('orders');
      out.push({
        id: cell('id') ? Number(cell('id')) : null,
        date: date,
        service: cell('service') || '—',
        orders: orders === null ? null : Math.round(orders),
        earnings: num('earnings'),
        tips: num('tips'),
        hours: num('hours'),
        km: num('km'),
        timeStart: cell('timeStart'),
        timeEnd: cell('timeEnd'),
        note: cell('note')
      });
    }
    return { shifts: out, settings: null };
  }

  /** Файл может быть нашим JSON или CSV — определяем по первому символу. */
  function parseImport(text) {
    var trimmed = text.replace(/^\ufeff/, '').replace(/^\s+/, '');
    if (trimmed.charAt(0) === '{') {
      var json = null;
      try { json = JSON.parse(trimmed); } catch (e) { return null; }
      if (!json || !Array.isArray(json.shifts)) return null;
      return { shifts: json.shifts, settings: json.settings || null };
    }
    return parseCsvShifts(text);
  }

  /**
   * Отпечаток смены для поиска дублей. У наших копий это момент создания
   * записи: он переживает правки, поэтому исправленная смена не задвоится.
   */
  function shiftKey(shift) {
    if (shift.createdAt) return 'c' + shift.createdAt;
    return 'x' + [shift.date, shift.service, shift.orders, shift.earnings].join('|');
  }

  /** Копии этапа 3 хранят службы строками — принимаем оба вида. */
  function mergeSettings(imported) {
    if (!imported) return Promise.resolve();

    (imported.services || []).forEach(function (entry) {
      var name = (entry && typeof entry === 'object') ? entry.name : entry;
      if (!name || findService(name)) return;

      var service = {
        name: String(name),
        color: (entry && entry.color) || DB.nextColor(settings.services),
        // Цвет из копии считаем осознанным выбором: схема его не перекрасит.
        custom: (entry && entry.custom === false) ? false : true
      };
      // Флаг скрытия переносим как есть; в копиях этапа 3 его нет — служба видима.
      if (entry && entry.hidden === true) service.hidden = true;

      settings.services.push(service);
    });

    if (imported.currency) settings.currency = imported.currency;
    if (typeof imported.fuelPerKm === 'number') settings.fuelPerKm = imported.fuelPerKm;
    if (typeof imported.hideSums === 'boolean') settings.hideSums = imported.hideSums;

    return DB.saveSettings(settings);
  }

  /* ---------- Загрузка файла ---------- */

  var pendingImport = null;

  /** Повтором считаем совпадение по id, по метке создания или по составу. */
  function comboKey(shift) {
    return [shift.date, shift.timeStart || '', shift.timeEnd || '',
            String(shift.service).toLowerCase(),
            (shift.earnings === null || shift.earnings === undefined) ? '' : shift.earnings
           ].join('|');
  }

  function buildIndex(existing) {
    var index = { ids: {}, created: {}, combo: {} };
    existing.forEach(function (shift) { addToIndex(index, shift); });
    return index;
  }

  function addToIndex(index, shift) {
    if (shift.id !== null && shift.id !== undefined) index.ids[shift.id] = true;
    if (shift.createdAt) index.created[shift.createdAt] = true;
    index.combo[comboKey(shift)] = true;
  }

  function isDuplicate(index, shift) {
    if (shift.createdAt && index.created[shift.createdAt]) return true;
    if (shift.id !== null && shift.id !== undefined && index.ids[shift.id]) return true;
    return !!index.combo[comboKey(shift)];
  }

  function openDialog() { el.importDialog.hidden = false; }
  function closeDialog() { el.importDialog.hidden = true; pendingImport = null; }

  function askImport(count) {
    el.importTitle.textContent = 'В файле ' + count + ' ' +
      plural(count, 'смена', 'смены', 'смен') + '.';
    el.importText.textContent = 'Добавить к текущим или заменить всё?';
    el.importAdd.hidden = false;
    el.importReplace.hidden = false;
    el.importCancel.textContent = 'Отмена';
    openDialog();
  }

  function showImportResult(title, text) {
    el.importTitle.textContent = title;
    el.importText.textContent = text;
    el.importAdd.hidden = true;
    el.importReplace.hidden = true;
    el.importCancel.textContent = 'Готово';
    openDialog();
  }

  function runImport(mode) {
    var data = pendingImport;
    if (!data) return;

    if (mode === 'replace') {
      var warn = 'Текущие ' + shifts.length + ' ' +
        plural(shifts.length, 'смена', 'смены', 'смен') + ' будут удалены. Точно?';
      if (!window.confirm(warn)) return;
    }

    var prepare = (mode === 'replace') ? DB.clearShifts() : Promise.resolve();

    prepare
      .then(function () { return DB.listShifts(Infinity); })
      .then(function (existing) {
        var index = buildIndex(existing);
        var fresh = [], skipped = 0;

        data.shifts.forEach(function (raw) {
          if (!raw || !raw.date || !raw.service) return;
          // При замене файл — источник истины, повторы внутри него не ищем.
          if (mode === 'add' && isDuplicate(index, raw)) { skipped++; return; }
          addToIndex(index, raw);
          fresh.push(raw);
        });

        return fresh.reduce(function (chain, shift) {
          return chain.then(function () { return DB.addShift(shift); });
        }, Promise.resolve())
          .then(function () { return mergeSettings(data.settings); })
          .then(function () { return refreshList(); })
          .then(function () {
            renderServices();
            el.currency.value = settings.currency;
            el.fuel.value = toField(settings.fuelPerKm || 0);
            el.hideSums.checked = settings.hideSums !== false;
            report('Добавлено ' + fresh.length + ', пропущено как повтор ' + skipped);
            showImportResult('Готово',
              'Добавлено ' + fresh.length + ', пропущено как повтор ' + skipped);
          });
      })
      .catch(function (error) {
        showImportResult('Не получилось загрузить', error.message);
      });
  }

  /** Blob.text() появился в 2019-м; на старых движках читаем по-старому. */
  function readFile(file) {
    if (typeof file.text === 'function') return file.text();

    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result)); };
      reader.onerror = function () { reject(new Error('Файл не прочитался')); };
      reader.readAsText(file, 'utf-8');
    });
  }

  function importFile(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = ''; // чтобы тот же файл можно было выбрать повторно
    if (!file) return;

    readFile(file).then(function (text) {
      var data = parseImport(text);

      if (!data) {
        showImportResult('Не получилось прочитать файл',
          'Это не похоже на файл смен — в первой строке нет ожидаемых заголовков.');
        return;
      }
      if (!data.shifts.length) {
        showImportResult('В файле нет смен', 'Строк со сменами не нашлось.');
        return;
      }

      pendingImport = data;
      askImport(data.shifts.length);
    }).catch(function (error) {
      showImportResult('Не получилось прочитать файл', error.message);
    });
  }

  /* ---------- Напоминание о копии ---------- */

  var DAY_MS = 24 * 60 * 60 * 1000;

  function needBackup() {
    if (shifts.length < 3) return false;
    if (settings.remindAfter && Date.now() < settings.remindAfter) return false;
    if (!settings.lastExportAt) return true;

    var added = shifts.length - (settings.shiftsAtExport || 0);
    var days = (Date.now() - settings.lastExportAt) / DAY_MS;
    return added >= 10 || days >= 14;
  }

  function updateBackupUi() {
    var empty = !shifts.length;
    el.dataRow.hidden = empty;
    el.backupNote.hidden = empty || !needBackup();
  }

  /** Успешная выгрузка обнуляет счётчик — плашка исчезает. */
  function markExported() {
    settings.lastExportAt = Date.now();
    settings.shiftsAtExport = shifts.length;
    settings.remindAfter = null;
    DB.saveSettings(settings);
    updateBackupUi();
  }

  function remindLater() {
    settings.remindAfter = Date.now() + 7 * DAY_MS;
    DB.saveSettings(settings);
    updateBackupUi();
  }

  /* ---------- Запуск ---------- */

  function bind() {
    el.btnAdd.addEventListener('click', openNewShift);
    el.btnBack.addEventListener('click', function () { showScreen('list'); });
    el.btnDelete.addEventListener('click', removeShift);
    el.btnSettings.addEventListener('click', openSettings);

    el.list.addEventListener('click', function (event) {
      var card = event.target.closest('.shift');
      if (card) openEditShift(Number(card.getAttribute('data-id')));
    });

    el.daySum.addEventListener('click', toggleSums);

    el.weekBars.addEventListener('click', function (event) {
      var col = event.target.closest('.week__col');
      if (col) selectDay(col.getAttribute('data-date'));
    });

    // На главном экране выгрузка и загрузка должны говорить на одном языке:
    // рядом стоит «Загрузить», поэтому отдаём таблицу, а не полную копию.
    el.rowExport.addEventListener('click', exportCsv);
    el.rowImport.addEventListener('click', function () { el.importInput.click(); });
    el.backupExport.addEventListener('click', exportCsv);
    el.backupLater.addEventListener('click', remindLater);

    el.importAdd.addEventListener('click', function () { runImport('add'); });
    el.importReplace.addEventListener('click', function () { runImport('replace'); });
    el.importCancel.addEventListener('click', closeDialog);
    el.importDialog.addEventListener('click', function (event) {
      if (event.target === el.importDialog) closeDialog();
    });
    el.btnHide.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleSums();
    });

    el.btnToday.addEventListener('click', function () { setDate(todayISO()); });
    el.btnYesterday.addEventListener('click', function () { setDate(yesterdayISO()); });
    el.btnPickDate.addEventListener('click', pickDate);
    el.date.addEventListener('change', function () {
      if (el.date.value) setDate(el.date.value);
    });

    el.serviceRow.addEventListener('click', openSheet);

    el.sheet.addEventListener('click', function (event) {
      // Затемнение вокруг шторки — закрыть целиком.
      if (event.target === el.sheet) { closeSheet(); return; }

      if (event.target.closest('#sheet-close')) { closeSheet(); return; }
      if (event.target.closest('#sheet-back')) { backToFork(); return; }

      if (event.target.closest('#sheet-pick')) { goStep(SHEET_LIST); return; }
      if (event.target.closest('#sheet-own')) { goStep(SHEET_OWN); return; }

      var swatch = event.target.closest('.swatch[data-color]');
      if (swatch) {
        ownColor = swatch.getAttribute('data-color');
        markSwatches();
        return;
      }

      var row = event.target.closest('.sheet-row');
      if (row && row.getAttribute('data-name')) {
        setService(row.getAttribute('data-name'));
        closeSheet();
      }
    });

    // Полный спектр в шаге «Своя служба»: плашки снимаем, цвет берём свой.
    el.sheet.addEventListener('input', function (event) {
      if (event.target.type !== 'color') return;
      ownColor = event.target.value;
      markSwatches();
    });

    /* Кнопка «назад» на телефоне: со второго шага — на развилку,
       с развилки — закрыть шторку. Форма смены остаётся под ней. */
    window.addEventListener('popstate', function () {
      if (skipPop) { skipPop = false; return; }
      if (el.sheet.hidden) return;

      if (sheetSteps > 0) sheetSteps -= 1;

      if (sheetStep === SHEET_FORK) {
        if (ownTimer) { clearTimeout(ownTimer); ownTimer = null; }
        el.sheet.hidden = true;
        sheetStep = '';
        return;
      }

      showStep(SHEET_FORK);
    });

    el.start.addEventListener('change', function () {
      calcHours();
      jumpToEnd();
    });
    el.end.addEventListener('change', calcHours);

    el.hours.addEventListener('input', function () {
      // Ручная правка отключает пересчёт; пустое поле возвращает автоматику.
      hoursEditedByUser = el.hours.value.trim() !== '';
    });

    el.form.addEventListener('submit', save);

    el.serviceForm.addEventListener('submit', addService);

    el.themes.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-theme-id]');
      if (btn) chooseTheme(btn.getAttribute('data-theme-id'));
    });

    el.servicesList.addEventListener('click', function (event) {
      var swatch = event.target.closest('.swatch[data-color]');
      if (swatch) {
        var owner = swatch.closest('.service').querySelector('[data-swatch]');
        setServiceColor(owner.getAttribute('data-swatch'), swatch.getAttribute('data-color'));
        return;
      }

      var chip = event.target.closest('[data-swatch]');
      if (chip) {
        var name = chip.getAttribute('data-swatch');
        openSwatches = (openSwatches === name) ? null : name;
        renderServices();
        return;
      }

      var remove = event.target.closest('.service__remove');
      if (remove) removeService(remove.getAttribute('data-service'));
    });

    el.servicesList.addEventListener('change', function (event) {
      var custom = event.target.closest('input[data-custom]');
      if (custom) setServiceColor(custom.getAttribute('data-custom'), custom.value);
    });

    el.hideSums.addEventListener('change', function () {
      settings.hideSums = el.hideSums.checked;
      sumsVisible = !settings.hideSums;
      applySums();
      DB.saveSettings(settings);
    });

    el.currency.addEventListener('change', saveMoneySettings);
    el.fuel.addEventListener('change', saveMoneySettings);
    el.btnSettingsDone.addEventListener('click', closeSettings);
    el.btnSettingsBack.addEventListener('click', closeSettings);

    el.btnExportJson.addEventListener('click', exportJson);
    el.btnExportCsv.addEventListener('click', exportCsv);
    el.btnImport.addEventListener('click', function () { el.importInput.click(); });
    el.importInput.addEventListener('change', importFile);
  }

  function showDbError(error) {
    el.dbError.hidden = false;
    el.dbError.textContent =
      'Нет доступа к базе данных: ' + error.message +
      '. Откройте страницу в обычном окне браузера, не в режиме инкогнито.';
  }

  /* ---------- Фоновые знаки ---------- */

  var FREE_TOP = 120;     // полоса под шапку
  var FREE_BOTTOM = 110;  // полоса под кнопку
  var MAX_OVERLAP = 0.25; // больше четверти меньшего знака перекрывать нельзя

  function markBox(m) {
    return { l: m.x - m.over, t: m.y - m.over,
             r: m.x + m.size + m.over, b: m.y + m.size + m.over };
  }

  /** Пара, перекрытая сильнее четверти меньшего из двух. */
  function tooClose(a, b) {
    var ba = markBox(a), bb = markBox(b);
    var dx = Math.min(ba.r, bb.r) - Math.max(ba.l, bb.l);
    var dy = Math.min(ba.b, bb.b) - Math.max(ba.t, bb.t);
    if (dx <= 0 || dy <= 0) return 0;

    var smaller = Math.min((ba.r - ba.l) * (ba.b - ba.t), (bb.r - bb.l) * (bb.b - bb.t));
    var share = dx * dy / smaller;
    return share > MAX_OVERLAP ? Math.min(dx, dy) : 0;
  }

  function clampMark(m, W, H) {
    m.x = Math.min(Math.max(m.x, m.over), W - m.size - m.over);
    m.y = Math.min(Math.max(m.y, FREE_TOP + m.over), H - FREE_BOTTOM - m.size - m.over);
  }

  /** Заданные координаты кое-где сажают знаки друг на друга — разводим. */
  function spreadMarks(marks, W, H) {
    for (var pass = 0; pass < 14; pass++) {
      var moved = false;

      for (var i = 0; i < marks.length; i++) {
        for (var j = i + 1; j < marks.length; j++) {
          var push = tooClose(marks[i], marks[j]);
          if (!push) continue;

          var a = marks[i], b = marks[j];
          var step = push / 2 + 1;
          var ba = markBox(a), bb = markBox(b);
          var dx = Math.min(ba.r, bb.r) - Math.max(ba.l, bb.l);
          var dy = Math.min(ba.b, bb.b) - Math.max(ba.t, bb.t);

          if (dx < dy) {
            var sx = (a.x < b.x) ? -1 : 1;
            a.x += sx * step; b.x -= sx * step;
          } else {
            var sy = (a.y < b.y) ? -1 : 1;
            a.y += sy * step; b.y -= sy * step;
          }
          moved = true;
        }
      }

      for (var k = 0; k < marks.length; k++) clampMark(marks[k], W, H);
      if (!moved) return true;
    }

    for (var x = 0; x < marks.length; x++) {
      for (var y = x + 1; y < marks.length; y++) if (tooClose(marks[x], marks[y])) return false;
    }
    return true;
  }

  /**
   * Доводит положение знаков расчётом. После поворота описанный прямоугольник
   * шире самого знака, поэтому заданные отступы местами резались краем экрана.
   * Вдвигаем внутрь, разводим пары, а если развести не удалось — уменьшаем все
   * знаки на десятую и пробуем снова.
   */
  function fitMarks() {
    var W = document.documentElement.clientWidth;
    var H = document.documentElement.clientHeight;

    // Окно ещё не измерено — считать нечего, пересчёт придёт по событию.
    if (W < 200 || H < 200) return;

    var nodes = document.querySelectorAll('[data-mark]');
    var availH = Math.max(0, H - FREE_TOP - FREE_BOTTOM);
    var shrink = 1;
    var placed = [];

    for (var attempt = 0; attempt < 8; attempt++) {
      placed = [];

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var size = Number(node.getAttribute('data-size'));
        var angle = Number(node.getAttribute('data-angle')) * Math.PI / 180;
        // Поворот расширяет описанный прямоугольник: во столько раз
        var widen = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));

        var scale = Math.min(shrink, W / (size * widen), availH / (size * widen));
        var real = Math.max(24, Math.floor(size * scale));
        var over = (real * widen - real) / 2;

        var left = node.hasAttribute('data-left')
          ? Number(node.getAttribute('data-left'))
          : W - Number(node.getAttribute('data-right')) - real;
        var top = node.hasAttribute('data-top')
          ? Number(node.getAttribute('data-top'))
          : H - Number(node.getAttribute('data-bottom')) - real;

        var mark = { node: node, x: left, y: top, size: real, over: over };
        clampMark(mark, W, H);
        placed.push(mark);
      }

      if (spreadMarks(placed, W, H)) break;
      shrink *= 0.9;
    }

    document.querySelector('.bg').classList.add('is-ready');

    placed.forEach(function (m) {
      m.node.style.width = m.size + 'px';
      m.node.style.height = m.size + 'px';
      m.node.style.left = Math.round(m.x) + 'px';
      m.node.style.top = Math.round(m.y) + 'px';
      m.node.style.right = 'auto';
      m.node.style.bottom = 'auto';
      if (m.node.className.indexOf('bg-mark--ruble') !== -1) {
        m.node.style.fontSize = m.size + 'px';
      }
    });
  }

  fitMarks();
  window.addEventListener('resize', fitMarks);
  // Страховка: если расчёт почему-то не дошёл, фон всё равно покажем.
  window.addEventListener('load', function () {
    document.querySelector('.bg').classList.add('is-ready');
  });
  window.addEventListener('orientationchange', fitMarks);

  // Пересчитываем, когда окно получит настоящий размер: первый расчёт может
  // прийтись на момент, когда страница ещё нулевой ширины.
  if (window.ResizeObserver) {
    new ResizeObserver(fitMarks).observe(document.documentElement);
  }

  /* ---------- Обновление версии ---------- */

  /**
   * Приложение кэширует само себя, поэтому новая версия иначе ждала бы,
   * пока человек закроет все вкладки. Показываем полоску и обновляем по кнопке.
   */
  function offerUpdate(worker) {
    el.updateBar.hidden = false;
    el.btnUpdate.onclick = function () {
      el.btnUpdate.disabled = true;
      worker.postMessage('skip-waiting'); // дальше сработает controllerchange
    };
  }

  // Регистрация переехала в шапку документа: она не должна зависеть от того,
  // доехал ли этот файл. Здесь остаётся только полоска обновления, поэтому
  // берём уже готовую регистрацию, а не заводим новую.
  if ('serviceWorker' in navigator && location.protocol !== 'file:' &&
      navigator.serviceWorker.getRegistration) {
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return;
      // Первая установка обновлением не считается: управляющего воркера ещё нет.
      if (!navigator.serviceWorker.controller) return;

      if (reg.waiting) offerUpdate(reg.waiting);

      reg.addEventListener('updatefound', function () {
        var incoming = reg.installing;
        if (!incoming) return;
        incoming.addEventListener('statechange', function () {
          if (incoming.state === 'installed') offerUpdate(incoming);
        });
      });
    }).catch(function () {});

    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  DB.open()
    .then(DB.getSettings)
    .then(function (loaded) {
      settings = loaded;
      sumsVisible = settings.hideSums === false;
      /* Схему шапка уже поставила из зеркала; здесь выравниваем её по базе —
         на случай, если зеркала не было или оно разошлось с настройками. */
      applyTheme(settings.theme || 'glubina');
      bind();

      if (el.appVersion && typeof APP_VERSION !== 'undefined') {
        el.appVersion.textContent = 'Версия ' + APP_VERSION;
      }

      return refreshList().then(function () {
        // Снимаем сторожа: экран отрисован, зависания нет.
        if (window.APP_READY) window.APP_READY();
      });
    })
    .catch(function (error) {
      settings = DB.DEFAULT_SETTINGS;
      showDbError(error);
    });
})();
