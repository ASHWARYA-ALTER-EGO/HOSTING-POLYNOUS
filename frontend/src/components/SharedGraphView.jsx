import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./SharedGraphView.css";

/*
 * SharedGraphView - public read-only display of a shared knowledge graph.
 * Runs a tiny force sim in the browser (no server layout), then renders inline
 * SVG. No auth required, no controls beyond zoom/pan and a "Build your own" CTA.
 */

function simpleLayout(nodes, edges, width, height, iterations = 240) {
  const cx = width / 2, cy = height / 2;
  const R = Math.min(width, height) * 0.4;
  const pos = new Map();
  nodes.forEach((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    pos.set(n.id, { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
  });
  const idx = new Map(nodes.map((n) => [n.id, n]));
  for (let k = 0; k < iterations; k++) {
    const damping = 1 - k / iterations;
    // Repulsion.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos.get(nodes[i].id), b = pos.get(nodes[j].id);
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const f = 1800 / d2;
        const fx = (dx / Math.sqrt(d2)) * f * damping;
        const fy = (dy / Math.sqrt(d2)) * f * damping;
        a.x -= fx; a.y -= fy; b.x += fx; b.y += fy;
      }
    }
    // Spring on edges.
    for (const e of edges) {
      const a = pos.get(e.source), b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const target = 90;
      const f = (d - target) * 0.03 * damping * (e.weight || 1);
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.x += fx; a.y += fy; b.x -= fx; b.y -= fy;
    }
    // Gravity to center.
    for (const n of nodes) {
      const p = pos.get(n.id);
      p.x += (cx - p.x) * 0.002 * damping;
      p.y += (cy - p.y) * 0.002 * damping;
    }
  }
  return nodes.map((n) => ({ ...n, x: pos.get(n.id).x, y: pos.get(n.id).y, ref: idx.get(n.id) }));
}

const COMMUNITY_PALETTE = ["#a855f7", "#0a7d63", "#b8320e", "#1b4d7a", "#b8790e", "#7cb5e6", "#8b96a3", "#f0a06a"];

export default function SharedGraphView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const W = 1200, H = 720;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/graph/share/${id}`);
        if (!res.ok) throw new Error(res.status === 404 ? "This shared graph doesn't exist or has expired." : "Could not load this graph.");
        const j = await res.json();
        setData(j);
      } catch (e) { setErr(String(e.message || e)); }
    })();
  }, [id]);

  const placed = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const p = data.payload || {};
    const nodes = p.nodes || [];
    const edges = p.edges || [];
    const laid = simpleLayout(nodes.slice(), edges, W, H);
    return { nodes: laid, edges };
  }, [data]);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = (data && data.title) || "Shared Knowledge Graph - Polynous";
  }, [data]);

  if (err) {
    return (
      <div className="sgv-shell sgv-err">
        <p>{err}</p>
        <Link to="/" className="sgv-cta">Build your own knowledge graph</Link>
      </div>
    );
  }
  if (!data) return <div className="sgv-shell sgv-loading">Loading shared graph...</div>;

  const posById = new Map(placed.nodes.map((n) => [n.id, n]));

  return (
    <div className="sgv-shell">
      <header className="sgv-head">
        <div>
          <div className="sgv-kicker">Shared graph</div>
          <h1>{data.title}</h1>
        </div>
        <Link to="/" className="sgv-cta">Build your own &rarr;</Link>
      </header>
      <div className="sgv-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="sgv-svg">
          <defs>
            <radialGradient id="sgv-node-grad">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          {placed.edges.map((e, i) => {
            const a = posById.get(e.source), b = posById.get(e.target);
            if (!a || !b) return null;
            const active = hovered && (hovered.id === e.source || hovered.id === e.target);
            return (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={active ? "#a855f7" : "rgba(160,175,190,0.28)"}
                strokeWidth={active ? 1.4 : Math.max(0.6, (e.weight || 1) * 0.7)}
                strokeLinecap="round" />
            );
          })}
          {placed.nodes.map((n) => {
            const c = typeof n.community === "number" ? COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length] : "#8b96a3";
            const r = 6 + Math.min(14, (n.weight || 1) * 3);
            const active = hovered && hovered.id === n.id;
            return (
              <g key={n.id} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                 style={{ cursor: "pointer" }}>
                {active && <circle cx={n.x} cy={n.y} r={r + 8} fill={c} opacity={0.16} />}
                <circle cx={n.x} cy={n.y} r={r} fill={c} opacity={active ? 1 : 0.86} />
                <text x={n.x} y={n.y - r - 6}
                      textAnchor="middle"
                      fontSize={active ? 13 : 11}
                      fill={active ? "#e8ecf3" : "rgba(200,210,224,0.62)"}
                      fontFamily="'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
                      fontWeight={active ? 600 : 500}>
                  {(n.label || n.id).slice(0, 24)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <footer className="sgv-foot">
        <div className="sgv-stats">
          <span><b>{placed.nodes.length}</b> concepts</span>
          <span><b>{placed.edges.length}</b> links</span>
        </div>
        <p className="sgv-note">Read-only snapshot. Node summaries are private to the owner; only labels and structure are shared.</p>
      </footer>
    </div>
  );
}
