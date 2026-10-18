/* ============================================================
   EPIC MODE — core.js
   ابزار پایه: DOM، اعداد فارسی، توست، ذرات جشن، مودال، DnD
   (اسکریپت کلاسیک — بدون ماژول تا روی file:// هم کار کند)
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  const C = window.EPIC;

  /* ---------- دیجیت فارسی/لاتین ---------- */
  const fd = '۰۱۲۳۴۵۶۷۸۹';
  const fa = s => String(s).replace(/\d/g, d => fd[+d]);
  const en = s => String(s).replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776));
  const faN = n => fa(new Intl.NumberFormat('en-US').format(Math.round(n)));
  const pad2 = n => String(n).padStart(2, '0');

  /* ---------- DOM ---------- */
  const $ = (sel, ro = document) => ro.querySelector(sel);
  const $$ = (sel, ro = document) => [...ro.querySelectorAll(sel)];

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), typeof v === 'function' ? v : e => v(e));
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }
  const svg = (path, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- توست ---------- */
  let toastHold;
  function toast(html, ms = 2600) {
    let root = $('#toasts');
    if (!root) { root = el('div', { id: 'toasts' }); document.body.append(root); }
    const t = el('div', { class: 'toast', html });
    if (root.firstChild) root.insertBefore(t, root.firstChild); else root.append(t);
    while (root.children.length > 4) root.lastChild.remove();
    clearTimeout(toastHold);
    toastHold = setTimeout(() => t.classList.add('out'), ms);
    t.addEventListener('click', () => t.remove());
    return t;
  }

  /* ---------- اورلی/کافیرم ---------- */
  function overlay(content) {
    const ground = el('div', {
      class: 'ground', style: {
        position: 'fixed', inset: '0', zIndex: '76', background: 'rgba(7,6,10,.72)',
        display: 'grid', placeItems: 'center', animation: 'fadein .2s',
        backdropFilter: 'blur(4px)', padding: '16px',
      },
    }, content);
    document.body.style.overflow = 'hidden';
    const off = () => { ground.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', ah); };
    const ah = e => { if (e.key === 'Escape') { e.preventDefault(); off(); } };
    content.addEventListener('click', e => e.stopPropagation());
    ground.addEventListener('click', off);
    document.addEventListener('keydown', ah);
    document.body.append(ground);
    requestAnimationFrame(() => content.querySelector('button,input,textarea,[tabindex]')?.focus());
    return off;
  }
  function confirmBox(heading, body, okLabel = 'انجام بده') {
    return new Promise(done => {
      const box = el('div', { class: 'confirm' });
      box.innerHTML = `
        <h3>${svg('<path class="fd" fill="currentColor" stroke="none" d="M12 2C7 7 4 10.2 4 14a8 8 0 0 0 16 0c0-3.8-3-7-8-12Zm0 16a4 4 0 0 1-4-4c0-2 1.5-4 4-7 2.5 3 4 5 4 7a4 4 0 0 1-4 4Z"/>')} ${escapeHtml(heading)}</h3>
        <p>${escapeHtml(body)}</p>
        <div class="btnwrap">
          <button class="btn bghost" data-no>بی‌خیال</button>
          <button class="btn bfire" data-ok>${escapeHtml(okLabel)}</button>
        </div>`;
      const off = overlay(box);
      box.querySelector('[data-no]').addEventListener('click', () => { off(); done(false); });
      box.querySelector('[data-ok]').addEventListener('click', () => { sparksAt(box.querySelector('[data-ok]'), 12); off(); done(true); });
    });
  }

  /* ---------- ذرات جشن ---------- */
  let cv = null, sparks = [], raf = 0;
  function canvas() {
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'fx-canvas';
      Object.assign(cv.style, { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 88 });
      addEventListener('resize', sizeCanvas);
    }
    return cv;
  }
  function sizeCanvas() {
    if (!cv) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    Object.assign(cv.style, { width: innerWidth + 'px', height: innerHeight + 'px' });
  }
  function sparksAt(target, count = 26, spread = 320) {
    const c = canvas(); sizeCanvas(); document.body.append(c);
    const r = target?.getBoundingClientRect?.();
    const x = r ? r.left + r.width / 2 : innerWidth / 2;
    const y = r ? r.top + r.height / 2 : innerHeight / 2;
    const cols = ['#ff2f24', '#ff8a00', '#ffb347', '#ffd740', '#c21327', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 2 * Math.random(), v = (Math.random() * .8 + .55) * spread / 60;
      sparks.push({
        x, y, vx: Math.cos(a) * v * (.5 + Math.random()), vy: Math.sin(a) * v - 2.6,
        rot: Math.random() * 6.283, vr: Math.random() * .3 - .15,
        size: Math.random() * 6.4 + 3.2, col: cols[i % cols.length], life: 1,
        shape: Math.random() < .3 ? 'dot' : 'rect',
      });
    }
    if (!raf) raf = requestAnimationFrame(tickSparks);
  }
  function tickSparks() {
    const c = canvas(), g = c.getContext('2d');
    g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(p => p.life > 0);
    for (const p of sparks) {
      p.x += p.vx; p.y += p.vy; p.vy += .34; p.vx *= .985; p.rot += p.vr; p.life -= .017;
      if (p.life <= 0) continue;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      g.fillStyle = p.col;
      if (p.shape === 'dot') { g.beginPath(); g.arc(0, 0, p.size * .42, 0, 6.283); g.fill(); }
      else g.fillRect(-p.size, -p.size * .42, p.size * 2, p.size * .84);
      g.restore();
    }
    if (sparks.length) raf = requestAnimationFrame(tickSparks);
    else { raf = 0; }
  }
  function jolt(node) {
    if (!node) return;
    node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump');
    setTimeout(() => node.classList.remove('bump'), 420);
  }

  /* ---------- Drag&Drop مرتب‌سازی ---------- */
  function dragSort(items, onOrdered) {
    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        item.classList.add('hiking');
        e.dataTransfer.setData('text/plain', item.dataset.id || 'x');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('hiking');
        items.forEach(x => x.classList.remove('mercy'));
        const ids = items.filter(x => document.contains(x)).map(x => x.dataset.id);
        if (ids.length) onOrdered(ids);
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        const box = item.getBoundingClientRect();
        const hot = $$('.hiking');
        if (!hot || hot === item) return;
        const before = (e.clientY - box.top) < box.height / 2;
        if (before) item.parentNode.insertBefore(hot, item);
        else item.parentNode.insertBefore(hot, item.nextSibling);
        items.forEach(x => x !== hot && x.classList.remove('mercy'));
        item.classList.add('mercy');
      });
    });
  }

  /* ---------- متفرقه ---------- */
  const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const smoothTo = t => (typeof t === 'string' ? $(t) : t)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* ---------- معرفی به فضای‌نام ---------- */
  Object.assign(C, {
    fa, en, faN, pad2, $, $$, el, svg, escapeHtml,
    toast, overlay, confirmBox, sparksAt, jolt, dragSort, debounce, smoothTo,
  });
})();
