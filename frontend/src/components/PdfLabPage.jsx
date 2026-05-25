import { useState, useEffect, useRef, useCallback } from "react";

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
    ::selection{background:rgba(255,215,0,0.25)}
    @keyframes borderPulse{0%,100%{opacity:0.5}50%{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .gold-border-pulse{border:2px dashed #ffd700;animation:borderPulse 2s infinite ease-in-out}
    .animate-bounce{animation:bounce 1s infinite}
    .animate-spin-slow{animation:spin 10s linear infinite}
    .animate-spin-slow-reverse{animation:spin 15s linear infinite reverse}
    .hover-lift:hover{transform:translateY(-4px);transition:transform 0.3s}
    .custom-scroll::-webkit-scrollbar{width:4px}
    .custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,215,0,0.2);border-radius:10px}
  `}</style>;
}

// ─── Three-Color Neural Background ────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext("2d");
    let particles = [], animId; const N = 150;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight };
    window.addEventListener("resize", resize); resize();
    const colors = [
      { color: "#ffd700", speed: 0.5 }, { color: "#00ff0f", speed: 1.5 }, { color: "#a855f7", speed: 1.0 }
    ];
    for (let i = 0; i < N; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*c.speed, vy: (Math.random()-0.5)*c.speed, size: Math.random()*2+1, color: c.color, opacity: Math.random()*0.5+0.2 });
    }
    const loop = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.opacity;ctx.fill();for(let j=i+1;j<particles.length;j++){const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);if(d<100){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(255,255,255,${0.04*(1-d/100)})`;ctx.lineWidth=0.3;ctx.stroke()}}});animId=requestAnimationFrame(loop)};loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── COLLAPSIBLE SIDEBAR ──────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const NAV = [
    { icon: "travel_explore", label: "Research", path: "/research" },
    { icon: "forum", label: "Debate Chamber", path: "/debate" },
    { icon: "account_tree", label: "Knowledge Graph", path: "/graph" },
    { icon: "search", label: "Semantic Search", path: "/search" },
    { icon: "database", label: "Memory Bank", path: "/memory" },
    { icon: "picture_as_pdf", label: "PDF Lab", path: "/pdf-lab", active: true },
    { icon: "analytics", label: "Analytics", path: "/analytics" },
  ];
  const handleNav = (p) => onNavigate ? onNavigate(p) : window.location.href = p;
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = '/');

  if (collapsed) return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:56,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",zIndex:20 }}>
      <button onClick={()=>setCollapsed(false)} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",marginBottom:32}}><Icon name="chevron_right" style={{fontSize:22}}/></button>
      {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} title={label} style={{padding:"12px 0",cursor:"pointer",color:active?C.gold:C.onSurfaceVariant,width:"100%",display:"flex",justifyContent:"center"}}><Icon name={icon} style={{fontSize:20,color:"inherit"}}/></div>)}
      <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div onClick={()=>handleNav('/research')} style={{width:34,height:34,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="add" style={{fontSize:16,color:C.void}}/></div>
        <div title={user?.username||'Guest'} style={{width:30,height:30,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(255,215,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="face" style={{color:C.gold,fontSize:14}}/></div>
        <div onClick={handleLogout} title="Disconnect" style={{cursor:"pointer",color:C.crimson}}><Icon name="logout" style={{fontSize:14}}/></div>
      </div>
    </aside>
  );

  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100%",width:320,background:"rgba(10,10,30,0.6)",backdropFilter:"blur(24px)",borderRight:"1px solid "+C.white10,boxShadow:"0 0 20px rgba(0,255,15,0.1)",display:"flex",flexDirection:"column",padding:24,zIndex:20,transition:"width 0.35s cubic-bezier(0.4,0,0.2,1),padding 0.35s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,minWidth:0}}>
        <div style={{flex:1,minWidth:0}}><h1 style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.gold,letterSpacing:"-0.03em",whiteSpace:"nowrap"}}>POLYNOUS</h1><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.2em",opacity:0.7,whiteSpace:"nowrap"}}>Cerebral Vitality Engine</p></div>
        <button onClick={()=>setCollapsed(true)} style={{background:"none",border:"none",color:C.textSecondary,cursor:"pointer",padding:4,flexShrink:0,marginLeft:8}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=C.textSecondary}><Icon name="chevron_left" style={{fontSize:20}}/></button>
      </div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:4,overflow:"hidden"}}>
        {NAV.map(({icon,label,path,active})=><div key={label} onClick={()=>handleNav(path)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:9999,cursor:"pointer",color:active?C.gold:C.onSurfaceVariant,background:active?"rgba(255,215,0,0.08)":"transparent",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:active?700:400,transition:"all 0.2s",whiteSpace:"nowrap",overflow:"hidden"}} onMouseEnter={e=>{if(!active){e.target.style.color=C.gold;e.target.style.background="rgba(255,255,255,0.05)"}}} onMouseLeave={e=>{if(!active){e.target.style.color=C.onSurfaceVariant;e.target.style.background="transparent"}}}><Icon name={icon} style={{fontSize:20,color:"inherit",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span></div>)}
      </nav>
      <div style={{borderTop:"1px solid "+C.white5,paddingTop:24,marginTop:24}}>
        <button onClick={()=>handleNav('/research')} style={{width:"100%",padding:"12px",background:C.gold,color:C.void,fontWeight:700,borderRadius:9999,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.transform="scale(1.03)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}><Icon name="add" style={{fontSize:18,color:C.void,flexShrink:0}}/>New Research</button>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:C.surfaceContainer,border:"1px solid rgba(255,215,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="face" style={{color:C.gold,fontSize:22}}/></div><div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.username||'Guest'}</p><button onClick={handleLogout} style={{fontSize:10,color:C.crimson,background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",padding:0}}>Disconnect</button></div></div>
      </div>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PdfLabPage({ user, onNavigate, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // ← NEW STATE
  const [message, setMessage] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [pdfQuery, setPdfQuery] = useState("");
  const [pdfAnswer, setPdfAnswer] = useState("");
  const [pdfAnswerSources, setPdfAnswerSources] = useState([]);
  const [pdfAnswerConfidence, setPdfAnswerConfidence] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadPdfs(); }, []);

  const loadPdfs = async () => {
    try {
      const res = await fetch("http://localhost:8000/pdfs/list");
      if (res.ok) { const data = await res.json(); setPdfs(data.pdfs || []); }
    } catch(e) {}
  };

  // ========== ENHANCED UPLOAD HANDLER WITH PROGRESS TRACKING ==========
  const handleUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setMessage("Extracting text...");
    setUploadProgress(0);
    
    // Start progress polling
    const progressInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/pdfs/progress?filename=${encodeURIComponent(file.name)}`);
        if (res.ok) {
          const data = await res.json();
          const avgProgress = Math.max(data.extraction || 0, data.embedding || 0, data.storing || 0);
          setUploadProgress(avgProgress);
          
          if (data.status === 'extracting') setMessage("Extracting text from PDF...");
          else if (data.status === 'chunking') setMessage("Chunking document...");
          else if (data.status === 'embedding') setMessage("Creating vector embeddings...");
          else if (data.status === 'complete') {
            setMessage("Processing complete!");
            setUploadProgress(100);
            clearInterval(progressInterval);
          }
        }
      } catch(e) {}
    }, 500);

    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://localhost:8000/pdfs/upload", { method: "POST", body: formData });
      const data = await res.json();
      clearInterval(progressInterval);
      setUploadProgress(100);
      setMessage(data.message || `✅ Indexed ${data.total_chunks || "?"} chunks!`);
      loadPdfs();
    } catch(err) {
      clearInterval(progressInterval);
      setMessage("❌ Upload failed!");
    }
    finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.pdf')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileRef.current) { fileRef.current.files = dt.files; handleUpload({ target: { files: dt.files } }); }
    }
  };

  const askPdf = async () => {
    if (!pdfQuery.trim()) return;
    setPdfLoading(true);
    const userQ = { role: "user", content: pdfQuery };
    setConversation(prev => [...prev, userQ]);
    try {
      const pdfParam = selectedPdf ? `&pdf_name=${encodeURIComponent(selectedPdf)}` : "";
      const res = await fetch(`http://localhost:8000/pdfs/ask?query=${encodeURIComponent(pdfQuery)}${pdfParam}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPdfAnswer(data.answer || "No answer found");
        setPdfAnswerSources(data.sources || []);
        setPdfAnswerConfidence(data.confidence || 0);
        setConversation(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources, confidence: data.confidence }]);
      }
    } catch(err) { setPdfAnswer("Error querying PDF"); }
    finally { setPdfLoading(false); setPdfQuery(""); }
  };

  const getConfColor = (v) => { if (v >= 80) return C.green; if (v >= 60) return "#ffaa00"; return C.crimson; };

  return (
    <div style={{ minHeight: "100vh", background: C.void, position: "relative", overflow: "auto" }}>
      <Styles />
      <NeuralCanvas />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main style={{ marginLeft: sidebarCollapsed ? 56 : 320, padding: "24px 32px", position: "relative", zIndex: 10, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", width: sidebarCollapsed ? "calc(100% - 56px)" : "calc(100% - 320px)", maxWidth: "none", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, color: C.gold, margin: "0 0 4px", letterSpacing: "-0.02em" }}>📄 PDF Neural Lab</h1>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "3px" }}>Upload, Embed & Query Your Documents</p>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              background: dragging ? "rgba(255,215,0,0.08)" : "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)",
              border: `2px dashed ${dragging ? C.gold : "rgba(255,215,0,0.3)"}`, borderRadius: 18,
              padding: 48, textAlign: "center", cursor: "pointer", marginBottom: 24,
              animation: dragging ? "none" : "borderPulse 2s infinite ease-in-out",
              transition: "all 0.3s"
            }}
          >
            <input type="file" accept=".pdf" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} />
            <div className="animate-bounce" style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="upload_file" style={{ fontSize: 40, color: C.gold }} />
            </div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: C.gold, marginBottom: 8 }}>
              {uploading ? "Processing Document..." : "Drop PDF Here or Click to Browse"}
            </h3>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: C.textSecondary }}>Upload research papers, reports, or any PDF document</p>
            
            {/* ENHANCED PROGRESS BAR */}
            {uploading && (
              <div style={{ marginTop: 16, width: '100%', maxWidth: 400, margin: '16px auto 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>
                  <span>{message}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${uploadProgress}%`, height: '100%', 
                    background: `linear-gradient(90deg, ${C.gold}, ${C.green})`,
                    borderRadius: 3, transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textSecondary }}>
                  <span style={{ color: uploadProgress >= 20 ? C.green : C.textSecondary }}>📖 Extract</span>
                  <span style={{ color: uploadProgress >= 60 ? C.green : C.textSecondary }}>✂️ Chunk</span>
                  <span style={{ color: uploadProgress >= 80 ? C.green : C.textSecondary }}>🧠 Embed</span>
                  <span style={{ color: uploadProgress >= 100 ? C.green : C.textSecondary }}>✅ Done</span>
                </div>
              </div>
            )}
            
            {!uploading && message && (
              <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(255,215,0,0.1)", color: C.gold, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, display: "inline-block" }}>
                {message}
              </div>
            )}
          </div>

          {/* PDF Library */}
          {pdfs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 14 }}>📚 Your Knowledge Library</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {pdfs.map((pdf, i) => (
                  <div key={i} onClick={() => setSelectedPdf(selectedPdf === pdf.pdf_name ? null : pdf.pdf_name)}
                    style={{
                      background: selectedPdf === pdf.pdf_name ? "rgba(255,215,0,0.08)" : "rgba(10,10,30,0.6)",
                      backdropFilter: "blur(20px)", border: selectedPdf === pdf.pdf_name ? "1px solid rgba(255,215,0,0.4)" : "1px solid " + C.white10,
                      borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.2s"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Icon name="picture_as_pdf" style={{ color: C.gold, fontSize: 24 }} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green, background: "rgba(0,255,15,0.1)", padding: "2px 8px", borderRadius: 10 }}>Ready</span>
                    </div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{pdf.pdf_name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textSecondary }}>{pdf.total_chunks || "?"} chunks</div>
                  </div>
                ))}
              </div>
              {selectedPdf && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.gold, marginTop: 8 }}>📌 Selected: {selectedPdf} — Questions will search this PDF</div>}
            </div>
          )}

          {/* Q&A Section */}
          <div style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 16 }}>🔍 Ask Your PDFs</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input type="text" value={pdfQuery} onChange={e => setPdfQuery(e.target.value)} placeholder="Ask a question about your documents..." onKeyDown={e => e.key === "Enter" && askPdf()}
                style={{ flex: 1, padding: "14px 20px", borderRadius: 30, border: "1px solid rgba(255,215,0,0.2)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, outline: "none" }} />
              <button onClick={askPdf} disabled={pdfLoading || !pdfQuery.trim()}
                style={{ padding: "14px 28px", borderRadius: 30, border: "none", background: pdfLoading ? "#333" : `linear-gradient(135deg, ${C.gold}, #ca8a04)`, color: C.void, fontWeight: 700, cursor: pdfLoading ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif", fontSize: 14, transition: "all 0.2s" }}>
                {pdfLoading ? "..." : "Ask →"}
              </button>
            </div>

            {/* Answer */}
            {pdfAnswer && (
              <div style={{ background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 14, padding: 20, animation: "fadeSlideUp 0.4s ease" }}>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: "#c8d6e5", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 16 }}>{pdfAnswer}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>Relevance:</span>
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{ width: `${pdfAnswerConfidence}%`, height: "100%", background: getConfColor(pdfAnswerConfidence), borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: getConfColor(pdfAnswerConfidence), fontWeight: 700 }}>{pdfAnswerConfidence}%</span>
                  </div>
                  {pdfAnswerSources.length > 0 && (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textSecondary }}>
                      📄 Sources: {pdfAnswerSources.map(s => `Chunk ${s.chunk_id} (${s.relevance}%)`).join(", ")}
                    </span>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(pdfAnswer)} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 15, border: "1px solid " + C.white10, background: "transparent", color: C.textSecondary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>📋 Copy</button>
                </div>
              </div>
            )}
          </div>

          {/* Conversation History */}
          {conversation.length > 0 && (
            <div style={{ paddingBottom: 60 }}>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 14 }}>💬 Conversation History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {conversation.map((msg, i) => (
                  <div key={i} style={{ background: msg.role === "user" ? "rgba(0,255,15,0.04)" : "rgba(255,215,0,0.04)", border: `1px solid ${msg.role === "user" ? "rgba(0,255,15,0.15)" : "rgba(255,215,0,0.15)"}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: msg.role === "user" ? C.green : C.gold, marginBottom: 4, textTransform: "uppercase" }}>{msg.role === "user" ? "👤 You" : "🧠 POLYNOUS"}</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "#c8d6e5", lineHeight: 1.6 }}>{msg.content?.substring(0, 200)}{msg.content?.length > 200 ? "..." : ""}</div>
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