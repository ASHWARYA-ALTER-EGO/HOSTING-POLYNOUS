# Polynous Roadmap · 07 Sep 2026

A single source of truth for what has shipped in the last several sessions,
what is queued next, and what is deliberately deferred. Reads top-down: recent
work first, then the honest next-step queue.

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

### Phase 1 &mdash; ships this week (small changes, high credibility)

**A. Same-provider different-model judge**
&mdash; size: 1 session. cost: negligible ($0.001 per debate).

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

### Phase 2 &mdash; ships in 2-3 weeks (agentic debate)

**D. Agentic debate mode (opt-in behind a toggle)**
&mdash; size: 2-3 sessions. cost: ~1.8x current debate run.

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

**F. Replay scrubber retrofit**
&mdash; size: 1 session.

The existing `ReplayModal` already reads sequential turns. Retrofit it to
render the point-ledger view:
```
Round 1
  P1 (A): "Mars colonies hedge extinction risk" [1][3]
    -> B rebut: "No colony is self-sufficient this century" [2]
      -> A defend: "Value is capability curve, not present self-sufficiency"
        -> B concede (narrowed): "granted on long-horizon framing"
    Status: DEFENDED . +1 A
```

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

If nothing changes, this week ships:

- Mon: Phase 1A (same-provider different-model judge). Half day.
- Tue: Phase 1B (blind A/B judging). Half day.
- Wed: Phase 1C (credibility copy on `/benchmarks`). Half day.
- Thu-Fri: First real `run_eval.py` execution against the 20 golden-set
  prompts. Blind-rate 5 answers manually to seed the scoreboard with
  actual numbers.
- Weekend: publish `/benchmarks` with real (partial) data and post to HN
  Show HN + Product Hunt.

Everything above is boring, small, and lands the credibility story in one
week. That is the point.

---

*Last updated: 07 Sep 2026 (Ashwarya Pradhan)*
