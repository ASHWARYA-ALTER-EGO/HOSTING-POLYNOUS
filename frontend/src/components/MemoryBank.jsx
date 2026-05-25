import { useRef, useEffect, useState, useCallback } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040",
  void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  surfaceContainerHigh: "#28283d", onSurface: "#e2e0fc",
  onSurfaceVariant: "#b9ccb0", textSecondary: "#8899aa",
  white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

const RESEARCH_PATHS = [
  "Deep Learning Neural Architectures", "Quantum Machine Learning Applications",
  "CRISPR Gene Editing Advances", "Blockchain Consensus Mechanisms",
  "Fusion Energy Breakthroughs", "Autonomous Vehicle Safety Systems",
  "Synthetic Biology Ethical Frameworks", "Neuromorphic Computing Hardware",
  "Graphene Semiconductor Applications", "mRNA Vaccine Platform Technology",
];
const NEW_DOMAINS = [
  "Space Colonization Ethics", "Ocean Floor Mining Technology",
  "Quantum Biology Frontiers", "Atmospheric Carbon Capture Systems",
  "Brain-Computer Interface Ethics", "Lab-Grown Meat Production",
  "Asteroid Mining Economics", "Digital Consciousness Transfer",
  "Deep Sea Biotechnology", "Underground City Architecture",
];
const DEBATE_CHALLENGES = [
  "Should AI development be regulated globally?",
  "Is nuclear energy the solution to climate change?",
  "Should we colonize Mars?",
  "Are cryptocurrencies the future of finance?",
  "Should genetic engineering be allowed in humans?",
  "Is universal basic income economically viable?",
];

const shuffleArray = (arr) => { const s = [...arr]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; };
const getRandomSuggestions = () => {
  const r = shuffleArray(RESEARCH_PATHS), d = shuffleArray(NEW_DOMAINS), db = shuffleArray(DEBATE_CHALLENGES);
  return [
    { type: "Research Path", topic: r[0], color: C.green, mode: "research", desc: "Based on your neural interest profile and research patterns." },
    { type: "New Domain", topic: d[0], color: C.cyan, mode: "research", desc: "Your cognitive patterns suggest high affinity for this emerging field." },
    { type: "Debate Challenge", topic: db[0], color: C.crimson, mode: "debate", desc: "High-entropy topic awaiting your critical perspective and analysis." },
  ];
};

function Styles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1e;color:#e2e0fc;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
    ::selection{background:rgba(0,255,15,0.25)}a{text-decoration:none}
    @keyframes pulse-synapse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes carouselFade{0%{opacity:0.6;transform:scale(0.98)}50%{opacity:1;transform:scale(1)}100%{opacity:0.6;transform:scale(0.98)}}
    .synapse-pulse{animation:pulse-synapse 2s infinite ease-in-out}
    .fade-up{animation:fadeSlideUp 0.5s ease forwards}
    .carousel-card{animation:carouselFade 4s ease-in-out infinite}
    .nav-link{transition:color 0.2s,background 0.2s;cursor:pointer}
    .nav-link:hover{color:#00ff0f!important;background:rgba(255,255,255,0.05)!important}
    .filter-tab-active{background:#00ff0f;color:#0a0a1e;font-weight:700}
    .filter-tab-inactive{color:#b9ccb0}
    .filter-tab-inactive:hover{background:rgba(255,255,255,0.05)}
    .new-stream-btn:hover{transform:scale(1.05)}
    .sync-btn:hover{background:rgba(0,204,255,0.1)}
  `}</style>;
}

function GlassPanel({ children, style, className, onClick }) {
  return <div onClick={onClick} className={className || ""} style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 16, ...(style || {}) }}>{children}</div>
}

function Icon({ name, style }) {
  return <span style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight: 1, ...(style || {}) }}>{name}</span>
}

function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; const ctx = c.getContext("2d"); let pts = [], id; const N = 100;
    const rs = () => { c.width = window.innerWidth; c.height = window.innerHeight };
    window.addEventListener("resize", rs); rs();
    for (let i = 0; i < N; i++) pts.push({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, size: Math.random() * 2 + 1 });
    const lp = () => { ctx.clearRect(0, 0, c.width, c.height); pts.forEach((p, i) => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > c.width) p.vx *= -1; if (p.y < 0 || p.y > c.height) p.vy *= -1; ctx.shadowBlur = 10; ctx.shadowColor = C.green; ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(p.x - pts[j].x, p.y - pts[j].y); if (d < 100) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = "rgba(0,255,15," + (1 - d / 100) + ")"; ctx.lineWidth = 0.5; ctx.stroke(); } } }); id = requestAnimationFrame(lp); }; lp();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", rs); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
}

// ─── COLLAPSIBLE SIDEBAR ──────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "travel_explore", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory", active: true },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];

  const handleNav = (path) => { if (onNavigate) onNavigate(path); else window.location.href = path; };
  const handleLogout = () => { if (onLogout) onLogout(); else { localStorage.clear(); window.location.href = '/'; } };

  if (collapsed) {
    return (
      <aside style={{ position: "fixed", left: 0, top: 0, height: "100%", width: 56, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)", borderRight: "1px solid " + C.white10, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", zIndex: 20, transition: "width 0.3s ease" }}>
        <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 18, marginBottom: 24, padding: 8 }} title="Expand sidebar"><Icon name="chevron_right" style={{ fontSize: 22 }} /></button>
        {NAV.map(({ icon, label, path, active }) => (<div key={label} onClick={() => handleNav(path)} title={label} style={{ padding: "10px 0", cursor: "pointer", color: active ? C.green : C.onSurfaceVariant, width: "100%", display: "flex", justifyContent: "center" }}><Icon name={icon} style={{ fontSize: 20, color: "inherit" }} /></div>))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div onClick={() => handleNav('/research')} title="New Research" style={{ width: 36, height: 36, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="add" style={{ fontSize: 18, color: C.void }} /></div>
          <div title={user?.username || 'Guest'} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,255,15,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="face" style={{ color: C.green, fontSize: 16 }} /></div>
          <div onClick={handleLogout} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}><Icon name="logout" style={{ fontSize: 16 }} /></div>
        </div>
      </aside>
    );
  }

  return (
    <aside style={{ position: "fixed", left: 0, top: 0, height: "100%", width: 320, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)", borderRight: "1px solid " + C.white10, boxShadow: "0 0 20px rgba(0,255,15,0.1)", display: "flex", flexDirection: "column", padding: 24, zIndex: 20, transition: "width 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.green, letterSpacing: "-0.03em" }}>POLYNOUS</h1>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7 }}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", fontSize: 14, padding: 4, marginTop: 4 }} title="Collapse sidebar"><Icon name="chevron_left" style={{ fontSize: 20 }} /></button>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ icon, label, path, active }) => (
          <div key={label} onClick={() => handleNav(path)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 9999, cursor: "pointer", color: active ? C.green : C.onSurfaceVariant, background: active ? "rgba(0,255,15,0.08)" : "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.2s" }}
            onMouseEnter={e => { if (!active) { e.target.style.color = C.green; e.target.style.background = "rgba(255,255,255,0.05)" } }}
            onMouseLeave={e => { if (!active) { e.target.style.color = C.onSurfaceVariant; e.target.style.background = "transparent" } }}>
            <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />{label}
          </div>
        ))}
      </nav>
      <div style={{ borderTop: "1px solid " + C.white5, paddingTop: 24, marginTop: 24 }}>
        <button onClick={() => handleNav('/research')} style={{ width: "100%", padding: "12px", background: C.green, color: C.void, fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.2s" }}
          onMouseEnter={e => e.target.style.transform = "scale(1.03)"} onMouseLeave={e => e.target.style.transform = "scale(1)"}>
          <Icon name="add" style={{ fontSize: 18, color: C.void }} />New Research
        </button>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,255,15,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="face" style={{ color: C.green, fontSize: 22 }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username || 'Guest'}</p>
            <button onClick={handleLogout} style={{ fontSize: 10, color: C.crimson, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", padding: 0 }}>Disconnect</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <GlassPanel className="stat-card fade-up" style={{ padding: 24, borderRadius: 16, textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.onSurfaceVariant, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 700, color: color || "#fff", marginTop: 4 }}>{value}</div>
    </GlassPanel>
  );
}

export default function MemoryBank({ user, onNavigate, onStartResearch, onLogout }) {
  const [activeTab, setActiveTab] = useState("All Activity");
  const [stats, setStats] = useState(null);
  const [interests, setInterests] = useState([]);
  const [history, setHistory] = useState([]);
  const [debates, setDebates] = useState([]);
  const [suggestions, setSuggestions] = useState(getRandomSuggestions());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const userId = "guest_user";

  useEffect(() => { const interval = setInterval(() => setSuggestions(getRandomSuggestions()), 4000); return () => clearInterval(interval); }, []);

  const handleTopicClick = (topic, mode) => {
    if (mode === 'debate') window.location.href = '/debate?topic=' + encodeURIComponent(topic);
    else window.location.href = '/research?query=' + encodeURIComponent(topic);
  };

  const fetchAllData = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("http://localhost:8000/memory/user/" + userId + "?username=" + (user?.username || 'Guest'));
      const [sR, iR, hR, dR] = await Promise.all([
        fetch("http://localhost:8000/memory/stats/" + userId), fetch("http://localhost:8000/memory/interests/" + userId),
        fetch("http://localhost:8000/memory/history/" + userId), fetch("http://localhost:8000/memory/debates/" + userId)
      ]);
      if (sR.ok) setStats(await sR.json());
      if (iR.ok) setInterests((await iR.json()).interests || []);
      if (hR.ok) setHistory((await hR.json()).history || []);
      if (dR.ok) setDebates((await dR.json()).debates || []);
    } catch (e) { console.error(e) }
    finally { setLoading(false); setSyncing(false); }
  }, [userId, user]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const getConfColor = (v) => { if (v >= 80) return C.green; if (v >= 60) return '#ffaa00'; return C.crimson; };

  const groupedHistory = () => {
    const g = {};
    history.forEach(h => { const d = h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'; if (!g[d]) g[d] = []; g[d].push({ ...h, kind: 'research' }); });
    debates.forEach(d => { const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'; if (!g[date]) g[date] = []; g[date].push({ query: d.topic, mode: 'debate', confidence: Math.max(d.for_score, d.against_score) * 10, kind: 'debate', debateData: d }); });
    return g;
  };

  const TABS = ["All Activity", "Research", "Debates"];
  const grouped = groupedHistory();

  if (loading) return <><Styles /><NeuralCanvas /><div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div><div style={{ color: C.green, fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600 }}>Loading neural memories...</div></div></div></>;

  return (
    <>
      <Styles /><NeuralCanvas />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <main style={{ marginLeft: 320, padding: 24, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200, position: "relative", zIndex: 10, transition: "margin-left 0.3s ease" }}>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Neural Memory Bank</h2>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: C.onSurfaceVariant, fontSize: 15, marginTop: 4 }}>Your research journey, visualized as a living knowledge graph.</p>
          </div>
          <button className="sync-btn" onClick={fetchAllData} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 9999, color: C.cyan, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
            <Icon name="refresh" style={{ color: C.cyan, fontSize: 16 }} />{syncing ? "Syncing..." : "Sync Nodes"}
          </button>
        </header>

        {stats && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <StatCard icon="🧠" label="Sessions" value={stats.total_research || 0} color={C.green} />
            <StatCard icon="🗣️" label="Debates" value={stats.total_debates || 0} color={C.crimson} />
            <StatCard icon="📊" label="Avg Confidence" value={(stats.avg_confidence || 0) + '%'} color={C.cyan} />
            <StatCard icon="🏷️" label="Topics" value={stats.unique_topics || 0} color="#00e60b" />
          </section>
        )}

        {interests.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Clusters:</span>
            {interests.slice(0, 8).map((int, i) => (
              <span key={i} onClick={() => handleTopicClick(int.topic, 'research')} style={{ padding: "6px 16px", borderRadius: 9999, border: "1px solid hsl(" + (120 + i * 40) + ",70%,55%)44", background: "hsla(" + (120 + i * 40) + ",70%,55%,0.08)", color: "hsl(" + (120 + i * 40) + ",70%,55%)", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                {int.topic} <span style={{ opacity: 0.6 }}>×{int.strength}</span>
              </span>
            ))}
            {interests.length > 8 && <span style={{ padding: "6px 16px", borderRadius: 9999, border: "1px solid " + C.white10, background: C.white5, color: C.onSurfaceVariant, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>+{interests.length - 8} more</span>}
          </div>
        )}

        <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 9999 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={tab === activeTab ? "filter-tab-active" : "filter-tab-inactive"} style={{ padding: "8px 24px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, transition: "all 0.2s" }}>{tab}</button>
          ))}
        </div>

        <section>
          {Object.entries(grouped).map(([date, items]) => {
            const filteredItems = activeTab === "All Activity" ? items : items.filter(item => item.kind === (activeTab === "Research" ? "research" : "debate"));
            if (filteredItems.length === 0) return null;
            return (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1, borderTop: "1px solid " + C.white10 }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.onSurfaceVariant }}>{date}</span>
                  <div style={{ flex: 1, borderTop: "1px solid " + C.white10 }} />
                </div>
                {filteredItems.map((item, i) => (
                  <GlassPanel key={i} style={{ padding: 20, borderRadius: 16, marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }} onClick={() => handleTopicClick(item.query, item.mode || 'research')}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: item.kind === 'debate' ? C.crimson : getConfColor(item.confidence), boxShadow: "0 0 10px " + (item.kind === 'debate' ? C.crimson : getConfColor(item.confidence)), marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{item.query}</h4>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {item.kind === 'debate' ? (
                            <>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, fontWeight: 600 }}>FOR: {item.debateData?.for_score}/10</span>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.crimson, fontWeight: 600 }}>AGAINST: {item.debateData?.against_score}/10</span>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>Winner: {item.debateData?.winner}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: getConfColor(item.confidence), fontWeight: 600 }}>{item.confidence}% confidence</span>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>{item.mode || 'research'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textSecondary, fontFamily: "'Hanken Grotesk',sans-serif" }}>No activity yet. Start researching or debating!</div>}
        </section>

        <section style={{ paddingBottom: 48 }}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20, letterSpacing: "-0.01em" }}>💡 Suggested Synaptic Paths</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {suggestions.map((s, i) => (
              <GlassPanel key={i} className="carousel-card" style={{ padding: 24, borderRadius: 16, borderLeft: "4px solid " + s.color, cursor: "pointer", transition: "background 0.2s" }} onClick={() => handleTopicClick(s.topic, s.mode)}>
                <h5 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: s.color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.type}</h5>
                <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{s.topic}</p>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.onSurfaceVariant, marginBottom: 14 }}>{s.desc}</p>
                <span style={{ color: s.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600 }}>{s.type === "Debate Challenge" ? "Join Debate →" : "Explore Node →"}</span>
              </GlassPanel>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}