# Polynous Roadmap · 07 Sep 2026

A single source of truth for what has shipped in the last several sessions,
what is queued next, and what is deliberately deferred. Reads top-down: recent
work first, then the honest next-step queue.

---

## Part 0 — Debate Chamber credibility story (the differentiator)

This is the section to quote on Product Hunt / HN / LinkedIn.

**One sentence**: Polynous is the only research tool where the debate judge
runs on a genuinely different model from the advocates on the same API key,
sees blind A/B labels instead of side names, scores objective point-level
outcomes, and lets you rejudge with any provider — and where users can watch
each turn land in real time.

### 0.1 Phase 1 &mdash; Judge separation (commit `c29eb402`)

**Same API key, meaningfully different model**
- `llm_providers.py` ships `STRONG_MODELS` + `WEAK_MODELS` per provider:
  - OpenAI: `gpt-4o` advocates, `gpt-4o-mini` judge
  - Anthropic: `claude-opus-4` advocates, `claude-haiku-4.5` judge
  - Google: `gemini-2.5-pro` advocates, `gemini-2.5-flash` judge
  - Groq: `llama-70b` advocates, `llama-8b` judge
- `resolve_advocate_model()` and `resolve_judge_model()` respect the
  user's per-provider override, else fall back to STRONG/WEAK defaults.
- `judge_debate()` no longer picks a model on its own; `debate_graph.judge_node`
  resolves the WEAK tier and passes it explicitly.

**Blind A/B labelling (default on)**
- Sides are randomly relabelled "Team A" / "Team B" per debate.
- Judge only ever sees A / B. FOR / AGAINST remap happens after scoring.
- Kills the "judge biased by side name" critique.

**Verdict transparency**
- Every verdict payload carries `judge_model`, `judge_provider`,
  `advocate_model`, `blind_ab` so the report can prove the story.

**Debate report shows it**
- Masthead chip: `ADVOCATES gpt-4o → JUDGE gpt-4o-mini` (hover for full ids).
- **BLIND A/B** chip next to it.
- Methodology & provenance section lists both models with `DIFFERENT` tag.
- CREDIBILITY panel explains what the separation means.

**Settings → Debate model separation** (new side-rail item)
- `GET /settings/model-tiers` returns STRONG/WEAK defaults per provider
  plus any user override.
- 8-provider table lets users set per-provider advocate + judge model.
- Blank field falls back to sensible default.

**Rejudge with any provider**
- `POST /debate/rejudge` (built earlier, commit `27df6f8b`) takes the two
  cases + a chosen `judge_provider` and runs a completely different model
  as judge. Frontend Rejudge button surfaces agreement panel:
  **STRONG AGREEMENT · SAME WINNER DIFFERENT MARGIN · VERDICT FLIPPED**.

**Public credibility page**
- `/benchmarks` gains **Judge independence** card grid (A / B / C):
  different-model-same-key, blind A/B, rejudge-with-any-provider.

### 0.2 Phase 2 &mdash; Agentic debate state machine (commit `4bb95c19`)

**Real turn-taking, point-by-point clash (opt-in)**
- New `app/agents/agentic_debate.py`: small Python state machine, not
  LangGraph. Four turn types (assert, rebut, defend, concede), one point
  per iteration, per-point exchange thread. Each LLM call reads only the
  point it is acting on so cost scales with points, not the transcript.

**Hard guardrails**
- `MAX_ROUNDS = 3`, `MAX_TURNS = 20`, `MAX_EXCHANGE_PER_POINT = 4`.
- Any schema-invalid turn gets one corrective retry then the point closes
  as UNRESOLVED. No infinite loops possible.

**Scheduler priority**
- `next_action(state)` picks: defend a rebutted point first, rebut an open
  point next, otherwise open a new point until the round budget is spent.

**Point-ledger judge**
- Scores OUTCOMES from the resolved ledger, not vibes.
- Runs on the WEAK tier model of the same provider (or user override).
- Final blend: **60% ledger outcomes + 40% LLM quality (blind A/B)**.
- +1 to author when DEFENDED, +1 to challenger when CONCEDED, 0 for
  UNRESOLVED. Every score references a specific point id.
- Mechanical fallback verdict when the judge LLM itself fails so a broken
  judge never fabricates a tie.

**Blind A/B propagated from run-start**
- Randomised label mapping applied at debate start, not just at judge time.
- Every prompt the agents see uses A/B; FE remap only after scoring.

**New endpoint `POST /debate/agentic`**
- Body: `{topic, max_rounds?, max_turns?, provider?, model?}`. BYO-key only.
- Uses `resolve_advocate_model` (STRONG) + `resolve_judge_model` (WEAK).
- Fetches web docs through existing `search_web` pipeline.
- Returns FE report shape plus `points`, `history`, `clash_ledger`, `labels`,
  `mode: "agentic"`.

**FE agentic toggle**
- Premium toggle chip on the debate topic bar. Persists per-browser in
  localStorage. Off by default (sequential is still the free-tier path).

**FE Replay scrubber retrofitted**
- `DebateActions.ReplayModal` auto-detects `ctx.points` and renders a
  two-column point-ledger view. Sequential runs keep the momentum scrubber.

### 0.3 Phase 3 &mdash; Agentic streaming + PIVOT (commit `eb9d1b33`)

**Truly agentic: agents choose their move**
- **New PIVOT branch** in the defend agent. Instead of only DEFEND vs CONCEDE,
  the author now sees the full exchange thread and can:
  - DEFEND (strengthen or narrow the claim)
  - CONCEDE (rebuttal is decisive)
  - **PIVOT** (drop this point, open a new claim in the same turn)
- PIVOT marks the abandoned point CONCEDED (challenger wins it) and appends
  a brand-new point in the same step with `pivoted_from` metadata.
- **Rebutter picks the strongest still-live thread**, not a fixed rotation.
  Scheduler picks who acts; agent picks how.

**SSE streaming**
- **New endpoint `GET /debate/agentic/stream`** (EventSource-friendly:
  accepts JWT via `token=` query param).
- State machine now runs as a Python generator (`stream_agentic_debate`)
  yielding `(start|docs|turn|point|ledger|phase|verdict|error, payload)`.
- `run_agentic_debate` is now a thin wrapper that consumes the generator.

**FE `AgenticDebateLive`**
- New component connects to the SSE stream and renders a two-column
  point-ledger view IN REAL TIME as turns land:
  - Phase-coloured pulse dot (running / judging / done / failed)
  - Live model separation display: advocate + judge + blind A/B tag
  - Live ledger tally that updates as points resolve
  - Rail pulses on the actively-argued point, colours green/red/amber
  - Right panel animates each new turn in with phase glyph (◆ ⚔ 🛡 🏳),
    attack-mode chip, narrowed-claim callout, citation strip
  - **PIVOT badge** on turns that opened a new point mid-debate
  - Verdict footer appears when the final SSE frame lands

**Both engines stay mounted**
- Sequential mode keeps the streaming `NeuralResearchEngine`.
- Agentic mode uses `AgenticDebateLive` during the run, then hands off to
  `PolynousDebateReport` for the full ledger view via the Replay modal.
- Toggle chip is the only user-facing switch.

### 0.4 Honest capability matrix (what "agentic" actually means here)

| Property | Sequential | Agentic |
|---|---|---|
| Turn order fixed in advance | Yes | No — scheduler routes on point state |
| Agent picks its own move | No | Yes — DEFEND / CONCEDE / PIVOT |
| Back-and-forth on same point | No | Yes — up to 4 exchanges, capped |
| Can drop losing point mid-debate | No | Yes — PIVOT concedes and opens new |
| Agent chooses attack mode | No | Yes — evidence / source / logic / scope |
| Agent chooses target point | No | Rebutter picks strongest live thread |
| Judge scores outcomes not vibes | No | Yes — clash ledger + LLM quality (60/40) |
| Blind A/B labels throughout | No | Yes |
| Per-turn context vs full transcript | Full | Per-turn thread only |

Genuinely turn-adaptive, decision-driven, can loop back through the same
point. Meets the practical definition of "agentic" for a debate. Not
autonomous-agent-with-tools; agents don't invoke web search mid-turn (that
would be Phase 4).

### 0.5 Cost math (real, not hand-waved)

Assume OpenAI `gpt-4o` for advocates, `gpt-4o-mini` for judge.

| Path | LLM calls | Avg output tokens | Model | Notes |
|---|---|---|---|---|
| Sequential | 5 | ~600 | gpt-4o | Full-essay each turn |
| Agentic | 12-16 | ~250 | gpt-4o | Per-point turns |
| Agentic judge | 1 | ~800 | gpt-4o-mini | Point-ledger only |

**Actual cost delta: ~1.8× sequential**, not 3×, because:
- Each agentic turn is much smaller (200-250 tok)
- Judge runs on the cheap model (10-20× cheaper)
- Context is per-point, not full-transcript

Sequential stays default for the free tier; agentic is opt-in for BYO-key
users who want the credibility of the ledger view.

---

## Part 1 — What has shipped (last ~10 sessions)

Every item below is in `main` and can be verified against `CHANGELOG.md` +
`git log`. Grouped by system.

### 1.1 Research chamber

**ReportShell (TL;DR-first premium wrapper)** &mdash; commit `18349de7`
- New `ReportShell.jsx` wraps the 1634-line `PolynousReport` with a real-JSX
  editorial answer card.
- Surfaces: query, 2-3 sentence executive answer, heuristic-score chip (with
  methodology tooltip), grounded-sentence count, source count, cited-source
  strip, up to 3 key findings.
- **Progressive disclosure**: full editorial dossier is one click away
  (`See full analysis`); no longer the default surface.
- **Honest empty state** on runs that return no grounded evidence (no more
  climate-demo backfill).
- **Copy summary** button lifts answer + numbered source list to clipboard.

**Streaming pipeline strip** &mdash; commit `13e41fea`
- 4-cell live bar (Search / Summarise / Critic / Writer) inside `ReportShell`.
- Reads per-step telemetry; done cells green with token count, running cells
  pulse, pending cells muted.
- Kills the "watch a spinner" problem without any backend change.

**Honest scoring copy** &mdash; commit `18349de7`
- Every "Confidence" label rewritten as **"Heuristic score"**.
- Tooltip states the number is a rubric-derived signal, not evaluated against
  ground truth; users are told to verify claims against sources.
- `ConfidenceChart` tooltip no longer claims "% confidence" per year; reads
  "avg source trust" for that year bucket.

**Interactive report actions** &mdash; commit `27df6f8b`
- **Debate against this report**: devil's-advocate rebuttal grounded strictly
  in the report's own material. Optional user counter-argument. Returns
  counter-thesis + 3-4 numbered points + weakest link + steelman.
- **View from another perspective**: six lenses (skeptic, contrarian,
  futurist, practitioner, historian, ethicist) reframe the same evidence.
- **Chain-of-research**: one-click follow-up queries derived from findings
  and boundaries; runs a fresh research pass via `onRunQuery`.
- **Share report** pill copies `/r/:id`.
- **See in graph** pill navigates to `/graph?focus=<query>`.
- Backend: `POST /report/debate-against`, `/report/perspective`.

**Cost transparency badge** &mdash; commit `d76acb99`
- Report and debate action docks show a **This run / This debate** chip
  (dollar amount when priced, tokens otherwise).

**Dead code purge** &mdash; commit `18349de7`
- Deleted `NeuralSynthesisReport.jsx` (unused).
- Removed stale imports.
- Down from 4 renderers to 2 (`PolynousReport` + `ReportShell`).

### 1.2 Debate chamber

**Cross-examination, replay, share-card** &mdash; commit `27df6f8b`
- **Live cross-examination**: user question, both advocates answer in
  character, judge scores 0-10 with reason. Threaded rounds.
- **Replay with time-scrubber**: scrub through opening / rebuttal / verdict
  turns; clash meter shows momentum node by node.
- **Share the verdict**: canvas-generated 1200x630 verdict card with topic,
  verdict badge, score line, clash meter. Save PNG, copy summary.
- Backend: `POST /debate/cross-exam`.

**Steelman promoted to first-class result** &mdash; commit `13e41fea`
- New `sSteelmanFirst` section at eye number 02, ABOVE the rubric.
- Each side's strongest case rendered in serif editorial cards.
- Copy warns: if either steelman would move the reader more than the actual
  debate did, treat the verdict with extra caution.

**Multi-provider judge (rejudge)** &mdash; commit `13e41fea`
- `POST /debate/rejudge` takes the two advocate cases + a chosen
  `judge_provider` (anthropic / openai / google / groq / mistral / deepseek)
  and runs the judge on a completely different model.
- Frontend **Rejudge** button in the debate dock opens a picker + side-by-side
  agreement panel: **STRONG AGREEMENT · SAME WINNER DIFFERENT MARGIN ·
  VERDICT FLIPPED**.

**Per-rubric-row "why" tooltip** &mdash; commit `13e41fea`
- Every row in the Evidence rubric carries a `title` attribute stating
  exactly why it scored that way ("Grounded sentences. SUPPORTING ahead
  by 3. Higher wins &mdash; measured directly from the arguments and their
  citations.").

**DEMO topic contained to preview route** &mdash; commit `13e41fea`
- `deriveDebate` now only falls back to the Mars-colonisation demo topic
  when the caller passes no `result` at all (the `/debate-preview` route).

**Report actions and premium polish** &mdash; commit `589899f1`
- Debate report substantive UI: rubric head-to-head visual, sensitivity
  slider with animated bars + lean bar + midline flip-marker + colour-coded
  status flag, Tribunal integrity dashboard with A/B/C/D grade + Integrity
  Index (0-100) from four hard checks.

### 1.3 Knowledge graph

**Grounded node actions** &mdash; commit `158d70a6`
- **Why is this connected?** &mdash; picks top-weight neighbours, LLM explains
  the edge in one grounded sentence (strong / tentative / weak).
- **Summarize this cluster** &mdash; LLM writes headline + 3-5 sentence read
  + open question for the selected node's community.
- **Explain this path** &mdash; after Pathfinder finds a path, walks each hop
  with a 22-word rationale + one-line bridge summary.
- Backend: `POST /knowledge/why-connected`, `/summarize-cluster`,
  `/explain-path`.

**Edge quality: percentile slider** &mdash; commit `158d70a6`
- **Edges shown / top N%** slider filters visible edges by weight percentile
  (0 = show all, 90 = show top 10%). Kills hairballs without dropping
  structural signal.

**Timeline: real dates, not just insertion order** &mdash; commit `158d70a6`
- Growth reveal is date-aware. If nodes carry `created_at`, playback sorts
  by that and shows a cursor-date chip alongside the counter.

**See in graph, from any research report** &mdash; commit `158d70a6`
- Research-report dock has a **See in graph** pill. Navigates to
  `/graph?focus=<query>`; the KG page reads the param, selects the node,
  centers on it, and cleans the URL.

**TF-IDF community labels** &mdash; commit `158d70a6`
- `GET /knowledge/tfidf-labels` computes top TF-IDF terms per community
  server-side. KG page fetches on load so cluster chips read as
  "Alignment - RLHF - Reward Hacking" from first paint.

**Cookie-gated Big Bang intro** &mdash; commit `d76acb99`
- Big Bang cinematic shows only on first visit (or after 30 days). Repeat
  visitors go straight to the graph.

**Import from ChatGPT / NotebookLM / notes** &mdash; commit `d76acb99`
- `POST /import/notes` extracts capitalised topic phrases server-side (no
  LLM key needed), seeds the caller's KG with pairwise edges, saves a
  research entry so the import appears in Memory Bank.
- New `ImportNotesModal` with tab presets (ChatGPT / NotebookLM / plain
  notes), live char counter, success card listing every extracted concept.
- Prominent **Import from ChatGPT** pill top-right of the KG page.

**Read-only KG share `/g/:id`** &mdash; commit `d76acb99`
- `POST /graph/share` snapshots labels + structure only (no private
  summaries) into the existing `shared_reports` table under `kind='graph'`.
- `GET /graph/share/:id` returns the snapshot.
- New `/g/:id` frontend view renders a lightweight force-laid SVG with
  hover highlighting and a "Build your own" CTA. Nodes coloured by
  community; edges by weight.
- Prominent **Share graph** pill top-right of the KG page.

### 1.4 Growth loops

**Public gallery `/discover`** &mdash; commit `d76acb99`
- New page + `GET /discover?kind=&limit=` endpoint. Anonymised card grid of
  recent shared research and debate reports (topic, snippet, view count,
  kind). Social proof + SEO surface. No auth required.

**Referral loop** &mdash; commit `d76acb99`
- Landing captures `?ref=<public_id>` into `localStorage` (30-day expiry).
- On successful signup, client fires-and-forgets `POST /referral/register`
  which records two negative-usage rows (-10 daily-cap consumed) for the
  referrer and referee, so both get 10 bonus free-key runs.
- Idempotent per pair.

**Public benchmarks `/benchmarks`** &mdash; commit `13e41fea`
- New route with full methodology: four numbered method cards, a Polynous
  vs Perplexity vs ChatGPT vs NotebookLM scoreboard (placeholder rows +
  visible **PENDING FIRST RUN** flag), and an explicit **Honest losses**
  panel dedicated to where Polynous is expected to lose.

**Golden-set eval harness** &mdash; commit `13e41fea`
- `backend/evals/golden_set.json` &mdash; 20 held-out prompts across STEM,
  history, current events, open-ended, adversarial. Categories, metric
  definitions and tool list all inline.
- `backend/evals/run_eval.py` runner: records Polynous answer +
  automated citation ratio + latency to `results.json`. Perplexity /
  ChatGPT / NotebookLM answers entered manually to keep the blind-rating
  methodology honest.
- `backend/evals/README.md` documents what the project deliberately does
  NOT do (rerun losses, weight results, hide prompts).

### 1.5 Positioning + SEO

**Hero copy rewritten** &mdash; commit `13e41fea`
- No longer leads with "Seven specialized AI agents". Now:
  "Cited answers with faithfulness scores and rubric-judged debates.
  Every sentence traces to a fetched source; every verdict is graded
  against measurable evidence."
- Meta description rewritten to match.
- Two additional in-page copy blocks realigned.

**Person JSON-LD** &mdash; commit `d76acb99`
- Added `Person` schema for Ashwarya Pradhan alongside existing
  `SoftwareApplication` schema so search engines and LLMs correctly
  attribute Polynous back to its founder.
- `sameAs` links to LinkedIn + GitHub placeholders (update once handles
  are final).
- `<meta name="author" content="Ashwarya Pradhan" />` added.

### 1.6 Print + provenance + rail fixes

**Full-report print output** &mdash; commit `589899f1`
- Global `print.css` forces the app-shell containers open in `@media print`
  so both research and debate reports print end to end.
- Sidebar, globe, neural canvas, sensitivity slider control, hovercard,
  toolbar all hidden from print.

**Pipeline provenance rebuilt** &mdash; commit `589899f1`
- Removed the hardcoded chip row (looked like broken navigation).
- Rebuilt as a real per-telemetry-step list with step number, name,
  token count. Honest empty-state when telemetry is missing.

**Peek-to-expand side rail** &mdash; commit `589899f1`
- Collapsed by default (only edge markers + hairline).
- Slides in from the right on hover / focus, 420ms spring ease.
- "ON THIS PAGE" eyebrow and labels fade in after the slide.

---

## Part 2 — What is queued (in priority order)

Concrete, sized, and honest about tradeoffs.

### Phase 1 &mdash; SHIPPED (see Part 0.1)

Everything in the original Phase 1 plan is live. Kept here as historical
reference; the below is what actually landed.

**A. Same-provider different-model judge** &mdash; SHIPPED `c29eb402`. Size: 1 session. Cost: negligible ($0.001 per debate).

Every provider ships a small + large model on the same key:
- OpenAI: `gpt-4o` advocates, `gpt-4o-mini` judge
- Anthropic: `claude-opus-4` advocates, `claude-haiku-4.5` judge
- Google: `gemini-2.5-pro` advocates, `gemini-2.5-flash` judge
- Groq: `llama-70b` advocates, `llama-8b` judge

Implementation:
1. Add `JUDGE_MODEL_BY_PROVIDER` map in `debate_agents.py`.
2. In `judge_debate()`, if no explicit `model` passed, resolve
   `JUDGE_MODEL_BY_PROVIDER[provider]` instead of the advocate model.
3. Store the resolved judge model in the verdict payload so the report can
   surface "Judge: gpt-4o-mini" explicitly. This becomes credibility copy.

**B. Blind judging (A/B label randomisation)**
&mdash; size: half session. cost: 0.

Wherever the judge prompt currently reads "FOR / AGAINST":
1. In the graph node, before building the judge prompt, randomly relabel
   the two cases as "Team A" / "Team B" and remember the mapping.
2. Judge prompt only ever sees A / B, never FOR / AGAINST.
3. After the judge returns, remap A/B back to FOR/AGAINST for the report.

Kills 90% of the "judge grades its own homework" critique regardless of
model choice.

**C. Publish Phase-1 credibility copy on `/benchmarks`**
&mdash; size: half session.

The Benchmarks page already has methodology. Add one card explicitly
stating:
- Advocates run on the user's main model.
- Judge runs on the provider's smaller model (list them per provider).
- Judge sees A / B labels only. Advocate identity is stripped.

This is a big positioning win from a small copy edit.

### Phase 2 &mdash; SHIPPED (see Part 0.2)

Everything in the original Phase 2 plan landed in commit `4bb95c19`.

**D. Agentic debate mode (opt-in behind a toggle)** &mdash; SHIPPED. Cost held at ~1.8x sequential as predicted.

State-machine, point-by-point resolution. Default free tier stays sequential;
BYO-key runs can opt in via a `mode: "agentic"` param.

Full architecture:

```
DebateState = {
  topic, round, points, clash_ledger, history, budget
}

points[i] = {
  id, author, claim, cites, status, exchange
}

exchange[i] = {
  turn, side, phase, text, cites
}
```

Turn scheduler (a small Python state machine, not LangGraph):
```
next_action(state):
  1. Any point rebutted where the author owes a defense? -> DEFEND
  2. Any point asserted where the opponent has not yet rebutted? -> REBUT
  3. Round budget remaining? -> ASSERT (next side)
  4. Otherwise -> JUDGE
```

Four agent prompts, each with **only the relevant slice of context** (never
the full transcript, to keep cost sublinear):
- ASSERT: open a new numbered claim with citations
- REBUT: attack one specific claim by attack-mode (evidence / source /
  logic / scope)
- DEFEND: strengthen, refute the attack mode, narrow the claim, or CONCEDE
- JUDGE: score outcomes, not vibes, using the resolved point ledger

Hard guardrails:
- `MAX_ROUNDS = 3` (3 opening points per side)
- `MAX_TURNS = 20`
- Schema-validation failure on a turn -> skip, not retry
- Same point defended -> rebutted -> defended twice -> force close as
  UNRESOLVED

**E. Point-ledger judge**
&mdash; size: 1 session, ships with D.

New judge prompt scores objectively from the resolved ledger:
- Points DEFENDED: +1 to defender
- Points CONCEDED: +1 to challenger
- Points UNRESOLVED: 0 but counted as "did not close"
- Evidence quality per point: 0-2
- Steelman quality: 0-2

Final score no longer 50% rubric + 50% quality. New split:
- 40% evidence rubric (unchanged)
- 40% clash ledger outcomes (new, objective)
- 20% argument quality (unchanged, LLM judgement, but now smaller share)

**F. Replay scrubber retrofit** &mdash; SHIPPED with `4bb95c19`. Bonus, not in original plan: `eb9d1b33` added SSE streaming + `AgenticDebateLive` (live turn-by-turn view during the run) + PIVOT branch so agents can drop losing points mid-debate.

### Phase 2.5 &mdash; queued next (agentic upgrades)

**F.1 Agent invokes web search mid-turn**
&mdash; size: 2 sessions.

Right now agents receive a pre-fetched sources block. To be *fully*
agentic-with-tools, each turn should be able to run a targeted subsearch
before choosing its move. Concretely: expose a `search(query)` tool the
agent can call between DEFEND / CONCEDE / PIVOT deliberation and the
committed move. Cap at one tool call per turn, log it to `history`, cite
inline. This is what would let us honestly claim "the agents research
mid-debate", not just "the agents were handed evidence up front".

**F.2 Judge sees per-turn confidence + evidence trace**
&mdash; size: 1 session.

Each turn already carries `cites: [n]`. Wire the judge prompt to receive
the RESOLVED citation text (title + snippet), not just the numeric id, so
the judge can penalise citations that don't actually support the claim
(hallucinated-source detection at judge time, not just at rubric time).

**F.3 Live rejudge streaming**
&mdash; size: half session.

`POST /debate/rejudge` currently returns a single blob. Convert it to SSE
so users watch the second judge write its reasoning live, then compare
against the original judgment when both finish. Bigger drama = more shared.

**F.4 Publish agentic vs sequential comparison in /benchmarks**
&mdash; size: 1 session.

Run the golden set through both modes; publish per-question defended /
conceded / unresolved counts. This becomes the "here's what agentic
buys you" credibility play.

### Phase 3 &mdash; ships in 3-6 weeks (growth + retention)

**G. Daily briefing email**
&mdash; size: 3 sessions. cost: token budget for one summary per user per day.

The single missing retention loop. Every morning, email/notify each user
with one fresh follow-up query auto-suggested from their graph
("Yesterday you researched RLHF. Here is what changed overnight."). Runs
on a cron. Uses the user's key or the free pool.

Backend: new `services/daily_brief.py` + cron trigger + email transport
(Postmark or Resend). Frontend: opt-in in Settings.

**H. Weekly review email (Sunday)**
&mdash; size: 1 session, extends G.

"Here is what you learned this week": 3 findings, 2 gaps, 1 debate to
run. This is the Notion-Sunday-email trick.

**I. Multi-round streaming into the report**
&mdash; size: 2 sessions.

Right now `ReportShell` shows a pipeline strip while the run happens
(shipped). Extend so the report sections progressively reveal as data
arrives: key findings appear one by one, the confidence factors animate in
when the critic returns, the source list fills as summaries land. Perplexity
does this; NotebookLM does not.

Backend needs to emit `section_ready` events over SSE, not just per-agent
progress.

**J. Chrome extension**
&mdash; size: 4-6 sessions across its own repo.

Highlight any paragraph on the web -> "Debate this" or "Add to graph".
Passive collection is how Readwise won.

Manifest V3, minimal permissions, communicates with the user's Polynous
session via `polynous.pages.dev/extension-token`. Chrome Web Store listing
is a separate 1-week grind.

**K. Embed widget `/embed/d/:id`, `/embed/r/:id`**
&mdash; size: 2 sessions.

Iframe-safe minimal render of a shared debate or report so bloggers can
drop them into posts. `SharedGraphView` is the model.

### Phase 4 &mdash; deferred (need external work first)

**L. Custom domain `ashwaryapradhan.dev` for founder attribution**
- Action item: buy the domain, put a one-page site with the Person JSON-LD
  from `index.html`, link back to Polynous. This is one afternoon of work
  but is not strictly Polynous product work.

**M. Wikidata + real backlinks**
- Publish 2-3 blog posts on Dev.to / Hashnode about building Polynous.
- Launch on Product Hunt with the /benchmarks page as the credibility spike.
- Show HN thread.
- Create a Wikidata entity for Polynous once there is one third-party
  reference to cite.

**N. Real multi-agent (not just multi-turn)**
- Agents that critique each other's outputs in loops with actual
  disagreement resolution. This is a research project, not a product move.
  Do not ship this without a specific customer asking for it.

---

## Part 3 &mdash; What is deliberately NOT queued

Being honest about these matters as much as the queue.

- **Full rewrite of the 1634-line `dangerouslySetInnerHTML` dossier.** New
  sections should be built in `ReportShell` in proper JSX; the old dossier
  stays until it needs a section-level change it cannot service. This is a
  1-2 week rewrite with zero user-visible benefit if done alone.
- **Real "multi-agent" positioning.** The current architecture is a sequential
  pipeline with different system prompts per stage. Marketing copy should NOT
  lead with "multi-agent"; it should lead with "cited + faithfulness-scored"
  (already done). If we ship Phase 2 (agentic debate), the positioning can
  honestly upgrade for the DEBATE product only.
- **A dedicated user profile / social graph.** Adds surface area without
  clearly serving the "research + judged debate" thesis.
- **Own foundation model.** No.
- **A mobile app.** The web app is responsive; a native app adds a
  distribution channel and a maintenance burden with no product upside yet.

---

## Part 4 &mdash; What ships this week (concrete)

**Updated plan** — the original Mon/Tue/Wed items (Phase 1A/1B/1C) all
shipped ahead of schedule in the same session (commits `c29eb402` + parts of
`27df6f8b`), plus Phase 2 (`4bb95c19`) and Phase 3 SSE + PIVOT (`eb9d1b33`).

Reprioritised for the rest of the week:

- Mon: Run `run_eval.py` against the 20 golden-set prompts. Blind-rate 5
  answers manually to seed the scoreboard with real numbers instead of
  the current PENDING placeholders.
- Tue: Ship Phase 2.5 F.1 (agent invokes web search mid-turn) — the one
  upgrade that lets us honestly claim the agents *research* mid-debate,
  not just argue over pre-fetched sources.
- Wed: Ship Phase 2.5 F.3 (live rejudge SSE). More drama on rejudge =
  more social sharing of verdicts.
- Thu: Ship Phase 2.5 F.4 (agentic vs sequential comparison on
  `/benchmarks`) so users can see the difference in numbers.
- Fri: Buy `ashwaryapradhan.dev`, put the Person JSON-LD from
  `frontend/index.html` on a one-page site linking back to Polynous.
- Weekend: Product Hunt launch + Show HN. Lead with the
  Debate-Chamber-credibility story from Part 0 above.

**Launch-copy source of truth**: the one sentence at the top of Part 0.
Every social post, PH tagline, HN title, LinkedIn preview should be a
direct restatement of it. If it can't be justified in a single tweet
against Part 0, do not ship the tweet.

---

## Part 5 &mdash; File and commit index (for future-you)

Debate credibility system, in load order:

**Backend**
- `backend/app/llm_providers.py` — `STRONG_MODELS`, `WEAK_MODELS`,
  `resolve_advocate_model`, `resolve_judge_model`.
- `backend/app/agents/debate_agents.py` — `judge_debate(blind=True)`,
  team_a/b_quality remap, verdict transparency metadata.
- `backend/app/agents/agentic_debate.py` — state machine, `next_action`,
  assert / rebut / defend-or-concede-or-pivot, `stream_agentic_debate`
  generator, `point_ledger_judge`, `run_agentic_debate` wrapper.
- `backend/app/graph/debate_graph.py` — `judge_node` now resolves WEAK-tier
  judge model and emits it in the live status line.
- `backend/app/routes/debate_agentic.py` — `POST /debate/agentic` +
  `GET /debate/agentic/stream` (SSE).
- `backend/app/routes/report_actions.py` — `POST /debate/rejudge`.
- `backend/app/routes/settings_extended.py` — `GET /settings/model-tiers`.
- `backend/evals/golden_set.json` + `run_eval.py` + `README.md`.

**Frontend**
- `frontend/src/components/SettingsPage.jsx` — `ModelTiersSection`.
- `frontend/src/components/PolynousDebateReport.jsx` — masthead chip,
  methodology transparency block, credibility panel.
- `frontend/src/components/DebateActions.jsx` — `RejudgeModal`,
  `PointLedgerView`, retrofitted `ReplayModal`.
- `frontend/src/components/DebateInterface.jsx` — agentic toggle,
  live-view wiring, dual-engine mount.
- `frontend/src/components/AgenticDebateLive.jsx` + `.css` — SSE consumer
  with real-time point ledger, phase-pulse dot, PIVOT badges.
- `frontend/src/components/BenchmarksPage.jsx` — Judge independence
  card grid.

Key commits (newest first):
- `eb9d1b33` — Agentic streaming: SSE + PIVOT move + live ledger view
- `4bb95c19` — Phase 2 agentic debate: state machine, point-ledger judge
- `c29eb402` — Judge Phase 1: STRONG/WEAK tiers, blind A/B, Settings picker
- `13e41fea` — Multi-provider rejudge, steelman-first, streaming strip,
  benchmarks page, golden-set harness
- `18349de7` — Premium report: TL;DR shell, honest scoring, dead code purge
- `d76acb99` — Growth loops (discover, share, import, referrals)
- `158d70a6` — Knowledge graph grounded actions + timeline + labels
- `27df6f8b` — Interactive report actions (debate against, perspective,
  cross-exam, replay, share, chain)

---

*Last updated: 07 Sep 2026 (Ashwarya Pradhan)*
*Status: Debate Chamber Phase 1-3 credibility system fully shipped and live in `main`. Phase 2.5 upgrades queued next.*
