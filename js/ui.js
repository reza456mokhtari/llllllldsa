/* ============================================================
   EPIC MODE — ui.js
   اتم‌های مشترک: آیکون‌های SVG، سربخش، حالت خالی، بج‌ها
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;
  const svg = (inner, cls = 'i') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const fill = d => `<path class="fd" fill="currentColor" stroke="none" d="${d}"/>`;
  const stroke = d => `<path d="${d}"/>`;

  /* مسیرهای آیکون (کارتی خالص بدون ایموجی) */
  const IP = {
    flame: fill('M12 2C7 7 4 10.2 4 14a8 8 0 0 0 16 0c0-3.8-3-7-8-12Zm0 16a4 4 0 0 1-4-4c0-2 1.5-4 4-7 2.5 3 4 5 4 7a4 4 0 0 1-4 4Z'),
    bolt: fill('M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.06.07-.09C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21Z'),
    plus: stroke('M12 5v14M5 12h14'),
    x: stroke('M6 6l12 12M18 6L6 18'),
    trash: stroke('M3 6h18M8 6V4h8v2M6.5 6l1 14h9l1-14M10 11v6M14 11v6'),
    pen: stroke('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'),
    tick: stroke('M20 6L9 17l-5-5'),
    cal: stroke('M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 3v4M16 3v4M4 10h16'),
    clock: stroke('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.2 2'),
    pin: fill('M14 3l7 7-4 1-3 3 .5 5.5L13 21l-4-5-5.8 5L2 20l5-5.8L2.2 10 5 8.8 10.5 9l3-3Z'),
    play: fill('M7 4.8a.6.6 0 0 1 .9-.5l11 6.9a.6.6 0 0 1 0 1L7.9 20.7a.6.6 0 0 1-.9-.5Z'),
    pause: fill('M6 4h4v16H6zM14 4h4v16h-4z'),
    grid: stroke('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'),
    chev: stroke('M9 6l6 6-6 6'),
    chevL: stroke('M15 6l-6 6 6 6'),
    gear: stroke('M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.02 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.02Z'),
    task: stroke('M9 11l3 3 5-6M4 12a8 8 0 1 1 5.7 7.7L4 21l1.2-5.2A8 8 0 0 1 4 12Z'),
    note: stroke('M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h8M8 17h5'),
    shell: stroke('M12 2l9 5.2v9.6L12 22l-9-5.2V7.2ZM12 22V7.2M12 7.2 3 7.2M21 7.2 12 7.2M12 12 3 17.2M12 12l9 5.2'),
    stats: stroke('M4 20V10M10 20V4M16 20v-9M22 20H2'),
    moon: stroke('M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'),
    run: stroke('M13.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13 22l1-4-3.5-3 2-7-4 2-2.5 3M16 12l4-2M9 17l-2 5'),
    book: stroke('M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Zm20 0h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z'),
    target: stroke('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'),
    grip: fill('M8 4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM16 4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM8 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM16 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM8 17.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM16 17.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z'),
    star: fill('M12 2l2.9 6.3 6.9.9-5 4.8 1.2 6.9L12 17.6l-6 3.3 1.2-6.9-5-4.8 6.9-.9Z'),
    shield: fill('M12 2l8 3v7c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V5Z'),
    export: stroke('M12 15V3M7 8l5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3'),
    importIc: stroke('M12 3v12M7 10l5 5 5-5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3'),
    dot: fill('M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'),
    wave: stroke('M2 12h4l2-6 4 12 2-6h8'),
    anchor: stroke('M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 7v14M5 12H3a9 9 0 0 0 18 0h-2'),
    calendarPlus: stroke('M8 3v4M16 3v4M4 10h16M4 21h16a0 0 0 0 0 0 0V6a0 0 0 0 0 0 0H4a0 0 0 0 0 0 0v15ZM12 13v6M9 16h6'),
  };

  function icon(name, cls = 'i') { return svg(IP[name] || IP.dot, cls); }

  /* سربخش استاندارد */
  function secbar(kicker, title, iconName, side, badge) {
    const h2 = C.el('h2', {},
      C.el('span', { html: icon(iconName), class: 'ic' }),
      C.el('span', { text: title }),
      badge ? C.el('span', { class: 'tag molten', text: badge }) : null);
    return C.el('header', { class: 'secbar' },
      C.el('div', { class: 'accum' },
        C.el('div', { class: 'kicker' },
          C.el('span', { class: 'shim' }),
          C.el('span', { html: icon(iconName, 'i sm') }),
          C.el('span', { text: kicker })),
        side instanceof Node ? side : (side ? C.el('div', { html: side }) : null)),
      h2);
  }

  function emptyState(msg, iconName = 'dot') {
    return C.el('div', { class: 'empty' },
      C.el('span', { html: icon(iconName), style: { display: 'inline-flex', animation: 'floaty 5s ease-in-out infinite' } }),
      C.el('span', { text: msg }));
  }

  /* نشان اولویت کار */
  function prioTag(p) {
    const map = {
      high: { cls: 'molten', icon: 'bolt', label: 'فوری' },
      mid: { cls: 'rocket', icon: 'target', label: 'مهم' },
      low: { cls: '', icon: 'dot', label: 'سبک' },
    };
    const m = map[p] || map.low;
    return `<span class="tag ${m.cls}">${icon(m.icon, 'i')} ${m.label}</span>`;
  }
  function eventTag(kind) {
    const map = {
      meet: { icon: 'task', label: 'جلسه' },
      dep: { icon: 'target', label: 'تمرکز عمیق' },
      fit: { icon: 'run', label: 'قدرت' },
      ops: { icon: 'wave', label: 'عملیات' },
    };
    const m = map[kind] || map.ops;
    return `<span class="tag blue">${icon(m.icon, 'i')} ${m.label}</span>`;
  }

  C.icon = icon; C.secbar = secbar; C.emptyState = emptyState;
  C.prioTag = prioTag; C.eventTag = eventTag; C.IP = IP;
})();
