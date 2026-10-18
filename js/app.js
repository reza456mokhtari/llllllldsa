/* ============================================================
   EPIC MODE — app.js
   بوت استرپ: برند، ناوبری، ساعت، تم، میان‌برها
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const $ = C.$, $$ = C.$$;

  let cur = 'planner', host = null, clockTimer = null;

  /* ---------- تم ---------- */
  function applyTheme() {
    const t = C.DB.settings?.theme || 'inferno';
    document.documentElement.dataset.theme = t;
  }
  C.applyTheme = applyTheme;

  /* ---------- برند ---------- */
  const TICKER = [
    'بیش باد — از توقف بترس',
    'هر روز، یک مأموریت اصلی',
    'کارènes بزرگ از قدم‌های ریز ساخته می‌شوَند',
    'قانون: اول کار، بعد ضیافت',
    'تداوم یعنی فرارهای کوچک‌تر از فرصت‌های درشت',
  ];

  function brandPanel() {
    const jal = C.jad.toJalali(new Date());
    const st = C.DB.settings || {};
    const wraps = C.el('div', { class: 'rows' },
      C.el('b', { class: 'maintype', text: 'دفترِ فرمانِ روز' }),
      C.el('b', { class: 'nb', text: 'EPIC MODE' }),
      C.el('div', { class: 'meta' },
        C.el('span', { class: 'sub' },
          C.el('i', { class: 'dot' }),
          C.el('span', { class: 'whop', html: `${C.icon('flame', 'i sm')} <b>${C.escapeHtml(st.name || 'خلبان')}</b> سربازِ این اتاقه` })),
        C.el('time', { html: `${C.icon('cal', 'i')} <b>${C.faN(jal.jd)} ${jal.monthName} ${C.faN(jal.jy)}</b>` }),
        C.el('time', { id: 'brand-clock', html: `${C.icon('clock', 'i')} <b>--:--:--</b>` })),
      C.el('p', { class: 'tagline' },
        C.el('span', { class: 'tk', id: 'ticker', 'data-i': String(Math.floor(Math.random() * 5)), text: '' })));
    return wraps;
  }
  function sigil() {
    return C.el('div', { class: 'sigil', 'aria-hidden': 'true', html: `
      <svg viewBox="0 0 200 200" class="sig">
        <circle class="rot" cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="3.5" stroke-dasharray="6 15" stroke-linecap="round" opacity=".85"/>
        <circle cx="100" cy="100" r="74" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 12" opacity=".42"/>
        <path d="M100 30 156 62v76l-56 32-56-32V62Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M100 45c9 15-6 21-6 32a13 13 0 0 0 26 0c0-6-2.5-10-6-14 4-1 8-4.5 9-8.5 6 9 13 16.6 13 27.5a33 33 0 1 1-66 0c0-17 21-24 30-37Z" fill="currentColor" opacity=".92"/>
      </svg>` });
  }

  function renderBrand(root) {
    let old = root.querySelector('.brand');
    const media = C.el('div', { class: 'media' }, sigil());
    const b = C.el('header', { class: 'brand', 'data-reveal': '' }, media, brandPanel());
    old ? root.replaceChild(b, old) : root.prepend(b);
    C.bus.emit('brand');
  }

  /* ---------- ناوبری ---------- */
  function navPanel() {
    const order = ['planner', 'tasks', 'habits', 'notes', 'stats', 'settings'];
    const bar = C.el('div', { class: 'viewbar', role: 'tablist', 'aria-label': 'انتخاب برش‌ها' },
      C.el('i', { class: 'sweep', 'aria-hidden': 'true' }),
      C.el('i', { class: 'glowdust', 'aria-hidden': 'true' }));
    order.forEach((id, i) => {
      const v = C.views[id];
      bar.append(C.el('button', {
        class: 'navbtn', role: 'tab', type: 'button', 'data-view': id,
        'aria-selected': String(cur === id),
        onclick: e => { C.navGo(id); e.currentTarget.blur(); C.sparksAt(e.currentTarget, 8, 140); },
      },
        C.el('span', { class: 'ic' }, C.el('i', { html: C.icon(v.icon) })),
        C.el('span', { class: 'lbl', text: v.label })));
      if (i === 2) bar.append(C.el('i', { class: 'seg', 'aria-hidden': 'true' }));
    });
    return C.el('nav', { class: 'viewmin' }, bar);
  }

  function placeSweep() {
    const bar = $('.viewbar'); if (!bar) return;
    const btn = bar.querySelector(`.navbtn[data-view="${cur}"]`); if (!btn) return;
    const sweep = bar.querySelector('.sweep'), dust = bar.querySelector('.glowdust');
    const isCol = getComputedStyle(bar).flexDirection === 'column';
    const b = btn.getBoundingClientRect(), p = bar.getBoundingClientRect();
    if (isCol) {
      [sweep, dust].forEach(n => { if (!n) return; n.style.top = (b.top - p.top) + 'px'; n.style.bottom = 'auto'; n.style.left = '0'; n.style.right = '0'; n.style.height = b.height + 'px'; n.style.width = 'auto'; });
    } else {
      [sweep, dust].forEach(n => { if (!n) return; n.style.left = (b.left - p.left) + 'px'; n.style.width = b.width + 'px'; n.style.height = 'auto'; });
    }
    const old = bar.querySelector('.navbtn[aria-selected=true]'); if (old) old.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-selected', 'true');
  }

  /* ---------- قالب‌ها: هر برش فقط خودش ---------- */
  function show() {
    const v = C.views[cur];
    v.destroy?.();
    const panel = $('main section[data-view]') || C.el('section');
    const fresh = v.render();
    const old = $('#views .sec[data-view="' + cur + '"]');
    if (old) old.replaceWith(fresh);
    else $('#views').append(fresh);
    // پاک‌سازی دیگر برش‌ها: فقط یکی فعال
    $$('#views .sec').forEach(s => { if (s !== fresh) s.remove(); });
    placeSweep();
    C.bus.emit('brand'); // منع ساعت تایل
  }
  C.navGo = id => {
    if (!C.views[id] || cur === id && document.querySelector(`#views .sec[data-view="${id}"]`)) { placeSweep(); return; }
    cur = id;
    show();
  };

  /* ---------- ساعت زنده ---------- */
  function clock() {
    const d = new Date();
    const fmt = C.fa(`${C.pad2(d.getHours())}:${C.pad2(d.getMinutes())}:${C.pad2(d.getSeconds())}`);
    const t = $('#brand-clock b'); if (t) t.textContent = fmt;
    const t2 = $('.footclock'); if (t2) t2.textContent = C.faN(C.pad2(d.getHours()) + ':' + C.pad2(d.getMinutes()));
  }

  /* ---------- میانبرها ---------- */
  function hotkeys() {
    const map = { n: 'tasks', p: 'planner', b: 'habits', y: 'notes', s: 'stats', o: 'settings' };
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (map[k]) { C.navGo(map[k]); e.preventDefault(); }
    });
  }

  /* ---------- فوتر ---------- */
  function footer() {
    return C.el('footer', { class: 'foot' },
      C.el('span', { html: `${C.icon('bolt')} <b>EPIC MODE</b> — همه‌چیز محلی، بدون سرور` }),
      C.el('span', { class: 'footclock' }),
      C.el('span', { html: `B9.SYS` }));
  }

  /* ---------- بوت ---------- */
  function boot() {
    C.store.load();
    applyTheme();
    const scale = C.DB.settings?.scale || 100;
    document.documentElement.style.setProperty('--fs', (scale / 100 * 16) + 'px');

    const shell = $('.shell');
    host = C.el('div', { id: 'views' });
    renderBrand(shell);
    const main = C.el('main'); main.append(host, footer());
    shell.append(navPanel(), main);
    // دکمهٔ شناور: مأموریت فوری
    const fab = C.el('button', {
      class: 'btn bfire floatbtn', type: 'button', title: 'مأموریت فوری — برو اتاق فرمان',
      html: C.icon('plus'), 'aria-label': 'مأموریت فوری',
      onclick: () => {
        if (cur !== 'planner') C.navGo('planner');
        requestAnimationFrame(() => document.getElementById('mtitle')?.focus());
      },
    });
    shell.append(fab);
    cur = 'planner'; show();
    const tk0 = $('#ticker'); if (tk0) tk0.textContent = TICKER[0];
    clock(); clearInterval(clockTimer); clockTimer = setInterval(clock, 1000);

    // دوباره پهن: swap sweep بر رزولوشن
    addEventListener('resize', C.debounce(placeSweep, 120));
    // ری‌رندر مرکزی
    C.bus.on('rerender', () => show());
    C.bus.on('brand', () => {
      const who = $('.whop b'); if (who && C.DB.settings?.name) who.textContent = C.DB.settings.name;
      const tk = $('#ticker');
      if (tk) { const i = (Number(tk.dataset.i || 0) + 1) % TICKER.length; tk.dataset.i = i; tk.textContent = TICKER[i]; }
    });
    hotkeys();
    // تیکر اسلاید
    setInterval(() => C.bus.emit('brand'), 8000);
    // افکت ورود
    document.body.classList.add('booted');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
