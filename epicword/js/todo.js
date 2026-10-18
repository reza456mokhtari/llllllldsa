/* ============================================================
   EpicWord — todo.js · task tracking panel (Tab 1)
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';
  const root = () => document.getElementById('panel-todo');
  let filter = 'open';

  const ST = () => W.store.state.todo;
  const save = () => W.store.save();

  const PRIO = { h: { label: 'HIGH', cls: 'h' }, m: { label: 'MID', cls: 'm' }, l: { label: 'LOW', cls: 'l' } };

  function late(t) {
    if (!t.due || t.done) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(t.due + 'T00:00:00');
    if (d < today) return 'late';
    if (d.getTime() === today.getTime()) return 'today';
    return null;
  }
  function dueLabel(t) {
    if (!t.due) return '';
    const d = new Date(t.due + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function row(t) {
    const chips = W.el('div', { class: 'tchips' },
      W.el('span', { class: 'tp ' + PRIO[t.prio].cls, text: PRIO[t.prio].label }));
    if (t.due) {
      const st = late(t);
      chips.append(W.el('span', { class: 'tdue ' + (st || ''), text: '⌚ ' + dueLabel(t) + (st === 'late' ? ' · past' : st === 'today' ? ' · today' : '') }));
    }
    const body = W.el('div', { class: 'tbody' },
      W.el('div', { class: 'tname', contenteditable: 'true', spellcheck: 'false', text: t.title || 'Untitled task',
        oninput: W.debounce(e => { t.title = e.target.textContent.trim(); save(); }, 500),
        onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } } }),
      W.el('div', { class: 'tnote', contenteditable: 'true', spellcheck: 'false', text: t.note || '', 'data-ph': 'note — optional',
        oninput: W.debounce(e => { t.note = e.target.textContent.trim(); save(); }, 500),
        onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } } }),
      chips);
    const del = W.el('button', { class: 'tx', type: 'button', title: 'Delete task' }, W.icon('trash', 14));
    del.addEventListener('click', async () => {
      const yes = await W.confirmBox('Delete task', 'Remove «' + (t.title || 'task') + '» from the ledger?', 'Delete');
      if (!yes) return;
      const i = ST().indexOf(t); if (i > -1) ST().splice(i, 1);
      save(); render(); W.toast('Task removed', 'ok');
    });
    const r = W.el('div', { class: 'trow' + (t.done ? ' done' : ''), 'data-id': t.id },
      W.el('button', { class: 'chk', type: 'button', title: t.done ? 'Reopen' : 'Complete' }, W.icon('check', 12)),
      body, del);
    r.querySelector('.chk').addEventListener('click', () => {
      t.done = !t.done; save();
      render();
      W.toast(t.done ? '⚔ Sealed. Onwards.' : 'Reopened', 'ok');
    });
    return r;
  }

  function render() {
    const r = root(); if (!r) return;
    const all = ST();
    const doneN = all.filter(x => x.done).length;
    const pct = all.length ? Math.round(doneN / all.length * 100) : 0;

    let list = all.slice();
    if (filter === 'open') list = list.filter(x => !x.done);
    else if (filter === 'done') list = list.filter(x => x.done);
    else if (filter === 'high') list = list.filter(x => x.prio === 'h' && !x.done);
    else if (filter === 'today') {
      const tk = new Date(); tk.setHours(23, 59);
      list = list.filter(x => x.due && new Date(x.due + 'T23:59') <= tk && !x.done);
    }

    const filt = (k, label) => {
      const b = W.el('button', { class: 'tf' + (filter === k ? ' on' : ''), type: 'button' }, label);
      b.addEventListener('click', () => { filter = k; render(); });
      return b;
    };

    const groups = [
      { key: 'open', label: 'OPEN', icon: 'flame', items: list.filter(x => !x.done) },
      { key: 'done', label: 'SEALED', icon: 'check', items: list.filter(x => x.done) },
    ];

    const addTitle = W.el('input', { type: 'text', placeholder: 'New task — what must be done?' });
    const addPrio = W.el('select', {}, Object.keys(PRIO).map(k => W.el('option', { value: k, ...(k === 'm' ? { selected: '' } : {}) }, PRIO[k].label)));
    const addDue = W.el('input', { type: 'date' });
    const addBtn = W.el('button', { class: 'gbtn acc', type: 'button' }, W.icon('plus', 14), 'Add');
    addBtn.addEventListener('click', () => {
      const title = addTitle.value.trim();
      if (!title) { addTitle.focus(); W.joltShake(addTitle); W.toast('Give the task a name', 'warnc'); return; }
      ST().unshift({ id: W.uid(), title, note: '', prio: addPrio.value, due: addDue.value, done: false, ts: Date.now() });
      addTitle.value = ''; addDue.value = '';
      save(); render();
      if (filter === 'done') filter = 'open';
      W.toast('Task inscribed', 'ok');
    });
    addTitle.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

    const grid = W.el('div', { class: 'twrap' },
      W.el('div', { class: 'ttop' },
        W.el('h2', {}, W.icon('grid', 18), ' LEDGER OF TASKS'),
        W.el('div', { class: 'tprog' }, W.el('i', { style: { width: pct + '%' } })),
        W.el('span', { class: 'tcount', text: doneN + ' / ' + all.length + ' sealed · ' + pct + '%' })),
      W.el('div', { class: 'tadd' }, addTitle, addPrio, addDue, addBtn),
      W.el('div', { class: 'tfilters' },
        filt('open', 'In progress'), filt('today', 'Due today'), filt('high', 'High priority'), filt('done', 'Sealed'), filt('all', 'All')),
    );

    groups.forEach(g => {
      const items = g.items;
      const box = W.el('div', { class: 'tgroup' },
        W.el('div', { class: 'tgcap' }, W.icon(g.icon, 13), g.label, W.el('span', { class: 'n', text: String(items.length) })));
      if (!items.length) box.append(W.el('div', { class: 'tempty', text: g.key === 'open' ? 'Nothing pending. The forge rests.' : 'No sealed tasks yet.' }));
      items.forEach(t => box.append(row(t)));
      grid.append(box);
    });

    r.innerHTML = ''; r.append(grid);
  }

  W.joltShake = el => {
    el.style.transition = 'transform .3s';
    el.style.animation = 'jolt .3s';
    setTimeout(() => { el.style.animation = ''; el.style.transition = ''; }, 320);
  };
  if (!document.getElementById('joltkeyframes')) {
    const st = document.createElement('style'); st.id = 'joltkeyframes';
    st.textContent = '@keyframes jolt{25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}';
    document.head.append(st);
  }

  W.todo = { render };
})();
