/* ─────────────────────────────────────────────────────────────────────────────
   MEMORY PACKETS — canvas traffic converging on the chest core.

   WHAT THIS DEPICTS
   Two lanes, and they are the two things the project's Memory pillar actually
   does. Recall packets rise from below and land in the core (retrieval: the gate
   deciding whether to remember). Emit packets leave the core and fan upward
   (response: consolidation deciding what to keep). Every packet that arrives
   flashes the core and pushes it to its hot state.

   It is the "live data flow on a meaningful path" motif taken from the hero
   brief, and the path is meaningful because it is the retrieval loop, not a
   decorative orbit. A ring of lights going round would be the same pixels and
   would say nothing.

   HOW IT IS DRAWN, AND WHY IT IS FAST
   One radial-gradient sprite is rendered ONCE into a 32x32 offscreen canvas at
   startup. Every packet after that is a drawImage of that sprite, scaled by its
   depth and faded by globalAlpha, composited with 'lighter'. The obvious
   implementation — a fresh createRadialGradient per packet per frame — allocates
   30 gradients every frame at 60fps and garbage-collects them; that is the
   single most common way a canvas scene drops frames on a laptop, and the
   sprite costs 32x32 pixels and about four milliseconds once.

   BUDGET
   DPR is capped at 2. The loop stops when the tab is hidden and when the
   canvas leaves the viewport. Packets are pooled — a fixed array with a free
   list, never reallocated. Nothing here allocates inside the frame.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  var canvas = document.querySelector("[data-packets]");
  if (!canvas) return;

  // CSS already removes the canvas under reduced motion; bail here too so an
  // offscreen-but-present canvas never keeps a rAF alive for nobody.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  var DPR_CAP = 2;
  var MAX_PACKETS = 34;
  var CORE = { x: 0, y: 0 };
  var stage = { w: 0, h: 0 };
  var flash = 0;
  var running = false;
  var rafId = 0;
  var last = 0;
  var hot = false;

  /* ── the sprite ──────────────────────────────────────────────────────── */
  var sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  (function paintSprite() {
    var s = sprite.getContext("2d");
    var g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(180, 250, 255, 1)");
    g.addColorStop(0.18, "rgba(34, 211, 238, 0.92)");
    g.addColorStop(0.48, "rgba(34, 211, 238, 0.28)");
    g.addColorStop(1, "rgba(34, 211, 238, 0)");
    s.fillStyle = g;
    s.fillRect(0, 0, 32, 32);
  })();

  /* ── packet pool ─────────────────────────────────────────────────────── */
  // depth: -1 far (small, dim) … 1 near (large, bright). It is the only thing
  // that fakes perspective on a flat 2D layer, and it is enough, because a
  // packet is a glow and a glow reads as depth from its size and its falloff.
  var pool = [];
  var free = [];
  for (var i = 0; i < MAX_PACKETS; i++) {
    pool.push({ live: false, lane: 0, t: 0, speed: 0.4, depth: 0, sway: 0, seed: 0 });
    free.push(i);
  }

  function take() {
    return free.length ? free.pop() : -1;
  }

  function give(idx) {
    if (pool[idx].live) {
      pool[idx].live = false;
      free.push(idx);
    }
  }

  function spawn(lane) {
    var idx = take();
    if (idx < 0) return -1;
    var p = pool[idx];
    p.live = true;
    p.lane = lane;
    p.t = 0;
    p.depth = Math.random() * 1.8 - 0.9;
    p.sway = (Math.random() * 2 - 1) * 0.55;
    p.seed = Math.random() * 100;
    // Near packets move faster, which is what parallax does and what makes the
    // two depths read as two distances instead of two sizes.
    p.speed = 0.26 + Math.random() * 0.2 + p.depth * 0.08;
    return idx;
  }

  /* ── layout ──────────────────────────────────────────────────────────── */
  function measure() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;

    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    stage.w = r.width;
    stage.h = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The core position is READ from the DOM rather than hard-coded, because
    // the figure's geometry is authored in CSS and will move whenever someone
    // adjusts a --y on .p-core. A hard-coded copy of that number is a second
    // source of truth that nobody edits with the first.
    var coreEl = document.querySelector(".p-core");
    if (coreEl) {
      var cr = coreEl.getBoundingClientRect();
      CORE.x = cr.left - r.left + cr.width / 2;
      CORE.y = cr.top - r.top + cr.height / 2;
    } else {
      CORE.x = stage.w / 2;
      CORE.y = stage.h * 0.57;
    }
    return true;
  }

  /* ── paths ───────────────────────────────────────────────────────────── */
  // Quadratic bezier, evaluated on the three scalars the frame needs. Written
  // out rather than using ctx.quadraticCurveTo because these are single points,
  // not strokes, and a stroke path per packet would mean a path build per
  // packet per frame.
  function qx(p0, p1, p2, t) {
    var u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
  }

  function qy(p0, p1, p2, t) {
    var u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
  }

  function packetXY(p, out) {
    var t = p.t;
    var sway = p.sway;

    if (p.lane === 0) {
      // RECALL — rises from below the figure into the core. The control point
      // is offset sideways, so packets arrive on an arc rather than a straight
      // line and the lane reads as a current.
      var x0 = CORE.x + sway * stage.w * 0.42;
      var y0 = stage.h * 1.04;
      var x1 = CORE.x + sway * stage.w * 0.5;
      var y1 = stage.h * 0.9;
      out.x = qx(x0, x1, CORE.x, t);
      out.y = qy(y0, y1, CORE.y, t);
    } else {
      // EMIT — leaves the core and fans up and outward, decelerating as it
      // goes so it looks like it is being released rather than fired.
      var e = 1 - Math.pow(1 - t, 2);
      var ex0 = CORE.x + p.seed * 0.6 - 30;
      var ey0 = CORE.y - 6;
      var ex1 = CORE.x + sway * stage.w * 0.85;
      var ey1 = CORE.y - stage.h * 0.42;
      out.x = qx(ex0, ex1, ex0 + sway * stage.w * 1.15, e);
      out.y = qy(ey0, ey1, ey0 - stage.h * 0.55, e);
    }
    return out;
  }

  /* ── draw ────────────────────────────────────────────────────────────── */
  var pt = { x: 0, y: 0 };

  function draw(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;

    ctx.clearRect(0, 0, stage.w, stage.h);
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (!p.live) continue;

      p.t += p.speed * dt;
      if (p.t >= 1) {
        if (p.lane === 0) flash = 1;
        give(i);
        continue;
      }

      packetXY(p, pt);

      // Fade in at the start and out at the end so a packet never pops. Emit
      // packets also fade as they rise, which is what sells "released".
      var fade = Math.min(p.t * 6, 1) * Math.min((1 - p.t) * 3.2, 1);
      if (p.lane === 1) fade *= 1 - p.t * 0.55;

      // Two factors, both per-packet and both computed HERE. A hoisted
      // `scaleBase = 0.14 + Math.abs(p.depth) * 0.1` sat above this loop and
      // read p.depth before the loop had assigned it; `var` hoists, so p was
      // undefined and the whole draw() threw on its first line, every frame,
      // for the entire life of the page. The canvas stayed empty and the only
      // symptom was one console error. A per-frame value that depends on the
      // loop variable has to live inside the loop.
      //
      // 0.28/0.16 rather than 0.14/0.10: at the old scale the largest packet
      // came out 17px and the smallest 3px, which on a 500px stage read as
      // dust on the lens rather than as traffic. These give a 6-32px range.
      var d = 0.5 + p.depth * 0.32;
      var size = 96 * (0.28 + Math.abs(p.depth) * 0.16) * d;
      ctx.globalAlpha = Math.max(0, fade * (0.55 + p.depth * 0.35));
      ctx.drawImage(sprite, pt.x - size / 2, pt.y - size / 2, size, size);
    }

    // The core flash. Drawn as the sprite again, so it is the same light with
    // more of it — a separate gradient here would be the per-frame allocation
    // this file exists to avoid.
    //
    // 170px at 0.34, not 260 at 0.5: the bigger, brighter spill was wide and
    // soft enough to sit over the chest plate as fog and to bury the core's own
    // iris and gate ring, which are the two pieces of detail that make the port
    // read as an instrument. The flash should light the port, not erase it.
    if (flash > 0.01) {
      var fs = 170 * flash;
      ctx.globalAlpha = flash * 0.34;
      ctx.drawImage(sprite, CORE.x - fs / 2, CORE.y - fs / 2, fs, fs);
      flash *= Math.pow(0.02, dt);
    } else {
      flash = 0;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Emission rate, tied to time rather than to frames. Two recall lanes and
    // one emit lane keep the core visibly busier than the space above it, which
    // is the correct balance: this is a system storing things, not spraying
    // them. `hot` more than doubles the recall rate while the pointer is over
    // the stage, so the figure visibly works harder when someone is looking at
    // it and settles back when they leave.
    var rate = hot ? 11.5 : 5.2;
    if (Math.random() < dt * rate) spawn(0);
    if (Math.random() < dt * (hot ? 3.4 : 2.4)) spawn(1);

    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function boot() {
    if (!measure()) return;
    // Pre-fill the recall lane so the figure is already mid-thought on the
    // first painted frame. A cold start with an empty stage looks like a bug,
    // and the first viewport is the one nobody gets a second look at.
    // spawn() returns the index it took, so each packet is back-dated through
    // its own handle rather than through arithmetic on pool position.
    var k, idx;
    for (k = 0; k < 12; k++) {
      idx = spawn(0);
      if (idx >= 0) pool[idx].t = (k / 12) * 0.92;
    }
    for (k = 0; k < 4; k++) {
      idx = spawn(1);
      if (idx >= 0) pool[idx].t = (k / 4) * 0.7;
    }
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () {
      measure();
    });
    ro.observe(canvas);
  } else {
    window.addEventListener("resize", measure);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }

  // The figure ignites once traffic is actually reaching the core. It is a
  // class because the CSS owns every intensity of that glow, and a script that
  // set inline box-shadow values would be a second set of numbers.
  var rig = document.querySelector("[data-rig]");
  if (rig) {
    setTimeout(function () {
      rig.classList.add("is-live");
    }, 900);
  }

  /* ── reactivity ─────────────────────────────────────────────────────── */

  // Working harder while a visitor is watching. Hover is on the STAGE, not the
  // canvas, so aiming at the figure lights it up — and touch gets it for free,
  // because a tap on a phone also fires pointerenter on the element it lands on.
  var stageEl = canvas.closest(".stage");
  if (stageEl) {
    stageEl.addEventListener("pointerenter", function () {
      hot = true;
    });
    stageEl.addEventListener("pointerleave", function () {
      hot = false;
    });
    stageEl.addEventListener("pointerdown", function () {
      hot = true;
    });
    window.addEventListener("pointerup", function () {
      if (stageEl && !stageEl.matches(":hover")) hot = false;
    });
  }

  // A write landing. site.js dispatches this on pointerdown anywhere on the
  // stage; the burst is RECALL traffic on the emit side, so the port flashes
  // hard and the packets visibly leave it — the figure writes, then answers.
  // Twelve is the most the pool can give without dropping live packets, and it
  // is a pool so the burst costs no allocation.
  window.addEventListener("prometheus:burst", function () {
    for (var n = 0; n < 12; n++) spawn(1);
    flash = 1;
  });
})();
