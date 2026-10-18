/* ============================================================
   EPIC MODE — view.tasks.js
   «انبار» — کارها با اولویت، فیلتر، درگ‌اند‌دراپ، ویرایش
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};

  let filter = 'open';
  const FILTERS = [
    { id: 'open', label: 'در جریان' },
    { id: 'done', label: 'انجام‌شده' },
    { id: 'all', label: 'همه' },
  ];
  const PRIO = { high: 'فوری', mid: 'مهم', low: 'سبک' };

  function countOf(list) { return list.length; }
  function viewOf() {
    const all = C.DB.entries.filter(e => e.type === 'task');
    return { all, open: all.filter(t => !t.done), done: all.filter(t => t.done) };
  }

  function render() {
    const snapshot = viewOf();
    const list = filter === 'all' ? snapshot.all : snapshot[filter];

    /* کمربند فیلتر */
    const tabs = C.el('div', { class: 'tablist' });
    FILTERS.forEach(f => tabs.append(C.el('button', {
      class: 'scell', type: 'button', role: 'tab',
      'data-f': f.id, 'aria-selected': String(filter === f.id),
      html: `${f.label} <span class="n">${C.faN(countOf(snapshot[f.id]))}</span>`,
      onclick: e => { filter = f.id; C.bus.emit('rerender'); },
    })));

    /* نوار افزودن */
    const d = { title: '', prio: 'mid', note: '', date: '' };
    const priority = C.el('div', { class: 'fields kindrow' });
    Object.keys(PRIO).forEach(p => priority.append(C.el('button', {
      class: 'cell kindcell' + (p === d.prio ? ' on' : ''), type: 'button', 'data-p': p,
      html: C.icon(p === 'high' ? 'bolt' : p === 'mid' ? 'target' : 'dot', 'i') + ' ' + PRIO[p],
      onclick: e => {
        d.prio = p;
        priority.querySelectorAll('.kindcell').forEach(b => b.classList.remove('on'));
        e.currentTarget.classList.add('on');
      },
    })));
    const titleInp = C.el('input', {
      type: 'text', placeholder: 'کار تازه… (Enter = درج)',
      oninput: e => d.title = e.target.value,
      onkeydown: e => { if (e.key === 'Enter') addBtn.click(); },
    });
    const dateInp = C.el('input', { type: 'text', class: 'datein', placeholder: '۱۴۰۵/۰۷/۲۵ (اختیاری)', oninput: e => d.date = e.target.value.trim() });
    dateInp.addEventListener('focus', () => dateInp.value = dateInp.value || C.jad.todayIso());
    const noteInp = C.el('textarea', { rows: '2', placeholder: 'جزئیات؟ (اختیاری)', oninput: e => d.note = e.target.value });
    const addBtn = C.el('button', { class: 'btn bfire', type: 'button', html: C.icon('plus') + ' درج در انبار' });
    addBtn.addEventListener('click', () => {
      const title = d.title.trim();
      if (!title) { C.toast('عنوان کار را بنویس');
        titleInp.classList.add('bump'); setTimeout(() => titleInp.classList.remove('bump'), 420); return; }
      let date = null;
      const raw = C.en(d.date);
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) date = raw;
      C.store.insert({ type: 'task', title, prio: d.prio, done: false, note: d.note.trim(), date, anchor: false, doneDate: null });
      d.title = ''; d.note = ''; d.date = '';
      titleInp.value = ''; noteInp.value = ''; dateInp.value = '';
      C.sparksAt(addBtn, 18);
      C.bus.emit('rerender');
      C.toast(`«${title}» وارد انبار شد ${C.icon('bolt', 'i')}`);
    });
    const adder = C.el('div', { class: 'panelbox addbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('plus', 'i sm') }), C.el('b', { text: 'کار تازه' })),
      C.el('div', { class: 'field' }, titleInp, C.el('span', { html: C.icon('pen') })),
      C.el('div', { class: 'fields' }, priority, dateInp),
      noteInp,
      C.el('div', { class: 'bwrap' }, addBtn));

    /* لیست */
    const ul = C.el('div', { class: 'tasks' });
    if (!list.length) {
      ul.append(C.emptyState(filter === 'done' ? 'هنوز هیچ پیروزی‌ای ذخیره نشده' : 'انبار خالی — اولین کار را ورود کن', 'task'));
    }
    list.forEach(t => ul.append(pill(t)));
    C.dragSort([...ul.querySelectorAll('.pill[data-dr="1"]')], ids => C.store.reorder(ids));

    const host = C.el('div', { class: 'sec', 'data-view': 'tasks' },
      C.el('section', { class: 'card pain' },
        C.el('div', { class: 'veil' }),
        C.secbar('SEC.02 // OPS', 'انبار کارها', 'task', tabs),
        C.el('div', { class: 'secbody' },
          adder,
          ul,
          statFoot(snapshot))),
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i>' }));
    return host;
  }

  function statFoot(snap) {
    const pct = snap.all.length ? Math.round(snap.done.length / snap.all.length * 100) : 0;
    return C.el('div', { class: 'statfoot strip-dock' },
      C.el('span', { class: 'grip' }, C.el('i', { class: 'dot' }), C.el('span', { text: `بازمانده: ${C.faN(snap.open.length)}` })),
      C.el('span', { class: 'grip' }, C.el('i', { class: 'dot cold' }), C.el('span', { text: `پیروزی: ${C.faN(snap.done.length)}` })),
      C.el('span', { class: 'grip' }, C.el('i', { class: 'dot' }), C.el('span', { text: `نرخ برد: ${C.faN(pct)}٪` })));
  }

  /* ---------- ردیف کار ---------- */
  function pill(t) {
    const row = C.el('article', {
      class: 'pill' + (t.done ? ' done' : ''), 'data-state': t.done ? 'done' : 'open',
      'data-id': t.id, 'data-prio': t.prio, 'data-dr': t.done ? '0' : '1',
      tabindex: '0',
      onkeydown: e => {
        if (e.key === 'Enter' && e.metaKey) { toggle(e); }
        if (e.key === ' ' && e.target === row) { e.preventDefault(); toggle(e); }
      },
    });
    const chk = C.el('button', { class: 'chk', type: 'button', role: 'checkbox', 'aria-checked': String(!!t.done), 'aria-label': 'تغییر وضعیت', html: C.icon('tick', 'i') });
    chk.addEventListener('click', toggle);
    row.append(
      chk,
      C.el('div', { class: 'core' },
        C.el('h4', { text: t.title }),
        C.el('div', { class: 'chipwhirl' },
          t.anchor ? C.el('span', { class: 'tag blue', html: `${C.icon('anchor', 'i')} مأمور امروز` }) : null,
          t.date ? C.el('span', { class: 'tag', html: `${C.icon('cal', 'i')} ${C.fa(t.date)}` }) : null,
          t.done && t.doneDate ? C.el('span', { class: 'tag', html: `${C.icon('tick', 'i')} ${C.fa(t.doneDate)}` }) : null,
          C.el('span', { html: C.prioTag(t.prio) }),
          t.note ? C.el('span', { class: 'tag', title: t.note, text: 'یادداشت' }) : null)),
      C.el('div', { class: 'side' },
        C.el('div', { class: 'scrub' },
          ...(!t.done ? [
            btn('cal', 'زمان‌گذاری روی ریل', () => scheduleToToday(t)),
            btn('anchor', t.anchor ? 'برداشتن لنگر' : 'لنگر: مأمورِ ثابت امروز', () => {
              t.anchor = !t.anchor;
              C.store.update(t.id, { anchor: t.anchor, date: t.anchor ? C.jad.todayIso() : t.date });
              C.bus.emit('rerender');
              C.toast(t.anchor ? `«${t.title}» مأمورِ امروز شد ${C.icon('anchor', 'i')}` : 'لنگر برداشته شد');
            }),
          ] : []),
          btn('pen', 'ویرایش', () => editTask(t)),
          btn('trash', 'حذف', async () => {
            if (await C.confirmBox('حذف کار', `«${t.title}» برای همیشه حذف شود؟`, 'حذف کن')) {
              C.store.remove(t.id); C.bus.emit('rerender'); C.toast('حذف شد');
            }
          }))));
    function toggle() {
      const done = !t.done;
      C.store.update(t.id, { done, doneDate: done ? C.jad.todayIso() : null, anchor: done ? false : t.anchor });
      if (done) { C.sparksAt(chk, 26); C.toast(`«${t.title}» پیروز شد ${C.icon('star', 'i')}`); }
      C.bus.emit('rerender');
    }
    function btn(ic, label, fn) {
      const b = C.el('button', { class: 'sun' + (ic === 'anchor' ? ' pop' : ''), type: 'button', title: label, 'aria-label': label, html: C.icon(ic, 'i sm') });
      b.addEventListener('click', e => { e.stopPropagation(); fn(e); });
      return b;
    }
    return row;
  }

  /* ---------- اکشن‌ها ---------- */
  function scheduleToToday(t) {
    C.store.update(t.id, { type: 'event', kind: 'ops', date: C.jad.todayIso(), start: '18:00', dur: 60, anchor: false, note: t.note || '' });
    C.bus.emit('rerender');
    C.navGo && C.navGo('planner');
    C.toast(`«${t.title}» منتظرِ ریل ساعت ۱۸:۰۰ ${C.icon('cal', 'i')}`);
  }

  /* ---------- ویرایش کار ---------- */
  function editTask(t) {
    let prio = t.prio;
    const box = C.el('div', { class: 'confirm dosage' });
    box.innerHTML = `
      <h3>${C.icon('pen')} ویرایش کار</h3>
      <div class="field"><input id="tt" value="${C.escapeHtml(t.title)}"><span>${C.icon('pen')}</span></div>
      <div class="cuo">
        ${Object.entries(PRIO).map(([p, l]) => `<button type="button" class="cell kindcell ${t.prio === p ? 'on' : ''}" data-prio="${p}">${C.icon(p === 'high' ? 'bolt' : p === 'mid' ? 'target' : 'dot', 'i')} ${l}</button>`).join('')}
      </div>
      <div class="field"><input id="td" value="${t.date ? C.fa(t.date) : ''}" placeholder="‌تاریخ شمسی ۱۴۰۵/۰۷/۲۵"><span>${C.icon('cal')}</span></div>
      <div class="field"><textarea id="tn" rows="3" placeholder="جزئیات">${C.escapeHtml(t.note || '')}</textarea></div>
      <div class="barfoot">
        <button class="btn bghost bmicro danger" data-del>${C.icon('trash')} حذف</button>
        <span class="push"></span>
        <button class="btn bfire" data-ok>${C.icon('tick')} ذخیره</button>
      </div>`;
    const off = C.overlay(box);
    box.querySelectorAll('.kindcell').forEach(b => b.addEventListener('click', () => {
      prio = b.dataset.prio;
      box.querySelectorAll('.kindcell').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    }));
    box.querySelector('[data-del]').addEventListener('click', async () => {
      off();
      if (await C.confirmBox('حذف کار', `«${t.title}» حذف شود؟`, 'حذف کن')) {
        C.store.remove(t.id); C.bus.emit('rerender');
      }
    });
    box.querySelector('[data-ok]').addEventListener('click', () => {
      const raw = C.en(box.querySelector('#td').value.trim());
      C.store.update(t.id, {
        title: box.querySelector('#tt').value.trim() || t.title,
        prio: prio,
        date: /^\d{4}\/\d{2}\/\d{2}$/.test(raw) ? raw : null,
        note: box.querySelector('#tn').value.trim(),
      });
      off(); C.toast('ویرایش ذخیره شد'); C.bus.emit('rerender');
    });
  }

  views.tasks = { id: 'tasks', label: 'انبار کارها', icon: 'task', kicker: 'انبار', render };
})();
