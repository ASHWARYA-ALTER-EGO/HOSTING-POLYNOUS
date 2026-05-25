import { useState, useEffect, useRef } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", amber: "#ffaa00", void: "#0a0a1e", surface: "#111125",
  surfaceContainer: "#1e1e32", onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1, display: "inline-block", ...(style || {})
    }}>{name}</span>
  );
}

function Styles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1e;color:#e2e0fc;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
    ::selection{background:rgba(0,255,15,0.25)}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse-green{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
    @keyframes pulseBrain{0%,100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 8px #00ff0f)}50%{opacity:.7;transform:scale(1.05);filter:drop-shadow(0 0 15px #00ff0f)}}
    @keyframes dotPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
    @keyframes sectionIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes countUp{from{opacity:0}to{opacity:1}}
    .research-scrollbar::-webkit-scrollbar{width:4px}
    .research-scrollbar::-webkit-scrollbar-track{background:transparent}
    .research-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,255,15,0.2);border-radius:10px}
    .source-pill:hover{background:rgba(0,204,255,0.1)!important;border-color:#00ccff!important;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,204,255,0.2)}
    .finding-card-green:hover{border-color:#00ff0f!important}
    .finding-card-crimson:hover{border-color:#ff2040!important}
    .action-btn:hover{background:rgba(255,255,255,0.06)!important}
    .nav-link:hover{color:#00ccff!important;background:rgba(255,255,255,0.05)!important}
    .history-card:hover{border-color:rgba(0,255,15,0.3)!important;background:rgba(10,10,40,0.8)!important}
    .copy-btn:hover{background:rgba(0,255,15,0.08)!important;border-color:rgba(0,255,15,0.3)!important;color:#00ff0f!important}
    .share-btn:hover{box-shadow:0 0 30px rgba(0,255,15,0.5)!important}
  `}</style>;
}

// ─── Neural Canvas ────────────────────────────────────────────────────────────
function NeuralCanvas({ isResearching }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [], animId;
    const N = 120;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();
    for (let i = 0; i < N; i++) particles.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (isResearching ? 0.8 : 0.4),
      vy: (Math.random() - 0.5) * (isResearching ? 0.8 : 0.4),
      size: Math.random() * 2 + 1, opacity: Math.random() * 0.4 + (isResearching ? 0.3 : 0.1)
    });
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,15,${p.opacity})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,255,15,${0.08 * (1 - d / 100)})`; ctx.lineWidth = 0.3; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [isResearching]);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── Thinking Canvas ──────────────────────────────────────────────────────────
const agentNodes = [
  { color: C.cyan, icon: "search", title: "Search", shadow: C.cyan },
  { color: "#5878d4", icon: "auto_awesome", title: "Summariser", shadow: "#5878d4" },
  { color: C.amber, icon: "priority_high", title: "Critic", shadow: C.amber },
  { color: C.purple, icon: "edit", title: "Writer", shadow: C.purple },
  { color: C.green, icon: "add_circle", title: "FOR", shadow: C.green, border: C.green, iconColor: "#fff" },
  { color: C.crimson, icon: "remove_circle", title: "AGAINST", shadow: C.crimson, border: C.crimson, iconColor: "#fff" },
  { color: C.gold, icon: "gavel", title: "Judge", shadow: C.gold },
];

function ThinkingCanvas({ agentStatus, agentProgress }) {
  const nodeRefs = useRef([]);
  const animRef = useRef(null);
  useEffect(() => {
    let angle = 0;
    function rotateNodes() {
      angle += 0.005;
      nodeRefs.current.forEach((node, index) => {
        if (!node) return;
        const radius = 160, offset = (index / agentNodes.length) * Math.PI * 2;
        const x = Math.cos(angle + offset) * radius;
        const y = Math.sin(angle + offset) * radius;
        node.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      });
      animRef.current = requestAnimationFrame(rotateNodes);
    }
    rotateNodes();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const activeAgent = agentNodes.find(a => agentStatus?.toLowerCase().includes(a.title.toLowerCase()));
  const completedCount = agentProgress.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "40px 0" }}>
      <div style={{ width: 380, height: 380, borderRadius: "50%", border: "2px dashed rgba(0,255,15,0.2)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", zIndex: 10, background: "rgba(10,10,30,0.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,255,15,0.2)", borderRadius: "50%", width: 150, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,255,15,0.1)" }}>
          <Icon name="hub" style={{ color: C.green, fontSize: 32, marginBottom: 4, animation: "pulse-green 2s infinite" }} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.green, textTransform: "uppercase" }}>SYNTHESIZING</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{Math.round(completedCount * 14.2)}%</div>
        </div>
        {agentNodes.map((node, i) => {
          const completed = agentProgress.some(p => p.agent?.toLowerCase().includes(node.title.toLowerCase()));
          const isActive = activeAgent?.title === node.title;
          const angle = (i / agentNodes.length) * Math.PI * 2;
          const r = 160, x = Math.cos(angle) * r, y = Math.sin(angle) * r;
          return (
            <div key={node.title} ref={el => nodeRefs.current[i] = el} title={node.title}
              style={{ position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%,-50%)", width: isActive ? 44 : 36, height: isActive ? 44 : 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: completed ? node.color : "rgba(255,255,255,0.1)", boxShadow: completed ? `0 0 15px ${node.shadow}` : "none", border: isActive ? `2px solid ${node.color}` : node.border ? `1px solid ${node.border}` : "none", opacity: completed || isActive ? 1 : 0.3, transition: "all 0.5s", animation: isActive ? "pulse-green 1.5s infinite" : "none" }}>
              <Icon name={node.icon} style={{ color: node.iconColor || (completed ? "#0a0a1e" : C.textSecondary), fontSize: isActive ? 20 : 16 }} />
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, textAlign: "center" }}>
        {agentProgress.map((p, i) => <span key={i} style={{ color: C.green, margin: "0 6px" }}>✓ {p.agent}</span>)}
        {activeAgent && <span style={{ color: C.cyan }}>⚡ {activeAgent.title} working...</span>}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research", active: true },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{ position: "fixed", left: 0, top: 0, height: "100%", width: 56, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)", borderRight: "1px solid " + C.white10, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", zIndex: 20 }}>
      <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: C.green, cursor: "pointer", marginBottom: 32 }}><Icon name="chevron_right" style={{ fontSize: 22 }} /></button>
      {NAV.map(({ icon, label, path, active }) => (
        <div key={label} onClick={() => handleNav(path)} title={label} style={{ padding: "12px 0", cursor: "pointer", color: active ? C.green : C.onSurfaceVariant, width: "100%", display: "flex", justifyContent: "center" }}>
          <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
        </div>
      ))}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div onClick={() => handleNav('/research')} style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="add" style={{ fontSize: 16, color: C.void }} /></div>
        <div title={user?.username || 'Guest'} style={{ width: 30, height: 30, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,255,15,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="face" style={{ color: C.green, fontSize: 14 }} /></div>
        <div onClick={handleLogout} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}><Icon name="logout" style={{ fontSize: 14 }} /></div>
      </div>
    </aside>
  );

  return (
    <aside style={{ position: "fixed", left: 0, top: 0, height: "100%", width: 320, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)", borderRight: "1px solid " + C.white10, boxShadow: "0 0 20px rgba(0,255,15,0.1)", display: "flex", flexDirection: "column", padding: 24, zIndex: 20, transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.green, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>POLYNOUS</h1>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7, whiteSpace: "nowrap" }}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8 }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = C.textSecondary}>
          <Icon name="chevron_left" style={{ fontSize: 20 }} />
        </button>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
        {NAV.map(({ icon, label, path, active }) => (
          <div key={label} onClick={() => handleNav(path)} className={active ? "" : "nav-link"}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 9999, cursor: "pointer", color: active ? C.green : C.onSurfaceVariant, background: active ? "rgba(0,255,15,0.08)" : "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden" }}>
            <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{ borderTop: "1px solid " + C.white5, paddingTop: 24, marginTop: 24 }}>
        <button onClick={() => handleNav('/research')} style={{ width: "100%", padding: "12px", background: C.green, color: C.void, fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <Icon name="add" style={{ fontSize: 18, color: C.void, flexShrink: 0 }} />New Research
        </button>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,255,15,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="face" style={{ color: C.green, fontSize: 22 }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username || 'Guest'}</p>
            <button onClick={handleLogout} style={{ fontSize: 10, color: C.crimson, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", padding: 0 }}>Disconnect</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Parse answer text into structured sections ───────────────────────────────
function parseAnswer(text) {
  const summary = (() => {
    const m = text.match(/📋\s*SUMMARY[:\s]+([\s\S]*?)(?=🔑|⚠️|🎯|📚|$)/i);
    return m ? m[1].trim() : "";
  })();

  const findings = (() => {
    const m = text.match(/🔑\s*KEY FINDINGS[:\s]+([\s\S]*?)(?=⚠️|🎯|📚|$)/i);
    if (!m) return [];
    const raw = m[1].trim();

    // Strategy 1: newline-based bullets  (- text or • text)
    const byNewline = raw.split("\n")
      .filter(l => /^[-•]/.test(l.trim()))
      .map(l => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    if (byNewline.length > 1) return byNewline;

    // Strategy 2: inline bullet-dot separator  " • " used by the backend
    // Handles " • ", " •", "• " and the unicode bullet U+2022
    const byDot = raw
      .split(/\s*[•]\s*/)
      .map(s => s.trim())
      // strip leading citation tags like [1][2] if they sit at the very start
      .map(s => s.replace(/^(\[\d+\])+\s*/, "").trim())
      .filter(s => s.length > 15);
    if (byDot.length > 1) return byDot;

    // Strategy 3: split on " [n] " citation markers that signal new sentences
    const byCitation = raw
      .split(/(?<=\[\d+\])\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
    if (byCitation.length > 1) return byCitation;

    // Strategy 4: last resort — split on ". " sentence boundaries
    return raw
      .split(/\.\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .map(s => s.endsWith(".") ? s : s + ".");
  })();

  const limitations = (() => {
    const m = text.match(/⚠️\s*(?:LIMITATIONS|UNCERTAINTIES|CAVEATS)[:\s]+([\s\S]*?)(?=🎯|📚|$)/i);
    return m ? m[1].trim() : "";
  })();

  const parsedConf = (() => {
    const m = text.match(/🎯\s*CONFIDENCE[:\s]+(\d+)/i);
    return m ? parseInt(m[1]) : 0;
  })();

  const parsedSources = (() => {
    const m = text.match(/📚\s*SOURCES[:\s]+([\s\S]*?)$/i);
    if (!m) return [];
    return m[1].split("\n").map(l => l.trim()).filter(Boolean);
  })();

  const finalSummary = summary || (findings.length === 0 && !limitations ? text : "");

  return { summary: finalSummary, findings, limitations, parsedConf, parsedSources };
}

// ─── Parse limitations text into bullet points ────────────────────────────────
function parseLimitationPoints(text) {
  if (!text) return [];
  // Try splitting on sentence boundaries or existing bullets
  const lines = text.split(/\n|(?<=\.)\s+(?=[A-Z•\-])/);
  const points = lines
    .map(l => l.replace(/^[-•]\s*/, "").trim())
    .filter(l => l.length > 10);
  // If only one big blob, split on periods
  if (points.length <= 1) {
    return text.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 10).map(s => s.endsWith('.') ? s : s + '.');
  }
  return points;
}

// ─── Synapse corner dots ──────────────────────────────────────────────────────
function SynapseDots({ color = C.green }) {
  const positions = [
    { top: -2, left: -2 }, { top: -2, right: -2 },
    { bottom: -2, left: -2 }, { bottom: -2, right: -2 },
  ];
  return positions.map((pos, i) => (
    <span key={i} style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, ...pos }} />
  ));
}

function CountUpNumber({ target, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now(), duration = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(2, -10 * p);
      if (ref.current) ref.current.textContent = Math.round(target * ease) + "%";
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <span ref={ref} style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color, minWidth: 56 }}>0%</span>;
}

// ─── Neural Synthesis Report ──────────────────────────────────────────────────
function NeuralSynthesisReport({ query, answer, sources, confidence, onCopy, onNew }) {
  const { summary, findings, limitations, parsedConf, parsedSources } = parseAnswer(answer);
  const confValue = parsedConf || confidence;
  const confColor = confValue >= 80 ? C.green : confValue >= 60 ? C.amber : C.crimson;

  const forFindings = findings.filter((_, i) => i % 2 === 0);
  const againstFindings = findings.filter((_, i) => i % 2 !== 0);
  const allSources = parsedSources.length > 0 ? parsedSources : sources.map(s => typeof s === "string" ? s : s.title || "Source");
  const filled = Math.round(confValue / 10);
  const limitationPoints = parseLimitationPoints(limitations);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeSlideUp 0.5s ease" }}>

      {/* ── REPORT HEADER ── */}
      <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 28, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden", animation: "sectionIn 0.4s ease" }}>
        <SynapseDots color={C.green} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,255,15,0.1)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulseBrain 3s ease-in-out infinite" }}>
            <Icon name="psychology" style={{ color: C.green, fontSize: 32 }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "clamp(1rem,2.5vw,1.4rem)", textTransform: "uppercase", letterSpacing: "0.1em", color: C.onSurface, margin: "0 0 6px" }}>🧠 Neural Synthesis Report</h2>

            {/* ── INCREASED: Query line ── */}
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: C.green, marginBottom: 4 }}>
              QUERY: {query}
            </p>

            {/* ── INCREASED: Meta line ── */}
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textSecondary }}>
              Generated: {new Date().toLocaleDateString()} · Sources: {allSources.length} found
            </p>
          </div>
        </div>

        {/* ── INCREASED: Donut confidence score ── */}
        <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
          <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="55" cy="55" r="44" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle cx="55" cy="55" r="44" fill="transparent" stroke={confColor} strokeWidth="7"
              strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - confValue / 100)}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {/* ── INCREASED: big percentage number ── */}
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", lineHeight: 1 }}>{confValue}%</span>
            {/* ── INCREASED: Score label ── */}
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.cyan, textTransform: "uppercase", marginTop: 3, letterSpacing: "0.05em" }}>Score</span>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      {summary && (
        <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderLeft: `4px solid ${C.green}`, borderRadius: 14, padding: 28, position: "relative", animation: "sectionIn 0.5s 0.08s ease both" }}>
          <SynapseDots color={C.green} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="auto_awesome" style={{ fontSize: 16, color: C.green }} /> Executive Summary
          </div>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.85, color: C.onSurface, whiteSpace: "pre-wrap" }}>{summary}</p>
        </div>
      )}

      {/* ── FINDINGS: FOR + AGAINST grid ── */}
      {findings.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, animation: "sectionIn 0.5s 0.16s ease both" }}>

          {/* FOR column — Synthesis Findings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(0,255,15,0.08)", borderRadius: 9999, width: "fit-content" }}>
              <Icon name="verified" style={{ color: C.green, fontSize: 16 }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Synthesis Findings</span>
            </div>
            {(forFindings.length > 0 ? forFindings : findings).map((f, i) => (
              <div key={i} className="finding-card-green" style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 22px", position: "relative", boxShadow: "0 0 12px rgba(0,255,15,0.08)", transition: "border-color 0.2s" }}>
                <span style={{ position: "absolute", top: -2, left: -2, width: 4, height: 4, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />

                {/* Point number badge — replaces MEM_SEGMENT */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{
                    flexShrink: 0,
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: "rgba(0,255,15,0.12)",
                    border: `1px solid ${C.green}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Sora',sans-serif",
                    fontSize: 13, fontWeight: 800,
                    color: C.green,
                    marginTop: 2,
                  }}>{i + 1}</span>
                  <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.8, color: C.onSurface, fontWeight: 400 }}>{f}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AGAINST column — Debate Counter-Args */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,32,64,0.08)", borderRadius: 9999, width: "fit-content", alignSelf: "flex-end" }}>
              <Icon name="warning" style={{ color: C.crimson, fontSize: 16 }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.crimson, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Debate Counter-Args</span>
            </div>
            {againstFindings.length > 0 ? againstFindings.map((f, i) => (
              <div key={i} className="finding-card-crimson" style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 22px", position: "relative", boxShadow: "0 0 12px rgba(255,32,64,0.08)", transition: "border-color 0.2s" }}>
                <span style={{ position: "absolute", top: -2, right: -2, width: 4, height: 4, borderRadius: "50%", background: C.crimson, boxShadow: `0 0 8px ${C.crimson}` }} />

                {/* Point number badge — replaces DEB_VEC */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{
                    flexShrink: 0,
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,32,64,0.12)",
                    border: `1px solid ${C.crimson}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Sora',sans-serif",
                    fontSize: 13, fontWeight: 800,
                    color: C.crimson,
                    marginTop: 2,
                  }}>{i + 1}</span>
                  <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.8, color: C.onSurface, fontWeight: 400 }}>{f}</p>
                </div>
              </div>
            )) : (
              <div className="finding-card-crimson" style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 22px", boxShadow: "0 0 12px rgba(255,32,64,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,32,64,0.12)", border: `1px solid ${C.crimson}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800, color: C.crimson, marginTop: 2 }}>1</span>
                  <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.8, color: C.onSurface }}>Further debate analysis not yet available for this synthesis.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* If no structured findings, show parsed points or raw answer */}
      {findings.length === 0 && !summary && (
        <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,255,15,0.2)", borderLeft: `4px solid ${C.green}`, borderRadius: 14, padding: 28, animation: "sectionIn 0.5s 0.08s ease both" }}>
          <SynapseDots color={C.green} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>📋 Research Synthesis</div>
          {/* Try to split raw answer into points too */}
          {(() => {
            const rawPoints = answer
              .split(/\s*[•]\s*/)
              .map(s => s.replace(/^(\[\d+\])+\s*/, "").trim())
              .filter(s => s.length > 15);
            if (rawPoints.length > 1) {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {rawPoints.map((pt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,255,15,0.12)", border: `1px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800, color: C.green, marginTop: 2 }}>{i + 1}</span>
                      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, color: C.onSurface, lineHeight: 1.85 }}>{pt}</p>
                    </div>
                  ))}
                </div>
              );
            }
            return <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, color: "#c8d6e5", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{answer}</p>;
          })()}
        </div>
      )}

      {/* ── CONFIDENCE MATRIX ── */}
      <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 28px", animation: "sectionIn 0.5s 0.24s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ maxWidth: 320 }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: C.cyan, marginBottom: 8 }}>Confidence Matrix</h3>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.textSecondary }}>Aggregate certainty across {agentNodes.length} independent agent simulations.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: "50%",
                background: i < filled ? C.green : "rgba(255,255,255,0.08)",
                boxShadow: i < filled ? `0 0 12px ${C.green}` : "none",
                border: i >= filled ? "1px solid rgba(255,255,255,0.15)" : "none",
                animation: i < filled && i % 3 === 0 ? "pulse-green 2s infinite" : "none",
                transition: "all 0.3s"
              }} />
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: confColor }}>
          {confValue >= 80 ? "✓ High Confidence — Research synthesis is reliable" : confValue >= 60 ? "△ Moderate — Results are plausible but verify" : "⚠ Low Confidence — Treat with caution"}
        </div>
      </div>

      {/* ── CAVEATS & LIMITATIONS — itemized, bigger font ── */}
      {limitations && (
        <div style={{ background: "rgba(255,170,0,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,170,0,0.15)", borderLeft: `4px solid ${C.amber}`, borderRadius: 14, padding: "24px 28px", position: "relative", animation: "sectionIn 0.5s 0.32s ease both" }}>
          <SynapseDots color={C.amber} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.amber, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="warning" style={{ fontSize: 16, color: C.amber }} /> ⚠️ Caveats &amp; Limitations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {limitationPoints.length > 0 ? limitationPoints.map((point, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                {/* Numbered badge */}
                <span style={{
                  flexShrink: 0,
                  width: 28, height: 28,
                  borderRadius: "50%",
                  background: "rgba(255,170,0,0.12)",
                  border: `1px solid ${C.amber}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Sora',sans-serif",
                  fontSize: 13, fontWeight: 800,
                  color: C.amber,
                  marginTop: 2,
                }}>{i + 1}</span>
                <p style={{
                  fontFamily: "'Hanken Grotesk',sans-serif",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "rgba(255,200,100,0.9)",
                  fontStyle: "italic",
                }}>{point}</p>
              </div>
            )) : (
              <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.8, color: "rgba(255,200,100,0.85)", fontStyle: "italic" }}>{limitations}</p>
            )}
          </div>
        </div>
      )}

      {/* ── SOURCE CONSTELLATION ── */}
      {allSources.length > 0 && (
        <div style={{ animation: "sectionIn 0.5s 0.40s ease both" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 14 }}>📚 Source Constellation (Bibliography)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allSources.map((s, i) => (
              <div key={i} className="source-pill" style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,204,255,0.25)", borderRadius: 9999, padding: "7px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => navigator.clipboard.writeText(typeof s === "string" ? s : s.url || s)}>
                <Icon name="article" style={{ color: C.cyan, fontSize: 14 }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant }}>[{i + 1}] {typeof s === "string" ? s : s.title || "Source"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ACTIONS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, animation: "sectionIn 0.5s 0.48s ease both" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="action-btn" onClick={() => {
            const blob = new Blob([`POLYNOUS Neural Synthesis Report\nQuery: ${answer}\n\nGenerated: ${new Date().toLocaleDateString()}`], { type: "text/plain" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "polynous-report.txt"; a.click();
          }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999, color: C.onSurface, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, transition: "all 0.2s" }}>
            <Icon name="download" style={{ fontSize: 16 }} /> Export PDF
          </button>
          <button className="action-btn" onClick={() => {
            const json = JSON.stringify({ query, answer, confidence, sources: allSources, generated: new Date().toISOString() }, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "polynous-vectors.json"; a.click();
          }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999, color: C.onSurface, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, transition: "all 0.2s" }}>
            <Icon name="data_object" style={{ fontSize: 16 }} /> JSON Vector
          </button>
          <button className="copy-btn" onClick={onCopy} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999, color: C.onSurface, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, transition: "all 0.2s" }}>
            <Icon name="content_copy" style={{ fontSize: 16 }} /> Copy
          </button>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="share-btn" onClick={() => {
            if (navigator.share) navigator.share({ title: "POLYNOUS Research", text: answer });
            else navigator.clipboard.writeText(window.location.href);
          }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", background: C.green, color: C.void, fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontSize: 13, boxShadow: "0 0 20px rgba(0,255,15,0.3)", transition: "all 0.2s" }}>
            <Icon name="share" style={{ fontSize: 16, color: C.void }} /> Share Research
          </button>
          <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999, color: C.onSurfaceVariant, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, transition: "all 0.2s" }}>
            <Icon name="refresh" style={{ fontSize: 16 }} /> New Research
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── All 20+ suggestion questions ────────────────────────────────────────────
const ALL_QUESTIONS = [
  "What is artificial intelligence?",
  "How does quantum computing work?",
  "Explain CRISPR gene editing",
  "Is nuclear energy safe?",
  "How does blockchain work?",
  "What causes climate change?",
  "How does the human brain store memories?",
  "What is dark matter and dark energy?",
  "How do mRNA vaccines work?",
  "What is the Fermi Paradox?",
  "How does general relativity work?",
  "What is consciousness from a neuroscience perspective?",
  "How does CRISPR compare to older gene therapy?",
  "What are the risks of artificial general intelligence?",
  "How do black holes form and what happens inside them?",
  "What is the multiverse theory?",
  "How does the gut microbiome affect mental health?",
  "What caused the 2008 financial crisis?",
  "How does photosynthesis work at a molecular level?",
  "What is epigenetics and how does it affect inheritance?",
  "How do neural networks learn?",
  "What is the theory of everything in physics?",
  "How does CERN's Large Hadron Collider work?",
  "What are psychedelics doing to the brain?",
];

// Shuffle helper
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Shuffling Pills Component ────────────────────────────────────────────────
function ShufflingPills({ onSelect }) {
  const VISIBLE = 6; // how many pills shown at once
  const [displayed, setDisplayed] = useState(() => shuffleArray(ALL_QUESTIONS).slice(0, VISIBLE));
  const [fadingOut, setFadingOut] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFadingOut(true);
      setTimeout(() => {
        setDisplayed(shuffleArray(ALL_QUESTIONS).slice(0, VISIBLE));
        setFadingOut(false);
      }, 420); // fade-out duration before swap
    }, 4000); // shuffle every 4s
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
      marginBottom: 32,
      opacity: fadingOut ? 0 : 1,
      transform: fadingOut ? "translateY(6px)" : "translateY(0)",
      transition: "opacity 0.42s ease, transform 0.42s ease",
    }}>
      {displayed.map((pill, i) => (
        <button
          key={pill}
          onClick={() => onSelect(pill)}
          style={{
            padding: "11px 22px",
            borderRadius: 30,
            background: "rgba(10,10,30,0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,255,15,0.18)",
            color: "rgba(200,210,230,0.85)",
            cursor: "pointer",
            fontFamily: "'Hanken Grotesk',sans-serif",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.4,
            transition: "all 0.22s ease",
            letterSpacing: "0.01em",
            // stagger fade-in on initial mount
            animation: `fadeSlideUp 0.4s ${i * 60}ms ease both`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(0,255,15,0.1)";
            e.currentTarget.style.borderColor = "rgba(0,255,15,0.5)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,255,15,0.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(10,10,30,0.7)";
            e.currentTarget.style.borderColor = "rgba(0,255,15,0.18)";
            e.currentTarget.style.color = "rgba(200,210,230,0.85)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {pill}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ResearchInterface({ user, onNavigate, onLogout }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentProgress, setAgentProgress] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState([]);
  const [copyLabel, setCopyLabel] = useState("Copy");
  // Page-load fade-in
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const startResearch = async (q) => {
    const qText = typeof q === "string" ? q : query;
    if (!qText.trim() || loading) return;
    setLoading(true); setAnswer(""); setSources([]); setConfidence(0); setAgentProgress([]); setAgentStatus("Initializing...");

    try {
      const res = await fetch("http://localhost:8000/ask-stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qText, debate_mode: false })
      });
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let fullAnswer = "", srcList = [], confScore = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "start") setAgentStatus("Neural network activated");
              else if (data.type === "progress") { setAgentStatus(data.message); setAgentProgress(prev => [...prev, data]); }
              else if (data.type === "token") { fullAnswer += (data.content || ""); setAnswer(fullAnswer); }
              else if (data.type === "citations") srcList = data.citations || [];
              else if (data.type === "confidence") confScore = data.score || 0;
              else if (data.type === "end") {
                setAnswer(fullAnswer); setSources(srcList); setConfidence(confScore); setAgentStatus("");
                setHistory(prev => [{ query: qText, confidence: confScore, date: new Date().toLocaleDateString() }, ...prev].slice(0, 10));
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) { setAgentStatus("Connection error"); }
    finally { setLoading(false); }
  };

  const handleSuggestion = (pill) => { setQuery(pill); startResearch(pill); };
  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 1500);
  };
  const handleNew = () => { setAnswer(""); setQuery(""); setSources([]); setConfidence(0); };
  const getConfColor = (v) => v >= 80 ? C.green : v >= 60 ? C.amber : C.crimson;

  return (
    <div style={{
      minHeight: "100vh", background: C.void, position: "relative", overflow: "auto",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.65s ease, transform 0.65s ease",
    }}>
      <Styles />
      <NeuralCanvas isResearching={loading} />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ marginLeft: sidebarCollapsed ? 56 : 320, padding: "24px 32px", position: "relative", zIndex: 10, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 10, animation: "fadeSlideUp 0.6s ease both" }}>
            <h1 style={{
              fontFamily: "'Sora',sans-serif",
              fontSize: "clamp(2rem,4.5vw,3rem)",
              fontWeight: 800,
              color: C.green,
              margin: "0 0 10px",
              letterSpacing: "-0.03em",
              textShadow: "0 0 40px rgba(0,255,15,0.3)",
            }}>🔬 Neural Research Engine</h1>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 14,
              color: C.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}>7 Agents. One Answer. Infinite Knowledge.</p>
          </div>

          {/* ── Search ── */}
          <div style={{ position: "relative", marginBottom: 28, animation: "fadeSlideUp 0.6s 0.1s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(25,25,46,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,255,15,0.3)", borderRadius: 50, padding: "18px 26px", boxShadow: "0 0 30px rgba(0,255,15,0.1)" }}>
              <span style={{ color: C.green, marginRight: 16, fontSize: 22 }}>🧠</span>
              <input
                type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask any research question..."
                onKeyDown={e => e.key === "Enter" && startResearch()}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17 }}
                disabled={loading}
              />
              <button onClick={() => startResearch()} disabled={loading || !query.trim()} style={{ background: loading ? "#333" : C.green, color: C.void, padding: "13px 32px", borderRadius: 30, border: "none", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 25px rgba(0,255,15,0.3)", transition: "all 0.3s" }}>
                {loading ? "Thinking..." : "Research →"}
              </button>
            </div>
          </div>

          {/* ── Shuffling Pills ── */}
          {!loading && !answer && (
            <div style={{ animation: "fadeSlideUp 0.6s 0.2s ease both" }}>
              <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16, opacity: 0.6 }}>
                — try one of these —
              </p>
              <ShufflingPills onSelect={handleSuggestion} />
            </div>
          )}

          {/* ── Thinking Canvas ── */}
          {loading && <ThinkingCanvas agentStatus={agentStatus} agentProgress={agentProgress} />}

          {/* ── Neural Synthesis Report ── */}
          {answer && !loading && (
            <NeuralSynthesisReport
              query={query} answer={answer} sources={sources} confidence={confidence}
              onCopy={handleCopy} onNew={handleNew}
            />
          )}

          {/* ── Research History ── */}
          {history.length > 0 && (
            <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid " + C.white10 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📅 Research History</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                {history.map((h, i) => (
                  <div key={i} className="history-card" onClick={() => { setQuery(h.query); startResearch(h.query); }}
                    style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: getConfColor(h.confidence), marginBottom: 4 }}>{h.confidence}% confidence</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.query}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, marginTop: 4 }}>{h.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}