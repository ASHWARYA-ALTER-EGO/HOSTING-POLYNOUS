import { useState, useEffect, useRef } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1, ...(style || {})
    }}>{name}</span>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:#0a0a1e;color:#e2e0fc;font-family:'Inter',sans-serif;overflow-x:hidden}
      ::selection{background:rgba(255,215,0,0.25)}
      @keyframes borderPulse{0%,100%{opacity:0.5}50%{opacity:1}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
      @keyframes dotPulse{0%,80%,100%{transform:scale(0);opacity:0.3}40%{transform:scale(1);opacity:1}}
      @keyframes breathe{0%,100%{opacity:0.4;transform:scale(0.97)}50%{opacity:1;transform:scale(1)}}
      .gold-border-pulse{border:2px dashed #ffd700;animation:borderPulse 2s infinite ease-in-out}
      .animate-bounce{animation:bounce 1s infinite}
      .animate-spin-slow{animation:spin 10s linear infinite}
      .animate-spin-slow-reverse{animation:spin 15s linear infinite reverse}
      .hover-lift:hover{transform:translateY(-4px);transition:transform 0.3s}
      .custom-scroll::-webkit-scrollbar{width:4px}
      .custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,215,0,0.2);border-radius:10px}
      .spinner{animation:spin 1s linear infinite}
      .shimmer-line{
        background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,215,0,0.08) 50%,rgba(255,255,255,0.04) 75%);
        background-size:400px 100%;
        animation:shimmer 1.6s infinite linear;
        border-radius:6px;
      }
    `}</style>
  );
}

// ─── Neural Background ────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [], animId;
    const N = 150;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    resize();
    const colors = [
      { color: "#ffd700", speed: 0.5 },
      { color: "#00ff0f", speed: 1.5 },
      { color: "#a855f7", speed: 1.0 },
    ];
    for (let i = 0; i < N; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * c.speed, vy: (Math.random() - 0.5) * c.speed,
        size: Math.random() * 2 + 1, color: c.color, opacity: Math.random() * 0.5 + 0.2,
      });
    }
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - d / 100)})`;
            ctx.lineWidth = 0.3; ctx.stroke();
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
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab", active: true },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : (window.location.href = p);
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = "/");

  if (collapsed) return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 56,
      background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)",
      borderRight: "1px solid " + C.white10, display: "flex", flexDirection: "column",
      alignItems: "center", padding: "16px 0", zIndex: 20,
    }}>
      <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", marginBottom: 32 }}>
        <Icon name="chevron_right" style={{ fontSize: 22 }} />
      </button>
      {NAV.map(({ icon, label, path, active }) => (
        <div key={label} onClick={() => handleNav(path)} title={label}
          style={{ padding: "12px 0", cursor: "pointer", color: active ? C.gold : C.onSurfaceVariant, width: "100%", display: "flex", justifyContent: "center" }}>
          <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
        </div>
      ))}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div onClick={() => handleNav("/research")} style={{ width: 34, height: 34, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="add" style={{ fontSize: 16, color: C.void }} />
        </div>
        <div title={user?.username || "Guest"} style={{ width: 30, height: 30, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(255,215,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="face" style={{ color: C.gold, fontSize: 14 }} />
        </div>
        <div onClick={handleLogout} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}>
          <Icon name="logout" style={{ fontSize: 14 }} />
        </div>
      </div>
    </aside>
  );

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 320,
      background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)",
      borderRight: "1px solid " + C.white10, boxShadow: "0 0 20px rgba(0,255,15,0.1)",
      display: "flex", flexDirection: "column", padding: 24, zIndex: 20,
      transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.gold, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>POLYNOUS</h1>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7, whiteSpace: "nowrap" }}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8 }}
          onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = C.textSecondary}>
          <Icon name="chevron_left" style={{ fontSize: 20 }} />
        </button>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
        {NAV.map(({ icon, label, path, active }) => (
          <div key={label} onClick={() => handleNav(path)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 9999, cursor: "pointer", color: active ? C.gold : C.onSurfaceVariant, background: active ? "rgba(255,215,0,0.08)" : "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden" }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.gold; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.onSurfaceVariant; e.currentTarget.style.background = "transparent"; } }}>
            <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{ borderTop: "1px solid " + C.white5, paddingTop: 24, marginTop: 24 }}>
        <button onClick={() => handleNav("/research")}
          style={{ width: "100%", padding: "12px", background: C.gold, color: C.void, fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.2s", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <Icon name="add" style={{ fontSize: 18, color: C.void, flexShrink: 0 }} />
          New Research
        </button>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(255,215,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="face" style={{ color: C.gold, fontSize: 22 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username || "Guest"}</p>
            <button onClick={handleLogout} style={{ fontSize: 10, color: C.crimson, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", padding: 0 }}>Disconnect</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── API LAYER ────────────────────────────────────────────────
const BASE = "http://localhost:8000";

async function apiUploadPDF(file) {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${BASE}/pdfs/upload`, { method: "POST", body: form });
  return r.json();
}
async function apiCheckProgress(filename) {
  const r = await fetch(`${BASE}/pdfs/progress?filename=${encodeURIComponent(filename)}`);
  return r.json();
}
async function apiListPDFs() {
  const r = await fetch(`${BASE}/pdfs/list`);
  return r.json();
}
async function apiSearchPDFs(query, pdfName = null) {
  const p = new URLSearchParams({ query, top_k: 5 });
  if (pdfName) p.append("pdf_name", pdfName);
  const r = await fetch(`${BASE}/pdfs/search?${p}`);
  return r.json();
}
async function apiAskPDF(query, pdfName = null) {
  const p = new URLSearchParams({ query });
  if (pdfName) p.append("pdf_name", pdfName);
  const r = await fetch(`${BASE}/pdfs/ask?${p}`, { method: "POST" });
  return r.json();
}

// ─── Loading Skeleton ─────────────────────────────────────────
function LoadingSkeleton({ mode }) {
  // mode: "rag" | "search"
  const steps = mode === "rag"
    ? ["Retrieving relevant chunks…", "Ranking by semantic similarity…", "Synthesising answer with LLM…"]
    : ["Encoding query to vector…", "Scanning embedding space…", "Ranking top matches…"];

  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ animation: "fadeSlideUp 0.3s ease", marginTop: 16 }}>
      {/* Step indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
        padding: "10px 16px", borderRadius: 10,
        background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)",
      }}>
        {/* Animated dots */}
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: C.gold,
              animation: `dotPulse 1.2s ${i * 0.2}s infinite ease-in-out`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.gold }}>
          {steps[step]}
        </span>
      </div>

      {/* Shimmer lines mimicking answer structure */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mode === "rag" ? (
          <>
            {/* Fake section header */}
            <div className="shimmer-line" style={{ height: 36, width: "55%", marginBottom: 4 }} />
            {[90, 75, 85].map((w, i) => <div key={i} className="shimmer-line" style={{ height: 14, width: `${w}%` }} />)}
            <div className="shimmer-line" style={{ height: 36, width: "45%", marginTop: 8, marginBottom: 4 }} />
            {[80, 70, 88, 65].map((w, i) => <div key={i} className="shimmer-line" style={{ height: 14, width: `${w}%` }} />)}
            <div className="shimmer-line" style={{ height: 36, width: "50%", marginTop: 8, marginBottom: 4 }} />
            {[78, 60].map((w, i) => <div key={i} className="shimmer-line" style={{ height: 14, width: `${w}%` }} />)}
          </>
        ) : (
          // Fake chunk cards
          [1, 2, 3].map(i => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="shimmer-line" style={{ height: 18, width: 100 }} />
                <div className="shimmer-line" style={{ height: 18, width: 60 }} />
              </div>
              {[90, 80, 70].map((w, j) => <div key={j} className="shimmer-line" style={{ height: 13, width: `${w}%`, marginBottom: 6 }} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── RAG Answer Renderer ──────────────────────────────────────
const SECTION_ICONS = ["📋", "🔑", "📊", "⚠️", "💡", "📌", "🔍", "✅"];

function isSectionHeader(line) {
  return SECTION_ICONS.some(icon => line.trim().startsWith(icon));
}
function isBullet(line) {
  return line.trim().startsWith("•") || line.trim().startsWith("-") || /^\d+\./.test(line.trim());
}

function RagAnswer({ text, confidence, sources, getConfColor, onCopy }) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  lines.forEach(line => {
    if (!line.trim()) {
      if (current) current.lines.push({ type: "blank", content: "" });
      return;
    }
    if (isSectionHeader(line)) {
      if (current) sections.push(current);
      current = { header: line.trim(), lines: [] };
    } else {
      if (!current) current = { header: null, lines: [] };
      if (isBullet(line)) {
        current.lines.push({ type: "bullet", content: line.trim().replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "") });
      } else {
        current.lines.push({ type: "text", content: line.trim() });
      }
    }
  });
  if (current) sections.push(current);

  return (
    <div style={{ animation: "fadeSlideUp 0.35s ease" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {sections.map((sec, si) => (
          <div key={si} style={{
            borderRadius: 12,
            background: sec.header ? "rgba(255,215,0,0.03)" : "transparent",
            border: sec.header ? "1px solid rgba(255,215,0,0.1)" : "none",
            overflow: "hidden",
          }}>
            {sec.header && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px",
                background: "rgba(255,215,0,0.06)",
                borderBottom: "1px solid rgba(255,215,0,0.08)",
              }}>
                <span style={{ fontSize: 16 }}>{sec.header.match(/^(\S+)/)?.[1]}</span>
                <span style={{
                  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13,
                  color: C.gold, letterSpacing: "0.01em",
                }}>
                  {sec.header.replace(/^(\S+)\s*/, "")}
                </span>
              </div>
            )}
            <div style={{
              padding: sec.header ? "12px 16px" : "0 2px",
              display: "flex", flexDirection: "column", gap: 7,
            }}>
              {sec.lines.filter(l => l.type !== "blank").map((line, li) => {
                if (line.type === "bullet") return (
                  <div key={li} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "9px 14px",
                    background: "rgba(255,255,255,0.025)",
                    borderRadius: 8,
                    borderLeft: `3px solid rgba(255,215,0,0.3)`,
                  }}>
                    <span style={{ color: C.gold, fontSize: 14, lineHeight: "22px", flexShrink: 0 }}>›</span>
                    <span style={{
                      fontFamily: "'Inter',sans-serif",
                      fontWeight: 400,
                      fontSize: 15,
                      color: "#dde6f0",
                      lineHeight: 1.7,
                    }}>{line.content}</span>
                  </div>
                );
                return (
                  <p key={li} style={{
                    fontFamily: "'Inter',sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    color: "#cdd8e3",
                    lineHeight: 1.78,
                    letterSpacing: "0.01em",
                  }}>{line.content}</p>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>Relevance:</span>
          <div style={{ width: 100, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${confidence}%`, height: "100%", background: getConfColor(confidence), borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: getConfColor(confidence), fontWeight: 700 }}>
            {Math.round(confidence)}%
          </span>
          <button onClick={onCopy}
            style={{ marginLeft: "auto", padding: "5px 14px", borderRadius: 15, border: "1px solid " + C.white10, background: "transparent", color: C.textSecondary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
            📋 Copy
          </button>
        </div>

        {sources.length > 0 && (
          <div style={{
            background: "rgba(0,0,0,0.2)", borderRadius: 10,
            border: "1px solid rgba(255,215,0,0.08)", padding: "12px 14px",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              📚 Source Chunks · {sources.length} found
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {sources.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 10px", borderRadius: 7,
                  background: "rgba(255,255,255,0.025)",
                }}>
                  <span style={{
                    background: "rgba(255,215,0,0.12)", padding: "1px 8px",
                    borderRadius: 4, color: C.gold, fontWeight: 700,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                    minWidth: 24, textAlign: "center",
                  }}>
                    #{s.chunk_id !== undefined ? s.chunk_id : s.chunk_index}
                  </span>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#aab", flex: 1 }}>{s.pdf_name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: getConfColor(s.relevance), fontWeight: 700 }}>
                    {s.relevance}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mode Info Banner ─────────────────────────────────────────
function ModeBanner({ mode }) {
  const config = {
    rag: {
      icon: "auto_awesome",
      title: "Retrieval-Augmented Generation",
      color: C.gold,
      colorBg: "rgba(255,215,0,0.05)",
      colorBorder: "rgba(255,215,0,0.12)",
      pills: [
        { icon: "description", label: "Document-only context" },
        { icon: "hub", label: "LLM-synthesised answer" },
        { icon: "block", label: "No web scraping" },
      ],
      description: "Fetches the most relevant passages directly from your uploaded PDFs, then passes them to an LLM to compose a clear, cited answer — nothing from the web, nothing hallucinated beyond your documents.",
    },
    search: {
      icon: "travel_explore",
      title: "Semantic Vector Search",
      color: C.cyan,
      colorBg: "rgba(0,204,255,0.04)",
      colorBorder: "rgba(0,204,255,0.12)",
      pills: [
        { icon: "psychology", label: "Meaning-aware matching" },
        { icon: "list_alt", label: "Raw chunk results" },
        { icon: "speed", label: "No LLM overhead" },
      ],
      description: "Converts your query into a high-dimensional vector and finds the closest matching chunks in your document embeddings — by meaning, not keywords. Great for pinpointing exact passages fast.",
    },
  }[mode];

  return (
    <div style={{
      background: config.colorBg,
      border: `1px solid ${config.colorBorder}`,
      borderRadius: 14,
      padding: "14px 18px",
      marginBottom: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={config.icon} style={{ fontSize: 18, color: config.color }} />
        <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: config.color }}>
          {config.title}
        </span>
      </div>
      <p style={{
        fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#8fa3b4",
        lineHeight: 1.65, letterSpacing: "0.01em",
      }}>
        {config.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {config.pills.map((pill, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${config.colorBorder}`,
          }}>
            <Icon name={pill.icon} style={{ fontSize: 12, color: config.color }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#9ab" }}>
              {pill.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function PdfLabPage({ user, onNavigate, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadStage, setUploadStage] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [activeTab, setActiveTab] = useState("ask");
  const [dragging, setDragging] = useState(false);

  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState(null);
  const [conversation, setConversation] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  const fileRef = useRef(null);

  useEffect(() => { loadPdfs(); }, []);

  const loadPdfs = async () => {
    try {
      const data = await apiListPDFs();
      setPdfs(data.pdfs || []);
    } catch (e) {}
  };

  const triggerUpload = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) return;
    setUploading(true); setUploadProgress(0);
    setUploadMsg("Uploading…"); setUploadStage("extracting");
    let poll;
    try {
      const uploadPromise = apiUploadPDF(file);
      poll = setInterval(async () => {
        try {
          const d = await apiCheckProgress(file.name);
          const pct = Math.max(d.extraction || 0, d.embedding || 0, d.storing || 0);
          setUploadProgress(pct); setUploadStage(d.status || "extracting");
          if (d.status === "complete" || pct >= 100) {
            setUploadProgress(100); setUploadStage("complete");
            setUploadMsg("Processing complete!"); clearInterval(poll);
          } else if (d.status === "error") { setUploadMsg("Processing failed!"); clearInterval(poll); }
          else if (d.status === "extracting") setUploadMsg("Extracting text from PDF…");
          else if (d.status === "chunking") setUploadMsg("Chunking document…");
          else if (d.status === "embedding") setUploadMsg("Creating vector embeddings…");
        } catch (e) {}
      }, 500);
      const data = await uploadPromise;
      clearInterval(poll);
      setUploadProgress(100); setUploadStage("complete");
      setUploadMsg(data.message || `✅ Indexed ${data.total_chunks ?? "?"} chunks!`);
      await loadPdfs();
    } catch (e) {
      if (poll) clearInterval(poll);
      setUploadMsg("Upload failed — is the server running?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) triggerUpload(f); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) triggerUpload(f);
  };

  const askPdf = async () => {
    const query = askQuery.trim();
    if (!query || askLoading) return;
    setAskLoading(true); setAskAnswer(null); setAskQuery("");
    setConversation(prev => [...prev, { role: "user", content: query }]);
    try {
      const data = await apiAskPDF(query, selectedPdf);
      const result = { text: data.answer || "No answer found.", sources: data.sources || [], confidence: data.confidence || 0 };
      setAskAnswer(result);
      setConversation(prev => [...prev, { role: "assistant", content: result.text, sources: result.sources, confidence: result.confidence }]);
    } catch (e) {
      setAskAnswer({ text: "Error querying PDF — is the server running?", sources: [], confidence: 0 });
    } finally { setAskLoading(false); }
  };

  const doSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searchLoading) return;
    setSearchLoading(true); setSearchResults([]); setSearchError("");
    try {
      const data = await apiSearchPDFs(query, selectedPdf);
      const chunks = data.results || data.chunks || [];
      setSearchResults(chunks);
      if (!chunks.length) setSearchError("No results found.");
    } catch (e) { setSearchError("Search failed — is the server running?"); }
    finally { setSearchLoading(false); }
  };

  const getConfColor = (v) => v >= 80 ? C.green : v >= 60 ? "#ffaa00" : C.crimson;
  const stageThresholds = { extracting: 20, chunking: 50, embedding: 80, complete: 100 };
  const stageDone = (s) => uploadProgress >= (stageThresholds[s] || 0);

  return (
    <div style={{ minHeight: "100vh", background: C.void, position: "relative", overflow: "auto" }}>
      <Styles />
      <NeuralCanvas />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{
        marginLeft: sidebarCollapsed ? 56 : 320,
        padding: "24px 32px", position: "relative", zIndex: 10,
        transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
        width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 10, animation: "fadeSlideUp 0.6s ease both" }}>
  <h1 style={{
    fontFamily: "'Sora',sans-serif",
    fontSize: "clamp(2rem,4.5vw,3rem)",
    fontWeight: 800,
    color: C.gold,
    margin: "0 0 10px",
    letterSpacing: "-0.03em",
    textShadow: "0 0 40px rgba(255,215,0,0.3)",
  }}>
    📄 PDF Neural Lab
  </h1>
  <p style={{
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 14,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "3px",
  }}>Upload, Embed & Query Your Documents</p>
</div>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "3px" }}>
              Upload, Embed & Query Your Documents
            </p>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              background: dragging ? "rgba(255,215,0,0.08)" : "rgba(10,10,30,0.6)",
              backdropFilter: "blur(20px)",
              border: `2px dashed ${dragging ? C.gold : "rgba(255,215,0,0.3)"}`,
              borderRadius: 18, padding: 48, textAlign: "center",
              cursor: uploading ? "default" : "pointer", marginBottom: 24,
              animation: dragging || uploading ? "none" : "borderPulse 2s infinite ease-in-out",
              transition: "all 0.3s",
            }}
          >
            <input type="file" accept=".pdf" ref={fileRef} onChange={handleFileChange} style={{ display: "none" }} />
            <div className={uploading ? "" : "animate-bounce"} style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name={uploading ? "hourglass_top" : "upload_file"} style={{ fontSize: 40, color: C.gold }} />
            </div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: C.gold, marginBottom: 8 }}>
              {uploading ? "Processing Document…" : "Drop PDF Here or Click to Browse"}
            </h3>
            <p style={{ fontFamily: "'Inter',sans-serif", color: C.textSecondary }}>
              Upload research papers, reports, or any PDF document
            </p>
            {uploading && (
              <div style={{ marginTop: 20, width: "100%", maxWidth: 400, margin: "20px auto 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>
                  <span>{uploadMsg}</span><span>{Math.round(uploadProgress)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${uploadProgress}%`, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.green})`, borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9 }}>
                  {[["extracting", "📖 Extract"], ["chunking", "✂️ Chunk"], ["embedding", "🧠 Embed"], ["complete", "✅ Done"]].map(([stage, label]) => (
                    <span key={stage} style={{ color: stageDone(stage) ? C.green : C.textSecondary, transition: "color 0.3s" }}>{label}</span>
                  ))}
                </div>
              </div>
            )}
            {!uploading && uploadMsg && (
              <div style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: C.gold, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, display: "inline-block" }}>
                {uploadMsg}
              </div>
            )}
          </div>

          {/* PDF Library */}
          {pdfs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 14 }}>📚 Your Knowledge Library</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {pdfs.map((pdf, i) => (
                  <div key={i} onClick={() => setSelectedPdf(selectedPdf === pdf.pdf_name ? null : pdf.pdf_name)}
                    style={{
                      background: selectedPdf === pdf.pdf_name ? "rgba(255,215,0,0.08)" : "rgba(10,10,30,0.6)",
                      backdropFilter: "blur(20px)",
                      border: selectedPdf === pdf.pdf_name ? "1px solid rgba(255,215,0,0.4)" : "1px solid " + C.white10,
                      borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Icon name="picture_as_pdf" style={{ color: C.gold, fontSize: 24 }} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, background: "rgba(0,255,15,0.1)", padding: "2px 8px", borderRadius: 10 }}>Ready</span>
                    </div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{pdf.pdf_name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textSecondary }}>{pdf.total_chunks ?? "?"} chunks</div>
                  </div>
                ))}
              </div>
              {selectedPdf && (
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.gold, marginTop: 8 }}>
                  📌 Scoped to: {selectedPdf} — queries will search this PDF only
                </p>
              )}
            </div>
          )}

          {/* Mode Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["ask", "🔍 Ask (RAG)"], ["search", "🧲 Semantic Search"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 20px", borderRadius: 9999,
                  border: activeTab === tab ? "none" : "1px solid " + C.white10,
                  background: activeTab === tab ? C.gold : "rgba(255,255,255,0.04)",
                  color: activeTab === tab ? C.void : C.textSecondary,
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: activeTab === tab ? 700 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── ASK TAB ── */}
          {activeTab === "ask" && (
            <>
              <ModeBanner mode="rag" />
              <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 16 }}>🔍 Ask Your PDFs</h3>
                <div style={{ display: "flex", gap: 10, marginBottom: askAnswer || askLoading ? 20 : 0 }}>
                  <input
                    type="text" value={askQuery} onChange={e => setAskQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && askPdf()}
                    placeholder="Ask a question about your documents…"
                    style={{ flex: 1, padding: "14px 20px", borderRadius: 30, border: "1px solid rgba(255,215,0,0.2)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 14, outline: "none" }}
                  />
                  <button onClick={askPdf} disabled={askLoading || !askQuery.trim()}
                    style={{ padding: "14px 28px", borderRadius: 30, border: "none", background: askLoading ? "#333" : `linear-gradient(135deg, ${C.gold}, #ca8a04)`, color: C.void, fontWeight: 700, cursor: askLoading || !askQuery.trim() ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {askLoading ? "…" : "Ask →"}
                  </button>
                </div>

                {askLoading && <LoadingSkeleton mode="rag" />}
                {!askLoading && askAnswer && (
                  <RagAnswer
                    text={askAnswer.text}
                    confidence={askAnswer.confidence}
                    sources={askAnswer.sources}
                    getConfColor={getConfColor}
                    onCopy={() => navigator.clipboard.writeText(askAnswer.text)}
                  />
                )}
              </div>

              {/* Conversation History */}
              {conversation.length > 1 && (
                <div style={{ paddingBottom: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>💬 Conversation History</h3>
                    <button onClick={() => setConversation([])}
                      style={{ padding: "5px 12px", borderRadius: 15, border: "1px solid " + C.white10, background: "transparent", color: C.textSecondary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
                      Clear
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {conversation.map((msg, i) => (
                      <div key={i} style={{
                        background: msg.role === "user" ? "rgba(0,255,15,0.04)" : "rgba(255,215,0,0.04)",
                        border: `1px solid ${msg.role === "user" ? "rgba(0,255,15,0.15)" : "rgba(255,215,0,0.15)"}`,
                        borderRadius: 14, padding: "16px 20px",
                      }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: msg.role === "user" ? C.green : C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                          {msg.role === "user" ? "👤 You" : "🧠 POLYNOUS"}
                        </div>
                        <div style={{
                          fontFamily: "'Inter',sans-serif", fontWeight: 400,
                          fontSize: 15, color: "#d4dde8", lineHeight: 1.75,
                          letterSpacing: "0.01em",
                        }}>
                          {msg.content.substring(0, 400)}{msg.content.length > 400 ? "…" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── SEARCH TAB ── */}
          {activeTab === "search" && (
            <div style={{ paddingBottom: 60 }}>
              <ModeBanner mode="search" />
              <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 16 }}>🧲 Semantic Search</h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    placeholder="Search chunks by meaning…"
                    style={{ flex: 1, padding: "14px 20px", borderRadius: 30, border: "1px solid rgba(255,215,0,0.2)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 14, outline: "none" }}
                  />
                  <button onClick={doSearch} disabled={searchLoading || !searchQuery.trim()}
                    style={{ padding: "14px 28px", borderRadius: 30, border: "none", background: searchLoading ? "#333" : `linear-gradient(135deg, ${C.gold}, #ca8a04)`, color: C.void, fontWeight: 700, cursor: searchLoading || !searchQuery.trim() ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {searchLoading ? "…" : "Search →"}
                  </button>
                </div>
              </div>

              {searchLoading && <LoadingSkeleton mode="search" />}

              {!searchLoading && searchError && (
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textSecondary, textAlign: "center", padding: 20 }}>{searchError}</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {searchResults.map((chunk, i) => (
                    <div key={i} style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 14, padding: 20, animation: "fadeSlideUp 0.3s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.gold, background: "rgba(255,215,0,0.08)", padding: "2px 10px", borderRadius: 10 }}>
                            Chunk #{chunk.chunk_id ?? i + 1}
                          </span>
                          {chunk.pdf_name && (
                            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                              {chunk.pdf_name}
                            </span>
                          )}
                        </div>
                        {chunk.relevance != null && (
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: getConfColor(chunk.relevance), fontWeight: 700 }}>
                            {Math.round(chunk.relevance)}% match
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontWeight: 400,
                        fontSize: 14, color: "#c8d4de", lineHeight: 1.75,
                        letterSpacing: "0.01em",
                      }}>
                        {(chunk.text || chunk.content || "").substring(0, 400)}
                        {(chunk.text || chunk.content || "").length > 400 ? "…" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}