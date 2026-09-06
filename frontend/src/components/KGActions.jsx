import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getAuthToken } from "../config";
import "./ReportActions.css";
import "./KGActions.css";

/*
 * KGActions — grounded actions on the currently selected node.
 *   - Why is this connected to X?  (edge explanation)
 *   - Summarize this cluster       (community read)
 *   - Explain path (opened from Pathfinder)
 * Rendered as a compact side-panel that anchors to the existing NodeDetailPanel.
 */

function apiHeaders() {
  const t = getAuthToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}
function useLockBody(active) {
  useEffect(() => {
    if (!active) return;
    const p = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = p; };
  }, [active]);
}
function Modal({ open, onClose, title, subtitle, tone, children }) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ra-back" onClick={onClose}>
      <div className={"ra-modal " + (tone ? "ra-tone-" + tone : "")} onClick={(e) => e.stopPropagation()}>
        <div className="ra-head">
          <div>
            <div className="ra-title">{title}</div>
            {subtitle && <div className="ra-sub">{subtitle}</div>}
          </div>
          <button className="ra-x" onClick={onClose}>×</button>
        </div>
        <div className="ra-body">{children}</div>
      </div>
    </div>
  );
}

/* Rank the selected node's neighbors by edge weight so the "why-connected"
   picker leads with the strongest link. */
function topNeighbors(node, edges, nodes) {
  if (!node) return [];
  const nid = node.id;
  const labelById = new Map(nodes.map((n) => [n.id, n.label || n.id]));
  const rows = [];
  for (const e of edges || []) {
    const s = e.source || e.from, t = e.target || e.to;
    if (s === nid || t === nid) {
      const other = s === nid ? t : s;
      rows.push({ id: other, label: labelById.get(other) || String(other),
                  weight: Number(e.weight || 1), type: e.type || "" });
    }
  }
  rows.sort((a, b) => b.weight - a.weight);
  const seen = new Set();
  return rows.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }).slice(0, 6);
}

function communityMembers(node, nodes, nodeMetrics) {
  const gm = nodeMetrics && nodeMetrics[node.label];
  const c = (gm && typeof gm.community === "number") ? gm.community : node.community;
  if (c === undefined || c === null) return { c: null, members: [] };
  const members = nodes.filter((n) => {
    const m = nodeMetrics && nodeMetrics[n.label];
    return (m && m.community === c) || n.community === c;
  }).map((n) => n.label || n.id);
  return { c, members: members.slice(0, 18) };
}

/* ------------- WhyConnected modal ------------- */
function WhyModal({ open, onClose, node, edges, nodes }) {
  const neighbors = useMemo(() => topNeighbors(node, edges, nodes), [node, edges, nodes]);
  const [other, setOther] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ans, setAns] = useState(null);
  useEffect(() => { if (open) { setOther(neighbors[0] || null); setAns(null); setErr(""); } }, [open, neighbors]);
  const run = async (target) => {
    if (!target || !node) return;
    setBusy(true); setErr(""); setAns(null); setOther(target);
    try {
      const res = await fetch(API_BASE_URL + "/knowledge/why-connected", {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({ a: node.label || node.id, b: target.label, edge_type: target.type }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Sign in to run this action." :
        res.status === 400 ? "Add an API key in Settings first." :
        "Unavailable right now.");
      const j = await res.json();
      setAns(j.result);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  return (
    <Modal open={open} onClose={onClose} tone="prism"
      title="Why is this connected?"
      subtitle={`Explains any edge from “${node ? (node.label || node.id) : ""}” in one grounded sentence.`}>
      <div className="kga-neighbors">
        {neighbors.length === 0 && <p className="ra-hint">This node has no edges yet.</p>}
        {neighbors.map((n) => (
          <button key={n.id}
            className={"kga-neighbor" + (other && other.id === n.id ? " is-on" : "")}
            onClick={() => run(n)} disabled={busy}>
            <span className="kga-neighbor-lbl">{n.label}</span>
            <span className="kga-neighbor-w">w {n.weight.toFixed(1)}{n.type ? " · " + n.type : ""}</span>
          </button>
        ))}
      </div>
      {busy && <div className="ra-loader"><span/><span/><span/></div>}
      {err && <div className="ra-err">{err}</div>}
      {ans && (
        <div className="ra-out ra-fade">
          <div className={"kga-answer strength-" + ans.strength}>
            <span className="ra-kicker">{ans.strength} connection</span>
            <p>{ans.why}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------- SummarizeCluster modal ------------- */
function ClusterModal({ open, onClose, node, nodes, nodeMetrics, communityLabels }) {
  const { c, members } = useMemo(() => communityMembers(node || {}, nodes || [], nodeMetrics), [node, nodes, nodeMetrics]);
  const existing = communityLabels && c !== null ? communityLabels[String(c)] : null;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ans, setAns] = useState(null);
  useEffect(() => { if (open) { setAns(null); setErr(""); } }, [open, c]);
  const run = async () => {
    if (!members.length) return;
    setBusy(true); setErr(""); setAns(null);
    try {
      const res = await fetch(API_BASE_URL + "/knowledge/summarize-cluster", {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({ members, label: existing && existing.label }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Sign in to run this action." :
        res.status === 400 ? "Add an API key in Settings first." :
        "Unavailable right now.");
      const j = await res.json();
      setAns(j.result);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  useEffect(() => { if (open && members.length) run(); /* eslint-disable-line */ }, [open]);
  return (
    <Modal open={open} onClose={onClose} tone="chain"
      title={existing && existing.label ? existing.label : "This cluster"}
      subtitle={`${members.length} concepts share this community — a 3-5 sentence read of what it's really about.`}>
      {busy && <div className="ra-loader"><span/><span/><span/></div>}
      {err && <div className="ra-err">{err}</div>}
      {ans && (
        <div className="ra-out ra-fade">
          <div className="ra-lead">
            <span className="ra-kicker">Headline</span>
            <div className="ra-lead-text">{ans.headline}</div>
          </div>
          <p className="ra-reframe">{ans.summary}</p>
          {ans.open_question && (
            <div className="ra-question">
              <span className="ra-kicker">Would ask next</span>
              <p>&ldquo;{ans.open_question}&rdquo;</p>
            </div>
          )}
        </div>
      )}
      <div className="kga-members">
        <span className="ra-kicker">Members</span>
        <div className="kga-member-chips">
          {members.map((m) => <span key={m} className="kga-chip">{m}</span>)}
        </div>
      </div>
    </Modal>
  );
}

/* ------------- ExplainPath modal ------------- */
function PathExplainModal({ open, onClose, path }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ans, setAns] = useState(null);
  useEffect(() => { if (!open) return; setAns(null); setErr(""); if (!path || path.length < 2) return;
    (async () => {
      setBusy(true);
      try {
        const res = await fetch(API_BASE_URL + "/knowledge/explain-path", {
          method: "POST", headers: apiHeaders(),
          body: JSON.stringify({ path }),
        });
        if (!res.ok) throw new Error(res.status === 401 ? "Sign in to run this action." :
          res.status === 400 ? "Add an API key in Settings first." :
          "Unavailable right now.");
        const j = await res.json();
        setAns(j.result);
      } catch (e) { setErr(String(e.message || e)); }
      setBusy(false);
    })();
  }, [open, path]);
  return (
    <Modal open={open} onClose={onClose} tone="prism"
      title="Explain this path"
      subtitle="Each hop, in 22 words or less, plus the bridge these hops form.">
      {busy && <div className="ra-loader"><span/><span/><span/></div>}
      {err && <div className="ra-err">{err}</div>}
      {ans && (
        <div className="ra-out ra-fade">
          <div className="kga-steps">
            {ans.steps.map((s, i) => (
              <div key={i} className="kga-step">
                <span className="kga-step-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="kga-step-hop"><b>{s.from}</b> <span>→</span> <b>{s.to}</b></div>
                  <div className="kga-step-why">{s.why}</div>
                </div>
              </div>
            ))}
          </div>
          {ans.insight && (
            <div className="ra-lead">
              <span className="ra-kicker">Bridge</span>
              <div className="ra-lead-text">{ans.insight}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- action bar attached under NodeDetailPanel ---------------- */
export function KGNodeActions({ node, edges, nodes, nodeMetrics, communityLabels }) {
  const [which, setWhich] = useState(null);
  if (!node) return null;
  return (
    <>
      <div className="kga-bar" data-print-hide>
        <button className="kga-act" onClick={() => setWhich("why")}>
          <span className="kga-glyph">↔</span>
          <span>Why connected</span>
        </button>
        <button className="kga-act" onClick={() => setWhich("cluster")}>
          <span className="kga-glyph">◐</span>
          <span>Summarize cluster</span>
        </button>
      </div>
      <WhyModal open={which === "why"} onClose={() => setWhich(null)}
                node={node} edges={edges} nodes={nodes} />
      <ClusterModal open={which === "cluster"} onClose={() => setWhich(null)}
                    node={node} nodes={nodes} nodeMetrics={nodeMetrics}
                    communityLabels={communityLabels} />
    </>
  );
}

export function KGPathExplain({ open, onClose, path }) {
  return <PathExplainModal open={open} onClose={onClose} path={path} />;
}

/* Edge percentile slider — filters visible edges by weight threshold.
   Uncontrolled visual, controlled state. */
export function EdgeWeightSlider({ value, onChange, min, max }) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  return (
    <div className="kga-slider" data-print-hide>
      <label className="kga-slider-label">
        <span>Edges shown</span>
        <b>top {100 - value}%</b>
      </label>
      <input type="range" min={safeMin} max={safeMax} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="kga-slider-input" />
      <div className="kga-slider-hint">Drag right to hide low-weight edges.</div>
    </div>
  );
}
