/* ============================================================
   EPIC MODE — bus.js
   اتوبوس رخدادها (سبک و سبک‌تر)
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const subs = new Map();   // evt -> Set<fn>
  const bus = {
    on(evt, fn) {
      if (!subs.has(evt)) subs.set(evt, new Set());
      subs.get(evt).add(fn);
      return () => bus.off(evt, fn);
    },
    off(evt, fn) { subs.get(evt)?.delete(fn); },
    emit(evt, payload) {
      subs.get(evt)?.forEach(fn => {
        try { fn(payload); } catch (e) { console.error('[bus]', evt, e); }
      });
    },
  };
  window.EPIC.bus = bus;
})();
