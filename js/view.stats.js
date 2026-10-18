/* ============================================================
   EPIC MODE — view.stats.js
   «رادار» — کارنامهٔ ۷روزه، توزیع، زنجیره‌ها
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};

  const counts = (day, withEvents = true) => {
    const tasks = C.DB.entries.filter(e => e.type === 'task' && e.done && e.doneDate === day).length;
    const habits = C.store.q.habits().filter(h => h.log?.[day]).length;
    const events = withEvents ? C.DB.entries.filter(e => e.type === 'event' && e.date === day).length : 0;
    return { tasks, habits, events, total: tasks + habits * 2 + events };
  };

  function render() {
    const iso = C.jad.todayIso();
    const span = Array.from({ length: 7 }, (_, i) => C.jad.addDaysIso(iso, -(6 - i)));
    const metrics = span.map(day => ({ day, wk: C.jad.weekdayOfIso(day), ...counts(day) }));
    const maxV = Math.max(3, ...metrics.map(m => m.total));

    /* نمودار میله */
    const bars = C.el('div', { class: 'stars7' });
    metrics.forEach(m => {
      const cell = C.el('div', { class: 'spring' + (m.day === iso ? ' now' : '') },
        C.el('span', { class: 'b', style: { height: '4%' } }),
        C.el('span', { class: 'lb', text: C.jad.jWeekMin[m.wk] }));
      cell.title = `${C.jad.jWeek[m.wk]} ${C.fa(m.day)} — کار: ${C.faN(m.tasks)} · عادت: ${C.faN(m.habits)} · رویداد: ${C.faN(m.events)} (واحد انرژی ${C.faN(m.total)})`;
      bars.append(cell);
    });
    requestAnimationFrame(() => bars.querySelectorAll('.spring').forEach((cell, idx) => {
      cell.querySelector('.b').style.height =
        Math.max(6, Math.round(metrics[idx].total / maxV * 100)) + '%';
    }));

    /* زنجیره */
    let chain = 0;
    for (let i = 0; i < 60; i++) {
      const day = C.jad.addDaysIso(iso, -i);
      const t = counts(day).total;
      if (t > 0) chain++;
      else if (i > 0) break;
    }

    const all = C.DB.entries.filter(e => e.type === 'task');
    const by = (p, done) => all.filter(t => t.done === done && t.prio === p).length;

    const graph = C.el('div', { class: 'panelbox graph' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('stats', 'i sm') }), C.el('b', { text: 'ارتعاش هفت روز اخیر' })),
      bars,
      C.el('div', { class: 'hint', text: 'واحدِ انرژی: هر عادت ۲ امتیاز · هر کارِ پیروز ۱ امتیاز · هر رویداد ۱ امتیاز' }));

    const prioGrid = C.el('div', { class: 'panelbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('stats', 'i sm') }), C.el('b', { text: 'توزیع اولویت‌ها' })),
      prioRow('high', (by('high', false)), (by('high', true))),
      prioRow('mid', (by('mid', false)), (by('mid', true))),
      prioRow('low', (by('low', false)), (by('low', true))));

    const facts = C.el('ul', { class: 'tl-list' },
      fact('note', 'سندهای خمّر: ' + C.faN(C.store.q.notes().length)),
      fact('grid', 'کل رکوردها: ' + C.faN(C.DB.entries.length)),
      fact('cal', 'ابتدای پرواز: ' + C.fa(C.DB.meta.since || iso)),
      fact('shield', 'همه‌چیز فقط در مرورگر خودت ذخیره می‌شود'));

    const factsGrid = C.el('div', { class: 'panelbox' },
      C.el('div', { class: 'cap' }, C.el('span', { html: C.icon('book', 'i sm') }), C.el('b', { text: 'دفترچهٔ حقایق' })),
      facts);

    const board2 = C.el('div', { class: 'board2' }, prioGrid, factsGrid);
    const secbody = C.el('div', { class: 'secbody' },
      C.el('div', { class: 'statsgrid' },
        bigStat('زنجیرهٔ فعال', C.faN(chain), 'روز پیاپی با انرژی', 'bolt'),
        bigStat('انرژی امروز', C.faN(counts(iso).total), 'امتیاز امروز', 'flame'),
        bigStat('انجیر انبار', C.faN(all.length), 'کل کارها', 'task'),
        bigStat('سندهای خمّر', C.faN(C.store.q.notes().length), 'یادداشت‌های ثبت‌شده', 'note')),
      graph,
      board2);

    const lilboard = C.el('section', { class: 'card pain' },
      C.el('div', { class: 'veil' }),
      C.secbar('SEC.05 // RADAR', 'رادار عملکرد', 'stats',
        C.el('span', { class: 'tag', html: `${C.icon('cal', 'i')} هفت روز اخیر` })),
      secbody);

    const host = C.el('div', { class: 'sec', 'data-view': 'stats' },
      lilboard,
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i>' }));

    return host;
  }

  function fact(ic, txt) {
    return C.el('li', {},
      C.el('span', { html: C.icon(ic, 'i sm') }),
      C.el('span', { text: txt }));
  }

  function bigStat(cap, num, sub, ic) {
    return C.el('div', { class: 'tstat' },
      C.el('div', { class: 'top' },
        C.el('span', { class: 'cap', text: cap }),
        C.el('span', { html: C.icon(ic), style: { color: 'var(--orange)' } })),
      C.el('b', { class: 'bigno', text: num }),
      C.el('span', { class: 'micro', text: sub }));
  }

  function prioRow(p, open, done) {
    const LABEL = { high: 'فوری', mid: 'مهم', low: 'سبک' };
    const total = Math.max(1, open + done);
    const pct = Math.round(done / total * 100);
    return C.el('div', { class: 'metrics', title: `${LABEL[p]} — ${C.faN(done)} از ${C.faN(total)}` },
      C.el('div', { class: 'metriccap' },
        C.el('span', { text: LABEL[p] }),
        C.el('b', { text: `${C.faN(done)} / ${C.faN(total)}` })),
      C.el('div', { class: 'meterbar' },
        C.el('i', { class: 'fill', style: { '--p': pct + '%' } })));
  }

  views.stats = { id: 'stats', label: 'رادار', icon: 'stats', kicker: 'عملکرد', render };
})();
