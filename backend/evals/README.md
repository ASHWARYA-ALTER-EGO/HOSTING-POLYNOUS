# Polynous public benchmarks

A held-out golden set of research prompts, run against Polynous and its
peers (Perplexity, ChatGPT, NotebookLM), with blind human ratings.

## Files

- `golden_set.json` &mdash; the prompts, categories and metric definitions
- `run_eval.py` &mdash; automated runner for Polynous answers
- `results.json` &mdash; per-prompt answers + ratings (produced by the runner)

## Methodology

1. Same prompt sent to each tool. No cherry-picking, no retries.
2. `run_eval.py` records the Polynous answer + automated citation ratio.
3. A human enters Perplexity, ChatGPT, NotebookLM answers manually into
   `results.json` under the same prompt id.
4. Three raters score every answer on Correctness, Coverage, Usefulness.
   Ratings are entered blind (tool identity stripped) and the median is
   recorded per (prompt, tool, metric).
5. The `/benchmarks` page reads `results.json` and renders the scoreboard.

## What we deliberately do NOT do

- Rerun failed prompts. If a tool loses, we publish the loss.
- Weight results by category. Overall score is a straight average.
- Hide the prompts. The full set is committed here.
