/* ─────────────────────────────────────────────────────────────────────────────
   Page behaviour: reveal, copy, and the rig's pointer parallax.

   THREE JOBS, NO FRAMEWORK. Everything here degrades to a working page if it
   never runs: the reveal's no-script state IS the visible state, the copy
   buttons are real <button>s with real text, and the parallax is additive
   motion on a figure that is already standing.

   THE COPY FALLBACK IS NOT OPTIONAL
   navigator.clipboard only exists in a secure context. A secure context is
   https, localhost, or a file:// URL in some browsers — and this site is going
   to be opened straight off the disk while it is being worked on. The async API
   is tried first and the textarea + execCommand path is the fallback, so the
   copy button works in all three places rather than silently doing nothing on
   the one a developer is most likely to be standing in.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1 · reveal ──────────────────────────────────────────────────────── */
  // One observer for the whole page. threshold 0.12 rather than 0 so a section
  // does not finish its reveal while it is still below the fold, and
  // unobserve after the first hit so a scrolled-back-over section does not
  // replay its entrance.
  var revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (!("IntersectionObserver" in window) || reduced) {
      for (var i = 0; i < revealables.length; i++) revealables[i].classList.add("is-in");
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          for (var n = 0; n < entries.length; n++) {
            if (entries[n].isIntersecting) {
              entries[n].target.classList.add("is-in");
              io.unobserve(entries[n].target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      for (var j = 0; j < revealables.length; j++) io.observe(revealables[j]);
    }
  }

  /* ── 2 · copy ────────────────────────────────────────────────────────── */
  function flash(btn, label) {
    var state = btn.querySelector("[data-copy-state]") || btn;
    var original = state === btn ? "Copy" : state.textContent;
    state.textContent = label;
    btn.classList.add("is-copied");
    window.clearTimeout(btn._t);
    btn._t = window.setTimeout(function () {
      state.textContent = original;
      btn.classList.remove("is-copied");
    }, 1600);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.append(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  var copyables = document.querySelectorAll("[data-copy]");
  for (var c = 0; c < copyables.length; c++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () {
              flash(btn, "Copied");
            },
            function () {
              flash(btn, legacyCopy(text) ? "Copied" : "Press ⌘C");
            }
          );
        } else {
          flash(btn, legacyCopy(text) ? "Copied" : "Press ⌘C");
        }
      });
    })(copyables[c]);
  }

  /* ── 3 · rig parallax + write response ───────────────────────────────── */
  // Damped, small, and additive. The rig is already breathing on its own 7.5s
  // cycle; this layer is ±9deg on top and is written to --tilt-x/--tilt-y, so
  // the two never fight over the same property and a pointer arriving
  // mid-breath blends instead of snapping.
  //
  // TOUCH IS IN, BUT ONLY WHILE A FINGER IS DOWN ON THE FIGURE.
  // The obvious mobile version — track every touchmove across the page — makes
  // the robot swing about while the visitor is trying to scroll past it, which
  // reads as a broken page and burns battery. So on a coarse pointer the
  // rig responds only to a deliberate press on the stage, and the listener is
  // passive, so the page still scrolls normally under the gesture. Dragging the
  // figure tilts it; swiping the page does not.
  var rig = document.querySelector("[data-rig]");
  if (rig && !reduced) {
    var stage = rig.closest(".stage");
    var fine = window.matchMedia("(pointer: fine)").matches;
    var touching = false;
    var tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      rafId = 0;

    function onMove(e) {
      if (!fine && !touching) return;
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(step);
    }

    function step() {
      // 0.07 per frame is roughly a 240ms settle at 60fps: enough lag that the
      // figure feels like it has mass, not enough that it feels like it is
      // lagging behind the cursor.
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      rig.style.setProperty("--tilt-y", (cx * 9).toFixed(3) + "deg");
      rig.style.setProperty("--tilt-x", (-cy * 6).toFixed(3) + "deg");

      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = 0;
      }
    }

    function release() {
      tx = 0;
      ty = 0;
      if (!rafId) rafId = requestAnimationFrame(step);
    }

    // pointermove on window rather than on the stage: the figure should keep
    // tracking briefly as the pointer leaves it, which is what makes the
    // release read as the figure settling rather than as the effect cutting.
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", release, { passive: true });
    window.addEventListener("blur", release);

    /* ── the write ────────────────────────────────────────────────────── */
    // Pressing the figure fires a packet burst into the chest core and pops the
    // port. It is a memory WRITE, which is why it is the feedback and not a
    // click sound or a confetti pop — the thing the figure represents is the
    // thing it responds to.
    //
    // The class is removed on a timer rather than on animationend, so a second
    // tap inside the 520ms restarts the keyframes instead of being swallowed by
    // an animation that is already running.
    var hitTimer = 0;
    stage.addEventListener(
      "pointerdown",
      function () {
        touching = true;
        rig.classList.add("is-hit");
        window.clearTimeout(hitTimer);
        hitTimer = window.setTimeout(function () {
          rig.classList.remove("is-hit");
        }, 560);
        window.dispatchEvent(new CustomEvent("prometheus:burst"));
      },
      { passive: true }
    );
    window.addEventListener("pointerup", function () {
      touching = false;
    });
  }
})();
