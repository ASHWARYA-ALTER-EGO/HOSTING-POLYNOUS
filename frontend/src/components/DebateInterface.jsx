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
    @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes dropBounce{0%{opacity:0;transform:translateY(-30px) scale(0.95)}70%{transform:translateY(4px) scale(1.01)}100%{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes orbPulse{0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.4)}50%{box-shadow:0 0 40px rgba(255,215,0,0.8)}}
    @keyframes goldBurst{0%{opacity:0;transform:scale(0.5)}60%{opacity:1;transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}
    @keyframes scoreGrow{from{width:0%}}
    @keyframes winnerPulse{0%,100%{text-shadow:0 0 20px currentColor}50%{text-shadow:0 0 50px currentColor}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes pointPopIn{0%{opacity:0;transform:scale(0.9) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes badgeGlow{0%,100%{box-shadow:0 0 4px currentColor}50%{box-shadow:0 0 12px currentColor}}
    .custom-scrollbar::-webkit-scrollbar{width:4px}
    .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
    .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,32,64,0.2);border-radius:10px}
    .point-box:hover{transform:translateY(-2px)}
    .point-box:hover .point-badge{animation:badgeGlow 0.8s infinite}
  `}</style>;
}

// ─── AnimatedScore hook ──────────────────────────────────────
function useAnimatedScore(target, delay = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const timeout = setTimeout(() => {
      const duration = 1200, start = performance.now();
      function step(now) { const p = Math.min((now - start) / duration, 1); setVal(parseFloat((target * p).toFixed(1))); if (p < 1) requestAnimationFrame(step); else setVal(target); }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return val;
}

// ─── IMPROVED Argument Splitter ─────────────────────────────
function splitArgumentPoints(text) {
  if (!text) return [];
  
  // Clean markdown and AI artifacts
  let cleaned = text
    .replace(/^#+\s*.*$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/##\s*/g, "")
    .replace(/(?:ARGUMENT\s*(FOR|AGAINST)[\s:]*)/gi, "")
    .trim();

  // Strategy 1: Split by "Point X:" or "Counter-Point X:"
  // This is what the backend now outputs
  const pointSplit = cleaned.split(/\n\s*(?=(?:Point|Counter-Point)\s*\d+\s*:)/i);
  if (pointSplit.length >= 2) {
    const filtered = pointSplit
      .map(p => p.replace(/^(?:Point|Counter-Point)\s*\d+\s*:\s*/i, "").trim())
      .filter(p => p.length > 25);
    if (filtered.length >= 2) return filtered;
  }

  // Strategy 2: Split by numbered patterns
  const numSplit = cleaned.split(/\n\s*\d+\.\s+/);
  if (numSplit.length >= 3) {
    const filtered = numSplit.filter(p => p.trim().length > 25).map(p => p.trim());
    if (filtered.length >= 2) return filtered;
  }

  // Strategy 3: Split by bullet points
  const bulletSplit = cleaned.split(/\n\s*[•\-]\s+/);
  if (bulletSplit.length >= 2) {
    const filtered = bulletSplit.filter(p => p.trim().length > 20).map(p => p.trim());
    if (filtered.length >= 2) return filtered;
  }

  // Strategy 4: Split by double newlines
  const paraSplit = cleaned.split(/\n\s*\n/);
  if (paraSplit.length >= 2) {
    const filtered = paraSplit.filter(p => p.trim().length > 20).map(p => p.trim());
    if (filtered.length >= 2) return filtered;
  }

  // Fallback
  return [cleaned.trim()].filter(p => p.length > 10);
}

// ─── Point Box Component ────────────────────────────────────
function PointBox({ point, index, side, color, accentColor, glowColor }) {
  const icons = {
    for: ["🔬", "📊", "💡", "🔑", "✅", "⭐", "🎯", "🏆"],
    against: ["⚠️", "🔴", "❌", "🚫", "💢", "⚡", "🔥", "🛑"]
  };
  const icon = (icons[side] || icons.for)[index % 8];
  const borderColor = side === "for" ? "rgba(0,255,15,0.15)" : "rgba(255,32,64,0.15)";
  const hoverBorderColor = side === "for" ? "rgba(0,255,15,0.4)" : "rgba(255,32,64,0.4)";
  const boxShadowColor = side === "for" ? "rgba(0,255,15,0.04)" : "rgba(255,32,64,0.04)";

  return (
    <div
      className="point-box"
      style={{
        background: `linear-gradient(165deg, ${accentColor}06, ${accentColor}02)`,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: "22px 24px",
        marginBottom: 16,
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        cursor: "default",
        boxShadow: `0 1px 8px ${boxShadowColor}`,
        animation: `pointPopIn 0.5s ${index * 100 + 150}ms ease both`,
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorderColor;
        e.currentTarget.style.boxShadow = `0 6px 24px ${boxShadowColor}, 0 0 0 1px ${hoverBorderColor}`;
        e.currentTarget.style.background = `linear-gradient(165deg, ${accentColor}10, ${accentColor}04)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.boxShadow = `0 1px 8px ${boxShadowColor}`;
        e.currentTarget.style.background = `linear-gradient(165deg, ${accentColor}06, ${accentColor}02)`;
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "35%", background: `linear-gradient(to bottom, ${color}, transparent)`, borderRadius: "0 0 3px 0", opacity: 0.7 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div className="point-badge" style={{ minWidth: 36, height: 36, borderRadius: "50%", background: `${accentColor}15`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: color, boxShadow: `0 0 10px ${glowColor}33` }}>
          {index + 1}
        </div>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px", color: color, fontWeight: 700, background: `${accentColor}10`, padding: "4px 12px", borderRadius: 20 }}>
          {side === "for" ? "Supporting Argument" : "Counter Argument"}
        </span>
      </div>

      {/* Content */}
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 2, color: "#d0d6e2", margin: 0, paddingLeft: 6, letterSpacing: "0.01em", fontWeight: 400 }}>
        {point.replace(/^(?:Point|Counter-Point)\s*\d+\s*:\s*/i, "").trim()}
      </p>

      {/* Bottom shimmer */}
      <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}18, transparent)`, borderRadius: 1 }} />
    </div>
  );
}

// ─── Particle Arena ──────────────────────────────────────────
function ParticleArena({ winner }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, MID = W / 2;
    const particles = [], sparks = [];
    for (let i = 0; i < 32; i++) {
      const side = i < 16 ? "for" : "against";
      const wb = winner ? (winner === "FOR" ? (side === "for" ? 1.6 : 0.7) : (side === "against" ? 1.6 : 0.7)) : 1;
      particles.push({ side, x: side === "for" ? Math.random() * (MID - 60) : MID + 60 + Math.random() * (MID - 80), y: 10 + Math.random() * (H - 20), vx: side === "for" ? (1.2 + Math.random() * 1.4) * wb : -(1.2 + Math.random() * 1.4) * wb, vy: (Math.random() - 0.5) * 0.8, r: 2 + Math.random() * 2.5, life: Math.random() * Math.PI * 2 });
    }
    function spawnSpark(x, y) { for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 2.5; sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: 1.5 + Math.random() * 2 }); } }
    let animId;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(MID, H / 2, 0, MID, H / 2, 70);
      grad.addColorStop(0, "rgba(168,85,247,0.12)"); grad.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = grad; ctx.fillRect(MID - 90, 0, 180, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life += 0.02;
        if (p.side === "for" && p.x > MID + 25) { p.x = Math.random() * 50; p.y = 10 + Math.random() * (H - 20); spawnSpark(MID + (Math.random() - 0.5) * 40, 10 + Math.random() * (H - 20)); }
        if (p.side === "against" && p.x < MID - 25) { p.x = MID + 70 + Math.random() * (MID - 90); p.y = 10 + Math.random() * (H - 20); spawnSpark(MID + (Math.random() - 0.5) * 40, 10 + Math.random() * (H - 20)); }
        if (p.y < 6) p.vy = Math.abs(p.vy); if (p.y > H - 6) p.vy = -Math.abs(p.vy);
        const alpha = 0.45 + Math.sin(p.life) * 0.3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.side === "for" ? `rgba(0,255,15,${alpha})` : `rgba(255,32,64,${alpha})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.side === "for" ? "rgba(0,255,15,0.04)" : "rgba(255,32,64,0.04)"; ctx.fill();
      });
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= 0.91; s.vy *= 0.91; s.life -= 0.04; if (s.life <= 0) { sparks.splice(i, 1); continue; } ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,215,0,${s.life * 0.9})`; ctx.fill(); }
      animId = requestAnimationFrame(loop);
    }
    loop(); return () => cancelAnimationFrame(animId);
  }, [winner]);
  return <canvas ref={ref} width={860} height={90} style={{ width: "100%", height: 90, display: "block" }} />;
}

// ─── Neural Background ───────────────────────────────────────
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

// ─── DEBATE TOPICS ───────────────────────────────────────────
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

function shuffleArray(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function ShufflingPills({ onSelect }) {
  const VISIBLE = 6;
  const [displayed, setDisplayed] = useState(() => shuffleArray(ALL_DEBATE_TOPICS).slice(0, VISIBLE));
  const [fadingOut, setFadingOut] = useState(false);
  const intervalRef = useRef(null);
  useEffect(() => { intervalRef.current = setInterval(() => { setFadingOut(true); setTimeout(() => { setDisplayed(shuffleArray(ALL_DEBATE_TOPICS).slice(0, VISIBLE)); setFadingOut(false); }, 420); }, 4000); return () => clearInterval(intervalRef.current); }, []);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32, opacity: fadingOut ? 0 : 1, transform: fadingOut ? "translateY(6px)" : "translateY(0)", transition: "opacity 0.42s ease, transform 0.42s ease" }}>
      {displayed.map((pill, i) => (
        <button key={pill} onClick={() => onSelect(pill)} style={{ padding: "12px 24px", borderRadius: 30, background: "rgba(10,10,30,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,32,64,0.15)", color: "rgba(200,210,230,0.85)", cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease", animation: `fadeSlideUp 0.4s ${i * 60}ms ease both` }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,32,64,0.08)"; e.currentTarget.style.borderColor = "rgba(255,32,64,0.4)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(10,10,30,0.7)"; e.currentTarget.style.borderColor = "rgba(255,32,64,0.15)"; e.currentTarget.style.color = "rgba(200,210,230,0.85)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >{pill}</button>
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate", active: true },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
     { icon: "settings", label: "Settings", path: "/settings" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');
  if (collapsed) return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20 }}>
      <button onClick={()=>setCollapsed(false)} style={{ background:"none",border:"none",color:C.crimson,cursor:"pointer",marginBottom:32 }}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?C.crimson:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}><div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:C.crimson,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div><div title={user?.username||'Guest'} style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${C.crimson}`}}><Icon name="face" style={{color:C.crimson,fontSize:14}}/></div><div onClick={handleLogout} style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div></div>
    </aside>
  );
  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(255,32,64,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}><div style={{flex:1,minWidth:0}}><h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.crimson,letterSpacing:"-0.03em",whiteSpace:"nowrap"}}>POLYNOUS</h1><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p></div><button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=C.textSecondary}><Icon name="chevron_left" style={{fontSize:20}}/></button></div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>{NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.crimson:C.onSurfaceVariant,background:active?`${C.crimson}15`:"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden"}} onMouseEnter={e=>{if(!active){e.target.style.color=C.crimson;e.target.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.target.style.color=C.onSurfaceVariant;e.target.style.background="transparent"}}}><Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span></div>)}</nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}><button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.crimson,color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.transform="scale(1.03)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:C.void,flexShrink:0}}/>New Research</button><div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${C.crimson}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.crimson,fontSize:22}}/></div><div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button></div></div></div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
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
  const [answerLength, setAnswerLength] = useState("detailed");

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const startDebate = async (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true); setDebateResult(null); setForPoints([]); setAgainstPoints([]); setVerdict(null);
    setAgentStatus("Activating debate agents...");

    try {
      const enhancedQuery = answerLength === "detailed" 
        ? `${topic} Please provide comprehensive, detailed arguments with specific examples, data points, and thorough explanations for each point.`
        : topic;

      const res = await fetch("http://localhost:8000/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: enhancedQuery, debate_mode: true })
      });
      const data = await res.json();
      
      if (data.answer) {
        const fullText = data.answer;
        
        const forMatch = fullText.match(/FOR POSITION[\s\S]*?(?=AGAINST POSITION|$)/i);
        let forRaw = forMatch ? forMatch[0].replace(/FOR POSITION/i, "").replace(/\([\d.]+\/10\)/, "").trim() : "";
        
        const againstMatch = fullText.match(/AGAINST POSITION[\s\S]*?(?=WINNER|SCORES|JUDGE|VERDICT|$)/i);
        let againstRaw = againstMatch ? againstMatch[0].replace(/AGAINST POSITION/i, "").replace(/\([\d.]+\/10\)/, "").trim() : "";

        setForPoints(splitArgumentPoints(forRaw));
        setAgainstPoints(splitArgumentPoints(againstRaw));
        
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
    <div style={{ minHeight: "100vh", background: C.void, position: "relative", overflow: "auto", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(18px)", transition: "opacity 0.65s ease, transform 0.65s ease" }}>
      <Styles />
      <NeuralCanvas debateActive={loading} />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ marginLeft: sidebarCollapsed ? 56 : 320, padding: "28px 36px", position: "relative", zIndex: 10, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)", maxWidth: "none", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1050, margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 10, animation: "fadeSlideUp 0.6s ease both" }}>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800, color: C.crimson, margin: "0 0 8px", letterSpacing: "-0.03em", textShadow: "0 0 40px rgba(255,32,64,0.3)" }}>Debate Chamber</h1>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "2.5px" }}>Evidence-Based Argument Synthesis</p>
          </div>

          {/* Proposition Input */}
          {!debateResult && (
            <div style={{ background: "rgba(10,10,30,0.55)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,32,64,0.18)", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 0 30px rgba(255,32,64,0.06)", animation: "fadeSlideUp 0.6s 0.1s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.crimson, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>Enter Proposition</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ key: "concise", label: "Concise" }, { key: "detailed", label: "Detailed" }].map(({ key, label }) => (
                    <button key={key} onClick={() => setAnswerLength(key)} style={{ padding: "4px 12px", borderRadius: 14, border: `1px solid ${answerLength === key ? C.crimson : "rgba(255,255,255,0.1)"}`, background: answerLength === key ? "rgba(255,32,64,0.1)" : "transparent", color: answerLength === key ? C.crimson : C.textSecondary, cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>{label}</button>
                  ))}
                </div>
              </div>
              <form onSubmit={startDebate} style={{ display: "flex", gap: 12 }}>
                <input ref={inputRef} type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Should artificial intelligence be regulated by international treaties?" style={{ flex: 1, padding: "16px 22px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, outline: "none" }} disabled={loading} />
                <button type="submit" disabled={loading || !topic.trim()} style={{ padding: "14px 34px", borderRadius: 30, border: "none", background: loading ? "#333" : C.crimson, color: "#fff", fontWeight: 700, fontFamily: "'Sora',sans-serif", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 20px rgba(255,32,64,0.25)", transition: "all 0.3s" }}>{loading ? agentStatus || "Analyzing..." : "Begin Debate →"}</button>
              </form>
            </div>
          )}

          {/* Shuffling Pills */}
          {!loading && !debateResult && (
            <div style={{ animation: "fadeSlideUp 0.6s 0.2s ease both" }}>
              <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 16, opacity: 0.5 }}>Suggested Propositions</p>
              <ShufflingPills onSelect={handleSuggestion} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(255,32,64,0.12)", borderTop: "3px solid " + C.crimson, animation: "spin 0.8s linear infinite", margin: "0 auto 18px" }} />
              <div style={{ fontFamily: "'Sora',sans-serif", color: C.crimson, fontWeight: 600, fontSize: 14 }}>{agentStatus}</div>
            </div>
          )}

          {/* Debate Result */}
          {debateResult && verdict && (() => {
            const forScore = verdict.for_score || 0;
            const againstScore = verdict.against_score || 0;
            const total = forScore + againstScore || 1;
            const forPct = Math.round((forScore / 10) * 100);
            const againstPct = Math.round((againstScore / 10) * 100);
            const diamondLeft = `${Math.round(50 + ((forScore - againstScore) / total) * 20)}%`;
            const winColor = verdict.winner === "FOR" ? C.green : verdict.winner === "AGAINST" ? C.crimson : C.purple;
            const winBg = verdict.winner === "FOR" ? "rgba(0,255,15,0.03)" : verdict.winner === "AGAINST" ? "rgba(255,32,64,0.03)" : "rgba(168,85,247,0.03)";
            const winBorder = verdict.winner === "FOR" ? "rgba(0,255,15,0.22)" : verdict.winner === "AGAINST" ? "rgba(255,32,64,0.22)" : "rgba(168,85,247,0.22)";

            return (
              <>
                {/* Topic Banner */}
                <div style={{ textAlign: "center", padding: "16px 24px", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 16, marginBottom: 24, animation: "dropBounce 0.5s ease both" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#a855f7", marginBottom: 6 }}>Proposition Under Review</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600, color: "#e2e0fc", lineHeight: 1.4 }}>{topic}</div>
                </div>

                {/* Judge Orb */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22, animation: "dropBounce 0.5s 0.1s ease both" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ffe566, #ffd700, #c8a000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, animation: "orbPulse 2.5s infinite, goldBurst 0.7s 0.2s ease both", boxShadow: "0 0 24px rgba(255,215,0,0.4)" }}>⚖️</div>
                  <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#ffd700", fontWeight: 600 }}>Judgment Rendered</div>
                </div>

                {/* Podiums */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "start", marginBottom: 22 }}>
                  {/* FOR */}
                  <div style={{ background: "rgba(0,255,15,0.015)", border: "1px solid rgba(0,255,15,0.15)", borderRadius: 18, overflow: "hidden", animation: "slideInLeft 0.5s 0.2s ease both" }}>
                    <div style={{ background: "rgba(0,255,15,0.05)", padding: "15px 22px", borderBottom: "1px solid rgba(0,255,15,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, boxShadow: `0 0 10px ${C.green}` }} /><span style={{ fontFamily: "'Sora',sans-serif", color: C.green, fontWeight: 700, fontSize: 14, letterSpacing: "0.5px" }}>Supporting Arguments</span></div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: C.green, fontWeight: 700, fontSize: 13, background: "rgba(0,255,15,0.08)", padding: "4px 12px", borderRadius: 14 }}>{forScore}/10</span>
                    </div>
                    <div className="custom-scrollbar" style={{ padding: "18px 16px", overflowY: "auto", maxHeight: 450 }}>
                      {forPoints.length > 0 ? forPoints.map((pt, i) => (<PointBox key={i} point={pt} index={i} side="for" color={C.green} accentColor={C.green} glowColor={C.green} />)) : <div style={{ color: C.textSecondary, textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Processing arguments...</div>}
                    </div>
                  </div>

                  {/* VS */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 90, gap: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: "#a855f7" }}>VS</div>
                    {["⚡", "⚡", "⚡"].map((l, i) => <span key={i} style={{ fontSize: 18, animation: `pulse 1.5s ${i * 0.25}s infinite` }}>{l}</span>)}
                  </div>

                  {/* AGAINST */}
                  <div style={{ background: "rgba(255,32,64,0.015)", border: "1px solid rgba(255,32,64,0.15)", borderRadius: 18, overflow: "hidden", animation: "slideInRight 0.5s 0.2s ease both" }}>
                    <div style={{ background: "rgba(255,32,64,0.05)", padding: "15px 22px", borderBottom: "1px solid rgba(255,32,64,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: C.crimson, boxShadow: `0 0 10px ${C.crimson}` }} /><span style={{ fontFamily: "'Sora',sans-serif", color: C.crimson, fontWeight: 700, fontSize: 14, letterSpacing: "0.5px" }}>Counter Arguments</span></div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: C.crimson, fontWeight: 700, fontSize: 13, background: "rgba(255,32,64,0.08)", padding: "4px 12px", borderRadius: 14 }}>{againstScore}/10</span>
                    </div>
                    <div className="custom-scrollbar" style={{ padding: "18px 16px", overflowY: "auto", maxHeight: 450 }}>
                      {againstPoints.length > 0 ? againstPoints.map((pt, i) => (<PointBox key={i} point={pt} index={i} side="against" color={C.crimson} accentColor={C.crimson} glowColor={C.crimson} />)) : <div style={{ color: C.textSecondary, textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Processing arguments...</div>}
                    </div>
                  </div>
                </div>

                {/* Particle Arena */}
                <div style={{ marginBottom: 22, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(168,85,247,0.12)", background: "rgba(10,10,30,0.5)", animation: "dropBounce 0.4s 0.3s ease both" }}>
                  <ParticleArena winner={verdict.winner} />
                </div>

                {/* Score Scales */}
                <div style={{ background: "rgba(10,10,30,0.5)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 16, padding: "18px 24px", marginBottom: 22, animation: "dropBounce 0.4s 0.4s ease both" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.textSecondary, marginBottom: 14 }}>Comparative Analysis</div>
                  {[{ label: "Supporting", pct: forPct, score: forScore, color: C.green, fillBg: "linear-gradient(90deg,rgba(0,255,15,0.4),#00ff0f)", glow: "rgba(0,255,15,0.3)" },{ label: "Counter", pct: againstPct, score: againstScore, color: C.crimson, fillBg: "linear-gradient(90deg,rgba(255,32,64,0.4),#ff2040)", glow: "rgba(255,32,64,0.3)" }].map(({ label, pct, score, color, fillBg, glow }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color, width: 80, textAlign: "right" }}>{label}</span>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: fillBg, borderRadius: 5, boxShadow: `0 0 6px ${glow}`, animation: "scoreGrow 1s 0.6s ease both", animationFillMode: "both" }} /></div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color, width: 36 }}>{score}</span>
                    </div>
                  ))}
                </div>

                {/* Verdict */}
                <div style={{ background: "rgba(10,10,30,0.8)", border: `1px solid ${winBorder}`, borderRadius: 20, padding: "28px 34px", marginBottom: 22, textAlign: "center", boxShadow: `0 0 40px ${winBg}`, animation: "dropBounce 0.6s 0.5s ease both", animationFillBack: "both" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: C.textSecondary, marginBottom: 14 }}>Analysis Verdict</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 900, letterSpacing: "-0.02em", color: winColor, animation: "winnerPulse 2s 1s 3", marginBottom: 18 }}>
                    {verdict.winner === "FOR" ? "Supporting Arguments Prevail" : verdict.winner === "AGAINST" ? "Counter Arguments Prevail" : "Arguments Are Balanced"}
                  </div>
                  <div style={{ width: 50, height: 2, margin: "0 auto 20px", borderRadius: 2, background: winBorder }} />
                  {verdict.reasoning && (() => {
                    const sentences = verdict.reasoning.match(/[^.!?]+[.!?]+/g) || [verdict.reasoning];
                    return (
                      <div style={{ maxWidth: 620, margin: "0 auto 18px", textAlign: "left" }}>
                        {sentences.map((sentence, i) => (
                          <div key={i} style={{
                            display: "flex", gap: 12, marginBottom: 12,
                            fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, lineHeight: 1.8, color: "#9aabb8",
                            padding: "10px 14px", background: "rgba(255,255,255,0.015)", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}>
                            <span style={{ color: winColor, fontWeight: 700, fontSize: 12, minWidth: 20, opacity: 0.6 }}>{i + 1}.</span>
                            <span>{sentence.trim()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {verdict.strongest_point && (
                    <div style={{ background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: 12, padding: "16px 20px", maxWidth: 560, margin: "0 auto" }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#ffd700", marginBottom: 8 }}>Key Insight</div>
                      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "#e2d98a", lineHeight: 1.8 }}>{verdict.strongest_point}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 56 }}>
                  {[{ label: "New Debate", primary: true, onClick: handleNewDebate },{ label: "Export", onClick: () => { const blob = new Blob([JSON.stringify({ topic, forPoints, againstPoints, verdict }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "debate-result.json"; a.click(); } },{ label: "Copy", onClick: () => navigator.clipboard.writeText(JSON.stringify({ topic, forPoints, againstPoints, verdict }, null, 2)) },{ label: "Share", onClick: () => navigator.clipboard.writeText(window.location.href) }].map(({ label, primary, onClick }) => (
                    <button key={label} onClick={onClick} style={{ padding: "10px 22px", borderRadius: 28, border: primary ? "1px solid rgba(255,32,64,0.3)" : "1px solid rgba(255,255,255,0.08)", background: primary ? "rgba(255,32,64,0.08)" : "rgba(255,255,255,0.02)", color: primary ? C.crimson : "#aaa", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = primary ? "rgba(255,32,64,0.14)" : "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.background = primary ? "rgba(255,32,64,0.08)" : "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}>{label}</button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}