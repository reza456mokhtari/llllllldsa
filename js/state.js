/* ============================================================
   EPIC MODE — state.js
   کاشی ذخیره‌سازی: وضعیت، ذخیرهٔ خودکار اندروید/دسکتاپ
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const S = window.EPIC;
  const KEY = 'epicmode.planner.v1';

  const state = {
    settings: { name: 'خلبان', theme: 'inferno', scale: 100, haptics: true, attacks: true, clockLine: true },
    entries: [],
    meta: { since: null, lastOpen: null },
  };

  const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function nowIso() { return S.jad.todayIso(); }
  function nowStamp() { return Date.now(); }

  function seedToday(iso) {
    const t = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return [
      // مأموریت‌های امروز
      { id: uid(), type: 'event', title: 'مذاکرهٔ پروژهٔ خارچین', start: t(9, 30), dur: 45, kind: 'meet', note: 'دفتر مرکزی — اتاق ۳', date: iso },
      { id: uid(), type: 'event', title: 'فرصت عمیق: ماژول پردازش', start: t(11, 0), dur: 90, kind: 'dep', note: 'بدون مزاحمت — هدست روشن', date: iso },
      { id: uid(), type: 'event', title: 'تمرین قدرتی + کشش', start: t(17, 30), dur: 60, kind: 'fit', note: '', date: iso },
      // کارها
      { id: uid(), type: 'task', title: 'نوشتن گزارش هفتگی برای تیم', prio: 'high', done: false, note: '', date: iso, anchor: true, doneDate: null, ts: nowStamp() },
      { id: uid(), type: 'task', title: 'پیگیری فاکتور شمارهٔ ۴۴۱', prio: 'mid', done: true, note: '', date: null, anchor: false, doneDate: iso, ts: nowStamp() },
      { id: uid(), type: 'task', title: 'بازتنظیم بودجهٔ ماه', prio: 'low', done: false, note: '', date: null, anchor: false, doneDate: null, ts: nowStamp() },
      // عادت‌ها
      { id: uid(), type: 'habit', title: '۸ لیوان آب', days: [0, 1, 2, 3, 4, 5, 6], log: { [iso]: true }, ts: nowStamp() },
      { id: uid(), type: 'habit', title: '۳۰ دقیقه مطالعهٔ عمیق', days: [0, 1, 2, 3, 4, 5], log: { [S.jad.addDaysIso(iso, -1)]: true }, ts: nowStamp() },
      { id: uid(), type: 'habit', title: 'تراز شب: ۲۳:۳۰ روی تختهٔ خواب', days: [0, 1, 2, 3, 4, 5, 6], log: {}, ts: nowStamp() },
      // یادداشت‌ها
      { id: uid(), type: 'note', title: 'قانون اتاق فرمان', body: 'هر روز فقط یک مأموریت اصلی. بقیه‌اش پاداش است، نه بار.\nاگر فقط یک چیز انجام شود، همان باید آن مأموریت باشد.', pinned: true, ts: nowStamp() },
      { id: uid(), type: 'note', title: 'ایدهٔ ویجت زنده', body: 'شعلهٔ ریز صفحه‌نمایش: هرچه کارها دیرتر، شعلهٔ کوچک‌تر.\nشبی پیروزی امروز را می‌سوزاند؛ امتحانش نکن.', pinned: false, ts: nowStamp() },
    ];
  }

  const store = {
    state,

    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (_) { /* محرم */ }
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            state.settings = { ...state.settings, ...(parsed.settings || {}) };
            state.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
            state.meta = { ...state.meta, ...(parsed.meta || {}) };
          }
        } catch (_) { /* تعمیر: داده فاسد — ریست */ }
      }
      if (!state.entries?.length && !state.meta.since) {
        state.meta.since = nowIso();
        state.entries = seedToday(nowIso());
        store.save();
      }
      /* تعمیر: زمان‌های قدیمی با ارقام فارسی را به ارقام لاتین (سازگار با input=time) تبدیل کن */
      state.entries.forEach(e => {
        if (e.type === 'event' && typeof e.start === 'string') e.start = S.en(e.start);
      });
      return state;
    },

    save: S.debounce(() => {
      try { localStorage.setItem(KEY, JSON.stringify(store.state)); } catch (_) { }
      S.bus.emit('save');
    }, 180),

    /* --- ریست کامل --- */
    wipe() { try { localStorage.removeItem(KEY); } catch (_) { } state.entries = []; state.meta = { since: nowIso(), lastOpen: null }; },

    /* --- بایگانی/بازیابی --- */
    export() { return JSON.stringify({ app: 'epicmode', ver: 1, at: new Date().toISOString(), state: store.state }, null, 2); },
    ingest(json) {
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object' || !Array.isArray(data.state?.entries)) throw new Error('bad data');
      state.entries = data.state.entries;
      state.settings = { ...state.settings, ...(data.state.settings || {}) };
      state.meta = { ...state.meta, ...(data.state.meta || {}) };
      store.save();
      return true;
    },

    /* --- آیتم‌ها --- */
    byId(id) { return state.entries.find(e => e.id === id) || null; },
    insert(item) { item.id = item.id || uid(); item.ts = nowStamp(); state.entries.push(item); store.save(); return item; },
    update(id, patch) {
      const it = store.byId(id);
      if (!it) return null;
      Object.assign(it, patch, { touched: nowStamp() });
      store.save();
      return it;
    },
    remove(id) {
      const i = state.entries.findIndex(e => e.id === id);
      if (i < 0) return;
      state.entries.splice(i, 1);
      store.save();
    },
    reorder(orderedIds) {
      // ترتیب انبار: بدون مصرف بقیهٔ انواع
      state.entries.sort((a, b) => {
        const ia = orderedIds.indexOf(a.id), ib = orderedIds.indexOf(b.id);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return (a.ts || 0) - (b.ts || 0);
      });
      store.save();
    },

    /* --- پرس‌وجوهای آماده --- */
    q: {
      tasks() { return state.entries.filter(e => e.type === 'task' && !e.done); },
      doneTasks() { return state.entries.filter(e => e.type === 'task' && e.done); },
      events() { return state.entries.filter(e => e.type === 'event'); },
      habits() { return state.entries.filter(e => e.type === 'habit'); },
      notes() { return state.entries.filter(e => e.type === 'note'); },
    },
  };

  window.EPIC.store = store;
  Object.defineProperty(window.EPIC, 'DB', { get: () => store.state });
})();
