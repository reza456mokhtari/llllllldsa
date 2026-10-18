/* ============================================================
   EPIC MODE — view.habits.js
   «پروتکل‌ها» — عادت‌ها: باند ۷روزه، زنجیره، حذف/ویرایش
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};

  function render() {
    const habits = C.store.q.habits();
    const today = C.jad.todayIso();

    /* نوار افزودن */
    const d = { title: '', days: [0, 1, 2, 3, 4, 5, 6] };
    const dayDials = C.el('div', { class: 'tablist' });
    C.jad.jWeek.forEach((w, i) => dayDials.append(C.el('button', {
      class: 'cell daycall' + (d.days.includes(i) ? ' on' : ''), type: 'button', 'data-d': String(i),
      text: w, 'aria-pressed': String(d.days.includes(i)),
      onclick: e => {
        const b = e.currentTarget, idx = Number(b.dataset.d), i2 = d.days.indexOf(idx);
        if (i2 >= 0) { d.days.splice(i2, 1); b.classList.remove('on'); }
        else { d.days.push(idx); b.classList.add('on'); }
        b.setAttribute('aria-pressed', b.classList.contains('on'));
      },
    })));
    const titleInp = C.el('input', {
      type: 'text', placeholder: 'عنوان پروتکل… (مثل: 一 لیوان آب؟ نه! — نرمش)',
      oninput: e => d.title = e.target.value,
      onkeydown: e => { if (e.key === 'Enter') addBtn.click(); },
    });
    const addBtn = C.el('button', { class: 'btn bfire', type: 'button', html: C.icon('plus') + ' درج پروتکل' });
    addBtn.addEventListener('click', () => {
      const title = d.title.trim();
      if (!title) { C.jolt(titleInp); C.toast('عنوان پروتکل را بنویس'); return; }
      C.store.insert({ type: 'habit', title, days: [...d.days].sort(), log: {}, ts: Date.now() });
      d.title = ''; titleInp.value = '';
      C.sparksAt(addBtn, 20);
      C.bus.emit('rerender');
      C.toast(`پروتکل «${title}» فعال شد ${C.icon('bolt', 'i')}`);
    });
    const adder = C.el('div', { class: 'panelbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('pulse', 'i sm') }), C.el('b', { text: 'پروتکل تازه' })),
      C.el('div', { class: 'field' }, titleInp, C.el('span', { html: C.icon('run') })),
      C.el('div', { class: 'fields' }, dayDials),
      C.el('div', { class: 'bwrap' }, addBtn));

    /* ستون‌های هفتی */
    const band = C.el('div', { class: 'harea' });
    habits.forEach(h => band.append(habitRow(h, today)));
    if (!habits.length) band.append(C.emptyState('هیچ پروتکلی فعال نیست — اولین عادت را فجر کن', 'bolt'));

    /* خلاصه: نرخ هفته + زنجیرهٔ بزرگ‌ترین */
    let best = 0, bestName = '';
    habits.forEach(h => { const s = streakOf(h, today); if (s > best) { best = s; bestName = h.title; } });
    const summary = C.el('div', { class: 'panelbox habsum' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('flame', 'i sm') }), C.el('b', { text: 'سنجش پروتکل' })),
      C.el('div', { class: 'veys' },
        C.el('span', { class: 'grip' }, C.el('i', { class: 'dot' }), C.el('span', { text: 'پروتکل‌ها: ' + C.faN(habits.length) })),
        C.el('span', { class: 'grip' }, C.el('i', { class: 'dot chill' }), C.el('span', { text: 'امروز: ' + C.faN(habits.filter(h => h.log?.[today]).length) + ' تحقق' })),
        C.el('span', { class: 'grip' }, C.el('i', { class: 'dot' }), C.el('span', { text: `داغ‌ترین زنجیره: ${C.faN(best)} روز` })),
      ),
      bestName ? C.el('div', { class: 'hint', text: 'برندهٔ تداوم: ' + bestName }) : null);

    const host = C.el('div', { class: 'sec', 'data-view': 'habits' },
      C.el('section', { class: 'card pain' },
        C.el('div', { class: 'veil' }),
        C.secbar('SEC.03 // RITUALS', 'پروتکل‌های تداوم', 'bolt',
          C.el('span', { class: 'tag', html: `${C.icon('cal', 'i')} هفتهٔ ${C.jad.jWeek[C.jad.weekdayOfIso(today)]}` })),
        C.el('div', { class: 'secbody' },
          adder,
          band,
          summary)),
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i>' }));
    return host;
  }

  /* زنجیرهٔ متوالی (ایست در روزهای مجاز این پروتکل) */
  function streakOf(h, today) {
    const allowed = h.days?.length ? h.days : [0, 1, 2, 3, 4, 5, 6];
    let streak = 0, cursor = today, guard = 0;
    while (guard++ < 400) {
      const wk = C.jad.weekdayOfIso(cursor);
      if (allowed.includes(wk)) {
        if (h.log?.[cursor]) streak++;
        else if (cursor !== today) break;
      } else if (!h.log?.[cursor]) {
        // روز غیرمجاز، بدون وقفه
      }
      cursor = C.jad.addDaysIso(cursor, -1);
    }
    return streak;
  }

  /* ---------- ردیف پروتکل ---------- */
  function habitRow(h, today) {
    const wk = C.jad.weekdayOfIso(today);
    /* لنگرگاه روز هفته: از شنبه این هفته */
    const startOffset = wk;
    const litToday = !!h.log?.[today];
    const doneCount = h.days.reduce((n, di) => {
      const step = di - wk; // نسبت به امروز
      const iso = step <= 0 ? C.jad.addDaysIso(today, step) : null;
      return iso && h.log?.[iso] ? n + 1 : n;
    }, 0);

    const band = C.el('div', { class: 'hdays' });
    C.jad.jWeek.forEach((_, i2) => {
      const step = i2 - wk;
      const iso = step <= 0 ? C.jad.addDaysIso(today, step) : null;
      const lit = iso ? !!h.log?.[iso] : false;
      const allowed = h.days?.includes(i2);
      const isToday = i2 === wk;
      const btn = C.el('button', {
        class: 'hd' + (lit ? ' lit' : '') + (!allowed ? ' dead' : '') + (isToday ? ' today' : ''),
        type: 'button', title: iso ? `${C.jad.jWeek[i2]} — ${C.fa(iso)}` : `${C.jad.jWeek[i2]} (آینده)`,
        'aria-pressed': String(lit), 'aria-label': `${h.title} — ${C.jad.jWeek[i2]}`,
        text: C.jad.jWeekMin[i2], disabled: !iso || undefined,
      });
      if (iso) {
        btn.addEventListener('click', () => {
          const next = !h.log?.[iso];
          const log = { ...(h.log || {}) };
          if (next) log[iso] = true; else delete log[iso];
          C.store.update(h.id, { log });
          C.sparksAt(btn, next ? 16 : 0);
          if (next && C.store.q.habits().every(x => x.log?.[iso] || !x)) C.toast('پروتکل کامل امروز — سپت ۵ ستاره ' + C.icon('star', 'i'));
          C.bus.emit('rerender');
        });
      }
      band.append(btn);
    });

    const row = C.el('article', { class: 'hrow', 'data-done': String(litToday), 'data-id': h.id },
      C.el('button', {
        class: 'chk' + (litToday ? ' on' : ''), type: 'button', 'aria-checked': String(litToday),
        'aria-label': 'تحقق امروز', html: C.icon('tick', 'i'),
        title: 'امروز انجام شد؟',
        onclick: e => {
          const log = { ...(h.log || {}) };
          if (litToday) delete log[today]; else log[today] = true;
          C.store.update(h.id, { log });
          if (!litToday) { C.sparksAt(e.currentTarget, 22); C.toast(`«${h.title}» امروز واقعی شد ${C.icon('flame', 'i')}`); }
          C.bus.emit('rerender');
        },
      }),
      C.el('div', { class: 'core' },
        C.el('h4', { text: h.title }),
        C.el('div', { class: 'strikeit' },
          C.el('span', { html: C.icon('run', 'i sm') }),
          C.el('span', { text: `تداوم هفته: ` }),
          C.el('span', { html: C.icon('cal', 'i sm') }),
          C.el('span', { class: 'tag', text: `${C.faN(doneCount)}/${C.faN(h.days.length)}` }),
          C.el('span', { class: 'tag', text: 'روزهای فعال: ' + h.days.map(i2 => C.jad.jWeekMin[i2]).join(' ') }))),
      C.el('div', { class: 'dv' },
        band,
        C.el('div', { class: 'sides' },
          C.el('span', { class: 'streakb' },
            C.el('span', { html: C.icon('bolt', 'i sm') }),
            C.el('b', { text: C.faN(streakOf(h, today)) + ' روز' })),
          C.el('button', { class: 'sun', type: 'button', title: 'ویرایش/حذف', html: C.icon('pen', 'i sm'),
            onclick: () => editHabit(h) }))));
    return row;
  }

  function editHabit(h) {
    let days = [...(h.days || [])];
    const box = C.el('div', { class: 'confirm dosage' });
    box.innerHTML = `
      <h3>${C.icon('pen')} ویرایش پروتکل</h3>
      <div class="field"><input id="ht" value="${C.escapeHtml(h.title)}"><span>${C.icon('run')}</span></div>
      <div class="help">${C.icon('cal', 'i')} روزهای تکرار در هفته را روشن/خاموش کن.</div>
      <div class="cuo" id="hdays">
        ${C.jad.jWeek.map((w, i) => `<button type="button" class="cell kindcell ${days.includes(i) ? 'on' : ''}" data-d="${i}">${w}</button>`).join('')}
      </div>
      <div class="barfoot">
        <button class="btn bghost bmicro danger" data-del>${C.icon('trash')} حذف پروتکل</button>
        <span class="push"></span>
        <button class="btn bfire" data-ok>${C.icon('tick')} ذخیره</button>
      </div>`;
    const off = C.overlay(box);
    box.querySelectorAll('#hdays .kindcell').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.d);
      if (days.includes(i)) { days = days.filter(x => x !== i); b.classList.remove('on'); }
      else { days.push(i); b.classList.add('on'); }
    }));
    box.querySelector('[data-del]').addEventListener('click', async () => {
      off();
      if (await C.confirmBox('حذف پروتکل', `«${h.title}» و پیشینهٔ تیک‌هایش حذف شود؟`, 'حذف کن')) {
        C.store.remove(h.id); C.bus.emit('rerender'); C.toast('پروتکل حذف شد');
      }
    });
    box.querySelector('[data-ok]').addEventListener('click', () => {
      C.store.update(h.id, { title: box.querySelector('#ht').value.trim() || h.title, days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] });
      off(); C.toast('پروتکل به‌روز شد'); C.bus.emit('rerender');
    });
  }

  views.habits = { id: 'habits', label: 'پروتکل‌ها', icon: 'bolt', kicker: 'پروتکل', render };
})();
