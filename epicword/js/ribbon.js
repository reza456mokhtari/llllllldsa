/* ============================================================
   EpicWord — ribbon.js · Home groups + AI tab, live states
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';

  const FONTS = ['Calibri','Cambria','Georgia','Garamond','Times New Roman','Courier New','Consolas','Segoe UI','Arial','Verdana','Fantasy Scroll'];
  const SIZES = ['8','9','10','11','12','14','16','18','20','22','24','28','32','36','48','72'];
  const PAL = ['#000000','#20252c','#5a6472','#185abd','#0b6cbe','#107c3e','#b3620b','#c0392b','#9932cc','#8b4513','#ffffff','#f1c15d','#7ee0a3','#8cb6ff','#ffa2a2','#e2803f'];
  const HL  = ['#ffff00','#8cff9b','#7ee0ff','#ffa2a2','#e0b6ff','#ffcf9e','#c8ccd4','none'];
  let tab = 'home';

  function rbtn(iconName, label, fn, opts) {
    opts = opts || {};
    const b = W.el('button', { class: 'rbtn' + (opts.cls || '') + (opts.id ? '' : ''), type: 'button' });
    if (opts.id) b.dataset.cmd = opts.id;
    b.append(W.icon(iconName, opts.iconSize || 19));
    if (label !== null) b.append(W.el('span', { text: label }));
    b.addEventListener('click', e => { e.stopPropagation(); fn && fn(b); });
    return b;
  }
  function smbtn(iconName, fn, title, cmd) {
    const b = W.el('button', { class: 'rbtn sm', type: 'button', title: title || '' });
    if (cmd) b.dataset.cmd = cmd;
    b.append(W.icon(iconName, 16));
    b.addEventListener('click', e => { e.stopPropagation(); fn && fn(b); });
    return b;
  }
  function group(cap) {
    const g = W.el('div', { class: 'rgroup' });
    const gcap = W.el('div', { class: 'gcap', text: cap });
    return { g, gcap };
  }

  function colorPicker(btn, apply, colors, noneLabel) {
    const m = W.el('div', { class: 'cmenu' });
    colors.forEach((c, i) => {
      if (c === 'none') {
        const bn = W.el('button', { type: 'button', title: noneLabel || 'No color', style: { background: 'repeating-linear-gradient(45deg,#fff 0 4px,#eee 4px 8px)' } });
        bn.addEventListener('click', () => { apply(null); m.remove(); document.removeEventListener('mousedown', far, true); });
        m.append(bn); return;
      }
      const b = W.el('button', { type: 'button', title: c, style: { background: c } });
      b.addEventListener('click', () => { apply(c); m.remove(); document.removeEventListener('mousedown', far, true); });
      m.append(b);
    });
    const far = e => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', far, true); } };
    document.addEventListener('mousedown', far, true);
    const r = btn.getBoundingClientRect();
    m.style.left = r.left + 'px'; m.style.top = (r.bottom + 2) + 'px';
    document.body.append(m);
  }

  function buildHome() {
    const groups = [];
    /* CLIPBOARD */
    (() => {
      const g = group('Clipboard'); const r1 = W.el('div', { class: 'rrow' });
      r1.append(rbtn('paste', 'Paste', async () => {
        const t = await W.pasteText();
        if (t) W.editor.insertHTML(W.esc(t).replace(/\n/g, '<br>'));
      }, { cls: ' big' }));
      const col = W.el('div', { class: 'cbot' });
      col.append(smbtn('cutsc', () => W.editor.exec('cut'), 'Cut (Ctrl+X)'),
        smbtn('copy2', () => W.editor.exec('copy'), 'Copy (Ctrl+C)'),
        smbtn('brush', b => {
          W.app.paintFormat();
          b.classList.add('on');
          setTimeout(() => b.classList.remove('on'), 1200);
        }, 'Format painter'));
      r1.append(col);
      g.g.append(r1, g.gcap); groups.push(g);
    })();
    /* FONT */
    (() => {
      const g = group('Font');
      const ffWrap = W.el('div', { class: 'selwrap lead' });
      const ff = W.el('select', { class: 'ff', title: 'Font' });
      FONTS.forEach(f => ff.append(W.el('option', { value: f, ...(f === 'Calibri' ? { selected: '' } : {}) }, f)));
      ff.addEventListener('change', () => { W.editor.applyFont(ff.value); });
      const fsWrap = W.el('div', { class: 'selwrap' });
      const fs = W.el('select', { class: 'fs', title: 'Font size (pt)' });
      SIZES.forEach(s => fs.append(W.el('option', { value: s, ...(s === '14' ? { selected: '' } : {}) }, s)));
      fs.addEventListener('change', () => { W.editor.applySize(Number(fs.value)); });
      ffWrap.append(ff); fsWrap.append(fs);
      const r1 = W.el('div', { class: 'rrow' }, ffWrap, fsWrap);
      const fcol = W.el('button', { class: 'cbtn', title: 'Text color', type: 'button' });
      fcol.append(W.icon('droplet', 16), W.el('i', { class: 'crail', style: { background: '#c0392b' } }));
      fcol.addEventListener('click', () => colorPicker(fcol, c => { if (c) W.editor.exec('foreColor', c); }, PAL));
      const hcol = W.el('button', { class: 'cbtn', title: 'Highlight', type: 'button' });
      hcol.append(W.icon('highlight', 16), W.el('i', { class: 'crail', style: { background: '#ffff00' } }));
      hcol.addEventListener('click', () => colorPicker(hcol, c => { W.editor.exec('hiliteColor', c || 'transparent'); }, HL, 'No highlight'));
      const r2 = W.el('div', { class: 'rrow' },
        smbtn('font', () => W.editor.exec('bold', null), 'Bold (Ctrl+B)', 'bold'),
        smbtn('titlecase', () => W.editor.exec('italic'), 'Italic (Ctrl+I)', 'italic'),
        smbtn('edit', () => W.editor.exec('underline'), 'Underline (Ctrl+U)', 'underline'),
        smbtn('hr', () => W.editor.exec('strikeThrough'), 'Strikethrough', 'strikeThrough'));
      const r3 = W.el('div', { class: 'rrow' },
        smbtn('insert', () => W.editor.exec('superscript'), 'Superscript', 'superscript'),
        smbtn('grid', () => W.editor.exec('subscript'), 'Subscript', 'subscript'),
        fcol, hcol,
        smbtn('eraser', () => W.editor.clearFormat(), 'Clear formatting'));
      g.g.append(r1, r2, r3, g.gcap);
      groups.push(g);
    })();
    /* PARAGRAPH */
    (() => {
      const g = group('Paragraph');
      const r1 = W.el('div', { class: 'rrow' },
        rbtn('bullet', 'Bullets', () => W.editor.exec('insertUnorderedList'), {}),
        smbtn('numlist', () => W.editor.exec('insertOrderedList'), 'Numbering'),
        smbtn('outdent', () => W.editor.exec('outdent'), 'Decrease indent'),
        smbtn('indent', () => W.editor.exec('indent'), 'Increase indent'));
      const r2 = W.el('div', { class: 'rrow' },
        rbtn('alignL', 'Left', () => W.editor.exec('justifyLeft'), { id: 'justifyLeft' }),
        rbtn('alignC', 'Center', () => W.editor.exec('justifyCenter'), { id: 'justifyCenter' }),
        rbtn('alignR', 'Right', () => W.editor.exec('justifyRight'), { id: 'justifyRight' }),
        rbtn('alignJ', 'Justify', () => W.editor.exec('justifyFull'), { id: 'justifyFull' }));
      const r3 = W.el('div', { class: 'rrow' },
        rbtn('spacing', 'Line ↓', b => W.app.spacingMenu(b), { id: null }));
      g.g.append(r1, r2, r3, g.gcap);
      groups.push(g);
    })();
    /* STYLES */
    (() => {
      const g = group('Styles');
      const mk = (cls, prof, label, sub, block) => {
        const b = W.el('button', { class: 'styleb ' + cls, type: 'button', title: 'Apply ' + label },
          W.el('span', { class: 'smp', text: prof }), W.el('b', { text: label }), W.el('i', { text: sub }));
        b.addEventListener('click', () => W.editor.exec('formatBlock', block));
        return b;
      };
      const wrap = W.el('div', { class: 'rrow' },
        mk('s-title', 'Title Sample', 'Title', '· epigraph', '<p>'),
        mk('s-h1', 'Heading 1', 'H 1', '· headline', '<h2>'),
        mk('s-h2', 'Heading 2', 'H 2', '· section', '<h3>'),
        mk('s-h3', 'Heading 3', 'H 3', '· scene', '<h4>'),
        mk('s-quote', 'Quote sample…', 'Quote', '· cited lore', '<blockquote>'),
        mk('', 'Normal sample…', 'Normal', '· body ink', '<p>'));
      g.g.append(wrap, g.gcap);
      groups.push(g);
    })();
    /* EDITING */
    (() => {
      const g = group('Editing');
      const wrap = W.el('div', { class: 'rrow' },
        rbtn('find', 'Find', () => W.editor.findDialog('find'), { cls: ' big' }),
        rbtn('replace', 'Replace', () => W.editor.findDialog('replace'), { cls: ' big' }),
        (() => { const b = W.el('div', { class: 'cbot' }); b.append(smbtn('full', () => W.editor.exec('selectAll'), 'Select all'), smbtn('info', () => W.app.wordCount(), 'Word count')); return b; })());
      g.g.append(wrap, g.gcap);
      groups.push(g);
    })();
    return groups;
  }

  function buildAI() {
    const s = () => W.store.state.ai;
    const groups = [];
    /* ENGINE */
    (() => {
      const g = group('Engine'); const r = W.el('div', { class: 'rrow' });
      r.append(rbtn('globe', 'WEB', () => { const ai = s(); ai.webOn = !ai.webOn; W.store.save(); build(); },
        { cls: s().webOn ? ' on' : '', iconSize: 20 }));
      r.append(rbtn('brain', 'THINK', () => { const ai = s(); ai.thinkOn = !ai.thinkOn; W.store.save(); build(); },
        { cls: s().thinkOn ? ' on' : '', iconSize: 20 }));
      r.append(rbtn('gear', 'Key/Model', () => W.ai.openPrefs(), { cls: ' big' }));
      g.g.append(r, g.gcap); groups.push(g);
    })();
    /* DISPATCH */
    (() => {
      const g = group('Dispatch'); const r = W.el('div', { class: 'rrow' });
      const save = W.el('button', { class: 'embertab', type: 'button', title: 'Commit + engine (Ctrl+S)', style: { margin: '4px 6px' } },
        W.icon('flame', 15), 'SAVE & PROCESS');
      save.addEventListener('click', () => W.ai.saveAndProcess());
      r.append(save);
      r.append(rbtn('restock', 'Restore', () => W.ai.restoreLatest(), {}));
      g.g.append(r, g.gcap); groups.push(g);
    })();
    /* CHRONICLES */
    (() => {
      const g = group('Chronicles'); const r = W.el('div', { class: 'rrow' });
      r.append(rbtn('book', 'READ pane', () => W.tab.go('ai', 'read'), { cls: ' big' }));
      r.append(rbtn('quill', 'WRITE', () => W.tab.go('ai', 'write'), { cls: ' big' }));
      g.g.append(r, g.gcap); groups.push(g);
    })();
    return groups;
  }

  function render() {
    const host = document.getElementById('ribbon');
    host.innerHTML = '';
    const tabs = W.el('div', { class: 'rtabs' });
    const h = W.el('button', { class: 'rtab' + (tab === 'home' ? ' on' : ''), type: 'button' }, W.icon('font', 14), 'HOME');
    const a = W.el('button', { class: 'rtab' + (tab === 'ai' ? ' on' : ''), type: 'button' }, W.icon('flame', 14), 'AI ENGINE');
    h.addEventListener('click', () => { tab = 'home'; build(); });
    a.addEventListener('click', () => { tab = 'ai'; build(); });
    const qat = W.el('div', { class: 'rheadq' });
    qat.append(smbtn('undo', () => W.editor.exec('undo'), 'Undo'),
      smbtn('redo', () => W.editor.exec('redo'), 'Redo'),
      smbtn('print', () => window.print(), 'Print'));
    tabs.append(h, a, W.el('div', { class: 'rhead' }, qat));
    const strip = W.el('div', { class: 'rstrip' });
    (tab === 'home' ? buildHome() : buildAI()).forEach(grow => { if (grow.g) strip.append(grow.g); });
    host.append(tabs, strip);
  }
  function build() {
    render();
    reflect();
  }

  /* reflect live formatting states from the sheet */
  function reflect() {
    if (tab !== 'home') return;
    const sheet = W.editor.sheet;
    if (!sheet) return;
    const acts = [['bold', true], ['italic', true], ['underline', true], ['strikeThrough', true],
      ['superscript', true], ['subscript', true], ['insertUnorderedList', true], ['insertOrderedList', true],
      ['justifyLeft', true], ['justifyCenter', true], ['justifyRight', true], ['justifyFull', true]];
    const strip = document.querySelector('.rstrip');
    if (!strip) return;
    strip.querySelectorAll('[data-cmd]').forEach(b => {
      const cmd = b.dataset.cmd;
      const on = acts.some(([k]) => k === cmd) ? document.queryCommandState(cmd) : false;
      b.classList.toggle('on', !!on);
    });
  }

  W.ribbon = { render, build, reflect, setTab: t => { tab = t; build(); }, cur: () => tab };
})();
