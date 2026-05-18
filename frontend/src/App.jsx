import { useState, useRef, useEffect } from 'react'

function NeuralBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -1000, y: -1000 })
  const nodes = useRef([])
  const frame = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const N = 80
    const arr = []
    for (let i = 0; i < N; i++) {
      arr.push({ baseX: Math.random() * canvas.width, baseY: Math.random() * canvas.height, x: 0, y: 0, vx: 0, vy: 0, r: Math.random() * 2 + 2 })
      arr[i].x = arr[i].baseX
      arr[i].y = arr[i].baseY
    }
    nodes.current = arr
    const onMouseMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouseMove)
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouse.current.x
      const my = mouse.current.y
      for (const n of arr) {
        n.vx += (n.baseX - n.x) * 0.001
        n.vy += (n.baseY - n.y) * 0.001
        const dx = n.x - mx
        const dy = n.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const f = (150 - dist) / 150 * 2
          n.vx += (dx / dist) * f
          n.vy += (dy / dist) * f
        }
        n.vx += (Math.random() - 0.5) * 0.05
        n.vy += (Math.random() - 0.5) * 0.05
        n.vx *= 0.95
        n.vy *= 0.95
        n.x += n.vx
        n.y += n.vy
        n.x = Math.max(0, Math.min(canvas.width, n.x))
        n.y = Math.max(0, Math.min(canvas.height, n.y))
      }
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const dx = arr[i].x - arr[j].x
          const dy = arr[i].y - arr[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.strokeStyle = 'rgba(0,255,15,' + ((1 - d / 120) * 0.6) + ')'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(arr[i].x, arr[i].y)
            ctx.lineTo(arr[j].x, arr[j].y)
            ctx.stroke()
          }
        }
      }
      for (const n of arr) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3)
        g.addColorStop(0, 'rgba(0,255,15,0.8)')
        g.addColorStop(0.5, 'rgba(0,255,15,0.2)')
        g.addColorStop(1, 'rgba(0,255,15,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#00ff0f'
        ctx.shadowColor = '#00ff0f'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      frame.current = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
      background: 'radial-gradient(ellipse at center, #0a0a2e 0%, #0a0a1a 100%)'
    }} />
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [debateMode, setDebateMode] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, debate_mode: debateMode })
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.answer || 'No answer',
        sources: data.sources || [],
        confidence: data.confidence || 0,
        debate_verdict: data.debate_verdict || null
      }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Is backend running?', isError: true }])
    } finally {
      setLoading(false)
    }
  }

  const confColor = (v) => {
    if (v >= 80) return { bg: 'rgba(0,255,15,0.08)', border: 'rgba(0,255,15,0.4)', text: '#00ff0f' }
    if (v >= 60) return { bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.4)', text: '#ffaa00' }
    return { bg: 'rgba(255,50,50,0.08)', border: 'rgba(255,50,50,0.4)', text: '#ff3232' }
  }

  const s = {
    hero: { textAlign: 'center', padding: '50px 20px 30px' },
    heroLabel: { fontSize: '11px', color: '#555', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '14px' },
    heroTitle: { fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' },
    heroGrad: { background: 'linear-gradient(135deg,#00ff0f,#00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    heroSub: { color: '#8899aa', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6, fontSize: '15px' },
    btnGreen: { padding: '13px 30px', borderRadius: '30px', border: 'none', background: '#00ff0f', color: '#0a0a1a', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    btnOutline: { padding: '13px 30px', borderRadius: '30px', border: '1px solid #00ff0f', background: 'transparent', color: '#00ff0f', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
    codeBlock: { padding: '10px 22px', borderRadius: '10px', background: '#0f0f1a', border: '1px solid #1e1e2a', fontSize: '13px', color: '#00ff0f', fontFamily: 'monospace' },
    statusBar: { display: 'flex', justifyContent: 'center', gap: '14px', padding: '8px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#555', flexWrap: 'wrap' },
    toggleRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' },
    chatBox: { background: 'rgba(255,255,255,0.015)', borderRadius: '20px', padding: '24px', minHeight: '420px', maxHeight: '520px', overflowY: 'auto', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' },
    input: { flex: 1, padding: '15px 22px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', color: '#fff', fontSize: '14px', outline: 'none' }
  }

  return (
    <>
      <NeuralBackground />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 20px 40px', position: 'relative', zIndex: 1, fontFamily: 'Inter, Segoe UI, system-ui, sans-serif' }}>

        <div style={s.hero}>
          <div style={s.heroLabel}>Multi-Agent Research OS</div>
          <h1 style={s.heroTitle}>The First AI Research.<br /><span style={s.heroGrad}>That Uses 7 Minds</span></h1>
          <p style={s.heroSub}>7-agent cognitive architecture. Real-time web search. Self-critiquing memory that cross-references, debates, and reasons like a research team.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button onClick={() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })} style={s.btnGreen}>Get Started</button>
            <button style={s.btnOutline}>View on GitHub</button>
          </div>
          <code style={s.codeBlock}><span style={{ color: '#555' }}>$ </span>npm run polynous</code>
        </div>

        <div style={s.statusBar}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff0f', boxShadow: '0 0 6px #00ff0f', display: 'inline-block', marginTop: '2px' }} /> 7 Agents Online | Search | Summarise | Critique | Write | Debate
        </div>

        <div style={s.toggleRow}>
          <button onClick={() => setDebateMode(false)} style={{ padding: '11px 26px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: !debateMode ? 'rgba(0,255,15,0.12)' : 'rgba(255,255,255,0.04)', border: !debateMode ? '1px solid rgba(0,255,15,0.4)' : '1px solid rgba(255,255,255,0.08)', color: !debateMode ? '#00ff0f' : '#777' }}>Research Mode</button>
          <button onClick={() => setDebateMode(true)} style={{ padding: '11px 26px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: debateMode ? 'rgba(255,50,100,0.12)' : 'rgba(255,255,255,0.04)', border: debateMode ? '1px solid rgba(255,50,100,0.4)' : '1px solid rgba(255,255,255,0.08)', color: debateMode ? '#ff3264' : '#777' }}>Debate Mode</button>
        </div>

        <div id="chat" style={s.chatBox}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧠</div>
              <h2 style={{ color: '#fff', fontSize: '1.6em', margin: '0 0 8px' }}>POLYNOUS</h2>
              <p style={{ color: '#777', marginBottom: '24px' }}>Select a mode and ask any research question.</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['What is AI?', 'Is nuclear energy safe?', 'Should we colonize Mars?', 'How does CRISPR work?'].map((q) => (
                  <button key={q} onClick={() => setInput(q)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#999', cursor: 'pointer', fontSize: '12px' }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
              <div style={{
                maxWidth: '85%', padding: '18px 22px', borderRadius: '18px',
                background: msg.role === 'user' ? 'rgba(0,255,15,0.08)' : msg.isError ? 'rgba(255,50,50,0.1)' : 'rgba(255,255,255,0.025)',
                border: '1px solid ' + (msg.role === 'user' ? 'rgba(0,255,15,0.25)' : msg.isError ? 'rgba(255,50,50,0.4)' : 'rgba(255,255,255,0.06)'),
                backdropFilter: 'blur(10px)', color: '#e0e0e0',
                borderBottomRightRadius: msg.role === 'user' ? '6px' : '18px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '6px' : '18px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {msg.role === 'user' ? 'You' : 'POLYNOUS'}
                </div>
                <div style={{ lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                {msg.confidence > 0 && (() => {
                  const c = confColor(msg.confidence)
                  return (
                    <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: c.bg, border: '1px solid ' + c.border, color: c.text, fontSize: '13px', fontWeight: 600 }}>
                      Confidence: {msg.confidence}%
                      <div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: msg.confidence + '%', height: '100%', borderRadius: '2px', background: c.border }} />
                      </div>
                    </div>
                  )
                })()}

                {msg.debate_verdict && msg.debate_verdict.winner && (
                  <div style={{ marginTop: '14px', padding: '16px', borderRadius: '14px', background: 'rgba(255,50,100,0.06)', border: '1px solid rgba(255,50,100,0.25)' }}>
                    <div style={{ fontWeight: 700, color: '#ff3264', fontSize: '12px', marginBottom: '8px' }}>DEBATE VERDICT</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: msg.debate_verdict.winner === 'FOR' ? '#00ff0f' : '#ff3264', marginBottom: '10px' }}>Winner: {msg.debate_verdict.winner}</div>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#ccc' }}>
                      <span>FOR: {msg.debate_verdict.for_score}/10</span>
                      <span>AGAINST: {msg.debate_verdict.against_score}/10</span>
                    </div>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', opacity: 0.5 }}>SOURCES</div>
                    {msg.sources.map((src, j) => (
                      <div key={j} style={{ margin: '5px 0', opacity: 0.45, lineHeight: 1.4 }}>[{j + 1}] {typeof src === 'string' ? src : src.title || 'Source'}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ color: '#00ff0f', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Researching...</div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff0f', animation: 'pulse 1.4s infinite ' + (i * 0.2) + 's' }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} style={{ display: 'flex', gap: '12px' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={debateMode ? 'Enter proposition...' : 'Ask any research question...'} style={s.input} disabled={loading} />
          <button type="submit" disabled={loading} style={{ width: '52px', height: '52px', borderRadius: '50%', border: 'none', background: loading ? '#222' : debateMode ? '#ff3264' : '#00ff0f', color: loading ? '#555' : '#0a0a1a', fontSize: '20px', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '..' : '>'}
          </button>
        </form>

        <div style={{ textAlign: 'center', color: '#333', fontSize: '10px', marginTop: '24px' }}>
          POLYNOUS v3.0 | 7 AI Agents | Claude + Tavily + LangGraph
        </div>
      </div>
    </>
  )
}