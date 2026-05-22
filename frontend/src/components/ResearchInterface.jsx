import { useState, useRef, useEffect } from 'react'

export default function ResearchInterface({ user, onNavigate }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [agentStatus, setAgentStatus] = useState('')
  const [agentProgress, setAgentProgress] = useState([])
  const [streamingContent, setStreamingContent] = useState('')
  const canvasRef = useRef(null)
  const bottomRef = useRef(null)

  // Neural background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 1.5
      }
      update() {
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 255, 15, 0.3)'
        ctx.fill()
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle())

    let animId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.update(); p.draw()
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,255,15,${1 - dist/100 * 0.8})`
            ctx.lineWidth = 0.2; ctx.stroke()
          }
        }
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const startResearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)
    setStreamingContent('')
    setAgentProgress([])
    setAgentStatus('Synapsing...')

    try {
      const response = await fetch('http://localhost:8000/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, debate_mode: false })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const assistantMsg = { role: 'assistant', content: '', sources: [], confidence: 0 }
      setMessages(prev => [...prev, assistantMsg])
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'start') setAgentStatus('Neural network activated...')
              else if (data.type === 'progress') {
                setAgentStatus(data.message || 'Processing...')
                setAgentProgress(prev => [...prev, { agent: data.agent, message: data.message }])
              }
              else if (data.type === 'token') fullContent += (data.content || '')
              else if (data.type === 'citations') assistantMsg.sources = data.citations || []
              else if (data.type === 'confidence') assistantMsg.confidence = data.score || 0
              else if (data.type === 'end') setAgentStatus('')
              else if (data.type === 'error') {
                assistantMsg.content = 'Error: ' + data.message
                assistantMsg.isError = true
                setAgentStatus('')
              }
            } catch(e) {}
          }
        }
        setMessages(prev => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          last.content = fullContent
          last.sources = assistantMsg.sources
          last.confidence = assistantMsg.confidence
          updated[updated.length - 1] = last
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Neural connection lost. Is backend running?', isError: true }])
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  const confidenceColor = (v) => {
    if (v >= 80) return '#00ff0f'
    if (v >= 60) return '#ffaa00'
    return '#ff2040'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a1e',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: 'relative', overflow: 'hidden', color: '#e2e0fc'
    }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', padding: '30px 20px 10px' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: '#00ff0f', margin: '0 0 4px' }}>
            🔬 POLYNOUS
          </h1>
          <p style={{ fontSize: '12px', color: '#00ccff', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Neural Research Engine
          </p>
        </header>

        {/* Agent Progress */}
        {loading && agentProgress.length > 0 && (
          <div style={{
            maxWidth: '700px', margin: '0 auto 16px', width: '100%',
            background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
            padding: '14px 20px'
          }}>
            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              🧠 Agents Active
            </div>
            {agentProgress.map((step, i) => (
              <div key={i} style={{ color: '#00ff0f', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>✓</span> {step.message}
              </div>
            ))}
            <div style={{ color: '#00ccff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ animation: 'spin 1s infinite' }}>⚡</span> {agentStatus}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div style={{
          flex: 1, maxWidth: '750px', margin: '0 auto', width: '100%',
          background: 'rgba(10,10,30,0.4)', backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
          padding: '24px', minHeight: '400px', maxHeight: '500px',
          overflowY: 'auto', marginBottom: '20px'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧠</div>
              <h2 style={{ color: '#fff', fontSize: '1.4em', margin: '0 0 8px' }}>Begin Research</h2>
              <p style={{ color: '#8899aa', fontSize: '14px', marginBottom: '20px' }}>
                Ask any question. 7 AI agents will research for you.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['What is AI?', 'How does CRISPR work?', 'Is nuclear energy safe?', 'Explain quantum computing'].map(q => (
                  <button key={q} onClick={() => setQuery(q)} style={{
                    padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(0,255,15,0.2)',
                    background: 'rgba(0,255,15,0.04)', color: '#00ff0f', cursor: 'pointer', fontSize: '12px'
                  }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px'
            }}>
              <div style={{
                maxWidth: '85%', padding: '16px 20px', borderRadius: '18px',
                background: msg.role === 'user' ? 'rgba(0,255,15,0.08)' : msg.isError ? 'rgba(255,32,64,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,255,15,0.25)' : msg.isError ? 'rgba(255,32,64,0.3)' : 'rgba(255,255,255,0.06)'}`,
                backdropFilter: 'blur(10px)', color: '#e0e0e0',
                borderBottomRightRadius: msg.role === 'user' ? '6px' : '18px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '6px' : '18px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {msg.role === 'user' ? '👤 You' : '🧠 POLYNOUS'}
                </div>
                <div style={{ lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                
                {msg.confidence > 0 && (
                  <div style={{
                    marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                    background: `${confidenceColor(msg.confidence)}10`,
                    border: `1px solid ${confidenceColor(msg.confidence)}30`,
                    color: confidenceColor(msg.confidence), fontSize: '13px', fontWeight: 600
                  }}>
                    🎯 Confidence: {msg.confidence}%
                    <div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${msg.confidence}%`, height: '100%', borderRadius: '2px', background: confidenceColor(msg.confidence), transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )}

                {msg.sources?.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', opacity: 0.5 }}>📚 SOURCES</div>
                    {msg.sources.map((s, j) => (
                      <div key={j} style={{ margin: '4px 0', opacity: 0.45 }}>
                        [{j+1}] {typeof s === 'string' ? s : s.title || 'Source'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={startResearch} style={{
          maxWidth: '750px', margin: '0 auto', width: '100%', display: 'flex', gap: '12px'
        }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask any research question..."
            style={{
              flex: 1, padding: '16px 22px', borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: '#fff', fontSize: '15px', outline: 'none'
            }}
            disabled={loading}
          />
          <button type="submit" disabled={loading} style={{
            width: '54px', height: '54px', borderRadius: '50%', border: 'none',
            background: loading ? '#333' : '#00ff0f', color: loading ? '#666' : '#0a0a1a',
            fontSize: '20px', fontWeight: 700, cursor: 'pointer',
            boxShadow: loading ? 'none' : '0 0 25px rgba(0,255,15,0.3)',
            transition: 'all 0.3s'
          }}>
            {loading ? '⚡' : '➤'}
          </button>
        </form>

        <footer style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#444' }}>
          🧠 POLYNOUS • 7 Agents • Claude + Tavily + Neo4j
        </footer>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}