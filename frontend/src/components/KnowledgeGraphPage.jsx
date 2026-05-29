import { useEffect, useRef, useState, useCallback } from "react";

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040", purple: "#a855f7",
  gold: "#ffd700", void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

const NODE_COLORS = {
  claim:       { fill: C.green,    glow: C.green,    ring: "#6eff6e", text: "#b4ffb4" },
  evidence:    { fill: C.cyan,     glow: C.cyan,     ring: "#6effff", text: "#a4f4ff" },
  argument:    { fill: C.crimson,  glow: C.crimson,  ring: "#ff6b82", text: "#ffb3c0" },
  topic:       { fill: "#e06c45",  glow: "#e06c45",  ring: "#ff9e72", text: "#ffc4a8" },
  debate_topic:{ fill: C.crimson,  glow: C.crimson,  ring: "#ff6b82", text: "#ffb3c0" },
  concept:     { fill: "#7c6fdd",  glow: "#7c6fdd",  ring: "#a99fff", text: "#c8c0ff" },
  entity:      { fill: "#1dab82",  glow: "#1dab82",  ring: "#5fffc8", text: "#8fffd8" },
  major:       { fill: C.green,    glow: C.green,    ring: "#6eff6e", text: "#b4ffb4" },
  debate:      { fill: C.crimson,  glow: C.crimson,  ring: "#ff6b82", text: "#ffb3c0" },
  core:        { fill: C.purple,   glow: C.purple,   ring: "#d4a5ff", text: "#e2d4ff" },
  default:     { fill: "#5878d4",  glow: "#5878d4",  ring: "#8aaeff", text: "#aac4ff" },
};

const CLUSTER_COLORS = {
  claim:       "rgba(0,255,15,0.04)",
  evidence:    "rgba(0,204,255,0.04)",
  argument:    "rgba(255,32,64,0.04)",
  topic:       "rgba(224,108,69,0.04)",
  debate_topic:"rgba(255,32,64,0.04)",
  concept:     "rgba(124,111,221,0.04)",
  entity:      "rgba(29,171,130,0.04)",
};

const EDGE_LABELS = {
  SUPPORTED_BY: "supports", COUNTERED_BY: "counters",
  RELATED_TO: "related", CO_OCCURS: "co-occurs",
  ABOUT: "about", CITES: "cites",
};

function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return [88,120,212];
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function Icon({ name, style }) {
  return <span style={{ fontFamily:"Material Symbols Outlined", fontVariationSettings:"'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight:1, ...(style||{}) }}>{name}</span>;
}

// ─── SYNAPSE DOT CORNERS ─────────────────────────────────────
function SynapseDots({ color = C.purple }) {
  const pos = [
    { top:-4, left:-4 }, { top:-4, right:-4 },
    { bottom:-4, left:-4 }, { bottom:-4, right:-4 }
  ];
  return pos.map((p,i) => (
    <div key={i} style={{
      position:"absolute", width:6, height:6, borderRadius:"50%",
      background:color, boxShadow:`0 0 8px ${color}`, ...p,
      animation:`synapsePulse ${1.5+i*0.3}s ease-in-out infinite alternate`
    }}/>
  ));
}

// ─── FORCE SIMULATION ─────────────────────────────────────────
function runForceSimulation(nodes, edges, width, height, iterations=100) {
  const simNodes = nodes.map(n => ({
    ...n,
    x: width/2+(Math.random()-0.5)*width*0.6,
    y: height/2+(Math.random()-0.5)*height*0.6,
    vx:0, vy:0, size:Math.min(45,Math.max(16,n.size||22)), fixed:false,
  }));
  for (let iter=0; iter<iterations; iter++) {
    for (let i=0; i<simNodes.length; i++) {
      if (simNodes[i].fixed) continue;
      for (let j=i+1; j<simNodes.length; j++) {
        if (simNodes[j].fixed) continue;
        const dx=simNodes[i].x-simNodes[j].x, dy=simNodes[i].y-simNodes[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy)||1;
        const force=1500/(dist*dist);
        const fx=(dx/dist)*force, fy=(dy/dist)*force;
        simNodes[i].vx+=fx; simNodes[i].vy+=fy;
        simNodes[j].vx-=fx; simNodes[j].vy-=fy;
      }
    }
    edges.forEach(edge => {
      const src=simNodes.find(n=>n.id===edge.source);
      const tgt=simNodes.find(n=>n.id===edge.target);
      if (!src||!tgt) return;
      const dx=tgt.x-src.x, dy=tgt.y-src.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
      const force=dist*0.003*(edge.weight||1);
      const fx=(dx/dist)*force, fy=(dy/dist)*force;
      if (!src.fixed){src.vx+=fx;src.vy+=fy;}
      if (!tgt.fixed){tgt.vx-=fx;tgt.vy-=fy;}
    });
    simNodes.forEach(n => {
      if (n.fixed) return;
      n.vx+=(width/2-n.x)*0.001; n.vy+=(height/2-n.y)*0.001;
      n.vx*=0.85; n.vy*=0.85;
      n.x+=n.vx; n.y+=n.vy;
      n.x=Math.max(n.size,Math.min(width-n.size,n.x));
      n.y=Math.max(n.size,Math.min(height-n.size,n.y));
    });
  }
  return simNodes;
}

// ─── NEURAL BACKGROUND ───────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas=ref.current; const ctx=canvas.getContext("2d");
    let particles=[], animId; const N=80;
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    window.addEventListener("resize",resize); resize();
    for (let i=0;i<N;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,size:Math.random()*2+1,opacity:Math.random()*0.4+0.1});
    const loop=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach((p,i)=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>canvas.width)p.vx*=-1;
        if(p.y<0||p.y>canvas.height)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(168,85,247,${p.opacity})`;ctx.fill();
        for(let j=i+1;j<particles.length;j++){
          const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);
          if(d<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(168,85,247,${0.06*(1-d/100)})`;ctx.lineWidth=0.3;ctx.stroke();}
        }
      });
      animId=requestAnimationFrame(loop);
    };
    loop();
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}

function MetricRow({label,value,color=C.purple}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0"}}>
      <span style={{fontSize:10,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace"}}>{label}</span>
      <span style={{fontSize:11,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>{value}</span>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory", active: true },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" },
    { icon: "monitoring", label: "Analytics", path: "/analytics" },
  ];
  const handleNav=(p)=>onNavigate?onNavigate(p):(window.location.href=p);
  const handleLogout=()=>onLogout?onLogout():(localStorage.clear(),window.location.href='/');

  if (collapsed) return (
    <aside style={{position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20}}>
      <button onClick={()=>setCollapsed(false)} style={{background:"none",border:"none",color:C.purple,cursor:"pointer",marginBottom:32}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active,color})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?color:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:C.purple,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div>
        <div style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(168,85,247,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="face" style={{color:C.purple,fontSize:14}}/></div>
        <div onClick={handleLogout} style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.purple,letterSpacing:"-0.03em",whiteSpace:"nowrap"}}>POLYNOUS</h1>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p>
        </div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color=C.textSecondary}><Icon name="chevron_left" style={{fontSize:20}}/></button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>
        {NAV.map(({icon,label,path,active,color})=>(
          <div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?color:C.onSurfaceVariant,background:active?`${color}15`:"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden"}} onMouseEnter={e=>{if(!active){e.currentTarget.style.color=color;e.currentTarget.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.color=C.onSurfaceVariant;e.currentTarget.style.background="transparent"}}}>
            <Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.purple,color:"#fff",fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:"#fff",flexShrink:0}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(168,85,247,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.purple,fontSize:22}}/></div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.username||"Guest"}</p>
            <button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── HOVER POPUP CARD ─────────────────────────────────────────
function HoverPopup({ node, position, connections }) {
  const col = NODE_COLORS[node.type] || NODE_COLORS.default;
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const connCount = connections || 0;
  const topics = node.topics || node.related_topics || [];

  return (
    <div style={{
      position:"absolute", left:position.x+16, top:position.y-20,
      zIndex:100, pointerEvents:"none",
      transform: visible ? "scale(1)" : "scale(0.9)",
      opacity: visible ? 1 : 0,
      transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      transformOrigin:"top left",
    }}>
      <div style={{
        position:"relative", width:220,
        background:"rgba(10,8,22,0.95)", backdropFilter:"blur(24px)",
        border:`1px solid ${col.glow}33`,
        borderRadius:14, padding:"14px 16px",
        boxShadow:`0 0 30px ${col.glow}22, 0 8px 32px rgba(0,0,0,0.6)`,
      }}>
        <SynapseDots color={col.glow} />
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:col.fill,boxShadow:`0 0 8px ${col.glow}`,flexShrink:0}}/>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:"#fff",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.label}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <span style={{fontSize:10,background:`${col.fill}22`,color:col.text,border:`1px solid ${col.fill}44`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>{node.type?.replace("_"," ")}</span>
          <span style={{fontSize:10,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace"}}>{connCount} links</span>
        </div>

        {node.confidence > 0 && (
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace"}}>CONFIDENCE</span>
              <span style={{fontSize:9,color:C.green,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{node.confidence}%</span>
            </div>
            <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.08)"}}>
              <div style={{height:"100%",borderRadius:2,width:`${node.confidence}%`,background:`linear-gradient(90deg, ${C.green}, ${C.cyan})`,boxShadow:`0 0 6px ${C.green}88`}}/>
            </div>
          </div>
        )}

        {node.score > 0 && (
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace"}}>FOR / AGAINST</span>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.crimson}}>{node.score}/10</span>
            </div>
            <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.08)",display:"flex"}}>
              <div style={{height:"100%",borderRadius:"2px 0 0 2px",width:`${(node.score/10)*60}%`,background:C.green}}/>
              <div style={{height:"100%",borderRadius:"0 2px 2px 0",width:`${100-(node.score/10)*60}%`,background:C.crimson}}/>
            </div>
          </div>
        )}

        {topics.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {topics.slice(0,3).map((t,i)=>(
              <span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:`${C.purple}22`,color:C.purple,border:`1px solid ${C.purple}33`,fontFamily:"'JetBrains Mono',monospace"}}>{t}</span>
            ))}
          </div>
        )}

        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:"'JetBrains Mono',monospace",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:6,marginTop:4}}>
          Click for full details →
        </div>
      </div>
    </div>
  );
}

// ─── NODE DETAIL PANEL ────────────────────────────────────────
function NodeDetailPanel({ node, details, research, onClose, onResearch, onFindPath, positions }) {
  const col = NODE_COLORS[node.type] || NODE_COLORS.default;
  const [pathTarget, setPathTarget] = useState("");
  const [slideIn, setSlideIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlideIn(true), 10); return () => clearTimeout(t); }, []);

  const connectedNodes = positions.filter(p => {
    return p.id !== node.id && Math.hypot(p.x - node.x, p.y - node.y) < 300;
  }).slice(0, 4);

  return (
    <div style={{
      position:"fixed", right:20, top:"50%",
      transform: slideIn ? "translateY(-50%) translateX(0)" : "translateY(-50%) translateX(110%)",
      transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      zIndex:200, width:300,
    }}>
      <div style={{
        position:"relative",
        background:"rgba(10,8,22,0.96)", backdropFilter:"blur(28px)",
        border:`1px solid ${col.glow}44`,
        borderRadius:18, padding:"20px",
        boxShadow:`0 0 60px ${col.glow}18, 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)`,
        maxHeight:"80vh", overflowY:"auto",
      }}>
        <SynapseDots color={col.glow} />

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:16}}>
          <div style={{width:42,height:42,borderRadius:12,background:`${col.fill}22`,border:`1.5px solid ${col.fill}66`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 16px ${col.glow}44`}}>
            <span style={{fontSize:18}}>{node.type==="claim"?"💡":node.type==="evidence"?"🔬":node.type==="argument"?"⚡":node.type==="topic"?"🌐":"🧩"}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:4}}>{details?.name||node.label}</div>
            <span style={{fontSize:10,background:`${col.fill}22`,color:col.text,border:`1px solid ${col.fill}44`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase"}}>{node.type?.replace("_"," ")}</span>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}>✕</button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {label:"Connections",val:details?.total_connections||0,color:C.purple},
            {label:"Type",val:details?.type||node.type,color:col.fill},
            node.confidence>0&&{label:"Confidence",val:`${node.confidence}%`,color:C.green},
            node.score>0&&{label:"Debate Score",val:`${node.score}/10`,color:C.crimson},
          ].filter(Boolean).map((m,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"8px 10px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",marginBottom:2,textTransform:"uppercase"}}>{m.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'JetBrains Mono',monospace"}}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {details?.description && (
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"10px 12px",marginBottom:12,border:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",marginBottom:4,textTransform:"uppercase"}}>Description</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5,fontFamily:"'JetBrains Mono',monospace"}}>{details.description}</div>
          </div>
        )}

        {/* Connected Nodes */}
        {connectedNodes.length > 0 && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:6}}>Connected Nodes</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {connectedNodes.map((n,i) => {
                const nc = NODE_COLORS[n.type]||NODE_COLORS.default;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:nc.fill,flexShrink:0}}/>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:"'JetBrains Mono',monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.label}</span>
                    <span style={{fontSize:8,color:nc.text,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{n.type?.replace("_"," ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Research */}
        {research?.length > 0 && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:6}}>Related Research</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {research.slice(0,3).map((r,i) => (
                <div key={i} style={{fontSize:10,color:C.onSurfaceVariant,padding:"5px 8px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",background:"rgba(255,255,255,0.02)",borderRadius:6,border:"1px solid rgba(255,255,255,0.04)"}} onClick={()=>onResearch?.(r.query)}>🔬 {r.query?.slice(0,55)}</div>
              ))}
            </div>
          </div>
        )}

        {/* Find Paths */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:6}}>Find Path To</div>
          <div style={{display:"flex",gap:6}}>
            <input value={pathTarget} onChange={e=>setPathTarget(e.target.value)} placeholder="node name..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:11,fontFamily:"'JetBrains Mono',monospace",outline:"none"}}/>
            <button onClick={()=>onFindPath?.(pathTarget)} style={{padding:"6px 10px",background:`${C.cyan}22`,border:`1px solid ${C.cyan}44`,borderRadius:8,color:C.cyan,cursor:"pointer",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>→</button>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onResearch?.(node.label)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:`linear-gradient(135deg, ${C.purple}, #7c3aed)`,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:"'Sora',sans-serif",boxShadow:`0 4px 16px ${C.purple}44`,transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            🔬 Research This
          </button>
          <button onClick={()=>onFindPath?.("")} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.cyan}44`,background:`${C.cyan}11`,color:C.cyan,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:"'Sora',sans-serif",transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            🕸️ Explore
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MINI MAP ─────────────────────────────────────────────────
function MiniMap({ positions, pan, zoom, canvasSize, onJump }) {
  const mmSize = 150;
  const allX = positions.map(n=>n.x), allY = positions.map(n=>n.y);
  const minX=Math.min(...allX,0), maxX=Math.max(...allX,1000);
  const minY=Math.min(...allY,0), maxY=Math.max(...allY,700);
  const rangeX=maxX-minX||1, rangeY=maxY-minY||1;
  const scale = Math.min(mmSize/rangeX, mmSize/rangeY) * 0.85;

  const toMM = (x,y) => ({
    x: (x-minX)*scale + (mmSize-(rangeX*scale))/2,
    y: (y-minY)*scale + (mmSize-(rangeY*scale))/2,
  });

  const vpX = (-pan.x/zoom-minX)*scale + (mmSize-(rangeX*scale))/2;
  const vpY = (-pan.y/zoom-minY)*scale + (mmSize-(rangeY*scale))/2;
  const vpW = (canvasSize.w/zoom)*scale;
  const vpH = (canvasSize.h/zoom)*scale;

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const worldX = (mx / scale) + minX;
    const worldY = (my / scale) + minY;
    onJump({ x: -worldX*zoom + canvasSize.w/2, y: -worldY*zoom + canvasSize.h/2 });
  }, [scale, minX, minY, zoom, canvasSize, onJump]);

  return (
    <div style={{position:"absolute",bottom:70,left:20,zIndex:30,borderRadius:12,overflow:"hidden",border:"1px solid rgba(168,85,247,0.3)",boxShadow:"0 0 20px rgba(168,85,247,0.15)",background:"rgba(10,8,22,0.9)",backdropFilter:"blur(12px)"}}>
      <div style={{fontSize:9,color:C.purple,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",padding:"4px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)",letterSpacing:"0.1em"}}>Overview</div>
      <svg width={mmSize} height={mmSize} onClick={handleClick} style={{display:"block",cursor:"crosshair"}}>
        {positions.map(n => {
          const mm = toMM(n.x,n.y);
          const col = NODE_COLORS[n.type]||NODE_COLORS.default;
          return <circle key={n.id} cx={mm.x} cy={mm.y} r={2.5} fill={col.fill} opacity={0.8}/>;
        })}
        <rect x={vpX} y={vpY} width={Math.max(10,vpW)} height={Math.max(10,vpH)} fill="rgba(168,85,247,0.08)" stroke={C.purple} strokeWidth={1} rx={2}/>
      </svg>
    </div>
  );
}

// ─── CONTEXT MENU ─────────────────────────────────────────────
function ContextMenu({ node, position, onClose, onResearch, onHighlight, onPathfind }) {
  const items = [
    { icon:"🔬", label:"Research This", action:()=>{onResearch?.(node.label);onClose();} },
    { icon:"🕸️", label:"Find Connections", action:()=>{onPathfind?.(node);onClose();} },
    { icon:"✨", label:"Highlight Related", action:()=>{onHighlight?.(node);onClose();} },
    { icon:"📋", label:"Copy Node Name", action:()=>{navigator.clipboard?.writeText(node.label);onClose();} },
  ];
  const [visible, setVisible] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),10);return()=>clearTimeout(t);},[]);

  return (
    <div style={{position:"absolute",left:position.x,top:position.y,zIndex:300,pointerEvents:"all"}} onClick={e=>e.stopPropagation()}>
      <div style={{
        position:"relative",background:"rgba(10,8,22,0.97)",backdropFilter:"blur(24px)",
        border:"1px solid rgba(168,85,247,0.3)",borderRadius:12,overflow:"hidden",
        boxShadow:"0 0 40px rgba(168,85,247,0.2), 0 16px 40px rgba(0,0,0,0.7)",
        transform:visible?"scale(1)":"scale(0.92)",opacity:visible?1:0,
        transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)",transformOrigin:"top left",
        minWidth:180,
      }}>
        <div style={{padding:"8px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{node.label?.slice(0,22)}</div>
        {items.map((item,i)=>(
          <div key={i} onClick={item.action} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"rgba(255,255,255,0.75)",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(168,85,247,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span>{item.icon}</span><span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TIMELINE SLIDER ──────────────────────────────────────────
function TimelineSlider({ value, onChange, onPlay, playing }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const year = 2025;
  return (
    <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",zIndex:30,display:"flex",alignItems:"center",gap:10,background:"rgba(10,8,22,0.9)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"8px 16px",minWidth:340}}>
      <button onClick={onPlay} style={{background:`${C.purple}22`,border:`1px solid ${C.purple}44`,borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:C.purple,fontSize:12}}>
        {playing?"⏸":"▶"}
      </button>
      <div style={{display:"flex",flexDirection:"column",flex:1,gap:4}}>
        <input type="range" min={0} max={11} value={value} onChange={e=>onChange(parseInt(e.target.value))} style={{width:"100%",accentColor:C.purple,cursor:"pointer"}}/>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {months.map((m,i)=>(
            <span key={m} style={{fontSize:7,color:i===value?C.purple:"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace",fontWeight:i===value?700:400}}>{m}</span>
          ))}
        </div>
      </div>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.purple,flexShrink:0,fontWeight:700}}>{months[value]} {year}</span>
    </div>
  );
}

// ─── PATHFINDER ───────────────────────────────────────────────
function Pathfinder({ positions, onClose }) {
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [result, setResult] = useState(null);
  const find = async () => {
    try {
      const res = await fetch(`http://localhost:8000/knowledge/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (res.ok) setResult(await res.json());
    } catch(e) { setResult({ error: "Connection failed" }); }
  };
  return (
    <div style={{position:"absolute",top:160,left:12,zIndex:30,width:260}}>
      <div style={{position:"relative",background:"rgba(10,8,22,0.95)",backdropFilter:"blur(20px)",border:"1px solid rgba(0,204,255,0.2)",borderRadius:14,padding:"14px",boxShadow:"0 0 30px rgba(0,204,255,0.1)"}}>
        <SynapseDots color={C.cyan} />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>🧭 PATH FINDER</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
        <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="From node..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"7px 10px",color:"#fff",fontSize:11,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box",marginBottom:6}}/>
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="To node..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"7px 10px",color:"#fff",fontSize:11,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        <button onClick={find} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:`${C.cyan}22`,color:C.cyan,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:"'JetBrains Mono',monospace",border:`1px solid ${C.cyan}44`}}>Find Path →</button>
        {result && <div style={{marginTop:8,fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:"'JetBrains Mono',monospace"}}>{result.error||JSON.stringify(result).slice(0,80)}</div>}
      </div>
    </div>
  );
}

// ─── EDGE PARTICLES ──────────────────────────────────────────
// Edge particles are drawn on canvas in the render loop
// (see animate() - particle state stored in edgeParticles ref)

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function KnowledgeGraphPage({ user, onStartResearch, onNavigate, onLogout }) {
  const canvasRef  = useRef(null);
  const miniCanvasRef = useRef(null);
  const animRef    = useRef(null);
  const edgeParticlesRef = useRef([]);
  const hoverTimerRef = useRef(null);
  const frameRef   = useRef(0);

  const [graphData, setGraphData]     = useState({ nodes:[], edges:[] });
  const [positions, setPositions]     = useState([]);
  const [hovered, setHovered]         = useState(null);
  const [hoveredLong, setHoveredLong] = useState(null); // 500ms hover
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [nodeResearch, setNodeResearch] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [useRichGraph, setUseRichGraph] = useState(true);
  const [viewMode, setViewMode]       = useState("2d");
  const [dragging, setDragging]       = useState(null);
  const [dragOffset, setDragOffset]   = useState({ x:0, y:0 });
  const [zoom, setZoom]               = useState(1);
  const [pan, setPan]                 = useState({ x:0, y:0 });
  const [isPanning, setIsPanning]     = useState(false);
  const [panStart, setPanStart]       = useState({ x:0, y:0 });
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [highlightNode, setHighlightNode] = useState(null);
  const [timelineValue, setTimelineValue] = useState(4);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [hoverPopupPos, setHoverPopupPos] = useState({ x:0, y:0 });
  const [canvasSize, setCanvasSize]   = useState({ w:1000, h:700 });
  const [showExportHint, setShowExportHint] = useState(false);

  // ─── LOAD GRAPH ─────────────────────────────────────────────
  const loadGraph = useCallback(async (richMode=true) => {
    setLoading(true);
    try {
      const endpoint = richMode
        ? "http://localhost:8000/knowledge/rich-graph"
        : "http://localhost:8000/knowledge/graph";
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.nodes?.length > 0) {
          setGraphData(data);
        } else if (richMode) {
          await fetch("http://localhost:8000/knowledge/seed-rich-demo", { method:"POST" });
          const r2 = await fetch(endpoint);
          if (r2.ok) setGraphData(await r2.json());
        }
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadGraph(true); },[]);

  // ─── FORCE SIMULATION ───────────────────────────────────────
  useEffect(() => {
    if (!graphData.nodes?.length) return;
    const W = (canvasRef.current?.offsetWidth || 1000) * 1.5;
    const H = (canvasRef.current?.offsetHeight || 700) * 1.5;
    setPositions(runForceSimulation(graphData.nodes, graphData.edges||[], W, H, 100));
    edgeParticlesRef.current = [];
  }, [graphData]);

  // ─── TIMELINE PLAYBACK ──────────────────────────────────────
  useEffect(() => {
    if (!timelinePlaying) return;
    const t = setInterval(()=>setTimelineValue(v=>(v+1)%12), 1200);
    return ()=>clearInterval(t);
  }, [timelinePlaying]);

  // ─── NODE DETAILS ───────────────────────────────────────────
  const fetchNodeDetails = useCallback(async (node) => {
    setSelectedNode(node);
    try {
      const cleanId = node.id?.replace(/^(claim_|evidence_|arg_|topic_|debate_)/, "") || node.label;
      const [detailRes, researchRes] = await Promise.all([
        fetch(`http://localhost:8000/knowledge/node/${encodeURIComponent(cleanId)}`),
        fetch(`http://localhost:8000/knowledge/node/${encodeURIComponent(cleanId)}/research`)
      ]);
      if (detailRes.ok) setNodeDetails(await detailRes.json());
      if (researchRes.ok) setNodeResearch((await researchRes.json()).related_research || []);
    } catch(e) { console.error(e); }
  }, []);

  // ─── HOVER TIMER (500ms) ─────────────────────────────────────
  useEffect(() => {
    clearTimeout(hoverTimerRef.current);
    if (hovered && !dragging) {
      hoverTimerRef.current = setTimeout(()=>setHoveredLong(hovered), 500);
    } else {
      setHoveredLong(null);
    }
    return ()=>clearTimeout(hoverTimerRef.current);
  }, [hovered, dragging]);

  // ─── INTERACTION HANDLERS ────────────────────────────────────
  const getWorldPos = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return { x:0, y:0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top  - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const findNodeAt = useCallback((wx, wy) => {
    return positions.find(n => Math.hypot(n.x-wx, n.y-wy) < n.size+12);
  }, [positions]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 2) return; // right-click handled separately
    const { x:wx, y:wy } = getWorldPos(e);
    const found = findNodeAt(wx, wy);
    if (found) {
      setDragging(found.id);
      setDragOffset({ x:found.x-wx, y:found.y-wy });
      canvasRef.current.style.cursor = "grabbing";
    } else {
      setIsPanning(true);
      setPanStart({ x:e.clientX-pan.x, y:e.clientY-pan.y });
      canvasRef.current.style.cursor = "move";
    }
    setContextMenu(null);
  }, [getWorldPos, findNodeAt, pan]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const { x:wx, y:wy } = getWorldPos(e);
    if (dragging) {
      setPositions(prev=>prev.map(n=>n.id===dragging?{...n,x:wx+dragOffset.x,y:wy+dragOffset.y,fixed:true}:n));
    } else if (isPanning) {
      setPan({ x:e.clientX-panStart.x, y:e.clientY-panStart.y });
    } else {
      const found = findNodeAt(wx, wy);
      setHovered(found||null);
      setHoverPopupPos({ x:e.clientX-rect.left, y:e.clientY-rect.top });
      canvasRef.current.style.cursor = found?"pointer":"default";
    }
  }, [dragging, dragOffset, isPanning, panStart, getWorldPos, findNodeAt]);

  const handleMouseUp = useCallback(()=>{
    setDragging(null); setIsPanning(false);
    if (canvasRef.current) canvasRef.current.style.cursor="default";
  }, []);

  const handleClick = useCallback((e)=>{
    if (dragging||isPanning) return;
    if (hovered) { fetchNodeDetails(hovered); setContextMenu(null); }
    else { setSelectedNode(null); setNodeDetails(null); setNodeResearch([]); setHighlightNode(null); }
  }, [hovered, dragging, isPanning, fetchNodeDetails]);

  const handleContextMenu = useCallback((e)=>{
    e.preventDefault();
    const { x:wx, y:wy } = getWorldPos(e);
    const found = findNodeAt(wx, wy);
    if (found) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setContextMenu({ node:found, x:e.clientX-(rect?.left||0), y:e.clientY-(rect?.top||0) });
    }
  }, [getWorldPos, findNodeAt]);

  const handleWheel = useCallback((e)=>{
    e.preventDefault();
    setZoom(prev=>Math.max(0.3, Math.min(4, prev - e.deltaY*0.001)));
  }, []);

  // ─── EXPORT PNG ──────────────────────────────────────────────
  const exportPNG = useCallback(()=>{
    const canvas=canvasRef.current; if (!canvas) return;
    const link=document.createElement("a"); link.download="polynous-graph.png";
    link.href=canvas.toDataURL("image/png"); link.click();
    setShowExportHint(true); setTimeout(()=>setShowExportHint(false),2000);
  }, []);

  // ─── FILTERED DATA ───────────────────────────────────────────
  const filteredPositions = positions.filter(n=>filter==="all"||n.type===filter);
  const filteredNodeIds   = new Set(filteredPositions.map(n=>n.id));
  const filteredEdges     = (graphData.edges||[]).filter(e=>filteredNodeIds.has(e.source)&&filteredNodeIds.has(e.target));

  // ─── CONNECTED NODE IDS (for hover highlighting) ─────────────
  const hoveredConnections = hovered
    ? new Set(filteredEdges.filter(e=>e.source===hovered.id||e.target===hovered.id).flatMap(e=>[e.source,e.target]))
    : new Set();
  const hoveredConnCount = hoveredConnections.size > 0 ? hoveredConnections.size - 1 : 0;

  // ─── CLUSTER BACKGROUNDS ─────────────────────────────────────
  const clusters = {};
  positions.forEach(n=>{
    const type=n.type; if (!CLUSTER_COLORS[type]) return;
    if (!clusters[type]) clusters[type]=[];
    clusters[type].push(n);
  });

  // ─── RENDER LOOP ─────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    const resize=()=>{
      canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
      setCanvasSize({ w:canvas.offsetWidth, h:canvas.offsetHeight });
    };
    resize(); window.addEventListener("resize",resize);

    // init edge particles
    const initParticles=()=>{
      edgeParticlesRef.current=filteredEdges.map(e=>({
        edge:e, t:Math.random(),
        speed: 0.0004 + Math.random()*0.0006 * (e.weight||1),
        size: 2+Math.random()*2,
      }));
    };
    if (filteredEdges.length && edgeParticlesRef.current.length===0) initParticles();

    const animate=()=>{
      frameRef.current++;
      if (!positions.length){ animRef.current=requestAnimationFrame(animate); return; }
      const W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      const t=Date.now();

      // ── CLUSTER BACKGROUNDS ──
      if (zoom < 2) {
        const clusterAlpha = Math.max(0, Math.min(1, (2-zoom)*0.6));
        Object.entries(clusters).forEach(([type,nodes])=>{
          if (!nodes.length) return;
          const cx=nodes.reduce((s,n)=>s+n.x,0)/nodes.length;
          const cy=nodes.reduce((s,n)=>s+n.y,0)/nodes.length;
          const maxDist=Math.max(...nodes.map(n=>Math.hypot(n.x-cx,n.y-cy)))+50;
          const color=CLUSTER_COLORS[type]||"rgba(100,100,200,0.03)";
          const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,maxDist);
          const [r,g,b]=color.match(/\d+/g);
          grad.addColorStop(0,`rgba(${r},${g},${b},${clusterAlpha*0.12})`);
          grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(cx,cy,maxDist,0,Math.PI*2);
          ctx.fillStyle=grad; ctx.fill();
        });
      }

      // ── EDGES ──
filteredEdges.forEach(edge => {
    const src = positions.find(n => n.id === edge.source);
    const tgt = positions.find(n => n.id === edge.target);
    if (!src || !tgt) return;
    
    const isHovEdge = hovered && (hovered.id === src.id || hovered.id === tgt.id);
    const isSelEdge = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);
    const edgeColor = edge.color || "rgba(160,155,210,0.5)";
    const searchMatch = searchQuery && (src.label?.toLowerCase().includes(searchQuery.toLowerCase()) || tgt.label?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Draw edge line
    ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y);
    if (isHovEdge || isSelEdge) {
        ctx.strokeStyle = edgeColor; ctx.lineWidth = 2.5; ctx.globalAlpha = 1;
    } else if (searchMatch) {
        ctx.strokeStyle = edgeColor; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
    } else if (searchQuery || highlightNode) {
        ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.2;
    } else {
        ctx.strokeStyle = edgeColor; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.45;
    }
    ctx.stroke(); ctx.globalAlpha = 1;

    // ⚡ ENERGY BEAMS — Particles flowing along hovered/selected edges
    if (isHovEdge || isSelEdge) {
        const [er, eg, eb] = hexToRgb(edgeColor);
        const beamCount = 4;
        for (let b = 0; b < beamCount; b++) {
            // Each beam at different phase
            const phase = (b / beamCount);
            const speed = 0.0008 + (edge.weight || 1) * 0.000002;
            const progress = ((t * speed + phase) % 1);
            
            // Position along the edge
            const bx = src.x + (tgt.x - src.x) * progress;
            const by = src.y + (tgt.y - src.y) * progress;
            
            // Glow trail
            const trailLen = 15;
            const trailProgress = Math.max(0, progress - 0.05);
            const tx = src.x + (tgt.x - src.x) * trailProgress;
            const ty = src.y + (tgt.y - src.y) * trailProgress;
            
            // Draw trail
            const trailGrad = ctx.createLinearGradient(bx, by, tx, ty);
            trailGrad.addColorStop(0, `rgba(${er},${eg},${eb},0.9)`);
            trailGrad.addColorStop(1, `rgba(${er},${eg},${eb},0)`);
            
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // Bright core particle
            const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
            coreGrad.addColorStop(0, `rgba(255,255,255,1)`);
            coreGrad.addColorStop(0.3, `rgba(${er},${eg},${eb},0.9)`);
            coreGrad.addColorStop(1, `rgba(${er},${eg},${eb},0)`);
            
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();
        }
        
        // Edge glow on hover
        const glowGrad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        glowGrad.addColorStop(0, `rgba(${er},${eg},${eb},0.6)`);
        glowGrad.addColorStop(0.5, `rgba(${er},${eg},${eb},0.8)`);
        glowGrad.addColorStop(1, `rgba(${er},${eg},${eb},0.6)`);
        
        ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = glowGrad;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Edge label on hover
    if ((isHovEdge || isSelEdge) && edge.type && zoom > 0.7) {
        const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
        const label = EDGE_LABELS[edge.type] || edge.type;
        ctx.save();
        ctx.font = `bold ${Math.round(10/zoom)}px 'JetBrains Mono',monospace`;
        ctx.textAlign = "center";
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(10,8,22,0.8)";
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(mx-tw/2-4, my-8, tw+8, 14, 3) : ctx.rect(mx-tw/2-4, my-8, tw+8, 14);
        ctx.fill();
        ctx.fillStyle = edgeColor;
        ctx.fillText(label, mx, my+3);
        ctx.restore();
    }
});

      // ── EDGE PARTICLES ──
      edgeParticlesRef.current.forEach(p=>{
        const src=positions.find(n=>n.id===p.edge.source);
        const tgt=positions.find(n=>n.id===p.edge.target);
        if (!src||!tgt) return;
        p.t+=p.speed;
        if (p.t>1) p.t=0;
        const x=src.x+(tgt.x-src.x)*p.t;
        const y=src.y+(tgt.y-src.y)*p.t;
        const edgeColor=p.edge.color||C.purple;
        const [r,g,b]=hexToRgb(edgeColor);
        const grad=ctx.createRadialGradient(x,y,0,x,y,p.size*2);
        grad.addColorStop(0,`rgba(${r},${g},${b},0.9)`);
        grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(x,y,p.size*2,0,Math.PI*2);
        ctx.fillStyle=grad; ctx.fill();
        ctx.beginPath(); ctx.arc(x,y,p.size*0.6,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,0.9)`; ctx.fill();
      });

      // ── NODES ──
      positions.forEach(n=>{
        const visible=filter==="all"||n.type===filter;
        const matchSearch=!searchQuery||n.label?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!visible&&!matchSearch) return;

        const isHov=hovered?.id===n.id;
        const isSel=selectedNode?.id===n.id;
        const isConnected=hoveredConnections.has(n.id);
        const isHighlighted=highlightNode?.id===n.id;
        const isDimmed=(searchQuery&&!matchSearch)||(highlightNode&&!isHighlighted&&!isConnected&&n.id!==highlightNode?.id);

        const pulse=Math.sin(t*0.002+(n.id?.charCodeAt(0)||0)*0.7)*2;
        let r=n.size+pulse;
        if (isHov) r*=1.2;
        if (isSel) r=n.size+pulse+6;
        const col=NODE_COLORS[n.type]||NODE_COLORS.default;

        ctx.globalAlpha=isDimmed?0.1:isConnected&&!isHov&&!isSel?0.65:1;

        // Aura glow
        const auraR=r+(isSel?38:isHov?28:isConnected?18:14);
        const aura=ctx.createRadialGradient(n.x,n.y,r*0.3,n.x,n.y,auraR);
        const [gr,gg,gb]=hexToRgb(col.glow);
        aura.addColorStop(0,`rgba(${gr},${gg},${gb},${isSel?0.55:isHov?0.35:isConnected?0.12:0.07})`);
        aura.addColorStop(1,"rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(n.x,n.y,auraR,0,Math.PI*2); ctx.fillStyle=aura; ctx.fill();

        // Expanding selection ring
        if (isSel) {
          const ringR=r+20+Math.sin(t*0.004)*8;
          ctx.beginPath(); ctx.arc(n.x,n.y,ringR,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${gr},${gg},${gb},${0.3+Math.sin(t*0.004)*0.2})`;
          ctx.lineWidth=1.5; ctx.stroke();
          const ringR2=r+36+Math.sin(t*0.003+1)*6;
          ctx.beginPath(); ctx.arc(n.x,n.y,ringR2,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${gr},${gg},${gb},${0.12+Math.sin(t*0.003)*0.1})`;
          ctx.lineWidth=0.8; ctx.stroke();
        }

        // Node body gradient
        const grad=ctx.createRadialGradient(n.x-r*0.3,n.y-r*0.35,0,n.x,n.y,r);
        const [fr,fg,fb]=hexToRgb(col.fill);
        const boost=isHov?90:isSel?70:0;
        grad.addColorStop(0,`rgba(${Math.min(255,fr+boost+80)},${Math.min(255,fg+boost+80)},${Math.min(255,fb+boost+80)},1)`);
        grad.addColorStop(0.6,`rgba(${Math.min(255,fr+boost)},${Math.min(255,fg+boost)},${Math.min(255,fb+boost)},0.95)`);
        grad.addColorStop(1,`rgba(${fr},${fg},${fb},0.85)`);
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();

        // Node border
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
        ctx.strokeStyle=isSel?"rgba(255,255,255,0.95)":isHov?"rgba(255,255,255,0.75)":isConnected?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.2)";
        ctx.lineWidth=isSel?2.5:isHov?2:0.8; ctx.stroke();
        ctx.globalAlpha=1;

        // Label
        const labelText=(n.label?.length>18?n.label.slice(0,17)+"…":n.label)||"";
        const fontSize=zoom<0.6?8:zoom<0.8?9:10;
        ctx.font=`${isHov||isSel?600:400} ${isHov||isSel?fontSize+2:fontSize}px 'JetBrains Mono',monospace`;
        ctx.textAlign="center";
        // label shadow
        ctx.shadowColor=col.glow; ctx.shadowBlur=isHov||isSel?8:0;
        ctx.fillStyle=(isHov||isSel||matchSearch)?"#fff":col.text;
        ctx.fillText(labelText,n.x,n.y+r+15);
        ctx.shadowBlur=0;

        // Confidence / score above node
        if ((isHov||isSel)&&n.confidence>0) {
          ctx.font=`bold ${fontSize+1}px 'JetBrains Mono',monospace`;
          ctx.fillStyle=C.green; ctx.shadowColor=C.green; ctx.shadowBlur=6;
          ctx.fillText(`${n.confidence}%`,n.x,n.y-r-12);
          ctx.shadowBlur=0;
        }
        if ((isHov||isSel)&&n.score>0) {
          ctx.font=`bold ${fontSize+1}px 'JetBrains Mono',monospace`;
          ctx.fillStyle=C.crimson; ctx.shadowColor=C.crimson; ctx.shadowBlur=6;
          ctx.fillText(`${n.score}/10`,n.x,n.y-r-12);
          ctx.shadowBlur=0;
        }
      });

      ctx.restore();
      animRef.current=requestAnimationFrame(animate);
    };
    animate();
    return ()=>{ cancelAnimationFrame(animRef.current); window.removeEventListener("resize",resize); };
  }, [positions, hovered, selectedNode, filter, filteredEdges, searchQuery, pan, zoom, clusters, hoveredConnections, highlightNode]);

  // ─── FILTER TYPES ────────────────────────────────────────────
  const filterTypes=["all","claim","evidence","argument","topic","debate_topic","concept","entity"];
  const activeFilterCount=filter==="all"?positions.length:positions.filter(n=>n.type===filter).length;

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.void,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <NeuralCanvas/>
      <div style={{textAlign:"center",zIndex:10,position:"relative"}}>
        <div style={{width:60,height:60,borderRadius:"50%",border:`3px solid rgba(168,85,247,0.15)`,borderTop:`3px solid ${C.purple}`,animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
        <div style={{fontFamily:"'Sora',sans-serif",color:C.purple,fontWeight:700,fontSize:16,letterSpacing:"-0.02em"}}>Loading Neural Topology</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",color:"rgba(168,85,247,0.4)",fontSize:11,marginTop:6}}>Calibrating synaptic pathways…</div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.void,position:"relative",overflow:"hidden"}} onClick={()=>setContextMenu(null)}>
      <NeuralCanvas/>
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout}/>

      <div style={{marginLeft:320,position:"relative",zIndex:10,height:"100vh"}} onWheel={handleWheel}>

        {/* ── CANVAS ── */}
        <canvas ref={canvasRef}
          style={{width:"100%",height:"100%",display:"block"}}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        />

        {/* ── GRAPH MODE TOGGLE ── */}
        <div style={{position:"absolute",top:14,left:14,zIndex:20,display:"flex",gap:6}}>
          {[{label:"🧬 Rich",rich:true},{label:"📊 Basic",rich:false}].map(({label,rich})=>(
            <button key={label} onClick={()=>{setUseRichGraph(rich);loadGraph(rich);}} style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${useRichGraph===rich?C.purple+"66":"rgba(255,255,255,0.08)"}`,cursor:"pointer",fontSize:11,fontFamily:"'JetBrains Mono',monospace",background:useRichGraph===rich?"rgba(168,85,247,0.18)":"rgba(255,255,255,0.03)",color:useRichGraph===rich?"#fff":"rgba(255,255,255,0.4)",transition:"all 0.2s",backdropFilter:"blur(10px)"}}>
              {label}
            </button>
          ))}
        </div>

        {/* ── 2D/3D TOGGLE ── */}
<div style={{position:"absolute",top:14,left:200,zIndex:20,display:"flex",gap:6}}>
  <button onClick={() => setViewMode('2d')} style={{
    padding:"7px 16px",borderRadius:20,
    border:`1px solid ${viewMode==='2d' ? C.cyan+"66" : "rgba(255,255,255,0.08)"}`,
    cursor:"pointer",fontSize:11,fontFamily:"'JetBrains Mono',monospace",
    background:viewMode==='2d'?"rgba(0,204,255,0.12)":"rgba(255,255,255,0.03)",
    color:viewMode==='2d'?"#fff":"rgba(255,255,255,0.4)",
    transition:"all 0.2s",backdropFilter:"blur(10px)"
  }}>📊 2D</button>
  
  <button onClick={() => window.location.href = '/graph3d'} style={{
    padding:"7px 16px",borderRadius:20,
    border:`1px solid rgba(255,255,255,0.08)`,
    cursor:"pointer",fontSize:11,fontFamily:"'JetBrains Mono',monospace",
    background:"rgba(255,255,255,0.03)",
    color:"rgba(255,255,255,0.4)",
    transition:"all 0.2s",backdropFilter:"blur(10px)"
  }}>🧬 3D</button>
</div>

        {/* ── SEARCH ── */}
        <div style={{position:"absolute",top:58,left:14,zIndex:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:25,background:"rgba(10,8,22,0.88)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(16px)",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
            <span style={{color:C.purple,fontSize:15}}>⌕</span>
            <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search nodes…" style={{background:"none",border:"none",outline:"none",color:"#fff",fontSize:12,fontFamily:"'JetBrains Mono',monospace",width:180}}/>
            {searchQuery && <button onClick={()=>setSearchQuery("")} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",fontSize:13}}>✕</button>}
          </div>
        </div>

        {/* ── FILTER PILLS ── */}
        <div style={{position:"absolute",top:106,left:14,zIndex:20,display:"flex",gap:5,flexWrap:"wrap",maxWidth:300}}>
          {filterTypes.map(t=>{
            const col=NODE_COLORS[t]||NODE_COLORS.default;
            const active=filter===t;
            return (
              <button key={t} onClick={()=>setFilter(t)} style={{
                background:active?`${col.fill}22`:"rgba(255,255,255,0.03)",
                border:`1px solid ${active?col.fill+"55":"rgba(255,255,255,0.08)"}`,
                borderRadius:20, padding:"5px 13px", fontSize:10,
                color:active?col.text:"rgba(255,255,255,0.4)",
                cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
                textTransform:"capitalize", transition:"all 0.18s",
                fontWeight:active?700:400, backdropFilter:"blur(8px)",
              }}>
                {t.replace("_"," ")}
                {active&&<span style={{marginLeft:5,opacity:0.6,fontSize:9}}>({activeFilterCount})</span>}
              </button>
            );
          })}
        </div>

        {/* ── PATHFINDER TOGGLE ── */}
        {showPathfinder
          ? <Pathfinder positions={positions} onClose={()=>setShowPathfinder(false)}/>
          : <button onClick={()=>setShowPathfinder(true)} style={{position:"absolute",top:200,left:14,zIndex:20,padding:"7px 14px",borderRadius:20,border:`1px solid rgba(0,204,255,0.2)`,background:"rgba(0,204,255,0.06)",color:C.cyan,fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",gap:6}}>
              🧭 Pathfinder
            </button>
        }

        {/* ── MINI MAP ── */}
        {positions.length > 0 && (
          <MiniMap positions={positions} pan={pan} zoom={zoom} canvasSize={canvasSize} onJump={setPan}/>
        )}

        {/* ── LEGEND ── */}
        <div style={{position:"absolute",bottom:70,right:14,zIndex:20,background:"rgba(10,8,20,0.88)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 14px",backdropFilter:"blur(12px)"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>Node Types</div>
          {["claim","evidence","argument","topic","debate_topic","concept","entity"].map(type=>(
            <div key={type} style={{display:"flex",alignItems:"center",gap:8,opacity:filter==="all"||filter===type?1:0.25,transition:"opacity 0.2s",marginBottom:4}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:NODE_COLORS[type]?.fill,boxShadow:`0 0 6px ${NODE_COLORS[type]?.glow}`,flexShrink:0}}/>
              <span style={{fontSize:9,color:"rgba(255,255,255,0.5)",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>{type.replace("_"," ")}</span>
            </div>
          ))}
        </div>

        {/* ── METRICS / SELECTED NODE PANEL ── */}
        {!selectedNode && (
          <div style={{position:"absolute",top:14,right:14,zIndex:20,width:240}}>
            <div style={{position:"relative",background:"rgba(10,8,22,0.88)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px",backdropFilter:"blur(16px)"}}>
              <SynapseDots color={C.purple}/>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:"#fff",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:C.purple}}>◈</span> Graph Topology
              </div>
              <MetricRow label="Total Nodes" value={graphData.nodes?.length||0} color={C.purple}/>
              <MetricRow label="Total Edges" value={graphData.edges?.length||0} color={C.cyan}/>
              <MetricRow label="Visible" value={activeFilterCount} color={filter==="all"?C.cyan:(NODE_COLORS[filter]||NODE_COLORS.default).fill}/>
              <MetricRow label="Zoom" value={`${Math.round(zoom*100)}%`} color={C.gold}/>
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace",textAlign:"center",lineHeight:1.6}}>
                  🖱 Drag nodes · Scroll zoom<br/>Click node · Right-click menu
                </div>
              </div>
              {/* Export */}
              <button onClick={exportPNG} style={{width:"100%",marginTop:10,padding:"8px",borderRadius:8,border:`1px solid rgba(255,215,0,0.2)`,background:"rgba(255,215,0,0.06)",color:C.gold,fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,215,0,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,215,0,0.06)"}>
                ⬇ Export PNG {showExportHint?"✓":""}
              </button>
            </div>
          </div>
        )}

        {/* ── NODE DETAIL PANEL ── */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            details={nodeDetails}
            research={nodeResearch}
            positions={positions}
            onClose={()=>{setSelectedNode(null);setNodeDetails(null);setNodeResearch([]);}}
            onResearch={onStartResearch}
            onFindPath={(target)=>{setShowPathfinder(true);}}
          />
        )}

        {/* ── HOVER POPUP CARD (500ms delay) ── */}
        {hoveredLong && !selectedNode && !dragging && !contextMenu && (
          <HoverPopup
            key={hoveredLong.id}
            node={hoveredLong}
            position={hoverPopupPos}
            connections={hoveredConnCount}
          />
        )}

        {/* ── CONTEXT MENU ── */}
        {contextMenu && (
          <ContextMenu
            node={contextMenu.node}
            position={{ x:contextMenu.x, y:contextMenu.y }}
            onClose={()=>setContextMenu(null)}
            onResearch={onStartResearch}
            onHighlight={(n)=>setHighlightNode(n)}
            onPathfind={()=>setShowPathfinder(true)}
          />
        )}

        {/* ── TIMELINE SLIDER ── */}
        <TimelineSlider
          value={timelineValue}
          onChange={setTimelineValue}
          onPlay={()=>setTimelinePlaying(p=>!p)}
          playing={timelinePlaying}
        />

        {/* ── SIMPLE HOVER TOOLTIP (< 500ms) ── */}
        {hovered && !hoveredLong && !selectedNode && !dragging && (
          <div style={{
            position:"absolute",
            left:hoverPopupPos.x+12,
            top:hoverPopupPos.y-36,
            zIndex:50, pointerEvents:"none",
            background:"rgba(10,8,22,0.92)",
            border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:8, padding:"5px 12px",
            backdropFilter:"blur(12px)",
            display:"flex", gap:10, alignItems:"center",
          }}>
            <span style={{width:6,height:6,borderRadius:"50%",background:(NODE_COLORS[hovered.type]||NODE_COLORS.default).fill,flexShrink:0}}/>
            <span style={{color:"#fff",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{hovered.label}</span>
            <span style={{color:(NODE_COLORS[hovered.type]||NODE_COLORS.default).text,fontSize:9,textTransform:"uppercase",opacity:0.7}}>{hovered.type?.replace("_"," ")}</span>
          </div>
        )}

        {/* ── CONTROLS HINT ── */}
        <div style={{position:"absolute",bottom:52,left:180,zIndex:20,fontSize:9,color:"rgba(255,255,255,0.18)",fontFamily:"'JetBrains Mono',monospace",pointerEvents:"none"}}>
          Drag · Scroll zoom · Click details · Right-click menu
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Material+Symbols+Outlined&display=swap');
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes synapsePulse { from{opacity:0.4;transform:scale(0.8)} to{opacity:1;transform:scale(1.2)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}