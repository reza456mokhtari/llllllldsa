/* ============================================================
   EpicWord — state.js · single localStorage document-store
   ============================================================ */
window.W = window.W || {};
(function () {
  'use strict';
  const KEY = 'epicword.v1';
  const S = W;

  function welcomeDoc() {
    return [
      '<h1 style="text-align:center">A SPARK FROM THE ASHEN FRONTIER</h1>',
      '<p style="text-align:center"><em>— field notes of the Third Expedition, recorded in EpicWord</em></p><hr>',
      '<h2>I. What This Page Wants From You</h2>',
      '<p>This is the <strong>WRITE</strong> canvas of the AI Workspace — your one true draft. Ink it, reshape it, strike through it. When the words feel ready, press the ember <strong>SAVE&nbsp;&amp;&nbsp;PROCESS</strong> seal: your draft is checkpointed, the engine turns, and you are taken straight to <strong>READ</strong>, where the Chronicle streams in line by line.</p>',
      '<p>Try the tools above this sheet — every ribbon group answers to shortcuts: <strong>Ctrl+B</strong> bold, <strong>Ctrl+I</strong> italic, <strong>Ctrl+F</strong> find, <strong>Ctrl+S</strong> commit.</p>',
      '<h2>II. Laws of the Engine</h2>',
      '<ul>',
      '<li>Automatic checkpoints fall every quiet second — restore them with <em>␣↺ RESTORE</em> on the workspace bar.</li>',
      '<li>SAVE commits <em class="x">and</em> dispatches the draft to the GLM engine; if the provider sleeps, the local ember scribe forges the Chronicle so nothing halts.</li>',
      '<li>Each dispatch leaves a research dossier — the first six words of your draft open it, twenty-four lines seal it.</li>',
      '</ul>',
      '<h2>III. A Sample of Style</h2>',
      '<blockquote>“In the lands between, nothing is remembered but the light. Carry it, little flame.”</blockquote>',
      '<pre>Drag the tools. Bend the format. Then SAVE — and watch the READ pane breathe.</pre>',
      '<p>When this page no longer serves you: <strong>File → New</strong>.</p>',
      '<hr><p style="text-align:center; color:#8a7c66; font-size:12px">EPICWORD ENGINE · LORE OFFICE PRESS</p>',
    ].join('');
  }

  function seedTodo() {
    const mk = (title, note, prio, done) => ({ id: W.uid(), title, note, prio, due: '', done: !!done, ts: Date.now() });
    return [
      mk('Forge the opening sentence', 'name a herald, a debt, a door', 'h', false),
      mk('Name every ruler in the pantheon of dusk', '', 'm', false),
      mk('Log expedition relics in the datatable', '', 'l', false),
      mk('Read yesterday\'s Chronicle aloud', 'voices crack where truth lives', 'm', true),
    ];
  }
  function seedDt() {
    const C = name => ({ id: W.uid(), name });
    const c1 = C('Relic'), c2 = C('Origin'), c3 = C('Hazard'), c4 = C('Custodian');
    const R = (a, b, c, d) => ({ id: W.uid(), c: { [c1.id]: a, [c2.id]: b, [c3.id]: c, [c4.id]: d } });
    return {
      cols: [c1, c2, c3, c4],
      rows: [
        R('Ashplate of Naled', 'The Flame Docks', 'Chronic Ash', 'Order of the Third Lamp'),
        R('Ser\'s Cold Wick', 'Sunken Frost Shrub', 'Frost Rot', 'The Silent Choir'),
        R('Lantern of the Western Root', 'Deep Rhizome', 'Sap Golems', 'Ranger Maus'),
      ],
    };
  }

  const state = {
    v: 1,
    prefs: { theme: 'office', zoom: 100, statusbar: true, ribbonMin: false },
    doc: { title: 'Untitled Chronicle', html: null },
    todo: seedTodo(),
    dt: seedDt(),
    ai: {
      base: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-5.3-flash-free',
      key: '',
      temp: 0.85, maxTok: 1600, webOn: true, thinkOn: true, offlineAuto: true, speed: 13,
      ckpts: [], story: null, outputs: [], ledger: [],
    },
  };

  const store = {
    state,
    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p && typeof p === 'object') {
            state.prefs = Object.assign({}, state.prefs, p.prefs || {});
            state.doc = Object.assign({}, state.doc, p.doc || {});
            state.todo = Array.isArray(p.todo) ? p.todo.map(t => Object.assign({ prio: 'm', done: false, note: '', due: '', ts: 0, title: '' }, t)) : state.todo;
            state.dt = (p.dt && Array.isArray(p.dt.cols) && Array.isArray(p.dt.rows)) ? p.dt : seedDt();
            state.ai = Object.assign({}, state.ai, p.ai || {});
            if (!Array.isArray(state.ai.ledger)) state.ai.ledger = [];
          }
        } catch (e) { /* corrupt -> keep defaults */ }
      }
      if (!state.doc.html) state.doc.html = welcomeDoc();
      state.todo.forEach(t => { if (!t.id) t.id = W.uid(); });
      if (!state.dt.cols.length) state.dt = seedDt();
      if (!state.ai.model) state.ai.model = 'glm-5.3-flash-free';
      if (!state.ai.base) state.ai.base = 'https://open.bigmodel.cn/api/paas/v4';
      return state;
    },
    save: W.debounce(() => {
      try { localStorage.setItem(KEY, JSON.stringify(store.state)); } catch (e) { /* quota */ }
    }, 220),
    flush() { try { localStorage.setItem(KEY, JSON.stringify(store.state)); } catch (e) {} },
    export() { return JSON.stringify({ app: 'epicword', ver: 1, at: new Date().toISOString(), state: store.state }, null, 1); },
    wipeAll() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state.doc = { title: 'Untitled Chronicle', html: welcomeDoc() };
      state.todo = seedTodo();
      state.dt = seedDt();
      state.ai.base = 'https://open.bigmodel.cn/api/paas/v4';
      state.ai.model = 'glm-5.3-flash-free';
      state.ai.key = '';
      state.ai.temp = 0.85; state.ai.maxTok = 1600; state.ai.webOn = true;
      state.ai.thinkOn = true; state.ai.offlineAuto = true; state.ai.speed = 13;
      state.ai.ckpts = []; state.ai.story = null; state.ai.outputs = []; state.ai.ledger = [];
      state.prefs = { theme: 'office', zoom: 100, statusbar: true, ribbonMin: false };
    },
  };

  S.store = store;
})();
