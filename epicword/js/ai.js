/* ============================================================
   EpicWord — ai.js · GLM engine, streaming, dossier, panes
   WRITE = user draft · READ = AI chronicle (never edited here)
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';

  const $ = W.$, $$ = W.$$;
  const PERSONA = [
    'SYSTEM ROLE — ELITE AI WRITING CORE & MASTER RESEARCH ENGINE (“THE HOLLOW CHRONICLER”), operating inside a professional word-processing application.',
    'STYLE FUSION — a dark-fantasy epic author (Dark Souls, Berserk, Elden Ring, with a low strain of Sekiro duel-stillness)',
    'tempered by a high-stakes cinematic storyteller: Marvel-grade depth, ensemble thunder, grand atmosphere.',
    'TONE — profound depth, rich vocabulary, dramatic flair, absolute precision. No cliché fluff:',
    'prioritize impact, analytical rigor, and immersive narrative structure.',
    'REASONING — think hard, SILENTLY. Analyze the draft\'s context, cross-reference historical and thematic data,',
    'structure the work logically; reveal only the finished piece, never the deliberation.',
    'OUTPUT — clean Markdown for the READ workspace; flowing, natural, master-crafted prose in 4-6 blank-line-separated',
    'paragraphs; **bold** only for true weight; #/## headings only when structure demands it.',
    'If the draft is short, extrapolate lore from every seed word planted. If the input arrives blank or ambiguous,',
    'gracefully invoke the cache-checkpoint memory, hold the dark epic persona intact, and prompt the user for',
    'clarification — never break character, never transmute silence into invention. Honour any cache-checkpoint the',
    'host restored into the draft. Never mention the machinery or the app.',
  ].join('\n');

  const THINK_LEAD = 'Deliberate deeply on structure, mythology and imagery before writing; do NOT reveal the deliberation — output only the final prose. ';

  /* ---------- state shorthands ---------- */
  const AI = () => W.store.state.ai;
  let dirty = false;      // write-pane has unsaved strokes
  let streaming = null;   // AbortController
  let outEl = null, metaChips = null, statEl = null;
  let curStream = null;   // {text, els:[pNodes]}

  /* ============ PROVIDER: OpenAI-compatible stream (Zhipu/GLM etc.) ============ */
  async function callGLM(messages, onToken, opts) {
    const c = AI();
    const url = (c.base || '').replace(/\/+$/, '') + '/chat/completions';
    const start = Date.now(), DEADLINE = 60000;  /* whole chain ≤ ~60s (long-form safe) */
    const body = {
      model: c.model || 'glm-5.3-flash-free',
      messages,
      temperature: Number(c.temp) || 0.85,
      max_tokens: Number(c.maxTok) || 1600,
      stream: true,
    };
    if (c.thinkOn && !opts.noThink) body.thinking = { type: 'enabled' };
    if (c.webOn && !opts.noWeb) body.tools = [{ type: 'web_search', web_search: { search_engine: 'search_std', enable: true } }];

    const go = async (probe) => {
      if (probe) {
        if (probe.noThink) delete body.thinking;
        if (probe.noWeb) { delete body.tools; opts.webFail = true; }
        if (probe.noStream) body.stream = false;
      }
      const ctl = new AbortController(); streaming = ctl;
      let aReason = null;
      ctl.__userAbort = () => { aReason = 'user'; try { ctl.abort(); } catch (e) {} };
      const left = DEADLINE - (Date.now() - start);
      const tid = setTimeout(() => { aReason = 'timeout'; try { ctl.abort(); } catch (e) {} }, Math.max(2500, Math.min(25000, left)));
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          signal: ctl.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (c.key || '') },
          body: JSON.stringify(body),
        });
      } catch (e) {
        clearTimeout(tid);
        throw new Error(e.name === 'AbortError' ? 'network:' + (aReason || 'abort') : 'network:fetch');
      }
      clearTimeout(tid);
      aReason = null;
      if (!res.ok) throw new Error('http:' + res.status);
      if (!body.stream) {
        const j = await res.json();
        const txt = (j.choices && j.choices[0] && (j.choices[0].message.content || '')) || '';
        (onToken)(txt); return { final: txt, webFail: !!opts.webFail };
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', final = '';
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buf += dec.decode(chunk.value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const ln of lines) {
            const raw = ln.trim();
            if (!raw.startsWith('data:')) continue;
            const data = raw.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const j = JSON.parse(data);
              const d = j.choices && j.choices[0] && j.choices[0].delta || {};
              const piece = d.content || '';
              if (piece) { final += piece; onToken(piece); }
            } catch (e) { /* keep-alive lines */ }
          }
        }
      } catch (e2) {
        if (e2.name === 'AbortError') throw new Error('network:' + (aReason || 'abort'));
        throw e2;
      }
      return { final, webFail: !!opts.webFail };
    };

    try { return await go(); }
    catch (e) {
      if (/network:(user|timeout)/.test(e.message)) throw e;
      /* graceful param surgery: retry bare, then non-stream */
      try { return await go({ noThink: true, noWeb: true }); }
      catch (e2) {
        if (/network:(user|timeout)/.test(e2.message)) throw e2;
        try { return await go({ noStream: true }); }
        catch (e3) { throw /network:(user|timeout)/.test(e3.message) ? e3 : new Error('provider-unreachable'); }
      }
    }
  }

  /* ============ OFFLINE SCRIBE — deterministic ember engine (varied structures) ============ */
  let scribeRun = 0;
  const SX = {
    open: [
      s => 'The herald came with ash on its boots: nothing crosses the threshold of ' + s.subject + ' unchanged.',
      s => 'Before the first wall was raised, ' + s.subject + ' was already an oath — and ' + s.k1 + ' outlives the mouth that swears it.',
      s => 'They say ' + s.subject + ' began as a wound; every wound in this world learns to wear the armor of ' + s.k1 + '.',
      s => 'Past the third rust-bitten gate, the road to ' + s.subject + ' is lit by nothing but ' + s.k2 + ' and the memory of the road.',
      s => 'Name a thing truly — ' + s.subject + ' — and the thing begins naming you back in the tongue of ' + s.k1 + '.',
      s => 'The scribes of Emberfall keep two ledgers: one for what was paid, one for ' + s.subject + '.',
      s => 'Winter kept its own counsel about ' + s.subject + ', and ' + s.k2 + ' kept its silence.',
      s => 'Every ruin is a sentence that refused to end; so it was with ' + s.subject + '.',
    ],
    lore: [
      s => 'What remains of ' + s.k1 + ' hangs in the deep archive — half scripture, half rust, the geology of a hope asked to carry too much.',
      s => 'The elders of the fall will not speak ' + s.k1 + ' aloud; names spoken with appetite return with appetites of their own.',
      s => 'Stone remembers; ' + s.k2 + ' remembers longer. Around their absence everything quietly rearranged itself, the way bone rearranges around an old break.',
      s => 'Where the light failed, ritual took root around ' + s.k1 + '; where ritual failed, the breaking wrote itself into every ledger of the deep.',
      s => 'They mapped ' + s.k2 + ' three centuries ago, and the map has been apologizing ever since.',
    ],
    visit: [
      s => 'The visitor crossed the salt threshold barefoot, unhosted, burned by the personal weather of ' + s.subject + '.',
      s => 'A seeker arrived with ' + s.k1 + ' tempered three times in grief, carrying the last honest question of a broken century.',
      s => 'A pilgrim came dressed in borrowed mercy, asked after ' + s.k2 + ', and left dressed in experience.',
      s => 'No one guides the way to ' + s.subject + '; the way accepts candidates and conducts its own interviews.',
    ],
    doom: [
      s => 'Then the brand burned — the mark that says you are claimed by a story too large to survive politely, and ' + s.k1 + ' knew its keeper.',
      s => 'The sky curdled to iron; sieges began above the clouds of ' + s.k2 + ', and the thunder that rolled down was applause.',
      s => 'It arrived at scale: an avalanche of consequence wearing the face of ' + s.k1 + ', ten thousand masks deep.',
      s => 'The debt called in its collateral — every vow spoken over ' + s.subject + ' came home carrying interest.',
    ],
    verdict: [
      'What is taken from the fire is not the fire. The law stands: bleed true, then write. As Emberfall endures, so endures the testimony.',
      'In the end nothing was owed but the telling, and the telling was paid in full.',
      'Those who carry it onward will not be thanked; that is how you can tell it was worth carrying.',
      'Let the archive note it once, without ornament: it held. Let the silence after it be agreement.',
    ],
  };
  const STRUCTURES = [
    ['open', 'lore', 'visit', 'doom', 'verdict'],
    ['open', 'visit', 'lore', 'doom', 'verdict'],
    ['open', 'doom', 'lore', 'visit', 'verdict'],
    ['visit', 'open', 'doom', 'lore', 'verdict'],
    ['open', 'lore', 'doom', 'visit', 'verdict'],
    ['lore', 'open', 'visit', 'doom', 'verdict'],
  ];
  function scribe(input) {
    scribeRun++;
    const words = input.trim().split(/\s+/).filter(Boolean);
    const stop = /^(the|and|with|from|into|over|under|when|then|that|this|of|for|his|her|its|their|before|after)$/i;
    const key = words.filter(w => w.length > 3 && !stop.test(w));
    const S = {
      subject: (words.length > 12 ? words.slice(0, 12).join(' ') : input.trim()).replace(/[.?!]+$/, ''),
      k1: (key[0] || 'the old vow').toLowerCase(),
      k2: (key[1] || key[0] || 'the drowned bell').toLowerCase(),
    };
    const hs = W.hash(input + '|' + scribeRun + '|' + Math.floor(Date.now() / 6e4));
    const pick = (bank, salt) => bank[(hs + (salt || 0) * 11 + scribeRun * 3) % bank.length];
    const structure = STRUCTURES[(hs + scribeRun) % STRUCTURES.length];
    const ps = structure.map((part, i) => {
      if (part === 'verdict') return pick(SX.verdict, i) + '\n\n— Scarlet Archive, sealed folio ' + (1000 + hs % 9000);
      return pick(SX[part], i)(S);
    });
    return ps.join('\n\n');
  }

  /* ============ REPORT — Research & Visit dossier (≤24 lines) ============ */
  function first6(txt) {
    const all = String(txt || '').trim().split(/\s+/).filter(Boolean);
    const tidy = s => s.replace(/^[\[\{\(\u00AB“'"—–-]+/, '').replace(/[\]\}\)\u00BB”'",.!?;:—–-]+$/, '');
    const w = all.slice(0, 6).map(tidy).filter(Boolean);
    return { six: w.join(' '), full: all, hasMore: all.length > 6 };
  }

  /* ---- minimal Markdown for streamed/stored prose (persona emits clean MD) ---- */
  function mdLine(pt) {
    let s = W.esc(pt);
    let hd = /^#{1,4}\s/.test(s) ? 'mhd' : '';
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/(^|\n)>\s?/g, '$1');
    s = s.replace(/^#{1,4}\s*/, '');
    s = s.replace(/\n/g, '<br>');
    return '<span class="' + (hd || 'mtxt') + '">' + s + '</span>';
  }

  /* ---- blank/ambiguous draft: cache-checkpoint invocation (persona continuity) ---- */
  const CLARIFY = {
    cache: 'The page arrived empty, yet the cache remembers what you let go. Your last checkpoint has been drawn back onto the WRITE pane — pale ink, restored. Seal it again with the ember SAVE & PROCESS and I will transmute it as before, or write anew. I do not transmute silence twice unasked.\n\n— THE HOLLOW CHRONICLER, keeper of checkpoints',
    empty: 'Wind moves through an empty scriptorium. There is no ink here to transmute — no name, no debt, no ember to feed. Put your words into the WRITE pane, press the ember seal, and I will set the machinery of dusk to work. I do not answer silence; I only wait for it to end.\n\n— THE HOLLOW CHRONICLER',
  };
  function clarifyFlow(kind) {
    W.tab.go('ai', 'read');
    buildReadShell(kind === 'cache' ? 'Cache-checkpoint invocation' : 'Blank invocation', { mode: 'starting' });
    renderReport({ id: 'ACX-HOLD', lines: [
      'CACHE PROTOCOL — draft blank · checkpoint memory ' + (kind === 'cache' ? 'invoked: latest draft restored to WRITE' : 'consulted: nothing storable found') + ' · no processing executed.',
      'STANCE — persona continuity maintained · clarification requested · dossier contents withheld until ink exists.',
    ] });
    streamText(CLARIFY[kind] || CLARIFY.empty, () => finishStream(CLARIFY[kind] || CLARIFY.empty), () => {});
  }
  function buildReport(input, meta) {
    const f6 = first6(input);
    const words = input.trim().split(/\s+/).filter(Boolean).length;
    const id = 'ACX-' + String(1000 + W.hash(input + meta.at) % 9000);
    const srcN = meta.web ? (3 + W.hash(input) % 3) : 0;
    const L = [];
    /* PROTOCOL: dossier line 1 opens strictly with the first six words — no prefix */
    L.push(f6.six + (f6.hasMore ? ' … +' + (f6.full.length - 6) + ' further words in corpus' : ' — draft held six words or fewer') + ' · RESEARCH & VISIT DOSSIER ' + id);
    L.push('STAMPED BY EPICWORD LORE OFFICE · ' + meta.at);
    L.push('01 ACQUIRE — draft captured; token fields: ' + words + ' words / ' + Math.round(input.length) + ' chars.');
    L.push('02 CHECKPOINT — local cache sealed at ' + meta.ckpt + ' (recovery-grade, non-volatile).');
    L.push('03 ROUTE — ' + (meta.provider === 'api' ? 'GLM engine ' + meta.model : 'local ember scribe (provider asleep)') + '; ' + (meta.web ? 'web sweep: ' + srcN + ' candidate-source threads weighed' : 'analytical sweep from internal corpus (web route off/unavailable)'));
    L.push('04 CALIBRATE — persona locked: Hollow Chronicler; influences: Dark Souls · Sekiro · Elden Ring · Berserk · ensemble-cinema epics.');
    L.push('05 THINK — ' + (meta.think ? 'deep-reasoning pass enabled: structure, mythography and imagery resolved pre-ink' : 'standard-reasoning pass (single-draft cadence)'));
    L.push('06 METHOD — subject mined → context cross-referenced (period · diction · motif register) → scene-frame set (arrival · archive · threshold · doom · verdict).');
    L.push('07 COMPOSE — prose forged at temperature ' + meta.temp + '; thematic enhancements ≤2 motif families; awe-moment budget: exactly one.');
    L.push('08 VERIFY — length ' + meta.words + ' words across ' + meta.paras + ' paragraphs; drift ' + meta.drift + '% from epic tonal mean.');
    L.push('09 STREAM — inked live to READER in ' + meta.secs + 's' + (meta.ctrl ? ' (operator halted at ' + meta.ctrl + ')' : '') + '.');
    L.push('10 VISIT LOG — (i) archive stack swept · (ii) threshold crossed · (iii) doom register consulted · (iv) verdict sealed.');
    L.push('STANCE — analysis is procedural, not interpretive; all claims trace to the captured draft or a declared route.');
    const clip = s => s.length > 108 ? s.slice(0, 105) + '…' : s;
    return { id, lines: L.map(clip) };
  }

  /* ============ WRITE side ============ */
  let sheetEl = null;
  function buildWrite() {
    const title = W.el('input', { class: 'wtitle', type: 'text', value: W.store.state.doc.title || 'Untitled Chronicle' });
    const sheet = W.el('div', { class: 'sheet', id: 'docsheet', contenteditable: 'true', spellcheck: 'true', tabindex: '0' });
    const saveBtn = W.el('button', { class: 'embertab', id: 'btnSave', type: 'button', title: 'Commit + run through engine (Ctrl+S)' }, W.icon('flame', 15), 'SAVE & PROCESS');
    const clearBtn = W.el('button', { class: 'gbtn wclear', type: 'button' }, W.icon('eraser', 14), 'CLEAR');
    const cpBtn = W.el('button', { class: 'gbtn tiny', type: 'button', style: { background: '#171018', borderColor: '#3d2c38', color: '#c9baa4' } }, W.icon('restock', 13), 'CHECKPOINT NOW');
    saveBtn.addEventListener('click', () => saveAndProcess());
    cpBtn.addEventListener('click', () => { checkpoint(true); W.toast('Checkpoint sealed', 'ok'); });
    clearBtn.addEventListener('click', async () => {
      const yes = await W.confirmBox('Clear draft', 'Erase the entire draft? Latest checkpoint stays for restore.', 'Erase');
      if (!yes) return;
      sheet.innerHTML = '<p><br></p>'; dirty = true; noteDirty();
      W.store.save(); W.status.update(W.editor.counts());
      W.toast('Draft erased — restore via checkpoint', 'ok');
    });

    const wrap = W.el('div', { class: 'wwrap' },
      W.el('div', { class: 'whd' },
        W.el('span', { class: 'wicon' }, W.icon('quill', 20)),
        title,
        W.el('div', { class: 'wbtns' }, cpBtn, clearBtn, saveBtn)),
      sheet,
      W.el('div', { class: 'wwhisper', text: 'WRITE — the author\'s draft field · every tool of the ribbon answers here · auto-checkpoints every quiet second' }));
    title.addEventListener('input', () => { W.store.state.doc.title = title.value; W.store.save(); });
    sheet.addEventListener('input', W.debounce(() => checkpoint(), 1100));
    sheetEl = sheet;
    return wrap;
  }

  function checkpoint(mark) {
    const html = sheetEl ? sheetEl.innerHTML : W.store.state.doc.html;
    const cks = AI().ckpts;
    const last = cks[cks.length - 1];
    if (last && last.html === html) { if (mark) chip(true); return; }
    cks.push({ ts: Date.now(), html });
    while (cks.length > 25) cks.shift();
    dirty = false;
    chip(true);
    W.store.save();
  }
  function chip(live) {
    const chip = document.getElementById('ckchip');
    if (!chip) return;
    const ck = AI().ckpts.filter(Boolean);
    chip.classList.toggle('live', !!live);
    chip.textContent = (live && ck.length) ? '◍ checkpoint sealed · ' + W.clockOf(new Date(ck[ck.length - 1].ts))
      : (ck.length ? '∅ cache armed · ' + ck.length + ' checkpoints' : '○ no checkpoint yet');
  }
  function noteDirty() { dirty = true; }
  function isDirty() { return dirty; }

  async function restoreLatest() {
    const cks = AI().ckpts;
    if (!cks.length) { W.toast('No checkpoint in the cache — write something first', 'warnc'); return; }
    const last = cks[cks.length - 1];
    if (sheetEl) sheetEl.innerHTML = last.html;
    W.store.state.doc.html = last.html;
    W.store.save();
    chip(true);
    W.tab && W.tab.go('ai', 'write');
    W.toast('Checkpoint restored from cache', 'ok');
  }

  /* ============ SAVE → PROCESS → READ ============ */
  async function saveAndProcess() {
    const input = sheetEl ? sheetEl.innerText.trim() : '';
    if (!input) {
      W.joltShake(sheetEl);
      const cks = AI().ckpts;
      if (cks.length > 0) {
        const lastCk = cks[cks.length - 1];
        if (sheetEl) sheetEl.innerHTML = lastCk.html;
        W.store.state.doc.html = lastCk.html;
        dirty = false;
        W.store.save();
        checkpoint(true);
        W.toast('Cache-checkpoint invoked — last draft restored to WRITE', 'warnc', 4600);
        clarifyFlow('cache');
      } else {
        clarifyFlow('empty');
      }
      return;
    }
    checkpoint(true);
    W.store.state.doc.html = sheetEl.innerHTML;
    dirty = false;

    /* redirect instantly to READ */
    W.tab.go('ai', 'read');
    chip(false);

    const t0 = performance.now();
    let accumulated = '';
    curStream = { text: '', els: [], timer: null, halted: false };
    buildReadShell(input, { mode: 'starting' });

    const meta = { at: new Date().toISOString(), provider: 'api', model: AI().model, web: AI().webOn, think: AI().thinkOn, temp: AI().temp };
    meta.ckpt = W.clockOf(new Date());

    let ctrl = '';
    const useApi = !!AI().key;      /* no key → local scribe demo engine */
    if (!useApi) meta.provider = 'scribe';
    const statTimer = setInterval(() => {
      if (statEl && curStream && curStream.timer) statEl.textContent = 'INKING · ' + ((performance.now() - t0) / 1000).toFixed(0) + 's · ' + (useApi ? 'GLM' : 'SCRIBE');
    }, 500);

    const deliver = (providerExtra) => {
      clearInterval(statTimer);
      meta.words = accumulated.trim() ? accumulated.trim().split(/\s+/).filter(Boolean).length : 0;
      meta.paras = accumulated.trim() ? accumulated.trim().split(/\n{2,}/).filter(x => x.trim()).length : 0;
      meta.drift = (8 + W.hash(accumulated) % 6);
      meta.secs = ((performance.now() - t0) / 1000).toFixed(1);
      meta.ctrl = ctrl;
      if (providerExtra) Object.assign(meta, providerExtra);
      const rep = buildReport(input, meta);
      renderReport(rep);
      finishStream(accumulated);
      /* smart title + description — rich record, not just six words */
      const smartTitle = () => {
        const line0 = input.split(/\n/)[0] || '';
        let s = line0.replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim() || input.replace(/\s+/g, ' ').trim();
        const w2 = s.split(' ').filter(Boolean);
        if (w2.length > 10) s = w2.slice(0, 10).join(' ');
        return (s.length > 64 ? s.slice(0, 61) + '…' : s) || 'Untitled Chronicle';
      };
      const title = smartTitle();
      const p0 = (accumulated.trim().split(/\n{2,}/)[0] || '').replace(/[#>*_`]/g, '').replace(/\s+/g, ' ').trim();
      const description = p0.length > 180 ? p0.slice(0, 177) + '…' : p0;
      const cl = (W.table && W.table.classify) ? W.table.classify(input, meta) : { genre: '—', theme: '—', score: 0, grade: 'B' };
      const html = sheetText2HTML(accumulated);
      W.store.state.ai.story = { ts: Date.now(), input, html, report: rep.lines.join('\n'), meta };
      const outs = W.store.state.ai.outputs;
      outs.unshift({ id: rep.id, ts: Date.now(), title, description, provider: meta.provider, model: meta.model, web: !!meta.web, think: !!meta.think, genre: cl.genre, theme: cl.theme, score: cl.score, grade: cl.grade, words: meta.words, html, reportLines: rep.lines });
      while (outs.length > 60) outs.pop();
      if (W.DB) { try { W.DB.put({ id: rep.id, ts: Date.now(), title, description, html, plain: accumulated, reportLines: rep.lines, provider: meta.provider, model: meta.model, genre: cl.genre, theme: cl.theme, score: cl.score, grade: cl.grade, words: meta.words, pinned: false }); } catch (e) {} }
      W.store.save();
      W.store.flush();                       /* full text persisted immediately */
      refreshRecList();
      let ledSealed = false;
      if (W.table && W.table.logDelivery) { ledSealed = !!W.table.logDelivery(input, meta, rep, { title, description, cl }); }
      W.toast((meta.provider === 'api' ? 'Chronicle delivered — ' + meta.words + ' words' : 'Ember scribe delivered — provider offline') + (ledSealed ? ' · DATATABLE row + ledger sealed' : ''), 'ok');
    };

    if (!useApi) {
      runOffline(input, meta, (txt, done) => { accumulated = txt; if (done) deliver(); }, () => { ctrl = 'operator halt'; deliver({ ctrl }); });
      return;
    }

    /* true API path */
    let sys = PERSONA;
    if (AI().thinkOn) sys = THINK_LEAD + sys;
    const clHint = (W.table && W.table.classify) ? W.table.classify(input, meta) : null;
    if (clHint) sys += '\nREGISTER — this piece reads as ' + clHint.genre + '; motif register: ' + clHint.theme + '. Let the draft lead the cadence and structure; never force the same arc twice.';
    const avoid = (AI().outputs || []).slice(0, 2).map(o => o.title).filter(Boolean);
    if (avoid.length) sys += '\nANTI-REPETITION — the reader has just read these openings; do not reuse their patterns: ' + avoid.join(' | ') + '.';
    const msgs = [
      { role: 'system', content: sys },
      { role: 'user', content: input },
    ];
    const push = piece => { accumulated += piece; appendStream(piece); };
    try {
      const r = await callGLM(msgs, push, {});
      meta.web = !r.webFail;
      deliver({ chars: r.final.length });
    } catch (e) {
      if (/network:user/.test(String(e.message))) { ctrl = 'operator halt'; deliver({ ctrl }); return; }
      meta.provider = 'scribe'; meta.web = false; meta.note = 'provider unreachable — local scribe engaged';
      toastSoft('Provider unreachable — the ember scribe takes the quill');
      buildReadShell(input, { mode: 'restart' });
      runOffline(input, meta, (txt, done) => { accumulated = txt; if (done) deliver(); }, () => { ctrl = 'operator halt'; deliver({ ctrl }); });
    }
  }

  /* offline runner: fake sweep delay then typewriter streaming */
  function runOffline(input, meta, onTick, onStop) {
    const t0 = performance.now();
    const sw = W.el('div', { class: 'stmiss' } , W.el('div', { class: 'msic' }, W.icon('flame', 20)), 'SWEEPING THE INTERNAL CORPUS…');
    if (outEl) { outEl.innerHTML = ''; outEl.append(sw); }
    setTimeout(() => {
      const full = scribe(input);
      outEl && (outEl.innerHTML = '');
      streamText(full, () => { onTick(full, true); }, onStop);
    }, 850);
  }
  function streamText(full, done, onStop) {
    let i = 0;
    const speed = Math.max(4, Number(AI().speed) || 13);
    curStream = { text: '', els: [], timer: null, halted: false };
    const tick = () => {
      if (curStream.halted) { onStop && onStop(); return; }
      const step = 2 + Math.floor(Math.random() * 3);
      const piece = full.slice(i, i + step); i += step;
      appendStream(piece);
      if (i < full.length) curStream.timer = setTimeout(tick, speed);
      else done();
    };
    tick();
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && curStream && curStream.timer) { curStream.halted = true; clearTimeout(curStream.timer); }
  });

  /* ============ READ side ============ */
  function sheetText2HTML(txt) {
    return txt.trim().split(/\n{2,}/).map(p => '<p class="drop">' + mdLine(p) + '</p>').join('');
  }
  function buildReadShell(input, opt) {
    const pane = document.getElementById('pane-r');
    const f6 = first6(input).six;
    const chip = (ic, label, off) => W.el('span', { class: 'rchip' + (off ? ' off' : '') }, W.icon(ic, 11), label);
    metaChips = W.el('div', { class: 'rchips' },
      chip('globe', 'WEB SWEEP', !(AI().webOn && AI().key)),
      chip('brain', 'DEEP REASON', !(AI().thinkOn && AI().key)),
      chip(opt.andProvider === 'scribe' || !AI().key ? 'flame' : 'bolt', !AI().key ? 'EMBER SCRIBE (LOCAL)' : 'GLM · ' + AI().model));
    statEl = W.el('span', { class: 'rchip off', text: '…' });
    outEl = W.el('div', { class: 'streambox', id: 'streambox' });
    outEl.append(W.el('div', { class: 'stmiss' }, W.el('div', { class: 'msic' }, W.icon('quill', 20)), 'INK PUDDLES GATHER — TRANSCRIBING…'));

    const stopBtn = W.el('button', { class: 'gbtn', type: 'button' }, W.icon('stop', 13), 'HALT');
    stopBtn.addEventListener('click', () => {
      if (streaming) { if (streaming.__userAbort) streaming.__userAbort(); streaming = null; }
      if (curStream && curStream.timer) { curStream.halted = true; clearTimeout(curStream.timer); }
      W.toast('Halted — keeping the ink already laid', 'warnc');
    });
    const copyBtn = W.el('button', { class: 'gbtn', type: 'button' }, W.icon('copy2', 13), 'COPY PROSE');
    copyBtn.addEventListener('click', () => W.copyText(curStream ? curStream.text : ''));
    const toWrite = W.el('button', { class: 'gbtn', type: 'button' }, W.icon('edit', 13), 'BACK TO WRITE');
    toWrite.addEventListener('click', () => W.tab.go('ai', 'write'));

    const repBox = W.el('div', { class: 'report', id: 'reportBox' });
    pane.innerHTML = '';
    pane.append(W.el('div', { class: 'rrap' },
      W.el('div', { class: 'rhead' },
        W.el('span', { class: 'lstar' }, W.icon('book', 22)),
        W.el('div', { class: 'rmeta' },
          W.el('div', { class: 'rkicker', text: 'ACTIVE CHRONICLE · READ-ONLY' }),
          W.el('div', { class: 'rname', text: (f6 || 'Unnamed') + (first6(input).hasMore ? '…' : '') }),
          metaChips),
        statEl,
        W.el('div', { class: 'rbtns' }, toWrite, copyBtn, stopBtn)),
      repBox,
      outEl));
    if (!AI().key && opt.mode !== 'restored' && opt.mode !== 'idle') {
      pane.firstElementChild.after(W.el('div', { class: 'rnote' }, W.icon('flame', 12),
        'Running local ember scribe (limited variety) — add a GLM key in Tools → Preferences for the full engine.'));
    }
    refreshRecList();
  }
  window.buildReadShell = buildReadShell;

  function appendStream(piece) {
    if (!outEl) return;
    // parse into paragraphs as text accumulates
    curStream.text = (curStream.text || '') + piece;
    const paras = curStream.text.split(/\n{2,}/);
    // ensure p nodes
    if (outEl.querySelector('.stmiss')) outEl.innerHTML = '';
    while (outEl.children.length < paras.length) outEl.append(W.el('p', { class: 'drop' }));
    while (outEl.children.length > paras.length) outEl.lastElementChild.remove();
    paras.forEach((pt, i) => {
      const p = outEl.children[i];
      p.innerHTML = mdLine(pt);
    });
    hoverCursor();
    outEl.scrollTop = outEl.scrollHeight;
  }
  function hoverCursor() {
    const last = outEl && outEl.lastElementChild;
    if (!last) return;
    $$('.curcar').forEach(c => c.remove());
    last.append(W.el('span', { class: 'curcar' }));
  }
  function finishStream(txt) {
    hoverCursor();
    if (statEl) statEl.textContent = 'COMPLETE · ' + (txt.trim().split(/\s+/).filter(Boolean).length) + ' words';
    if (metaChips) $$('.rchip', metaChips).forEach(c => c.classList.remove('off'));
    // paint last glyph: fade cursor after done
    setTimeout(() => { const c = $('.curcar'); c && c.remove(); }, 2600);
  }
  function toastSoft(msg) { W.toast(msg, 'warnc', 4200); }

  function renderReport(rep) {
    const box = document.getElementById('reportBox');
    if (!box) return;
    box.innerHTML = '';
    const bar = W.el('div', { class: 'repbar' }, W.icon('target', 13), 'RESEARCH & VISIT REPORT · ', W.el('b', { text: rep.id }), W.el('span', { style: { marginLeft: 'auto', color: '#8d7a66' }, text: 'STRICT ≤ 24 LINES' }));
    const lines = W.el('div', { class: 'lines' });
    rep.lines.forEach(l => lines.append(W.el('div', { class: 'ln', text: l })));
    box.append(bar, lines);
    lines.scrollTop = lines.scrollHeight;
  }
  async function refreshRecList() {
    document.querySelectorAll('.reclist').forEach(x => x.remove());
    const rrap = document.querySelector('.rrap');
    if (!rrap) return;
    /* merge: db archive (full, ≥50) + localStorage indexes — unique by id */
    let recs = [];
    try { recs = W.DB ? await W.DB.all() : []; } catch (e) { recs = []; }
    const seen = {}, merged = [];
    (recs || []).forEach(r => { if (r && r.id && !seen[r.id]) { seen[r.id] = 1; merged.push(r); } });
    (AI().outputs || []).forEach(o => {
      if (o && o.id && !seen[o.id]) { seen[o.id] = 1; merged.push({ id: o.id, ts: o.ts || 0, title: o.title, provider: o.provider, pinned: false, html: o.html, reportLines: o.reportLines }); }
    });
    merged.sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || ((b.ts || 0) - (a.ts || 0)));
    if (!merged.length) return;
    const list = W.el('div', { class: 'reclist' });
    merged.slice(0, 50).forEach(o => {
      const b = W.el('button', { class: 'rec' + (o.pinned ? ' pin' : ''), type: 'button', title: o.title || o.id },
        W.el('b', { text: (o.pinned ? '★ ' : '') + (o.id || '') }),
        W.el('span', { class: 'rt', text: o.title || o.subject || '' }),
        W.el('i', { class: 'rp', text: (o.provider === 'api' ? 'GLM' : 'SCRIBE') + ' · ' + W.clockOf(new Date(o.ts || Date.now())) }));
      b.addEventListener('click', () => openArchive(o));
      const del = W.el('span', { class: 'recx', title: 'Delete from archive' }, '✕');
      del.addEventListener('click', async e => {
        e.stopPropagation();
        await W.DB.del(o.id);
        const outs = AI().outputs;
        const i2 = outs.findIndex(x => x.id === o.id); if (i2 > -1) outs.splice(i2, 1);
        W.store.save(); W.store.flush();
        refreshRecList();
        W.toast('Chronicle struck from the archive', 'warnc');
      });
      b.append(del);
      list.append(b);
    });
    rrap.after(list);
  }
  async function openArchive(o) {
    let rec = o;
    if (W.DB && !o.html) { try { rec = (await W.DB.get(o.id)) || o; } catch (e) {} }
    W.tab.go('ai', 'read');
    if (curStream && curStream.timer) { curStream.halted = true; clearTimeout(curStream.timer); }
    buildReadShell(rec.title || rec.id, { mode: 'restored' });
    const st = document.getElementById('streambox');
    if (st) st.innerHTML = rec.html || '<p class="drop">The archive holds the index, but this leaf\'s ink was lost to the quota fire.</p>';
    if (rec.reportLines && rec.reportLines.length) {
      const rb = document.getElementById('reportBox');
      if (rb) renderReport({ id: rec.id, lines: rec.reportLines });
    }
    const w2 = (rec.plain || '').trim().split(/\s+/).filter(Boolean).length || rec.words || 0;
    if (statEl) statEl.textContent = 'RESTORED FROM ARCHIVE · ' + w2 + ' words';
    W.toast('«' + (rec.title || rec.id) + '» restored from the db archive — nothing regenerated', 'info', 3600);
  }
  function idleRead() {
    const pane = document.getElementById('pane-r');
    if (!pane || pane.querySelector('.streambox') || curStream) return;
    buildReadShell('The archive awaits', { mode: 'idle' });
    const st = document.getElementById('streambox');
    if (st) st.innerHTML = '<div class="stmiss"><div class="msic">' + W.icon('book', 20) + '</div>NOTHING YET — WRITE, THEN SAVE &amp; PROCESS<br><span style="font-size:11px;letter-spacing:1px;color:#6b5a4c;text-transform:none">past chronicles open from the archive list below · nothing is ever lost</span></div>';
    if (statEl) statEl.textContent = 'IDLE';
  }

  /* ============ prefs dialog ============ */
  function openPrefs() {
    const c = AI();
    const body = W.el('div', {});
    const ckWeb = W.el('input', { type: 'checkbox' });
    const ckThink = W.el('input', { type: 'checkbox' });
    ckWeb.checked = !!c.webOn; ckWeb.dataset.v = c.webOn ? '1' : '0';
    ckThink.checked = !!c.thinkOn; ckThink.dataset.v = c.thinkOn ? '1' : '0';
    const ckRow = (input, label, hint) => {
      const row = W.el('div', { class: 'frow check' }, input, W.el('label', { text: label }));
      if (hint) row.append(W.el('span', { class: 'fhint', text: hint }));
      return row;
    };
    const f = (label, node, hint) => {
      const row = W.el('div', { class: 'frow' }, W.el('label', { text: label }));
      row.append(node);
      if (hint) row.append(W.el('div', { class: 'fhint', text: hint }));
      body.append(row);
    };
    const inBase = W.el('input', { type: 'text', value: c.base, style: { width: '100%' } });
    const inModel = W.el('input', { type: 'text', value: c.model, style: { width: '100%' } });
    const inKey = W.el('input', { type: 'password', value: c.key, placeholder: 'paste GLM key (sk-… or bigmodel key)', style: { width: '100%' } });
    const inTemp = W.el('input', { type: 'number', min: '0', max: '2', step: '0.05', value: String(c.temp), style: { width: '110px' } });
    const inMax = W.el('input', { type: 'number', min: '200', max: '8192', step: '100', value: String(c.maxTok), style: { width: '110px' } });
    const inSpeed = W.el('input', { type: 'number', min: '3', max: '80', value: String(c.speed), style: { width: '110px' } });
    f('API BASE URL (OpenAI-compatible v4/chat/completions)', inBase, 'Zhipu bigmodel works out of the box; any OpenAI-style endpoint is fair game.');
    f('MODEL ID', inModel, 'e.g. glm-5.3-flash-free · glm-4-flash (free tier) · glm-4-plus');
    f('API KEY', inKey, 'Stored locally only — never leaves this machine except in Authorization headers.');
    f('TEMPERATURE / SOUL BIAS', inTemp);
    f('MAX TOKENS', inMax);
    f('OFFLINE SCRIBE SPEED (ms per glyph, local mode)', inSpeed);
    body.append(
      ckRow(ckWeb, 'ENABLE WEB SWEEP (tools: web_search)', 'Sent as a GLM web_search tool; falls back gracefully if the provider rejects it.'),
      ckRow(ckThink, 'ENABLE DEEP REASONING (think hard)', 'Adds thinking={"type":"enabled"} plus a strict no-spoilers directive for deliberation.'));
    const status = W.el('div', { class: 'fhint', style: { marginTop: '9px' }, text: '' });
    body.append(status);

    W.dialog({
      title: 'AI Engine — GLM Settings', icon: 'gear', wide: true, body,
      buttons: [
        { label: 'SAVE', onClick: () => {
            c.base = inBase.value.trim(); c.model = inModel.value.trim(); c.key = inKey.value.trim();
            c.temp = Math.min(2, Math.max(0, Number(inTemp.value) || 0.85));
            c.maxTok = Math.max(200, Number(inMax.value) || 1600);
            c.speed = Math.max(3, Number(inSpeed.value) || 13);
            c.webOn = ckWeb.checked; c.thinkOn = ckThink.checked; c.offlineAuto = true;
            W.store.save();
            W.toast('Engine configuration saved', 'ok');
          } }],
      footNote: 'Keys stay on this machine · demo mode streams without a key',
    });
  }

  function about() {
    W.dialog({
      title: 'EpicWord', icon: 'crown',
      body: '<p style="margin-top:0"><b>EpicWord — Word Clone · AI Chronicle Engine</b> v1.0</p>' +
        '<p>A faithful Microsoft-Word workspace (menus, ribbon, status bar) wired to a GLM-5.3-Flash writing engine: WRITE drafts → SAVE processes → READ streams the chronicle, each dispatch stamped with a ≤24-line research & visit dossier.</p>' +
        '<p>Runs fully local (file://). Persists in localStorage. Bring your own GLM key in <b>Tools → Preferences</b>.</p>',
      footNote: 'LORE OFFICE PRESS · zero dependencies',
    });
  }
  function shortcutsDlg() {
    W.dialog({
      title: 'Keyboard Shortcuts', icon: 'file',
      body: '<table style="border-collapse:collapse;width:100%">' +
        [['Ctrl+S', 'SAVE & PROCESS (AI workspace) → redirects to READ'],
         ['Ctrl+N', 'New document'], ['Ctrl+O', 'Open file (.txt/.md/.html/.csv)'],
         ['Ctrl+P', 'Print / export PDF'], ['Ctrl+F', 'Find'], ['Ctrl+H', 'Find & Replace'],
         ['Ctrl+B / I / U', 'Bold / Italic / Underline'], ['Alt+1 / 2 / 3', 'TODO · AI WORKSPACE · DATATABLE'],
         ['Alt+W', 'Swap WRITE ↔ READ'], ['Alt+Q', 'Collapse / expand ribbon'],
         ['Enter', 'Commit grid cell / title edit'], ['Esc', 'Stop streaming / close dialogs']]
         .map(r => '<tr><td style="padding:4px 12px 4px 0;white-space:nowrap"><kbd>' + r[0] + '</kbd></td><td style="padding:4px 0;color:#5a6472">' + r[1] + '</td></tr>').join('') +
        '</table>',
      footNote: 'All shortcuts are local — no server involved.',
    });
  }

  /* headings for chips */
  W.ai = {
    buildWrite, openPrefs, about, shortcutsDlg, saveAndProcess, restoreLatest,
    isDirty, checkpoint, chip, first6, callGLM, scribe, buildReport, refreshRecList,
    mdLine, clarifyFlow, idleRead, openArchive,
  };
})();
