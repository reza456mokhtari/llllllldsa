/* ============================================================
   EpicWord — table.js · DATATABLE — interactive data grid
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';
  const root = () => document.getElementById('panel-table');
  const D = () => W.store.state.dt;
  let sort = { col: null, dir: 1 };
  let query = '';

  /* ---------- CSV ---------- */
  function toCSV() {
    const { cols, rows } = D();
    const q = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const line = a => a.join(',');
    return line(cols.map(c => q(c.name))) + '\n' + rows.map(r => line(cols.map(c => q(r.c && r.c[c.id])))).join('\n');
  }
  function parseCSV(txt) {
    const rows = []; let row = [], cur = '', inQ = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (inQ) {
        if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur.replace(/\r$/, '')); rows.push(row); }
    return rows.filter(r => r.length > 1 || r[0] !== '');
  }

  /* ---------- helpers ---------- */
  function save() { W.store.save(); }
  function cellVal(r, cid) { return (r.c && r.c[cid] != null) ? String(r.c[cid]) : ''; }

  function headerCell(col) {
    const th = W.el('th', { 'data-cid': col.id });
    const name = W.el('span', { class: 'cnm', contenteditable: 'true', spellcheck: 'false', text: col.name,
      oninput: W.debounce(e => { col.name = e.target.textContent.trim() || 'Column'; save(); }, 400) });
    const sortc = W.el('span', { class: 'sortc' },
      W.el('span', { class: sort.col === col.id && sort.dir === 1 ? 'a' : '' }),
      W.el('span', { class: sort.col === col.id && sort.dir === -1 ? 'd' : '' }));
    const del = W.el('button', { class: 'colx', type: 'button', title: 'Delete column' }, W.icon('trash', 12));
    del.addEventListener('click', e => { e.stopPropagation(); delColumn(col); });
    name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
    th.append(name, sortc, del);
    th.addEventListener('click', () => {
      if (sort.col === col.id) sort.dir = -sort.dir; else { sort.col = col.id; sort.dir = 1; }
      save(); render();
    });
    return th;
  }

  async function delColumn(col) {
    if (D().cols.length <= 1) { W.toast('The grid keeps at least one column', 'warnc'); return; }
    const yes = await W.confirmBox('Delete column', 'Remove column «' + col.name + '» and its data?', 'Delete');
    if (!yes) return;
    D().cols = D().cols.filter(c => c !== col);
    D().rows.forEach(r => { if (r.c) delete r.c[col.id]; });
    save(); render(); W.toast('Column removed', 'ok');
  }

  function rowsFiltered() {
    let rows = D().rows.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(r => D().cols.some(c => cellVal(r, c.id).toLowerCase().includes(q)));
    }
    if (sort.col) {
      rows.sort((a, b) => {
        const x = cellVal(a, sort.col), y = cellVal(b, sort.col);
        const nx = parseFloat(x.replace(/,/g, '')), ny = parseFloat(y.replace(/,/g, ''));
        let cmp;
        if (!isNaN(nx) && !isNaN(ny)) cmp = nx - ny;
        else cmp = x.localeCompare(y, undefined, { sensitivity: 'base' });
        return cmp * sort.dir;
      });
    }
    return rows;
  }

  async function clearAll() {
    const yes = await W.confirmBox('Clear grid', 'Remove all rows (columns stay)? This cannot be undone.', 'Clear rows');
    if (!yes) return;
    D().rows = []; save(); render(); W.toast('Grid cleared — columns intact', 'ok');
  }
  function addRow() { D().rows.push({ id: W.uid(), c: {} }); save(); render(); }
  function addCol() {
    const n = D().cols.length + 1;
    D().cols.push({ id: W.uid(), name: 'Field ' + n });
    save(); render();
    setTimeout(() => { const th = root().querySelector('th[data-cid="' + D().cols[D().cols.length - 1].id + '"] .cnm'); th && (th.focus(), document.execCommand('selectall')); }, 30);
  }
  function importCSV(file) {
    const fr = new FileReader();
    fr.onload = () => {
      const table = parseCSV(String(fr.result || ''));
      if (!table.length) { W.toast('CSV was empty', 'warnc'); return; }
      const head = table[0].map((h, i) => h.trim() || 'Field ' + (i + 1));
      const cols = head.map(h => ({ id: W.uid(), name: h }));
      const rows = table.slice(1).map(line => {
        const c = {};
        cols.forEach((col, i) => { c[col.id] = line[i] != null ? line[i] : ''; });
        return { id: W.uid(), c };
      });
      sort = { col: null, dir: 1 };
      W.store.state.dt = { cols, rows };
      save(); render();
      W.toast('CSV imported — ' + rows.length + ' rows × ' + cols.length + ' columns', 'ok');
    };
    fr.readAsText(file, 'utf-8');
  }

  function render() {
    const r = root(); if (!r) return;
    const { cols } = D();
    const rows = rowsFiltered();

    const sch = W.el('input', { class: 'sch', type: 'search', placeholder: 'Filter rows…', value: query });
    sch.addEventListener('input', W.debounce(() => { query = sch.value; render(); }, 260));

  const bar = W.el('div', { class: 'dtbar' });
  const mkBtn = (iconName, label, fn, cls) => {
    const b = W.el('button', { class: 'gbtn ' + (cls || ''), type: 'button' }, W.icon(iconName, 14), label);
    b.addEventListener('click', fn); return b;
  };
  bar.append(
    mkBtn('plus', 'Row', addRow),
    mkBtn('table', 'Column', addCol),
    mkBtn('download', 'CSV', () => W.download('epicword-datatable.csv', toCSV(), 'text/csv')),
    mkBtn('upload', 'Import', () => W.pickFile('fileCsv', files => importCSV(files[0]))),
    mkBtn('trash', 'Clear', clearAll, 'danger'),
    sch,
    W.el('span', { class: 'tcount', text: rows.length + ' / ' + D().rows.length + ' rows' }),
  );

    const grid = W.el('table', { class: 'dbgrid' });
    const head = W.el('thead', {}, W.el('tr', {}));
    head.firstChild.append(W.el('th', { class: 'num', text: '#' }));
    cols.forEach(c => head.firstChild.append(headerCell(c)));
    head.firstChild.append(W.el('th', { class: 'addcol', title: 'Add column' }, '+ col'));
    head.firstChild.querySelector('.addcol').addEventListener('click', () => addCol());
    grid.append(head);

    const tbody = W.el('tbody');
    if (!rows.length) {
      const trow = W.el('tr');
      const td = W.el('td', { colspan: String(cols.length + 2), style: { textAlign: 'center', padding: '28px', color: '#8b95a3' },
        text: query ? 'No rows match «' + query + '»' : 'The grid is empty — add a row.' });
      td.setAttribute('colspan', String(cols.length + 2));
      trow.append(td); tbody.append(trow);
    }
    rows.forEach((rw, i) => {
      const tr = W.el('tr');
      if (rw.aiNew && !rw.aiSeen && Date.now() - rw.aiNew < 300000) tr.classList.add('ai-new');
      tr.append(W.el('td', { class: 'num', text: String(i + 1) }));
      cols.forEach(col => {
        const td = W.el('td', { contenteditable: 'true', spellcheck: 'false', text: cellVal(rw, col.id), 'data-cid': col.id, title: 'Double-click header or click to sort' });
        td.addEventListener('input', W.debounce(() => { rw.c = rw.c || {}; rw.c[col.id] = td.textContent; save(); }, 350));
        td.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); td.blur(); }
          if (e.key === 'Escape') td.blur();
        });
        tr.append(td);
      });
      const xcell = W.el('td', { style: { textAlign: 'center', width: '30px' } });
      const x = W.el('button', { class: 'rowx', type: 'button', title: 'Delete row' }, W.icon('trash', 13));
      x.addEventListener('click', () => {
        const i2 = D().rows.indexOf(rw); if (i2 > -1) D().rows.splice(i2, 1);
        save(); render();
      });
      xcell.append(x); tr.append(xcell);
      tbody.append(tr);
    });
    grid.append(tbody);
    const hot = tbody.querySelector('.ai-new');
    if (hot) {
      rows.forEach(rw2 => { if (rw2.aiNew && !rw2.aiSeen && Date.now() - rw2.aiNew < 300000) rw2.aiSeen = true; });
      W.store.save();
      if (root() && !root().hidden) { try { hot.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
    }

    r.innerHTML = '';
    r.append(ledgerPanel(), bar, W.el('div', { class: 'dtwrap' }, grid));
  }

  /* ---------- AI delivery ledger — طرح · ژانر · کیفیت ---------- */
  const AI_COLS = ['Title', 'Description', 'Genre', 'Theme', 'Quality', 'Engine', 'Words', 'ChronicleID', 'CreatedAt'];
  function ensureAiCols() {
    const d = D();
    AI_COLS.forEach(name => {
      if (!d.cols.some(c => (c.name || '').toLowerCase() === name.toLowerCase())) d.cols.push({ id: W.uid(), name });
    });
  }
  function upsertAiRow(ent) {
    ensureAiCols();
    const d = D();
    const cidCol = d.cols.find(c => (c.name || '').toLowerCase() === 'chronicleid');
    let row = cidCol ? d.rows.find(r => String(cellVal(r, cidCol.id)) === ent.id) : null;
    if (!row) { row = { id: W.uid(), c: {} }; d.rows.unshift(row); }
    const M = {
      title: ent.title, description: ent.description, genre: ent.genre, theme: ent.theme,
      quality: ent.score + ' · ' + ent.grade, engine: ent.engine, words: String(ent.words),
      chronicleid: ent.id, createdat: new Date(ent.ts).toLocaleString(),
    };
    d.cols.forEach(col => { const v = M[(col.name || '').toLowerCase()]; if (v !== undefined) row.c[col.id] = v; });
    row.aiNew = Date.now();
    row.aiSeen = false;
  }
  function classify(input, meta) {
    const t = String(input || '').toLowerCase();
    const has = ks => ks.some(k => t.indexOf(k) !== -1);
    const genres = [
      ['Dark Fantasy', ['dark', 'ash', 'ember', 'curse', 'bell', 'abbey', 'lantern', 'grave', 'soul', 'blood', 'ruin', 'hollow', 'shadow', 'ritual', 'demon']],
      ['Epic Myth', ['god', 'titan', 'crown', 'kingdom', 'prophecy', 'war', 'empire', 'legend', 'hero', 'king']],
      ['Historical', ['emperor', 'dynasty', 'revolution', 'army', 'century', 'ancient', 'charter', 'battle']],
      ['Mystery', ['mystery', 'riddle', 'secret', 'mask', 'detective', 'vanished', 'clue']],
      ['Horror', ['fear', 'nightmare', 'dread', 'corpse', 'specter', 'ghost', 'scream', 'abyss']],
      ['Romance', ['love', 'heart', 'beloved', 'kiss', 'vow', 'longing', 'wed']],
      ['Sci-Fi', ['machine', 'star', 'orbit', 'android', 'colony', 'future', 'signal', 'cyber', 'engine of']],
      ['Adventure', ['journey', 'expedition', 'voyage', 'mountain', 'frontier', 'quest', 'crossing']],
      ['Philosophical', ['silence', 'meaning', 'truth', 'memory', 'destiny', 'wonder', 'thought']],
    ];
    let genre = null;
    for (const g of genres) { if (has(g[1])) { genre = g[0]; break; } }
    if (!genre) genre = ['Epic Drama', 'Myth Prose', 'Lament Fragments', 'Twilight Saga'][W.hash(input) % 4];
    const motifs = [
      ['Ashen Ruin', ['ash', 'ember', 'flame', 'burn', 'fire']],
      ['Blood & Debt', ['blood', 'debt', 'oath', 'price', 'scar']],
      ['Duel & Honor', ['blade', 'sword', 'duel', 'steel']],
      ['Cosmic Dread', ['void', 'star', 'cosmic', 'abyss', 'god']],
      ['Court & Intrigue', ['king', 'queen', 'court', 'throne', 'crown']],
      ['Drowned Tide', ['drown', 'tide', 'water', 'sea', 'frost', 'ice']],
      ['Silent Bell', ['bell', 'toll', 'ring', 'choir', 'lantern']],
      ['Hollow Threshold', ['door', 'gate', 'threshold', 'key']],
    ];
    const hits = motifs.filter(m => has(m[1])).slice(0, 2).map(m => m[0]);
    if (!hits.length) hits.push(motifs[W.hash(input) % motifs.length][0]);
    const wc = String(input || '').trim().split(/\s+/).filter(Boolean).length;
    let q = 84 + Math.min(Math.floor(wc / 8), 7);
    if (meta && meta.web) q += 3;
    if (meta && meta.think) q += 4;
    q += W.hash(input) % 5;
    q = Math.max(78, Math.min(99, q));
    const grade = q >= 96 ? 'S' : q >= 92 ? 'A+' : q >= 87 ? 'A' : q >= 82 ? 'B+' : 'B';
    return { genre, theme: hits.join(' + '), score: q, grade };
  }

  function logDelivery(input, meta, rep, extra) {
    try {
      extra = extra || {};
      const cl = extra.cl || classify(input, meta);
      const f6 = W.ai.first6(input);
      const ent = {
        ts: Date.now(), at: meta.at,
        subject: f6.six + (f6.hasMore ? '…' : ''),
        title: extra.title || f6.six,
        description: extra.description || '',
        theme: cl.theme, genre: cl.genre, score: cl.score, grade: cl.grade,
        engine: meta.provider === 'api' ? ('GLM · ' + (meta.model || 'glm')) : 'Ember Scribe (local)',
        id: rep.id, words: meta.words || 0, secs: meta.secs || '0.0',
      };
      const lg = W.store.state.ai.ledger = (W.store.state.ai.ledger || []);
      lg.unshift(ent);
      while (lg.length > 120) lg.pop();
      upsertAiRow(ent);
      W.store.save(); W.store.flush();
      const pane = root();
      if (pane && pane.querySelector('.ailedger')) render();
      return ent;
    } catch (e) { return null; }
  }

  function ledgerRow(e) {
    const qc = e.grade === 'S' ? 's' : e.grade === 'A+' ? 'ap' : e.grade === 'A' ? 'a' : 'b';
    return W.el('div', { class: 'airow' },
      W.el('span', { class: 'ai-stamp', text: W.clockOf(new Date(e.ts)) }),
      W.el('span', { class: 'ai-subj', text: e.subject, title: e.id }),
      W.el('span', { class: 'ai-chip', text: e.theme }),
      W.el('span', { class: 'ai-chip g', text: e.genre }),
      W.el('span', { class: 'ai-chip q q' + qc, text: e.score + ' · ' + e.grade }),
      W.el('span', { class: 'ai-eng', text: e.engine + ' · ' + e.id + ' · ' + e.words + 'w' }));
  }

  function ledgerPanel() {
    const lg = (W.store.state.ai.ledger || []);
    const bar = W.el('div', { class: 'aibar' },
      W.el('span', { class: 'aibar-t' }, W.icon('flame', 14), 'AI DELIVERY LEDGER',
        W.el('span', { class: 'fa', text: ' · طرح · ژانر · کیفیت' })),
      W.el('span', { class: 'aibar-n', text: lg.length + ' entr' + (lg.length === 1 ? 'y' : 'ies') }));
    const clear = W.el('button', { class: 'gbtn', type: 'button' }, W.icon('trash', 13), 'Clear ledger');
    clear.addEventListener('click', async () => {
      const yes = await W.confirmBox('Clear AI ledger', 'Erase every delivery entry (طرح · ژانر · کیفیت)?', 'Clear');
      if (!yes) return;
      W.store.state.ai.ledger = [];
      W.store.save(); W.store.flush(); render();
    });
    bar.append(clear);
    const head = W.el('div', { class: 'airow head' },
      W.el('span', { text: 'Stamp' }),
      W.el('span', { text: 'Subject · first six words' }),
      W.el('span', { text: 'Plan · طرح' }),
      W.el('span', { text: 'Genre · ژانر' }),
      W.el('span', { text: 'Quality' }),
      W.el('span', { text: 'Engine / Dossier' }));
    const rows = W.el('div', { class: 'airows' });
    lg.forEach(e => rows.append(ledgerRow(e)));
    if (!lg.length) rows.append(W.el('div', { class: 'airow empty',
      text: 'No deliveries yet — seal a draft in the AI workspace; every SAVE & PROCESS writes one row here.' }));
    return W.el('div', { class: 'ailedger' }, bar, head, rows);
  }

  W.table = { render, toCSV, importCSV, logDelivery, classify };
})();
