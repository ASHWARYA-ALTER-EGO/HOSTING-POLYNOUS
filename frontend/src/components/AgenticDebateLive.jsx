import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, getAuthToken } from "../config";
import "./AgenticDebateLive.css";

/*
 * AgenticDebateLive - real-time SSE view of an agentic debate.
 *
 * Consumes GET /debate/agentic/stream and progressively renders:
 *   - The point ledger (left rail) as points are opened / resolved
 *   - The active thread (right panel) as turns come in
 *   - A ticker showing the state-machine's next verb so you can literally
 *     see the scheduler make decisions
 *   - The final verdict when the "verdict" event arrives, then hands off
 *     to onComplete so the parent can flip to the full debate report.
 */

function phaseGlyph(phase) {
  return phase === "assert" ? "◆" : phase === "rebut" ? "⚔" :
         phase === "defend" ? "🛡" : phase === "concede" ? "🏳" : "·";
}
function toneOf(status) {
  return status === "defended" ? "pro" :
         status === "conceded" ? "con" :
         status === "unresolved" ? "tie" : "run";
}

export default function AgenticDebateLive({ topic, onComplete, onError }) {
  const [meta, setMeta] = useState(null);      // { labels, advocate_model, judge_model, ... }
  const [points, setPoints] = useState([]);     // list of {id, author, claim, status, exchange:[]}
  const [activeId, setActiveId] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [phase, setPhase] = useState("connecting");
  const [judge, setJudge] = useState(null);
  const [err, setErr] = useState("");
  const [docs, setDocs] = useState([]);
  const esRef = useRef(null);
  const pointsRef = useRef([]);
  pointsRef.current = points;

  const pushTurn = (turn) => {
    setPoints((prev) => {
      const next = prev.slice();
      // Locate the point this turn belongs to.
      let pid = turn.point_id;
      let idx = next.findIndex((p) => p.id === pid);
      if (turn.phase === "assert" && idx === -1) {
        // A new assertion (or a pivot). Register the point.
        next.push({
          id: pid,
          author: turn.side,
          claim: turn.text,
          status: "open",
          cites: turn.cites || [],
          exchange: [{
            turn: turn.turn, side: turn.side, phase: "assert",
            text: turn.text, cites: turn.cites || [],
            pivoted_from: turn.pivoted_from || null,
          }],
        });
        setActiveId(pid);
        return next;
      }
      if (idx === -1) return prev;
      const p = { ...next[idx] };
      p.exchange = [...(p.exchange || []), {
        turn: turn.turn, side: turn.side, phase: turn.phase,
        text: turn.text, cites: turn.cites || [],
        attack_mode: turn.attack_mode, narrowed_claim: turn.narrowed_claim,
      }];
      if (turn.phase === "rebut") p.status = "rebutted";
      if (turn.phase === "defend") p.status = "open";
      if (turn.phase === "concede") p.status = "conceded";
      next[idx] = p;
      // Keep the newly-touched point visible in the right panel.
      setActiveId(pid);
      return next;
    });
  };

  useEffect(() => {
    if (!topic) return;
    const tok = getAuthToken();
    const url = `${API_BASE_URL}/debate/agentic/stream?topic=${encodeURIComponent(topic)}${tok ? "&token=" + encodeURIComponent(tok) : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("docs", (e) => {
      try { setDocs(JSON.parse(e.data).data || []); } catch (_) {}
    });
    es.addEventListener("start", (e) => {
      try { setMeta(JSON.parse(e.data).data); setPhase("running"); } catch (_) {}
    });
    es.addEventListener("phase", (e) => {
      try { setPhase(JSON.parse(e.data).data.phase || "running"); } catch (_) {}
    });
    es.addEventListener("turn", (e) => {
      try { pushTurn(JSON.parse(e.data).data); } catch (_) {}
    });
    es.addEventListener("point", (e) => {
      try {
        const p = JSON.parse(e.data).data.point;
        setPoints((prev) => prev.map((x) => x.id === p.id ? { ...x, status: p.status } : x));
      } catch (_) {}
    });
    es.addEventListener("ledger", (e) => {
      try { setLedger(JSON.parse(e.data).data.clash_ledger); } catch (_) {}
    });
    es.addEventListener("verdict", (e) => {
      try {
        const v = JSON.parse(e.data).data;
        setJudge(v);
        setPhase("done");
        onComplete && onComplete(v);
      } catch (_) {}
    });
    es.addEventListener("error", (e) => {
      try {
        const msg = JSON.parse(e.data).data?.message || "stream error";
        setErr(msg); setPhase("failed"); onError && onError(msg);
      } catch (_) {
        setErr("stream connection lost"); setPhase("failed");
        onError && onError("stream connection lost");
      }
    });
    es.addEventListener("end", () => {
      es.close();
    });
    es.onerror = () => {
      // EventSource fires onerror on any transport blip; only surface it if
      // we haven't already received a verdict.
      if (esRef.current && esRef.current.readyState === 2 /* CLOSED */) return;
    };
    return () => { try { es.close(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const active = useMemo(() => points.find((p) => p.id === activeId) || points[points.length - 1], [points, activeId]);

  return (
    <div className="adl">
      <header className="adl-head">
        <div className="adl-eyebrow">
          <span className="adl-dot" data-phase={phase} /> AGENTIC DEBATE &middot; {phase.toUpperCase()}
        </div>
        {meta && (
          <div className="adl-meta">
            <span>Advocates <b>{meta.advocate_model}</b></span>
            <span>Judge <b>{meta.judge_model}</b></span>
            <span>Blind A/B &middot; {meta.labels?.A} = A, {meta.labels?.B} = B</span>
          </div>
        )}
      </header>

      {err && <div className="adl-err">{err}</div>}

      {ledger && (
        <div className="adl-ledger">
          <div className="adl-ledger-cell">
            <div className="adl-num">{ledger.A_ledger_points || 0}</div>
            <div className="adl-lab">Team A ({meta?.labels?.A})</div>
          </div>
          <div className="adl-vs">clash ledger</div>
          <div className="adl-ledger-cell">
            <div className="adl-num">{ledger.B_ledger_points || 0}</div>
            <div className="adl-lab">Team B ({meta?.labels?.B})</div>
          </div>
        </div>
      )}

      <div className="adl-body">
        <aside className="adl-rail">
          <div className="adl-rail-h">Points ({points.length})</div>
          {points.length === 0 && (
            <div className="adl-rail-empty">
              {phase === "connecting" ? "Connecting..." :
               phase === "running" ? "Waiting for the first move..." :
               "No points opened."}
            </div>
          )}
          {points.map((p) => (
            <button key={p.id}
              className={"adl-rail-btn tone-" + toneOf(p.status) + (active && active.id === p.id ? " on" : "")}
              onClick={() => setActiveId(p.id)}>
              <span className="adl-rid">{p.id}</span>
              <span className="adl-rside">{p.author} {meta?.labels ? "· " + meta.labels[p.author] : ""}</span>
              <span className="adl-rstatus">{p.status.toUpperCase()}</span>
            </button>
          ))}
        </aside>

        <section className="adl-panel">
          {!active && phase === "running" && (
            <div className="adl-wait">
              <div className="adl-pulse" />
              <p>The state machine is warming up... first assertion incoming.</p>
            </div>
          )}
          {active && (
            <>
              <div className="adl-panel-h">
                <div>
                  <span className="adl-kicker">{active.id} raised by {active.author}</span>
                  <p className="adl-claim">{active.claim}</p>
                </div>
                <span className={"adl-status tone-" + toneOf(active.status)}>{active.status.toUpperCase()}</span>
              </div>
              <div className="adl-thread">
                {(active.exchange || []).map((t, i) => (
                  <div key={i} className={"adl-turn phase-" + t.phase + " side-" + t.side}>
                    <div className="adl-turn-h">
                      <span className="adl-glyph">{phaseGlyph(t.phase)}</span>
                      <span className="adl-turn-side">{t.side} {meta?.labels ? "· " + meta.labels[t.side] : ""}</span>
                      <span className="adl-turn-p">{t.phase.toUpperCase()}</span>
                      {t.attack_mode && <span className="adl-attack">via {t.attack_mode}</span>}
                      {t.pivoted_from && <span className="adl-pivot">pivoted from {t.pivoted_from}</span>}
                    </div>
                    <p>{t.text}</p>
                    {t.narrowed_claim && <p className="adl-narrow"><b>Narrowed to:</b> {t.narrowed_claim}</p>}
                    {(t.cites || []).length > 0 && (
                      <div className="adl-cites">
                        {t.cites.map((n) => <span key={n} className="adl-cite">[{n}]</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {judge && (
        <footer className="adl-verdict">
          <div className="adl-eyebrow">Judge verdict</div>
          <div className="adl-verdict-line">
            <b>{judge.verdict?.winner}</b>
            <span>{judge.verdict?.for_score} - {judge.verdict?.against_score}</span>
            <span>certainty {judge.verdict?.judge_certainty}%</span>
          </div>
          <p>{judge.verdict?.reasoning}</p>
        </footer>
      )}

      {docs.length > 0 && (
        <details className="adl-docs">
          <summary>{docs.length} sources fetched</summary>
          <ol>
            {docs.map((d) => (
              <li key={d.n}>
                <a href={d.url || "#"} target="_blank" rel="noreferrer">{d.title}</a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
