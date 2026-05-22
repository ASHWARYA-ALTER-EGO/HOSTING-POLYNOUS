import { useRef, useEffect, useState, useCallback } from "react";

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  green:   "#00ff0f",
  cyan:    "#00ccff",
  crimson: "#ff2040",
  void:    "#0a0a1e",
  surface: "#111125",
  surfaceContainer: "#1e1e32",
  surfaceContainerHigh: "#28283d",
  onSurface: "#e2e0fc",
  onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa",
  white10: "rgba(255,255,255,0.1)",
  white5:  "rgba(255,255,255,0.05)",
};

// ─── Global Styles ────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0a0a1e; color: #e2e0fc; font-family: 'Hanken Grotesk', sans-serif; overflow-x: hidden; }
      ::selection { background: rgba(0,255,15,0.25); }
      a { text-decoration: none; }

      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,15,0.2); border-radius: 10px; }

      @keyframes pulse-synapse {
        0%,100% { opacity: 0.4; transform: scale(1); }
        50%      { opacity: 1;   transform: scale(1.5); }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulseGreen {
        0%,100% { opacity: 0.6; }
        50%      { opacity: 1; }
      }

      .synapse-pulse { animation: pulse-synapse 2s infinite ease-in-out; }
      .fade-up       { animation: fadeSlideUp 0.5s ease forwards; }
      .text-pulse    { animation: pulseGreen 2s infinite; }

      .nav-link { transition: color 0.2s, background 0.2s; }
      .nav-link:hover { color: #00ff0f !important; background: rgba(255,255,255,0.05) !important; }

      .stat-card:hover .stat-bg-icon { opacity: 0.1 !important; }
      .timeline-item-green:hover  { border-color: rgba(0,255,15,0.3) !important; }
      .timeline-item-crimson:hover { border-color: rgba(255,32,64,0.3) !important; }
      .timeline-item-green:hover  h4 { color: #00ff0f !important; }
      .timeline-item-crimson:hover h4 { color: #ff2040 !important; }
      .timeline-item-green:hover  .arrow-btn  { opacity: 1 !important; }
      .timeline-item-crimson:hover .arrow-btn { opacity: 1 !important; }

      .suggestion-green:hover  { background: rgba(0,255,15,0.05) !important; }
      .suggestion-cyan:hover   { background: rgba(0,204,255,0.05) !important; }
      .suggestion-crimson:hover { background: rgba(255,32,64,0.05) !important; }
      .suggestion-green:hover  .suggest-btn { transform: translateX(4px); }
      .suggestion-cyan:hover   .suggest-btn { transform: translateX(4px); }
      .suggestion-crimson:hover .suggest-btn { transform: translateX(4px); }

      .filter-tab-active  { background: #00ff0f; color: #0a0a1e; font-weight: 700; }
      .filter-tab-inactive { color: #b9ccb0; }
      .filter-tab-inactive:hover { background: rgba(255,255,255,0.05); }

      .new-stream-btn:hover { transform: scale(1.05); }
      .sync-btn:hover { background: rgba(0,204,255,0.1); }
    `}</style>
  );
}

// ─── Shared: Glass Panel ──────────────────────────────────────
function GlassPanel({ children, style, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "rgba(10,10,30,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${C.white10}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Shared: Synapse Dot ──────────────────────────────────────
function SynapseDot({ style, color = C.cyan }) {
  return (
    <div
      className="synapse-pulse"
      style={{
        position: "absolute",
        width: 4, height: 4,
        background: color,
        borderRadius: "50%",
        boxShadow: `0 0 8px ${color}`,
        ...style,
      }}
    />
  );
}

// ─── Shared: Material Icon ────────────────────────────────────
function Icon({ name, style }) {
  return (
    <span
      style={{
        fontFamily: "Material Symbols Outlined",
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// ─── Neural Background Canvas ─────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [], animId;
    const N = 120;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    resize();

    class P {
      constructor() { this.reset(); }
      reset() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.shadowBlur = 10; ctx.shadowColor = C.green;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < N; i++) particles.push(new P());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update(); p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(0,255,15,${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

// ─── Interest Graph Canvas ────────────────────────────────────
function InterestGraph() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let nodes = [], animId;

    const LABELS = ["AI", "ML", "Ethics", "Tech", "Bios", "Quantum", "Neuro", "Policy"];

    const init = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      nodes = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 4,
        color: Math.random() > 0.4 ? C.green : C.crimson,
        pulse: Math.random() * Math.PI,
        label: LABELS[Math.floor(Math.random() * LABELS.length)],
      }));
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0,204,255,0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        n.pulse += 0.03;
        const s = n.size + Math.sin(n.pulse) * 3;
        ctx.shadowBlur = 15; ctx.shadowColor = n.color;
        ctx.fillStyle = n.color;
        ctx.beginPath(); ctx.arc(n.x, n.y, s, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText(n.label, n.x + 10, n.y + 4);
      });
      animId = requestAnimationFrame(draw);
    };

    init();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", init); };
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", borderRadius: 12 }} />;
}

// ─── Sidebar ──────────────────────────────────────────────────
const NAV = [
  { icon: "account_tree", label: "Knowledge Graph",  href: "#" },
  { icon: "travel_explore", label: "Semantic Search", href: "#" },
  { icon: "timeline",      label: "Timeline",         href: "#" },
  { icon: "database",      label: "Memory Bank",      href: "#", active: true },
  { icon: "settings",      label: "Settings",         href: "#" },
];

function Sidebar() {
  return (
    <aside style={{
      position: "fixed", left: 0, top: 0,
      height: "100%", width: 320,
      background: "rgba(10,10,30,0.6)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRight: `1px solid ${C.white10}`,
      boxShadow: "0 0 20px rgba(0,255,15,0.1)",
      display: "flex", flexDirection: "column",
      padding: 24, zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: C.green, letterSpacing: "-0.03em" }}>
          POLYNOUS
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7 }}>
          Cerebral Vitality Engine
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ icon, label, href, active }) => (
          <a
            key={label} href={href}
            className="nav-link"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 9999,
              color: active ? C.green : C.onSurfaceVariant,
              background: active ? "rgba(0,255,15,0.08)" : "transparent",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              fontWeight: active ? 700 : 400,
            }}
          >
            <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
            {label}
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${C.white5}`, paddingTop: 24, marginTop: 24 }}>
        <button
          className="new-stream-btn"
          style={{
            width: "100%", padding: "12px", background: C.green,
            color: C.void, fontWeight: 700, borderRadius: 9999,
            border: "none", cursor: "pointer",
            fontFamily: "'Sora', sans-serif", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.2s",
          }}
        >
          <Icon name="add" style={{ fontSize: 18, color: C.void }} />
          New Research Stream
        </button>

        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: C.surfaceContainer,
            border: "1px solid rgba(0,255,15,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="face" style={{ color: C.green, fontSize: 22 }} />
          </div>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>
              User Neural Profile
            </p>
            <p className="text-pulse" style={{ fontSize: 10, color: C.green }}>
              Neural Sync: 98.4%
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <GlassPanel
      className="stat-card fade-up"
      style={{ padding: 24, borderRadius: 16, position: "relative", overflow: "hidden", cursor: "default" }}
    >
      <SynapseDot style={{ top: -2, left: -2 }} color={color} />
      <SynapseDot style={{ bottom: -2, right: -2 }} color={color} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Icon name={icon} style={{ color, fontSize: 28, marginBottom: 8 }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 4 }}>
          {value}
        </span>
      </div>
      {/* Ghost icon */}
      <div className="stat-bg-icon" style={{
        position: "absolute", right: -16, bottom: -16,
        opacity: 0.05, transition: "opacity 0.3s", pointerEvents: "none",
      }}>
        <Icon name={icon} style={{ fontSize: 96, color }} />
      </div>
    </GlassPanel>
  );
}

// ─── Timeline Item ────────────────────────────────────────────
function TimelineItem({ title, time, excerpt, tags, color, colorClass }) {
  return (
    <GlassPanel
      className={`${colorClass} fade-up`}
      style={{ padding: 24, borderRadius: 16, display: "flex", gap: 24, alignItems: "flex-start", cursor: "pointer", transition: "border-color 0.2s" }}
    >
      {/* Connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4, flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}`, marginBottom: 8 }} />
        <div style={{ width: 2, height: 80, background: `linear-gradient(to bottom, ${color}80, transparent)` }} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", transition: "color 0.2s", marginRight: 12 }}>
            {title}
          </h4>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color, flexShrink: 0 }}>{time}</span>
        </div>
        <p style={{ color: C.onSurfaceVariant, fontSize: 14, lineHeight: 1.6, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {excerpt}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.map(t => (
            <span key={t} style={{
              padding: "2px 8px", borderRadius: 4,
              background: C.surfaceContainer,
              border: `1px solid ${C.white5}`,
              color: C.onSurfaceVariant,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            }}>{t}</span>
          ))}
        </div>
      </div>
      {/* Arrow */}
      <button className="arrow-btn" style={{ opacity: 0, transition: "opacity 0.2s", background: "none", border: "none", cursor: "pointer", alignSelf: "center", flexShrink: 0 }}>
        <Icon name="arrow_forward_ios" style={{ color: C.onSurfaceVariant, fontSize: 18 }} />
      </button>
    </GlassPanel>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────
function SuggestionCard({ type, title, subtitle, btnLabel, btnIcon, color, colorClass }) {
  return (
    <GlassPanel
      className={`${colorClass} fade-up`}
      style={{ padding: 24, borderRadius: 16, borderLeft: `4px solid ${color}`, cursor: "pointer", transition: "background 0.2s" }}
    >
      <h5 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
        {type}
      </h5>
      <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        {title}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.onSurfaceVariant, marginBottom: 16 }}>
        {subtitle}
      </p>
      <button
        className="suggest-btn"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          color, background: "none", border: "none", cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          transition: "transform 0.2s",
        }}
      >
        {btnLabel} <Icon name={btnIcon} style={{ fontSize: 16, color }} />
      </button>
    </GlassPanel>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function MemoryBank() {
  const [activeTab, setActiveTab] = useState("All Activity");
  const [stats, setStats] = useState({ sessions: "—", debates: "—", confidence: "—", topics: "—" });
  const [syncing, setSyncing] = useState(false);

  const fetchStats = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("http://localhost:8000/memory/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const d = await res.json();
        setStats({
          sessions:   d.sessions?.toLocaleString() ?? "1,284",
          debates:    d.debates  ?? "42",
          confidence: d.confidence ? `${d.confidence}%` : "94.2%",
          topics:     d.topics   ?? "312",
        });
      }
    } catch {
      // fallback to placeholders if backend isn't up
      setStats({ sessions: "1,284", debates: "42", confidence: "94.2%", topics: "312" });
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const TABS = ["All Activity", "Research", "Debates"];

  return (
    <>
      <GlobalStyles />
      <NeuralCanvas />
      <Sidebar />

      <main style={{
        marginLeft: 320,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 1200,
        position: "relative",
        zIndex: 10,
      }}>

        {/* ── Header ────────────────────────────────────── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 700, color: "#fff" }}>
              Neural Memory Bank
            </h2>
            <p style={{ color: C.onSurfaceVariant, fontSize: 15, marginTop: 4 }}>
              Archived cognitive nodes and synthesized insights.
            </p>
          </div>
          <button
            className="sync-btn"
            onClick={fetchStats}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: "rgba(10,10,30,0.6)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${C.white10}`,
              borderRadius: 9999,
              color: C.cyan, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              transition: "background 0.2s",
            }}
          >
            <Icon name="refresh" style={{ color: C.cyan, fontSize: 16 }} />
            {syncing ? "Syncing..." : "Sync Nodes"}
          </button>
        </header>

        {/* ── Stats Grid ────────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatCard icon="psychology" label="Sessions"   value={stats.sessions}   color={C.green}   />
          <StatCard icon="forum"      label="Debates"    value={stats.debates}    color={C.crimson} />
          <StatCard icon="analytics"  label="Confidence" value={stats.confidence} color={C.cyan}    />
          <StatCard icon="label"      label="Topics"     value={stats.topics}     color="#00e60b"   />
        </section>

        {/* ── Interest Graph ────────────────────────────── */}
        <GlassPanel style={{ padding: 24, borderRadius: 16, height: 400, position: "relative" }}>
          <SynapseDot style={{ top: 16, left: 16 }} />
          <SynapseDot style={{ bottom: 16, right: 16 }} />
          <div style={{ position: "absolute", top: 24, left: 24, zIndex: 2 }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              Neural Interest Graph
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.onSurfaceVariant }}>
              Real-time synaptic mapping of research focus
            </p>
          </div>
          <InterestGraph />
        </GlassPanel>

        {/* ── Filter Bar ────────────────────────────────── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Cluster tags */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Active Clusters:
            </span>
            {[
              { label: "Artificial Intelligence", color: C.green },
              { label: "Bio-Ethics",              color: C.cyan   },
              { label: "Quantum Computing",       color: C.crimson },
            ].map(({ label, color }) => (
              <span key={label} style={{
                padding: "6px 16px", borderRadius: 9999,
                border: `1px solid ${color}4d`,
                background: `${color}0d`,
                color, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                cursor: "pointer",
              }}>
                {label}
              </span>
            ))}
            <span style={{
              padding: "6px 16px", borderRadius: 9999,
              border: `1px solid ${C.white10}`,
              background: C.white5,
              color: C.onSurfaceVariant,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: "pointer",
            }}>
              + 12 more
            </span>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: "inline-flex", gap: 4, padding: 4,
            background: "rgba(10,10,30,0.6)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${C.white10}`,
            borderRadius: 9999, width: "fit-content",
          }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={tab === activeTab ? "filter-tab-active" : "filter-tab-inactive"}
                style={{
                  padding: "8px 24px", borderRadius: 9999,
                  border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {/* ── Timeline ──────────────────────────────────── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Date divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, borderTop: `1px solid ${C.white10}` }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.onSurfaceVariant }}>
              MAY 24, 2024
            </span>
            <div style={{ flex: 1, borderTop: `1px solid ${C.white10}` }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(activeTab === "All Activity" || activeTab === "Research") && (
              <TimelineItem
                title="Neural Plasticity in LLM Architectures"
                time="09:42 AM"
                excerpt="Inquiry regarding the adaptive weight mechanisms of Transformer models during zero-shot learning phase and their similarity to mammalian cortical restructuring."
                tags={["Machine Learning", "Neuroscience"]}
                color={C.green}
                colorClass="timeline-item-green"
              />
            )}
            {(activeTab === "All Activity" || activeTab === "Debates") && (
              <TimelineItem
                title="Sovereignty of Algorithmic Governance"
                time="08:15 AM"
                excerpt="Heated debate session regarding the ethical implications of autonomous fiscal decision-making by decentralized AI clusters in the public sector."
                tags={["Ethics", "Politics"]}
                color={C.crimson}
                colorClass="timeline-item-crimson"
              />
            )}
          </div>
        </section>

        {/* ── Suggested Paths ───────────────────────────── */}
        <section style={{ marginTop: 8, paddingBottom: 48 }}>
          <h3 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff",
            marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
          }}>
            <Icon name="auto_awesome" style={{ color: C.cyan, fontSize: 24 }} />
            Suggested Synaptic Paths
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            <SuggestionCard
              type="Research Path"
              title="Carbon-Neutral Compute Fabrics"
              subtitle="Based on your recent interest in hardware efficiency."
              btnLabel="Explore Node"
              btnIcon="north_east"
              color={C.green}
              colorClass="suggestion-green"
            />
            <SuggestionCard
              type="New Domain"
              title="Exoplanet Atmospheric Synthesis"
              subtitle="Your chemistry background suggests a high affinity."
              btnLabel="Initialize"
              btnIcon="bolt"
              color={C.cyan}
              colorClass="suggestion-cyan"
            />
            <SuggestionCard
              type="Debate Challenge"
              title="The Singularity Paradox"
              subtitle="High-entropy topic awaiting your critical perspective."
              btnLabel="Join Debate"
              btnIcon="crisis_alert"
              color={C.crimson}
              colorClass="suggestion-crimson"
            />
          </div>
        </section>

      </main>
    </>
  );
}