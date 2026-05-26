import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  orange: "#ff8c00", gold: "#ffd700", amber: "#ffaa00",
  void: "#0a0a1e", surface: "rgba(10,10,30,0.6)", surfaceHigh: "rgba(40,40,61,0.6)",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
  fontHead: "'Sora',sans-serif", fontBody: "'Hanken Grotesk',sans-serif", fontMono: "'JetBrains Mono',monospace",
  glowOrange: "0 0 15px rgba(255,140,0,0.3)",
  glowGold: "0 0 15px rgba(255,215,0,0.3)",
};

function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1,
      ...(style || {})
    }}>
      {name}
    </span>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:#0a0a1e;color:#e2e0fc;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulseText{0%,100%{opacity:0.6}50%{opacity:1}}
      @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulseSyncBtn{0%,100%{box-shadow:0 0 5px rgba(255,140,0,0.4)}50%{box-shadow:0 0 20px rgba(255,140,0,0.8)}}
      @keyframes twinkle{0%,100%{opacity:0.3}50%{opacity:0.8}}
      ::-webkit-scrollbar{width:6px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(255,140,0,0.15);border-radius:10px}
    `}</style>
  );
}

function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null };
    let animId;
    const PARTICLE_COUNT = 150;

    const colors = [
      { r: 255, g: 140, b: 0 },
      { r: 255, g: 215, b: 0 },
      { r: 255, g: 170, b: 0 },
      { r: 255, g: 165, b: 0 },
      { r: 255, g: 200, b: 50 },
      { r: 255, g: 120, b: 20 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseVx = (Math.random() - 0.5) * 0.5;
        this.baseVy = (Math.random() - 0.5) * 0.5;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 2.5 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.4 + 0.15;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.wobbleAmp = Math.random() * 0.3;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.wobbleOffset = Math.random() * Math.PI * 2;
      }
      update(time) {
        this.vx = this.baseVx + Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp;
        this.vy = this.baseVy + Math.cos(time * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp;
        this.x += this.vx;
        this.y += this.vy;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            this.x += (dx / dist) * force * 3;
            this.y += (dy / dist) * force * 3;
          }
        }
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
      draw(time) {
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.2 + 0.8;
        const alpha = this.opacity * twinkle;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
        glow.addColorStop(0, `rgba(${this.color.r},${this.color.g},${this.color.b},${alpha * 0.6})`);
        glow.addColorStop(1, `rgba(${this.color.r},${this.color.g},${this.color.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    };

    let startTime = performance.now();
    const animate = (timestamp) => {
      const time = timestamp - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const opacity = (1 - dist / 130) * 0.06;
            const avgColor = {
              r: Math.floor((particles[i].color.r + particles[j].color.r) / 2),
              g: Math.floor((particles[i].color.g + particles[j].color.g) / 2),
              b: Math.floor((particles[i].color.b + particles[j].color.b) / 2),
            };
            ctx.strokeStyle = `rgba(${avgColor.r},${avgColor.g},${avgColor.b},${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => { p.update(time); p.draw(time); });
      animId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseLeave = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener("resize", () => { resize(); init(); });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();
    init();
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 0, pointerEvents: "none"
      }}
    />
  );
}

function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory", active: true },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "monitoring", label: "Analytics", path: "/analytics" },
  ];

  const handleNav = (p) => onNavigate ? onNavigate(p) : (window.location.href = p);
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = "/");
  const w = collapsed ? 56 : 320;

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: w,
      background: C.surface, backdropFilter: "blur(24px)",
      borderRight: "1px solid " + C.white10,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "16px 8px" : 24,
      zIndex: 20,
      transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden"
    }}>
      {collapsed ? (
        <>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: "none", border: "none", color: C.orange,
              cursor: "pointer", marginBottom: 32,
              display: "flex", justifyContent: "center"
            }}
          >
            <Icon name="chevron_right" style={{ fontSize: 22 }} />
          </button>
          {NAV.map(({ icon, label, path, active }) => (
            <div
              key={label}
              onClick={() => handleNav(path)}
              title={label}
              style={{
                padding: "12px 0", cursor: "pointer",
                color: active ? C.orange : C.onSurfaceVariant,
                width: "100%", display: "flex", justifyContent: "center"
              }}
            >
              <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
            </div>
          ))}
          <div style={{
            marginTop: "auto", display: "flex",
            flexDirection: "column", alignItems: "center", gap: 14
          }}>
            <div
              onClick={() => handleNav("/research")}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: C.orange, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}
            >
              <Icon name="add" style={{ fontSize: 16, color: C.void }} />
            </div>
            <div
              title={user?.username || "Guest"}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#1e1e32", border: "1px solid rgba(255,140,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <Icon name="face" style={{ color: C.orange, fontSize: 14 }} />
            </div>
            <div
              onClick={handleLogout}
              title="Disconnect"
              style={{ cursor: "pointer", color: C.crimson }}
            >
              <Icon name="logout" style={{ fontSize: 14 }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 40, minWidth: 0
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: C.fontHead, fontSize: 28, fontWeight: 800,
                color: C.orange, letterSpacing: "-0.03em", whiteSpace: "nowrap"
              }}>
                POLYNOUS
              </h1>
              <p style={{
                fontFamily: C.fontMono, fontSize: 10, color: C.onSurfaceVariant,
                textTransform: "uppercase", letterSpacing: "0.2em",
                opacity: 0.7, whiteSpace: "nowrap"
              }}>
                Cerebral Vitality Engine
              </p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: "none", border: "none", color: C.textSecondary,
                cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}
            >
              <Icon name="chevron_left" style={{ fontSize: 20 }} />
            </button>
          </div>

          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
            {NAV.map(({ icon, label, path, active }) => (
              <div
                key={label}
                onClick={() => handleNav(path)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 16px", borderRadius: 9999, cursor: "pointer",
                  color: active ? C.orange : C.onSurfaceVariant,
                  background: active ? "rgba(255,140,0,0.08)" : "transparent",
                  fontFamily: C.fontMono, fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden"
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = C.orange;
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = C.onSurfaceVariant;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              </div>
            ))}
          </nav>

          <div style={{ borderTop: "1px solid " + C.white5, paddingTop: 24, marginTop: 24 }}>
            <button
              onClick={() => handleNav("/research")}
              style={{
                width: "100%", padding: "12px", background: C.orange,
                color: C.void, fontWeight: 700, borderRadius: 9999,
                border: "none", cursor: "pointer", fontFamily: C.fontHead,
                fontSize: 14, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                transition: "transform 0.2s", whiteSpace: "nowrap"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Icon name="add" style={{ fontSize: 18, color: C.void, flexShrink: 0 }} />
              New Research
            </button>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#1e1e32", border: "1px solid rgba(255,140,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Icon name="face" style={{ color: C.orange, fontSize: 22 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: C.fontMono, fontSize: 13, fontWeight: 700,
                  color: "#fff", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis"
                }}>
                  {user?.username || "Guest"}
                </p>
                <button
                  onClick={handleLogout}
                  style={{
                    fontSize: 10, color: C.crimson, background: "none",
                    border: "none", cursor: "pointer", fontFamily: C.fontMono, padding: 0
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

const RESEARCH_PATHS = [
  "Deep Learning Neural Architectures", "Quantum Machine Learning",
  "CRISPR Gene Editing", "Blockchain Consensus",
  "Fusion Energy Breakthroughs", "Autonomous Vehicle Safety",
  "Synthetic Biology Ethics", "Neuromorphic Computing"
];
const NEW_DOMAINS = [
  "Space Colonization Ethics", "Ocean Floor Mining",
  "Quantum Biology Frontiers", "Atmospheric Carbon Capture",
  "Brain-Computer Interfaces", "Lab-Grown Meat Production",
  "Asteroid Mining Economics", "Digital Consciousness"
];
const DEBATE_CHALLENGES = [
  "Should AI be regulated globally?", "Is nuclear energy the solution?",
  "Should we colonize Mars?", "Are cryptocurrencies the future?",
  "Should genetic engineering be allowed?", "Is UBI economically viable?"
];

const shuffleArray = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

const getRandomSuggestions = () => {
  const r = shuffleArray(RESEARCH_PATHS);
  const d = shuffleArray(NEW_DOMAINS);
  const db = shuffleArray(DEBATE_CHALLENGES);
  return [
    { type: "Research Path", topic: r[0], color: C.orange, mode: "research", desc: "Based on your neural interest profile." },
    { type: "New Domain", topic: d[0], color: C.gold, mode: "research", desc: "Your cognitive patterns suggest high affinity." },
    { type: "Debate Challenge", topic: db[0], color: C.crimson, mode: "debate", desc: "High-entropy topic awaiting your perspective." },
  ];
};

export default function MemoryBank({ user, onNavigate, onStartResearch, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const [interests, setInterests] = useState([]);
  const [history, setHistory] = useState([]);
  const [debates, setDebates] = useState([]);
  const [suggestions, setSuggestions] = useState(getRandomSuggestions());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All Activity");
  const userId = "guest_user";
  const sidebarW = collapsed ? 56 : 320;

  useEffect(() => {
    const interval = setInterval(() => setSuggestions(getRandomSuggestions()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTopicClick = (topic, mode) => {
    window.location.href = mode === "debate"
      ? `/debate?topic=${encodeURIComponent(topic)}`
      : `/research?query=${encodeURIComponent(topic)}`;
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const API_BASE = 'http://localhost:8000';
    
    try {
      const username = user?.username || "Guest";
      
      // Create/update user profile
      await fetch(`${API_BASE}/memory/user/${userId}?username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Fetch all data in parallel for better performance
      const [statsRes, interestsRes, historyRes, debatesRes] = await Promise.all([
        fetch(`${API_BASE}/memory/stats/${userId}`),
        fetch(`${API_BASE}/memory/interests/${userId}`),
        fetch(`${API_BASE}/memory/history/${userId}`),
        fetch(`${API_BASE}/memory/debates/${userId}`)
      ]);
      
      // Validate responses
      const responses = [
        { name: 'stats', res: statsRes },
        { name: 'interests', res: interestsRes },
        { name: 'history', res: historyRes },
        { name: 'debates', res: debatesRes }
      ];
      
      responses.forEach(({ name, res }) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ${name}: ${res.status} ${res.statusText}`);
        }
      });
      
      // Parse all responses
      const [statsData, interestsData, historyData, debatesData] = await Promise.all([
        statsRes.json(),
        interestsRes.json(),
        historyRes.json(),
        debatesRes.json()
      ]);
      
      console.log("Data loaded successfully:", {
        stats: statsData,
        interests: interestsData,
        history: historyData,
        debates: debatesData
      });
      
      setStats(statsData);
      setInterests(interestsData.interests || []);
      setHistory(historyData.history || []);
      setDebates(debatesData.debates || []);
      
    } catch(error) {
      console.error("Memory load error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => { 
    fetchAllData(); 
  }, [fetchAllData]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    setError(null);
    
    try {
      await fetchAllData();
      setSyncMsg("Neural map synced successfully.");
    } catch (error) {
      setSyncMsg("Sync failed. Please try again.");
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const getConfColor = (v) => {
    if (v >= 80) return C.orange;
    if (v >= 60) return C.gold;
    return C.crimson;
  };

  const groupedHistory = () => {
    const g = {};
    history.forEach(h => {
      const d = h.timestamp
        ? new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Unknown";
      if (!g[d]) g[d] = [];
      g[d].push({ ...h, kind: "research" });
    });
    debates.forEach(d => {
      const date = d.timestamp
        ? new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Unknown";
      if (!g[date]) g[date] = [];
      g[date].push({
        query: d.topic,
        mode: "debate",
        confidence: Math.max(d.for_score, d.against_score) * 10,
        kind: "debate",
        debateData: d
      });
    });
    return g;
  };

  const grouped = groupedHistory();
  const TABS = ["All Activity", "Research", "Debates"];

  return (
    <div style={{
      minHeight: "100vh", background: C.void,
      color: "#e2e0fc", fontFamily: C.fontBody, overflowX: "hidden"
    }}>
      <Styles />
      <NeuralCanvas />
      <Sidebar
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main style={{
        marginLeft: sidebarW, padding: 32, maxWidth: 1400,
        transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", zIndex: 10
      }}>

        {/* Header */}
        <header style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "16px 0", marginBottom: 32
        }}>
          <div>
            <h1 style={{
              fontFamily: C.fontHead, fontSize: 28, fontWeight: 800,
              color: C.orange, margin: 0, letterSpacing: "-0.03em"
            }}>
              Neural Memory Bank
            </h1>
            <p style={{
              fontFamily: C.fontBody, fontSize: 15,
              color: C.onSurfaceVariant, margin: "4px 0 0"
            }}>
              Your research journey, visualized as a living knowledge graph.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(40,40,61,0.6)",
              border: "1px solid rgba(255,140,0,0.3)",
              padding: "8px 24px", borderRadius: 9999,
              color: C.orange, fontFamily: C.fontMono, fontSize: 13,
              cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.7 : 1,
              boxShadow: syncing ? "0 0 20px rgba(255,140,0,0.8)" : "none",
              animation: syncing ? "pulseSyncBtn 2s infinite ease-in-out" : "none",
              transition: "all 0.3s ease"
            }}
          >
            <Icon name="sync" style={{ 
              animation: syncing ? "spin 1s linear infinite" : "none", 
              fontSize: 18 
            }} />
            {syncing ? "Syncing..." : "Sync Nodes"}
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(255,32,64,0.1)",
            border: "1px solid rgba(255,32,64,0.3)",
            borderRadius: 12,
            padding: "16px 24px",
            marginBottom: 24,
            color: C.crimson,
            fontFamily: C.fontMono,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <Icon name="error" style={{ fontSize: 20 }} />
            <span>Failed to load memory data: {error}</span>
            <button
              onClick={fetchAllData}
              style={{
                marginLeft: "auto",
                background: "rgba(255,32,64,0.2)",
                border: "none",
                color: C.crimson,
                padding: "6px 16px",
                borderRadius: 9999,
                cursor: "pointer",
                fontFamily: C.fontMono,
                fontSize: 12
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            flexDirection: "column",
            gap: 16
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(255,140,0,0.2)",
              borderTop: "3px solid #ff8c00",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ color: C.onSurfaceVariant, fontFamily: C.fontMono, fontSize: 14 }}>
              Loading neural pathways...
            </p>
          </div>
        )}

        {/* Sync Toast */}
        {syncMsg && (
          <div style={{
            position: "fixed", bottom: 32, right: 32, zIndex: 100,
            background: syncMsg.includes("failed") 
              ? "rgba(255,32,64,0.15)" 
              : "rgba(255,140,0,0.15)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${syncMsg.includes("failed") ? "rgba(255,32,64,0.4)" : "rgba(255,140,0,0.4)"}`,
            borderRadius: 12, padding: "16px 24px",
            fontFamily: C.fontMono, fontSize: 13,
            color: syncMsg.includes("failed") ? C.crimson : C.orange,
            boxShadow: syncMsg.includes("failed") 
              ? "0 0 15px rgba(255,32,64,0.3)" 
              : C.glowOrange,
            animation: "slideIn 0.4s ease"
          }}>
            {syncMsg.includes("failed") ? "⚠ " : "✓ "}{syncMsg}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <section style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: 24, marginBottom: 40
          }}>
            <div style={{
              gridColumn: "span 2", background: C.surface,
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,140,0,0.3)",
              borderRadius: 16, padding: 24, boxShadow: C.glowOrange,
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <span style={{
                  fontFamily: C.fontMono, fontSize: 11, color: C.orange,
                  textTransform: "uppercase", letterSpacing: "1px"
                }}>
                  Research Overview
                </span>
                <h2 style={{
                  fontFamily: C.fontHead, fontSize: 22,
                  color: "#fff", margin: "8px 0 8px"
                }}>
                  {stats.total_research || 0} Total Research Sessions
                </h2>
                <p style={{ color: C.onSurfaceVariant, fontSize: 15, margin: 0 }}>
                  {stats.unique_topics || 0} unique topics explored across {stats.total_debates || 0} debates.
                </p>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                marginTop: 24, position: "relative", zIndex: 1
              }}>
                <div style={{
                  height: 4, flex: 1,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 9999, overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(stats.avg_confidence || 0, 100)}%`,
                    background: C.orange,
                    boxShadow: `0 0 10px ${C.orange}`,
                    transition: "width 1s ease"
                  }} />
                </div>
                <span style={{
                  fontFamily: C.fontMono, fontSize: 11,
                  color: C.orange, whiteSpace: "nowrap"
                }}>
                  {stats.avg_confidence || 0}% Avg Confidence
                </span>
              </div>
              <div style={{
                position: "absolute", right: -40, bottom: -40,
                width: 192, height: 192,
                background: "rgba(255,140,0,0.1)",
                borderRadius: "50%", filter: "blur(40px)"
              }} />
            </div>

            <div style={{
              background: C.surface, backdropFilter: "blur(20px)",
              border: `1px solid ${C.white10}`, borderRadius: 16, padding: 24,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center"
            }}>
              <Icon name="gavel" style={{ fontSize: 40, color: C.crimson, marginBottom: 8 }} />
              <span style={{ fontFamily: C.fontHead, fontSize: 32, fontWeight: 700, color: "#fff" }}>
                {stats.total_debates || 0}
              </span>
              <span style={{
                fontFamily: C.fontMono, fontSize: 11,
                color: C.onSurfaceVariant, textTransform: "uppercase", marginTop: 4
              }}>
                Total Debates
              </span>
            </div>

            <div style={{
              background: C.surface, backdropFilter: "blur(20px)",
              border: `1px solid ${C.white10}`, borderRadius: 16, padding: 24,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center"
            }}>
              <Icon name="label" style={{ fontSize: 40, color: C.gold, marginBottom: 8 }} />
              <span style={{ fontFamily: C.fontHead, fontSize: 32, fontWeight: 700, color: "#fff" }}>
                {stats.unique_topics || 0}
              </span>
              <span style={{
                fontFamily: C.fontMono, fontSize: 11,
                color: C.onSurfaceVariant, textTransform: "uppercase", marginTop: 4
              }}>
                Unique Topics
              </span>
            </div>
          </section>
        )}

        {/* Active Clusters */}
        {interests.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h3 style={{ fontFamily: C.fontHead, fontSize: 20, color: "#fff", marginBottom: 16 }}>
              🧠 Active Clusters
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {interests.slice(0, 10).map((int, i) => (
                <span
                  key={i}
                  onClick={() => handleTopicClick(int.topic, "research")}
                  style={{
                    padding: "8px 16px", borderRadius: 9999,
                    background: C.surface, backdropFilter: "blur(20px)",
                    border: `1px solid hsl(${30 + i * 20},100%,50%)`,
                    color: `hsl(${30 + i * 20},100%,50%)`,
                    fontFamily: C.fontMono, fontSize: 12,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {int.topic} <span style={{ opacity: 0.6 }}>×{int.strength}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Tab Switcher */}
        <div style={{
          display: "inline-flex", gap: 4, padding: 4,
          background: C.surface, backdropFilter: "blur(20px)",
          border: `1px solid ${C.white10}`,
          borderRadius: 9999, marginBottom: 32
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 24px", borderRadius: 9999, border: "none",
                cursor: "pointer", fontFamily: C.fontMono, fontSize: 13,
                background: activeTab === tab ? C.orange : "transparent",
                color: activeTab === tab ? C.void : C.onSurfaceVariant,
                fontWeight: activeTab === tab ? 700 : 400,
                transition: "all 0.2s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {(activeTab === "All Activity" || activeTab === "Research") && (
          <section style={{ marginBottom: 40 }}>
            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([date, items]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 16, marginBottom: 16
                  }}>
                    <div style={{ flex: 1, borderTop: `1px solid ${C.white10}` }} />
                    <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.onSurfaceVariant }}>
                      {date}
                    </span>
                    <div style={{ flex: 1, borderTop: `1px solid ${C.white10}` }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {items.map((item, i) => {
                      const isDebate = item.kind === "debate";
                      const cardBorder = isDebate
                        ? "1px solid rgba(255,32,64,0.3)"
                        : "1px solid rgba(255,140,0,0.3)";
                      const cardGlow = isDebate
                        ? "0 0 15px rgba(255,32,64,0.15)"
                        : C.glowOrange;
                      const dotColor = isDebate ? C.crimson : getConfColor(item.confidence);
                      const badgeBg = isDebate
                        ? "rgba(255,32,64,0.2)"
                        : "rgba(255,140,0,0.2)";
                      const badgeColor = isDebate ? C.crimson : getConfColor(item.confidence);
                      const badgeText = isDebate
                        ? (item.debateData
                            ? `${item.debateData.for_score}/${item.debateData.against_score}`
                            : "DEBATE")
                        : `${item.confidence}%`;

                      return (
                        <div
                          key={i}
                          onClick={() => handleTopicClick(item.query, item.mode || "research")}
                          style={{
                            background: C.surface, backdropFilter: "blur(20px)",
                            border: cardBorder, borderRadius: 16, padding: 20,
                            cursor: "pointer", transition: "background 0.2s",
                            boxShadow: cardGlow
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                          onMouseLeave={e => e.currentTarget.style.background = C.surface}
                        >
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", marginBottom: 12
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{
                                width: 12, height: 12, borderRadius: "50%",
                                background: dotColor,
                                boxShadow: `0 0 10px ${dotColor}`,
                                flexShrink: 0
                              }} />
                              <h4 style={{
                                fontFamily: C.fontHead, fontSize: 16,
                                color: "#fff", margin: 0
                              }}>
                                {item.query}
                              </h4>
                            </div>
                            <span style={{
                              background: badgeBg,
                              color: badgeColor,
                              padding: "4px 12px",
                              borderRadius: 9999,
                              fontFamily: C.fontMono,
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: "nowrap"
                            }}>
                              {badgeText}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{
                              padding: "4px 12px", borderRadius: 9999,
                              background: "rgba(40,40,61,0.8)",
                              fontFamily: C.fontMono, fontSize: 10, color: "#e2e0fc"
                            }}>
                              {item.mode || "research"}
                            </span>
                            {item.topics?.filter(t => t).slice(0, 3).map((t, j) => (
                              <span
                                key={j}
                                onClick={(e) => { e.stopPropagation(); handleTopicClick(t, "research"); }}
                                style={{
                                  padding: "4px 12px", borderRadius: 9999,
                                  background: "rgba(40,40,61,0.8)",
                                  fontFamily: C.fontMono, fontSize: 10,
                                  color: "#e2e0fc", cursor: "pointer"
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: C.textSecondary }}>
                No research yet. Start asking questions!
              </div>
            )}
          </section>
        )}

        {/* Debate History */}
        {(activeTab === "All Activity" || activeTab === "Debates") && (
          <section style={{ marginBottom: 40 }}>
            {debates.length > 0 ? (
              debates.map((d, i) => (
                <div
                  key={i}
                  onClick={() => handleTopicClick(d.topic, "debate")}
                  style={{
                    background: C.surface, backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,32,64,0.3)",
                    borderRadius: 16, padding: 20, marginBottom: 12,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(255,32,64,0.15)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                  onMouseLeave={e => e.currentTarget.style.background = C.surface}
                >
                  <h4 style={{
                    fontFamily: C.fontHead, fontSize: 16,
                    color: "#fff", margin: "0 0 10px"
                  }}>
                    {d.topic}
                  </h4>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 10, marginBottom: 4
                      }}>
                        <span style={{ color: C.orange }}>FOR</span>
                        <span style={{ color: C.orange }}>{d.for_score}/10</span>
                      </div>
                      <div style={{
                        height: 4, borderRadius: 2,
                        background: "rgba(255,255,255,0.06)"
                      }}>
                        <div style={{
                          width: `${(d.for_score || 0) * 10}%`,
                          height: "100%", borderRadius: 2, background: C.orange,
                          transition: "width 1s ease"
                        }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 10, marginBottom: 4
                      }}>
                        <span style={{ color: C.crimson }}>AGAINST</span>
                        <span style={{ color: C.crimson }}>{d.against_score}/10</span>
                      </div>
                      <div style={{
                        height: 4, borderRadius: 2,
                        background: "rgba(255,255,255,0.06)"
                      }}>
                        <div style={{
                          width: `${(d.against_score || 0) * 10}%`,
                          height: "100%", borderRadius: 2, background: C.crimson,
                          transition: "width 1s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: C.fontMono, fontSize: 11, fontWeight: 600,
                    color: d.winner === "FOR" ? C.orange : d.winner === "AGAINST" ? C.crimson : C.gold
                  }}>
                    🏆 Winner: {d.winner}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: C.textSecondary }}>
                No debates yet. Start a debate to see your history!
              </div>
            )}
          </section>
        )}

        {/* Suggestions */}
        <section style={{ paddingBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <h3 style={{ fontFamily: C.fontHead, fontSize: 20, color: "#fff", margin: 0 }}>
              💡 Suggested Synaptic Paths
            </h3>
            <Icon name="auto_awesome" style={{ color: C.gold, animation: "pulseText 2s infinite" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => handleTopicClick(s.topic, s.mode)}
                style={{
                  background: C.surface, backdropFilter: "blur(20px)",
                  border: `1px solid ${C.white10}`,
                  borderLeft: `4px solid ${s.color}`,
                  borderRadius: 16, padding: 20, cursor: "pointer",
                  transition: "transform 0.2s, background 0.2s",
                  animation: `slideIn 0.5s ${i * 150}ms both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateX(8px)";
                  e.currentTarget.style.background = C.surfaceHigh;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.background = C.surface;
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: C.fontMono, fontSize: 10,
                    color: s.color, textTransform: "uppercase", letterSpacing: "1px"
                  }}>
                    {s.type}
                  </span>
                </div>
                <h4 style={{ fontFamily: C.fontHead, fontSize: 14, color: "#fff", margin: 0 }}>
                  {s.topic}
                </h4>
                <p style={{
                  fontFamily: C.fontBody, fontSize: 12,
                  color: C.onSurfaceVariant, margin: "4px 0 0"
                }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}