/* ============================================================
   EPIC MODE — view.notes.js
   «خمرهٔ اسناد» — یادداشت‌ها: پین، ویرایش، حذف، رنگ
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};

  function render() {
    const notes = C.store.q.notes().slice().sort((a, b) => (b.pinned - a.pinned) || (b.ts - a.ts));

    const d = { title: '', body: '', pinned: false };
    const titleInp = C.el('input', { type: 'text', placeholder: 'عنوان یادداشت…', oninput: e => d.title = e.target.value });
    const bodyInp = C.el('textarea', { rows: '3', placeholder: 'متن یادداشت — هرچه دلی بخواهد بگو. (Ctrl+Enter = ثبت)', oninput: e => d.body = e.target.value });
    bodyInp.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addBtn.click(); });
    const addBtn = C.el('button', { class: 'btn bfire', type: 'button', html: C.icon('plus') + ' ثبت در خمره' });
    addBtn.addEventListener('click', () => {
      const body = d.body.trim();
      if (!body && !d.title.trim()) { C.jolt(titleInp); C.toast('چیزی بنویس تا خاک نگیرد'); return; }
      C.store.insert({ type: 'note', title: d.title.trim() || 'بدون عنوان', body, pinned: false });
      d.title = ''; d.body = '';
      titleInp.value = ''; bodyInp.value = '';
      C.sparksAt(addBtn, 20);
      C.bus.emit('rerender');
      C.toast('یادداشت خمره شد ' + C.icon('note', 'i'));
    });

    const adder = C.el('div', { class: 'panelbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('note', 'i sm') }), C.el('b', { text: 'یادداشت تازه' })),
      titleInp, bodyInp,
      C.el('div', { class: 'bwrap' }, addBtn));

    const notebook = C.el('div', { class: 'notebook' });
    notes.forEach(n => notebook.append(peg(n)));
    if (!notes.length) notebook.append(C.emptyState('خمّر خالی — هر فکری که قابلیس، بنداز اینجا', 'note'));

    const host = C.el('div', { class: 'sec', 'data-view': 'notes' },
      C.el('section', { class: 'card pain' },
        C.el('div', { class: 'veil' }),
        C.secbar('SEC.04 // GRID', 'خمّر یادداشت‌ها', 'note',
          C.el('span', { class: 'tag', html: `${C.icon('note', 'i')} ${C.faN(notes.length)} سند` })),
        C.el('div', { class: 'secbody' }, adder, notebook)),
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i>' }));
    return host;
  }

  function footerStamp(n) {
    const d = new Date(n.ts || Date.now());
    const date = C.fa(C.jad.isoJalali(d));
    const time = C.fa(C.pad2(d.getHours()) + ':' + C.pad2(d.getMinutes()));
    return `${date} · ${time}`;
  }

  function peg(n) {
    const card = C.el('article', { class: 'peg' + (n.pinned ? ' pinned' : ''), 'data-id': n.id },
      n.pinned ? C.el('span', { class: 'badge', text: 'میخ‌شده' }) : null,
      C.el('div', { class: 'title' },
        C.el('span', { html: C.icon(n.pinned ? 'pin' : 'note', 'i sm'), style: { color: n.pinned ? 'var(--orange)' : 'var(--ink3)' } }),
        C.el('h4', { text: n.title })),
      C.el('p', { class: 'note-body', text: n.body || '—' }),
      C.el('footer', {},
        C.el('span', { text: footerStamp(n) }),
        C.el('div', { class: 'seck' },
          C.el('button', {
            class: 'sun pin', type: 'button', title: n.pinned ? 'برداشتن از میخچه' : 'میخ‌کردن بالا', html: C.icon('pin', 'i sm'),
            onclick: () => { C.store.update(n.id, { pinned: !n.pinned }); C.bus.emit('rerender'); },
          }),
          C.el('button', {
            class: 'sun', type: 'button', title: 'ویرایش', html: C.icon('pen', 'i sm'),
            onclick: () => editNote(n),
          }),
          C.el('button', {
            class: 'sun', type: 'button', title: 'حذف', html: C.icon('trash', 'i sm'),
            onclick: async () => {
              if (await C.confirmBox('حذف یادداشت', `«${n.title}» از خمّر حذف شود؟`, 'حذف کن')) {
                C.store.remove(n.id); C.bus.emit('rerender'); C.toast('سند خاکستری شد و حذف');
              }
            },
          }))));
    return card;
  }

  function editNote(n) {
    const box = C.el('div', { class: 'confirm dosage' });
    box.innerHTML = `
      <h3>${C.icon('pen')} ویرایش سند</h3>
      <div class="field"><input id="nt" value="${C.escapeHtml(n.title)}"><span>${C.icon('note')}</span></div>
      <div class="field"><textarea id="nb" rows="5" placeholder="متن">${C.escapeHtml(n.body || '')}</textarea></div>
      <div class="barfoot">
        <span class="hint">${footerStamp(n)}</span>
        <span class="push"></span>
        <button class="btn bfire" data-ok>${C.icon('tick')} ذخیره</button>
      </div>`;
    const off = C.overlay(box);
    box.querySelector('[data-ok]').addEventListener('click', () => {
      C.store.update(n.id, {
        title: box.querySelector('#nt').value.trim() || n.title,
        body: box.querySelector('#nb').value,
      });
      off(); C.toast('سند به‌روز شد'); C.bus.emit('rerender');
    });
  }

  views.notes = { id: 'notes', label: 'خمّر اسناد', icon: 'note', kicker: 'اسناد', render };
})();
