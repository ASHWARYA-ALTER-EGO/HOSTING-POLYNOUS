import { useState, useEffect, useRef, useCallback } from "react";

const PHOTO_SRC = "data:image/jpeg;base64,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";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background-color: #0a0a1e; color: #ffffff; overflow-x: hidden; font-family: 'Hanken Grotesk', sans-serif; }
  @keyframes spin          { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
  @keyframes heartbeat     { 0%,100% { transform:scale(1); filter:brightness(1); } 50% { transform:scale(1.05); filter:brightness(1.4); } }
  @keyframes heartbeatFast { 0%,100% { transform:scale(1); filter:brightness(1); } 50% { transform:scale(1.08); filter:brightness(1.6); } }
  @keyframes dashFlow      { from { stroke-dashoffset: 0; }      to { stroke-dashoffset: -280; } }
  @keyframes glowBreathe   { 0%,100% { opacity: 0.1; }           50% { opacity: 0.55; } }
  @keyframes ripple        { 0% { transform:scale(1); opacity:.8; } 100% { transform:scale(3.5); opacity:0; } }
  @keyframes shimmerBar    { 0% { width:0%; }                    100% { width:100%; } }
  @keyframes pulse         { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  @keyframes typewriter    { from { width:0; } to { width:100%; } }
  @keyframes blink         { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes scanline      { 0% { top:-10%; } 100% { top:110%; } }
  @keyframes nodeFloat     { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-8px); } }
  @keyframes matrixRain    { 0% { opacity:0.8; transform:translateY(-100%); } 100% { opacity:0; transform:translateY(600px); } }
  @keyframes fadeSlideUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes counterSpin   { from { transform:rotate(0deg); } to { transform:rotate(-360deg); } }
  @keyframes orbitPulse    { 0%,100%{transform:scale(1);box-shadow:0 0 8px currentColor;} 50%{transform:scale(1.18);box-shadow:0 0 24px currentColor;} }

  .reveal {
    opacity: 0; transform: translateY(48px);
    transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
    will-change: opacity, transform;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  .reveal-stagger > * {
    opacity: 0; transform: translateY(38px);
    transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1);
    will-change: opacity, transform;
  }
  .reveal-stagger.visible > *:nth-child(1)  { opacity:1; transform:translateY(0); transition-delay:0.04s; }
  .reveal-stagger.visible > *:nth-child(2)  { opacity:1; transform:translateY(0); transition-delay:0.10s; }
  .reveal-stagger.visible > *:nth-child(3)  { opacity:1; transform:translateY(0); transition-delay:0.16s; }
  .reveal-stagger.visible > *:nth-child(4)  { opacity:1; transform:translateY(0); transition-delay:0.22s; }
  .reveal-stagger.visible > *:nth-child(5)  { opacity:1; transform:translateY(0); transition-delay:0.28s; }
  .reveal-stagger.visible > *:nth-child(6)  { opacity:1; transform:translateY(0); transition-delay:0.34s; }
  .reveal-stagger.visible > *:nth-child(n+7){ opacity:1; transform:translateY(0); transition-delay:0.40s; }

  .section-rule {
    width: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,255,15,0.3), rgba(0,204,255,0.2), transparent);
    margin: 0 auto 80px;
    transition: width 1.1s cubic-bezier(0.22,1,0.36,1);
  }
  .section-rule.visible { width: 60%; }

  .glow-tile { transition: all 0.5s cubic-bezier(0.23,1,0.32,1); position:relative; z-index:1; }
  .glow-tile:hover { transform: scale(1.04) translateY(-4px); border-color: rgba(0,255,15,0.5) !important; box-shadow: 0 0 30px rgba(0,255,15,0.15), 0 0 60px rgba(0,255,15,0.05); }
  .glow-tile-crimson:hover { border-color: rgba(255,32,64,0.5)  !important; box-shadow: 0 0 30px rgba(255,32,64,0.15),  0 0 60px rgba(255,32,64,0.05); }
  .glow-tile-cyan:hover    { border-color: rgba(0,204,255,0.5)  !important; box-shadow: 0 0 30px rgba(0,204,255,0.15),  0 0 60px rgba(0,204,255,0.05); }
  .glow-tile-gold:hover    { border-color: rgba(255,215,0,0.5)  !important; box-shadow: 0 0 30px rgba(255,215,0,0.15),   0 0 60px rgba(255,215,0,0.05); }
  .glow-tile-purple:hover  { border-color: rgba(168,85,247,0.5) !important; box-shadow: 0 0 30px rgba(168,85,247,0.15), 0 0 60px rgba(168,85,247,0.05); }

  .glass-card { background: rgba(17,17,37,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); transition: all 0.5s cubic-bezier(0.23,1,0.32,1); }
  .terminal-bg { background: #0c0c20; border: 1px solid #333349; }
  .animate-pulse-dot { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
  .nav-link { font-family:'JetBrains Mono',monospace; font-size:14px; color:#b9ccb0; text-decoration:none; transition:color .2s; cursor:pointer; }
  .nav-link:hover { color:#00ff0f; }
  .nav-link-active { color:#00ff0f; border-bottom:2px solid #00ff0f; padding-bottom:2px; }

  .agent-btn {
    border: none; cursor: pointer; border-radius: 14px;
    font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px;
    transition: all 0.25s cubic-bezier(0.23,1,0.32,1);
    position: relative; overflow: hidden;
  }
  .agent-btn:hover { transform: translateY(-3px) scale(1.04); }
  .agent-btn:active { transform: scale(0.97); }
  .agent-btn::after {
    content:''; position:absolute; inset:0; border-radius:14px;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }
`;

const C = {
  green:"#00ff0f", cyan:"#00ccff", crimson:"#ff2040", gold:"#ffd700",
  purple:"#a855f7", indigo:"#5878d4", amber:"#ffaa00",
  nodeBg:"#080912", void:"#0a0a1e", surface:"#111125",
};

const NAV_SECTIONS = [
  { label:"Home",        id:"hero" },
  { label:"Neural Feed", id:"api" },
  { label:"Memory Bank", id:"cognition" },
  { label:"Logic Lab",   id:"pipeline" },
];

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const RESEARCH_NODES = [
  { id:"search",    name:"SEARCH",    emoji:"🔍", color:C.cyan,   tag:"AG-01" },
  { id:"summarise", name:"SUMMARISE", emoji:"📄", color:C.indigo, tag:"AG-02" },
  { id:"critic",    name:"CRITIC",    emoji:"⚖️", color:C.amber,  tag:"AG-03" },
  { id:"writer",    name:"WRITER",    emoji:"✍️", color:C.purple, tag:"AG-04" },
];

const DIALECTIC_NODES = [
  { id:"d-search", name:"SEARCH",  emoji:"🔍", color:C.cyan,    tag:"DX-01", x:75,  y:240 },
  { id:"for",      name:"FOR",     emoji:"✅", color:C.green,   tag:"DX-02", x:270, y:100 },
  { id:"against",  name:"AGAINST", emoji:"❌", color:C.crimson, tag:"DX-03", x:270, y:380 },
  { id:"judge",    name:"JUDGE",   emoji:"👨‍⚖️", color:C.gold,    tag:"DX-04", x:460, y:240, isJudge:true },
];

// ── NeuralCanvas ──────────────────────────────────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ particles:[], mouse:{x:null,y:null}, raf:null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const state  = stateRef.current;

    class Particle {
      constructor() { this.reset(); this.x = Math.random()*canvas.width; this.y = Math.random()*canvas.height; this.baseX=this.x; this.baseY=this.y; }
      reset() {
        this.baseX=Math.random()*canvas.width; this.baseY=Math.random()*canvas.height;
        this.x=this.baseX; this.y=this.baseY; this.size=Math.random()*2+0.5;
        const r=Math.random(); this.color=r<0.5?C.green:r<0.8?C.cyan:C.purple;
        this.vx=0; this.vy=0;
      }
      draw() { ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); }
      update() {
        const scrollY=window.scrollY||0;
        let relativeY=(this.baseY-scrollY*0.08)%canvas.height;
        if(relativeY<0) relativeY+=canvas.height;
        const {x:mx,y:my}=state.mouse;
        if(mx!==null){const dx=mx-this.x,dy=my-this.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<180){const force=(180-dist)/180;this.vx-=(dx/dist)*force*1.8;this.vy-=(dy/dist)*force*1.8;}}
        this.vx+=(this.baseX-this.x)*0.008; this.vy+=(relativeY-this.y)*0.008;
        this.vx*=0.94; this.vy*=0.94; this.x+=this.vx; this.y+=this.vy;
      }
    }

    function init() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; state.particles=Array.from({length:250},()=>new Particle()); }
    function loop() { ctx.clearRect(0,0,canvas.width,canvas.height); state.particles.forEach(p=>{p.draw();p.update();}); state.raf=requestAnimationFrame(loop); }
    const onResize=()=>init(); const onMouseMove=(e)=>{state.mouse.x=e.clientX;state.mouse.y=e.clientY;};
    window.addEventListener("resize",onResize); window.addEventListener("mousemove",onMouseMove);
    init(); loop();
    return ()=>{window.removeEventListener("resize",onResize);window.removeEventListener("mousemove",onMouseMove);cancelAnimationFrame(state.raf);};
  }, []);

  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:-1,pointerEvents:"none"}} />;
}

// ── Pipeline pieces ───────────────────────────────────────────────────────────
function PipelineParticle({ path, color, delay, duration=1800 }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf, start=null;
    function cubic(t,p0,p1,p2,p3){const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;}
    function animate(ts){
      if(!start) start=ts-delay;
      const t=((ts-start)%duration)/duration;
      if(ref.current){ref.current.setAttribute("cx",cubic(t,path.x0,path.cx1,path.cx2,path.x1));ref.current.setAttribute("cy",cubic(t,path.y0,path.cy1,path.cy2,path.y1));ref.current.setAttribute("r",Math.max(5-t*3,1));ref.current.setAttribute("opacity",1-t);}
      raf=requestAnimationFrame(animate);
    }
    raf=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(raf);
  }, [path,delay,duration]);
  return <circle ref={ref} cx={path.x0} cy={path.y0} r={5} fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}} />;
}

function Connection({ d, color, isActive }) {
  return (
    <g style={{opacity:isActive?1:0.18,transition:"opacity 0.6s ease"}}>
      <path d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" style={{opacity:0.12,filter:"blur(6px)",animation:isActive?"glowBreathe 2.5s ease-in-out infinite":"none"}} />
      <path d={d} fill="none" stroke={color} strokeWidth={3}  strokeLinecap="round" style={{opacity:0.75}} />
      <path d={d} fill="none" stroke="#fff"  strokeWidth={1.5} strokeLinecap="round" strokeDasharray="9 5" style={{opacity:0.9,animation:isActive?"dashFlow 1.6s linear infinite":"dashFlow 4s linear infinite"}} />
    </g>
  );
}

function AgentNode({ data, isActive, isCompleted, style={} }) {
  const size=data.isJudge?148:128, color=data.color;
  const [burst,setBurst]=useState(false);
  const prevCompleted=useRef(false);
  useEffect(()=>{
    if(isCompleted&&!prevCompleted.current){setBurst(true);const t=setTimeout(()=>setBurst(false),800);prevCompleted.current=true;return()=>clearTimeout(t);}
    if(!isCompleted) prevCompleted.current=false;
  },[isCompleted]);
  return (
    <div style={{width:`${size}px`,height:`${size}px`,minWidth:`${size}px`,borderRadius:"22px",background:C.nodeBg,border:`${data.isJudge?"2.5px":"1.8px"} solid ${color}${isActive?"cc":isCompleted?"99":"40"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",transition:"all 0.55s cubic-bezier(0.4,0,0.2,1)",opacity:isActive?1:isCompleted?0.85:0.38,boxShadow:isActive?`0 0 14px ${color}44,0 0 32px ${color}66,0 0 80px ${color}22`:isCompleted?`0 0 10px ${color}33,0 0 22px ${color}44`:"none",animation:isActive?"heartbeatFast 1.1s ease-in-out infinite":isCompleted?"heartbeat 3s ease-in-out infinite":"none",overflow:"visible",...style}}>
      <div style={{position:"absolute",inset:0,borderRadius:"22px",background:`radial-gradient(circle at center,${color}18 0%,transparent 68%)`,pointerEvents:"none"}} />
      {burst&&<div style={{position:"absolute",width:`${size}px`,height:`${size}px`,borderRadius:"22px",border:`2px solid ${color}`,animation:"ripple 0.7s ease-out forwards",pointerEvents:"none",top:0,left:0}} />}
      <span style={{fontSize:"28px",marginBottom:"6px",zIndex:1,transform:isActive?"scale(1.15)":"scale(1)",transition:"transform 0.3s"}}>{data.emoji}</span>
      <span style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"11px",color,letterSpacing:"0.07em",zIndex:1,textAlign:"center",padding:"0 6px"}}>{data.name}</span>
      <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9px",color:"#fff",opacity:0.32,marginTop:"3px",zIndex:1}}>#{data.tag}</span>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"4px",borderRadius:"0 0 20px 20px",background:`${color}22`,overflow:"hidden"}}>
        <div style={{height:"100%",background:color,borderRadius:"0 0 20px 20px",width:isCompleted?"100%":"0%",animation:isActive?"shimmerBar 2.5s linear forwards":"none",transition:"width 0.4s ease"}} />
      </div>
      {isActive&&!isCompleted&&<div style={{position:"absolute",top:"10px",right:"10px",width:"15px",height:"15px",border:`2px solid ${color}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.9s linear infinite",zIndex:2}} />}
      {isCompleted&&<div style={{position:"absolute",top:"10px",right:"10px",width:"17px",height:"17px",background:color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5"><path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
    </div>
  );
}

function NeuralPipeline({ mode="both", activeAgents=[], completedAgents=[], currentAgent=null }) {
  const [step,setStep]=useState(0);
  useEffect(()=>{if(currentAgent||activeAgents.length>0) return;const id=setInterval(()=>setStep(s=>(s+1)%8),2600);return()=>clearInterval(id);},[currentAgent,activeAgents]);
  const isActive=useCallback((nodeId)=>{if(currentAgent) return nodeId===currentAgent;if(activeAgents.length>0) return activeAgents.includes(nodeId);const map={search:0,summarise:1,critic:2,writer:3,"d-search":4,for:5,against:5,judge:6};return map[nodeId]===step;},[currentAgent,activeAgents,step]);
  const isCompleted=useCallback((nodeId)=>{if(completedAgents.length>0) return completedAgents.includes(nodeId);const map={search:0,summarise:1,critic:2,writer:3,"d-search":4,for:5,against:5,judge:6};return map[nodeId]<step;},[completedAgents,step]);
  const researchLinkActive=(i)=>{if(currentAgent||activeAgents.length>0) return true;return step===i||step===i+1;};
  const debateLinkActive=(minStep)=>{if(currentAgent||activeAgents.length>0) return true;return step>=minStep;};
  const NODE_W=128,GAP=52,BASE_X=65;
  const rPaths=[0,1,2].map(i=>({x0:BASE_X+i*(NODE_W+GAP)+NODE_W,cx1:BASE_X+i*(NODE_W+GAP)+NODE_W+30,cx2:BASE_X+(i+1)*(NODE_W+GAP)-30,x1:BASE_X+(i+1)*(NODE_W+GAP),y0:195,cy1:195,cy2:195,y1:195}));
  const dPaths=[{x0:75,y0:240,cx1:160,cy1:240,cx2:190,cy2:100,x1:270,y1:100},{x0:75,y0:240,cx1:160,cy1:240,cx2:190,cy2:380,x1:270,y1:380},{x0:270,y0:100,cx1:350,cy1:100,cx2:395,cy2:240,x1:455,y1:240},{x0:270,y0:380,cx1:350,cy1:380,cx2:395,cy2:240,x1:455,y1:240}];
  const showR=mode==="research"||mode==="both", showD=mode==="debate"||mode==="both";

  return (
    <div style={{width:"100%",minHeight:"680px",display:"flex",alignItems:"stretch",position:"relative"}}>
      {showR&&(
        <div style={{flex:1,padding:"48px 32px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{marginBottom:"40px",textAlign:"center"}}><h2 style={{fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:"15px",color:C.green,letterSpacing:"0.12em",margin:0}}>🔬 RESEARCH PIPELINE</h2><p style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",color:"#fff",opacity:0.4,margin:"5px 0 0",letterSpacing:"0.08em"}}>SEQUENTIAL SYNTHESIS ARCHITECTURE</p></div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",width:"100%"}}>
            <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}} viewBox="0 0 720 390" preserveAspectRatio="xMidYMid meet">
              {[0,1,2].map(i=>{const x1=BASE_X+i*(NODE_W+GAP)+NODE_W,x2=BASE_X+(i+1)*(NODE_W+GAP);return <Connection key={i} d={`M ${x1},195 L ${x2},195`} color={RESEARCH_NODES[i].color} isActive={researchLinkActive(i)} />;}) }
              {[0,1,2].map(i=>researchLinkActive(i)&&[0,400,800,1200].map((delay,j)=><PipelineParticle key={`rp${i}-${j}`} path={rPaths[i]} color={RESEARCH_NODES[i].color} delay={delay} duration={1700} />))}
            </svg>
            <div style={{display:"flex",gap:`${GAP}px`,alignItems:"center",position:"relative",zIndex:10}}>
              {RESEARCH_NODES.map(node=><AgentNode key={node.id} data={node} isActive={isActive(node.id)} isCompleted={isCompleted(node.id)} />)}
            </div>
          </div>
          <p style={{fontFamily:"JetBrains Mono,monospace",fontSize:"11px",color:"#fff",opacity:0.35,marginTop:"32px",textAlign:"center",lineHeight:1.6}}>Linear multi-agent processing for structured data<br/>extraction and contextual summarization.</p>
        </div>
      )}
      {showR&&showD&&<div style={{width:"1px",alignSelf:"stretch",background:"linear-gradient(to bottom,transparent,#00ff0f 30%,#ff2040 70%,transparent)",boxShadow:"0 0 18px #00ff0f88,0 0 18px #ff204088",flexShrink:0}} />}
      {showD&&(
        <div style={{flex:1,padding:"48px 32px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{marginBottom:"40px",textAlign:"center"}}><h2 style={{fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:"15px",color:C.crimson,letterSpacing:"0.12em",margin:0}}>⚖️ DIALECTIC FORK</h2><p style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",color:"#fff",opacity:0.4,margin:"5px 0 0",letterSpacing:"0.08em"}}>ADVERSARIAL REASONING TOPOLOGY</p></div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",width:"100%"}}>
            <svg width="540" height="480" viewBox="0 0 540 480" style={{overflow:"visible"}}>
              <defs><linearGradient id="gFor" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.green}/><stop offset="100%" stopColor={C.gold}/></linearGradient><linearGradient id="gAgainst" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.crimson}/><stop offset="100%" stopColor={C.gold}/></linearGradient></defs>
              <Connection d="M 75,240 C 160,240 190,100 270,100"  color={C.green}   isActive={debateLinkActive(4)} />
              <Connection d="M 75,240 C 160,240 190,380 270,380"  color={C.crimson} isActive={debateLinkActive(4)} />
              <Connection d="M 270,100 C 350,100 395,240 455,240" color={C.green}   isActive={debateLinkActive(5)} />
              <Connection d="M 270,380 C 350,380 395,240 455,240" color={C.crimson} isActive={debateLinkActive(5)} />
              {debateLinkActive(4)&&[0,1].map(li=>[0,450,900,1350].map((delay,j)=><PipelineParticle key={`dp${li}-${j}`} path={dPaths[li]} color={li===0?C.green:C.crimson} delay={delay} duration={1900} />))}
              {debateLinkActive(5)&&[2,3].map(li=>[0,450,900,1350].map((delay,j)=><PipelineParticle key={`dp${li}-${j}`} path={dPaths[li]} color={li===2?C.green:C.crimson} delay={delay} duration={1900} />))}
              {DIALECTIC_NODES.map(node=>{const size=node.isJudge?148:128;return <foreignObject key={node.id} x={node.x-size/2} y={node.y-size/2} width={size} height={size} style={{overflow:"visible"}}><AgentNode data={node} isActive={isActive(node.id)} isCompleted={isCompleted(node.id)} /></foreignObject>;})}
            </svg>
          </div>
          <p style={{fontFamily:"JetBrains Mono,monospace",fontSize:"11px",color:"#fff",opacity:0.35,marginTop:"32px",textAlign:"center",lineHeight:1.6}}>Adversarial evaluation where multiple perspectives<br/>are stress-tested for factual consistency.</p>
        </div>
      )}
      <div style={{position:"absolute",bottom:"18px",left:"50%",transform:"translateX(-50%)",fontFamily:"JetBrains Mono,monospace",fontSize:"10px",color:"#fff",opacity:0.22,letterSpacing:"0.18em",whiteSpace:"nowrap",pointerEvents:"none",zIndex:20}}>POLYNOUS NEURAL ENGINE • AUTONOMOUS MULTI-AGENT MESH</div>
    </div>
  );
}

// ── SectionDivider ────────────────────────────────────────────────────────────
function SectionDivider() {
  const ref = useReveal(0.3);
  return <div ref={ref} className="section-rule reveal" />;
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
  const [activeIdx,setActiveIdx]=useState(0);
  const scrollTo=(id,idx)=>{setActiveIdx(idx);const el=document.getElementById(id);if(el) el.scrollIntoView({behavior:"smooth",block:"start"});};
  return (
    <header style={{display:"flex",justifyContent:"center",alignItems:"center",width:"100%",padding:"20px 32px",position:"sticky",top:0,zIndex:50,background:"rgba(10,10,30,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"40px"}}>
        <span style={{fontFamily:"Sora,sans-serif",fontWeight:800,fontSize:"20px",color:C.green,letterSpacing:"0.06em"}}>POLYNOUS</span>
        <nav style={{display:"flex",alignItems:"center",gap:"32px"}}>
          {NAV_SECTIONS.map(({label,id},i)=><span key={label} onClick={()=>scrollTo(id,i)} className={`nav-link${activeIdx===i?" nav-link-active":""}`}>{label}</span>)}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:"20px",marginLeft:"16px"}}>
          <span style={{fontFamily:"Material Symbols Outlined",fontSize:"22px",color:"#b9ccb0",cursor:"pointer",transition:"color 0.2s"}} onMouseOver={e=>e.currentTarget.style.color=C.green} onMouseOut={e=>e.currentTarget.style.color="#b9ccb0"}>notifications</span>
          <span style={{fontFamily:"Material Symbols Outlined",fontSize:"22px",color:C.green,cursor:"pointer"}}>account_circle</span>
        </div>
      </div>
    </header>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────
function HeroSection() {
  const titleRef=useReveal(0.1), bodyRef=useReveal(0.1), ctaRef=useReveal(0.1), termRef=useReveal(0.15);
  return (
    <section id="hero" style={{minHeight:"88vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"40px 24px 56px"}}>
      <h1 ref={titleRef} className="reveal" style={{fontFamily:"Sora,sans-serif",fontWeight:800,fontSize:"clamp(72px,11vw,120px)",background:"linear-gradient(90deg,#00ff0f,#ffffff,#ff2040)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.05,marginBottom:"20px",letterSpacing:"-0.03em",transitionDelay:"0.05s"}}>POLYNOUS</h1>
      <p ref={bodyRef} className="reveal" style={{fontFamily:"Sora,sans-serif",fontSize:"22px",color:"#b9ccb0",marginBottom:"16px",transitionDelay:"0.15s"}}>Many Minds, One Answer</p>
      <p className="reveal" ref={useReveal(0.1)} style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"18px",color:"rgba(226,224,252,0.8)",maxWidth:"600px",lineHeight:1.65,marginBottom:"52px",transitionDelay:"0.22s"}}>Seven autonomous AI agents collaborating in a decentralized neural mesh. Experience research, debate, and synthesis at human-level depth with machine-level speed.</p>
      <div ref={ctaRef} className="reveal" style={{display:"flex",flexWrap:"wrap",gap:"20px",justifyContent:"center",marginBottom:"64px",transitionDelay:"0.3s"}}>
        <button onClick={()=>{const el=document.getElementById("api");el&&el.scrollIntoView({behavior:"smooth"});}} style={{padding:"16px 36px",background:C.green,color:C.void,fontWeight:700,borderRadius:"9999px",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",boxShadow:`0 0 24px rgba(0,255,15,0.35)`,fontFamily:"Sora,sans-serif",fontSize:"16px",transition:"transform 0.2s,box-shadow 0.2s"}} onMouseOver={e=>{e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow=`0 0 36px rgba(0,255,15,0.5)`;}} onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 0 24px rgba(0,255,15,0.35)`;}}>Get Started <span style={{fontFamily:"Material Symbols Outlined"}}>trending_flat</span></button>
        <button onClick={()=>window.open("https://github.com/pradhanashwarya2122","_blank")} style={{padding:"16px 36px",border:`1px solid rgba(0,204,255,0.45)`,color:C.cyan,fontWeight:700,borderRadius:"9999px",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontFamily:"Sora,sans-serif",fontSize:"16px",transition:"background 0.25s,border-color 0.25s"}} onMouseOver={e=>{e.currentTarget.style.background="rgba(0,204,255,0.08)";e.currentTarget.style.borderColor="rgba(0,204,255,0.8)";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(0,204,255,0.45)";}}>
          <span style={{fontFamily:"Material Symbols Outlined"}}>star</span> Star on GitHub
        </button>
      </div>
      <div ref={termRef} className="reveal terminal-bg" style={{padding:"24px",borderRadius:"14px",width:"100%",maxWidth:"460px",textAlign:"left",transitionDelay:"0.38s"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          <div style={{width:"12px",height:"12px",borderRadius:"50%",background:C.crimson}} /><div style={{width:"12px",height:"12px",borderRadius:"50%",background:C.gold}} /><div style={{width:"12px",height:"12px",borderRadius:"50%",background:C.green}} />
        </div>
        <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:"14px",color:C.green}}><span style={{color:"#b9ccb0"}}>$ </span>npm run polynous</div>
        <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:"13px",color:"rgba(226,224,252,0.6)",marginTop:"10px",lineHeight:1.9}}>
          &gt; Initializing Neural Mesh...<br/>&gt; Connecting 7 Sub-Agents...<br/>&gt; Logic Lab: Online [Ready]<br/>&gt; Synaptic Bridge established.
        </div>
      </div>
    </section>
  );
}

// ── ApiSection ────────────────────────────────────────────────────────────────
function ApiSection() {
  const headerRef=useReveal(0.15), gridRef=useReveal(0.15);
  return (
    <section id="api" style={{padding:"96px 0"}}>
      <SectionDivider />
      <div className="glass-card" style={{padding:"52px",borderRadius:"32px",border:"2px solid rgba(0,255,15,0.18)",background:"linear-gradient(135deg,rgba(0,255,15,0.04),rgba(255,32,64,0.04))",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div ref={headerRef} className="reveal">
          <span style={{display:"inline-block",padding:"8px 24px",borderRadius:"9999px",background:C.green,color:C.void,fontWeight:700,fontSize:"12px",letterSpacing:"0.1em",marginBottom:"32px"}}>Premium Flexibility</span>
          <h2 style={{fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:"clamp(28px,4vw,40px)",marginBottom:"20px",lineHeight:1.2}}>Bring Your Own <span style={{color:C.green}}>Intelligence</span></h2>
          <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"18px",color:"#b9ccb0",maxWidth:"580px",margin:"0 auto 48px",lineHeight:1.65}}>Total model-agnostic sovereignty. Connect your preferred high-performance LLMs or run private local instances.</p>
        </div>
        <div ref={gridRef} className="reveal" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"48px",alignItems:"center",textAlign:"left",maxWidth:"896px",margin:"0 auto"}}>
          <div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginBottom:"32px"}}>
              {[{label:"OpenAI (GPT-4o)",color:C.green},{label:"Anthropic (Claude 3.5)",color:C.cyan},{label:"Ollama (Local Llama)",color:C.crimson}].map(({label,color})=>(
                <div key={label} className="glass-card" style={{padding:"8px 16px",borderRadius:"9999px",display:"flex",alignItems:"center",gap:"8px"}}>
                  <div className="animate-pulse-dot" style={{width:"8px",height:"8px",borderRadius:"50%",background:color}} />
                  <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"14px"}}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>alert("API Mesh configuration panel coming soon!")} style={{padding:"18px 38px",background:"#fff",color:C.void,fontWeight:700,borderRadius:"9999px",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:"Sora,sans-serif",fontSize:"16px",transition:"transform 0.2s,box-shadow 0.2s"}} onMouseOver={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 0 28px rgba(255,255,255,0.2)";}} onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
              <span style={{fontFamily:"Material Symbols Outlined"}}>key</span> Configure API Mesh
            </button>
          </div>
          <div className="terminal-bg" style={{padding:"32px",borderRadius:"16px",border:"2px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px",borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:"16px"}}>
              <span style={{fontFamily:"Material Symbols Outlined",color:C.green}}>settings_input_component</span>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"14px"}}>mesh_config.yaml</span>
            </div>
            <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:"12px",lineHeight:2,opacity:0.82}}>
              <p style={{color:C.cyan}}>agents:</p>
              <p style={{paddingLeft:"16px"}}>research_lead: <span style={{color:C.green}}>"anthropic/claude-3-5-sonnet"</span></p>
              <p style={{paddingLeft:"16px"}}>dialectic_judge: <span style={{color:C.green}}>"openai/gpt-4o"</span></p>
              <p style={{paddingLeft:"16px"}}>local_summarizer: <span style={{color:C.green}}>"ollama/llama3"</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CognitionStack ────────────────────────────────────────────────────────────
const FEATURES = [
  {icon:"biotech",       title:"MULTI-AGENT RESEARCH",  color:C.green,   cls:"",                desc:"7 specialized AI agents collaborate in a LangGraph pipeline delivering structured, cited answers with confidence scoring."},
  {icon:"forum",         title:"NEURAL DEBATE MODE",    color:C.crimson, cls:"glow-tile-crimson", desc:"FOR vs AGAINST agents argue opposing sides, then an AI Judge evaluates evidence quality and declares a winner."},
  {icon:"hub",           title:"KNOWLEDGE GRAPH",       color:C.cyan,    cls:"glow-tile-cyan",   desc:"Every research session builds your personal Neo4j-powered knowledge graph, connecting topics and entities."},
  {icon:"manage_search", title:"SEMANTIC SEARCH",       color:"#77ff62", cls:"",                desc:"Voyage AI embeddings + Pinecone vector search find past research in milliseconds by meaning."},
  {icon:"neurology",     title:"NEURAL MEMORY BANK",    color:C.purple,  cls:"glow-tile-purple", desc:"Track interests, visualize research patterns, and discover connections as an interactive timeline."},
  {icon:"description",   title:"PDF RAG LAB",           color:C.gold,    cls:"glow-tile-gold",   desc:"Upload documents, embed with AI, and query them with natural language to get document-grounded answers."},
];

function CognitionStack() {
  const headRef=useReveal(0.15), gridRef=useReveal(0.1);
  return (
    <section id="cognition" style={{padding:"96px 0"}}>
      <SectionDivider />
      <div ref={headRef} className="reveal" style={{textAlign:"center",marginBottom:"64px"}}>
        <h2 style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"32px",marginBottom:"14px"}}>The Cognition Stack</h2>
        <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"16px",color:"#b9ccb0",maxWidth:"460px",margin:"0 auto"}}>Diverse neural modules working in harmony to process, challenge, and synthesize complex datasets.</p>
      </div>
      <div ref={gridRef} className="reveal-stagger" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"24px"}}>
        {FEATURES.map(f=>(
          <div key={f.title} className={`glow-tile glass-card ${f.cls}`} style={{padding:"32px",borderRadius:"16px",position:"relative",overflow:"hidden"}}>
            <span style={{fontFamily:"Material Symbols Outlined",fontSize:"38px",color:f.color,display:"block",marginBottom:"14px"}}>{f.icon}</span>
            <h3 style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"16px",color:f.color,marginBottom:"10px"}}>{f.title}</h3>
            <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"14px",color:"#b9ccb0",lineHeight:1.65}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PipelineSection ───────────────────────────────────────────────────────────
function PipelineSection() {
  const headRef=useReveal(0.15), bodyRef=useReveal(0.08);
  return (
    <section id="pipeline" style={{padding:"96px 0",overflow:"hidden"}}>
      <SectionDivider />
      <div ref={headRef} className="reveal" style={{textAlign:"center",marginBottom:"64px"}}>
        <h2 style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"32px",marginBottom:"14px"}}>Neural Pipeline</h2>
        <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"16px",color:"#b9ccb0",maxWidth:"460px",margin:"0 auto"}}>High-fidelity autonomous multi-agent mesh performing real-time synthesis.</p>
      </div>
      <div ref={bodyRef} className="reveal" style={{width:"100%",maxWidth:"1440px",margin:"0 auto",borderRadius:"48px",overflow:"hidden",background:"radial-gradient(ellipse 120% 80% at 25% 50%,rgba(0,26,10,0.4) 0%,rgba(3,4,15,0.8) 55%),radial-gradient(ellipse 120% 80% at 75% 50%,rgba(26,0,3,0.4) 0%,rgba(3,4,15,0.8) 55%)",border:"1px solid rgba(255,255,255,0.08)",position:"relative"}}>
        <div style={{position:"absolute",inset:0,opacity:0.05,pointerEvents:"none",zIndex:1}}>
          <svg width="100%" height="100%"><defs><pattern id="hex" width="30" height="52" patternUnits="userSpaceOnUse"><path d="M15 0l15 8.66v17.32L15 34.64 0 25.98V8.66L15 0z" fill="none" stroke="#00ff0f" strokeWidth="1" strokeOpacity="0.15" /></pattern></defs><rect width="100%" height="100%" fill="url(#hex)" /></svg>
        </div>
        <div style={{position:"relative",zIndex:10}}><NeuralPipeline /></div>
      </div>
    </section>
  );
}

// ── TechHighlights ────────────────────────────────────────────────────────────
const TECH = [
  {icon:"bolt",          title:"STREAMING ARCHITECTURE", color:C.green,   cls:"",                desc:"Server-Sent Events deliver real-time token streaming with agent progress visualization."},
  {icon:"extension",     title:"MODULAR AGENT DESIGN",   color:C.purple,  cls:"glow-tile-purple", desc:"LangGraph state machine orchestrates specialized agents with clear responsibilities."},
  {icon:"database",      title:"PERSISTENT MEMORY",      color:C.cyan,    cls:"glow-tile-cyan",   desc:"Neo4j graph database stores sessions while Pinecone enables semantic vector search."},
  {icon:"token",         title:"PRODUCTION READY",       color:C.crimson, cls:"glow-tile-crimson", desc:"Docker containerization, rate limiting, and CORS support. Deploy anywhere with ease."},
  {icon:"api",           title:"API-FIRST DESIGN",       color:C.green,   cls:"",                desc:"FastAPI backend with automatic OpenAPI docs. Every feature exposed via REST."},
  {icon:"verified_user", title:"SELF-CRITIQUING",        color:C.gold,    cls:"glow-tile-gold",   desc:"Built-in contradiction detection catches inconsistencies between diverse data sources."},
];

function TechHighlights() {
  const headRef=useReveal(0.15), gridRef=useReveal(0.1);
  return (
    <section style={{padding:"96px 0"}}>
      <SectionDivider />
      <div ref={headRef} className="reveal" style={{textAlign:"center",marginBottom:"64px"}}>
        <h2 style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"32px",marginBottom:"14px"}}>Tech Highlights</h2>
        <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"16px",color:"#b9ccb0",maxWidth:"460px",margin:"0 auto"}}>Engineered for resilience, speed, and uncompromising precision.</p>
      </div>
      <div ref={gridRef} className="reveal-stagger" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"24px"}}>
        {TECH.map(t=>(
          <div key={t.title} className={`glow-tile glass-card ${t.cls}`} style={{padding:"32px",borderRadius:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
            <span style={{fontFamily:"Material Symbols Outlined",fontSize:"36px",color:t.color}}>{t.icon}</span>
            <h4 style={{fontFamily:"Sora,sans-serif",fontWeight:600,fontSize:"15px"}}>{t.title}</h4>
            <p style={{fontFamily:"Hanken Grotesk,sans-serif",fontSize:"14px",color:"#b9ccb0",lineHeight:1.65}}>{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── TechStack ─────────────────────────────────────────────────────────────────
function TechStack() {
  const ref=useReveal(0.2);
  const items=[{label:"Python 3.12",color:"#e2e0fc"},{label:"FastAPI",color:C.green},{label:"PostgreSQL",color:C.gold},{label:"Redis",color:C.crimson},{label:"Docker",color:"#e2e0fc"}];
  return (
    <section style={{padding:"64px 0",textAlign:"center"}}>
      <SectionDivider />
      <div ref={ref} className="reveal">
        <h3 style={{fontFamily:"JetBrains Mono,monospace",fontSize:"13px",letterSpacing:"0.22em",color:"#b9ccb0",marginBottom:"40px",textTransform:"uppercase"}}>Built with Industry Standards</h3>
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"14px"}}>
          {items.map(({label,color})=><span key={label} className="glass-card" style={{padding:"8px 24px",borderRadius:"9999px",fontFamily:"JetBrains Mono,monospace",fontSize:"14px",color}}>{label}</span>)}
        </div>
      </div>
    </section>
  );
}

// ── AgentPlayground — fun, no-backend interactive widget ──────────────────────
const PLAYGROUND_AGENTS = [
  { id:"search",    name:"SEARCH",    emoji:"🔍", color:"#00ccff",  desc:"I scan knowledge bases and the web to pull raw, unfiltered data on any topic." },
  { id:"summarise", name:"SUMMARISE", emoji:"📄", color:"#5878d4",  desc:"I distill walls of text into crisp, structured summaries without losing nuance." },
  { id:"for",       name:"FOR",       emoji:"✅", color:"#00ff0f",  desc:"My job is to build the strongest possible case in favour of the proposition." },
  { id:"against",   name:"AGAINST",   emoji:"❌", color:"#ff2040",  desc:"I stress-test every argument and poke holes in assumptions. Nothing slips past me." },
  { id:"critic",    name:"CRITIC",    emoji:"⚖️", color:"#ffaa00",  desc:"I cross-examine both sides and flag logical fallacies or citation gaps." },
  { id:"writer",    name:"WRITER",    emoji:"✍️", color:"#a855f7",  desc:"I synthesize everything into polished, publication-ready prose with citations." },
  { id:"judge",     name:"JUDGE",     emoji:"👨‍⚖️", color:"#ffd700",  desc:"Final verdict. I weigh all evidence, assign confidence scores, and deliver the ruling." },
];

const AGENT_QUIPS = {
  search:    ["Scanning 14,000 nodes… hit!", "Cross-referencing semantic vectors…", "Found 847 relevant chunks — filtering top 12.", "Knowledge graph query complete."],
  summarise: ["Compressing 4,200 tokens → 180…", "Key entities extracted: 6.", "Distillation confidence: 94%.", "Summary locked and staged."],
  for:       ["Building affirmative case…", "3 strong premises identified.", "Constructing syllogism chain…", "Case FOR filed — bulletproof."],
  against:   ["Stress-testing every premise…", "Identified 2 logical gaps!", "Counter-evidence ratio: 67%.", "Opposition case finalized."],
  critic:    ["Running fallacy detection…", "Ad hominem: 0. Straw man: 1. Flagged.", "Source reliability score: 88/100.", "Critical review complete."],
  writer:    ["Stitching narrative threads…", "Prose coherence index: 97%.", "Applying citation layer…", "Draft ready for judgment."],
  judge:     ["Weighing all arguments…", "Confidence score: 91%.", "Ruling: Affirmative wins by evidence margin.", "Session archived to Knowledge Graph."],
};

function AgentPlayground() {
  const ref = useReveal(0.1);
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const logRef = useRef(null);

  useEffect(()=>{ logRef.current?.scrollTo({top:logRef.current.scrollHeight,behavior:"smooth"}); },[log]);

  const runAgent = (agent) => {
    if (running) return;
    setSelected(agent.id);
    setDone(false);
    setLog([]);
    setRunning(true);
    const quips = AGENT_QUIPS[agent.id] || ["Processing…"];
    quips.forEach((q, i) => {
      setTimeout(() => {
        setLog(prev => [...prev, { text: q, color: agent.color }]);
        if (i === quips.length - 1) { setRunning(false); setDone(true); }
      }, 520 * (i + 1));
    });
  };

  const reset = () => { setSelected(null); setLog([]); setRunning(false); setDone(false); };

  const active = PLAYGROUND_AGENTS.find(a => a.id === selected);

  return (
    <section style={{ padding:"96px 0" }}>
      <SectionDivider />
      <div ref={ref} className="reveal">
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"52px" }}>
          <span style={{ display:"inline-block", padding:"6px 20px", borderRadius:"9999px", border:`1px solid ${C.purple}55`, color:C.purple, fontFamily:"JetBrains Mono,monospace", fontSize:"11px", letterSpacing:"0.1em", marginBottom:"16px" }}>✦ AGENT PLAYGROUND</span>
          <h2 style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:"32px", marginBottom:"12px" }}>Pick an <span style={{ color:C.green }}>Agent</span>. Watch it <span style={{ color:C.cyan }}>Think.</span></h2>
          <p style={{ fontFamily:"Hanken Grotesk,sans-serif", fontSize:"16px", color:"#b9ccb0", maxWidth:"500px", margin:"0 auto" }}>Click any agent tile to simulate its inner monologue — no backend required.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"32px", maxWidth:"960px", margin:"0 auto" }}>
          {/* Left — agent grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", alignContent:"start" }}>
            {PLAYGROUND_AGENTS.map(agent => {
              const isSelected = selected === agent.id;
              return (
                <button key={agent.id} className="agent-btn" onClick={() => runAgent(agent)}
                  style={{
                    padding:"20px 14px",
                    background: isSelected ? `${agent.color}18` : "rgba(17,17,37,0.7)",
                    border: `1.5px solid ${isSelected ? agent.color : "rgba(255,255,255,0.09)"}`,
                    color: isSelected ? agent.color : "#b9ccb0",
                    textAlign:"left",
                    boxShadow: isSelected ? `0 0 18px ${agent.color}33, 0 0 40px ${agent.color}18` : "none",
                    gridColumn: agent.id === "judge" ? "1 / -1" : undefined,
                  }}>
                  <div style={{ fontSize:"26px", marginBottom:"7px" }}>{agent.emoji}</div>
                  <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:"12px", letterSpacing:"0.08em" }}>{agent.name}</div>
                  {isSelected && <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"9px", marginTop:"4px", opacity:0.6 }}>ACTIVE</div>}
                </button>
              );
            })}
          </div>

          {/* Right — terminal output */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            {/* Agent description */}
            <div style={{ padding:"20px 24px", borderRadius:"14px 14px 0 0", background:"rgba(8,9,18,0.9)", border:"1px solid rgba(255,255,255,0.07)", borderBottom:"none", minHeight:"80px" }}>
              {active ? (
                <div style={{ animation:"fadeSlideUp 0.35s ease" }} key={active.id}>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"11px", color:active.color, marginBottom:"6px", letterSpacing:"0.08em" }}>{active.emoji} {active.name} — Role Briefing</div>
                  <p style={{ fontFamily:"Hanken Grotesk,sans-serif", fontSize:"13px", color:"rgba(226,224,252,0.78)", lineHeight:1.6 }}>{active.desc}</p>
                </div>
              ) : (
                <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"12px", color:"rgba(255,255,255,0.25)", lineHeight:1.7 }}>← Select an agent to see its role briefing and watch it run.</p>
              )}
            </div>

            {/* Terminal log */}
            <div ref={logRef} style={{ flex:1, minHeight:"220px", maxHeight:"220px", overflowY:"auto", background:"#0c0c20", border:"1px solid rgba(255,255,255,0.07)", borderTop:"1px solid rgba(255,255,255,0.04)", padding:"20px", fontFamily:"JetBrains Mono,monospace", fontSize:"12px", lineHeight:2, scrollbarWidth:"thin", scrollbarColor:"rgba(0,255,15,0.15) transparent" }}>
              {log.length === 0 && <span style={{ color:"rgba(255,255,255,0.2)" }}>_</span>}
              {log.map((entry, i) => (
                <div key={i} style={{ animation:"fadeSlideUp 0.3s ease", color: entry.color, display:"flex", gap:"10px", alignItems:"baseline" }}>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", minWidth:"18px" }}>{i+1}</span>
                  <span>{entry.text}</span>
                </div>
              ))}
              {running && (
                <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"4px" }}>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px" }}>{log.length+1}</span>
                  {[0,1,2].map(i=><div key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:active?.color||C.green,animation:`pulse 1.1s ${i*0.18}s ease-in-out infinite`}} />)}
                </div>
              )}
            </div>

            {/* Status bar + reset */}
            <div style={{ padding:"12px 20px", borderRadius:"0 0 14px 14px", background:"rgba(8,9,18,0.85)", border:"1px solid rgba(255,255,255,0.07)", borderTop:"none", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"7px", height:"7px", borderRadius:"50%", background: running ? C.amber : done ? C.green : "rgba(255,255,255,0.2)", animation: running ? "pulse 0.8s ease-in-out infinite" : "none", transition:"background 0.3s" }} />
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>
                  {running ? `${active?.name} processing…` : done ? `${active?.name} complete ✓` : "Awaiting agent selection"}
                </span>
              </div>
              {(selected || log.length > 0) && (
                <button onClick={reset} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"8px", padding:"5px 14px", color:"rgba(255,255,255,0.4)", fontFamily:"JetBrains Mono,monospace", fontSize:"11px", cursor:"pointer", transition:"all 0.2s" }} onMouseOver={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.35)";e.currentTarget.style.color="#fff";}} onMouseOut={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="rgba(255,255,255,0.4)";}}>
                  reset
                </button>
              )}
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}

// ── DeveloperCard — centred ───────────────────────────────────────────────────
function DeveloperCard() {
  const ref = useReveal(0.2);
  return (
    <section style={{ padding:"80px 0" }}>
      <SectionDivider />
      {/* Full-width centred layout */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div ref={ref} className="reveal glass-card" style={{ maxWidth:"540px", width:"100%", padding:"52px 44px", borderRadius:"28px", display:"flex", flexDirection:"column", alignItems:"center", gap:"28px", border:`1px solid rgba(0,255,15,0.14)`, textAlign:"center" }}>
          {/* Photo */}
          <div style={{ position:"relative" }}>
            <div style={{ width:"136px", height:"136px", borderRadius:"50%", overflow:"hidden", border:`2px solid ${C.green}`, flexShrink:0, boxShadow:`0 0 24px rgba(0,255,15,0.25),0 0 60px rgba(0,255,15,0.1)` }}>
              <img alt="Ashwarya Pradhan" src={PHOTO_SRC} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" }} />
            </div>
            {/* Online dot */}
            <div style={{ position:"absolute", bottom:"6px", right:"6px", width:"16px", height:"16px", borderRadius:"50%", background:C.green, border:`2px solid ${C.void}`, animation:"pulse 2s ease-in-out infinite" }} />
          </div>

          <div>
            <h3 style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:"22px", marginBottom:"6px" }}>Ashwarya Pradhan</h3>
            <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"12px", color:C.cyan, marginBottom:"8px", letterSpacing:"0.06em" }}>AI/ML Engineer · MUJ · Polynous Architect</p>
            <p style={{ fontFamily:"Hanken Grotesk,sans-serif", fontSize:"14px", color:"rgba(185,204,176,0.75)", lineHeight:1.6, maxWidth:"360px", margin:"0 auto 24px" }}>
              Building multi-agent AI systems that reason, debate, and synthesize knowledge at scale.
            </p>
            <div style={{ display:"flex", justifyContent:"center", gap:"20px" }}>
              {[
                { icon:"alternate_email", href:"mailto:pradhanashwarya2122@gmail.com", color:C.green },
                { icon:"code",            href:"https://github.com/pradhanashwarya2122", color:C.cyan },
                { icon:"share",           href:"https://github.com/pradhanashwarya2122", color:C.purple },
              ].map(({ icon, href, color }) => (
                <a key={icon} href={href} target="_blank" rel="noreferrer" style={{ width:"44px", height:"44px", borderRadius:"50%", border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", color, textDecoration:"none", fontFamily:"Material Symbols Outlined", fontSize:"20px", transition:"all 0.25s" }}
                  onMouseOver={e=>{ e.currentTarget.style.background=`${color}18`; e.currentTarget.style.borderColor=`${color}99`; e.currentTarget.style.boxShadow=`0 0 14px ${color}44`; }}
                  onMouseOut={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=`${color}44`; e.currentTarget.style.boxShadow="none"; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding:"48px 0", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", gap:"20px", alignItems:"center" }}>
      <span style={{ fontFamily:"JetBrains Mono,monospace", fontWeight:700, fontSize:"14px", color:C.green }}>POLYNOUS</span>
      <div style={{ display:"flex", gap:"32px" }}>
        {[{ label:"Documentation",href:"#" },{ label:"GitHub",href:"https://github.com/pradhanashwarya2122" },{ label:"Terms",href:"#" }].map(({ label, href }) => (
          <a key={label} href={href} target={href.startsWith("http")?"_blank":undefined} rel="noreferrer" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"12px", color:"#b9ccb0", textDecoration:"none", transition:"color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color=C.green} onMouseOut={e=>e.currentTarget.style.color="#b9ccb0"}>{label}</a>
        ))}
      </div>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-polynous","1");
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch(_) {} };
  }, []);

  useEffect(() => {
    if (document.querySelector("link[data-material-symbols]")) return;
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";
    link.rel = "stylesheet";
    link.setAttribute("data-material-symbols","1");
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <NeuralCanvas />
      <main style={{ position:"relative", zIndex:10, minHeight:"100vh" }}>
        <Header />
        <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"0 24px" }}>
          <HeroSection />
          <ApiSection />
          <CognitionStack />
          <PipelineSection />
          <TechHighlights />
          <TechStack />
          <AgentPlayground />
          <DeveloperCard />
          <Footer />
        </div>
      </main>
    </>
  );
}