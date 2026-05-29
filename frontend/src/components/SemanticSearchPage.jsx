import { useState, useRef, useEffect } from 'react'

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040",
  void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

function Icon({ name, style }) {
  return <span style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight: 1, ...(style || {}) }}>{name}</span>
}

// ─── SMOOTH COLLAPSIBLE SIDEBAR WITH BLUE THEME ───────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search", active: true },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];

  const handleNav = (path) => onNavigate ? onNavigate(path) : window.location.href = path;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  return (
    <aside style={{ 
      position: "fixed", left: 0, top: 0, height: "100%", 
      width: collapsed ? 56 : 320,
      background: "rgba(10,10,30,0.6)", backdropFilter: "blur(24px)", 
      borderRight: "1px solid " + C.white10, 
      display: "flex", flexDirection: "column", 
      padding: collapsed ? "16px 8px" : 24, 
      zIndex: 20, 
      transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden"
    }}>
      {collapsed ? (
        <>
          <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", marginBottom: 32, display: "flex", justifyContent: "center" }} title="Expand">
            <Icon name="chevron_right" style={{ fontSize: 22 }} />
          </button>
          {NAV.map(({ icon, label, path, active }) => (
            <div key={label} onClick={() => handleNav(path)} title={label} style={{ padding: "12px 0", cursor: "pointer", color: active ? C.cyan : C.onSurfaceVariant, width: "100%", display: "flex", justifyContent: "center" }}>
              <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div onClick={() => handleNav('/research')} title="New Research" style={{ width: 34, height: 34, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="add" style={{ fontSize: 16, color: C.void }} />
            </div>
            <div title={user?.username || 'Guest'} style={{ width: 30, height: 30, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,204,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="face" style={{ color: C.cyan, fontSize: 14 }} />
            </div>
            <div onClick={handleLogout} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}>
              <Icon name="logout" style={{ fontSize: 14 }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* POLYNOUS text changed to BLUE (C.cyan) */}
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.cyan, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>POLYNOUS</h1>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7, whiteSpace: "nowrap" }}>Cerebral Vitality Engine</p>
            </div>
            <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8 }}
              onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = C.textSecondary}>
              <Icon name="chevron_left" style={{ fontSize: 20 }} />
            </button>
          </div>
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
            {NAV.map(({ icon, label, path, active }) => (
              <div key={label} onClick={() => handleNav(path)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 9999, cursor: "pointer", color: active ? C.cyan : C.onSurfaceVariant, background: active ? "rgba(0,204,255,0.08)" : "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden" }}
                onMouseEnter={e => { if (!active) { e.target.style.color = C.cyan; e.target.style.background = "rgba(255,255,255,0.05)" } }}
                onMouseLeave={e => { if (!active) { e.target.style.color = C.onSurfaceVariant; e.target.style.background = "transparent" } }}>
                <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              </div>
            ))}
          </nav>
          <div style={{ borderTop: "1px solid " + C.white5, paddingTop: 24, marginTop: 24 }}>
            <button onClick={() => handleNav('/research')} style={{ width: "100%", padding: "12px", background: C.cyan, color: C.void, fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.target.style.transform = "scale(1.03)"} onMouseLeave={e => e.target.style.transform = "scale(1)"}>
              <Icon name="add" style={{ fontSize: 18, color: C.void, flexShrink: 0 }} />New Research
            </button>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,204,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="face" style={{ color: C.cyan, fontSize: 22 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username || 'Guest'}</p>
                <button onClick={handleLogout} style={{ fontSize: 10, color: C.crimson, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", padding: 0 }}>Disconnect</button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

// ─── Particle Background ───────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null)
  const mouse = useRef({ x: null, y: null })
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext('2d')
    let particles = [], animId
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()
    for (let i = 0; i < 150; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1, vx: Math.random()*0.5-0.25, vy: Math.random()*0.5-0.25, opacity: Math.random()*0.5+0.1 })
    const loop = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>canvas.width)p.vx*=-1; if(p.y<0||p.y>canvas.height)p.vy*=-1; if(mouse.current.x&&mouse.current.y){const dx=mouse.current.x-p.x,dy=mouse.current.y-p.y;const d=Math.sqrt(dx*dx+dy*dy);if(d<100){p.x-=dx/15;p.y-=dy/15}} ctx.fillStyle="rgba(0,204,255,"+p.opacity+")";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill() }); animId=requestAnimationFrame(loop) };loop()
    const mm=e=>{mouse.current={x:e.clientX,y:e.clientY}};window.addEventListener('mousemove',mm)
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',mm)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,zIndex:0,pointerEvents:'none'}}/>
}

// ─── Star Class ────────────────────────────────────────────────
class Star {
  constructor(x,y,type,data){
    this.originX=500;this.originY=250;this.targetX=x;this.targetY=y
    this.type=type;this.color=type==='research'?C.green:C.crimson
    this.similarity=(data.score||50)/100;this.confidence=(data.confidence||50)/20+2
    this.progress=0;this.isHovered=false;this.data=data
  }
  draw(ctx){
    const x=this.originX+(this.targetX-this.originX)*this.progress
    const y=this.originY+(this.targetY-this.originY)*this.progress
    const opacity=this.similarity*this.progress;const size=this.confidence*(this.isHovered?1.5:1)
    ctx.shadowBlur=10*this.progress;ctx.shadowColor=this.color
    ctx.fillStyle=this.color;ctx.globalAlpha=opacity
    ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill()
    ctx.shadowBlur=0;ctx.globalAlpha=1
    if(this.progress<1)this.progress+=0.03
    return{x,y,size}
  }
}

// ─── MAIN COMPONENT ────────────────────────────────────────────
export default function SemanticSearchPage({ user, onStartResearch, onNavigate, onLogout }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [filter, setFilter] = useState('all')
  const [stars, setStars] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if(!canvas)return
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight}
    resize();window.addEventListener('resize',resize)
    return()=>window.removeEventListener('resize',resize)
  },[])

  useEffect(() => {
    if(stars.length===0)return
    const canvas=canvasRef.current; if(!canvas)return
    const ctx=canvas.getContext('2d'); let running=true
    const draw=()=>{if(!running)return; ctx.clearRect(0,0,canvas.width,canvas.height); const positions=stars.map(s=>s.draw(ctx)); ctx.strokeStyle='rgba(0,204,255,0.15)';ctx.lineWidth=1; for(let i=0;i<positions.length;i++){for(let j=i+1;j<positions.length;j++){const d=Math.hypot(positions[i].x-positions[j].x,positions[i].y-positions[j].y);if(d<180){ctx.beginPath();ctx.moveTo(positions[i].x,positions[i].y);ctx.lineTo(positions[j].x,positions[j].y);ctx.stroke()}}}; animRef.current=requestAnimationFrame(draw)};draw()
    return()=>{running=false;cancelAnimationFrame(animRef.current)}
  },[stars])

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query
    if (!q.trim()) return
    setLoading(true); setSearched(true); setSelectedResult(null); setShowSuggestions(false)
    try {
      const res = await fetch("http://localhost:8000/search/?query=" + encodeURIComponent(q) + "&top_k=12")
      if (res.ok) { const data = await res.json(); setResults(data.results || []) }
    } catch (e) { console.error('Search error:', e) }
    finally { setLoading(false) }
  }

  const handleInputChange = async (value) => {
    setQuery(value)
    if (value.length > 2) {
      setShowSuggestions(true)
      try { const res = await fetch("http://localhost:8000/search/suggestions/?query=" + encodeURIComponent(value) + "&limit=5"); if (res.ok) { const d = await res.json(); setSuggestions(d.suggestions || []) } } catch (e) {}
    } else { setShowSuggestions(false); setSuggestions([]) }
  }

  const handleQuickSuggestion = (topic) => { setQuery(topic); handleSearch(topic) }
  const handleFilterChange = (newFilter) => { setFilter(newFilter) }
  const handleInitiateStream = () => { if (selectedResult && onStartResearch) onStartResearch(selectedResult.query) }
  const handleCloseDetail = () => { setSelectedResult(null) }

  useEffect(() => {
    if (results.length === 0) { setStars([]); return }
    const canvas = canvasRef.current; if (!canvas) return
    const w = canvas.offsetWidth; const h = canvas.offsetHeight
    const newStars = results.filter(r => filter === 'all' || r.mode === filter).map((r, i) => {
      const angle = (i / results.length) * Math.PI * 2; const radius = Math.min(w, h) * 0.3
      return new Star(w/2 + Math.cos(angle) * radius, h/2 + Math.sin(angle) * radius * 0.7, r.mode || 'research', r)
    })
    setStars(newStars)
  }, [results, filter])

  const handleCanvasMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    setStars(prev => prev.map(s => { const d = Math.hypot(mx - s.targetX, my - s.targetY); return { ...s, isHovered: d < 20 } }))
  }

  const handleCanvasClick = () => { const hovered = stars.find(s => s.isHovered); if (hovered) { setSelectedResult(hovered.data) } }

  return (
    <div style={{minHeight:'100vh',background:C.void,fontFamily:"'Hanken Grotesk',sans-serif",position:'relative',overflow:'auto',color:C.onSurface}}>
      <ParticleCanvas/>
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ 
        marginLeft: sidebarCollapsed ? 56 : 320,
        padding: '30px 20px 60px',
        position: 'relative', zIndex: 10, 
        transition: "margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)",
        maxWidth: "none", boxSizing: "border-box"
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <section style={{textAlign:'center',marginBottom:'30px'}}>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(1.6rem,4vw,2.2rem)',fontWeight:800,color:'#fff',margin:'0 0 6px',letterSpacing:'-0.02em'}}>🔍 Neural Semantic Search</h2>
            <p style={{fontFamily:"'Hanken Grotesk',sans-serif",fontSize:'14px',color:C.textSecondary,opacity:.8}}>Mapping the conceptual geometry of your research space.</p>
          </section>

          <div style={{position:'relative',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'center',background:'rgba(25,25,46,0.8)',backdropFilter:'blur(12px)',border:'1px solid rgba(0,204,255,0.3)',borderRadius:'50px',padding:'16px 24px',boxShadow:'0 0 20px rgba(0,204,255,0.1)'}}>
              <span style={{color:C.cyan,marginRight:'16px',fontSize:'20px'}}>🔍</span>
              <input type="text" value={query} onChange={e=>handleInputChange(e.target.value)} placeholder="Enter a research hypothesis or query..." onKeyDown={e=>e.key==='Enter'&&handleSearch()} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#fff',fontFamily:"'Hanken Grotesk',sans-serif",fontSize:'16px'}}/>
              <button onClick={()=>handleSearch()} disabled={loading} style={{background:C.cyan,color:C.void,padding:'12px 24px',borderRadius:'50px',border:'none',fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:'14px',cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>{loading?'Scanning...':'Scan'}</button>
            </div>
            {showSuggestions&&suggestions.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:'8px',background:'rgba(10,10,30,0.95)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'16px',overflow:'hidden',zIndex:30}}>
                {suggestions.map((s,i)=>(<div key={i} onClick={()=>{setQuery(s);handleSearch(s)}} style={{padding:'14px 20px',cursor:'pointer',color:'#ccc',fontFamily:"'Hanken Grotesk',sans-serif",fontSize:'13px',borderBottom:'1px solid rgba(255,255,255,0.04)'}} onMouseEnter={e=>e.target.style.background='rgba(0,204,255,0.08)'} onMouseLeave={e=>e.target.style.background='transparent'}>🔍 {s}</div>))}
              </div>
            )}
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginBottom:'24px'}}>
            {['AI Safety','Quantum Computing','Neuroethics','Deep Space Habitat','CRISPR Ethics'].map(t=>(<button key={t} onClick={()=>handleQuickSuggestion(t)} style={{padding:'8px 20px',borderRadius:'50px',background:'rgba(10,10,30,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',color:C.textSecondary,cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px'}}>{t}</button>))}
          </div>

          <div style={{position:'relative',width:'100%',height:'450px',overflow:'hidden',borderRadius:'30px',background:'rgba(10,10,30,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',marginBottom:'20px',cursor:'crosshair'}}>
            <canvas ref={canvasRef} onMouseMove={handleCanvasMove} onClick={handleCanvasClick} style={{width:'100%',height:'100%'}}/>
            {(!searched||stars.length===0)&&!loading&&(<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,10,30,0.2)',pointerEvents:'none'}}><div style={{textAlign:'center'}}><div style={{width:'64px',height:'64px',borderRadius:'50%',border:'2px dashed rgba(0,204,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><span style={{color:C.cyan,fontSize:'24px'}}>🔮</span></div><p style={{fontFamily:"'JetBrains Mono',monospace",color:'rgba(0,204,255,0.6)',fontSize:'14px'}}>Query the neural void to generate constellation</p></div></div>)}
            {loading&&(<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,10,30,0.3)',flexDirection:'column',gap:'16px'}}><div style={{width:'60px',height:'60px',borderRadius:'50%',background:C.cyan,opacity:.5,animation:'pulse 2s infinite',boxShadow:'0 0 40px rgba(0,204,255,0.6)'}}/><p style={{fontFamily:"'Sora',sans-serif",color:C.cyan,fontWeight:600}}>Analyzing conceptual overlaps...</p></div>)}
            <div style={{position:'absolute',bottom:'16px',left:'50%',transform:'translateX(-50%)',display:'flex',gap:'4px',background:'rgba(10,10,30,0.9)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50px',padding:'4px'}}>
              {[{key:'all',label:'All'},{key:'research',label:'Research'},{key:'debate',label:'Debates'}].map(t=>(<button key={t.key} onClick={()=>handleFilterChange(t.key)} style={{padding:'6px 16px',borderRadius:'50px',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',fontWeight:700,background:filter===t.key?C.green:'transparent',color:filter===t.key?C.void:C.textSecondary}}>{t.label}</button>))}
            </div>
          </div>

          {selectedResult&&(<div style={{background:'rgba(10,10,30,0.8)',backdropFilter:'blur(20px)',border:'1px solid rgba(0,255,15,0.3)',borderRadius:'20px',padding:'28px',position:'relative',boxShadow:'0 0 30px rgba(0,255,15,0.15)',animation:'fadeSlideUp 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
              <div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",background:'rgba(0,255,15,0.1)',color:C.green,border:'1px solid rgba(0,255,15,0.3)',padding:'4px 12px',borderRadius:'20px',fontSize:'11px',textTransform:'uppercase',display:'inline-block',marginBottom:'12px'}}>
                  {selectedResult.mode==='debate'?'🗣️ Debate Node':'🔬 Research Node'}
                </span>
                <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:'1.3em',color:'#fff',margin:0}}>{selectedResult.query}</h3>
              </div>
              <button onClick={handleCloseDetail} style={{background:'none',border:'none',color:C.textSecondary,cursor:'pointer',fontSize:'20px'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'24px',marginBottom:'20px'}}>
              <p style={{fontFamily:"'Hanken Grotesk',sans-serif",color:'#c8d6e5',fontSize:'14px',lineHeight:1.7}}>{selectedResult.answer||'No additional details available.'}</p>
              <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'16px',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'#555',textTransform:'uppercase',marginBottom:'4px'}}>Similarity</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:'1.4em',fontWeight:800,color:C.green}}>{selectedResult.score}%</div>
                </div>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'10px',color:'#555',textTransform:'uppercase',marginBottom:'4px'}}>Confidence</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:'1.2em',fontWeight:700,color:C.cyan}}>{selectedResult.confidence||'N/A'}%</div>
                </div>
              </div>
            </div>
            <button onClick={handleInitiateStream} style={{fontFamily:"'Sora',sans-serif",background:C.green,color:C.void,padding:'14px 32px',borderRadius:'50px',border:'none',fontWeight:700,fontSize:'15px',cursor:'pointer'}}>Initiate Stream →</button>
          </div>)}

          {searched&&!loading&&results.length===0&&(<div style={{textAlign:'center',padding:'40px',color:'#555'}}><div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div><p style={{fontFamily:"'Hanken Grotesk',sans-serif"}}>No neural matches found. Try different keywords.</p></div>)}
        </div>
      </main>
      <style>{`@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}