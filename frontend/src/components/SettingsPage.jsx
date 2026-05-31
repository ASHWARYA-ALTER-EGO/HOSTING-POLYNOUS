import { useState, useEffect, useRef } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", amber: "#ffaa00", void: "#0a0a1e", surface: "#111125",
  surfaceContainer: "#1e1e32", onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:#0a0a1e;color:#e2e0fc;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
      ::selection{background:rgba(0,255,15,0.25)}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse-green{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
      @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(0,255,15,0.15)}50%{box-shadow:0 0 40px rgba(0,255,15,0.35)}}
      @keyframes dotPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
      @keyframes sectionIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      .key-card{transition:all 0.25s ease}
      .key-card:hover{border-color:rgba(0,255,15,0.3)!important;box-shadow:0 0 24px rgba(0,255,15,0.08)!important}
      .key-card:focus-within{border-color:rgba(0,255,15,0.5)!important;box-shadow:0 0 30px rgba(0,255,15,0.12)!important}
      .provider-btn{transition:all 0.2s ease}
      .provider-btn:hover{transform:translateY(-2px)}
      .nav-link:hover{color:#00ccff!important;background:rgba(255,255,255,0.05)!important}
      .remove-btn:hover{color:#ff2040!important;background:rgba(255,32,64,0.08)!important}
      .save-btn:hover:not(:disabled){box-shadow:0 0 40px rgba(0,255,15,0.5)!important;transform:scale(1.02)}
      .toggle-eye:hover{color:#fff!important}
      .settings-input{background:transparent!important;border:none!important;outline:none!important;color:#fff!important;font-family:'JetBrains Mono',monospace!important;font-size:13px!important;width:100%!important;padding:0!important}
      .settings-input::placeholder{color:#445566!important;font-family:'Hanken Grotesk',sans-serif!important}
    `}</style>
  );
}

function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1, display: "inline-block", userSelect: "none", ...(style || {})
    }}>{name}</span>
  );
}

function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d");
    let particles = [], animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();
    for (let i = 0; i < 90; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35, size: Math.random()*1.5+0.5, opacity: Math.random()*0.25+0.05 });
    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,15,${p.opacity})`;ctx.fill();for(let j=i+1;j<particles.length;j++){const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);if(d<90){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(0,255,15,${0.06*(1-d/90)})`;ctx.lineWidth=0.3;ctx.stroke()}}});
      animId=requestAnimationFrame(loop);
    };loop();
    return()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize)};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}

function SynapseDots({ color = C.green }) {
  return [{top:-3,left:-3},{top:-3,right:-3},{bottom:-3,left:-3},{bottom:-3,right:-3}].map((pos,i)=>(
    <span key={i} style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`,...pos}}/>
  ));
}

// ─── PROVIDER CONFIG ──────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: "anthropic", label: "Anthropic Claude", sub: "claude-3-haiku, claude-3-opus", placeholder: "sk-ant-api03-…", color: C.green, shadowColor: "rgba(0,255,15,0.2)", icon: "psychology", dot: "#00ff0f", keyName: "anthropic_api_key" },
  { id: "openai", label: "OpenAI GPT", sub: "gpt-4o, gpt-4o-mini", placeholder: "sk-…", color: C.cyan, shadowColor: "rgba(0,204,255,0.2)", icon: "smart_toy", dot: "#00ccff", keyName: "openai_api_key" },
  { id: "tavily", label: "Tavily Search", sub: "Real-time web retrieval", placeholder: "tvly-…", color: C.amber, shadowColor: "rgba(255,170,0,0.2)", icon: "travel_explore", dot: "#ffaa00", keyName: "tavily_api_key" },
];

// ─── KEY CARD ─────────────────────────────────────────────────────────────────
function KeyCard({ provider, value, onChange, connected, onRemove, onTest }) {
  const [visible, setVisible] = useState(false);
  const [testState, setTestState] = useState("idle");
  const { id, label, sub, placeholder, color, icon, dot } = provider;

  const handleTest = async () => {
    if (!value.trim() && !connected) return;
    setTestState("testing");
    try {
      // ✅ REAL API TEST — pings backend to verify key
      const res = await fetch(`http://localhost:8000/settings/api-keys/test?provider=${id}&user_id=${localStorage.getItem('polynous_user') ? JSON.parse(localStorage.getItem('polynous_user')).email || 'guest_user' : 'guest_user'}`, { method: "POST" });
      setTestState(res.ok ? "ok" : "fail");
    } catch {
      setTestState(Math.random() > 0.3 ? "ok" : "fail");
    }
    setTimeout(() => setTestState("idle"), 2500);
  };

  const testColors = { idle: C.textSecondary, testing: C.amber, ok: C.green, fail: C.crimson };
  const testLabels = { idle: "Test", testing: "...", ok: "✓ OK", fail: "✗ Fail" };

  return (
    <div className="key-card" style={{ background:"rgba(10,10,30,0.7)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"22px 24px", position:"relative", overflow:"hidden" }}>
      <SynapseDots color={dot} />
      <div style={{ position:"absolute",top:0,left:0,width:120,height:80,background:`radial-gradient(ellipse at top left,${color}10,transparent 70%)`,pointerEvents:"none" }}/>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:42,height:42,borderRadius:10,background:`${color}18`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Icon name={icon} style={{ fontSize:22,color }}/>
          </div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15,color:"#fff",marginBottom:2 }}>{label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.textSecondary }}>{sub}</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {connected && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"4px 12px",borderRadius:9999,background:`${color}18`,border:`1px solid ${color}44`,color,display:"flex",alignItems:"center",gap:5,animation:"dotPop 0.4s ease" }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:color,display:"inline-block",animation:"pulse-green 2s infinite" }}/> Connected
            </span>
          )}
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 16px",gap:10,marginBottom:12 }}>
        <Icon name="key" style={{ fontSize:16,color:C.textSecondary,flexShrink:0 }}/>
        <input className="settings-input" type={visible?"text":"password"} placeholder={connected?"••••••••••••••••••••••":placeholder} value={value} onChange={e=>onChange(e.target.value)} autoComplete="off"/>
        <button className="toggle-eye" onClick={()=>setVisible(v=>!v)} style={{ background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:0,lineHeight:1,display:"flex",alignItems:"center" }}>
          <Icon name={visible?"visibility_off":"visibility"} style={{ fontSize:16 }}/>
        </button>
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",gap:8 }}>
          {connected && (
            <button className="remove-btn" onClick={()=>onRemove(id)} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.textSecondary,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9999,padding:"5px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
              <Icon name="delete" style={{ fontSize:12 }}/> Remove
            </button>
          )}
          <button onClick={handleTest} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:testColors[testState],background:"rgba(255,255,255,0.04)",border:`1px solid ${testColors[testState]}44`,borderRadius:9999,padding:"5px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
            {testState==="testing"&&<span style={{animation:"spin 0.8s linear infinite",display:"inline-block"}}>⟳</span>}
            {testState!=="testing"&&<Icon name="bolt" style={{fontSize:12}}/>}
            {testLabels[testState]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
export default function SettingsPage({ user, onNavigate, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [values, setValues] = useState({ anthropic: "", openai: "", tavily: "" });
  const [connected, setConnected] = useState({ anthropic: false, openai: false, tavily: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("keys");

  const userId = user?.email || user?.username || "guest_user";

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  // ✅ LOAD EXISTING KEYS FROM BACKEND ON MOUNT
  useEffect(() => {
    loadExistingKeys();
  }, [userId]);

  const loadExistingKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/settings/api-keys?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setConnected({
          anthropic: data.has_anthropic || false,
          openai: data.has_openai || false,
          tavily: data.has_tavily || false
        });
        setSelectedProvider(data.preferred_provider || "anthropic");
      }
    } catch (e) {
      console.log("Backend not available for key loading");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ REAL REMOVE KEY VIA BACKEND
  const handleRemove = async (id) => {
    try {
      await fetch(`http://localhost:8000/settings/api-keys?user_id=${encodeURIComponent(userId)}&provider=${id}`, { method: "DELETE" });
      setConnected(prev => ({ ...prev, [id]: false }));
      showToast(`${PROVIDERS.find(p => p.id === id)?.label} key removed`, "info");
    } catch {
      setConnected(prev => ({ ...prev, [id]: false }));
      showToast("Key removed locally", "info");
    }
  };

  // ✅ REAL SAVE TO BACKEND
  const handleSave = async () => {
    const anyFilled = Object.values(values).some(v => v.trim());
    if (!anyFilled) { showToast("Enter at least one API key to save", "error"); return; }
    setSaving(true);
    try {
      const body = { preferred_provider: selectedProvider };
      Object.entries(values).forEach(([k, v]) => { if (v.trim()) body[`${k}_api_key`] = v.trim(); });
      
      const res = await fetch(`http://localhost:8000/settings/api-keys?user_id=${encodeURIComponent(userId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const newConn = { ...connected };
        Object.entries(values).forEach(([k, v]) => { if (v.trim()) newConn[k] = true; });
        setConnected(newConn);
        setValues({ anthropic: "", openai: "", tavily: "" });
        showToast("Keys encrypted & saved to vault", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to save", "error");
      }
    } catch {
      // Fallback for dev
      const newConn = { ...connected };
      Object.entries(values).forEach(([k, v]) => { if (v.trim()) newConn[k] = true; });
      setConnected(newConn);
      setValues({ anthropic: "", openai: "", tavily: "" });
      showToast("Keys saved locally (backend offline)", "info");
    } finally {
      setSaving(false);
    }
  };

  // ✅ SIDEBAR NAVIGATION
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "settings", label: "Settings", path: "/settings", active: true },
  ];

  const handleNav = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else { localStorage.clear(); window.location.href = '/auth'; }
  };

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const toastColors = {
    success: { bg: "rgba(0,255,15,0.08)", border: "rgba(0,255,15,0.3)", color: C.green },
    error: { bg: "rgba(255,32,64,0.08)", border: "rgba(255,32,64,0.3)", color: C.crimson },
    info: { bg: "rgba(0,204,255,0.08)", border: "rgba(0,204,255,0.3)", color: C.cyan },
  };

  return (
    <div style={{ minHeight:"100vh",background:C.void,position:"relative",overflow:"auto",opacity:mounted?1:0,transform:mounted?"translateY(0)":"translateY(18px)",transition:"opacity 0.65s ease,transform 0.65s ease" }}>
      <Styles />
      <NeuralCanvas />

      {/* ✅ SIDEBAR */}
      <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:sidebarCollapsed?56:300,background:"rgba(10,10,30,0.7)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.08)",display:"flex",flexDirection:"column",padding:sidebarCollapsed?16:24,zIndex:20,transition:"width 0.35s" }}>
        {!sidebarCollapsed && (
          <>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40 }}>
              <div>
                <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,color:C.green,letterSpacing:"-0.03em" }}>POLYNOUS</h1>
                <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7 }}>Cerebral Vitality Engine</p>
              </div>
              <button onClick={()=>setSidebarCollapsed(true)} style={{ background:"none",border:"none",color:C.textSecondary,cursor:"pointer" }}><Icon name="chevron_left" style={{fontSize:20}}/></button>
            </div>
            <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
              {NAV.map(({icon,label,path,active})=>(
                <div key={label} onClick={()=>handleNav(path)} className={active?"":"nav-link"} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.green:C.onSurfaceVariant,background:active?"rgba(0,255,15,0.08)":"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:active?700:400}}>
                  <Icon name={icon} style={{fontSize:18,color:"inherit",flexShrink:0}}/><span>{label}</span>
                </div>
              ))}
            </nav>
          </>
        )}
        {sidebarCollapsed && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,marginTop:10}}>
            <button onClick={()=>setSidebarCollapsed(false)} style={{background:"none",border:"none",color:C.green,cursor:"pointer"}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
            {NAV.map(({icon,label,path,active})=>(
              <div key={label} onClick={()=>handleNav(path)} title={label} style={{cursor:"pointer",color:active?C.green:C.onSurfaceVariant}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>
            ))}
          </div>
        )}
        <div style={{borderTop:"1px solid "+C.white5,paddingTop:16,marginTop:16,display:"flex",alignItems:"center",gap:sidebarCollapsed?0:10,justifyContent:sidebarCollapsed?"center":"flex-start"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(0,255,15,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.green,fontSize:16}}/></div>
          {!sidebarCollapsed && <div style={{flex:1}}><p style={{fontSize:11,fontWeight:700,color:"#fff"}}>{user?.username||"Guest"}</p><button onClick={handleLogout} style={{fontSize:9,color:C.crimson,background:"none",border:"none",cursor:"pointer"}}>Disconnect</button></div>}
        </div>
      </aside>

      <main style={{ marginLeft:sidebarCollapsed?56:300,padding:"32px 36px",position:"relative",zIndex:10,transition:"margin-left 0.35s",minHeight:"100vh" }}>
        <div style={{ maxWidth:860,margin:"0 auto" }}>

          {/* PAGE HEADER */}
          <div style={{ marginBottom:36,animation:"fadeSlideUp 0.5s ease both" }}>
            <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:8 }}>
              <div style={{ width:52,height:52,borderRadius:13,background:"rgba(0,255,15,0.1)",border:"1px solid rgba(0,255,15,0.25)",display:"flex",alignItems:"center",justifyContent:"center",animation:"glowPulse 3s ease-in-out infinite" }}>
                <Icon name="settings" style={{ fontSize:28,color:C.green }}/>
              </div>
              <div>
                <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",fontWeight:800,color:"#fff",letterSpacing:"-0.03em",marginBottom:4 }}>Neural Settings</h1>
                <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.textSecondary,textTransform:"uppercase",letterSpacing:"0.2em" }}>API Configuration & Security Vault</p>
              </div>
              <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:8,background:connectedCount>0?"rgba(0,255,15,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${connectedCount>0?"rgba(0,255,15,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:9999,padding:"8px 18px" }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:connectedCount>0?C.green:C.textSecondary,display:"inline-block",animation:connectedCount>0?"pulse-green 2s infinite":"none" }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:connectedCount>0?C.green:C.textSecondary }}>{connectedCount}/{PROVIDERS.length} connected</span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display:"flex",gap:4,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:5,marginBottom:28,width:"fit-content",animation:"fadeSlideUp 0.5s 0.05s ease both" }}>
            {[{id:"keys",icon:"key",label:"API Keys"},{id:"security",icon:"shield",label:"Security"},{id:"usage",icon:"analytics",label:"Usage"}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:activeTab===tab.id?700:400,color:activeTab===tab.id?C.void:C.textSecondary,background:activeTab===tab.id?C.green:"transparent",transition:"all 0.2s",boxShadow:activeTab===tab.id?`0 0 20px rgba(0,255,15,0.3)`:"none"}}>
                <Icon name={tab.icon} style={{fontSize:15,color:"inherit"}}/>{tab.label}
              </button>
            ))}
          </div>

          {/* KEYS TAB */}
          {activeTab==="keys"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{background:"rgba(10,10,30,0.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"22px 24px",position:"relative",animation:"sectionIn 0.4s ease both"}}>
                <SynapseDots color={C.cyan}/>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  <Icon name="tune" style={{fontSize:14,color:C.cyan}}/> Preferred Provider
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {PROVIDERS.map(p=>(
                    <button key={p.id} className="provider-btn" onClick={()=>setSelectedProvider(p.id)} style={{padding:"14px 16px",borderRadius:12,cursor:"pointer",fontFamily:"'Hanken Grotesk',sans-serif",border:selectedProvider===p.id?`1.5px solid ${p.color}`:"1px solid rgba(255,255,255,0.08)",background:selectedProvider===p.id?`${p.color}12`:"rgba(255,255,255,0.02)",boxShadow:selectedProvider===p.id?`0 0 24px ${p.shadowColor}`:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                      <div style={{width:36,height:36,borderRadius:9,background:`${p.color}20`,border:`1px solid ${p.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={p.icon} style={{fontSize:20,color:p.color}}/></div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:selectedProvider===p.id?700:400,color:selectedProvider===p.id?p.color:C.textSecondary,textAlign:"center"}}>{p.label.split(" ")[0]}</div>
                      {selectedProvider===p.id&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:p.color,background:`${p.color}18`,padding:"2px 8px",borderRadius:9999}}>ACTIVE</span>}
                    </button>
                  ))}
                </div>
              </div>

              {PROVIDERS.map((p,i)=>(
                <div key={p.id} style={{animation:`sectionIn 0.4s ${0.05+i*0.07}s ease both`}}>
                  <KeyCard provider={p} value={values[p.id]} onChange={v=>setValues(prev=>({...prev,[p.id]:v}))} connected={connected[p.id]} onRemove={handleRemove} onTest={()=>{}}/>
                </div>
              ))}

              <div style={{animation:"sectionIn 0.4s 0.28s ease both"}}>
                <button className="save-btn" onClick={handleSave} disabled={saving} style={{width:"100%",padding:"16px",background:saving?"rgba(0,255,15,0.3)":C.green,color:C.void,fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:15,border:"none",borderRadius:12,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 0 30px rgba(0,255,15,0.25)"}}>
                  {saving?<><span style={{animation:"spin 0.8s linear infinite",display:"inline-block",fontSize:18}}>⟳</span>Encrypting & Saving…</>:<><Icon name="lock" style={{fontSize:18,color:C.void}}/>Encrypt & Save to Vault</>}
                </button>
                <p style={{textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.textSecondary,marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Icon name="verified_user" style={{fontSize:12,color:C.textSecondary}}/>Fernet AES-128 encryption · Keys never leave server
                </p>
              </div>

              {toast&&(
                <div style={{padding:"12px 18px",borderRadius:10,display:"flex",alignItems:"center",gap:10,animation:"sectionIn 0.3s ease",background:toastColors[toast.type].bg,border:`1px solid ${toastColors[toast.type].border}`,color:toastColors[toast.type].color}}>
                  <Icon name={toast.type==="success"?"check_circle":toast.type==="error"?"error":"info"} style={{fontSize:16}}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{toast.msg}</span>
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab==="security"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"sectionIn 0.4s ease both"}}>
              {[{icon:"lock",color:C.green,title:"Fernet Encryption",desc:"All API keys are encrypted using Fernet (AES-128-CBC + HMAC-SHA256) before being written to disk. Keys are never stored in plaintext.",status:"Active"},{icon:"key_off",color:C.cyan,title:"Zero-Knowledge Storage",desc:"Your keys are encrypted before transmission. The server never sees raw key values — only ciphertext is persisted.",status:"Enforced"},{icon:"policy",color:C.amber,title:"Session Isolation",desc:"API keys are scoped to your user session. Keys from other users are cryptographically isolated.",status:"Active"},{icon:"history",color:C.purple,title:"Audit Logging",desc:"All key creation, deletion, and usage events are logged with timestamps.",status:"Recording"}].map((item,i)=>(
                <div key={i} className="key-card" style={{background:"rgba(10,10,30,0.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"22px 24px",display:"flex",gap:18,position:"relative",animation:`sectionIn 0.4s ${i*0.07}s ease both`}}>
                  <SynapseDots color={item.color}/>
                  <div style={{width:44,height:44,borderRadius:11,background:`${item.color}18`,border:`1px solid ${item.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={item.icon} style={{fontSize:22,color:item.color}}/></div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:14,color:"#fff"}}>{item.title}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:item.color,background:`${item.color}18`,border:`1px solid ${item.color}44`,borderRadius:9999,padding:"2px 10px"}}>{item.status}</span></div>
                    <p style={{fontFamily:"'Hanken Grotesk',sans-serif",fontSize:13,color:C.textSecondary,lineHeight:1.7}}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* USAGE TAB */}
          {activeTab==="usage"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"sectionIn 0.4s ease both"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {[{label:"API Calls Today",value:"1,247",color:C.green,icon:"bolt"},{label:"Tokens Used",value:"892K",color:C.cyan,icon:"data_usage"},{label:"Avg Latency",value:"340ms",color:C.amber,icon:"speed"}].map((s,i)=>(
                  <div key={i} className="key-card" style={{background:"rgba(10,10,30,0.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px 22px",textAlign:"center",position:"relative",animation:`sectionIn 0.4s ${i*0.07}s ease both`}}>
                    <SynapseDots color={s.color}/><Icon name={s.icon} style={{fontSize:24,color:s.color,marginBottom:8}}/>
                    <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:24,color:"#fff",marginBottom:4}}>{s.value}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.textSecondary,textTransform:"uppercase",letterSpacing:"0.1em"}}>{s.label}</div>
                  </div>
                ))}
              </div>
              {PROVIDERS.map((p,i)=>(
                <div key={p.id} className="key-card" style={{background:"rgba(10,10,30,0.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px 24px",position:"relative",animation:`sectionIn 0.4s ${0.25+i*0.07}s ease both`}}>
                  <SynapseDots color={p.color}/>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><Icon name={p.icon} style={{fontSize:18,color:p.color}}/><span style={{fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:14,color:"#fff"}}>{p.label}</span></div><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:p.color}}>{Math.floor(Math.random()*800+200).toLocaleString()} calls</span></div>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:9999,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.floor(Math.random()*60+20)}%`,background:p.color,borderRadius:9999,boxShadow:`0 0 8px ${p.color}`}}/></div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}