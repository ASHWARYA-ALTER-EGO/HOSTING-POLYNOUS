import { useState, useEffect, useRef, useCallback } from "react";

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
    ::selection{background:rgba(255,32,64,0.25)}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse-crimson{0%,100%{box-shadow:0 0 10px rgba(255,32,64,0.2)}50%{box-shadow:0 0 25px rgba(255,32,64,0.6)}}
    .pulse-input{animation:pulse-crimson 2s infinite}
    .fade-up{animation:fadeSlideUp 0.5s ease forwards}
    .custom-scrollbar::-webkit-scrollbar{width:4px}
    .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
    .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,32,64,0.2);border-radius:10px}
    .nav-link{transition:all 0.2s;cursor:pointer}
    .nav-link:hover{color:#ff2040!important;background:rgba(255,255,255,0.05)!important}
  `}</style>;
}

// ─── Neural Particle Background ───────────────────────────────
function NeuralCanvas({ debateActive }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d");
    let particles = [], animId; const N = 120;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight };
    window.addEventListener("resize", resize); resize();
    for (let i = 0; i < N; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*(debateActive?0.8:0.4), vy: (Math.random()-0.5)*(debateActive?0.8:0.4), size: Math.random()*2+1, opacity: Math.random()*0.4+(debateActive?0.3:0.1) });
    const loop = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,32,64,${p.opacity})`;ctx.fill();for(let j=i+1;j<particles.length;j++){const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);if(d<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(255,32,64,${0.08*(1-d/100)})`;ctx.lineWidth=0.3;ctx.stroke()}}});animId=requestAnimationFrame(loop)};loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [debateActive]);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── ALL DEBATE TOPICS (for shuffling pills) ────────────────────────────────
const ALL_DEBATE_TOPICS = [
  "Should AI development be regulated globally?",
  "Is nuclear energy the solution to climate change?",
  "Should we colonize Mars?",
  "Are cryptocurrencies the future of finance?",
  "Should genetic engineering be allowed in humans?",
  "Is universal basic income economically viable?",
  "Should social media platforms be regulated like public utilities?",
  "Is remote work better for productivity than office work?",
  "Should animal testing be banned entirely?",
  "Is space exploration worth the cost?",
  "Should voting be mandatory?",
  "Is free speech absolute on the internet?",
  "Should we ban fossil fuels by 2030?",
  "Is artificial consciousness possible?",
  "Should billionaires exist?",
  "Is capitalism sustainable long-term?",
  "Should we bring back extinct species?",
  "Is privacy more important than security?",
  "Should schools teach cryptocurrency?",
  "Is telemedicine as effective as in-person care?",
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
  const VISIBLE = 6;
  const [displayed, setDisplayed] = useState(() => shuffleArray(ALL_DEBATE_TOPICS).slice(0, VISIBLE));
  const [fadingOut, setFadingOut] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFadingOut(true);
      setTimeout(() => {
        setDisplayed(shuffleArray(ALL_DEBATE_TOPICS).slice(0, VISIBLE));
        setFadingOut(false);
      }, 420);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32,
      opacity: fadingOut ? 0 : 1, transform: fadingOut ? "translateY(6px)" : "translateY(0)",
      transition: "opacity 0.42s ease, transform 0.42s ease",
    }}>
      {displayed.map((pill, i) => (
        <button
          key={pill}
          onClick={() => onSelect(pill)}
          style={{
            padding: "11px 22px", borderRadius: 30, background: "rgba(10,10,30,0.7)",
            backdropFilter: "blur(20px)", border: "1px solid rgba(255,32,64,0.18)",
            color: "rgba(200,210,230,0.85)", cursor: "pointer",
            fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 500,
            transition: "all 0.22s ease", animation: `fadeSlideUp 0.4s ${i * 60}ms ease both`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,32,64,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,32,64,0.5)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(10,10,30,0.7)";
            e.currentTarget.style.borderColor = "rgba(255,32,64,0.18)";
            e.currentTarget.style.color = "rgba(200,210,230,0.85)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {pill}
        </button>
      ))}
    </div>
  );
}

// ─── RED THEMED COLLAPSIBLE SIDEBAR ──────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate", active: true },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20 }}>
      <button onClick={()=>setCollapsed(false)} style={{ background:"none", border:"none", color: C.crimson, cursor:"pointer", marginBottom:32 }}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?C.crimson:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:C.crimson,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div>
        <div title={user?.username||'Guest'} style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${C.crimson}`}}><Icon name="face" style={{color:C.crimson,fontSize:14}}/></div>
        <div onClick={handleLogout} title="Disconnect" style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(255,32,64,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1),padding 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:C.crimson, letterSpacing:"-0.03em", whiteSpace:"nowrap" }}>POLYNOUS</h1>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=C.textSecondary}>
          <Icon name="chevron_left" style={{fontSize:20}}/>
        </button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>
        {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.crimson:C.onSurfaceVariant,background:active?`${C.crimson}15`:"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden"}} onMouseEnter={e=>{if(!active){e.target.style.color=C.crimson;e.target.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.target.style.color=C.onSurfaceVariant;e.target.style.background="transparent"}}}><Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span></div>)}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.crimson,color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.transform="scale(1.03)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:C.void,flexShrink:0}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${C.crimson}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.crimson,fontSize:22}}/></div>
          <div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button></div>
        </div>
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function DebateInterface({ user, onNavigate, onStartResearch, onLogout }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [debateResult, setDebateResult] = useState(null);
  const [forPoints, setForPoints] = useState([]);
  const [againstPoints, setAgainstPoints] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [agentStatus, setAgentStatus] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const inputRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const startDebate = async (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true); setDebateResult(null); setForPoints([]); setAgainstPoints([]); setVerdict(null); setAgentStatus("Activating debate agents...");

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topic, debate_mode: true })
      });
      const data = await res.json();
      if (data.answer) {
        const fullText = data.answer;
        const forMatch = fullText.match(/FOR POSITION[\s\S]*?(?=AGAINST POSITION|$)/i);
        const againstMatch = fullText.match(/AGAINST POSITION[\s\S]*?(?=WINNER|SCORES|JUDGE|VERDICT|$)/i);
        
        const forRaw = forMatch ? forMatch[0].replace(/FOR POSITION/i,"").replace(/\([\d.]+\/10\)/,"").trim() : "";
        const againstRaw = againstMatch ? againstMatch[0].replace(/AGAINST POSITION/i,"").replace(/\([\d.]+\/10\)/,"").trim() : "";
        
        setForPoints(forRaw.split(/\n\s*[•\-]\s*/).filter(p => p.trim().length > 10).map(p => p.trim()));
        setAgainstPoints(againstRaw.split(/\n\s*[•\-]\s*/).filter(p => p.trim().length > 10).map(p => p.trim()));
        
        setVerdict(data.debate_verdict || { winner: "TIE", for_score: 5, against_score: 5, reasoning: "Both sides presented valid arguments." });
        setDebateResult(true);
        setHistory(prev => [{ topic, verdict: data.debate_verdict, date: new Date().toLocaleDateString() }, ...prev].slice(0, 10));
      }
      setAgentStatus("");
    } catch (e) { setAgentStatus("Connection error"); }
    finally { setLoading(false); }
  };

  const handleSuggestion = (pill) => { setTopic(pill); startDebate({ preventDefault: () => {} }); };
  const handleNewDebate = () => { setDebateResult(null); setTopic(""); setForPoints([]); setAgainstPoints([]); setVerdict(null); };

  return (
    <div style={{
      minHeight: "100vh", background: C.void, position: "relative", overflow: "auto",
      opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.65s ease, transform 0.65s ease",
    }}>
      <Styles />
      <NeuralCanvas debateActive={loading} />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ 
        marginLeft: sidebarCollapsed ? 56 : 320,
        padding: "24px 32px", 
        position: "relative", 
        zIndex: 10, 
        transition: "margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)",
        maxWidth: "none",
        boxSizing: "border-box"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 10, animation: "fadeSlideUp 0.6s ease both" }}>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800, color: C.crimson, margin: "0 0 10px", letterSpacing: "-0.03em", textShadow: "0 0 40px rgba(255,32,64,0.3)" }}>⚖️ Debate Chamber</h1>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "3px" }}>Neural Argument Synthesis</p>
          </div>

          {/* Proposition Input */}
          {!debateResult && (
            <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,32,64,0.2)", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 0 30px rgba(255,32,64,0.1)", animation: "fadeSlideUp 0.6s 0.1s ease both" }}>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.crimson, textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: 12 }}>Enter Proposition</label>
              <form onSubmit={startDebate} style={{ display: "flex", gap: 12 }}>
                <input ref={inputRef} type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Should AI be regulated by governments worldwide?" style={{ flex: 1, padding: "16px 22px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, outline: "none" }} disabled={loading} />
                <button type="submit" disabled={loading || !topic.trim()} style={{ padding: "13px 32px", borderRadius: 30, border: "none", background: loading ? "#333" : C.crimson, color: "#fff", fontWeight: 700, fontFamily: "'Sora',sans-serif", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 25px rgba(255,32,64,0.3)", transition: "all 0.3s" }}>
                  {loading ? agentStatus || "Debating..." : "Begin Debate →"}
                </button>
              </form>
            </div>
          )}

          {/* Shuffling Pills */}
          {!loading && !debateResult && (
            <div style={{ animation: "fadeSlideUp 0.6s 0.2s ease both" }}>
              <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16, opacity: 0.6 }}>— try one of these —</p>
              <ShufflingPills onSelect={handleSuggestion} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", border: "3px solid rgba(255,32,64,0.15)", borderTop: "3px solid " + C.crimson, animation: "spin 1s infinite", margin: "0 auto 16px" }} />
              <div style={{ fontFamily: "'Sora',sans-serif", color: C.crimson, fontWeight: 600, fontSize: 15 }}>{agentStatus}</div>
            </div>
          )}

          {/* Debate Result */}
          {debateResult && verdict && (
            <>
              <div style={{ textAlign: "center", marginBottom: 20, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)" }}>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.2em", color: "#fff", margin: 0, fontWeight: 600 }}>{topic}</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {/* FOR Panel */}
                <div style={{ background: "rgba(0,255,15,0.02)", border: "1px solid rgba(0,255,15,0.15)", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "rgba(0,255,15,0.06)", padding: "14px 18px", borderBottom: "1px solid rgba(0,255,15,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, boxShadow: "0 0 8px " + C.green }} />
                      <span style={{ fontFamily: "'Sora',sans-serif", color: C.green, fontWeight: 800, fontSize: 15 }}>ARGUMENT FOR</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", color: C.green, fontWeight: 700, fontSize: 13, background: "rgba(0,255,15,0.1)", padding: "4px 12px", borderRadius: 14 }}>{verdict.for_score}/10</span>
                  </div>
                  <div className="custom-scrollbar" style={{ padding: 16, overflowY: "auto", maxHeight: 350 }}>
                    {forPoints.map((point, i) => (
                      <div key={i} style={{ background: "rgba(0,255,15,0.04)", border: "1px solid rgba(0,255,15,0.08)", borderRadius: 10, padding: "12px 16px", marginBottom: 8, color: "#c8d6e5", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, lineHeight: 1.7 }}>
                        <span style={{ color: C.green, fontWeight: 700, marginRight: 8 }}>•</span>{point}
                      </div>
                    ))}
                    {forPoints.length === 0 && <div style={{ color: C.textSecondary, textAlign: "center", padding: 20 }}>No argument points parsed</div>}
                  </div>
                </div>

                {/* AGAINST Panel */}
                <div style={{ background: "rgba(255,32,64,0.02)", border: "1px solid rgba(255,32,64,0.15)", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "rgba(255,32,64,0.06)", padding: "14px 18px", borderBottom: "1px solid rgba(255,32,64,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.crimson, boxShadow: "0 0 8px " + C.crimson }} />
                      <span style={{ fontFamily: "'Sora',sans-serif", color: C.crimson, fontWeight: 800, fontSize: 15 }}>ARGUMENT AGAINST</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", color: C.crimson, fontWeight: 700, fontSize: 13, background: "rgba(255,32,64,0.1)", padding: "4px 12px", borderRadius: 14 }}>{verdict.against_score}/10</span>
                  </div>
                  <div className="custom-scrollbar" style={{ padding: 16, overflowY: "auto", maxHeight: 350 }}>
                    {againstPoints.map((point, i) => (
                      <div key={i} style={{ background: "rgba(255,32,64,0.04)", border: "1px solid rgba(255,32,64,0.08)", borderRadius: 10, padding: "12px 16px", marginBottom: 8, color: "#c8d6e5", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, lineHeight: 1.7 }}>
                        <span style={{ color: C.crimson, fontWeight: 700, marginRight: 8 }}>•</span>{point}
                      </div>
                    ))}
                    {againstPoints.length === 0 && <div style={{ color: C.textSecondary, textAlign: "center", padding: 20 }}>No argument points parsed</div>}
                  </div>
                </div>
              </div>

              {/* Score Bar */}
              <div style={{ marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  <span style={{ color: C.green }}>FOR: {verdict.for_score}/10</span>
                  <span style={{ color: C.crimson }}>AGAINST: {verdict.against_score}/10</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.04)", display: "flex", overflow: "hidden" }}>
                  <div style={{ width: `${(verdict.for_score/10)*100}%`, background: C.green, transition: "width 1s", borderRadius: "5px 0 0 5px" }} />
                  <div style={{ width: `${(verdict.against_score/10)*100}%`, background: C.crimson, transition: "width 1s", borderRadius: "0 5px 5px 0" }} />
                </div>
              </div>

              {/* Verdict */}
              <div style={{ textAlign: "center", padding: 28, background: verdict.winner === "FOR" ? "rgba(0,255,15,0.04)" : verdict.winner === "AGAINST" ? "rgba(255,32,64,0.04)" : "rgba(168,85,247,0.04)", border: `1px solid ${verdict.winner==="FOR"?C.green:verdict.winner==="AGAINST"?C.crimson:C.purple}30`, borderRadius: 18, marginBottom: 24 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>Verdict</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.8em", fontWeight: 900, color: verdict.winner === "FOR" ? C.green : verdict.winner === "AGAINST" ? C.crimson : C.purple, marginBottom: 8 }}>
                  🏆 {verdict.winner} POSITION WINS
                </div>
                {verdict.reasoning && (
                  <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: C.textSecondary, lineHeight: 1.7, maxWidth: 600, margin: "0 auto", fontStyle: "italic" }}>
                    {verdict.reasoning}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 40 }}>
                <button onClick={handleNewDebate} style={{ padding: "12px 24px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
                  🔄 New Debate
                </button>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify({
                  topic,
                  forPoints,
                  againstPoints,
                  verdict
                }, null, 2))} style={{ padding: "12px 24px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
                  📋 Export Results
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}