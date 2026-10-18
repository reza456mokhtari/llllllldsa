/* ============================================================
   EpicWord — menubar.js · File/Edit/View/Insert/Format/Tools/Window/Help
   Every row is wired to a real action — no decorative items.
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';

  let openMenu = null, openBtn = null;

  function row(item) {
    if (item.sep) return W.el('div', { class: 'dsep' });
    const r = W.el('div', { class: 'drow' + (item.dis ? ' dis' : '') },
      W.el('span', { class: 'dic' }, item.icon ? W.icon(item.icon, 15) : null),
      W.el('span', { text: item.title }),
      item.hint ? W.el('span', { class: 'dhint', text: item.hint }) : null);
    if (item.checked) r.classList.add('on');
    const go = e => {
      e.stopPropagation();
      closeMenus();
      if (item.action) item.action();
    };
    r.addEventListener('click', go);
    return r;
  }

  function closeMenus() {
    if (openMenu) openMenu.remove();
    openMenu = null;
    if (openBtn) openBtn.classList.remove('open');
    document.removeEventListener('mousedown', outside, true);
  }
  function outside(e) {
    if (openMenu && !openMenu.contains(e.target) && e.target !== openBtn && !openBtn.contains(e.target)) closeMenus();
  }

  function openAt(btn, items) {
    closeMenus();
    openBtn = btn; btn.classList.add('open');
    const m = W.el('div', { class: 'dmenu', role: 'menu' });
    items.forEach(it => m.append(row(it)));
    const r = btn.getBoundingClientRect();
    m.style.left = Math.min(r.left, window.innerWidth - 280) + 'px';
    m.style.top = (r.bottom - 1) + 'px';   /* 1px overlap — cursor path never crosses dead air */
    document.body.append(m);
    openMenu = m;
    document.addEventListener('mousedown', outside, true);
  }

  const MENUS = [
    { label: 'File', icon: 'file', items: [
      { title: 'New document', icon: 'plus', hint: 'Ctrl+N', action: () => W.app.fileNew() },
      { title: 'Open file…', icon: 'upload', hint: 'Ctrl+O', action: () => W.app.fileOpen() },
      { sep: 1 },
      { title: 'Save · commit & process', icon: 'save', hint: 'Ctrl+S', action: () => W.app.fileSave() },
      { title: 'Save as HTML…', icon: 'download', action: () => W.app.saveDocAs() },
      { title: 'Export .txt', icon: 'file', action: () => W.app.saveDocTxt() },
      { sep: 1 },
      { title: 'Print / PDF…', icon: 'print', hint: 'Ctrl+P', action: () => window.print() },
      { title: 'Close document', icon: 'x', action: async () => { if (await W.confirmBox('Close document', 'Blank the WRITE canvas? Checkpoint remains for restore.', 'Blank it')) { W.editor.clearHi(); W.editor.insertHTML('<p><br></p>'); W.editor.sheet.focus(); } } },
    ]},
    { label: 'Edit', icon: 'edit', items: [
      { title: 'Undo', icon: 'undo', hint: 'Ctrl+Z', action: () => W.editor.exec('undo') },
      { title: 'Redo', icon: 'redo', hint: 'Ctrl+Y', action: () => W.editor.exec('redo') },
      { sep: 1 },
      { title: 'Cut', icon: 'cutsc', hint: 'Ctrl+X', action: () => W.editor.exec('cut') },
      { title: 'Copy', icon: 'copy2', hint: 'Ctrl+C', action: () => W.editor.exec('copy') },
      { title: 'Paste', icon: 'paste', hint: 'Ctrl+V', action: async () => { const t = await W.pasteText(); if (t) W.editor.insertHTML(W.esc(t).replace(/\n/g, '<br>')); } },
      { sep: 1 },
      { title: 'Select all', icon: 'full', hint: 'Ctrl+A', action: () => W.editor.exec('selectAll') },
      { title: 'Clear formatting', icon: 'eraser', hint: 'Ctrl+\\', action: () => W.editor.clearFormat() },
    ]},
    { label: 'View', icon: 'eye', items: () => {
      const p = W.store.state.prefs;
      return [
        { title: 'Zoom in', icon: 'zoomIn', hint: 'Ctrl++', action: () => W.app.zoom(+10) },
        { title: 'Zoom out', icon: 'zoomOut', hint: 'Ctrl+-', action: () => W.app.zoom(-10) },
        { title: 'Zoom 100%', icon: 'target', hint: 'Ctrl+0', action: () => W.app.zoomTo(100) },
        { sep: 1 },
        { title: 'Collapse ribbon', icon: 'full', hint: 'Alt+Q', action: () => W.app.toggleRibbon() },
        { title: 'Status bar', icon: 'grid', action: () => W.app.toggleStatus() },
        { sep: 1 },
        { title: 'Dark chrome', icon: 'flame', checked: p.theme === 'dark', action: () => W.app.toggleTheme() },
        { title: 'Print view (all chrome off)', icon: 'print', action: () => { window.print(); } },
      ];
    } },
    { label: 'Insert', icon: 'insert', items: [
      { title: 'Table…', icon: 'table', action: () => W.app.insertTable() },
      { title: 'Picture…', icon: 'image', action: () => W.app.insertImage() },
      { title: 'Link…', icon: 'link2', action: () => W.app.insertLink() },
      { sep: 1 },
      { title: 'Horizontal rule', icon: 'hr', action: () => W.editor.insertHTML('<hr>') },
      { title: 'Page break', icon: 'print', action: () => W.editor.insertHTML('<hr class="pagebrk">') },
      { title: 'Date & time', icon: 'calendar', action: () => W.editor.insertHTML(new Date().toLocaleString()) },
      { title: 'Symbol Ω or custom…', icon: 'omega', action: () => W.app.insertSymbol() },
    ]},
    { label: 'Format', icon: 'palette', items: [
      { title: 'Bold', icon: 'font', hint: 'Ctrl+B', action: () => W.editor.exec('bold') },
      { title: 'Italic', icon: 'edit', hint: 'Ctrl+I', action: () => W.editor.exec('italic') },
      { title: 'Underline', icon: 'edit', hint: 'Ctrl+U', action: () => W.editor.exec('underline') },
      { title: 'Strikethrough', action: () => W.editor.exec('strikeThrough') },
      { sep: 1 },
      { title: 'Font family…', icon: 'font', action: () => W.app.fontDialog() },
      { title: 'Text color…', icon: 'droplet', action: () => W.app.colorDialog('foreColor') },
      { title: 'Highlight…', icon: 'highlight', action: () => W.app.colorDialog('hiliteColor') },
      { sep: 1 },
      { title: 'UPPERCASE', icon: 'titlecase', action: () => W.editor.caseTransform('upper') },
      { title: 'lowercase', action: () => W.editor.caseTransform('lower') },
      { title: 'Title Case', action: () => W.editor.caseTransform('title') },
      { sep: 1 },
      { title: 'Clear formatting', icon: 'eraser', action: () => W.editor.clearFormat() },
    ]},
    { label: 'Tools', icon: 'tools', items: [
      { title: 'Find & Replace…', icon: 'find', hint: 'Ctrl+H', action: () => W.editor.findDialog('replace') },
      { title: 'Word count', icon: 'info', action: () => W.app.wordCount() },
      { sep: 1 },
      { title: 'Restore checkpoint…', icon: 'restock', action: () => W.ai.restoreLatest() },
      { title: 'Preferences — GLM engine…', icon: 'gear', action: () => W.ai.openPrefs() },
      { title: 'Wipe local data…', icon: 'trash', action: async () => {
          const yes = await W.confirmBox('Wipe local data', 'Erase ALL local data (documents, tasks, grid, engine config) and restore seeds?', 'Wipe');
          if (!yes) return;
          W.store.wipeAll(); W.app.renderAll(); W.toast('All data wiped — factory seeds restored', 'warnc');
        } },
    ]},
    { label: 'Window', icon: 'window', items: () => [
      { title: '1 — TODO', icon: 'grid', hint: 'Alt+1', checked: W.app.cur() === 'todo', action: () => W.tab.go('todo') },
      { title: '2 — AI Workspace · WRITE', icon: 'quill', hint: 'Alt+2', checked: W.app.cur() === 'ai', action: () => W.tab.go('ai', 'write') },
      { title: '        — AI Workspace · READ', icon: 'book', hint: 'Alt+W', action: () => W.tab.go('ai', 'read') },
      { title: '3 — DATATABLE', icon: 'table', hint: 'Alt+3', checked: W.app.cur() === 'table', action: () => W.tab.go('table') },
    ] },
    { label: 'Help', icon: 'help', items: [
      { title: 'Keyboard shortcuts', icon: 'file', action: () => W.ai.shortcutsDlg() },
      { title: 'GLM engine settings', icon: 'gear', action: () => W.ai.openPrefs() },
      { sep: 1 },
      { title: 'About EpicWord', icon: 'crown', action: () => W.ai.about() },
    ]},
  ];

  function render() {
    const bar = document.getElementById('menubar');
    if (!bar) return;
    bar.innerHTML = '';
    bar.append(W.el('div', { class: 'mbrand' }, W.icon('logo', 17), W.el('span', {}, 'EPIC', W.el('b', { text: 'WORD' }))));
    MENUS.forEach(def => {
      const btn = W.el('button', { class: 'mitem', type: 'button', text: def.label });
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        if (openMenu) { closeMenus(); return; }
        const items = typeof def.items === 'function' ? def.items() : def.items;
        openAt(btn, items);
      });
      btn.addEventListener('mouseenter', () => {
        if (openMenu && openBtn !== btn) {
          const items = typeof def.items === 'function' ? def.items() : def.items;
          openAt(btn, items);
        }
      });
      bar.append(btn);
    });
    const tail = W.el('div', { class: 'mtail' },
      W.el('span', { text: 'local · ' + (W.store.state.ai.key ? 'GLM wired' : 'ember scribe (demo)') }));
    bar.append(W.el('div', { class: 'mspace' }), tail);
  }

  W.menubar = { render, closeMenus };
})();
