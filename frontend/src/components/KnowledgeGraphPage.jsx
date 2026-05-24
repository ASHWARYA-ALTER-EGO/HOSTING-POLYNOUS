import { useEffect, useRef, useState, useCallback } from "react";
import EmptyGraphState from './EmptyGraphState';

const C = {
  green: "#00ff0f", cyan: "#00ccff", crimson: "#ff2040",
  void: "#0a0a1e", surface: "#111125", surfaceContainer: "#1e1e32",
  onSurface: "#e2e0fc", onSurfaceVariant: "#b9ccb0",
  textSecondary: "#8899aa", white10: "rgba(255,255,255,0.1)", white5: "rgba(255,255,255,0.05)",
};

const NODE_COLORS = {
  concept: { fill: "#7c6fdd", glow: "#7c6fdd", ring: "#a99fff", text: "#c8c0ff" },
  entity:  { fill: "#1dab82", glow: "#1dab82", ring: "#5fffc8", text: "#8fffd8" },
  topic:   { fill: "#e06c45", glow: "#e06c45", ring: "#ff9e72", text: "#ffc4a8" },
  core:    { fill: "#a855f7", glow: "#a855f7", ring: "#d4a5ff", text: "#e2d4ff" },
  major:   { fill: C.green, glow: C.green, ring: "#6eff6e", text: "#b4ffb4" },
  debate:  { fill: C.crimson, glow: C.crimson, ring: "#ff6b82", text: "#ffb3c0" },
  default: { fill: "#5878d4", glow: "#5878d4", ring: "#8aaeff", text: "#aac4ff" },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function Icon({ name, style }) {
  return <span style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", lineHeight: 1, ...(style || {}) }}>{name}</span>
}

// ─── Force-Directed Physics Constants ────────────────────────
const REPULSION_STRENGTH = 600;
const ATTRACTION_STRENGTH = 0.008;
const DAMPING = 0.82;
const CENTER_GRAVITY = 0.001;
const EDGE_IDEAL_LENGTH = 150;

function runForceSimulation(nodes, edges, width, height, iterations = 80) {
  const simNodes = nodes.map((n) => ({
    ...n,
    x: width/2 + (Math.random() - 0.5) * 300,
    y: height/2 + (Math.random() - 0.5) * 300,
    vx: 0, vy: 0,
    color: (NODE_COLORS[n.type] || NODE_COLORS.default).fill,
    glow: (NODE_COLORS[n.type] || NODE_COLORS.default).glow,
    size: Math.min(38, Math.max(14, n.size || 20)),
    connections: n.connections || 0,
  }));

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between ALL nodes
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const dx = simNodes[i].x - simNodes[j].x;
        const dy = simNodes[i].y - simNodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = (simNodes[i].size + simNodes[j].size) * 1.5;
        if (dist < minDist) {
          const force = (minDist - dist) / minDist * 2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          simNodes[i].vx += fx; simNodes[i].vy += fy;
          simNodes[j].vx -= fx; simNodes[j].vy -= fy;
        }
      }
    }

    // Attraction along edges (stronger pull)
    edges.forEach(edge => {
      const src = simNodes.find(n => n.id === edge.source);
      const tgt = simNodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;
      const dx = tgt.x - src.x, dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = EDGE_IDEAL_LENGTH + src.size + tgt.size;
      const delta = dist - targetDist;
      const force = delta * ATTRACTION_STRENGTH * (edge.weight || 1);
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      src.vx += fx; src.vy += fy;
      tgt.vx -= fx; tgt.vy -= fy;
    });

    // Update positions
    simNodes.forEach(n => {
      n.vx += (width/2 - n.x) * CENTER_GRAVITY;
      n.vy += (height/2 - n.y) * CENTER_GRAVITY;
      n.vx *= DAMPING; n.vy *= DAMPING;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(40, Math.min(width - 40, n.x));
      n.y = Math.max(40, Math.min(height - 40, n.y));
    });
  }

  return simNodes;
}

// ─── Neural Background Particles ─────────────────────────────
function NeuralParticleBackground({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [], animId;
    const N = 80;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();

    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1, opacity: Math.random() * 0.4 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,15,${p.opacity})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,204,255,${0.06 * (1 - d/100)})`; ctx.lineWidth = 0.3; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);

  return null;
}

// ─── Metric Row ──────────────────────────────────────────────
function MetricRow({ label, value, color = C.green }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0'}}>
      <span style={{fontSize:10,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace"}}>{label}</span>
      <span style={{fontSize:11,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>{value}</span>
    </div>
  );
}

// ─── Collapsible Sidebar ─────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, currentPage }) {
  const [collapsed, setCollapsed] = useState(false);
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph", active: currentPage === "graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab" }
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20}}>
      <button onClick={()=>setCollapsed(false)} style={{background:"none",border:"none",color:C.green,cursor:"pointer",marginBottom:24}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"10px 0",cursor:"pointer",color:active?C.green:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div onClick={()=>handleNav('/research')} title="New Research" style={{width:36,height:36,borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:18,color:C.void}}/></div>
        <div title={user?.username||'Guest'} style={{width:32,height:32,borderRadius:"50%",background:C.surface,border:"1px solid rgba(0,255,15,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="face" style={{color:C.green,fontSize:16}}/></div>
        <div onClick={handleLogout} title="Disconnect" style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:16}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40}}>
        <div><h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.green}}>POLYNOUS</h1><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",opacity:0.7}}>Cerebral Vitality Engine</p></div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer"}}><Icon name="chevron_left" style={{fontSize:20}}/></button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
        {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.green:C.onSurfaceVariant,background:active?"rgba(0,255,15,0.08)":"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/>{label}</div>)}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.green,color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="add" style={{fontSize:18,color:C.void}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.surface,border:"1px solid rgba(0,255,15,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="face" style={{color:C.green,fontSize:22}}/></div>
          <div style={{flex:1}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace"}}>Disconnect</button></div>
        </div>
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function KnowledgeGraphPage({ user, onStartResearch, onNavigate, onLogout, graphData: propData }) {
  const graphCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const [graphData, setGraphData] = useState(propData || { nodes: [], edges: [] });
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [nodeResearch, setNodeResearch] = useState([]);
  const [loading, setLoading] = useState(!propData);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const animRef = useRef(null);

  // Load from API
  useEffect(() => {
    if (propData) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/knowledge/graph');
        if (res.ok) setGraphData(await res.json());
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [propData]);

  // Run force simulation
  useEffect(() => {
    if (!graphData.nodes?.length) return;
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 800;
    const H = canvas.offsetHeight || 600;
    const simNodes = runForceSimulation(graphData.nodes, graphData.edges || [], W, H, 80);
    setPositions(simNodes);
  }, [graphData]);

  // Fetch node details
  const fetchNodeDetails = useCallback(async (node) => {
    setSelectedNode(node);
    try {
      const [detailRes, researchRes] = await Promise.all([
        fetch(`http://localhost:8000/knowledge/node/${encodeURIComponent(node.label)}`),
        fetch(`http://localhost:8000/knowledge/node/${encodeURIComponent(node.label)}/research`)
      ]);
      if (detailRes.ok) setNodeDetails(await detailRes.json());
      if (researchRes.ok) setNodeResearch((await researchRes.json()).related_research || []);
    } catch(e) { console.error(e); }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (hovered) { fetchNodeDetails(hovered); }
    else { setSelectedNode(null); setNodeDetails(null); setNodeResearch([]); }
  }, [hovered, fetchNodeDetails]);

  // Animation loop
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);

    const animate = () => {
      if (!positions.length) { animRef.current = requestAnimationFrame(animate); return; }
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Draw edges
      (graphData.edges || []).forEach(edge => {
        const src = positions.find(n => n.id === edge.source);
        const tgt = positions.find(n => n.id === edge.target);
        if (!src || !tgt) return;
        
        // Check if edge should be highlighted
        const edgeHighlighted = (hovered && (hovered.id === src.id || hovered.id === tgt.id)) ||
                                (selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id));
        
        // Check search highlight
        const searchMatch = searchQuery && (
          src.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tgt.label.toLowerCase().includes(searchQuery.toLowerCase())
        );

        ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y);
        
        if (edgeHighlighted || searchMatch) {
          const col = NODE_COLORS[src.type] || NODE_COLORS.default;
          ctx.strokeStyle = `rgba(${hexToRgb(col.glow).join(',')},0.5)`;
          ctx.lineWidth = 1.5;
        } else if (searchQuery) {
          ctx.strokeStyle = 'rgba(255,255,255,0.02)';
          ctx.lineWidth = 0.3;
        } else {
          ctx.strokeStyle = `rgba(160,155,210,${0.04 + (edge.weight||1)*0.02})`;
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      });

      // Draw nodes
      positions.forEach(n => {
        const visible = filter === 'all' || n.type === filter;
        
        // Search filter
        const matchesSearch = !searchQuery || 
          n.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!visible && !matchesSearch) return;
        
        const isHovered = hovered?.id === n.id;
        const isSelected = selectedNode?.id === n.id;
        const isDimmed = (searchQuery && !matchesSearch) || 
                        (!!selectedNode && !isSelected && !(graphData.edges || []).some(e =>
                          (e.source === selectedNode.id && e.target === n.id) ||
                          (e.target === selectedNode.id && e.source === n.id)));
        
        const pulse = Math.sin(Date.now() * 0.003 + (n.id?.charCodeAt(0) || 0)) * 1.5;
        const r = n.size + pulse + (isHovered || isSelected ? 5 : 0);
        
        const col = NODE_COLORS[n.type] || NODE_COLORS.default;
        const [fr,fg,fb] = hexToRgb(col.fill);
        const [gr,gg,gb] = hexToRgb(col.glow);
        
        ctx.globalAlpha = isDimmed ? 0.15 : 1.0;
        
        // Glow
        const auraR = r + (isSelected ? 32 : isHovered ? 24 : 12);
        const aura = ctx.createRadialGradient(n.x, n.y, r*0.3, n.x, n.y, auraR);
        aura.addColorStop(0, `rgba(${gr},${gg},${gb},${isSelected?0.45:isHovered?0.3:0.08})`);
        aura.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, auraR, 0, Math.PI*2); ctx.fillStyle = aura; ctx.fill();
        
        // Node body
        const grad = ctx.createRadialGradient(n.x-r*0.3, n.y-r*0.35, 0, n.x, n.y, r);
        grad.addColorStop(0, `rgba(${Math.min(255,fr+70)},${Math.min(255,fg+70)},${Math.min(255,fb+70)},1)`);
        grad.addColorStop(1, `rgba(${fr},${fg},${fb},0.85)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fillStyle = grad; ctx.fill();
        
        // Ring
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
        ctx.strokeStyle = isSelected ? '#fff' : isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 0.5; ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Label
        const label = (n.label?.length > 16 ? n.label.slice(0,15)+'…' : n.label) || '';
        ctx.font = `${isHovered||isSelected?600:400} ${isHovered||isSelected?11:10}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = (isHovered||isSelected||matchesSearch) ? '#fff' : (col.text || '#aac4ff');
        ctx.fillText(label, n.x, n.y + r + 14);
        
        // Connection count
        if (isHovered && n.connections > 0) {
          ctx.font = "500 9px 'JetBrains Mono', monospace";
          ctx.fillText(`${n.connections} links`, n.x, n.y - r - 8);
        }
      });
      
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [positions, hovered, selectedNode, filter, graphData.edges, searchQuery]);

  // Mouse handlers
  const handleMouseMove = useCallback((e) => {
    const rect = graphCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const found = positions.find(n => Math.hypot(n.x - mx, n.y - my) < n.size + 12);
    setHovered(found || null);
    graphCanvasRef.current.style.cursor = found ? "pointer" : "default";
  }, [positions]);

  const filterTypes = ["all", "concept", "entity", "topic", "major", "debate", "core"];

  // Loading state
  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:C.void,position:'relative'}}>
        <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="graph"/>
        <div style={{marginLeft:320,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:50,height:50,borderRadius:'50%',border:'3px solid rgba(0,255,15,0.15)',borderTop:'3px solid #00ff0f',animation:'spin 1s infinite',margin:'0 auto 20px'}}/>
            <div style={{fontFamily:"'Sora',sans-serif",color:C.green,fontWeight:600,fontSize:15}}>Loading Neural Topology</div>
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Empty state
  if (!graphData.nodes?.length) {
    return (
      <div style={{minHeight:'100vh',background:C.void,position:'relative'}}>
        <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="graph"/>
        <div style={{marginLeft:320,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <EmptyGraphState onNavigate={onNavigate} graphData={graphData}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:C.void,position:'relative',overflow:'hidden'}}>
      {/* Neural particle background */}
      <canvas ref={bgCanvasRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>
      <NeuralParticleBackground canvasRef={bgCanvasRef}/>
      
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="graph"/>
      
      <div style={{marginLeft:320,position:'relative',zIndex:10,height:'100vh'}}>
        <canvas ref={graphCanvasRef} style={{width:'100%',height:'100%',display:'block'}} onMouseMove={handleMouseMove} onClick={handleCanvasClick}/>
        
        {/* ========== SEARCH BAR ========== */}
        <div style={{position:'absolute',top:50,left:12,zIndex:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:25,background:'rgba(10,8,22,0.85)',border:'0.5px solid rgba(255,255,255,0.15)',backdropFilter:'blur(10px)'}}>
            <span style={{color:C.cyan,fontSize:14}}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              style={{background:'none',border:'none',outline:'none',color:'#fff',fontSize:12,fontFamily:"'JetBrains Mono',monospace",width:160}}
            />
            {searchQuery && (
              <button onClick={()=>setSearchQuery('')} style={{background:'none',border:'none',color:C.textSecondary,cursor:'pointer',fontSize:12}}>✕</button>
            )}
          </div>
          {/* Search results count */}
          {searchQuery && (
            <div style={{fontSize:10,color:C.textSecondary,fontFamily:"'JetBrains Mono',monospace",marginTop:4,marginLeft:4}}>
              {positions.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase())).length} matches
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div style={{position:'absolute',top:12,left:12,display:'flex',gap:6,flexWrap:'wrap'}}>
          {filterTypes.map(t => (
            <button key={t} onClick={()=>setFilter(t)} style={{
              background:filter===t?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)',
              border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:20,padding:'5px 13px',fontSize:11,
              color:filter===t?'#fff':'rgba(255,255,255,0.45)',cursor:'pointer',
              fontFamily:"'JetBrains Mono',monospace",textTransform:'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {/* Legend */}
        <div style={{position:'absolute',bottom:14,right:14,display:'flex',flexDirection:'column',gap:6,background:'rgba(10,8,20,0.7)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 14px'}}>
          {["concept","entity","topic","core","major","debate"].filter(t => NODE_COLORS[t]).map(type => (
            <div key={type} style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:NODE_COLORS[type]?.fill,flexShrink:0}}/>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase'}}>{type}</span>
            </div>
          ))}
        </div>

        {/* Metrics Panel */}
        <div style={{position:'absolute',top:12,right:12,width:260,display:'flex',flexDirection:'column',gap:10}}>
          {selectedNode && nodeDetails ? (
            <div style={{background:'rgba(10,8,22,0.92)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:12,padding:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{color:(NODE_COLORS[selectedNode.type]||NODE_COLORS.default).fill,fontWeight:700,fontSize:14,fontFamily:"'Sora',sans-serif"}}>📍 {nodeDetails.name}</div>
                <button onClick={()=>{setSelectedNode(null);setNodeDetails(null);setNodeResearch([])}} style={{background:'none',border:'none',color:C.textSecondary,cursor:'pointer',fontSize:14}}>✕</button>
              </div>
              <MetricRow label="Type" value={nodeDetails.type} color={C.cyan}/>
              <MetricRow label="Connections" value={nodeDetails.total_connections||0} color={C.green}/>
              {nodeDetails.avg_relationship_weight && <MetricRow label="Avg Weight" value={nodeDetails.avg_relationship_weight} color="#ffaa00"/>}
              {nodeResearch.length > 0 && (
                <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:10,color:C.textSecondary,textTransform:'uppercase',marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>Related Research</div>
                  {nodeResearch.map((r,i)=>(
                    <div key={i} onClick={()=>onStartResearch?.(r.query)} style={{fontSize:10,color:C.onSurfaceVariant,padding:'3px 0',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",opacity:0.7}}>🔬 {r.query?.slice(0,50)}</div>
                  ))}
                </div>
              )}
              <button onClick={()=>onStartResearch?.(selectedNode.label)} style={{width:'100%',marginTop:12,padding:'8px',borderRadius:8,border:'none',background:C.green,color:C.void,fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'Sora',sans-serif"}}>Research This →</button>
            </div>
          ) : (
            <div style={{background:'rgba(10,8,22,0.8)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'16px'}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:'#fff',marginBottom:10}}>📊 Graph Overview</div>
              <MetricRow label="Total Nodes" value={graphData.nodes?.length||0} color={C.green}/>
              <MetricRow label="Total Edges" value={graphData.edges?.length||0} color={C.cyan}/>
              <MetricRow label="Synaptic Density" value={Math.min(95,(graphData.nodes?.length||0)*8)+'%'} color={C.green}/>
              <div style={{fontSize:10,color:C.textSecondary,marginTop:8,fontFamily:"'JetBrains Mono',monospace",textAlign:'center'}}>Click a node for details</div>
            </div>
          )}
        </div>

        {/* Hover tooltip */}
        {hovered && !selectedNode && (
          <div style={{position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',background:'rgba(10,8,22,0.9)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'8px 16px',display:'flex',gap:16}}>
            <span style={{color:'#fff',fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{hovered.label}</span>
            <span style={{color:(NODE_COLORS[hovered.type]||NODE_COLORS.default).fill,fontSize:11,textTransform:'uppercase'}}>{hovered.type}</span>
            <span style={{color:C.textSecondary,fontSize:11}}>{hovered.connections||0} links</span>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}