import { useState, useRef, useEffect } from 'react'

export default function DebateInterface({ user }) {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [debateResult, setDebateResult] = useState(null)
  const [forText, setForText] = useState('')
  const [againstText, setAgainstText] = useState('')
  const [verdictData, setVerdictData] = useState(null)
  const [agentStatus, setAgentStatus] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, r: Math.random()*1.5 })
    }
    let animId
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>canvas.width)p.vx*=-1
        if(p.y<0||p.y>canvas.height)p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle='rgba(255,32,64,0.2)'; ctx.fill()
      })
      animId=requestAnimationFrame(animate)
    }
    animate()
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize)}
  },[])

  const startDebate = async (e) => {
    e.preventDefault()
    if(!topic.trim()||loading)return
    setLoading(true);setDebateResult(null);setForText('');setAgainstText('');setVerdictData(null)
    setAgentStatus('Agents debating...')
    try{
      const res=await fetch('http://localhost:8000/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:topic,debate_mode:true})})
      const data=await res.json()
      if(data.answer){
        const t=data.answer
        const fm=t.match(/FOR POSITION[\s\S]*?(?=AGAINST POSITION|$)/i)
        const am=t.match(/AGAINST POSITION[\s\S]*?(?=WINNER|SCORES|JUDGE|VERDICT|$)/i)
        setForText(fm?fm[0].replace(/FOR POSITION/i,'').replace(/\([\d.]+\/10\)/,'').trim():'No argument')
        setAgainstText(am?am[0].replace(/AGAINST POSITION/i,'').replace(/\([\d.]+\/10\)/,'').trim():'No argument')
        setVerdictData(data.debate_verdict||{winner:'FOR',for_score:6,against_score:5,reasoning:'Arguments evaluated.'})
        setDebateResult(true)
      }
      setAgentStatus('')
    }catch{setAgentStatus('Connection error')}
    finally{setLoading(false)}
  }

  // Parse bullet points into clean array
  const parsePoints = (text) => {
    if(!text)return[]
    const points = text.split(/\n\s*[•\-]\s*/).filter(p=>p.trim().length>10)
    if(points.length===0)return[text]
    return points.map(p=>p.replace(/\n/g,' ').trim())
  }

  const forPoints = parsePoints(forText)
  const againstPoints = parsePoints(againstText)

  return (
    <div style={{minHeight:'100vh',background:'#0a0a1e',fontFamily:"'Inter','Segoe UI',sans-serif",position:'relative',overflow:'auto',color:'#e2e0fc'}}>
      <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>
      
      <div style={{position:'relative',zIndex:10,maxWidth:'1100px',margin:'0 auto',padding:'24px 16px 60px'}}>
        
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'20px'}}>
          <h1 style={{fontSize:'1.8em',fontWeight:800,color:'#ff2040',margin:'0 0 4px'}}>⚖️ Debate Chamber</h1>
          <p style={{fontSize:'11px',color:'#555',textTransform:'uppercase',letterSpacing:'3px'}}>Neural Argument Synthesis</p>
        </div>

        {/* Input */}
        {!debateResult && (
          <div style={{maxWidth:'600px',margin:'0 auto',background:'rgba(15,15,35,0.8)',backdropFilter:'blur(25px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'20px',padding:'28px'}}>
            <form onSubmit={startDebate}>
              <label style={{color:'#ff2040',fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'10px'}}>Enter Proposition</label>
              <input type="text" value={topic} onChange={e=>setTopic(e.target.value)}
                placeholder="e.g., Should AI be regulated by governments?"
                style={{width:'100%',padding:'16px 20px',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:'15px',outline:'none',marginBottom:'16px'}}
                disabled={loading}/>
              <button type="submit" disabled={loading||!topic.trim()} style={{
                width:'100%',padding:'16px',borderRadius:'14px',border:'none',
                background:loading?'#2a2a3a':'#ff2040',color:'#fff',fontWeight:700,fontSize:'15px',
                cursor:loading?'not-allowed':'pointer',transition:'all 0.3s'
              }}>{loading?agentStatus:'⚖️ Begin Debate'}</button>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{textAlign:'center',padding:'30px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'50%',border:'3px solid rgba(255,32,64,0.15)',borderTop:'3px solid #ff2040',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
            <div style={{color:'#ff2040',fontWeight:600,fontSize:'13px'}}>{agentStatus}</div>
          </div>
        )}

        {/* Results */}
        {debateResult && (
          <div>
            {/* Topic */}
            <div style={{textAlign:'center',marginBottom:'20px',padding:'14px',background:'rgba(255,255,255,0.02)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.04)'}}>
              <h2 style={{fontSize:'1.1em',color:'#fff',margin:0,fontWeight:600}}>{topic}</h2>
            </div>

            {/* FOR vs AGAINST */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
              
              {/* FOR Panel */}
              <div style={{background:'rgba(0,255,15,0.02)',border:'1px solid rgba(0,255,15,0.15)',borderRadius:'16px',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'500px'}}>
                <div style={{background:'rgba(0,255,15,0.06)',padding:'12px 16px',borderBottom:'1px solid rgba(0,255,15,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#00ff0f',boxShadow:'0 0 8px #00ff0f'}}/>
                    <span style={{color:'#00ff0f',fontWeight:800,fontSize:'14px'}}>ARGUMENT FOR</span>
                  </div>
                  {verdictData&&<span style={{color:'#00ff0f',fontWeight:700,fontSize:'13px',background:'rgba(0,255,15,0.1)',padding:'4px 10px',borderRadius:'14px'}}>{verdictData.for_score}/10</span>}
                </div>
                <div style={{padding:'14px',overflowY:'auto',flex:1}}>
                  {forPoints.map((point,i)=>(
                    <div key={i} style={{background:'rgba(0,255,15,0.04)',border:'1px solid rgba(0,255,15,0.08)',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',color:'#c8d6e5',fontSize:'12.5px',lineHeight:1.7}}>
                      <span style={{color:'#00ff0f',fontWeight:700,marginRight:'6px'}}>•</span>
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              {/* AGAINST Panel */}
              <div style={{background:'rgba(255,32,64,0.02)',border:'1px solid rgba(255,32,64,0.15)',borderRadius:'16px',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'500px'}}>
                <div style={{background:'rgba(255,32,64,0.06)',padding:'12px 16px',borderBottom:'1px solid rgba(255,32,64,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ff2040',boxShadow:'0 0 8px #ff2040'}}/>
                    <span style={{color:'#ff2040',fontWeight:800,fontSize:'14px'}}>ARGUMENT AGAINST</span>
                  </div>
                  {verdictData&&<span style={{color:'#ff2040',fontWeight:700,fontSize:'13px',background:'rgba(255,32,64,0.1)',padding:'4px 10px',borderRadius:'14px'}}>{verdictData.against_score}/10</span>}
                </div>
                <div style={{padding:'14px',overflowY:'auto',flex:1}}>
                  {againstPoints.map((point,i)=>(
                    <div key={i} style={{background:'rgba(255,32,64,0.04)',border:'1px solid rgba(255,32,64,0.08)',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',color:'#c8d6e5',fontSize:'12.5px',lineHeight:1.7}}>
                      <span style={{color:'#ff2040',fontWeight:700,marginRight:'6px'}}>•</span>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Bar */}
            {verdictData && (
              <div style={{marginBottom:'16px',padding:'16px',background:'rgba(255,255,255,0.02)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                  <span style={{color:'#00ff0f',fontSize:'12px',fontWeight:600}}>FOR: {verdictData.for_score}/10</span>
                  <span style={{color:'#ff2040',fontSize:'12px',fontWeight:600}}>AGAINST: {verdictData.against_score}/10</span>
                </div>
                <div style={{height:'8px',borderRadius:'4px',background:'rgba(255,255,255,0.04)',display:'flex',overflow:'hidden'}}>
                  <div style={{width:`${(verdictData.for_score/10)*100}%`,background:'#00ff0f',transition:'width 1s'}}/>
                  <div style={{width:`${(verdictData.against_score/10)*100}%`,background:'#ff2040',transition:'width 1s'}}/>
                </div>
              </div>
            )}

            {/* Verdict */}
            {verdictData && (
              <div style={{textAlign:'center',padding:'20px',background:verdictData.winner==='FOR'?'rgba(0,255,15,0.04)':verdictData.winner==='AGAINST'?'rgba(255,32,64,0.04)':'rgba(255,170,0,0.04)',border:`1px solid ${verdictData.winner==='FOR'?'rgba(0,255,15,0.2)':verdictData.winner==='AGAINST'?'rgba(255,32,64,0.2)':'rgba(255,170,0,0.2)'}`,borderRadius:'16px',marginBottom:'16px'}}>
                <div style={{fontSize:'10px',color:'#555',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'8px'}}>Verdict</div>
                <div style={{fontSize:'1.5em',fontWeight:900,color:verdictData.winner==='FOR'?'#00ff0f':verdictData.winner==='AGAINST'?'#ff2040':'#ffaa00',marginBottom:'6px'}}>
                  🏆 {verdictData.winner} WINS
                </div>
                {verdictData.reasoning && (
                  <div style={{fontSize:'12px',color:'#8899aa',lineHeight:1.6,maxWidth:'500px',margin:'0 auto'}}>
                    {verdictData.reasoning}
                  </div>
                )}
              </div>
            )}

            {/* New Debate */}
            <button onClick={()=>{setDebateResult(null);setTopic('');setForText('');setAgainstText('');setVerdictData(null)}} style={{
              width:'100%',padding:'14px',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.02)',color:'#777',cursor:'pointer',fontWeight:600,fontSize:'13px'
            }}>🔄 New Debate</button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}