/* ===========================================================================
   MAQHAA AL-SAAHIRAT — the working of the house.

   Everything the reader does is remembered in localStorage: which fables are
   finished, how far into the unfinished ones you got, who you like sitting
   with, how loud the rain is. There is no backend. There is a cafe.
   =========================================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================================
     WHAT THE HOUSE REMEMBERS
     ======================================================================= */
  const KEY = "maqhaa.v1";
  const DEFAULTS = {
    v: 1,
    seen: {},                       // id -> {read, pos, block, at}
    seats: [],                      // extra sprites pinned to the counter
    mix: { cafe: 0.4, rain: 0 },
    prefs: {
      font: "serif", size: 19, lead: 1.72, measure: 38,
      vn: false, sfx: true, calm: false, type: true, sort: "cup",
      theme: "nobody",
    },
    visits: 0, last: 0,
  };

  let S;
  try {
    S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}"));
    S.prefs = Object.assign({}, DEFAULTS.prefs, S.prefs);
    S.mix = Object.assign({}, DEFAULTS.mix, S.mix);
    S.seen = S.seen || {};
    S.seats = S.seats || [];
  } catch (e) {
    S = JSON.parse(JSON.stringify(DEFAULTS));
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* full or private */ }
    }, 250);
  }
  const mark = (id) => (S.seen[id] = S.seen[id] || { read: false, pos: 0, block: 0, at: 0 });

  /* =======================================================================
     THE ROOMS

     Three of them. Everything visual lives in CSS tokens under
     html[data-theme], so switching is one attribute — except the bright room,
     whose background is video rather than a gif, and which therefore has a
     <video> to start and stop. It stays unloaded until somebody asks for it.
     ======================================================================= */
  const THEMES = [
    { id: "nobody", name: "NOBODY",
      note: "the violet hour · rain on the glass, somebody's hill outdoors" },
    { id: "warm",   name: "WARM",
      note: "espresso and brass · the chalkboard, the long wooden counter" },
    { id: "bright", name: "BRIGHT",
      note: "eleven in the morning · windows open, the plants doing well" },
  ];

  function applyTheme(id) {
    if (!THEMES.some((t) => t.id === id)) id = "nobody";
    S.prefs.theme = id;
    document.documentElement.setAttribute("data-theme", id);

    const vid = $("bgvid");
    if (id === "bright") {
      if (!vid.getAttribute("src")) vid.setAttribute("src", "assets/cafebright.mp4");
      if (reduced || S.prefs.calm) vid.pause();   // the poster frame stands in
      else vid.play().catch(() => {});            // muted autoplay; poster if refused
    } else {
      vid.pause();
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content",
        getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim() ||
        "#150c26");
    }
    save();
  }

  /* =======================================================================
     SOUND — soft mechanical things, synthesised. No sample files to ship.
     ======================================================================= */
  const SFX = (() => {
    let ctx = null;
    function ac() {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function noise(dur, cut, gain) {
      const a = ac(); if (!a) return;
      const n = Math.max(1, Math.floor(a.sampleRate * dur));
      const buf = a.createBuffer(1, n, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = a.createBufferSource(); src.buffer = buf;
      const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cut;
      const g = a.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(a.destination);
      src.start();
    }
    function tone(f0, f1, dur, gain, type) {
      const a = ac(); if (!a) return;
      const o = a.createOscillator(); o.type = type || "sine";
      const g = a.createGain();
      o.frequency.setValueAtTime(f0, a.currentTime);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + dur);
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, a.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + dur + 0.02);
    }
    const on = () => S.prefs.sfx;
    return {
      /* a keycap bottoming out */
      key() { if (!on()) return; noise(0.028, 2600, 0.055); tone(150, 90, 0.05, 0.05, "triangle"); },
      /* the soft one, for moving down a list */
      blip() { if (!on()) return; tone(620, 780, 0.06, 0.032); },
      /* paper */
      page() { if (!on()) return; noise(0.11, 3400, 0.036); },
      /* china on wood */
      cup() { if (!on()) return; tone(880, 660, 0.13, 0.035); tone(1320, 1180, 0.09, 0.016, "triangle"); },
      /* the door */
      door() { if (!on()) return; noise(0.32, 900, 0.075); tone(96, 62, 0.4, 0.05, "triangle"); },
      warm() { ac(); },
    };
  })();

  /* =======================================================================
     AMBIENCE — two loops, mixed by hand at the jukebox
     ======================================================================= */
  const AMB = (() => {
    const tracks = {
      cafe: { src: "assets/cafenoise.mp3", a: null },
      rain: { src: "assets/rain.mp3", a: null },
    };
    let started = false;
    function ensure(k) {
      const t = tracks[k];
      if (!t.a) {
        t.a = new Audio();
        t.a.loop = true;
        t.a.preload = "none";
        t.a.src = t.src;
      }
      return t.a;
    }
    function apply(k) {
      const v = clamp(Number(S.mix[k]) || 0, 0, 1);
      if (v <= 0.001) {
        if (tracks[k].a) tracks[k].a.pause();
        return;
      }
      const a = ensure(k);
      a.volume = v * v;                    // ears are logarithmic; sliders aren't
      if (started && a.paused) a.play().catch(() => {});
    }
    return {
      start() { started = true; apply("cafe"); apply("rain"); },
      set(k, v) { S.mix[k] = v; apply(k); save(); },
      get: (k) => S.mix[k],
      playing: (k) => !!(tracks[k].a && !tracks[k].a.paused && S.mix[k] > 0.001),
    };
  })();

  /* =======================================================================
     MARKDOWN — enough of it for this corpus, and nothing it never uses.

     Single newlines inside a paragraph are kept as breaks: half these pages
     are verse, epigraph and log entry, and joining those lines would flatten
     the shape the author typed.
     ======================================================================= */
  function inline(src) {
    const code = [];
    let s = src.replace(/`([^`]+)`/g, (m, c) => {
      code.push(c);
      return "\u0000" + (code.length - 1) + "\u0000";
    });
    s = esc(s);
    // the house's own stage-whisper, *]like this[*
    s = s.replace(/\*\]([\s\S]*?)\[\*/g, '<span class="aside">$1</span>');
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\n][^*]*)\*(?![*\w])/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^_\w])__([^_]+)__(?![_\w])/g, "$1<strong>$2</strong>");
    s = s.replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
    s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => "<code>" + esc(code[+i]) + "</code>");
    return s;
  }

  const RE_HR = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
  const RE_H = /^(#{1,6})\s+(.*)$/;
  const RE_UL = /^\s{0,3}[-*+]\s+(.*)$/;
  const RE_OL = /^\s{0,3}(\d+)[.)]\s+(.*)$/;
  const RE_FENCE = /^\s{0,3}(`{3,}|~{3,})\s*(\S*)/;
  const RE_ROW = /^\s{0,3}\|(.+)\|\s*$/;
  const RE_SEP = /^\s{0,3}\|?[\s:|-]*-[\s:|-]*\|?\s*$/;

  function blocks(md) {
    const lines = md.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      let line = lines[i];

      if (!line.trim()) { i++; continue; }

      const fence = line.match(RE_FENCE);
      if (fence) {
        const close = fence[1][0];
        const buf = [];
        i++;
        while (i < lines.length && !new RegExp("^\\s{0,3}" + close + "{3,}\\s*$").test(lines[i])) {
          buf.push(lines[i]); i++;
        }
        i++;
        out.push({ t: "pre", code: buf.join("\n"), lang: fence[2] || "" });
        continue;
      }

      if (RE_HR.test(line)) { out.push({ t: "hr" }); i++; continue; }

      const h = line.match(RE_H);
      if (h) { out.push({ t: "h", n: h[1].length, s: h[2].trim() }); i++; continue; }

      if (/^\s{0,3}>/.test(line)) {
        // strict: only marked lines. The corpus marks every line of a quote,
        // and lazy continuation would swallow the paragraph that follows.
        const buf = [];
        while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
          i++;
        }
        out.push({ t: "quote", kids: blocks(buf.join("\n")) });
        continue;
      }

      // a table needs its separator row to be a table at all
      if (RE_ROW.test(line) && i + 1 < lines.length && RE_SEP.test(lines[i + 1]) && lines[i + 1].includes("|")) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const head = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && RE_ROW.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push({ t: "table", head, rows });
        continue;
      }

      if (RE_UL.test(line) || RE_OL.test(line)) {
        const ordered = RE_OL.test(line);
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(ordered ? RE_OL : RE_UL);
          if (!m) {
            // a wrapped continuation line belongs to the item above it
            if (items.length && lines[i].trim() && !RE_HR.test(lines[i]) &&
                !RE_H.test(lines[i]) && !/^\s{0,3}>/.test(lines[i]) &&
                !RE_UL.test(lines[i]) && !RE_OL.test(lines[i])) {
              items[items.length - 1] += " " + lines[i].trim(); i++; continue;
            }
            break;
          }
          items.push((ordered ? m[2] : m[1]).trim());
          i++;
        }
        out.push({ t: ordered ? "ol" : "ul", items });
        continue;
      }

      const buf = [];
      while (i < lines.length && lines[i].trim() && !RE_HR.test(lines[i]) &&
             !RE_H.test(lines[i]) && !/^\s{0,3}>/.test(lines[i]) &&
             !RE_UL.test(lines[i]) && !RE_OL.test(lines[i]) && !RE_FENCE.test(lines[i])) {
        buf.push(lines[i].trim()); i++;
      }
      if (buf.length) out.push({ t: "p", lines: buf });
    }
    return out;
  }

  const CJK = /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/;

  function renderBlock(b) {
    switch (b.t) {
      case "h": {
        const n = clamp(b.n, 1, 4);
        return "<h" + n + ">" + inline(b.s) + "</h" + n + ">";
      }
      /* Not an <hr>: it's a void element, and hanging the ornament off its
         ::after is unreliable. A div always draws. */
      case "hr": return '<div class="rule" role="separator">❧</div>';
      case "p": {
        // A run of *]stage whispers[* is already a stack of blocks; a <br>
        // between them would open a blank line each time.
        const allAside = b.lines.every((l) => /^\*\].*\[\*$/.test(l.trim()));
        const body = b.lines.map(inline).join(allAside ? "" : "<br>");
        const cls = [];
        if (CJK.test(b.lines[0])) cls.push("cjk");
        if (b.dek) cls.push("dek");
        return "<p" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + body + "</p>";
      }
      case "quote": return "<blockquote>" + b.kids.map(renderBlock).join("") + "</blockquote>";
      case "ul": return "<ul>" + b.items.map((x) => "<li>" + inline(x) + "</li>").join("") + "</ul>";
      case "ol": return "<ol>" + b.items.map((x) => "<li>" + inline(x) + "</li>").join("") + "</ol>";
      case "pre": return "<pre><code>" + esc(b.code) + "</code></pre>";
      case "table": {
        const th = b.head.map((c) => "<th>" + inline(c) + "</th>").join("");
        const tr = b.rows.map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("");
        return "<table><thead><tr>" + th + "</tr></thead><tbody>" + tr + "</tbody></table>";
      }
      default: return "";
    }
  }

  /* House style puts the gloss straight under the title as a lone italic line.
     Mark it so it can be set as a dek rather than as the opening paragraph. */
  function markDek(bs) {
    const first = bs.findIndex((b) => b.t === "h" && b.n === 1);
    if (first < 0) return bs;
    for (let i = first + 1; i < Math.min(first + 3, bs.length); i++) {
      const b = bs[i];
      if (b.t === "h") continue;
      if (b.t === "p" && b.lines.length === 1 && /^[*_].+[*_]$/.test(b.lines[0].trim())) b.dek = true;
      break;
    }
    return bs;
  }

  const renderAll = (bs) => markDek(bs).map(renderBlock).join("");

  /* ---- VN beats: the same blocks, cut into things you can read in a box --- */
  const BEAT_MAX = 620;

  function beats(bs) {
    const out = [];
    let chapter = "";
    for (const b of bs) {
      if (b.t === "hr") continue;
      if (b.t === "h") {
        if (b.n <= 2) chapter = b.s;
        out.push({ html: '<span class="vn-h">' + inline(b.s) + "</span>", chapter });
        continue;
      }
      if (b.t === "p") {
        const text = b.lines.join("\n");
        if (text.length <= BEAT_MAX) {
          out.push({ html: renderBlock(b), chapter });
          continue;
        }
        // long prose: break on sentence ends, never mid-clause
        const parts = text.split(/(?<=[.!?…”"'’」』])\s+(?=[^\s])/);
        let run = [];
        let len = 0;
        for (const s of parts) {
          if (len && len + s.length > BEAT_MAX) {
            out.push({ html: renderBlock({ t: "p", lines: run.join(" ").split("\n") }), chapter });
            run = []; len = 0;
          }
          run.push(s); len += s.length + 1;
        }
        if (run.length) out.push({ html: renderBlock({ t: "p", lines: run.join(" ").split("\n") }), chapter });
        continue;
      }
      out.push({ html: renderBlock(b), chapter });
    }
    return out;
  }

  /* =======================================================================
     THE COUNTER — who is on, and what they say
     ======================================================================= */
  const byId = (id) => BARISTAS.find((b) => b.id === id);
  const ALL_SPRITES = BARISTAS.map((b) => ({ id: b.id, name: b.name, sprite: b.sprite }))
    .concat(GUESTS);

  let host = null;
  let lastLines = [];

  function rotaHost() {
    const h = new Date().getHours();
    const slot = ROTA.find((r) => (h >= r.from && h < r.to) || (r.to > 24 && h < r.to - 24));
    return slot ? slot.id : "herta";
  }

  function chooseHost() {
    const day = new Date().getDay();
    if (day === AGRAT_DAY && Math.random() < AGRAT_CHANCE) return byId("agrat");
    const onRota = BARISTAS.filter((b) => !b.guest);
    // whoever's hour it is, usually — but any of them might just be nearest
    let choice = Math.random() < OFF_ROTA_CHANCE
      ? pick(onRota)
      : byId(rotaHost()) || onRota[0];
    if (S.lastHost && choice.id === S.lastHost && onRota.length > 1) {
      const others = onRota.filter((b) => b.id !== S.lastHost);
      if (Math.random() < 0.7) choice = pick(others);
    }
    S.lastHost = choice.id;
    return choice;
  }

  /* Nobody wants the same line twice in a sitting. */
  function fresh(pool) {
    if (!pool || !pool.length) return null;
    const unheard = pool.filter((l) => !lastLines.includes(l));
    const line = pick(unheard.length ? unheard : pool);
    lastLines.push(line);
    while (lastLines.length > 24) lastLines.shift();
    return line;
  }

  /* ---- talkbox ------------------------------------------------------------ */
  const talkbox = $("talkbox"), talkName = $("talk-name"),
        talkText = $("talk-text"), talkNext = $("talk-next");
  let queue = [], typing = null, full = "";

  function say(text, who) {
    queue.push({ text, who: who || host });
    if (!typing) next();
  }
  function stop() { if (typing) { clearInterval(typing); typing = null; } }
  function next() {
    stop();
    const line = queue.shift();
    if (!line) { talkNext.classList.remove("show"); return; }
    const w = line.who || host;
    talkName.textContent = w ? w.name : "";
    talkName.style.background = w ? w.accent : "";
    full = line.text;
    talkNext.classList.remove("show");

    if (reduced || !S.prefs.type) { talkText.textContent = full; done(); return; }
    let i = 0;
    talkText.innerHTML = '<span class="caret"></span>';
    typing = setInterval(() => {
      i += 2;
      talkText.innerHTML = esc(full.slice(0, i)) + '<span class="caret"></span>';
      if (i >= full.length) { stop(); talkText.textContent = full; done(); }
    }, 16);
  }
  function done() { talkNext.classList.add("show"); }

  function advance() {
    SFX.blip();
    if (typing) { stop(); talkText.textContent = full; done(); return; }
    if (queue.length) { next(); return; }
    const line = fresh(host && host.idle);
    if (line) say(line);
  }
  talkbox.addEventListener("click", advance);
  talkbox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
  });

  /* ---- sprites ------------------------------------------------------------ */
  function paintCounter() {
    const wrap = $("sprites");
    wrap.textContent = "";
    const seated = S.seats
      .map((id) => ALL_SPRITES.find((s) => s.id === id))
      .filter(Boolean)
      .filter((s) => !host || s.id !== host.id)
      .slice(0, 3);
    const cast = (host ? [{ id: host.id, name: host.name, sprite: host.sprite, host: true }] : [])
      .concat(seated);

    wrap.classList.remove("duo", "trio", "quad");
    if (cast.length === 2) wrap.classList.add("duo");
    if (cast.length === 3) wrap.classList.add("trio");
    if (cast.length >= 4) wrap.classList.add("quad");

    cast.forEach((c) => {
      const d = el("div", "spr" + (c.host ? " host" : ""));
      const img = new Image();
      img.src = c.sprite; img.alt = ""; img.decoding = "async";
      d.appendChild(img);
      wrap.appendChild(d);
    });

    if (host) {
      const plate = el("div", "counter-plate");
      plate.appendChild(el("p", "counter-name", host.name));
      plate.appendChild(el("p", "counter-role", host.role));
      plate.appendChild(el("p", "counter-desig", host.desig));
      wrap.appendChild(plate);
    }
    if (host) {
      document.documentElement.style.setProperty("--accent", host.accent);
      document.documentElement.style.setProperty("--accent2", host.accent2);
    }
    paintVnSprites();
  }

  /* The barista stays at the counter. Whoever is pouring is not a character in
     the story you're reading, so VN mode shows only the cast you seated —
     and nothing at all if you seated nobody. */
  function paintVnSprites() {
    const wrap = $("vn-sprites");
    if (!wrap) return;
    wrap.textContent = "";
    S.seats
      .map((id) => ALL_SPRITES.find((s) => s.id === id))
      .filter(Boolean)
      .slice(0, 3)
      .forEach((c) => {
        const d = el("div", "spr");
        const img = new Image();
        img.src = c.sprite; img.alt = ""; img.decoding = "async";
        d.appendChild(img);
        wrap.appendChild(d);
      });
  }

  /* =======================================================================
     THE MENU
     ======================================================================= */
  /* Strength pips, the way a menu marks a roast. Deliberately not emoji —
     emoji render at a different weight to everything else on the plate. */
  const CUPS = {
    demitasse: { glyph: "▪", label: "DEMITASSE · under ten minutes" },
    cup:       { glyph: "▪▪", label: "A CUP · ten to twenty-five minutes" },
    pot:       { glyph: "▪▪▪", label: "THE LONG POUR · half an hour and up" },
    carafe:    { glyph: "▪▪▪▪", label: "THE WHOLE POT · settle in properly" },
  };
  const CUP_ORDER = ["demitasse", "cup", "pot", "carafe"];

  const SORTS = [
    { id: "cup",    label: "BY THE CUP" },
    { id: "title",  label: "A–Z" },
    { id: "recent", label: "FRESHEST" },
    { id: "long",   label: "LONGEST" },
    { id: "unread", label: "UNPOURED" },
  ];

  let query = "";

  function menuMatches(f) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (f.title + " " + f.subtitle + " " + f.shelf + " " + f.source).toLowerCase().includes(q);
  }

  function trackNode(f, n) {
    const st = S.seen[f.id];
    const li = el("li", "track");
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    if (st && st.read) li.classList.add("read");
    else if (st && st.pos > 0.02) li.classList.add("reading");

    li.appendChild(el("span", "track-n", String(n).padStart(2, "0")));

    const t = el("span", "track-t");
    t.appendChild(document.createTextNode(f.title));
    if (f.shelf) t.appendChild(el("span", "track-shelf", f.shelf.toUpperCase()));
    if (f.variant) t.appendChild(el("span", "track-variant", "· " + f.variant));
    li.appendChild(t);

    if (f.subtitle) li.appendChild(el("span", "track-s", f.subtitle));

    const m = el("span", "track-m");
    m.appendChild(el("span", "track-cup", CUPS[f.cup].glyph));
    m.appendChild(el("span", null, f.minutes + " MIN"));
    const glyph = st && st.read ? "◕" : st && st.pos > 0.02 ? "◔" : "○";
    const mk = el("span", "track-mark", glyph);
    mk.title = st && st.read ? "finished" : st && st.pos > 0.02 ? "started" : "untouched";
    m.appendChild(mk);
    li.appendChild(m);

    if (st && !st.read && st.pos > 0.02) {
      const bar = el("span", "track-bar");
      const fill = el("i");
      fill.style.width = Math.round(st.pos * 100) + "%";
      bar.appendChild(fill);
      li.appendChild(bar);
    }

    const go = () => { SFX.key(); open(f.id); };
    li.addEventListener("click", go);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
    return li;
  }

  function paintMenu() {
    const list = $("tracklist");
    list.textContent = "";
    const sort = S.prefs.sort;
    let rows = FABLES.filter(menuMatches);

    const st = (f) => S.seen[f.id] || { read: false, pos: 0 };
    if (sort === "title") rows.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "recent") rows.sort((a, b) => b.mtime - a.mtime);
    if (sort === "long") rows.sort((a, b) => b.words - a.words);
    if (sort === "unread") {
      rows.sort((a, b) => (st(a).read ? 1 : 0) - (st(b).read ? 1 : 0) ||
                          st(b).pos - st(a).pos ||
                          a.title.localeCompare(b.title));
    }

    $("menu-empty").hidden = rows.length > 0;

    if (sort === "cup") {
      let n = 0;
      CUP_ORDER.forEach((c) => {
        const group = rows.filter((f) => f.cup === c).sort((a, b) => a.title.localeCompare(b.title));
        if (!group.length) return;
        const h = el("li", "sec-head");
        h.setAttribute("role", "presentation");
        h.appendChild(el("span", null, CUPS[c].label));   // the plate; ::after is the rule
        list.appendChild(h);
        group.forEach((f) => list.appendChild(trackNode(f, ++n)));
      });
    } else {
      rows.forEach((f, i) => list.appendChild(trackNode(f, i + 1)));
    }

    const readCount = FABLES.filter((f) => S.seen[f.id] && S.seen[f.id].read).length;
    const mins = FABLES.reduce((a, f) => a + f.minutes, 0);
    $("menu-note").textContent =
      `${FABLES.length} on the shelf · ${readCount} finished · ` +
      `${Math.floor(mins / 60)}h ${mins % 60}m of reading, if you took it all at once`;
  }

  function paintSorts() {
    const box = $("sorts");
    box.textContent = "";
    SORTS.forEach((s) => {
      const b = el("button", "sort" + (S.prefs.sort === s.id ? " on" : ""), s.label);
      b.type = "button";
      b.addEventListener("click", () => {
        SFX.blip();
        S.prefs.sort = s.id; save(); paintSorts(); paintMenu();
      });
      box.appendChild(b);
    });
  }

  /* =======================================================================
     THE READING
     ======================================================================= */
  let current = null;         // the fable record
  let currentBeats = [];
  let beatIdx = 0;
  const cache = new Map();

  const viewMenu = $("view-menu"), viewRead = $("view-read");

  function showMenu() {
    viewRead.hidden = true;
    viewMenu.hidden = false;
    current = null;
    closeVN(true);
    $("resume").hidden = true;
    paintMenu();
    document.title = "Maqhaa al-Saahirat · the Witches' Cafe";
    setHash("");
  }

  /* file:// forbids history writes, and a thrown SecurityError here would take
     the whole navigation with it. */
  function setHash(id) {
    try {
      history.replaceState(null, "", id ? "#" + id : location.pathname + location.search);
    } catch (e) { /* opened straight off disk; the hash is a nicety */ }
  }

  async function load(f) {
    if (cache.has(f.id)) return cache.get(f.id);
    const res = await fetch(f.file);
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const md = await res.text();
    const bs = blocks(md);
    const built = { html: renderAll(bs), beats: beats(bs) };
    cache.set(f.id, built);
    return built;
  }

  async function open(id, opts) {
    const f = FABLES.find((x) => x.id === id);
    if (!f) return;
    current = f;
    viewMenu.hidden = true;
    viewRead.hidden = false;
    $("read-title").textContent = f.title;
    $("read-sub").textContent = f.subtitle || (f.minutes + " min · " + f.words.toLocaleString() + " words");
    document.title = f.title + " · Maqhaa al-Saahirat";
    setHash(f.id);
    $("btn-done").classList.toggle("on", !!(S.seen[f.id] && S.seen[f.id].read));

    const page = $("page");
    page.innerHTML = '<p class="menu-empty">pouring…</p>';
    window.scrollTo(0, 0);
    $("resume").hidden = true;

    let built;
    try {
      built = await load(f);
    } catch (err) {
      page.innerHTML = '<div class="page-body"><p><strong>The page would not come.</strong></p>' +
        "<p>" + esc(String(err.message || err)) + "</p>" +
        "<p><em>If this is running off a <code>file://</code> address, the browser refuses to " +
        "fetch the story files. Serve the folder instead — <code>python3 -m http.server</code> " +
        "from inside it — and Herta will stop looking at you like that.</em></p></div>";
      return;
    }
    if (current !== f) return;              // they moved on while it was loading

    const body = el("div", "page-body");
    body.innerHTML = built.html;
    page.textContent = "";
    page.appendChild(body);
    page.appendChild(pageEnd(f));
    currentBeats = built.beats;

    const st = mark(f.id);
    st.at = Date.now();
    save();

    const line = fresh(host && host.open);
    if (line) { queue = []; stop(); say(line); }

    if (S.prefs.vn) { openVN(opts && opts.beat != null ? opts.beat : (st.block || 0)); return; }

    if (!opts || !opts.top) {
      if (st.pos > 0.02 && st.pos < 0.95 && !st.read) offerResume(st);
    }
    updateProgress();
  }

  function pageEnd(f) {
    const end = el("div", "page-end");
    end.appendChild(el("p", null, "❦   END OF " + f.title.toUpperCase() + "   ❦"));
    const done = el("button", "btn", "MARK AS READ");
    done.type = "button";
    done.addEventListener("click", () => { SFX.cup(); setRead(f.id, true); showMenu(); });
    const back = el("button", "btn ghost", "BACK TO THE MENU");
    back.type = "button";
    back.addEventListener("click", () => { SFX.key(); showMenu(); });

    const idx = FABLES.findIndex((x) => x.id === f.id);
    end.appendChild(done);
    end.appendChild(back);
    if (idx >= 0 && idx < FABLES.length - 1) {
      const nx = FABLES[idx + 1];
      const b = el("button", "btn ghost", "NEXT: " + nx.title.toUpperCase().slice(0, 26));
      b.type = "button";
      b.addEventListener("click", () => { SFX.page(); open(nx.id, { top: true }); });
      end.appendChild(b);
    }
    return end;
  }

  function offerResume(st) {
    const t = $("resume");
    const line = (host && fresh(host.resume)) || "You left off partway.";
    $("resume-txt").textContent = line + "  (" + Math.round(st.pos * 100) + "%)";
    t.hidden = false;
  }
  $("btn-resume").addEventListener("click", () => {
    SFX.page();
    $("resume").hidden = true;
    const st = S.seen[current.id];
    const h = document.documentElement.scrollHeight - innerHeight;
    // Instant, not smooth: you asked to be back at your place, not to watch
    // twenty thousand pixels of it go by. (And smooth scrolling never settles
    // in webviews that don't composite.)
    window.scrollTo(0, Math.round(h * st.pos));
    lastY = window.scrollY;
  });
  $("btn-restart").addEventListener("click", () => {
    SFX.page();
    $("resume").hidden = true;
    window.scrollTo({ top: 0 });
  });

  function setRead(id, v) {
    const st = mark(id);
    st.read = v;
    if (v) { st.pos = 1; st.block = 0; }
    save();
    const f = FABLES.find((x) => x.id === id);
    if (v && f) {
      const line = fresh(host && host.finish);
      if (line) { queue = []; stop(); say(line); }
    }
  }

  /* Where you got to, kept cheaply.

     Both a listener and a poll, on purpose. Some embedded webviews — the one
     this was built in among them — never dispatch scroll events at all, even
     though scrollY moves; losing your place in a forty-thousand-word fable
     because the host browser is unusual is not an acceptable failure. The poll
     compares one number and does nothing the rest of the time. */
  let scrollTick = null;
  let lastY = -1;

  function updateProgress() {
    if (!current || S.prefs.vn) return;
    const h = document.documentElement.scrollHeight - innerHeight;
    const pos = h > 40 ? clamp(window.scrollY / h, 0, 1) : 1;
    $("read-prog").style.width = (pos * 100).toFixed(1) + "%";
    const st = mark(current.id);
    st.pos = pos;
    if (pos > 0.93 && !st.read) {
      st.read = true;
      const line = fresh(host && host.finish);
      if (line) { queue = []; stop(); say(line); }
    }
    st.at = Date.now();
    save();
  }

  addEventListener("scroll", () => {
    if (viewRead.hidden || scrollTick) return;
    scrollTick = setTimeout(() => { scrollTick = null; lastY = window.scrollY; updateProgress(); }, 180);
  }, { passive: true });

  setInterval(() => {
    if (viewRead.hidden || !current || S.prefs.vn) return;
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    updateProgress();
  }, 450);

  /* =======================================================================
     VISUAL NOVEL MODE
     ======================================================================= */
  const vn = $("vn"), vnText = $("vn-text"), vnNext = $("vn-next"),
        vnBar = $("vn-bar"), vnCount = $("vn-count"), vnChapter = $("vn-chapter");
  let vnTyping = null;

  function openVN(at) {
    if (!current || !currentBeats.length) return;
    beatIdx = clamp(at | 0, 0, currentBeats.length - 1);
    vn.hidden = false;
    document.body.classList.add("vn-on");
    document.body.style.overflow = "hidden";
    $("vn-title").textContent = current.title;
    $("btn-vn").classList.add("on");
    paintVnSprites();
    showBeat();
    vn.focus && vn.focus();
    $("vn-box").focus();
  }

  function closeVN(silent) {
    if (vn.hidden) return;
    stopVnType();
    vn.hidden = true;
    document.body.classList.remove("vn-on");
    document.body.style.overflow = "";
    $("btn-vn").classList.toggle("on", !!S.prefs.vn);
    if (!silent && current) {
      // hand the scroll reader the place VN got to
      const st = mark(current.id);
      st.pos = currentBeats.length ? beatIdx / (currentBeats.length - 1 || 1) : 0;
      save();
    }
  }

  function stopVnType() { if (vnTyping) { clearInterval(vnTyping); vnTyping = null; } }

  /* Typing across live markup: lay the HTML down, empty every text node, then
     refill them in document order. Emphasis and quotes survive intact. */
  function typeHtml(node, html, onDone) {
    stopVnType();
    node.innerHTML = html;
    if (reduced || !S.prefs.type) { onDone(); return; }
    const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const parts = [];
    let total = 0;
    while (walk.nextNode()) {
      const t = walk.currentNode.data;
      parts.push({ n: walk.currentNode, s: t });
      total += t.length;
      walk.currentNode.data = "";
    }
    if (!total) { onDone(); return; }
    let shown = 0, pi = 0;
    const STEP = 3;
    vnTyping = setInterval(() => {
      let budget = STEP;
      while (budget > 0 && pi < parts.length) {
        const p = parts[pi];
        const have = p.n.data.length;
        if (have >= p.s.length) { pi++; continue; }
        const take = Math.min(budget, p.s.length - have);
        p.n.data = p.s.slice(0, have + take);
        budget -= take; shown += take;
      }
      if (shown >= total || pi >= parts.length) {
        stopVnType();
        parts.forEach((p) => { p.n.data = p.s; });
        onDone();
      }
    }, 16);
  }

  function showBeat() {
    const b = currentBeats[beatIdx];
    if (!b) return;
    vnCount.textContent = (beatIdx + 1) + " / " + currentBeats.length;
    vnBar.style.width = (((beatIdx + 1) / currentBeats.length) * 100).toFixed(1) + "%";
    if (b.chapter) { vnChapter.hidden = false; vnChapter.textContent = b.chapter; }
    else vnChapter.hidden = true;
    vnNext.classList.remove("show");
    vnText.scrollTop = 0;
    typeHtml(vnText, b.html, () => vnNext.classList.add("show"));

    const st = mark(current.id);
    st.block = beatIdx;
    st.pos = currentBeats.length > 1 ? beatIdx / (currentBeats.length - 1) : 1;
    if (beatIdx >= currentBeats.length - 1) st.read = true;
    st.at = Date.now();
    save();
  }

  function vnAdvance(dir) {
    if (dir !== -1 && vnTyping) {         // first click finishes the line
      stopVnType();
      const b = currentBeats[beatIdx];
      vnText.innerHTML = b.html;
      vnNext.classList.add("show");
      SFX.blip();
      return;
    }
    const nxt = beatIdx + (dir === -1 ? -1 : 1);
    if (nxt < 0) return;
    if (nxt >= currentBeats.length) {
      SFX.cup();
      setRead(current.id, true);
      closeVN(true);
      showMenu();
      return;
    }
    beatIdx = nxt;
    SFX.page();
    showBeat();
  }

  $("vn-box").addEventListener("click", () => vnAdvance(1));
  $("vn-box").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); vnAdvance(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); vnAdvance(-1); }
    if (e.key === "Escape") { e.preventDefault(); leaveVN(); }
  });
  $("vn-exit").addEventListener("click", leaveVN);

  function leaveVN() {
    SFX.key();
    S.prefs.vn = false; save();
    closeVN();
    $("btn-vn").classList.remove("on");
    if (current) open(current.id, { top: false });
  }

  $("btn-vn").addEventListener("click", () => {
    SFX.key();
    S.prefs.vn = !S.prefs.vn;
    save();
    $("btn-vn").classList.toggle("on", S.prefs.vn);
    if (!current) return;
    if (S.prefs.vn) {
      const st = mark(current.id);
      const at = st.block || Math.round((st.pos || 0) * (currentBeats.length - 1));
      openVN(at);
    } else {
      closeVN();
      open(current.id);
    }
  });

  $("btn-done").addEventListener("click", () => {
    if (!current) return;
    SFX.cup();
    const st = mark(current.id);
    setRead(current.id, !st.read);
    $("btn-done").classList.toggle("on", S.seen[current.id].read);
  });

  $("btn-back").addEventListener("click", () => { SFX.key(); showMenu(); });
  $("brand").addEventListener("click", () => { SFX.key(); showMenu(); });

  /* =======================================================================
     DRAWERS
     ======================================================================= */
  const drawer = $("drawer");
  function openDrawer(title, build) {
    $("drawer-title").textContent = title;
    const body = $("drawer-body");
    body.textContent = "";
    build(body);
    drawer.hidden = false;
    SFX.key();
  }
  function closeDrawer() { drawer.hidden = true; }
  $("drawer-close").addEventListener("click", () => { SFX.key(); closeDrawer(); });
  $("drawer-scrim").addEventListener("click", closeDrawer);

  function field(parent, label, note) {
    const f = el("div", "field");
    if (label) f.appendChild(el("p", "field-label", label));
    parent.appendChild(f);
    if (note) f.dataset.note = note;
    return f;
  }
  function slider(parent, label, value, oninput, fmt) {
    const f = field(parent, label);
    const row = el("div", "slider");
    const input = document.createElement("input");
    input.type = "range"; input.min = 0; input.max = 100;
    input.value = Math.round(value * 100);
    input.setAttribute("aria-label", label);
    const val = el("span", "val", fmt ? fmt(value) : Math.round(value * 100) + "%");
    input.addEventListener("input", () => {
      const v = Number(input.value) / 100;
      val.textContent = fmt ? fmt(v) : Math.round(v * 100) + "%";
      oninput(v);
    });
    row.appendChild(input); row.appendChild(val);
    f.appendChild(row);
    return f;
  }
  function toggle(parent, label, on, onclick) {
    const b = el("button", "toggle" + (on ? " on" : ""));
    b.type = "button";
    b.appendChild(el("span", "box", "✓"));
    b.appendChild(el("span", "lbl", label));
    b.addEventListener("click", () => {
      SFX.blip();
      const now = !b.classList.contains("on");
      b.classList.toggle("on", now);
      onclick(now);
    });
    parent.appendChild(b);
    return b;
  }
  function choices(parent, label, opts, currentId, onpick) {
    const f = field(parent, label);
    const row = el("div", "choices");
    opts.forEach((o) => {
      const b = el("button", "choice" + (o.id === currentId ? " on" : ""), o.label);
      b.type = "button";
      b.addEventListener("click", () => {
        SFX.blip();
        [...row.children].forEach((c) => c.classList.remove("on"));
        b.classList.add("on");
        onpick(o.id);
      });
      row.appendChild(b);
    });
    f.appendChild(row);
    return f;
  }

  /* ---- jukebox ------------------------------------------------------------ */
  $("btn-jukebox").addEventListener("click", () => openDrawer("THE JUKEBOX", (body) => {
    const note = el("p", "field-note",
      "The house doesn't play music — you do, on your own machine, and we turn " +
      "the room down to suit. What the Maqhaa keeps is weather.");
    body.appendChild(note);
    body.appendChild(el("div", null, " "));

    ["cafe", "rain"].forEach((k) => {
      const deck = el("div", "deck" + (AMB.playing(k) ? " on" : ""));
      const top = el("div", "deck-top");
      top.appendChild(el("span", "deck-lamp"));
      top.appendChild(el("span", "deck-name",
        k === "cafe" ? "THE ROOM · cups, chairs, low talk" : "THE WEATHER · rain on the glass"));
      deck.appendChild(top);

      const row = el("div", "slider");
      const input = document.createElement("input");
      input.type = "range"; input.min = 0; input.max = 100;
      input.value = Math.round(AMB.get(k) * 100);
      input.setAttribute("aria-label", k === "cafe" ? "Cafe ambience volume" : "Rain volume");
      const val = el("span", "val", Math.round(AMB.get(k) * 100) + "%");
      input.addEventListener("input", () => {
        const v = Number(input.value) / 100;
        val.textContent = Math.round(v * 100) + "%";
        AMB.set(k, v);
        deck.classList.toggle("on", v > 0.001);
      });
      row.appendChild(input); row.appendChild(val);
      deck.appendChild(row);

      const vu = el("div", "vu");
      for (let i = 0; i < 14; i++) vu.appendChild(el("i"));
      deck.appendChild(vu);
      body.appendChild(deck);
    });

    const f = field(body, "PRESETS");
    const row = el("div", "choices");
    [
      { label: "QUIET HOUR", cafe: 0.18, rain: 0 },
      { label: "FULL ROOM", cafe: 0.62, rain: 0 },
      { label: "RAIN ON THE GLASS", cafe: 0.3, rain: 0.55 },
      { label: "DOWNPOUR", cafe: 0.12, rain: 0.85 },
      { label: "CLOSED", cafe: 0, rain: 0 },
    ].forEach((p) => {
      const b = el("button", "choice", p.label);
      b.type = "button";
      b.addEventListener("click", () => {
        SFX.cup();
        AMB.set("cafe", p.cafe); AMB.set("rain", p.rain);
        closeDrawer();
      });
      row.appendChild(b);
    });
    f.appendChild(row);

    body.appendChild(el("p", "field-note",
      "Phrolova keeps the hour after dusk and would prefer the rain up. " +
      "Herta claims the room noise helps her concentrate and is lying."));
  }));

  /* ---- who's sitting with you --------------------------------------------- */
  function buildSeats(body) {
    body.appendChild(el("p", "field-note",
      "Whoever's nearest takes the counter — that's not up to you. But you can " +
      "ask up to three others to sit in. They keep their seats between visits."));

    const f = field(body, "AT THE TABLE");
    const grid = el("div", "seatgrid");
    ALL_SPRITES.forEach((s) => {
      const b = el("button", "seat");
      b.type = "button";
      b.title = s.name;
      const img = new Image();
      img.src = s.sprite; img.alt = s.name; img.decoding = "async";
      b.appendChild(img);
      b.appendChild(el("span", "cap", s.name));
      const idx = S.seats.indexOf(s.id);
      if (idx >= 0) { b.classList.add("on"); b.appendChild(el("span", "pin", String(idx + 1))); }
      b.addEventListener("click", () => {
        const at = S.seats.indexOf(s.id);
        if (at >= 0) S.seats.splice(at, 1);
        else {
          if (S.seats.length >= 3) S.seats.shift();   // last in, first bumped
          S.seats.push(s.id);
        }
        SFX.cup();
        save();
        paintCounter();
        openDrawer("PULL UP A CHAIR", buildSeats);    // redraw for the pins
      });
      grid.appendChild(b);
    });
    f.appendChild(grid);

    if (S.seats.length) {
      const clear = el("button", "btn sm ghost", "CLEAR THE TABLE");
      clear.type = "button";
      clear.addEventListener("click", () => {
        SFX.key(); S.seats = []; save(); paintCounter(); closeDrawer();
      });
      body.appendChild(clear);
    }
  }
  $("btn-seats").addEventListener("click", () => openDrawer("PULL UP A CHAIR", buildSeats));

  /* ---- the rooms ----------------------------------------------------------- */
  function buildThemes(body) {
    body.appendChild(el("p", "field-note",
      "The Maqhaa has been three places. It is the same shelf and the same " +
      "company; only the hour and the wallpaper move."));

    const f = field(body, "WHICH ROOM");
    const list = el("div", "roomlist");
    THEMES.forEach((t) => {
      const b = el("button", "room" + (S.prefs.theme === t.id ? " on" : ""));
      b.type = "button";
      b.dataset.room = t.id;
      b.appendChild(el("span", "room-swatch"));
      const txt = el("span", "room-txt");
      txt.appendChild(el("span", "room-name", t.name));
      txt.appendChild(el("span", "room-note", t.note));
      b.appendChild(txt);
      b.addEventListener("click", () => {
        SFX.cup();
        applyTheme(t.id);
        [...list.children].forEach((c) => c.classList.toggle("on", c.dataset.room === t.id));
      });
      list.appendChild(b);
    });
    f.appendChild(list);
    body.appendChild(el("p", "field-note",
      "BRIGHT runs its background as video. If your battery would rather it " +
      "didn't, turn on CALM SCREEN in the house rules and it holds a still frame."));
  }
  $("btn-theme").addEventListener("click", () => openDrawer("THE ROOM", buildThemes));

  /* ---- settings ------------------------------------------------------------ */
  $("btn-prefs").addEventListener("click", () => openDrawer("THE HOUSE RULES", (body) => {
    choices(body, "THE READING FACE", [
      { id: "serif", label: "SERIF" }, { id: "sans", label: "SANS" },
    ], S.prefs.font, (v) => { S.prefs.font = v; applyPrefs(); save(); });

    slider(body, "TYPE SIZE", (S.prefs.size - 15) / 12,
      (v) => { S.prefs.size = Math.round(15 + v * 12); applyPrefs(); save(); },
      (v) => Math.round(15 + v * 12) + "px");

    slider(body, "LEADING", (S.prefs.lead - 1.4) / 0.7,
      (v) => { S.prefs.lead = +(1.4 + v * 0.7).toFixed(2); applyPrefs(); save(); },
      (v) => (1.4 + v * 0.7).toFixed(2));

    slider(body, "MEASURE", (S.prefs.measure - 26) / 26,
      (v) => { S.prefs.measure = Math.round(26 + v * 26); applyPrefs(); save(); },
      (v) => Math.round(26 + v * 26) + "em");

    const f = field(body, "THE ROOM");
    const list = el("div", "togglelist");
    toggle(list, "VISUAL NOVEL MODE BY DEFAULT", S.prefs.vn, (v) => {
      S.prefs.vn = v; save(); $("btn-vn").classList.toggle("on", v);
    });
    toggle(list, "TYPEWRITER TEXT", S.prefs.type, (v) => { S.prefs.type = v; save(); });
    toggle(list, "UI SOUNDS", S.prefs.sfx, (v) => { S.prefs.sfx = v; save(); if (v) SFX.cup(); });
    toggle(list, "CALM SCREEN (no grain, no dust, no video)", S.prefs.calm, (v) => {
      S.prefs.calm = v;
      document.body.classList.toggle("calm", v);
      save();
      applyTheme(S.prefs.theme);   // holds BRIGHT on its poster frame
    });
    f.appendChild(list);

    const read = FABLES.filter((x) => S.seen[x.id] && S.seen[x.id].read);
    const started = FABLES.filter((x) => S.seen[x.id] && !S.seen[x.id].read && S.seen[x.id].pos > 0.02);
    const doneMin = read.reduce((a, x) => a + x.minutes, 0);
    const s = field(body, "YOUR TAB");
    [
      ["FABLES FINISHED", read.length + " / " + FABLES.length],
      ["STILL OPEN", String(started.length)],
      ["TIME AT THE TABLE", Math.floor(doneMin / 60) + "h " + (doneMin % 60) + "m"],
      ["WORDS TAKEN", read.reduce((a, x) => a + x.words, 0).toLocaleString()],
      ["VISITS", String(S.visits)],
    ].forEach(([k, v]) => {
      const row = el("div", "stat");
      row.appendChild(el("span", null, k));
      row.appendChild(el("b", null, v));
      s.appendChild(row);
    });

    const wipe = el("button", "btn sm ghost", "WIPE THE SLATE");
    wipe.type = "button";
    wipe.addEventListener("click", () => {
      if (wipe.dataset.armed) {
        localStorage.removeItem(KEY);
        location.reload();
        return;
      }
      wipe.dataset.armed = "1";
      wipe.textContent = "ARE YOU SURE? — EVERYTHING GOES";
      wipe.classList.remove("ghost");
    });
    body.appendChild(wipe);
    body.appendChild(el("p", "field-note",
      "Everything above lives in this browser only. No account, no server, " +
      "no one keeping a file on you. Black Swan keeps a file on you, but that's different."));
  }));

  function applyPrefs() {
    applyTheme(S.prefs.theme);
    const r = document.documentElement.style;
    r.setProperty("--read-font", S.prefs.font === "sans" ? "var(--sans)" : "var(--serif)");
    r.setProperty("--read-size", S.prefs.size + "px");
    r.setProperty("--read-lead", String(S.prefs.lead));
    r.setProperty("--read-measure", S.prefs.measure + "em");
    document.body.classList.toggle("calm", !!S.prefs.calm);
    $("btn-vn").classList.toggle("on", !!S.prefs.vn);
  }

  /* =======================================================================
     KEYS
     ======================================================================= */
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea")) return;
    if (!drawer.hidden && e.key === "Escape") { closeDrawer(); return; }
    if (!vn.hidden) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); vnAdvance(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); vnAdvance(-1); }
      if (e.key === "Escape") { e.preventDefault(); leaveVN(); }
      return;
    }
    if (e.key === "Escape" && !viewRead.hidden) { showMenu(); return; }
    if (e.key === "/" ) { e.preventDefault(); $("search").focus(); return; }
    if (e.key === "t" && !viewRead.hidden) { $("btn-vn").click(); }
  });

  $("search").addEventListener("input", (e) => {
    query = e.target.value.trim();
    paintMenu();
  });

  /* =======================================================================
     DUST — motes going up in the lamplight
     ======================================================================= */
  const cv = $("dust"), cx = cv.getContext("2d");
  let motes = [];
  function sizeDust() {
    const W = innerWidth || 1200, H = innerHeight || 800;
    cv.width = W; cv.height = H;
    const n = clamp(Math.round((W * H) / 34000), 26, 110);
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      s: 1 + Math.floor(Math.random() * 2),
      v: 0.12 + Math.random() * 0.4,
      d: Math.random() * Math.PI * 2,
      a: 0.16 + Math.random() * 0.34,
    }));
  }
  sizeDust();
  addEventListener("resize", sizeDust);

  let t0 = 0;
  function frame(t) {
    const dt = Math.min(50, t - t0) || 16;
    t0 = t;
    if (S.prefs.calm || reduced) { cx.clearRect(0, 0, cv.width, cv.height); return; }
    cx.clearRect(0, 0, cv.width, cv.height);
    // the motes take the room's light — read once a second, not once a mote
    if (t - dustAt > 1000) {
      dustAt = t;
      dustRGB = getComputedStyle(document.documentElement)
        .getPropertyValue("--dust").trim() || "255,214,150";
    }
    for (const m of motes) {
      m.y -= m.v * (dt / 16);
      m.d += 0.012;
      m.x += Math.sin(m.d) * 0.22;
      if (m.y < -3) { m.y = cv.height + 3; m.x = Math.random() * cv.width; }
      cx.fillStyle = "rgba(" + dustRGB + "," + m.a + ")";
      cx.fillRect(m.x | 0, m.y | 0, m.s, m.s);
    }
  }
  let dustRGB = "255,214,150";
  let dustAt = -9999;
  let rafSeen = false;
  (function loop(t) { rafSeen = true; frame(t); requestAnimationFrame(loop); })(0);
  /* Some embedded webviews never composite and so never fire rAF. Keep the
     room alive there without burning cycles on a genuinely hidden tab. */
  setTimeout(() => {
    if (rafSeen) return;
    setInterval(() => frame(performance.now()), 60);
  }, 1000);

  /* =======================================================================
     OPENING UP
     ======================================================================= */
  function greet() {
    host = chooseHost();
    paintCounter();
    queue = []; stop();
    const st = FABLES.map((f) => S.seen[f.id] && !S.seen[f.id].read && S.seen[f.id].pos > 0.03
      ? { f, s: S.seen[f.id] } : null).filter(Boolean)
      .sort((a, b) => (b.s.at || 0) - (a.s.at || 0))[0];

    say(fresh(host.greet) || "…");
    if (st) {
      const line = fresh(host.resume);
      if (line) say(line + "  — " + st.f.title + ", " + Math.round(st.s.pos * 100) + "% in.");
    }
  }

  function tickBoard() {
    $("board").textContent = pick(BOARD);
  }

  function start() {
    $("cafe").hidden = false;
    S.visits = (S.visits || 0) + 1;
    S.last = Date.now();
    save();
    AMB.start();
    SFX.warm();
    greet();
    paintSorts();
    paintMenu();
    tickBoard();
    setInterval(tickBoard, 14000);

    const id = location.hash.replace(/^#/, "");
    if (id && FABLES.some((f) => f.id === id)) open(id);
  }

  $("door-count").textContent =
    FABLES.length + " fables · " +
    FABLES.reduce((a, f) => a + f.words, 0).toLocaleString() + " words";

  $("btn-enter").addEventListener("click", () => {
    SFX.warm(); SFX.door();
    const door = $("door");
    door.classList.add("gone");
    setTimeout(() => { door.style.display = "none"; }, 520);
    start();
  });

  applyPrefs();

  /* The door is ceremony, and the ceremony is the point — you get greeted every
     time you open the app. A deep link is the one exception: #<fable-id> goes
     straight to that story, #menu straight to the room. */
  const deep = location.hash.replace(/^#/, "");
  if (deep && (deep === "menu" || FABLES.some((f) => f.id === deep))) {
    $("door").style.display = "none";
    start();
  }

  /* =======================================================================
     PWA
     ======================================================================= */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then((reg) => {
        // Once the room is quiet, have the worker walk the shelf and take a
        // copy of every fable, so the library survives a tunnel.
        setTimeout(() => {
          const sw = reg.active || navigator.serviceWorker.controller;
          if (!sw) return;
          sw.postMessage({ type: "stock-up", files: FABLES.map((f) => f.file) });
        }, 6000);
      }).catch(() => {});
    });
  }
})();
