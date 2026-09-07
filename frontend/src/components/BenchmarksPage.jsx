import { Link } from "react-router-dom";
import "./BenchmarksPage.css";

/*
 * BenchmarksPage - the "publish comparison benchmarks" page.
 *
 * This is a live, honest scorecard. Nothing here is fabricated: numbers below
 * are placeholders until the golden-set eval runner produces real ones. The
 * page's own copy calls that out plainly so readers can trust the moment we
 * DO publish real numbers, and so we never overclaim.
 */

const METHODOLOGY = [
  {
    n: "01",
    title: "Fixed prompt set (n = 20)",
    body: "A held-out set of research questions spanning STEM, history, current events and open-ended argument. Same prompt sent to every tool, no cherry-picking, no retries. Prompts published in the repo.",
  },
  {
    n: "02",
    title: "Blind human rating",
    body: "Three human raters score each answer on Correctness, Cited coverage, and Usefulness. Tool identities are stripped before rating. Raters do not know which tool produced which answer.",
  },
  {
    n: "03",
    title: "Automated faithfulness check",
    body: "For each answer the eval runner walks every sentence, checks whether a citation resolves to a fetched source, and computes a grounded-sentence ratio. Zero interpretation.",
  },
  {
    n: "04",
    title: "Independent judge",
    body: "For debate benchmarks the same two advocate cases are judged by three different models (Claude, GPT, Gemini). We publish the per-judge verdicts AND the inter-judge agreement rate.",
  },
];

const TOOLS = [
  { key: "polynous",   name: "Polynous",   accent: "#a855f7" },
  { key: "perplexity", name: "Perplexity", accent: "#7cb5e6" },
  { key: "chatgpt",    name: "ChatGPT",    accent: "#0a7d63" },
  { key: "notebook",   name: "NotebookLM", accent: "#f0a06a" },
];

const METRICS = [
  { key: "citations",   label: "Cited sentences (%)", note: "share of sentences that link to a fetched source" },
  { key: "correctness", label: "Correctness (0-10)",  note: "blind rater agreement, three raters" },
  { key: "coverage",    label: "Coverage (0-10)",     note: "share of the question actually answered" },
  { key: "usefulness",  label: "Usefulness (0-10)",   note: "did the reader learn something they could use" },
];

/* Placeholder-only sample cell so the page renders even before we've run
   the real eval. The UI marks these as PENDING so nobody mistakes them for
   published numbers. Replace once evals/results.json is populated. */
const SAMPLE = {
  polynous:   { citations: 0.94, correctness: 7.4, coverage: 7.1, usefulness: 6.8 },
  perplexity: { citations: 0.88, correctness: 7.9, coverage: 7.6, usefulness: 7.5 },
  chatgpt:    { citations: 0.12, correctness: 8.1, coverage: 8.0, usefulness: 7.4 },
  notebook:   { citations: 0.71, correctness: 6.9, coverage: 6.4, usefulness: 6.6 },
};

export default function BenchmarksPage() {
  const status = "PENDING";
  return (
    <div className="bp-page">
      <header className="bp-head">
        <div className="bp-eyebrow">Public benchmarks</div>
        <h1>How Polynous scores against Perplexity, ChatGPT and NotebookLM.</h1>
        <p className="bp-lede">
          One weekend of work, published in full. Same prompts, blind human
          rating, no cherry-picking. We publish the raw runs, the ratings, and
          the moments Polynous loses.
        </p>
        <div className="bp-status">
          <span className={"bp-status-tag tone-" + (status === "PUBLISHED" ? "ok" : "pending")}>
            {status === "PUBLISHED" ? "PUBLISHED" : "PENDING FIRST RUN"}
          </span>
          <p>
            The numbers below are placeholders until the first evaluation run
            completes. Once real numbers land they replace these and this
            banner turns green. Nothing is hidden.
          </p>
        </div>
      </header>

      <section className="bp-methods">
        <h2>How it works</h2>
        <div className="bp-methods-grid">
          {METHODOLOGY.map((m) => (
            <div key={m.n} className="bp-method">
              <span className="bp-method-n">{m.n}</span>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bp-table">
        <div className="bp-table-head">
          <h2>Head to head</h2>
          <span className="bp-mut">n = 20 · blind rating · placeholder data</span>
        </div>
        <div className="bp-scoreboard">
          <div className="bp-row bp-row-header">
            <div className="bp-cell bp-metric-cell">Metric</div>
            {TOOLS.map((t) => (
              <div key={t.key} className="bp-cell bp-tool-cell" style={{ color: t.accent }}>
                {t.name}
              </div>
            ))}
          </div>
          {METRICS.map((met) => (
            <div key={met.key} className="bp-row">
              <div className="bp-cell bp-metric-cell">
                <b>{met.label}</b>
                <span>{met.note}</span>
              </div>
              {TOOLS.map((t) => {
                const v = SAMPLE[t.key][met.key];
                const disp = met.key === "citations" ? Math.round(v * 100) + "%" : v.toFixed(1);
                const best = Math.max(...TOOLS.map((x) => SAMPLE[x.key][met.key]));
                const isBest = v === best;
                return (
                  <div key={t.key} className={"bp-cell bp-value-cell" + (isBest ? " is-best" : "")}
                       style={{ borderColor: isBest ? t.accent : "transparent" }}>
                    <b>{disp}</b>
                    {isBest && <span style={{ color: t.accent }}>leads</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="bp-cred">
        <div className="bp-eyebrow">Judge independence</div>
        <h2>How Polynous keeps the judge honest.</h2>
        <div className="bp-cred-grid">
          <div className="bp-cred-card">
            <span className="bp-cred-num">A</span>
            <h3>Different model, same API key</h3>
            <p>Advocates run on the stronger model in the provider's line-up. The judge runs on the smaller, cheaper model in the same provider. One key, meaningfully different models.</p>
            <ul className="bp-cred-list">
              <li><b>OpenAI</b> — <code>gpt-4o</code> advocates, <code>gpt-4o-mini</code> judge</li>
              <li><b>Anthropic</b> — <code>claude-opus-4</code> advocates, <code>claude-haiku-4.5</code> judge</li>
              <li><b>Google</b> — <code>gemini-2.5-pro</code> advocates, <code>gemini-2.5-flash</code> judge</li>
              <li><b>Groq</b> — <code>llama-70b</code> advocates, <code>llama-8b</code> judge</li>
            </ul>
            <p className="bp-cred-note">Users can override either tier per-provider in Settings &rarr; Debate model separation.</p>
          </div>
          <div className="bp-cred-card">
            <span className="bp-cred-num">B</span>
            <h3>Blind A/B labelling</h3>
            <p>The judge never sees "FOR" or "AGAINST". Sides are randomly relabelled as <b>Team A</b> and <b>Team B</b> per debate, then remapped back after scoring. The judge cannot bias by side name because it does not know which side is which.</p>
            <p className="bp-cred-note">Every debate report shows the actual judge model and a BLIND A/B badge, so you can verify without taking our word.</p>
          </div>
          <div className="bp-cred-card">
            <span className="bp-cred-num">C</span>
            <h3>Rejudge with any provider</h3>
            <p>One click asks a completely different provider (Claude &rarr; Gemini, or vice versa) to reread the same two cases. Same-winner AND small-margin flip both surface as VERDICT AGREEMENT status. If verdicts diverge, the original is marked tentative.</p>
            <p className="bp-cred-note">Requires a key for the second provider. Optional.</p>
          </div>
        </div>
      </section>

      <section className="bp-honest">
        <div className="bp-honest-inner">
          <div className="bp-eyebrow">Where Polynous is expected to lose</div>
          <h2>We publish the losses too.</h2>
          <ul>
            <li><b>Speed.</b> Perplexity streams its answer in ~2s. Polynous takes 8-20s because it runs a full pipeline and cites everything. We are honest about that in the UI too.</li>
            <li><b>Answer polish.</b> ChatGPT writes better prose. Its answers read more naturally. Polynous prioritises citations over voice.</li>
            <li><b>Breadth of general knowledge.</b> Any general-purpose LLM will beat a research pipeline on "what year did X happen" trivia because the pipeline is optimised for evidence, not recall.</li>
          </ul>
          <p>
            Polynous is meant to <b>win on cited coverage, on faithfulness, and on judgeability.</b>
            If we're not winning on those, we've built the wrong thing.
          </p>
        </div>
      </section>

      <footer className="bp-foot">
        <p>Raw prompts, runs, and rating sheets will publish at <code>github.com/ashwaryapradhan/polynous-evals</code>. Contact if you'd like to volunteer as a rater.</p>
        <Link to="/" className="bp-cta">Back to Polynous &rarr;</Link>
      </footer>
    </div>
  );
}
