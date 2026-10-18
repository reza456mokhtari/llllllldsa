/* ============================================================
   EpicWord — app.js · boot, tabs, status bar, dialogs, hotkeys
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';
  const $ = W.$, $$ = W.$$;
  let curTab = 'ai', curSub = 'write';
  let painter = null;

  /* ---------------- tab system ---------------- */
  const tab = {
    go(id, sub) {
      if (id !== undefined) curTab = id;
      if (sub) curSub = sub;
      ['todo', 'ai', 'table'].forEach(k => { const p = document.getElementById('panel-' + k); if (p) p.hidden = k !== curTab; });
      $$('.wtab').forEach(t2 => t2.classList.toggle('on', t2.dataset.tab === curTab));
      if (curTab === 'ai') tab.sub(curSub);
      if (curTab === 'todo') W.todo.render();
      if (curTab === 'table') W.table.render();
      if (curTab === 'ai' && W.editor.sheet && curSub === 'write') setTimeout(() => W.editor.sheet.focus({ preventScroll: true }), 30);
      W.status.update();
      W.store.save();
    },
    sub(id) {
      curSub = id;
      const pw = document.getElementById('pane-w'), pr = document.getElementById('pane-r');
      pw.hidden = id !== 'write'; pr.hidden = id !== 'read';
      $$('.aitsub').forEach(b => b.classList.toggle('on', b.dataset.sub === id));
      if (id === 'read') W.ai.chip(!!W.store.state.ai.ckpts.length);
    },
    cur: () => curTab,
    curSub: () => curSub,
  };
  W.tab = tab;

  function renderTabs() {
    const strip = document.getElementById('tabstrip');
    strip.innerHTML = '';
    const mk = (id, icon, label, countFn) => {
      const b = W.el('button', { class: 'wtab' + (curTab === id ? ' on' : ''), type: 'button', 'data-tab': id }, W.icon(icon, 14), label);
      if (countFn) b.append(W.el('span', { class: 'cnt', text: countFn() }));
      b.addEventListener('click', () => tab.go(id));
      return b;
    };
    strip.append(
      mk('todo', 'grid', 'TODO', () => { return W.store.state.todo.filter(x => !x.done).length; }),
      mk('ai', 'quill', 'AI WORKSPACE', null),
      mk('table', 'table', 'DATATABLE', () => { return W.store.state.dt.rows.length; }),
      W.el('div', { class: 'wspace' }),
      W.el('div', { class: 'wtabrid' }, W.icon('info', 12), ' WRITE drafts → SAVE & PROCESS → READ chronicle · ENGINE: ' + (W.store.state.ai.key ? 'GLM · ' + W.store.state.ai.model : 'LOCAL EMBER SCRIBE')));
  }

  /* ---------------- status bar ---------------- */
  const status = {
    update(s) {
      const bar = document.getElementById('statusbar');
      if (!bar) return;
      if (!W.store.state.prefs.statusbar) { bar.style.display = 'none'; return; }
      bar.style.display = '';
      const zoom = W.store.state.prefs.zoom || 100;
      const doc = W.editor.sheet ? W.editor.counts() : { words: 0, chars: 0, paras: 0 };
      const todoN = W.store.state.todo.filter(x => !x.done).length;
      bar.innerHTML = '';
      bar.append(
        W.el('span', { class: 'sit' }, W.icon('file', 13), W.el('b', { text: 'Page 1 / 1' })),
        W.el('span', { class: 'sit' }, W.icon('quill', 13), W.el('b', { text: String(doc.words) }), ' words · ' + doc.chars + ' chars'),
        W.el('span', { class: 'sit' }, W.icon('grid', 13), W.el('b', { text: String(todoN) }), ' tasks open'),
        W.el('span', { class: 'sit' }, W.icon(rowLangIcon(), 13), 'Engine: ' + (W.store.state.ai.key ? W.store.state.ai.model : 'offline scribe')),
        (() => {
          const z = W.el('div', { class: 'szoom' });
          const minus = W.el('button', { class: 'sbtn', title: 'Zoom out' }, '−');
          const plus = W.el('button', { class: 'sbtn', title: 'Zoom in' }, '+');
          const rng = W.el('input', { type: 'range', min: '60', max: '160', step: '5', value: String(zoom) });
          const pct = W.el('span', { text: zoom + '%' });
          rng.addEventListener('input', () => {
            const z = Number(rng.value);
            W.store.state.prefs.zoom = z; W.store.save();
            app.applyZoom(); pct.textContent = z + '%';
          });
          minus.addEventListener('click', () => W.app.zoom(-10));
          plus.addEventListener('click', () => W.app.zoom(10));
          z.append(minus, W.el('span', { class: 'rg' }), rng, W.el('span', { class: 'rg' }), plus, pct);
          return z;
        })());
    },
  };
  function rowLangIcon() { return 'globe'; }
  W.status = { update: status.update };

  /* ---------------- app-level actions (W.app) ---------------- */
  const app = {
    cur: () => curTab,

    fileNew: async () => {
      const ok = await W.confirmBox('New document', 'Start a fresh WRITE canvas? (A checkpoint of the current draft is kept.)', 'New');
      if (!ok) return;
      W.editor.clearHi();
      const sheet = W.editor.sheet;
      sheet.innerHTML = '<p><br></p>';
      W.store.state.doc.title = 'Untitled Chronicle';
      const st = document.querySelector('.wtitle'); if (st) st.value = 'Untitled Chronicle';
      W.store.save(); W.status.update();
      W.toast('New blank chronicle — the engine awaits', 'ok');
    },

    fileSave: () => {
      W.store.flush();
      if (tab.cur() === 'ai') { W.ai.saveAndProcess(); return; }
      W.toast('Workspace saved locally', 'ok');
    },

    fileOpen: () => W.pickFile('fileOpen', files => {
      const f = files[0];
      const fr = new FileReader();
      fr.onload = () => {
        const txt = String(fr.result || '');
        if (/\.csv$/i.test(f.name)) { W.table.importCSV(f); tab.go('table'); W.toast('CSV into DATATABLE', 'ok'); return; }
        if (/\.html?$/i.test(f.name)) {
          const clean = txt.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/ on\w+="[^"]*"/gi, '').replace(/<\/?(body|head|!DOCTYPE)[^>]*>/gi, '');
          const m = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          W.editor.setHTML(m ? m[1] : clean);
        } else {
          const lines = txt.split(/\n/).map(W.esc);
          W.editor.setHTML(lines.map(l => l.trim() ? '<p>' + l + '</p>' : '<p><br></p>').join(''));
        }
        tab.go('ai', 'write');
        W.toast('Opened «' + f.name + '»', 'ok');
      };
      fr.readAsText(f);
    }),

    saveDocAs() {
      const title = W.store.state.doc.title || 'untitled';
      const html = '<!doctype html><meta charset="utf-8"><title>' + W.esc(title) + '</title>' +
        '<style>body{max-width:760px;margin:40px auto;font:15px/1.7 Georgia,serif;color:#222}h1,h2,h3{font-family:Cinzel,Georgia,serif}blockquote{border-left:3px solid #a4582c;padding:8px 16px;color:#6a4a29;background:#faf3ea;margin:14px 0}pre{background:#211c17;color:#d8cfbd;padding:12px}hr{border:0;border-top:2px solid #a4582c}</style>' +
        (W.editor.sheet ? W.editor.sheet.innerHTML : W.store.state.doc.html);
      W.download(title.replace(/\s+/g, '_') + '.html', html, 'text/html');
    },
    saveDocTxt() {
      const title = W.store.state.doc.title || 'untitled';
      W.download(title.replace(/\s+/g, '_') + '.txt', W.editor.sheet ? W.editor.sheet.innerText : '', 'text/plain');
    },

    zoom(d) { app.zoomTo((W.store.state.prefs.zoom || 100) + d); },
    zoomTo(z) {
      z = Math.max(60, Math.min(160, Math.round(z / 5) * 5));
      W.store.state.prefs.zoom = z; W.store.save();
      app.applyZoom(); W.status.update();
    },
    applyZoom() {
      document.documentElement.style.setProperty('--zoom', (W.store.state.prefs.zoom || 100) / 100);
      ['#panel-ai .wwrap', '#panel-ai .rrap'].forEach(sel => {}); /* zoom handled inline below */
      const z = (W.store.state.prefs.zoom || 100) / 100;
      ['#panel-ai', '#panel-todo .twrap', '#panel-table .dtwrap'].forEach(sel => {
        const node = document.querySelector(sel);
        if (node) node.style.zoom = z;
      });
    },

    toggleRibbon() {
      const r = document.getElementById('ribbon');
      r.classList.toggle('min');
      W.store.state.prefs.ribbonMin = r.classList.contains('min');
      W.store.save();
    },
    toggleStatus() {
      W.store.state.prefs.statusbar = !W.store.state.prefs.statusbar;
      W.store.save(); W.status.update();
    },
    toggleTheme() {
      const t = W.store.state.prefs.theme === 'dark' ? 'office' : 'dark';
      W.store.state.prefs.theme = t; W.store.save();
      document.documentElement.dataset.theme = t;
      W.menubar.render();
      W.toast(t === 'dark' ? 'Dark chrome engaged' : 'Office chrome restored', 'ok');
    },

    /* ---------- insert dialogs ---------- */
    insertTable() {
      let rows = 3, cols = 3, grid = null;
      const pick = W.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(8,30px)', gap: '5px', marginBottom: '12px' } });
      const mk = n => {
        pick.innerHTML = '';
        for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) {
          const b = W.el('button', { type: 'button', style: { width: '30px', height: '30px', border: '1px solid #ccd3dc', borderRadius: '4px', background: r <= n.r && c <= n.c ? '#cfe0f5' : '#fff' } });
          b.addEventListener('mouseenter', () => mk({ r, c }));
          b.addEventListener('click', () => {
            let html = '<table><tbody>';
            for (let rr = 0; rr < n.r; rr++) { html += '<tr>'; for (let cc = 0; cc < n.c; cc++) html += '<td></td>'; html += '</tr>'; }
            W.editor.insertHTML(html + '</tbody></table><p><br></p>');
            dlg.close();
          });
          pick.append(b);
        }
      };
      mk({ r: rows, c: cols });
      const dlg = W.dialog({ title: 'Insert Table', icon: 'table', wide: false, body: W.el('div', {}, W.el('div', { class: 'fhint', text: 'Hover cells, click to insert' }), pick), footNote: 'Esc closes', noFoot: true });
    },
    insertImage() {
      W.pickFile('fileImg', files => {
        const f = files[0]; const fr = new FileReader();
        fr.onload = () => { W.editor.insertHTML('<img src="' + fr.result + '" alt="' + W.esc(f.name) + '" style="max-width:100%"><p><br></p>'); W.toast('Image set into the ink', 'ok'); };
        fr.readAsDataURL(f);
      });
    },
    insertLink() {
      let inp;
      const d = W.dialog({
        title: 'Insert Link', icon: 'link2', body: (() => {
          const box = W.el('div');
          box.append(W.el('div', { class: 'frow' }, W.el('label', { text: 'URL' }), inp = W.el('input', { type: 'text', placeholder: 'https://…', style: { width: '100%' } })));
          return box;
        })(),
        buttons: [{ label: 'Insert', onClick: () => {
          const url = inp.value.trim();
          if (!url) { W.toast('Empty URL', 'warnc'); return true; }
          const href = /^(https?:|mailto:)/i.test(url) ? url : 'https://' + url;
          W.editor.insertHTML('<a href="' + W.esc(href) + '" target="_blank" rel="noopener">' + W.esc(href) + '</a>');
        } }],
      });
    },
    insertSymbol() {
      const syms = ['§','†','‡','•','◆','★','✦','☾','⚔','Ω','Æ','æ','⁂','✠','❦','⸸','👁'];
      let cur = '';
      const pick = W.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(8,40px)', gap: '6px' } });
      let chosen = W.el('input', { type: 'text', placeholder: '…or type any glyph', style: { width: '100%', marginTop: '10px' } });
      pick.append(...syms.map(s => {
        const b = W.el('button', { type: 'button', style: { height: '38px', fontSize: '16px', border: '1px solid #ccd3dc', borderRadius: '5px' }, text: s });
        b.addEventListener('click', () => { cur = s; chosen.value = s; });
        return b;
      }));
      const dlg = W.dialog({
        title: 'Insert Symbol', icon: 'omega', body: W.el('div', {}, pick, chosen),
        buttons: [{ label: 'Insert', onClick: () => { const c = chosen.value.trim(); if (c) { W.editor.insertHTML(c); } } }],
      });
    },
    spacingMenu(btnEl) {
      const m = W.el('div', { class: 'dmenu' });
      [1, 1.15, 1.5, 2, 2.5].forEach(v => {
        const r = W.el('div', { class: 'drow' }, W.el('span', { text: String(v) + ' line-height' }));
        r.addEventListener('click', () => { W.editor.applyLineHeight(v); m.remove(); document.removeEventListener('mousedown', out, true); });
        m.append(r);
      });
      const out = e => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', out, true); } };
      document.addEventListener('mousedown', out, true);
      const rr = btnEl ? btnEl.getBoundingClientRect() : { left: 400, bottom: 220 };
      m.style.left = Math.min(rr.left, window.innerWidth - 200) + 'px'; m.style.top = (rr.bottom + 3) + 'px';
      document.body.append(m);
    },
    paintFormat() {
      const sel = window.getSelection();
      if (painter === null) {
        let n = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
        while (n && n !== W.editor.sheet && n.nodeType !== 1) n = n.parentNode;
        const fromBlock = n && n.nodeType === 1 ? n.closest('p,h1,h2,h3,h4,blockquote,pre,li') : null;
        painter = {
          block: fromBlock ? fromBlock.tagName : 'P',
          align: fromBlock ? getComputedStyle(fromBlock).textAlign : 'left',
          lineHeight: fromBlock ? getComputedStyle(fromBlock).lineHeight : '',
        };
        if (sel && sel.rangeCount && !sel.isCollapsed) {
          const probe = sel.getRangeAt(0).cloneContents();
          const tmp = W.el('span'); tmp.append(probe);
          painter.span = { font: getComputedStyle(tmp).fontFamily.replace(/"/g, '').split(',')[0], size: getComputedStyle(tmp).fontSize, color: getComputedStyle(tmp).color, bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), under: document.queryCommandState('underline') };
        }
        W.toast('Format painted — land it with a click inside the sheet', 'ok', 2600);
        return;
      }
      /* second click: paste the paint */
      if (painter.block) W.editor.exec('formatBlock', '<' + painter.block.toLowerCase() + '>');
      if (painter.span) {
        W.editor.applyFont(painter.span.font || 'Calibri');
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, painter.span.color);
        document.execCommand('styleWithCSS', false, false);
        if (painter.span.bold) W.editor.exec('bold');
        if (painter.span.italic) W.editor.exec('italic');
        if (painter.span.under) W.editor.exec('underline');
      }
      if (painter.lineHeight) { const blk = (() => { let n2 = window.getSelection().getRangeAt(0).startContainer; while (n2 && n2 !== W.editor.sheet && n2.nodeType !== 1) n2 = n2.parentNode; return n2 && n2.nodeType === 1 ? n2.closest('p,h1,h2,h3,h4,blockquote,pre,li') : null; })(); if (blk) blk.style.lineHeight = painter.lineHeight; }
      painter = null;
      W.toast('Format landed', 'ok');
    },

    fontDialog() {
      let sel;
      const FAM = ['Calibri', 'Cambria', 'Georgia', 'Garamond', 'Times New Roman', 'Courier New', 'Consolas', 'Segoe UI', 'Arial', 'Verdana'];
      const grid = W.el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' } });
      FAM.forEach(f => {
        const b = W.el('button', { class: 'gbtn', type: 'button', style: { fontFamily: f, fontSize: '13px' }, text: f });
        b.addEventListener('click', () => { sel = f; W.editor.applyFont(f); dlg.close(); });
        grid.append(b);
      });
      const dlg = W.dialog({ title: 'Font Family', icon: 'font', body: grid, noFoot: true, footNote: 'Esc closes' });
    },
    colorDialog(cmd) {
      const PAL2 = ['#000000', '#20252c', '#5a6472', '#185abd', '#0b6cbe', '#107c3e', '#5c7a99', '#b3620b', '#c0392b', '#9932cc', '#8b4513', '#e2803f', '#f1c15d', '#ffffff'];
      const grid = W.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,34px)', gap: '6px' } });
      PAL2.forEach(c => {
        const b = W.el('button', { type: 'button', style: { width: '30px', height: '30px', background: c, border: '1px solid rgba(0,0,0,.2)', borderRadius: '5px' } });
        b.addEventListener('click', () => { W.editor.exec(cmd === 'foreColor' ? 'foreColor' : 'hiliteColor', c); dlg.close(); });
        grid.append(b);
      });
      const clear = W.el('button', { class: 'gbtn', type: 'button' }, 'No color');
      clear.addEventListener('click', () => { W.editor.exec(cmd === 'foreColor' ? 'foreColor' : 'hiliteColor', cmd === 'foreColor' ? '#000000' : 'transparent'); dlg.close(); });
      const dlg = W.dialog({ title: cmd === 'foreColor' ? 'Text Color' : 'Highlight', icon: cmd === 'foreColor' ? 'droplet' : 'highlight', wide: false, body: W.el('div', {}, grid, W.el('div', { style: { marginTop: '10px' } }, clear)), noFoot: true });
    },
    wordCount() {
      const c = W.editor.counts();
      W.dialog({
        title: 'Word Count', icon: 'info',
        body: '<table style="border-collapse:collapse;width:100%">' +
          ['Paragraphs', 'Words', 'Characters'].map((k, i) =>
            '<tr><td style="padding:5px 14px 5px 0; color:#5a6472">' + k + '</td><td><b>' + [c.paras, c.words, c.chars][i] + '</b></td></tr>').join('') +
          '</table>',
        footNote: 'Live count rides the status bar.',
      });
    },

    renderAll() {
      W.menubar.render();
      W.ribbon.render();
      renderTabs();
      /* build panes */
      document.getElementById('pane-w').append(W.ai.buildWrite());
      W.editor.init(document.getElementById('docsheet'), document.querySelector('.wtitle'));
      W.editor.setHTML(W.store.state.doc.html, true);
      document.getElementById('panel-todo').innerHTML = '';
      W.tab.go('ai', 'write');
      W.ai.chip(!!W.store.state.ai.ckpts.length);
    },
  };

  /* Restore button */
  function wireChrome() {
    document.getElementById('btnRestore').addEventListener('click', () => W.ai.restoreLatest());
    $$('.aitsub').forEach(b => b.addEventListener('click', () => tab.sub(b.dataset.sub)));
  }

  /* ---------------- hotkeys ---------------- */
  function hotkeys() {
    document.addEventListener('keydown', e => {
      const inField = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (e.key === 'F12') return;
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 's') { e.preventDefault(); app.fileSave(); return; }
        if (k === 'n') { e.preventDefault(); app.fileNew(); return; }
        if (k === 'o') { e.preventDefault(); app.fileOpen(); return; }
        if (k === 'f') { e.preventDefault(); tab.go('ai', 'write'); W.editor.findDialog('find'); return; }
        if (k === 'h') { e.preventDefault(); tab.go('ai', 'write'); W.editor.findDialog('replace'); return; }
        return;
      }
      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); tab.go('todo'); }
        if (e.key === '2') { e.preventDefault(); tab.go('ai'); }
        if (e.key === '3') { e.preventDefault(); tab.go('table'); }
        if (e.key.toLowerCase() === 'w') { e.preventDefault(); tab.sub(curSub === 'write' ? 'read' : 'write'); }
        if (e.key.toLowerCase() === 'q') { e.preventDefault(); app.toggleRibbon(); }
        return;
      }
      void inField;
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    W.store.load();
    document.documentElement.dataset.theme = W.store.state.prefs.theme || 'office';
    if (W.store.state.prefs.ribbonMin) document.getElementById('ribbon').classList.add('min');
    app.applyZoom();
    app.renderAll();
    wireChrome();
    hotkeys();
    W.status.update();
    window.addEventListener('resize', W.debounce(W.status.update, 200));
    window.addEventListener('beforeunload', () => W.store.flush());
    console.log('%cEpicWord booted', 'color:#e2803f;font-weight:bold');
  }

  document.addEventListener('DOMContentLoaded', () => { try { boot(); } catch (err) { console.error('boot failed:', err); } });

  W.app = app;
})();
