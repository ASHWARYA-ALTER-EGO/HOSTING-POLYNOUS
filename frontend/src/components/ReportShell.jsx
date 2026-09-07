import { useEffect, useMemo, useRef, useState } from "react";
import PolynousReport from "./PolynousReport";
import "./ReportShell.css";

/*
 * ReportShell - premium TL;DR-first wrapper around PolynousReport.
 *
 * Fixes the three biggest report problems:
 *   1) Length. A 12-scroll magazine spread is beautiful but bounces new users.
 *      The shell surfaces a 2-3 sentence executive answer, the trust score
 *      + faithfulness ratio, and the sources up top. The full report expands
 *      inline underneath, opt-in.
 *   2) Honesty. The header calls the score a "Heuristic score" (not
 *      "Confidence") and tooltips WHAT went into it. No fake precision.
 *   3) Empty states. If a section has no real data we say so plainly instead
 *      of falling back to demo content.
 *
 * The existing PolynousReport is untouched: this shell renders the same
 * component below the fold when the user asks for the full analysis.
 */

const pct = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function truncateSentences(text, n = 3) {
  if (!text) return "";
  const parts = String(text).split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, n).join(" ").trim();
}

function trustBand(score) {
  if (score >= 80) return { label: "HIGH TRUST", tone: "high" };
  if (score >= 60) return { label: "MODERATE", tone: "med" };
  if (score >= 40) return { label: "TENTATIVE", tone: "low" };
  return { label: "LOW", tone: "warn" };
}

function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

/* --------- Streaming pipeline strip ---------
   Renders while a run is in flight (partial answer or no answer, but telemetry
   steps arriving). Four canonical stages, each read from real per-step
   telemetry. Kills the "watch a spinner" problem without shipping new backend. */
const PIPE_STAGES = ["Search", "Summarise", "Critic", "Writer"];
function PipelineStrip({ steps, running }) {
  const map = {};
  (steps || []).forEach((s) => {
    const key = String(s.name || "").toLowerCase();
    const target = PIPE_STAGES.find((k) => key.includes(k.toLowerCase()));
    if (target) map[target] = { ...s, done: (s.status || "").toLowerCase() === "complete" || (s.output_tokens || 0) > 0 };
  });
  return (
    <div className="rs-pipe" role="status" aria-live="polite">
      {PIPE_STAGES.map((name, i) => {
        const s = map[name];
        const state = s ? (s.done ? "done" : "run") : (running ? "pending" : "idle");
        const tok = s && ((s.input_tokens || 0) + (s.output_tokens || 0));
        return (
          <div key={name} className={"rs-pipe-cell state-" + state}>
            <span className="rs-pipe-idx">{String(i + 1).padStart(2, "0")}</span>
            <div className="rs-pipe-body">
              <div className="rs-pipe-name">
                {name}
                <span className="rs-pipe-dot" aria-hidden />
              </div>
              <div className="rs-pipe-bar">
                <span style={{ width: state === "done" ? "100%" : state === "run" ? "62%" : "0%" }} />
              </div>
              <div className="rs-pipe-meta">
                {state === "done" ? (tok ? tok.toLocaleString() + " tok" : "done") :
                 state === "run" ? "running..." :
                 state === "pending" ? "queued" : "idle"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------- Source chip row --------- */
function SourceStrip({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="rs-sources">
      <span className="rs-kicker">Cited</span>
      <div className="rs-source-chips">
        {sources.slice(0, 6).map((s, i) => {
          const domain = (() => {
            try { return new URL(s.url || "https://" + s.title).hostname.replace(/^www\./, ""); }
            catch { return (s.title || "").slice(0, 32); }
          })();
          return (
            <a key={i} href={s.url || "#"} target="_blank" rel="noreferrer noopener"
               className="rs-source-chip" title={s.title || s.url}>
              <span className="rs-source-n">{i + 1}</span>
              <span className="rs-source-d">{domain}</span>
            </a>
          );
        })}
        {sources.length > 6 && <span className="rs-source-more">+{sources.length - 6}</span>}
      </div>
    </div>
  );
}

/* --------- Heuristic-score chip with methodology tooltip --------- */
function ScoreChip({ score, factors, faithful }) {
  const [open, setOpen] = useState(false);
  const band = trustBand(score);
  return (
    <div className={"rs-score tone-" + band.tone} onMouseLeave={() => setOpen(false)}>
      <button className="rs-score-btn" onClick={() => setOpen((o) => !o)}
              aria-expanded={open}>
        <span className="rs-score-num">{score}</span>
        <span className="rs-score-slash">/100</span>
        <span className="rs-score-band">{band.label}</span>
        <span className="rs-score-i" aria-hidden>?</span>
      </button>
      {open && (
        <div className="rs-score-pop" onClick={(e) => e.stopPropagation()}>
          <div className="rs-score-head">
            <span className="rs-kicker">Heuristic score</span>
            <p>Not evaluated against ground truth. Blended from four measurable signals:</p>
          </div>
          <ul className="rs-score-factors">
            {factors && Object.entries(factors).map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <div className="rs-score-bar">
                  <div style={{ width: pct(v) + "%" }} />
                </div>
                <b>{pct(v)}%</b>
              </li>
            ))}
          </ul>
          {faithful && (
            <div className="rs-score-faith">
              <span className="rs-kicker">Faithfulness</span>
              <p><b>{faithful.grounded}/{faithful.total}</b> sentences carry a citation to a fetched source ({faithful.pct}%).</p>
            </div>
          )}
          <p className="rs-score-foot">Treat as guidance, not proof. Verify important claims against the sources.</p>
        </div>
      )}
    </div>
  );
}

/* --------- The shell --------- */
export default function ReportShell(props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    if (expanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expanded]);

  // Derive the minimal TL;DR view from the caller's props without touching
  // deriveReport (whose output is opinionated for the long form).
  const view = useMemo(() => {
    const p = props || {};
    const r = p.report || {};
    const ca = r.confidence_analysis || {};
    const answer = p.answer || r.executive_summary || "";
    const tldr = truncateSentences(answer, 3);
    const rawScore = pct(p.confidence != null ? p.confidence : ca.overall);
    const score = rawScore || 0;
    const factors = Array.isArray(ca.factors) && ca.factors.length ? Object.fromEntries(
      ca.factors.map((f) => [(f.label || f.key || "").replace(/_/g, " "),
                             (Number(f.value) || 0) * (Number(f.value) <= 1 ? 100 : 1)])
    ) : null;
    const sentences = String(answer).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
    const grounded = sentences.filter((s) => /\[\d+\]/.test(s)).length;
    const faithful = sentences.length ? { grounded, total: sentences.length, pct: pct((grounded / sentences.length) * 100) } : null;
    const sources = Array.isArray(p.sources) ? p.sources : [];
    const findings = Array.isArray(r.key_findings) ? r.key_findings.slice(0, 3).map((f) => typeof f === "string" ? f : (f.text || f.finding || "")).filter(Boolean) : [];
    const query = p.query || "";
    const hasReal = !!(answer || sources.length || findings.length);
    return { tldr, score, factors, faithful, sources, findings, query, hasReal };
  }, [props]);

  if (!view.hasReal) {
    return (
      <div className="rs-empty">
        <div className="rs-empty-inner">
          <div className="rs-kicker">Nothing to report yet</div>
          <h2>This run finished without returning grounded evidence.</h2>
          <p>Try again with a more specific query, or run this on a paid key for deeper retrieval. We deliberately do not fill this space with placeholder content.</p>
        </div>
      </div>
    );
  }

  const copyTldr = () => {
    const cited = view.sources.slice(0, 6).map((s, i) => `[${i+1}] ${s.title || s.url}`).join("\n");
    const summary = `${view.query ? view.query + "\n\n" : ""}${view.tldr}${cited ? "\n\nSources:\n" + cited : ""}`;
    if (copyToClipboard(summary)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const running = !view.tldr && !!(props.telemetry && Array.isArray(props.telemetry.steps));
  const streamSteps = props.telemetry && Array.isArray(props.telemetry.steps) ? props.telemetry.steps : null;

  return (
    <div className="rs-shell">
      {streamSteps && (running || streamSteps.some((s) => (s.status || "").toLowerCase() !== "complete")) && (
        <PipelineStrip steps={streamSteps} running={running} />
      )}
      {/* --- TL;DR card ---------------------------------------------------- */}
      <section className="rs-tldr rs-fade">
        <header className="rs-tldr-head">
          <div className="rs-kicker">Answer</div>
          {view.query && <h1 className="rs-query">{view.query}</h1>}
        </header>
        <p className="rs-answer">
          {view.tldr || <em className="rs-mut">No executive summary was produced for this run.</em>}
        </p>
        <div className="rs-tldr-meta">
          {view.score > 0 && <ScoreChip score={view.score} factors={view.factors} faithful={view.faithful} />}
          {view.faithful && (
            <div className="rs-faith-chip">
              <span className="rs-kicker">Grounded</span>
              <b>{view.faithful.grounded}/{view.faithful.total}</b>
              <span className="rs-mut">sentences cite a source</span>
            </div>
          )}
          <div className="rs-src-chip">
            <span className="rs-kicker">Sources</span>
            <b>{view.sources.length}</b>
          </div>
        </div>
        <SourceStrip sources={view.sources} />
        {view.findings.length > 0 && (
          <ul className="rs-findings">
            {view.findings.map((f, i) => (
              <li key={i}><span className="rs-find-n">{String(i+1).padStart(2, "0")}</span>{f.replace(/\s*\[\d+\]/g, (m) => m)}</li>
            ))}
          </ul>
        )}
        <div className="rs-actions">
          <button className="rs-btn" onClick={copyTldr}>
            {copied ? "Copied" : "Copy summary"}
          </button>
          <button className={"rs-btn rs-btn-primary" + (expanded ? " is-open" : "")}
                  onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide full analysis" : "See full analysis"}
            <span className="rs-btn-chev" aria-hidden>{expanded ? "↑" : "↓"}</span>
          </button>
        </div>
      </section>

      {/* --- Full editorial report (unchanged) ---------------------------- */}
      <div ref={bottomRef} className={"rs-full" + (expanded ? " is-open" : "")}
           aria-hidden={!expanded}>
        {expanded && <PolynousReport {...props} />}
      </div>
    </div>
  );
}
