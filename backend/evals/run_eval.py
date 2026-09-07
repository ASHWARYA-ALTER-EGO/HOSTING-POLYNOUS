#!/usr/bin/env python
"""
run_eval.py - the golden-set eval runner.

Reads backend/evals/golden_set.json and runs each prompt through Polynous, then
records results to backend/evals/results.json in the shape the /benchmarks page
consumes.

USAGE
    python -m backend.evals.run_eval [--limit N] [--tool polynous]

For now this only exercises Polynous through the local /research endpoint.
Perplexity / ChatGPT / NotebookLM results are entered manually (one row per
prompt) by a human rater who runs the same prompt in each tool's UI. This
matches the human-blind-rating methodology on the /benchmarks page.

The runner also computes the automated citation ratio for Polynous answers so
that number never needs a human.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
EVAL_DIR = Path(__file__).resolve().parent
GOLDEN = EVAL_DIR / "golden_set.json"
RESULTS = EVAL_DIR / "results.json"


def _load_golden() -> dict:
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


def _citation_ratio(answer: str) -> float:
    """Fraction of answer sentences that carry at least one [n] citation."""
    sents = re.split(r"(?<=[.!?])\s+", (answer or "").strip())
    sents = [s for s in sents if s.strip()]
    if not sents:
        return 0.0
    cited = sum(1 for s in sents if re.search(r"\[\d+\]", s))
    return round(cited / len(sents), 3)


def _call_polynous_local(prompt: str, timeout: int = 120) -> dict:
    """Best-effort call to a running local Polynous backend.

    We do NOT hardcode a specific endpoint here because the streaming interface
    is opinionated; instead a small adapter can be dropped in when you're ready
    to automate the runs. Returns {"answer": str, "sources": []}.
    """
    try:
        import urllib.request as _u
        req = _u.Request(
            "http://127.0.0.1:8000/research/quick",
            data=json.dumps({"query": prompt}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with _u.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8"))
        return {
            "answer": data.get("answer") or "",
            "sources": data.get("sources") or [],
            "confidence": data.get("confidence"),
        }
    except Exception as e:
        return {"error": str(e)}


def main() -> int:
    parser = argparse.ArgumentParser(description="Polynous golden-set eval runner")
    parser.add_argument("--limit", type=int, default=0, help="max prompts to run (0 = all)")
    parser.add_argument("--tool", type=str, default="polynous",
                        choices=["polynous"],
                        help="tool to run automatically (others are entered manually)")
    parser.add_argument("--dry-run", action="store_true",
                        help="print what would be sent without hitting the backend")
    args = parser.parse_args()

    golden = _load_golden()
    prompts = golden.get("prompts") or []
    if args.limit > 0:
        prompts = prompts[: args.limit]

    existing = {}
    if RESULTS.exists():
        try:
            existing = json.loads(RESULTS.read_text(encoding="utf-8"))
        except Exception:
            existing = {}
    existing.setdefault("runs", {})

    print(f"[eval] running {len(prompts)} prompts through {args.tool}...")
    for p in prompts:
        pid = p["id"]
        print(f"  · {pid}: {p['prompt'][:70]}...")
        if args.dry_run:
            continue
        t0 = time.time()
        result = _call_polynous_local(p["prompt"])
        dt = round(time.time() - t0, 2)
        entry = existing["runs"].setdefault(pid, {})
        entry[args.tool] = {
            "answer": result.get("answer", ""),
            "sources_n": len(result.get("sources", []) or []),
            "citations": _citation_ratio(result.get("answer", "")),
            "latency_s": dt,
            "error": result.get("error"),
        }
        # Persist after every prompt so a crash never loses work.
        RESULTS.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[eval] wrote {RESULTS.relative_to(ROOT)}")
    print("[eval] next step: rate each answer BLIND for correctness, coverage, "
          "usefulness (three raters). Enter medians into results.json under runs.<id>.ratings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
