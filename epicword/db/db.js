/* ============================================================
   EpicWord — db/db.js · the "db folder" of the app
   Chronicles live in IndexedDB 'epicword-db' / store 'chronicles'
   (large texts survive quota; localStorage keeps only indexes).
   Fallback: in-memory map (private mode) — never throws.
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';
  const DB_NAME = 'epicword-db', STORE = 'chronicles';
  let dbp = null, mem = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      try {
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains(STORE)) {
            const st = db.createObjectStore(STORE, { keyPath: 'id' });
            st.createIndex('ts', 'ts');
          }
        };
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => reject(rq.error || new Error('idb-open'));
      } catch (e) { reject(e); }
    }).catch(e => { dbp = null; mem = mem || new Map(); throw e; });
    return dbp;
  }
  async function tx(mode) { const db = await open(); return db.transaction(STORE, mode).objectStore(STORE); }
  const wrap = rq => new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });

  async function put(rec) {
    try { const st = await tx('readwrite'); await wrap(st.put(rec)); }
    catch (e) { (mem = mem || new Map()).set(rec.id, rec); }
    return rec;
  }
  async function get(id) {
    try { const st = await tx('readonly'); return (await wrap(st.get(id))) || null; }
    catch (e) { return (mem = mem || new Map()).get(id) || null; }
  }
  async function all() {
    try { const st = await tx('readonly'); const out = await wrap(st.getAll()); return out || []; }
    catch (e) { return Array.from((mem = mem || new Map()).values()); }
  }
  async function del(id) {
    try { const st = await tx('readwrite'); await wrap(st.delete(id)); }
    catch (e) { if (mem) mem.delete(id); }
  }
  async function clear() {
    try { const st = await tx('readwrite'); await wrap(st.clear()); }
    catch (e) { if (mem) mem.clear(); }
  }
  async function count() { return (await all()).length; }

  W.DB = { put, get, all, del, clear, count, STORE, NAME: DB_NAME };
})();
