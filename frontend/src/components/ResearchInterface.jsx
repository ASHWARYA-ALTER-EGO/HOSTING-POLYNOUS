import { useState, useEffect, useRef } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

function Icon({ name, style }) {
  return <span style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight: 1, ...(style || {}) }}>{name}</span>
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
    @keyframes borderPulse{0%,100%{opacity:0.5}50%{opacity:1}}
    .research-scrollbar::-webkit-scrollbar{width:4px}
    .research-scrollbar::-webkit-scrollbar-track{background:transparent}
    .research-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,255,15,0.2);border-radius:10px}
  `}</style>;
}

// ─── Neural Canvas ────────────────────────────────────────────
function NeuralCanvas({ isResearching }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d");
    let particles = [], animId; const N = 120;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight };
    window.addEventListener("resize", resize); resize();
    for (let i = 0; i < N; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*(isResearching?0.8:0.4), vy: (Math.random()-0.5)*(isResearching?0.8:0.4), size: Math.random()*2+1, opacity: Math.random()*0.4+(isResearching?0.3:0.1) });
    const loop = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,15,${p.opacity})`;ctx.fill();for(let j=i+1;j<particles.length;j++){const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);if(d<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(0,255,15,${0.08*(1-d/100)})`;ctx.lineWidth=0.3;ctx.stroke()}}});animId=requestAnimationFrame(loop)};loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [isResearching]);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── Thinking Canvas with 7 Agent Nodes ───────────────────────
const agentNodes = [
  { color: C.cyan, icon: "search", title: "Search", shadow: C.cyan },
  { color: "#5878d4", icon: "auto_awesome", title: "Summariser", shadow: "#5878d4" },
  { color: "#ffaa00", icon: "priority_high", title: "Critic", shadow: "#ffaa00" },
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
        const radius = 160;
        const offset = (index / agentNodes.length) * Math.PI * 2;
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
        {/* Center Hub */}
        <div style={{ textAlign: "center", zIndex: 10, background: "rgba(10,10,30,0.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,255,15,0.2)", borderRadius: "50%", width: 150, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,255,15,0.1)" }}>
          <Icon name="hub" style={{ color: C.green, fontSize: 32, marginBottom: 4, animation: "pulse-green 2s infinite" }} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.green, textTransform: "uppercase" }}>SYNTHESIZING</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{Math.round(completedCount * 14.2)}%</div>
        </div>

        {/* Agent Nodes */}
        {agentNodes.map((node, i) => {
          const completed = agentProgress.some(p => p.agent?.toLowerCase().includes(node.title.toLowerCase()));
          const isActive = activeAgent?.title === node.title;
          const angle = (i / agentNodes.length) * Math.PI * 2;
          const r = 160;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          return (
            <div key={node.title} ref={el => nodeRefs.current[i] = el} title={node.title}
              style={{
                position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)", width: isActive ? 44 : 36, height: isActive ? 44 : 36,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: completed ? node.color : "rgba(255,255,255,0.1)",
                boxShadow: completed ? `0 0 15px ${node.shadow}` : "none",
                border: isActive ? `2px solid ${node.color}` : node.border ? `1px solid ${node.border}` : "none",
                opacity: completed || isActive ? 1 : 0.3, transition: "all 0.5s",
                animation: isActive ? "pulse-green 1.5s infinite" : "none"
              }}>
              <Icon name={node.icon} style={{ color: node.iconColor || (completed ? "#0a0a1e" : C.textSecondary), fontSize: isActive ? 20 : 16 }} />
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div style={{ marginTop: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, textAlign: "center" }}>
        {agentProgress.map((p, i) => (
          <span key={i} style={{ color: C.green, margin: "0 6px" }}>✓ {p.agent}</span>
        ))}
        {activeAgent && <span style={{ color: C.cyan }}>⚡ {activeAgent.title} working...</span>}
      </div>
    </div>
  );
}

// ─── COLLAPSIBLE SIDEBAR ──────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research", active: true },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20 }}>
      <button onClick={()=>setCollapsed(false)} style={{background:"none",border:"none",color:C.green,cursor:"pointer",marginBottom:32}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?C.green:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div>
        <div title={user?.username||'Guest'} style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(0,255,15,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="face" style={{color:C.green,fontSize:14}}/></div>
        <div onClick={handleLogout} title="Disconnect" style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1),padding 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}>
        <div style={{flex:1,minWidth:0}}><h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.green,letterSpacing:"-0.03em",whiteSpace:"nowrap"}}>POLYNOUS</h1><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p></div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=C.textSecondary}><Icon name="chevron_left" style={{fontSize:20}}/></button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>
        {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.green:C.onSurfaceVariant,background:active?"rgba(0,255,15,0.08)":"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden"}} onMouseEnter={e=>{if(!active){e.target.style.color=C.green;e.target.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.target.style.color=C.onSurfaceVariant;e.target.style.background="transparent"}}}><Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span></div>)}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.green,color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.transform="scale(1.03)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:C.void,flexShrink:0}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(0,255,15,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.green,fontSize:22}}/></div><div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button></div></div>
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ResearchInterface({ user, onStartResearch, onNavigate, onLogout }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentProgress, setAgentProgress] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState([]);

  const suggestionPills = [
    "What is artificial intelligence?",
    "How does quantum computing work?",
    "Explain CRISPR gene editing",
    "Is nuclear energy safe?",
    "How does blockchain work?",
  ];

  const startResearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true); setAnswer(""); setSources([]); setConfidence(0); setAgentProgress([]); setAgentStatus("Initializing...");

    try {
      const res = await fetch("http://localhost:8000/ask-stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, debate_mode: false })
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
              else if (data.type === "token") fullAnswer += (data.content || "");
              else if (data.type === "citations") srcList = data.citations || [];
              else if (data.type === "confidence") confScore = data.score || 0;
              else if (data.type === "end") {
                setAnswer(fullAnswer); setSources(srcList); setConfidence(confScore); setAgentStatus("");
                setHistory(prev => [{ query, confidence: confScore, date: new Date().toLocaleDateString() }, ...prev].slice(0, 10));
              }
            } catch(e) {}
          }
        }
        setAnswer(fullAnswer);
      }
    } catch(e) { setAgentStatus("Connection error"); }
    finally { setLoading(false); }
  };

  const getConfColor = (v) => { if (v >= 80) return C.green; if (v >= 60) return "#ffaa00"; return C.crimson; };

  return (
    <div style={{ minHeight: "100vh", background: C.void, position: "relative", overflow: "auto" }}>
      <Styles />
      <NeuralCanvas isResearching={loading} />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ marginLeft: sidebarCollapsed ? 56 : 320, padding: "24px 32px", position: "relative", zIndex: 10, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)", maxWidth: "none", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, color: C.green, margin: "0 0 4px", letterSpacing: "-0.02em" }}>🔬 Neural Research Engine</h1>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "3px" }}>7 Agents. One Answer. Infinite Knowledge.</p>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(25,25,46,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,255,15,0.3)", borderRadius: 50, padding: "16px 24px", boxShadow: "0 0 20px rgba(0,255,15,0.1)" }}>
              <span style={{ color: C.green, marginRight: 16, fontSize: 20 }}>🧠</span>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask any research question..." onKeyDown={e => e.key === "Enter" && startResearch()} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16 }} disabled={loading} />
              <button onClick={startResearch} disabled={loading || !query.trim()} style={{ background: loading ? "#333" : C.green, color: C.void, padding: "12px 28px", borderRadius: 30, border: "none", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 25px rgba(0,255,15,0.3)", transition: "all 0.3s" }}>
                {loading ? "Thinking..." : "Research →"}
              </button>
            </div>
          </div>

          {/* Suggestion Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {suggestionPills.map(pill => (
              <button key={pill} onClick={() => { setQuery(pill); startResearch(); }} style={{ padding: "8px 18px", borderRadius: 25, background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, color: C.textSecondary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, transition: "all 0.2s" }}>{pill}</button>
            ))}
          </div>

          {/* Thinking Canvas */}
          {loading && <ThinkingCanvas agentStatus={agentStatus} agentProgress={agentProgress} />}

          {/* Answer */}
          {answer && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeSlideUp 0.5s ease" }}>
              {/* Confidence Bar */}
              <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="verified_user" style={{ color: C.cyan }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Research Confidence</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 120, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ width: `${confidence}%`, height: "100%", background: getConfColor(confidence), borderRadius: 4, transition: "width 1s" }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: getConfColor(confidence), fontWeight: 700 }}>{confidence}%</span>
                </div>
              </div>

              {/* Main Answer Card */}
              <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,255,15,0.2)", borderRadius: 18, padding: 32, borderLeft: "4px solid " + C.green }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 16 }}>📋 Research Synthesis</div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: "#c8d6e5", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{answer}</div>

                {/* Sources */}
                {sources.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>📚 Sources</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sources.map((s, i) => (
                        <span key={i} style={{ padding: "4px 12px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid " + C.white10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>
                          [{i+1}] {typeof s === "string" ? s : s.title || "Source"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => navigator.clipboard.writeText(answer)} style={{ padding: "10px 20px", borderRadius: 25, border: "1px solid " + C.white10, background: "rgba(255,255,255,0.03)", color: "#ccc", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>📋 Copy</button>
                <button onClick={() => { setAnswer(""); setQuery(""); setSources([]); setConfidence(0); }} style={{ padding: "10px 20px", borderRadius: 25, border: "1px solid " + C.white10, background: "rgba(255,255,255,0.03)", color: "#ccc", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>🔄 New Research</button>
              </div>
            </div>
          )}

          {/* Research History */}
          {history.length > 0 && (
            <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid " + C.white10 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📅 Research History</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {history.map((h, i) => (
                  <div key={i} onClick={() => { setQuery(h.query); startResearch({ preventDefault: () => {} }); }} style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid " + C.white10, borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: getConfColor(h.confidence), marginBottom: 4 }}>{h.confidence}% confidence</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.query}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textSecondary, marginTop: 4 }}>{h.date}</div>
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