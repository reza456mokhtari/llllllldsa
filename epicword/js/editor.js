/* ============================================================
   EpicWord — editor.js · contenteditable document engine
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';

  const $ = W.$, $$ = W.$$;
  const FONT_LADDER = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48', '72'];
  const SIZE_TO_HTML = { '8': 1, '9': 1, '10': 2, '11': 2, '12': 3, '14': 4, '16': 4, '18': 5, '20': 5, '22': 5, '24': 6, '28': 6, '32': 6, '36': 7, '48': 7, '72': 7 };

  const api = {
    sheet: null,
    title: null,
    init(sheet, titleInput) {
      api.sheet = sheet; api.title = titleInput;
      try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
      sheet.addEventListener('input', () => {
        W.store.save();
        W.status.update(counts());
        W.ai && W.ai.noteDirty();
      });
      sheet.addEventListener('keydown', e => {
        if (e.key === 'Tab') { e.preventDefault(); api.exec(e.shiftKey ? 'outdent' : 'indent'); }
      });
      document.addEventListener('selectionchange', W.debounce(() => { W.ribbon && W.ribbon.reflect(); }, 120));
      titleInput.addEventListener('input', () => { W.store.state.doc.title = titleInput.value; W.store.save(); });
    },
    getHTML() { return api.sheet.innerHTML; },
    setHTML(h, keepTitle) {
      api.sheet.innerHTML = h || '<p><br></p>';
      if (!keepTitle) { api.title.value = W.store.state.doc.title || 'Untitled Chronicle'; }
      W.status.update(counts());
    },
    text() { return api.sheet.innerText || ''; },

    exec(cmd, val) {
      api.sheet.focus();
      try { document.execCommand('styleWithCSS', false, ['fontName'].indexOf(cmd) === -1 ? false : true); } catch (e) {}
      document.execCommand(cmd, false, val || null);
      W.store.save(); W.status.update(counts()); W.ribbon && W.ribbon.reflect();
      toastQuiet(cmd);
      return true;
    },
    applyFont(fam) { api.exec('fontName', fam); },
    applySize(pt) { api.exec('fontSize', String(SIZE_TO_HTML[String(pt)] || 3)); },
    applyLineHeight(v) {
      const r = selectedBlock(); if (!r) return;
      r.style.lineHeight = String(v); W.store.save();
    },
    clearFormat() {
      api.sheet.focus(); document.execCommand('removeFormat');
      const r = selectedBlock(); if (r) { r.style.lineHeight = ''; }
      W.store.save(); W.ribbon && W.ribbon.reflect();
      W.toast('Formatting cleared', 'ok');
    },
    caseTransform(kind) {
      const sel = (typeof getSelection === 'function') ? getSelection() : window.getSelection();
      if (!sel || sel.isCollapsed) { W.toast('Select text first', 'warnc'); return; }
      const t = sel.toString();
      const out = kind === 'upper' ? t.toUpperCase() : kind === 'lower' ? t.toLowerCase()
        : t.toLowerCase().replace(/(^|[\s"“'(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
      document.execCommand('insertText', false, out);
      W.store.save();
    },
    insertHTML(html) {
      api.sheet.focus();
      document.execCommand('insertHTML', false, html);
      W.store.save(); W.status.update(counts());
    },

    /* ---------- find & replace ---------- */
    find: null,
  };

  function selectedBlock() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let n = sel.getRangeAt(0).startContainer;
    while (n && n !== api.sheet) {
      if (n.nodeType === 1 && /^(P|H1|H2|H3|H4|LI|BLOCKQUOTE|PRE|DIV)$/.test(n.tagName)) return n;
      n = n.parentNode;
    }
    return null;
  }

  /* find state lives on api.find */
  function startFind(q) {
    api.clearHi();
    const hits = [];
    if (!q.trim() || !api.sheet) return hits;
    const walker = document.createTreeWalker(api.sheet, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const needle = q.toLowerCase();
    let pending = 0;
    nodes.forEach(nd => {
      const hay = nd.nodeValue.toLowerCase();
      let idx = hay.indexOf(needle);
      while (idx !== -1) {
        const r = document.createRange(); r.setStart(nd, idx); r.setEnd(nd, idx + needle.length);
        try {
          const m = document.createElement('mark'); m.className = 'srchite'; r.surroundContents(m); hits.push(m);
        } catch (e) { pending++; }
        idx = hay.indexOf(needle, idx + needle.length);
      }
    });
    if (pending) {
      W.toast(pending + ' match' + (pending > 1 ? 'es' : '') + ' flagged but not highlighted (cross-blocking text)', 'warnc');
    }
    return hits;
  }

  api.clearHi = () => {
    $$('mark.srchite', api.sheet).forEach(m => {
      const p = m.parentNode; if (!p) return;
      m.replaceWith(document.createTextNode(m.textContent)); p.normalize();
    });
    W.findHits = []; W.findCur = -1;
  };

  function normalHits() { return $$('mark.srchite', api.sheet); }

  api.find = {
    search(q) {
      const hits = startFind(q);
      W.findHits = hits; W.findCur = hits.length ? 0 : -1;
      show(hits, 0);
      return hits.length;
    },
    next() { const h = W.findHits || []; if (!h.length) return; W.findCur = (W.findCur + 1) % h.length; show(h, W.findCur); },
    prev() { const h = W.findHits || []; if (!h.length) return; W.findCur = (W.findCur - 1 + h.length) % h.length; show(h, W.findCur); },
    replaceOne(repl) {
      const h = W.findHits || [];
      if (W.findCur < 0 || !h[W.findCur]) return 0;
      const m = h[W.findCur]; const p = m.parentNode;
      m.replaceWith(document.createTextNode(repl));
      if (p) p.normalize();
      return 1;
    },
    replaceAll(q, repl) {
      let n = 0; const nodes = [];
      const walker = document.createTreeWalker(api.sheet, NodeFilter.SHOW_TEXT, { acceptNode: x => 1 });
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const needle = q; nodes.forEach(nd => {
        if (nd.nodeValue.indexOf(needle) === -1) return;
        n += nd.nodeValue.split(needle).length - 1;
        nd.nodeValue = nd.nodeValue.split(needle).join(repl);
      });
      W.store.save(); W.status.update(counts());
      return n;
    },
    clear() { api.clearHi(); },
  };

  function show(hits, i) {
    hits.forEach((m, k) => m.classList.toggle('cur', k === i));
    const m = hits[i];
    if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- find dialog ---------- */
  api.findDialog = function (mode) {
    let dlg, qInp, rInp, statEl;
    const grid = W.el('div', {},
      W.el('div', { class: 'frow' }, W.el('label', { text: 'Find what' }), qInp = W.el('input', { type: 'text', placeholder: 'search text…' })),
      W.el('div', { class: 'frow' }, W.el('label', { text: 'Replace with' }), rInp = W.el('input', { type: 'text', placeholder: 'replacement…' })),
      W.el('div', { class: 'fhint', text: 'Enter = find next · matches highlight on the WRITE sheet' }),
      statEl = W.el('div', { class: 'fhint', style: { marginTop: '8px', fontWeight: 600 } }),
    );

    const doSearch = () => {
      api.clearHi();
      const n = api.find.search(qInp.value);
      statEl.innerHTML = n ? '<span class="note-good">' + n + ' match' + (n > 1 ? 'es' : '') + ' lit</span>' : '<span class="note-bad">no match</span>';
    };
    qInp.addEventListener('input', W.debounce(() => { if (qInp.value.trim()) api.clearHi(), statEl.textContent = 'type · press Find to light matches'; }, 600));
    qInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
    rInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

    dlg = W.dialog({
      title: 'Find & Replace', icon: 'find', body: grid, wide: false,
      buttons: [
        { label: 'Find next', onClick: () => { api.find.next(); return true; } },
        { label: 'Replace', onClick: () => { const n = api.find.replaceOne(rInp.value); statEl.textContent = n ? 'replaced 1' : 'nothing here'; return true; } },
        { label: 'Replace all', onClick: () => { if (!qInp.value) return true; const n = api.find.replaceAll(qInp.value, rInp.value); statEl.innerHTML = '<span class="note-good">replaced ' + n + ' occurrence' + (n === 1 ? '' : 's') + '</span>'; api.clearHi(); return true; } },
      ],
      footNote: 'Esc closes · highlights persist until replaced or re-searched',
      onClose: () => { /* keep highlights? clear */ },
    });
    qInp.focus();
  };

  /* ---------- welcome / new doc ---------- */
  function counts() {
    const t = api.text().trim();
    const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    const chars = api.text().length;
    const paras = $$('p, h1, h2, h3, li, blockquote, pre', api.sheet).length;
    return { words, chars, paras };
  }
  api.counts = counts;

  function toastQuiet(cmd) { /* silent for common typing cmds */ }
  W.editor = api;
})();
