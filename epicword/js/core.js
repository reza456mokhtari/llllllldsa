/* ============================================================
   EpicWord — core.js · DOM kit, icons, toast, dialog, tools
   Namespace: window.W
   ============================================================ */
window.W = {};
(function () {
  'use strict';

  /* ---------- dom helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function el(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const kid = arguments[i];
      if (kid == null) continue;
      if (Array.isArray(kid)) kid.forEach(k2 => { if (k2 != null) e.append(k2); });
      else if (typeof kid === 'string') e.insertAdjacentHTML('beforeend', kid);
      else e.append(kid);
    }
    return e;
  }
  function svgEl(d, size) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size || 18); s.setAttribute('height', size || 18);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.7'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    String(d).split('|').forEach(p => { const q = document.createElementNS('http://www.w3.org/2000/svg', 'path'); q.setAttribute('d', p); s.append(q); });
    return s;
  }

  /* ---------- icon set (24-grid, stroke) ---------- */
  const IP = {
    logo: 'M12 2l7 4v9c0 3.5-3 5.9-7 7-4-1.1-7-3.5-7-7V6z|M9 11l2.2 2.2L15.5 9',
    file: 'M6 3h9l4 4v14H6z|M15 3v4h4|M9 12h6M9 16h4',
    edit: 'M4 20l4.5-1L20 7.5 16.5 4 5 15.5 4 20z|M13.5 5.5L16 3.5a2 2 0 0 1 2.8 2.8L19 6.5',
    eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z|M12 12h.01',
    insert: 'M12 5v14M5 12h14',
    palette: 'M12 3a9 9 0 1 0 9 9c0-1.8-1.2-2.4-2.8-2.4H16a2 2 0 0 1-2-2.2C14.3 5 13.4 3 12 3z|M7.5 10.5h.01M7 15h.01M11 17.5h.01',
    tools: 'M14.5 6.5a4.5 4.5 0 1 1 3 7.8l-7.6 7.6-4.2-4.2 7.8-7.6|M5.5 18.5h.01',
    globe: 'M12 3a9 9 0 1 0 .01 0|M3 12h18|M12 3c2.4 2.5 3.7 5.6 3.7 9s-1.3 6.5-3.7 9|M12 3c-2.4 2.5-3.7 5.6-3.7 9s1.3 6.5 3.7 9',
    window: 'M3 5h18v14H3z|M3 9h18',
    help: 'M12 3a9 9 0 1 0 .01 0|M9.6 9.4a2.6 2.6 0 0 1 5 1c0 1.8-2.4 1.8-2.4 3.6|M12 17.4h.01',
    bolt: 'M13 2L5 13h5l-2 9 10-12.5h-5z',
    flame: 'M12 2.5c1.2 3.4-3.2 4.6-3.2 8.8a5.2 5.2 0 0 0 10.4 0c0-2.2-1-3.9-2.2-5.5-.4 2.2-2.2 2.8-2.2 2.8S12.2 5.6 12 2.5z',
    quill: 'M20.5 3.5C13 4.5 7.8 8 5.8 14.5L4 20l5.8-2.3C16.5 15.2 19.8 9.5 20.5 3.5z|M8.7 15.3c3.4-.9 6.3-3.6 7.4-6.4',
    book: 'M4 5h6.5A3 3 0 0 1 13.5 8v11.5a2.7 2.7 0 0 0-2.2-2H4zM20 5h-6.5A3 3 0 0 0 10.5 8v11.5a2.7 2.7 0 0 1 2.2-2H20z',
    grid: 'M4 5h16v14H4z|M4 5v14M4 10h16M4 15h16M10 5v14M15 5v14',
    save: 'M5 3h12l3 3v15H5z|M8 3v6h7V3|M8 14h8v7H8z',
    undo: 'M8 5L4 9l4 4|M4 9h9.5a5.5 5.5 0 0 1 0 11H9',
    redo: 'M16 5l4 4-4 4|M20 9h-9.5a5.5 5.5 0 0 0 0 11H15',
    print: 'M7 8V3h10v5|M7 17H4V9h16v8h-3|M7 14h10v7H7z',
    zoomIn: 'M10.5 4a6.5 6.5 0 1 0 .01 0|M15.5 15.5L20.5 20.5|M10.5 8v5M8 10.5h5',
    zoomOut: 'M10.5 4a6.5 6.5 0 1 0 .01 0|M15.5 15.5L20.5 20.5|M8 10.5h5',
    full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    gear: 'M12 8.3A3.7 3.7 0 1 0 12.01 8.3z|M12 2.5v3|M12 18.5v3|M2.5 12h3|M18.5 12h3|M5.3 5.3l2.1 2.1|M16.6 16.6l2.1 2.1|M18.7 5.3l-2.1 2.1|M7.4 16.6l-2.1 2.1',
    plus: 'M12 5v14M5 12h14',
    x: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12.5l4.5 4.5L19 7',
    trash: 'M4 7h16|M9 7V4h6v3|M6.5 7l1 13h9l1-13|M10.5 11v5.5M13.5 11v5.5',
    info: 'M12 3a9 9 0 1 0 .01 0|M12 11v5|M12 7.6h.01',
    brain: 'M9.3 4a3.3 3.3 0 0 0-3.1 3.3c-1.1.6-1.8 1.7-1.8 3 0 1.4.9 2.6 2.2 3A3.3 3.3 0 0 0 10 16.6V4z|M14.7 4a3.3 3.3 0 0 1 3.1 3.3c1.1.6 1.8 1.7 1.8 3 0 1.4-.9 2.6-2.2 3A3.3 3.3 0 0 1 14 16.6V4z|M12 16.5V21|M10 21h4',
    find: 'M10.5 4a6.5 6.5 0 1 0 .01 0|M15.5 15.5L20.5 20.5',
    replace: 'M4 8h12l-3-3M20 16H8l3 3|M16.5 2.5l2 2M5.5 21.5l-2-2',
    paste: 'M9 4h6M9 4a3 3 0 0 0-3 3v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a3 3 0 0 0-3-3|M10 2.5h4v3h-4z',
    cutsc: 'M8.6 8.4L19 17.5|M8.6 15.6L19 6.5|M5.8 10.8a2.6 2.6 0 1 0 .01-5.2|M5.8 18.4a2.6 2.6 0 1 0 .01-5.2',
    copy2: 'M9 3h10v13H9z|M5 7v13h10',
    brush: 'M14.5 4.5l5 5-7.5 7.5-5-5 7.5-7.5z|M5 20l4.5-1.5-2-2L5 20z',
    droplet: 'M12 3c4 4.5 6 7.7 6 10.4A6 6 0 0 1 6 13.4C6 10.7 8 7.5 12 3z',
    highlight: 'M9.5 11l6-7 4.5 3.5-6 7-4 1z|M4.5 20.5h15',
    eraser: 'M7.5 16.5l-3.2-3.2 8.6-8.6 3.4 3.4-6.2 8.4H7.5z|M4 20.5h16',
    alignL: 'M4 6h16M4 10h10M4 14h16M4 18h10',
    alignC: 'M4 6h16M7 10h10M4 14h16M7 18h10',
    alignR: 'M4 6h16M10 10h10M4 14h16M10 18h10',
    alignJ: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    spacing: 'M9 6h11M9 12h11M9 18h11|M4 3v18|M1.5 6L4 3.5 6.5 6M1.5 18L4 20.5 6.5 18',
    outdent: 'M9 6h11M9 12h11M9 18h11|M4.5 9L2 12l2.5 3',
    indent: 'M9 6h11M9 12h11M9 18h11|M6.5 9L9 12l-2.5 3',
    bullet: 'M9 6h11M9 12h11M9 18h11|M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    numlist: 'M9 6h11M9 12h11M9 18h11|M3.5 4.5h1v3M3.2 10.8h2.2L3.2 12.6h2.2M3.4 15h1.4a.8.8 0 0 1 0 1.6h-.9a.8.8 0 0 0 0 1.6h1.3',
    table: 'M3 5h18v14H3z|M3 10h18M3 15h18|M9 5v14M15 5v14',
    image: 'M3 5h18v14H3z|M6 15l4-4.5 3.5 3.5 2-2 2.5 3M8 9.2h.01',
    link2: 'M9.5 13.5l5-5|M9 16l-2 2a3.8 3.8 0 0 1-5.4-5.4L4 10.2a3.8 3.8 0 0 1 5.4 0M15 8l2-2a3.8 3.8 0 0 1 5.4 5.4L20 13.8a3.8 3.8 0 0 1-5.4 0',
    hr: 'M3 12h18',
    calendar: 'M4 6h16v14H4z|M4 10h16|M8 3v4M16 3v4',
    font: 'M5 20L11 4h2l6 16|M8 14.5h8',
    titlecase: 'M6 19L10.5 6h2L17 19M8 14h7',
    sort: 'M7 4v15M4 6.5L7 4l3 2.5M17 20V5M14 17.5l3 2.5 3-2.5',
    filter: 'M4 5h16l-6.4 7.2V17L10 19v-6.8z',
    csv: 'M6 3h9l4 4v14H6z|M15 3v4h4|M9 16l2.5-6 2.5 6M10 14h3',
    upload: 'M12 16V5M7.5 9L12 4.5 16.5 9',
    download: 'M12 5v11M7.5 12L12 16.5 16.5 12',
    stop: 'M6 6h12v12H6z',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    restock: 'M4 10a8 8 0 0 1 14.9-2M20 14a8 8 0 0 1-14.9 2|M18.5 4.5V8h-3.5M5.5 19.5V16H9',
    sword: 'M14.5 3.5l6 6-8.5 8.5-4 1 1-4 8.5-8.5? ',
    crown: 'M3 17l2.8-9 5.2 5 1-6.5 1 6.5 5.2-5L21 17z|M5 20h14',
    target: 'M12 3a9 9 0 1 0 .01 0|M12 7.5a4.5 4.5 0 1 0 .01 0|M12 11.5h.01',
  };
  IP.sword = 'M13.8 3.8l6.4 6.4-8.3 8.3-3.6.9.9-3.6 8.3-8.3? ';
  delete IP.sword;
  IP.sword = 'M14 4l6 6-8 8-3.5 1 .5-3.5 8-8zM4 20l3-3M14.9 6.9l2.2 2.2';

  function icon(name, size) {
    if (IP[name] == null) return svgEl(IP.dots || 'M5 12h.01', size);
    if (typeof IP[name] === 'object' && IP[name].ch) {
      return el('span', { class: 'dglyph', style: { fontSize: ((size || 18) * .82) + 'px', lineHeight: size + 'px' } }, IP[name].ch);
    }
    return svgEl(IP[name], size);
  }
  IP.quote = { ch: '“' };
  IP.omega = { ch: 'Ω' };

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const hash = s => { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(() => fn.apply(null, arguments), ms); }; }
  const pad2 = n => String(n).padStart(2, '0');
  const clockOf = d => pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());

  /* ---------- toast ---------- */
  function toast(msg, kind, ms) {
    let host = $('#toasts');
    if (!host) { host = el('div', { id: 'toasts' }); document.body.append(host); }
    kind = kind || 'info';
    const ic = el('span', { class: 'ic' }, icon(kind === 'err' ? 'x' : kind === 'ok' ? 'check' : 'info', 15));
    const t = el('div', { class: 'toast ' + kind }, ic, el('span', { html: msg }));
    const svg = ic.querySelector('svg');
    if (svg) svg.style.color = kind === 'err' ? '#ff8f85' : kind === 'ok' ? '#7ce38b' : kind === 'warnc' ? '#ffc46b' : '#9dc1ff';
    host.append(t);
    setTimeout(() => { t.classList.add('fade'); setTimeout(() => t.remove(), 550); }, ms || 3100);
  }

  /* ---------- dialog ---------- */
  function dialog(opts) {
    const host = $('#host-dialogs') || document.body;
    const xb = el('button', { class: 'winx', type: 'button', html: '', 'aria-label': 'Close' });
    xb.append(icon('x', 15));
    const body = el('div', { class: 'winbody' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.append(opts.body);
    const close = () => { ground.remove(); document.removeEventListener('keydown', onk); if (opts.onClose) opts.onClose(); };
    const onk = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const hdr = el('div', { class: 'winhdr' }, icon(opts.icon || 'info', 17), el('h3', { text: opts.title || 'Dialog' }), xb);
    const foot = opts.noFoot ? null : el('div', { class: 'winfoot' });
    const winEl = el('div', { class: 'win' + (opts.wide ? ' wide' : ''), tabindex: '-1' }, hdr, body);
    if (foot) winEl.append(foot);
    const ground = el('div', { class: 'ground' }, winEl);
    if (foot) {
      if (opts.footNote) foot.append(el('span', { class: 'push', text: opts.footNote }));
      if (opts.buttons) opts.buttons.forEach(b => {
        const btn = el('button', { class: 'gbtn acc', type: 'button', text: b.label || 'OK' });
        btn.addEventListener('click', () => { const keep = b.onClick ? b.onClick(ground) : false; if (!keep) close(); });
        foot.append(btn);
      });
    }
    ground.addEventListener('mousedown', e => { if (e.target === ground) close(); });
    if (opts.onMount) opts.onMount(body, ground);
    host.append(ground);
    document.addEventListener('keydown', onk);
    (opts.focus ? opts.focus(ground) : xb).focus();
    return { close, ground, body, foot };
  }
  function confirmBox(title, msg, okLabel) {
    return new Promise(done => {
      let settled = false;
      const fire = v => { if (!settled) { settled = true; done(v); } };
      const ground = el('div', { class: 'ground' },
        el('div', { class: 'win', tabindex: '-1' },
          el('div', { class: 'winhdr' }, icon('x', 16), el('h3', { text: title }),
            (() => { const x = el('button', { class: 'winx', type: 'button' }); x.append(icon('x', 14)); x.addEventListener('click', () => { close(); fire(false); }); return x; })()),
          el('div', { class: 'winbody' }, el('p', { html: '<p style="margin:0 0 4px">' + esc(msg) + '</p>' })),
          (() => {
            const f = el('div', { class: 'winfoot' });
            const cancel = el('button', { class: 'gbtn', type: 'button', text: 'Cancel' });
            const ok = el('button', { class: 'gbtn acc', type: 'button', text: okLabel || 'Confirm' });
            ok.addEventListener('click', () => { close(); fire(true); });
            cancel.addEventListener('click', () => { close(); fire(false); });
            f.append(cancel, ok);
            return f;
          })()));
      function close() { ground.remove(); document.removeEventListener('keydown', onk); }
      const onk = e => { if (e.key === 'Escape') { close(); fire(false); } };
      document.addEventListener('keydown', onk);
      ground.addEventListener('mousedown', e => { if (e.target === ground) { close(); fire(false); } });
      document.body.append(ground);
      setTimeout(() => { const ok = ground.querySelector('.gbtn.acc'); ok && ok.focus(); }, 0);
    });
  }

  /* ---------- clipboard & files ---------- */
  async function copyText(txt) {
    try { await navigator.clipboard.writeText(txt); toast('Copied to clipboard', 'ok'); return true; }
    catch (e) {
      const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = txt;
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard', 'ok'); } catch (e2) { toast('Copy failed', 'err'); }
      ta.remove(); return true;
    }
  }
  async function pasteText() {
    try { return await navigator.clipboard.readText(); }
    catch (e) { toast('Clipboard blocked by browser — press Ctrl+V inside the sheet', 'warnc'); return null; }
    return null;
  }
  function download(name, txt, mime) {
    const b = new Blob([txt], { type: mime || 'text/plain;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(b), download: name });
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 900);
    toast('Downloaded «' + name + '»', 'ok');
  }
  /* open a real file chooser; cb(FileList) */
  function pickFile(inputId, cb) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.onchange = () => { if (inp.files && inp.files.length) { cb(inp.files); inp.value = ''; } };
    inp.click();
  }

  Object.assign(W, { $, $$, el, icon, IP, esc, uid, hash, debounce, pad2, clockOf, toast, dialog, confirmBox, copyText, pasteText, download, pickFile, svgEl });
})();
