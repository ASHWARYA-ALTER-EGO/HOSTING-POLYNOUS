# POLYNOUS — Changelog

A running log of changes, grouped by version. Newest first. "Shipped" = in the
code; caveats note anything that still needs a live/runtime check (the Railway
backend has been offline during this work, so backend behaviour is unit-tested
and compile-verified but not yet exercised end-to-end in production).

---

## [Unreleased] — Premium report: TL;DR shell, honest scoring, dead code purge

### New: ReportShell (TL;DR first)
- New `ReportShell` component wraps the existing `PolynousReport` and leads
  with a real-JSX, editorial answer card: query, 2-3 sentence executive
  answer, heuristic-score chip (with methodology tooltip), grounded-sentence
  count, source count, cited source strip, and up to three key findings.
- **Progressive disclosure**: the full editorial dossier is one click away
  ("See full analysis"), no longer the default surface. Fixes the "12-scroll
  magazine" bounce problem without rebuilding the 1634-line dossier.
- Empty-run state is honest: "This run finished without returning grounded
  evidence" instead of falling back to placeholder content.
- **Copy summary** button lifts the answer + numbered source list to the
  clipboard, so users share the takeaway without shipping the whole report.

### Honest scoring
- Every "Confidence" label in the dossier is now labelled **"Heuristic score"**,
  with tooltip copy stating plainly that the number is a rubric-derived signal,
  not an evaluation against ground truth, and that important claims should be
  verified against the sources.
- The `ConfidenceChart` tooltip no longer claims a "% confidence" per citation
  year (that was descriptive dressed as analytical). It now reads "avg source
  trust" for that year bucket.

### Empty state / demo purge
- Removed the "Human activity is the dominant driver of recent rapid warming"
  climate-demo string from the critic-consensus fallback, so a real run with
  a missing consensus_map no longer produces made-up placeholder content.
- (DEMO_* fallbacks remain for the `/report-preview` route where `real === false`;
  they are correctly gated and never surface on live runs.)

### Dead code
- Deleted `src/components/report/NeuralSynthesisReport.jsx` (imported but
  never rendered).
- Removed the stale `NeuralSynthesisReport` import from `ResearchInterface.jsx`.
- Directory `src/components/report/` removed.

### Rendering sites
- `ResearchInterface`, `SharedReportView` now render via `ReportShell` instead
  of `PolynousReport` directly. `AdminDashboard`'s demo view keeps the raw
  `PolynousReport` (that page is a design showcase, so it correctly wants the
  full dossier).

### Caveats
- The 1634-line `dangerouslySetInnerHTML` dossier is still there; ReportShell
  wraps it rather than replacing it. Full migration to composed React
  components remains the biggest tech-debt target for the report subsystem.
- Fake confidence chart is honestly relabelled, not deleted; deleting it would
  need a separate pass on `sConfidence`.

---

## [Unreleased] — Growth loops: /discover, KG share, ChatGPT import, referrals, cost transparency, share pill, cookie-gated intro, Person schema

### /discover public gallery
- New `/discover` route + `GET /discover?kind=&limit=` endpoint. Anonymised
  card grid of recent shared research and debate reports (topic, snippet,
  view count, kind). Social proof + SEO landing surface. No auth required.

### Read-only knowledge-graph share (`/g/:id`)
- `POST /graph/share` snapshots the caller's KG (labels + structure only, no
  private summaries) into the existing `shared_reports` table under `kind='graph'`.
- `GET /graph/share/:id` returns that snapshot.
- New `/g/:id` frontend route renders a lightweight force-laid SVG view with
  hover highlighting and a "Build your own" CTA. Nodes are coloured by
  community; edges by weight. Fully public, no signup wall.
- Prominent **Share graph** pill added top-right of the KG page.

### Import from ChatGPT / NotebookLM / notes
- New `POST /import/notes` extracts capitalised topic phrases from pasted
  text (server-side, no LLM key needed), seeds the caller's KG with pairwise
  edges between neighbouring topics, and saves a research entry so the import
  shows up in Memory Bank. Enforces auth, 200KB cap, 40-char minimum.
- New `ImportNotesModal` with tab presets for ChatGPT / NotebookLM / plain
  notes, live char counter, success card listing every extracted concept.
- Prominent **Import from ChatGPT** pill added top-right of the KG page.

### Referral loop
- Landing captures `?ref=<public_id>` into `localStorage` (30-day expiry).
- On successful signup the client fires-and-forgets `POST /referral/register`
  which records two negative-usage rows (-10 daily-cap consumed) for the
  referrer and referee, so both get 10 bonus free-key runs. Idempotent per
  pair.

### Cost transparency (BYO-key or free-key)
- Report and debate action docks now surface a **This run / This debate**
  cost chip: dollar amount when priced, token count otherwise. Makes the
  value of the free-key trial visible and converts curious users to
  paid keys once they see the numbers.

### Share loop: research report
- The research-report dock gains a **Share report** button as the first,
  most prominent action. Posts `/share`, copies the `/r/:id` link, fires the
  existing `pnToast`. One click, one link. (`/d/:id` for debates was already
  covered by the verdict-card share flow.)

### Cookie-gated Big Bang intro
- The KG's Big Bang cinematic now shows only on first visit (or after 30
  days). Repeat visitors go straight to the graph. Kept the intro for the
  moment of delight, killed it for the tax on returning users.

### SEO / LLM discoverability
- Added `Person` JSON-LD for Ashwarya Pradhan alongside the existing
  `SoftwareApplication` schema so search engines and LLMs correctly link
  Polynous back to its founder and their LinkedIn / GitHub profiles.
- Added `<meta name="author" content="Ashwarya Pradhan" />`.

### Backend
- New router `app/routes/growth.py`, wired into `main.py`. Endpoints:
  `GET /discover`, `POST /graph/share`, `GET /graph/share/:id`,
  `POST /import/notes`, `POST /referral/register`. Reuses the existing
  `SharedReport` table (new `kind='graph'`) and the existing `UsageLog`
  table (new `mode='referral'`) so no migration is needed.

### Deferred (called out honestly)
- Chrome extension: needs its own repo + manifest + Chrome Web Store listing.
- Embed widget (`/embed/d/:id`, `/embed/r/:id`): needs iframe-safe minimal
  render; the read-only KG view could be adapted first.

### Caveats
- Referral credit assumes the rate-limiter treats negative UsageLog rows as
  bonus quota; verify against `enforce()` once the backend is live. Import
  extractor is deterministic capitalised-phrase; upgradable to the real
  entity pipeline when a run happens on the imported entry.

---

## [Unreleased] — Knowledge Graph: grounded node actions, edge percentile filter, date timeline, See-in-graph, TF-IDF fallback labels

### Grounded actions on a selected node
- **Why is this connected?** — pick any neighbor of the selected node; the LLM
  explains the edge in one grounded sentence (<= 32 words) and marks the tie
  as strong / tentative / weak. Neighbors are pre-ranked by edge weight so the
  strongest link comes first.
- **Summarize this cluster** — for the selected node's community, the LLM
  writes a 5-9 word headline, a 3-5 sentence read of what the cluster is
  really about, and one open question worth exploring next. Grounded strictly
  in the cluster's own members (up to 12 summaries).
- **Explain this path** — when Pathfinder has a result, one click walks each
  hop (`from -> to`, why in <= 22 words) and closes with a one-sentence
  read of the overall bridge.

### Edge quality: percentile slider
- New **Edges shown / top N%** slider in the graph controls. Filters visible
  edges by weight percentile (0 = show all, 90 = show top 10%). Kills
  hairballs without redrawing anything or losing structure.

### Timeline: real dates, not just insertion order
- Growth reveal is now date-aware. If nodes carry `created_at` / `timestamp`,
  the timeline sorts by that and shows a "cursor date" chip next to the
  reveal counter, so playback reads as "the graph on 17 May 2026", not
  "N nodes shown".

### See in graph, from any research report
- The research-report dock gains a **See in graph** pill. It navigates to
  `/graph?focus=<query>`; the KG page reads the param on load, selects the
  matching node, centers on it, and clears the URL so a refresh doesn't
  re-focus.

### Instant, deterministic community labels
- New `GET /knowledge/tfidf-labels` computes top-TF-IDF terms per community
  from node labels/summaries. Runs on the graph payload directly, needs no
  key, and returns instantly. The KG page fetches this on graph load so
  cluster chips read as "Alignment · RLHF · Reward Hacking" from the first
  paint. The existing LLM `/community-labels` endpoint still upgrades these
  later with richer wording when a key is present.

### Backend
- New router `app/routes/kg_actions.py`, wired into `main.py`:
  - `POST /knowledge/why-connected`
  - `POST /knowledge/summarize-cluster`
  - `POST /knowledge/explain-path`
  - `GET  /knowledge/tfidf-labels`
- LLM endpoints reuse `report_chat._resolve_user_key` and the provider-agnostic
  `_call_llm` from `report_actions.py`. No new web fetches: the model only
  sees node summaries already in the user's own graph.

### Caveats
- LLM endpoints need a live BYO-key run to QA answer quality. TF-IDF labels,
  edge percentile slider, timeline dates and See-in-graph verified in the
  frontend build.

---

## [Unreleased] — Interactive report actions: debate, perspective, cross-exam, replay, share, chain-of-research

### Research report
- **Debate against this report** — a floating "Debate report" dock action opens a
  devil's-advocate rebuttal grounded strictly in the report's own material.
  Optional user counter-argument, returns counter-thesis + 3-4 numbered points
  + weakest-link + steelman. Backed by new `POST /report/debate-against`.
- **View from another perspective** — six lenses (skeptic, contrarian, futurist,
  practitioner, historian, ethicist) reframe the same evidence. Returns a
  headline, reframe paragraph, accepts / objects-to bullets, and the question
  the lens would ask next. Backed by new `POST /report/perspective`.
- **Chain-of-research** — the same dock offers one-click follow-up queries
  derived from the report's own findings, boundaries and query. Clicking one
  launches a fresh research run via the `onRunQuery` prop (falls back to
  `/?q=...` navigation).

### Debate report
- **Live cross-examination** — user poses a question, both advocates answer in
  character, the judge scores 0-10 with a one-line reason. Threaded UI stacks
  each round. Backed by new `POST /debate/cross-exam`.
- **Replay with time-scrubber** — scrub through opening -> rebuttal -> verdict
  turns; a clash meter shows momentum node-by-node, per-turn text panel slides
  in with each stage. Fully client-side, works on any completed debate.
- **Share the verdict** — canvas-generated 1200x630 verdict card (topic,
  verdict badge, score line, clash meter) with a Save-PNG button and a
  copy-summary fallback. Theme-aware (light/dark). Fully client-side.

### Backend
- New router `app/routes/report_actions.py`, wired into `main.py`. Three
  endpoints: `POST /report/debate-against`, `POST /report/perspective`,
  `POST /debate/cross-exam`. Reuses `report_chat._resolve_user_key` and
  `_build_context`, so it is strictly BYO-key, provider-agnostic and grounded
  in the caller-supplied report/debate context (no new web fetches).

### UX
- Dock floats bottom-right, opens with a subtle spring, hidden in print
  (`data-print-hide`). Modals: backdrop blur, spring easing, escape-to-close,
  scroll-locked while open. Editorial serif titles, mono kickers, warm/cool
  accents so counter-cases and lenses read as visually distinct actions.

### Caveats
- All three LLM endpoints need a live BYO-key run to confirm answer quality
  (backend + provider offline during development). Client-side share card and
  replay scrubber verified in dev preview.

---

## [Unreleased] — Print, provenance and rail fixes

### Print (global)
- **Full-report print output** — the outer `100vh, overflow:hidden` shell was
  clipping every printout to the current viewport. Added `frontend/src/print.css`
  (loaded from `main.jsx`) that forces the app-shell containers open in
  `@media print`, so both the research and debate reports print end to end.
- **Chrome removed from print**: sidebar, globe, neural canvas, sensitivity
  slider control, hovercard, toolbar (View Live Engine / New Debate / Export
  JSON — now tagged `.debate-report-toolbar[data-print-hide]`), and every
  `.print-hide` marker.
- **Debate toolbar** in `DebateInterface.jsx` marked `data-print-hide`.

### Pipeline provenance
- **Removed** the hardcoded `Input · Search · Summarise · Critic · Evidence · Synthesis · Insights`
  chip row — it looked like broken navigation because none of it was clickable
  or reflected the real run.
- **Rebuilt** the provenance list to render each real telemetry step with a
  step number, name and token count. Honest empty-state message when a run
  didn't emit per-step telemetry.

### Side rail
- **Peek-to-expand** behaviour: the rail is collapsed by default (only the
  edge markers + a subtle vertical hairline show), and slides in from the right
  with a spring-eased 420ms animation on hover or focus. The `ON THIS PAGE`
  eyebrow and labels fade in after the slide completes.

### Caveats
- Print CSS verified via CSS rule matching (dev preview pane renders at 0×0
  so visual QA isn't possible there). Try a real Save-as-PDF against
  `/debate-report-preview` or a live run to confirm.

---

## [Unreleased] — Debate report substantive UI + minimalist free-key card

### Debate report
- **Evidence & grounding** rebuilt as a head-to-head visual: per-metric bars,
  a winner tag on every row (`SUPPORTING ↑` / `COUNTER ↑` / `EVEN`), grounding
  shown as both fraction and percent, and an overall "who wins on measured
  evidence" banner at the bottom (with the note that argument-quality can still
  swing the final verdict).
- **Sensitivity analysis** made truly interactive: dragging the slider now live-
  updates the evidence/quality weight labels, both per-side scores (out of 10)
  with animated bars, the big "resulting lean" figure, the lean bar with a
  midline flip-marker, and a colour-coded status flag (Stable/Marginal/Fragile/
  Flipped) with plain-English text including *where* the verdict flips. Fires an
  initial `pnbSens(50)` on mount so the flag reflects real state on first paint.
- **Tribunal integrity** rebuilt as a real dashboard: a computed A/B/C/D grade
  + Integrity Index (0-100) from four equal-weighted hard checks (scored on real
  rubric · no hallucinations · grounding coverage · judge certainty), each with
  a coloured left border, metric value, and detailed explanation. Framing check
  + Steelman still surface on the right when the judge emits them.

### Settings
- Free-key card redesigned: minimalist, editorial, theme-token driven. Removed
  the gradient background, glow shadow, and chunky progress bar. Now a single
  bordered card with three stat blocks (`runs left today`, `days remaining`,
  `total runs left`), a pulsing status dot, and a hairline daily-usage meter.

### Caveats
- Debate report changes verified on the /debate-report-preview demo (rubric shows
  4 rows with winner tags, integrity grade badge renders, sensitivity slider
  live-updates through 0-50-100 with the correct flip detection). Free-key card
  needs a live-backend run to visually QA in its real setting.

---

## [Unreleased] — Semantic search Phase 2: answer synthesis + gap detection

### Added
- **Grounded answer synthesis** (`backend/app/services/search_intel.py`,
  `GET /search/synthesize`). After a search, the model writes a 2-4 sentence
  answer STRICTLY from the user's own top results, citing their past entries as
  `[n]`. Frontend shows a "Synthesis from your research" card above the
  constellation; clicking a `[n]` opens that entry. Best-effort, uses the user's key.
- **Research gap detection** (`GET /search/gaps`). Clusters the user's corpus
  (reusing `cluster_research`) and has the model surface 3 gaps: connections
  between clusters they've researched separately but never together, and
  under-explored sub-questions — each with a concrete suggested query. Frontend
  adds a "Find gaps in my research" button + a gaps panel in the idle state, with
  one-click "search it" or "Research/Debate it" actions. Needs ≥ 4 entries.

### Caveats
- Both call the user's LLM key and need a live run to confirm synthesis quality
  and gap usefulness (backend + Pinecone offline during development). Fallbacks
  return empty-but-valid payloads so the UI never breaks. `/search` is auth-gated,
  so the new UI wasn't visually QA'd yet.

---

## [Unreleased] — Semantic search Phase 1: HyDE + hybrid retrieval

### Added
- **HyDE (Hypothetical Document Embeddings)** in `backend/app/semantic_search.py`.
  Short queries (≤ 8 words) are expanded by the model into one dense factual
  sentence; the query **plus** that sentence is embedded, so a bare 2-word query
  retrieves far better. Best-effort: falls back to the raw query on any failure,
  for long/specific queries, or when `SEARCH_HYDE=0`.
- **Hybrid retrieval (dense ⊕ lexical, RRF)**. Dense Pinecone candidates are
  over-fetched (≥ 4×) and fused with a lightweight BM25-ish lexical ranking over
  the **original** query via Reciprocal Rank Fusion, then diversified with the
  existing MMR pass. Recovers exact terms, acronyms and proper names that pure
  vector search blurs. Verified: lexical scorer (0.8 vs 0.0 on term match) and
  RRF ordering unit-tested.
- **Suggestions in Neural Semantic Search** (`frontend/src/components/SemanticSearchPage.jsx`):
  new **Recent** (per-browser, deduped, capped at 8) and **For you** (from the
  user's onboarding interests) chip rows, above the existing rotating **Explore**
  chips. Theme-aware.

### Config
- `SEARCH_HYDE` (default `1`) — set `0` to disable HyDE.

### Caveats
- Needs a live run to confirm HyDE answer quality and end-to-end ranking (backend
  offline during development).

---

## [prior work this cycle] — Free key, rate limits, theming, reports

### Free API key
- **Instant free key**: a signed-in user with no key is auto-provisioned a pooled
  starter key on their first run (research, debate, and legacy `/ask`), instead
  of an "add your key" error.
- **Shared-key model**: the single `FREE_KEY` is now shared across all users
  (rate-limited per user) instead of being consumed by the first claimer.
- **Daily cap**: free key limited to `FREE_TRIAL_DAILY_RUNS` (default **3**) runs
  per day, resets at UTC midnight, without ending the trial. Surfaced in the
  Settings banner and the active-key card.
- **Switching to your own key** ends the trial, drops the pooled key, and makes
  your key active; a guard in `enforce()` never rate-limits a user on their own key.
- **Gemini** is the free provider: `FREE_KEY_PROVIDER=google`, friendly label
  "Gemini" everywhere; explicit "Free Gemini key active" display in Settings.

### Abuse protection
- Per-IP rate limits on auth: **register 5/hour**, **login 10/5 min** (429 +
  Retry-After).

### UX
- Redesigned the free-key welcome modal (`TrialWelcome.jsx`): minimalist, premium,
  theme-aware, correct "3 runs/day" copy.

### Theming
- Light/dark theme system: `theme.css` (scoped `[data-theme]` tokens), no-flash
  boot, `ThemeProvider` + `ThemeToggle`, applied across the app shell and both
  reports. Marketing/landing pages intentionally stay dark. (Some gradient-heavy
  functional pages still need a polish pass.)

### Reports (research + debate)
- Debate report given its own identity (Debate Chamber palette), real argument
  points + rebuttals, real sensitivity recompute, tribunal integrity checks,
  fixed `[object Object]`, cost, vote persistence, cross-exam + fallacy audit
  (backed by a new backend analyst).
- Research report: unique per-topic evidence-per-year chart, richer evidence /
  source-quality / confidence sections, grounded local "interrogate" fallback,
  premium light-paper PDF, public no-sign-in share links (`/r/:id`, `/d/:id`).
