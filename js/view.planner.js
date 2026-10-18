/* ============================================================
   EPIC MODE — view.planner.js
   «اتاق فرمان» — ریل عمودی روز: مأموریت‌ها، کشیدن، ویرایش
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};

  const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const DAY_START = 6 * 60, HOUR_PX = 46;
  const KINDS = {
    meet: { icon: 'task', label: 'جلسه' },
    dep: { icon: 'target', label: 'تمرکز عمیق' },
    fit: { icon: 'run', label: 'قدرت' },
    ops: { icon: 'wave', label: 'عملیات' },
  };

  const toMin = s => { const [h, m] = C.en(s).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  const toDur = d => Math.max(15, Number(d) || 60);
  const fmtMin = m => C.fa(`${C.pad2(Math.floor(m / 60) % 24)}:${C.pad2(m % 60)}`);
const fmtISO = m => `${C.pad2(Math.floor(m / 60) % 24)}:${C.pad2(m % 60)}`;
  const snap = (m, step = 5) => Math.max(DAY_START, Math.min(1425, Math.round(m / step) * step));
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const todayEvents = iso => C.store.q.events().filter(e => e.date === iso)
    .sort((a, b) => toMin(a.start) - toMin(b.start));

  let timer = null, refs = null, dragCtx = false, moved = false, editKind = null;

  /* اولین بازهٔ آزاد با طول need از fromMin */
  function freeGap(list, fromMin, need) {
    const busy = list.map(e => [toMin(e.start), toMin(e.start) + toDur(e.dur)]).sort((a, b) => a[0] - b[0]);
    let t = Math.max(DAY_START, Math.round(fromMin / 15) * 15);
    let guard = 0;
    while (guard++ < 200) {
      const hit = busy.find(b => t < b[1] && t + need > b[0]);
      if (!hit) return Math.min(t, 1425 - need);
      t = Math.ceil(hit[1] / 15) * 15;
    }
    return 1290;
  }

  /* ================= رندر بخش ================= */
  function render() {
    const iso = C.jad.todayIso();
    const jal = C.jad.toJalali(new Date());

    const wrap = C.el('div', { class: 'lanewrap', style: { height: (HOURS.length * HOUR_PX) + 'px' } });
    HOURS.forEach((h, i) => wrap.append(C.el('i', { class: 'lane-hour', style: { top: (i * HOUR_PX) + 'px' } })));
    const pill = C.el('div', { class: 'nowpill', 'aria-hidden': 'true' },
      C.el('span', { class: 'label', text: 'اکنون' }), C.el('span', { class: 'lead' }));
    const flo = C.el('div', { class: 'floathr', 'aria-hidden': 'true' },
      C.el('span', { class: 'pin' }), C.el('span', { class: 'ft', text: '--:--' }));
    const lane = C.el('div', { class: 'tl', style: { height: (16 + HOURS.length * HOUR_PX + 6) + 'px' } },
      C.el('div', { class: 'ruler' }), wrap, pill, flo);
    HOURS.forEach(h => lane.append(C.el('span', {
      class: 'tick', text: C.fa(C.pad2(h) + ':00'),
      style: { top: (16 + (h - 6) * HOUR_PX) + 'px' },
    })));

    const laneCard = C.el('section', { class: 'card pain' },
      C.el('div', { class: 'veil' }),
      C.secbar('SEC.01 // PLANNER', 'مأموریت‌های امروز', 'shell',
        C.el('span', { class: 'tag', html: `${C.icon('cal', 'i')} ${jal.wkName} ${C.faN(jal.jd)} ${jal.monthName} ${C.faN(jal.jy)}` })),
      C.el('div', { class: 'secbody' }, lane),
      C.el('div', { class: 'lanefoot hint',
        html: `${C.icon('grip', 'i')} بگیر و بکُش برای جابه‌جایی · لبهٔ پایین = کش‌دادن طول · کلیک = ویرایش` }));

    paint(wrap, lane, iso);

    const rhythm = C.el('div', { class: 'pulsebar ritm' },
      C.el('i', { class: 'fill', style: { '--p': '0%' } }),
      C.el('i', { class: 'panache' }),
      C.el('span', { class: 'steps', text: '۰%' }));

    const host = C.el('div', { class: 'sec', 'data-view': 'planner' },
      rhythm,
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i><i class="ribbon"></i>' }),
      C.el('div', { class: 'pgrid' }, laneCard, commandCard(iso)));

    refs = { pill, flo, rhythm };
    paintRhythm();
    clearInterval(timer);
    timer = setInterval(() => { if (document.contains(pill)) paintRhythm(); }, 20000);
    return host;
  }

  /* ---------- رنگ‌آمیزی ریل ---------- */
  function paint(wrap, lane, iso) {
    wrap.querySelectorAll('.opblock').forEach(n => n.remove());
    for (const ev of todayEvents(iso)) {
      const s = toMin(ev.start), dur = toDur(ev.dur), e = s + dur;
      const top = (s - DAY_START) / 60 * HOUR_PX;
      const h = Math.max(28, Math.min(HOURS.length * HOUR_PX - top - 4, dur / 60 * HOUR_PX - 4));
      const k = KINDS[ev.kind] || KINDS.ops;
      const past = nowMin() > e - 1;
      const blok = C.el('div', { class: 'opblock' + (past ? ' past' : ''), 'data-id': ev.id,
        style: { top: top + 'px', height: h + 'px' } },
        C.el('div', { class: 'opb-in' },
          C.el('div', { class: 'opb-head' },
            C.el('span', { class: 'opb-time', text: fmtMin(s) }),
            C.el('span', { class: 'opb-dur', text: `${C.faN(dur)}′ · ${k.label}` })),
          C.el('div', { class: 'opb-title', text: ev.title }),
          h > 50 ? C.el('div', { class: 'opb-note', text: ev.note || '' }) : null),
        C.el('button', { class: 'grip', type: 'button', title: 'بکُش برای جابه‌جایی · لبهٔ پایین = کش‌دادن', html: C.icon('grip') }));
      wireDrag(blok, ev, lane, wrap, iso);
      blok.addEventListener('click', () => { if (!moved) editMission(ev, iso); });
      wrap.append(blok);
    }
  }
  /* ---------- کشیدن (جابه‌جایی/کش‌دادن) ---------- */
  function wireDrag(blok, ev, lane, wrap, iso) {
    blok.addEventListener('pointerdown', e0 => {
      if (e0.button !== 0) return;
      moved = false;
      const y0 = e0.clientY;
      const isResize = e0.clientY > blok.getBoundingClientRect().bottom - 14;
      const s0 = toMin(ev.start);
      const dur0 = toDur(ev.dur);
      let start = s0, dur = dur0;

      const headY = m => {
        const r = lane.getBoundingClientRect();
        return snap((m - r.top) / HOUR_PX * 60 + DAY_START);
      };
      const mv = e1 => {
        if (!dragCtx) {
          if (Math.abs(e1.clientY - y0) < 5) return;
          dragCtx = true;
          blok.classList.add(isResize ? 'resizing' : 'dragging');
          document.body.style.userSelect = 'none';
          C.toast(isResize ? 'کشِ طول فعال' : 'جابه‌جایی فعال', 900);
        }
        moved = true;
        e1.preventDefault();
        if (isResize) {
          dur = Math.max(15, headY(e1.clientY) - start);
          blok.style.height = Math.max(28, dur / 60 * HOUR_PX - 4) + 'px';
          blok.querySelector('.opb-dur').textContent = `${C.faN(dur)}′`;
        } else {
          start = snap(headY(e1.clientY));
          blok.style.top = ((start - DAY_START) / 60 * HOUR_PX) + 'px';
          blok.querySelector('.opb-time').textContent = fmtMin(start);
        }
      };
      const up = () => {
        removeEventListener('pointermove', mv);
        removeEventListener('pointerup', up);
        document.body.style.userSelect = '';
        blok.classList.remove('dragging', 'resizing');
        const changed = dragCtx;
        dragCtx = false;
        if (changed && (start !== s0 || dur !== dur0)) {
          C.store.update(ev.id, { start: fmtISO(start), dur });
          C.bus.emit('rerender');
        }
      };
      addEventListener('pointermove', mv);
      addEventListener('pointerup', up);
      e0.preventDefault();
    });
  }

  /* ---------- پالس روز ---------- */
  function paintRhythm() {
    const m = nowMin();
    const inDay = m >= DAY_START && m < 24 * 60;
    const top = (m - DAY_START) / 60 * HOUR_PX;
    if (refs?.pill) {
      refs.pill.style.top = top + 'px';
      refs.pill.style.visibility = inDay ? 'visible' : 'hidden';
    }
    if (refs?.flo) {
      refs.flo.style.top = top + 'px';
      refs.flo.style.visibility = inDay ? 'visible' : 'hidden';
      refs.flo.querySelector('.ft').textContent = fmtMin(m);
    }
    const pct = Math.round(Math.max(0, Math.min(100, ((m - DAY_START) / (18 * 60)) * 100)));
    const txt = `${C.faN(pct)}% از روز · ${fmtMin(m)}`;
    document.querySelectorAll('.pulsebar').forEach(pb => {
      pb.querySelector('.fill')?.style.setProperty('--p', pct + '%');
      const st = pb.querySelector('.steps');
      if (st) st.textContent = txt;
    });
    document.querySelectorAll('.whenclock').forEach(cw => { cw.textContent = fmtMin(m); });
  }

  /* ---------- ستون فرمان ---------- */
  function commandCard(iso) {
    const draftStart = fmtISO(freeGap(todayEvents(iso), nowMin() + 15, 60));
    const d = { title: '', start: draftStart, dur: 60, kind: 'meet', note: '' };

    const titleInp = C.el('div', { class: 'field' },
      C.el('input', { id: 'mtitle', type: 'text', placeholder: 'عنوان مأموریت…',
        oninput: e => { d.title = e.target.value; } }),
      C.el('span', { html: C.icon('pen') }));
    const startInp = C.el('div', { class: 'field' },
      C.el('input', { id: 'mstart', type: 'time', value: d.start,
        oninput: e => { d.start = e.target.value; } }),
      C.el('span', { html: C.icon('clock') }));
    const durSel = C.el('select', { class: 'cell', 'aria-label': 'مدت',
      onchange: e => { d.dur = Number(C.en(e.target.value)); } },
      ...[15, 30, 45, 60, 90, 120, 180].map(v =>
        C.el('option', { value: String(v), text: C.faN(v) + ' دقیقه', selected: v === 60 || undefined })));
    const kindDials = C.el('div', { class: 'fields kindrow' });
    Object.entries(KINDS).forEach(([k, v]) => kindDials.append(C.el('button', {
      class: 'cell kindcell' + (k === d.kind ? ' on' : ''), type: 'button', 'data-kind': k,
      html: `${C.icon(v.icon, 'i')} ${v.label}`,
      onclick: e => { d.kind = k; kindDials.querySelectorAll('.kindcell').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); },
    })));
    const noteInp = C.el('div', { class: 'field' },
      C.el('textarea', { id: 'mnote', rows: '2', placeholder: 'یادداشت کوتاه (اختیاری)',
        oninput: e => { d.note = e.target.value; } }));

    const addBtn = C.el('button', { class: 'btn bfire', type: 'button',
      html: C.icon('plus') + ' درج در ریل' });
    addBtn.addEventListener('click', () => {
      const title = d.title.trim();
      if (!title) { C.jolt(titleInp); C.toast('عنوان مأموریت را بگو تا ریل بخوردش'); return; }
      C.store.insert({ type: 'event', title, start: d.start, dur: d.dur, kind: d.kind, note: d.note.trim(), date: iso });
      d.title = ''; d.note = ''; d.start = draftStart;
      titleInp.querySelector('input').value = '';
      noteInp.querySelector('textarea').value = '';
      startInp.querySelector('input').value = d.start;
      C.sparksAt(addBtn, 24);
      C.toast(`«${title}» روی ریل نشست ${C.icon('bolt', 'i')}`);
      C.bus.emit('rerender');
    });
    const deepBtn = C.el('button', { class: 'btn bghost bmicro', type: 'button',
      html: C.icon('target') + ' اسلات عمیق ۵۵′' });
    deepBtn.addEventListener('click', () => {
      const slot = freeGap(todayEvents(iso), nowMin() + 5, 55);
      C.store.insert({ type: 'event', title: 'فرصت عمیق', start: fmtISO(slot), dur: 55, kind: 'dep', note: 'هدست روشن — تلفن سکوت', date: iso });
      C.bus.emit('rerender');
      C.toast('گودال تمرکز جای‌گذاری شد ' + C.icon('target', 'i'));
    });

    const form = C.el('div', { class: 'panelbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('plus', 'i sm') }), C.el('b', { text: 'درج مأموریت تازه' })),
      titleInp,
      C.el('div', { class: 'fields' }, startInp, durSel),
      kindDials,
      noteInp,
      C.el('div', { class: 'bwrap' }, addBtn, deepBtn));

    /* انبار کوتاه */
    const mini = C.el('div', { class: 'panelbox tasks-mini' });
    mini.append(C.el('div', { class: 'cap' },
      C.el('span', { html: C.icon('task', 'i sm') }), C.el('b', { text: 'از انبار به ریل' })));
    const pool = C.store.q.tasks().filter(t => !t.anchor).slice(0, 4);
    if (!pool.length) mini.append(C.emptyState('انبار خالی است — در تب انبار کار بساز', 'task'));
    pool.forEach(t => {
      const row = C.el('div', { class: 'minitask', 'data-id': t.id },
        C.el('span', { class: 'mtb', html: C.prioTag(t.prio) }),
        C.el('span', { class: 'mt-title', text: t.title }),
        C.el('button', { class: 'sun go', type: 'button', 'aria-label': 'زمان‌گذاری روی ریل', html: C.icon('calendarPlus') }));
      row.querySelector('.go').addEventListener('click', e => {
        e.stopPropagation();
        const slot = freeGap(todayEvents(iso), nowMin() + 15, 60);
        C.store.update(t.id, { type: 'event', kind: 'ops', date: iso, start: fmtISO(slot), dur: 60, anchor: false, note: t.note || '' });
        C.bus.emit('rerender');
        C.toast(`«${t.title}» به ریل امروز آمد ${C.icon('cal', 'i')}`);
      });
      mini.append(row);
    });
    mini.append(C.el('button', { class: 'cell', type: 'button', html: C.icon('grid', 'i sm') + ' بازکردن انبار', onclick: () => C.navGo && C.navGo('tasks') }));

    return C.el('aside', { class: 'card ppanel' },
      C.el('div', { class: 'pulsewrap' },
        C.el('div', { class: 'ptop' },
          C.el('span', { class: 'cap' },
            C.el('span', { html: C.icon('flame', 'i sm') }), C.el('span', { text: 'چرخهٔ روز' })),
          C.el('b', { class: 'whenclock', text: '--:--' })),
        C.el('div', { class: 'pulsebar' },
          C.el('i', { class: 'fill', style: { '--p': '0%' } }),
          C.el('i', { class: 'panache' }),
          C.el('span', { class: 'steps', text: '۰%' }))),
      form, mini);
  }

  /* ---------- پاپ‌اور ویرایش مأموریت ---------- */
  function editMission(ev, iso) {
    editKind = ev.kind;
    const box = C.el('div', { class: 'confirm dosage' });
    box.innerHTML = `
      <h3>${C.icon('target')} ویرایش مأموریت</h3>
      <div class="field"><input id="e-title" value="${C.escapeHtml(ev.title)}"><span>${C.icon('pen')}</span></div>
      <div class="duo">
        <div class="field"><input type="time" id="e-start" value="${ev.start}"><span>${C.icon('clock')}</span></div>
        <select class="cell" id="e-dur">${[15, 30, 45, 60, 90, 120, 180].map(x =>
      `<option value="${x}" ${toDur(ev.dur) === x ? 'selected' : ''}>${C.faN(x)} دقیقه</option>`).join('')}</select>
      </div>
      <div class="cuo">${Object.entries(KINDS).map(([k, v]) =>
      `<button type="button" class="cell kindcell ${ev.kind === k ? 'on' : ''}" data-kind="${k}">${C.icon(v.icon, 'i')} ${v.label}</button>`).join('')}</div>
      <div class="field"><textarea id="e-note" rows="2" placeholder="یادداشت">${C.escapeHtml(ev.note || '')}</textarea></div>
      <div class="barfoot">
        <button class="btn bghost bmicro danger" data-del>${C.icon('trash')} حذف</button>
        <span class="push"></span>
        <button class="btn bfire" data-ok>${C.icon('tick')} ذخیره</button>
      </div>`;
    const off = C.overlay(box);
    box.querySelectorAll('.kindcell').forEach(b => b.addEventListener('click', () => {
      editKind = b.dataset.kind;
      box.querySelectorAll('.kindcell').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    }));
    box.querySelector('[data-del]').addEventListener('click', async () => {
      off();
      if (await C.confirmBox('حذف مأموریت', `«${ev.title}» از ریل روز حذف شود؟`, 'حذف کن')) {
        C.store.remove(ev.id);
        C.toast('مأموریت حذف شد');
        C.bus.emit('rerender');
      }
    });
    box.querySelector('[data-ok]').addEventListener('click', () => {
      C.store.update(ev.id, {
        title: box.querySelector('#e-title').value.trim() || ev.title,
        kind: editKind,
        start: box.querySelector('#e-start').value || ev.start,
        dur: Number(C.en(box.querySelector('#e-dur').value)) || toDur(ev.dur),
        note: box.querySelector('#e-note').value.trim(),
      });
      off(); C.toast('به‌روز شد ' + C.icon('tick', 'i'));
      C.bus.emit('rerender');
    });
  }

  views.planner = {
    id: 'planner', label: 'اتاق فرمان', icon: 'shell', render,
    destroy() { clearInterval(timer); },
  };
})();
