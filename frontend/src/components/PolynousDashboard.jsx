import { useState, useEffect, useRef } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

const RAINBOW = ['#ff2040','#ff6b35','#ffd700','#00ff0f','#00ccff','#4dabf7','#a855f7','#ff6b9d'];

function Icon({ name, style }) {
  return <span style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight: 1, ...(style || {}) }}>{name}</span>
}

function Styles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1e;color:#e2e0fc;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
    ::selection{background:rgba(0,255,15,0.25)}
    @keyframes rainbow-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes twinkle{0%,100%{opacity:0.3}50%{opacity:0.8}}
    .period-btn{padding:4px 16px;font-family:'JetBrains Mono',monospace;font-size:11px;border:none;background:transparent;cursor:pointer;border-radius:9999px;transition:all 0.2s;color:#b9ccb0}
    .period-btn-active{background:rgba(0,255,15,0.1);color:#00ff0f}
    .period-btn-inactive:hover{color:#e2e0fc}
  `}</style>;
}

// ─── RAINBOW FLOATING PARTICLE BACKGROUND (SMALLER PARTICLES) ─
function NeuralBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null };
    let animId;
    const PARTICLE_COUNT = 180; // More particles but smaller

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseVx = (Math.random() - 0.5) * 0.4;
        this.baseVy = (Math.random() - 0.5) * 0.4;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 1.5 + 0.5; // Smaller: 0.5 to 2px
        this.color = RAINBOW[Math.floor(Math.random() * RAINBOW.length)];
        this.opacity = Math.random() * 0.35 + 0.1; // Slightly more subtle
        this.twinkleSpeed = Math.random() * 0.025 + 0.008;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.wobbleAmp = Math.random() * 0.2;
        this.wobbleSpeed = Math.random() * 0.015 + 0.008;
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
            this.x += (dx / dist) * force * 2.5;
            this.y += (dy / dist) * force * 2.5;
          }
        }
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
      draw(time) {
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.15 + 0.85;
        const alpha = this.opacity * twinkle;
        
        // Smaller glow radius
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        glow.addColorStop(0, this.color.replace(')', `,${alpha * 0.5})`).replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Core particle
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const init = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    };

    let startTime = performance.now();
    const animate = (timestamp) => {
      const time = timestamp - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) { // Shorter connection distance
            const opacity = (1 - dist / 110) * 0.04;
            ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
            ctx.lineWidth = 0.3; // Thinner lines
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      particles.forEach(p => {
        p.update(time);
        p.draw(time);
      });
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
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── Sparkline ────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if(!canvas)return; const ctx=canvas.getContext('2d');
    canvas.width=80;canvas.height=30;
    if(!data||data.length===0)return;
    const max=Math.max(...data,1),min=Math.min(...data,0);
    ctx.beginPath();ctx.moveTo(0,canvas.height-((data[0]-min)/(max-min||1))*canvas.height);
    data.forEach((v,i)=>{const x=(i/(data.length-1))*canvas.width,y=canvas.height-((v-min)/(max-min||1))*canvas.height;ctx.lineTo(x,y)});
    ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
  }, [data, color]);
  return <canvas ref={ref} width={80} height={30} style={{opacity:0.6}}/>;
}

// ─── Activity Chart ───────────────────────────────────────────
function ActivityChart({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');const parent=canvas.parentElement;
    function draw(){canvas.width=parent.clientWidth;canvas.height=parent.clientHeight;const pad=40,w=canvas.width-pad*2,h=canvas.height-pad*2;ctx.clearRect(0,0,canvas.width,canvas.height);
      const entries=Object.entries(data||{}).slice(-30);if(entries.length===0)return;
      const maxVal=Math.max(...entries.map(([,v])=>v),1);
      ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
      for(let i=0;i<=4;i++){const y=pad+(h/4)*i;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(canvas.width-pad,y);ctx.stroke()}
      const pts=entries.map(([,v],i)=>({x:pad+(w/(entries.length-1))*i,y:pad+h-(v/maxVal)*h}));
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++){const cpx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(cpx,pts[i-1].y,cpx,pts[i].y,pts[i].x,pts[i].y)}
      const grad=ctx.createLinearGradient(0,0,canvas.width,0);RAINBOW.forEach((c,i)=>grad.addColorStop(i/(RAINBOW.length-1),c));
      ctx.strokeStyle=grad;ctx.lineWidth=3;ctx.shadowBlur=10;ctx.shadowColor='rgba(0,255,255,0.2)';ctx.stroke();ctx.shadowBlur=0;
      pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill()})}
    draw();const ro=new ResizeObserver(draw);ro.observe(parent);return()=>ro.disconnect();
  },[data]);
  return <canvas ref={ref} style={{width:'100%',height:'100%'}}/>;
}

// ─── Topics Chart ─────────────────────────────────────────────
function TopicsChart({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');const parent=canvas.parentElement;
    function draw(){canvas.width=parent.clientWidth;canvas.height=parent.clientHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
      const entries=Object.entries(data||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);if(entries.length===0)return;
      const pad=50,bw=(canvas.width-pad*2)/entries.length;
      entries.forEach(([label,val],i)=>{const x=pad+bw*i+bw/2;ctx.fillStyle='#b9ccb0';ctx.font='10px "JetBrains Mono"';ctx.textAlign='center';ctx.fillText(label.length>10?label.slice(0,9)+'…':label,x,canvas.height-8);
        for(let j=0;j<Math.min(val,6);j++){const y=canvas.height-35-j*22,color=RAINBOW[j%RAINBOW.length];ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=color;ctx.shadowBlur=8;ctx.shadowColor=color;ctx.fill();ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.shadowBlur=0;ctx.fill()}})}
    draw();const ro=new ResizeObserver(draw);ro.observe(parent);return()=>ro.disconnect();
  },[data]);
  return <canvas ref={ref} style={{width:'100%',height:'100%'}}/>;
}

// ─── Confidence Ring ──────────────────────────────────────────
function ConfidenceRing({ distribution }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');const size=180;canvas.width=size;canvas.height=size;
    const cx=size/2,cy=size/2,r=60;const total=(distribution?.high||0)+(distribution?.medium||0)+(distribution?.low||0)||1;
    const segments=[{val:(distribution?.high||0)/total,color:C.green},{val:(distribution?.medium||0)/total,color:'#ffaa00'},{val:(distribution?.low||0)/total,color:C.crimson}];
    ctx.clearRect(0,0,size,size);let start=-Math.PI/2;
    segments.forEach(s=>{const end=start+(s.val*Math.PI*2);ctx.beginPath();ctx.arc(cx,cy,r,start,end);ctx.strokeStyle=s.color;ctx.lineWidth=14;ctx.lineCap='round';ctx.shadowBlur=8;ctx.shadowColor=s.color;ctx.stroke();ctx.shadowBlur=0;start=end});
    ctx.beginPath();ctx.arc(cx,cy,r-10,0,Math.PI*2);ctx.fillStyle='rgba(10,10,30,0.8)';ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 18px "Sora",sans-serif';ctx.textAlign='center';ctx.fillText(Math.round((distribution?.high||0)/total*100)+'%',cx,cy+6);
  },[distribution]);
  return <canvas ref={ref} style={{width:'100%',height:'100%',maxWidth:'180px',maxHeight:'180px'}}/>;
}

// ─── Heatmap ──────────────────────────────────────────────────
function HeatmapChart({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');const parent=canvas.parentElement;
    function draw(){canvas.width=parent.clientWidth;canvas.height=parent.clientHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
      const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];const rows=days.length,cols=24;
      const cw=(canvas.width-40)/cols,ch=(canvas.height-40)/rows;
      let maxVal=1;if(data){Object.values(data).forEach(hours=>{Object.values(hours).forEach(v=>{if(v>maxVal)maxVal=v})})}
      days.forEach((day,r)=>{for(let c=0;c<cols;c++){const v=(data?.[day]?.[String(c)]||0)/maxVal;let color='rgba(255,255,255,0.02)';if(v>0.8)color=C.green+'99';else if(v>0.5)color=C.cyan+'66';else if(v>0.2)color=C.cyan+'33';ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(20+c*cw+2,20+r*ch+2,cw-4,ch-4,3);ctx.fill()}})}
    draw();const ro=new ResizeObserver(draw);ro.observe(parent);return()=>ro.disconnect();
  },[data]);
  return <canvas ref={ref} style={{width:'100%',height:'100%'}}/>;
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, color, label, value, trend }) {
  return (
    <div style={{ background:"rgba(10,10,30,0.6)", backdropFilter:"blur(20px)", border:"1px solid "+C.white10, borderRadius:20, padding:22, display:"flex",flexDirection:"column",gap:10 }}>
      <Icon name={icon} style={{ fontSize:32, color }} />
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.onSurfaceVariant, marginBottom:4 }}>{label}</div>
        <div style={{ display:"flex",alignItems:"baseline",gap:8 }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:700, color:"#fff" }}>{value}</span>
          {trend && trend.length > 0 && <Sparkline data={trend} color={color} />}
        </div>
      </div>
    </div>
  );
}

// ─── RAINBOW SIDEBAR ──────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "analytics", label: "Analytics", path: "/analytics", active: true },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20 }}>
      <button onClick={()=>setCollapsed(false)} style={{background:"none",border:"none",color:RAINBOW[0],cursor:"pointer",marginBottom:32}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active}, idx)=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?RAINBOW[idx%RAINBOW.length]:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:RAINBOW[3],display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div>
        <div title={user?.username||'Guest'} style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${RAINBOW[4]}`}}><Icon name="face" style={{color:RAINBOW[4],fontSize:14}}/></div>
        <div onClick={handleLogout} title="Disconnect" style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1),padding 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, letterSpacing:"-0.03em", whiteSpace:"nowrap", background:"linear-gradient(135deg, #ff2040, #ff6b35, #ffd700, #00ff0f, #00ccff, #4dabf7, #a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% 200%", animation:"rainbow-shift 6s ease infinite" }}>POLYNOUS</h1>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}}><Icon name="chevron_left" style={{fontSize:20}}/></button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>
        {NAV.map(({icon,label,path,active}, idx) => (
          <div key={label} onClick={()=>handleNav(path)} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?RAINBOW[idx%RAINBOW.length]:C.onSurfaceVariant,background:active?`${RAINBOW[idx%RAINBOW.length]}15`:"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden" }}
            onMouseEnter={e=>{if(!active){e.target.style.color=RAINBOW[idx%RAINBOW.length];e.target.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.target.style.color=C.onSurfaceVariant;e.target.style.background="transparent"}}}>
            <Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:RAINBOW[3],color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.transform="scale(1.03)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:C.void,flexShrink:0}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:`1px solid ${RAINBOW[4]}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:RAINBOW[4],fontSize:22}}/></div>
          <div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button></div>
        </div>
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PolynousDashboard({ user, onNavigate, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [period, setPeriod] = useState('7D');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = "guest_user";

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = period === '7D' ? 7 : period === '30D' ? 30 : 90;
    try {
      const res = await fetch(`http://localhost:8000/memory/analytics/${userId}?days=${days}`);
      if (res.ok) setAnalytics(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = analytics?.stats || {};
  const confTrend = analytics?.confidence_trend || [];
  const activityData = analytics?.activity_by_date || {};
  const topicFreq = analytics?.topic_frequencies || {};
  const confDist = analytics?.confidence_distribution || { high: 0, medium: 0, low: 0 };
  const hourlyData = analytics?.hourly_activity || {};

  return (
    <div style={{ minHeight: "100vh", background: C.void, position: "relative", overflow: "auto" }}>
      <Styles />
      <NeuralBackground />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ marginLeft: sidebarCollapsed ? 56 : 320, padding: "24px 32px", position: "relative", zIndex: 10, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)", maxWidth: "none", boxSizing: "border-box" }}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32,flexWrap:"wrap",gap:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:700,color:C.green,margin:"0 0 4px" }}>📊 Neural Analytics</h2>
            <p style={{ fontFamily:"'Hanken Grotesk',sans-serif",fontSize:14,color:C.textSecondary }}>Your research patterns, visualized</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ display:"flex",background:"rgba(10,10,30,0.6)",backdropFilter:"blur(20px)",border:"1px solid "+C.white10,borderRadius:9999,padding:4 }}>
              {['7D','30D','90D'].map(p=>(<button key={p} onClick={()=>setPeriod(p)} className={`period-btn ${period===p?'period-btn-active':'period-btn-inactive'}`}>{p}</button>))}
            </div>
            <button onClick={fetchAnalytics} style={{ padding:"10px 20px",borderRadius:25,border:"none",background:C.green,color:C.void,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:13,boxShadow:"0 0 20px rgba(0,255,15,0.2)" }}>🔄 Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center",padding:60 }}>
            <div style={{fontSize:48,marginBottom:16}}>📊</div>
            <div style={{color:C.green,fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:600}}>Loading analytics...</div>
          </div>
        ) : (
          <>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:20 }}>
              <StatCard icon="psychology" color={C.cyan} label="Total Queries" value={stats.total_research||0} trend={confTrend} />
              <StatCard icon="forum" color={C.crimson} label="Debates" value={stats.total_debates||0} />
              <StatCard icon="verified" color={C.green} label="Avg Confidence" value={(stats.avg_confidence||0)+'%'} trend={confTrend} />
              <StatCard icon="category" color={C.purple} label="Topics Mapped" value={stats.unique_topics||0} />
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14 }}>
              <div style={{ background:"rgba(10,10,30,0.6)",backdropFilter:"blur(20px)",border:"1px solid "+C.white10,borderRadius:20,padding:22,height:380 }}>
                <h3 style={{ fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:"#fff",margin:"0 0 12px" }}>📈 Research Activity</h3>
                <div style={{ flex:1,height:"calc(100% - 40px)" }}><ActivityChart data={activityData} /></div>
              </div>
              <div style={{ background:"rgba(10,10,30,0.6)",backdropFilter:"blur(20px)",border:"1px solid "+C.white10,borderRadius:20,padding:22,height:380 }}>
                <h3 style={{ fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:"#fff",margin:"0 0 12px" }}>🏷️ Top Topics</h3>
                <div style={{ height:"calc(100% - 40px)" }}><TopicsChart data={topicFreq} /></div>
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,paddingBottom:40 }}>
              <div style={{ background:"rgba(10,10,30,0.6)",backdropFilter:"blur(20px)",border:"1px solid "+C.white10,borderRadius:20,padding:22,height:280,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <h3 style={{ fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:"#fff",margin:"0 0 12px" }}>🎯 Confidence</h3>
                <ConfidenceRing distribution={confDist} />
              </div>
              <div style={{ background:"rgba(10,10,30,0.6)",backdropFilter:"blur(20px)",border:"1px solid "+C.white10,borderRadius:20,padding:22,height:280 }}>
                <h3 style={{ fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:"#fff",margin:"0 0 12px" }}>🗺️ Activity Heatmap</h3>
                <div style={{ height:"calc(100% - 40px)" }}><HeatmapChart data={hourlyData} /></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}