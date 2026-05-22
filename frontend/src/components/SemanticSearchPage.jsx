import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Particle Background Canvas ────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null)
  const mouse = useRef({ x: null, y: null })

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let particles = [], animId

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()

    for (let i = 0; i < 150; i++) {
      particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1, vx: Math.random()*0.5-0.25, vy: Math.random()*0.5-0.25, opacity: Math.random()*0.5+0.1 })
    }

    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>canvas.width)p.vx*=-1; if(p.y<0||p.y>canvas.height)p.vy*=-1
        if(mouse.current.x&&mouse.current.y){const dx=mouse.current.x-p.x,dy=mouse.current.y-p.y;const d=Math.sqrt(dx*dx+dy*dy);if(d<100){p.x-=dx/15;p.y-=dy/15}}
        ctx.fillStyle=`rgba(0,204,255,${p.opacity})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()
      })
      animId=requestAnimationFrame(loop)
    };loop()

    const mm=e=>{mouse.current={x:e.clientX,y:e.clientY}};window.addEventListener('mousemove',mm)
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',mm)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,zIndex:0,pointerEvents:'none'}}/>
}

// ─── Constellation Star Class ──────────────────────────────────
class Star {
  constructor(x,y,type,data){
    this.originX=500;this.originY=250;this.targetX=x;this.targetY=y
    this.type=type;this.color=type==='research'?'#00ff0f':'#ff2040'
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
export default function SemanticSearchPage({ user, onStartResearch, onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [filter, setFilter] = useState('all')
  const [stars, setStars] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Initialize constellation canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if(!canvas)return
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight}
    resize();window.addEventListener('resize',resize)
    return()=>window.removeEventListener('resize',resize)
  },[])

  // Draw constellation when stars change
  useEffect(() => {
    if(stars.length===0)return
    const canvas=canvasRef.current
    if(!canvas)return
    const ctx=canvas.getContext('2d')
    let running=true

    const draw=()=>{
      if(!running)return
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const positions=stars.map(s=>s.draw(ctx))
      // Draw connections
      ctx.strokeStyle='rgba(0,204,255,0.15)';ctx.lineWidth=1
      for(let i=0;i<positions.length;i++){for(let j=i+1;j<positions.length;j++){const d=Math.hypot(positions[i].x-positions[j].x,positions[i].y-positions[j].y);if(d<180){ctx.beginPath();ctx.moveTo(positions[i].x,positions[i].y);ctx.lineTo(positions[j].x,positions[j].y);ctx.stroke()}}}
      animRef.current=requestAnimationFrame(draw)
    };draw()
    return()=>{running=false;cancelAnimationFrame(animRef.current)}
  },[stars])

  const handleSearch=async(searchQuery)=>{
    const q=searchQuery||query
    if(!q.trim())return
    setLoading(true);setSearched(true);setSelectedResult(null);setShowSuggestions(false)
    try{
      const res=await fetch(`http://localhost:8000/search?query=${encodeURIComponent(q)}&top_k=12`)
      if(res.ok){const data=await res.json();setResults(data.results||[])}
    }catch(e){console.error('Search error:',e)}
    finally{setLoading(false)}
  }

  const handleInputChange=async(value)=>{
    setQuery(value)
    if(value.length>2){
      setShowSuggestions(true)
      try{const res=await fetch(`http://localhost:8000/search/suggestions?query=${encodeURIComponent(value)}&limit=5`);if(res.ok){const d=await res.json();setSuggestions(d.suggestions||[])}}catch(e){}
    }else{setShowSuggestions(false);setSuggestions([])}
  }

  // Create stars from results
  useEffect(()=>{
    if(results.length===0){setStars([]);return}
    const canvas=canvasRef.current
    if(!canvas)return
    const w=canvas.offsetWidth;const h=canvas.offsetHeight
    const newStars=results.filter(r=>filter==='all'||r.mode===filter).map((r,i)=>{
      const angle=(i/results.length)*Math.PI*2;const radius=Math.min(w,h)*0.3
      return new Star(w/2+Math.cos(angle)*radius,h/2+Math.sin(angle)*radius*0.7,r.mode||'research',r)
    })
    setStars(newStars)
  },[results,filter])

  // Canvas interactions
  const handleCanvasMove=(e)=>{
    const rect=canvasRef.current?.getBoundingClientRect()
    if(!rect)return
    const mx=e.clientX-rect.left;const my=e.clientY-rect.top
    setStars(prev=>prev.map(s=>{const d=Math.hypot(mx-s.targetX,my-s.targetY);return{...s,isHovered:d<20}}))
  }

  const handleCanvasClick=()=>{
    const hovered=stars.find(s=>s.isHovered)
    if(hovered){setSelectedResult(hovered.data)}
  }

  const filteredResults=results.filter(r=>filter==='all'||r.mode===filter)

  return (
    <div style={{minHeight:'100vh',background:'#0a0a1e',fontFamily:"'Inter','Segoe UI',sans-serif",position:'relative',overflow:'auto',color:'#e2e0fc'}}>
      <ParticleCanvas/>

      <main style={{position:'relative',zIndex:10,maxWidth:'900px',margin:'0 auto',padding:'30px 20px 60px'}}>
        
        {/* Header */}
        <section style={{textAlign:'center',marginBottom:'30px'}}>
          <h2 style={{fontSize:'clamp(1.6rem,4vw,2.2rem)',fontWeight:800,color:'#fff',margin:'0 0 6px'}}>🔍 Neural Semantic Search</h2>
          <p style={{fontSize:'14px',color:'#8899aa',opacity:.8}}>Mapping the conceptual geometry of your research space.</p>
        </section>

        {/* Search Input */}
        <div style={{position:'relative',marginBottom:'20px'}}>
          <div style={{display:'flex',alignItems:'center',background:'rgba(25,25,46,0.8)',backdropFilter:'blur(12px)',border:'1px solid rgba(0,204,255,0.3)',borderRadius:'50px',padding:'16px 24px',boxShadow:'0 0 20px rgba(0,204,255,0.1)'}}>
            <span style={{color:'#00ccff',marginRight:'16px',fontSize:'20px'}}>🔍</span>
            <input type="text" value={query} onChange={e=>handleInputChange(e.target.value)} placeholder="Enter a research hypothesis or query..." onKeyDown={e=>e.key==='Enter'&&handleSearch()} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:'16px'}}/>
            <button onClick={()=>handleSearch()} disabled={loading} style={{background:'#00ccff',color:'#0a0a1e',padding:'12px 24px',borderRadius:'50px',border:'none',fontWeight:700,fontSize:'14px',cursor:'pointer',transition:'all .3s'}}>{loading?'Scanning...':'Scan'}</button>
          </div>
          {/* Suggestions */}
          {showSuggestions&&suggestions.length>0&&(
            <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:'8px',background:'rgba(10,10,30,0.95)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'16px',overflow:'hidden',zIndex:30}}>
              {suggestions.map((s,i)=><div key={i} onClick={()=>{setQuery(s);handleSearch(s)}} style={{padding:'14px 20px',cursor:'pointer',color:'#ccc',fontSize:'13px',borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'all .2s'}} onMouseEnter={e=>e.target.style.background='rgba(0,204,255,0.08)'} onMouseLeave={e=>e.target.style.background='transparent'}>🔍 {s}</div>)}
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginBottom:'24px'}}>
          {['AI Safety','Quantum Computing','Neuroethics','Deep Space Habitat','CRISPR Ethics'].map(t=><button key={t} onClick={()=>{setQuery(t);handleSearch(t)}} style={{padding:'8px 20px',borderRadius:'50px',background:'rgba(10,10,30,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',color:'#8899aa',cursor:'pointer',fontSize:'13px',transition:'all .3s'}}>{t}</button>)}
        </div>

        {/* Constellation Canvas */}
        <div style={{position:'relative',width:'100%',height:'450px',overflow:'hidden',borderRadius:'30px',background:'rgba(10,10,30,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',marginBottom:'20px',cursor:'crosshair'}}>
          <canvas ref={canvasRef} onMouseMove={handleCanvasMove} onClick={handleCanvasClick} style={{width:'100%',height:'100%'}}/>
          
          {/* Overlay when no results */}
          {(!searched||stars.length===0)&&!loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,10,30,0.2)',pointerEvents:'none'}}>
              <div style={{textAlign:'center'}}>
                <div style={{width:'64px',height:'64px',borderRadius:'50%',border:'2px dashed rgba(0,204,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <span style={{color:'#00ccff',fontSize:'24px'}}>🔮</span>
                </div>
                <p style={{color:'rgba(0,204,255,0.6)',fontSize:'14px'}}>Query the neural void to generate constellation</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,10,30,0.3)',flexDirection:'column',gap:'16px'}}>
              <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'#00ccff',opacity:.5,animation:'pulse 2s infinite',boxShadow:'0 0 40px rgba(0,204,255,0.6)'}}/>
              <p style={{color:'#00ccff',fontWeight:600,animation:'pulse 1.5s infinite'}}>Analyzing conceptual overlaps...</p>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{position:'absolute',bottom:'16px',left:'50%',transform:'translateX(-50%)',display:'flex',gap:'4px',background:'rgba(10,10,30,0.9)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50px',padding:'4px'}}>
            {[{key:'all',label:'All'},{key:'research',label:'Research'},{key:'debate',label:'Debates'}].map(t=><button key={t.key} onClick={()=>setFilter(t.key)} style={{padding:'6px 16px',borderRadius:'50px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:700,background:filter===t.key?'#00ff0f':'transparent',color:filter===t.key?'#0a0a1e':'#8899aa',transition:'all .3s'}}>{t.label}</button>)}
          </div>
        </div>

        {/* Selected Result Detail Card */}
        {selectedResult&&(
          <div style={{background:'rgba(10,10,30,0.8)',backdropFilter:'blur(20px)',border:'1px solid rgba(0,255,15,0.3)',borderRadius:'20px',padding:'28px',position:'relative',boxShadow:'0 0 30px rgba(0,255,15,0.15)',animation:'fadeSlideUp 0.4s ease'}}>
            {/* Synapse dots */}
            {['2px 2px','2px auto','auto 2px','auto auto'].map((p,i)=><div key={i} style={{position:'absolute',[p.includes('2px')?'top':'bottom']:'8px',[i<2?'left':'right']:'8px',width:'6px',height:'6px',borderRadius:'50%',background:'#00ff0f',boxShadow:'0 0 8px #00ff0f'}}/>)}
            
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
              <div>
                <span style={{background:'rgba(0,255,15,0.1)',color:'#00ff0f',border:'1px solid rgba(0,255,15,0.3)',padding:'4px 12px',borderRadius:'20px',fontSize:'11px',textTransform:'uppercase',display:'inline-block',marginBottom:'12px'}}>
                  {selectedResult.mode==='debate'?'🗣️ Debate Node':'🔬 Research Node'}
                </span>
                <h3 style={{fontSize:'1.3em',color:'#fff',margin:0}}>{selectedResult.query}</h3>
              </div>
              <button onClick={()=>setSelectedResult(null)} style={{background:'none',border:'none',color:'#8899aa',cursor:'pointer',fontSize:'20px'}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'24px',marginBottom:'20px'}}>
              <p style={{color:'#c8d6e5',fontSize:'14px',lineHeight:1.7}}>{selectedResult.answer}</p>
              <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'16px',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Similarity</div>
                  <div style={{fontSize:'1.4em',fontWeight:800,color:'#00ff0f'}}>{selectedResult.score}%</div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Confidence</div>
                  <div style={{fontSize:'1.2em',fontWeight:700,color:'#00ccff'}}>{selectedResult.confidence}%</div>
                </div>
              </div>
            </div>

            <button onClick={()=>onStartResearch?.(selectedResult.query)} style={{background:'#00ff0f',color:'#0a0a1e',padding:'14px 32px',borderRadius:'50px',border:'none',fontWeight:700,fontSize:'15px',cursor:'pointer',transition:'all .3s'}}>Initiate Stream →</button>
          </div>
        )}

        {/* No results */}
        {searched&&!loading&&results.length===0&&(
          <div style={{textAlign:'center',padding:'40px',color:'#555'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div>
            <p>No neural matches found. Try different keywords.</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}