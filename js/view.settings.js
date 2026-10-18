/* ============================================================
   EPIC MODE — view.settings.js
   «اتاق تنظیم» — نام خلبان، مقیاس، تم، هاتیکس، داده‌ها
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const views = C.views = C.views || {};
  const THEMES = { inferno: 'شعلهٔ جهنمی', abyss: 'عرش تاریک', ember: 'خاکستر گرم' };

  function render() {
    const st = C.DB.settings;
    const nameInp = C.el('input', {
      type: 'text', value: st.name || '', placeholder: 'اسم خلبان… (مثلاً: سردار)',
      oninput: e => { C.DB.settings.name = e.target.value; C.store.save(); C.bus.emit('brand'); },
    });

    const scale = C.el('input', {
      type: 'range', min: '90', max: '120', step: '5', value: String(st.scale || 100),
      oninput: e => {
        const v = Number(e.target.value);
        C.DB.settings.scale = v; C.store.save();
        document.documentElement.style.setProperty('--fs', (v / 100 * 16) + 'px');
        scaleVal.textContent = C.faN(v) + '٪';
        C.bus.emit('brand');
      },
    });
    const scaleVal = C.el('b', { text: C.faN(st.scale || 100) + '٪' });

    const themeBar = C.el('div', { class: 'segbar' });
    Object.entries(THEMES).forEach(([k, label]) => themeBar.append(C.el('button', {
      type: 'button', text: label, 'aria-pressed': String(st.theme === k),
      onclick: e => {
        C.DB.settings.theme = k; C.store.save();
        C.applyTheme && C.applyTheme();
        themeBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        e.currentTarget.setAttribute('aria-pressed', 'true');
        C.toast('تم مبّدل شد: ' + label + ' ' + C.icon('flame', 'i'));
      },
    })));

    const haptic = pickRow('هاتیکس (لرزش ذره‌ای هنگام ذخیرهٔ رخدادها)', st.haptics, v => {
      C.DB.settings.haptics = v; C.store.save();
    });
    const attacks = pickRow('انفجارهای جشنی (ذرات حلقوی هنگام تکمیل)', st.attacks, v => {
      C.DB.settings.attacks = v; C.store.save();
      if (!v) document.getElementById('fx-canvas')?.remove();
    });

    /* داده‌ها */
    const out = C.el('div', { class: 'datarow' },
      C.el('button', {
        class: 'btn bghost bmicro', type: 'button', html: C.icon('export') + ' انبار خروجی',
        onclick: () => {
          const blob = new Blob([C.store.export()], { type: 'application/json' });
          const a = C.el('a', { href: URL.createObjectURL(blob), download: `epicmode-${C.jad.todayIso().replace(/\//g, '-')}.json` });
          a.click(); URL.revokeObjectURL(a.href);
          C.toast('فایل پشتیبانه ذخیره شد ' + C.icon('shield', 'i'));
        },
      }),
      C.el('button', {
        class: 'btn bghost bmicro', type: 'button', html: C.icon('importIc') + ' بازخوانی',
        onclick: () => {
          const inp = C.el('input', { type: 'file', accept: '.json', style: { display: 'none' } });
          document.body.append(inp);
          inp.addEventListener('change', () => {
            const f = inp.files?.[0]; if (!f) { inp.remove(); return; }
            const r = new FileReader();
            r.onload = async () => {
              try {
                if (await C.confirmBox('بازخوانی پشتیبان', 'کل دادهٔ فعلی جای دادهٔ فایل می‌نشیند. ادامه؟', 'بازخوانی')) {
                  C.store.ingest(r.result);
                  C.bus.emit('rerender'); C.bus.emit('brand');
                  C.toast('داده‌ها بازخوانی شد ' + C.icon('tick', 'i'));
                }
              } catch (_) { C.toast('فایل قابل خواندن نبود'); }
              inp.remove();
            };
            r.readAsText(f);
          });
          inp.click();
        },
      }),
      C.el('button', {
        class: 'btn bghost bmicro danger', type: 'button', html: C.icon('trash') + ' پاک‌سازی کامل',
        onclick: async () => {
          if (await C.confirmBox('پاک‌سازی کامل', 'همهٔ کارها، عادت‌ها و یادداشت‌ها حذف می‌شود. تغییری برنگشتنی است!', 'هر چه بود بسوزان')) {
            C.store.wipe(); C.store.save();
            C.bus.emit('rerender'); C.bus.emit('brand');
            C.toast('اتاق نو شد — از نو بساز');
          }
        },
      }));

    const host = C.el('div', { class: 'sec', 'data-view': 'settings' },
      C.el('section', { class: 'card pain' },
        C.el('div', { class: 'veil' }),
        C.secbar('SEC.06 // CRYO', 'اتاق تنظیم', 'gear'),
        C.el('div', { class: 'secbody' },
          C.el('div', { class: 'setgrid' },
            row('برند شخصی', 'نام تو روی سرِ صفحهٔ برند می‌نشیند', nameInp, C.icon('anchor')),
            row('مقیاس متون', '۹۰٪ تا ۱۲۰٪ — شبیه‌ساز عینک مطالعه', scale, C.icon('wave'), scaleVal),
            row('تم رنگ', 'سه روحِ مشترک: شعله، عرش، خاکستر', themeBar, C.icon('flame')),
            haptic, attacks,
            row('مدیریت داده', 'پشتیبانی، بازخوانی، سوختن', out, C.icon('shield'))))),
      C.el('div', { class: 'flock', html: '<i class="ribbon"></i><i class="ribbon"></i>' }));
    return host;
  }

  function row(title, sub, node, ic, extra) {
    return C.el('div', { class: 'srow' },
      C.el('div', { class: 'lab' },
        C.el('h4', {}, C.el('span', { html: C.icon(ic, 'i sm') }), C.el('span', { text: title })),
        sub ? C.el('small', { text: sub }) : null),
      node instanceof Node ? node : C.el('div'),
      extra instanceof Node ? extra : null);
  }
  function pickRow(title, checked, onchg) {
    const pick = C.el('button', { class: 'pick', type: 'button', role: 'switch', 'aria-checked': String(!!checked) });
    pick.addEventListener('click', () => {
      const v = pick.getAttribute('aria-checked') !== 'true';
      pick.setAttribute('aria-checked', String(v));
      onchg(v);
    });
    return row(title, '', pick, 'target');
  }

  views.settings = { id: 'settings', label: 'اتاق تنظیم', icon: 'gear', kicker: 'تنظیم', render };
})();
