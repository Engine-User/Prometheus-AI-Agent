"""prometheus — a minimal, transparent, local-first Prometheus.

Four pillars, one module each:
  harness  → prometheus/runtime + prometheus/gateway  (scaffolding around the raw LLM)
  loop     → prometheus/loop                      (observe → reason → act → repeat)
             prometheus/graph                     (opt-in structure around the loop — extends this pillar)
  memory   → prometheus/memory                    (procedural / semantic / episodic)
  ops      → prometheus/ops + evals/              (trace → eval → gate → release)
"""

import sys

if sys.platform == "win32":  # pragma: no cover - platform guard
    # __main__ does this for the console entry point, but `python -m
    # prometheus.ops.dashboard` (what the tenant image runs) never reaches it,
    # and that path dies on its startup banner -- before it serves anything.
    # errors="replace" only: the console keeps the encoding it was given.
    for _stream in (sys.stdout, sys.stderr):
        _reconfigure = getattr(_stream, "reconfigure", None)
        if _reconfigure is not None:
            _reconfigure(errors="replace")

__version__ = "0.1.8"
