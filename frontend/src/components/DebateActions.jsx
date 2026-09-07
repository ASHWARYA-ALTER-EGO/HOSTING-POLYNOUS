import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, getAuthToken } from "../config";
import "./ReportActions.css";
import "./DebateActions.css";

/*
 * DebateActions — floating dock for a completed debate report.
 *   1. Live cross-examination  (user question, both advocates answer, judge scores)
 *   2. Replay with time-scrubber (opening -> rebuttal -> verdict, clash meter)
 *   3. Share-to-social OG image  (Wrapped-style verdict card, saveable PNG)
 */

function apiHeaders() {
  const t = getAuthToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}
function useLockBody(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
function Modal({ open, onClose, title, subtitle, tone, wide, children }) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ra-back" onClick={onClose}>
      <div className={"ra-modal " + (tone ? "ra-tone-" + tone : "") + (wide ? " ra-wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="ra-head">
          <div>
            <div className="ra-title">{title}</div>
            {subtitle && <div className="ra-sub">{subtitle}</div>}
          </div>
          <button className="ra-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ra-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Live Cross-examination ---------------- */
function CrossExamModal({ open, onClose, ctx }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [rounds, setRounds] = useState([]);
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [rounds]);
  const ask = async () => {
    const question = q.trim();
    if (!question) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(API_BASE_URL + "/debate/cross-exam", {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({
          question,
          topic: ctx.topic || "",
          pro_case: ctx.proCase || "",
          con_case: ctx.conCase || "",
          verdict: ctx.verdict || "",
        }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Sign in to run this action." :
        res.status === 400 ? "Add an API key in Settings first." :
        "Cross-exam unavailable right now.");
      const j = await res.json();
      setRounds((r) => [...r, { question, ...j.result }]);
      setQ("");
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  return (
    <Modal open={open} onClose={onClose} tone="fire" wide
      title="Live cross-examination"
      subtitle="Ask a question and put both advocates on the record. The judge scores each answer.">
      <div className="dba-cx" ref={boxRef}>
        {rounds.length === 0 && !busy && (
          <div className="dba-cx-empty">
            <span className="ra-kicker">Try asking</span>
            <ul>
              <li onClick={() => setQ("What's your single strongest source and why does it hold up?")}>What's your single strongest source and why does it hold up?</li>
              <li onClick={() => setQ("If your opponent's central claim were true, what would follow?")}>If your opponent's central claim were true, what would follow?</li>
              <li onClick={() => setQ("What evidence would change your mind?")}>What evidence would change your mind?</li>
            </ul>
          </div>
        )}
        {rounds.map((r, i) => (
          <div key={i} className="dba-cx-round">
            <div className="dba-cx-q"><span className="ra-kicker">You asked</span><p>{r.question}</p></div>
            <div className="dba-cx-pair">
              <div className={"dba-cx-side pro" + (r.winner === "pro" ? " win" : "")}>
                <div className="dba-cx-sh"><span>PRO</span><b>{Number(r.scores.pro).toFixed(1)}<i>/10</i></b></div>
                <p>{r.pro}</p>
              </div>
              <div className={"dba-cx-side con" + (r.winner === "con" ? " win" : "")}>
                <div className="dba-cx-sh"><span>CON</span><b>{Number(r.scores.con).toFixed(1)}<i>/10</i></b></div>
                <p>{r.con}</p>
              </div>
            </div>
            <div className={"dba-cx-verdict tone-" + (r.winner || "tie")}>
              <b>{r.winner === "tie" ? "Judge: tie" : r.winner === "pro" ? "Judge: PRO edges it" : "Judge: CON edges it"}</b>
              {r.why && <span>{r.why}</span>}
            </div>
          </div>
        ))}
      </div>
      {err && <div className="ra-err">{err}</div>}
      <div className="ra-inputrow">
        <textarea rows={2} className="ra-textarea"
          placeholder="Pose your question to both advocates..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(); }} />
        <button className="ra-btn ra-btn-primary" disabled={busy || !q.trim()} onClick={ask}>
          {busy ? "Both sides answering..." : "Put on the record"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Replay time-scrubber ---------------- */
function ReplayModal({ open, onClose, ctx }) {
  const stages = useMemo(() => {
    const s = [];
    if (ctx.proOpen) s.push({ t: "PRO opening", side: "pro", text: ctx.proOpen, momentum: 55 });
    if (ctx.conOpen) s.push({ t: "CON opening", side: "con", text: ctx.conOpen, momentum: 45 });
    if (ctx.proReb) s.push({ t: "PRO rebuttal", side: "pro", text: ctx.proReb, momentum: 62 });
    if (ctx.conReb) s.push({ t: "CON rebuttal", side: "con", text: ctx.conReb, momentum: 38 });
    if (ctx.verdict) s.push({ t: "Judge's verdict", side: "judge", text: ctx.verdict, momentum: ctx.leadA || 50 });
    return s;
  }, [ctx]);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (open) setIdx(0); }, [open]);
  const stage = stages[idx] || {};
  const proHistory = useMemo(() => stages.map((s) => s.momentum), [stages]);
  return (
    <Modal open={open} onClose={onClose} tone="prism" wide
      title="Debate replay"
      subtitle="Scrub through the exchanges. The clash meter shows momentum turn by turn.">
      <div className="dba-rp">
        {stages.length === 0 && <p className="ra-hint">No turns recorded for this debate.</p>}
        {stages.length > 0 && (
          <>
            <div className="dba-rp-meter">
              <div className="dba-rp-trail">
                {proHistory.map((m, i) => (
                  <div key={i}
                    className={"dba-rp-node" + (i === idx ? " on" : "") + (i <= idx ? " lit" : "")}
                    style={{ left: `${(i / Math.max(1, proHistory.length - 1)) * 100}%`, bottom: `${m}%` }}
                    onClick={() => setIdx(i)}
                    title={stages[i].t} />
                ))}
                <div className="dba-rp-mid" />
              </div>
              <div className="dba-rp-scale"><span>CON</span><span>PRO</span></div>
            </div>
            <div className="dba-rp-controls">
              <input type="range" min={0} max={stages.length - 1} value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="dba-rp-slider" />
              <div className="dba-rp-labels">
                {stages.map((s, i) => (
                  <button key={i}
                    className={"dba-rp-lbl side-" + s.side + (i === idx ? " on" : "")}
                    onClick={() => setIdx(i)}>{s.t}</button>
                ))}
              </div>
            </div>
            <div className={"dba-rp-panel side-" + (stage.side || "pro")} key={idx}>
              <div className="dba-rp-panel-h">
                <span className="ra-kicker">{stage.t}</span>
                <b>Lean: {stage.momentum}% PRO</b>
              </div>
              <p>{stage.text}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- Share OG card ---------------- */
function drawShareCard(ctx) {
  const W = 1200, H = 630;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const bg1 = dark ? "#0d1015" : "#f6f2e9";
  const bg2 = dark ? "#181c22" : "#ede4d3";
  const ink = dark ? "#f6efe0" : "#1b1e23";
  const mut = dark ? "#94a1af" : "#6b6156";
  const accent = ctx.winner === "PRO" || ctx.winner === "FOR" ? "#0a7d63" :
    ctx.winner === "CON" || ctx.winner === "AGAINST" ? "#b8320e" : "#7a6a4e";
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg1); grad.addColorStop(1, bg2);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // subtle grid
  g.strokeStyle = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // header
  g.fillStyle = mut;
  g.font = "600 22px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText("POLYNOUS  ·  DEBATE CHAMBER  ·  VERDICT", 60, 78);
  // rule
  g.strokeStyle = mut; g.lineWidth = 2;
  g.beginPath(); g.moveTo(60, 100); g.lineTo(W - 60, 100); g.stroke();
  // topic
  g.fillStyle = ink;
  g.font = "700 46px 'DM Serif Display', 'Playfair Display', serif";
  const topic = String(ctx.topic || "").slice(0, 140);
  wrapText(g, topic, 60, 170, W - 120, 56);
  // verdict block
  const vy = 340;
  g.fillStyle = accent;
  g.fillRect(60, vy, 8, 180);
  g.fillStyle = ink;
  g.font = "600 15px 'JetBrains Mono', ui-monospace, monospace";
  g.fillText("VERDICT", 90, vy + 30);
  g.fillStyle = accent;
  g.font = "700 72px 'DM Serif Display', serif";
  g.fillText(String(ctx.winner || "TIE"), 90, vy + 100);
  g.fillStyle = mut;
  g.font = "400 22px 'Inter', ui-sans-serif, system-ui, sans-serif";
  const line = `${ctx.forScore}–${ctx.againstScore}   ·   ${ctx.certainty || 70}% judge certainty`;
  g.fillText(line, 90, vy + 138);
  // clash meter
  const mx = 720, my = vy + 40, mw = 420, mh = 30;
  g.fillStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  roundRect(g, mx, my, mw, mh, 4); g.fill();
  const proW = (ctx.leadA || 50) / 100 * mw;
  g.fillStyle = "#0a7d63"; roundRect(g, mx, my, proW, mh, 4); g.fill();
  g.fillStyle = "#b8320e"; roundRect(g, mx + proW, my, mw - proW, mh, 4); g.fill();
  g.fillStyle = mut;
  g.font = "500 14px 'JetBrains Mono', monospace";
  g.fillText("CLASH METER", mx, my - 10);
  g.fillStyle = ink;
  g.font = "600 16px 'Inter', ui-sans-serif, system-ui, sans-serif";
  g.fillText(`PRO ${ctx.leadA || 50}%`, mx, my + mh + 26);
  g.textAlign = "right";
  g.fillText(`CON ${100 - (ctx.leadA || 50)}%`, mx + mw, my + mh + 26);
  g.textAlign = "left";
  // footer
  g.strokeStyle = mut; g.lineWidth = 1;
  g.beginPath(); g.moveTo(60, H - 70); g.lineTo(W - 60, H - 70); g.stroke();
  g.fillStyle = mut;
  g.font = "500 14px 'JetBrains Mono', monospace";
  g.fillText("polynous.ai  ·  weighed evidence and argument quality across both cases", 60, H - 40);
  return c;
}
function wrapText(g, text, x, y, maxW, lineH) {
  const words = String(text || "").split(/\s+/);
  let line = "", yy = y, lines = 0;
  for (let i = 0; i < words.length && lines < 3; i++) {
    const t = line ? line + " " + words[i] : words[i];
    if (g.measureText(t).width > maxW) {
      g.fillText(line, x, yy); line = words[i]; yy += lineH; lines++;
    } else line = t;
  }
  if (line && lines < 3) g.fillText(line, x, yy);
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
function ShareModal({ open, onClose, ctx }) {
  const [url, setUrl] = useState("");
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const c = drawShareCard(ctx);
    setUrl(c.toDataURL("image/png"));
    if (canvasRef.current) {
      const parent = canvasRef.current;
      parent.innerHTML = "";
      c.style.width = "100%";
      c.style.height = "auto";
      c.style.borderRadius = "10px";
      c.style.display = "block";
      parent.appendChild(c);
    }
  }, [open, ctx]);
  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `polynous-verdict-${(ctx.topic || "debate").slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const copyLink = async () => {
    try {
      const text = `POLYNOUS Verdict: ${ctx.winner} on "${ctx.topic}". ${ctx.forScore}–${ctx.againstScore}, ${ctx.certainty}% certainty.`;
      await navigator.clipboard.writeText(text);
    } catch (_) {}
  };
  return (
    <Modal open={open} onClose={onClose} tone="chain" wide
      title="Share the verdict"
      subtitle="A shareable card of the judge's call. Save as PNG or copy a one-line summary.">
      <div className="dba-share">
        <div ref={canvasRef} className="dba-share-canvas" />
        <div className="dba-share-actions">
          <button className="ra-btn ra-btn-primary" onClick={download}>Save PNG</button>
          <button className="ra-btn" onClick={copyLink}>Copy summary</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Rejudge with different model ---------------- */
const REJUDGE_PROVIDERS = [
  { key: "anthropic", label: "Claude (Anthropic)" },
  { key: "openai",    label: "GPT (OpenAI)" },
  { key: "google",    label: "Gemini (Google)" },
  { key: "groq",      label: "Groq" },
  { key: "mistral",   label: "Mistral" },
  { key: "deepseek",  label: "DeepSeek" },
];

function agreementLabel(a, b) {
  if (!a || !b) return { label: "PENDING", tone: "tie" };
  if (a.winner === b.winner) {
    const gap = Math.abs((a.for_score - a.against_score) - (b.for_score - b.against_score));
    if (gap < 1.2) return { label: "STRONG AGREEMENT", tone: "pro" };
    return { label: "SAME WINNER · DIFFERENT MARGIN", tone: "warn" };
  }
  return { label: "VERDICT FLIPPED", tone: "con" };
}

function RejudgeModal({ open, onClose, ctx }) {
  const [provider, setProvider] = useState("google");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [second, setSecond] = useState(null);
  useEffect(() => { if (!open) { setSecond(null); setErr(""); } }, [open]);
  const run = async () => {
    setBusy(true); setErr(""); setSecond(null);
    try {
      const res = await fetch(API_BASE_URL + "/debate/rejudge", {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({
          topic: ctx.topic || "",
          for_arg: ctx.forArg || ctx.proCase || "",
          against_arg: ctx.againstArg || ctx.conCase || "",
          for_rebuttal: ctx.forRebuttal || "",
          against_rebuttal: ctx.againstRebuttal || "",
          total_sources: ctx.totalSources || 0,
          judge_provider: provider,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || (res.status === 401 ? "Sign in to run this action." :
          res.status === 400 ? "Add an API key for that provider in Settings first." :
          "Rejudge unavailable right now."));
      }
      const j = await res.json();
      setSecond(j.verdict);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const orig = ctx.originalVerdict || {};
  const cmp = second ? agreementLabel(
    { winner: orig.winner, for_score: orig.for_score, against_score: orig.against_score },
    { winner: (second.winner || "").toUpperCase(), for_score: second.for_score, against_score: second.against_score },
  ) : null;
  return (
    <Modal open={open} onClose={onClose} tone="prism" wide
      title="Rejudge with a different model"
      subtitle="The core credibility play. A different model reads the same two cases. If verdicts agree, the debate is robust; if they flip, treat the original as tentative.">
      <div className="dba-rj-picker">
        <span className="ra-kicker">Choose a judge</span>
        <div className="dba-rj-choices">
          {REJUDGE_PROVIDERS.map((p) => (
            <button key={p.key}
              className={"dba-rj-choice" + (provider === p.key ? " on" : "")}
              onClick={() => setProvider(p.key)} disabled={busy}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="ra-hint">Needs an API key for that provider in Settings. Original judge: <b>{orig.model || "the same model"}</b>.</p>
      </div>
      <div className="ra-inputrow">
        <div style={{ flex: 1 }} />
        <button className="ra-btn ra-btn-primary" disabled={busy} onClick={run}>
          {busy ? "Second judge is reading..." : second ? "Try another judge" : "Run second judge"}
        </button>
      </div>
      {err && <div className="ra-err">{err}</div>}
      {second && (
        <div className="ra-out ra-fade">
          <div className={"dba-rj-agree tone-" + cmp.tone}>
            <span className="ra-kicker">Second opinion</span>
            <div className="dba-rj-agree-label">{cmp.label}</div>
          </div>
          <div className="dba-rj-pair">
            <div className="dba-rj-card">
              <span className="ra-kicker">Original judge</span>
              <div className="dba-rj-verdict tone-{orig.winner}">
                <b>{orig.winner}</b>
                <span>{orig.for_score}<i>vs</i>{orig.against_score}</span>
              </div>
              <p className="ra-hint">Certainty {orig.certainty}%</p>
            </div>
            <div className="dba-rj-arrow">→</div>
            <div className="dba-rj-card">
              <span className="ra-kicker">Second judge</span>
              <div className="dba-rj-verdict">
                <b>{(second.winner || "TIE").toUpperCase()}</b>
                <span>{second.for_score}<i>vs</i>{second.against_score}</span>
              </div>
              <p className="ra-hint">Certainty {second.judge_certainty || "?"}%</p>
            </div>
          </div>
          {second.reasoning && (
            <div className="ra-lead">
              <span className="ra-kicker">Second judge's reasoning</span>
              <p style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 13.5, lineHeight: 1.55 }}>{second.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Dock ---------------- */
export default function DebateActions({ ctx }) {
  const [which, setWhich] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 240);
    return () => clearTimeout(t);
  }, []);
  const cost = ctx && ctx.cost;
  const tokens = ctx && ctx.tokens;
  return (
    <>
      <div className={"ra-dock" + (open ? " is-open" : "")} data-print-hide>
        {(cost != null || tokens != null) && (
          <div className="ra-cost-chip" title="What this debate actually cost">
            <span className="ra-cost-lbl">This debate</span>
            <span className="ra-cost-val">
              {cost ? "$" + Number(cost).toFixed(4) : (tokens ? Number(tokens).toLocaleString() + " tok" : "free")}
            </span>
          </div>
        )}
        <button className="ra-dock-btn" onClick={() => setWhich("cx")}>
          <span className="ra-dock-glyph">?</span>
          <span className="ra-dock-lbl">Cross-examine</span>
        </button>
        <button className="ra-dock-btn" onClick={() => setWhich("rp")}>
          <span className="ra-dock-glyph">▶</span>
          <span className="ra-dock-lbl">Replay debate</span>
        </button>
        <button className="ra-dock-btn" onClick={() => setWhich("rj")}>
          <span className="ra-dock-glyph">⟳</span>
          <span className="ra-dock-lbl">Rejudge</span>
        </button>
        <button className="ra-dock-btn" onClick={() => setWhich("sh")}>
          <span className="ra-dock-glyph">↗</span>
          <span className="ra-dock-lbl">Share verdict</span>
        </button>
      </div>
      <CrossExamModal open={which === "cx"} onClose={() => setWhich(null)} ctx={ctx} />
      <ReplayModal open={which === "rp"} onClose={() => setWhich(null)} ctx={ctx} />
      <RejudgeModal open={which === "rj"} onClose={() => setWhich(null)} ctx={ctx} />
      <ShareModal open={which === "sh"} onClose={() => setWhich(null)} ctx={ctx} />
    </>
  );
}
