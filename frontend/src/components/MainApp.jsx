import NeuralSidebar from './NeuralSidebar'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ========== NEURAL BACKGROUND ==========
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
      arr[i].x = arr[i].baseX; arr[i].y = arr[i].baseY
    }
    nodes.current = arr
    const onMouseMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouseMove)
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouse.current.x, my = mouse.current.y
      for (const n of arr) {
        n.vx += (n.baseX - n.x) * 0.001; n.vy += (n.baseY - n.y) * 0.001
        const dx = n.x - mx, dy = n.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) { const f = (150 - dist) / 150 * 2; n.vx += (dx / dist) * f; n.vy += (dy / dist) * f }
        n.vx += (Math.random() - 0.5) * 0.05; n.vy += (Math.random() - 0.5) * 0.05
        n.vx *= 0.95; n.vy *= 0.95; n.x += n.vx; n.y += n.vy
        n.x = Math.max(0, Math.min(canvas.width, n.x)); n.y = Math.max(0, Math.min(canvas.height, n.y))
      }
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const dx = arr[i].x - arr[j].x, dy = arr[i].y - arr[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.strokeStyle = 'rgba(0,255,15,' + ((1 - d / 120) * 0.6) + ')'
            ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(arr[i].x, arr[i].y); ctx.lineTo(arr[j].x, arr[j].y); ctx.stroke()
          }
        }
      }
      for (const n of arr) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3)
        g.addColorStop(0, 'rgba(0,255,15,0.8)'); g.addColorStop(0.5, 'rgba(0,255,15,0.2)'); g.addColorStop(1, 'rgba(0,255,15,0)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#00ff0f'; ctx.shadowColor = '#00ff0f'; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
      }
      frame.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(frame.current); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMouseMove) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'radial-gradient(ellipse at center, #0a0a2e 0%, #0a0a1a 100%)' }} />
}

// ========== MAIN APP ==========
export default function MainApp({ user, onLogout, onNavigate, currentPage }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [debateMode, setDebateMode] = useState(false)
  const [agentStatus, setAgentStatus] = useState('')
  const [agentProgress, setAgentProgress] = useState([])
  const [streamingContent, setStreamingContent] = useState('')
  const [copied, setCopied] = useState(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle query params from Memory Bank or other pages
  useEffect(() => {
    const query = searchParams.get('query')
    const mode = searchParams.get('mode')
    if (query) {
      setInput(query)
    }
    if (mode === 'debate') {
      setDebateMode(true)
    }
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleLogout = () => {
    if (onLogout) onLogout()
    navigate('/')
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setStreamingContent('')
    setAgentProgress([])
    setAgentStatus('Initializing...')
    const userEmail = user?.email || localStorage.getItem('polynous_user') ? JSON.parse(localStorage.getItem('polynous_user') || '{}').email : 'guest_user';

try {
  const response = await fetch('http://localhost:8000/ask-stream', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query: userMsg.content, 
      debate_mode: debateMode,
      session_id: userEmail  // ← Send user's email as session_id
    })
  })
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const assistantMsg = { role: 'assistant', content: '', sources: [], confidence: 0, debate_verdict: null }
      setMessages((prev) => [...prev, assistantMsg])
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
              if (data.type === 'start') setAgentStatus('Starting ' + (data.mode || 'research') + ' mode...')
              else if (data.type === 'progress') { setAgentStatus(data.message || 'Working...'); setAgentProgress((prev) => [...prev, { agent: data.agent, message: data.message, time: new Date().toLocaleTimeString() }]) }
              else if (data.type === 'token') { fullContent += (data.content || ''); setStreamingContent(fullContent) }
              else if (data.type === 'citations') assistantMsg.sources = data.citations || []
              else if (data.type === 'confidence') assistantMsg.confidence = data.score || 0
              else if (data.type === 'verdict') assistantMsg.debate_verdict = data.verdict
              else if (data.type === 'end') setAgentStatus('')
              else if (data.type === 'error') { assistantMsg.content = 'Error: ' + data.message; assistantMsg.isError = true; setAgentStatus('') }
            } catch (e) {}
          }
        }
        setMessages((prev) => {
          const updated = [...prev]; const last = { ...updated[updated.length - 1] }
          last.content = fullContent; last.sources = assistantMsg.sources
          last.confidence = assistantMsg.confidence; last.debate_verdict = assistantMsg.debate_verdict
          updated[updated.length - 1] = last; return updated
        })
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Is backend running on port 8000?', isError: true }])
    } finally { setLoading(false); setAgentStatus(''); setStreamingContent('') }
  }

  const confColor = (v) => {
    if (v >= 80) return { bg: 'rgba(0,255,15,0.08)', border: 'rgba(0,255,15,0.4)', text: '#00ff0f' }
    if (v >= 60) return { bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.4)', text: '#ffaa00' }
    return { bg: 'rgba(255,50,50,0.08)', border: 'rgba(255,50,50,0.4)', text: '#ff3232' }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <NeuralSidebar 
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage || 'dashboard'}
        onNavigate={(path) => {
          if (path === '/dashboard?mode=debate') {
            setDebateMode(true)
          }
          if (onNavigate) onNavigate(path)
          else window.location.href = path
        }}
      />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <NeuralBackground />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 20px 40px', position: 'relative', zIndex: 1, fontFamily: 'Inter, Segoe UI, system-ui, sans-serif' }}>
          
          {/* USER BAR - REMOVED since sidebar handles user info now */}
          {/* <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginBottom: '8px', padding: '0 10px' }}>
            <span style={{ color: '#888', fontSize: '12px' }}>👤 {user?.username || 'Guest'}</span>
            <button onClick={handleLogout} style={{ padding: '4px 12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '11px' }}>Logout</button>
          </div> */}

          {/* HERO */}
          <div style={{ textAlign: 'center', padding: '30px 20px 20px' }}>
            <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 12px' }}>
              The First AI Research.<br />
              <span style={{ background: 'linear-gradient(135deg,#00ff0f,#00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>That Uses 7 Minds</span>
            </h1>
          </div>

          {/* MODE TOGGLE */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
            <button onClick={() => setDebateMode(false)} style={{ padding: '11px 26px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: !debateMode ? 'rgba(0,255,15,0.12)' : 'rgba(255,255,255,0.04)', border: !debateMode ? '1px solid rgba(0,255,15,0.4)' : '1px solid rgba(255,255,255,0.08)', color: !debateMode ? '#00ff0f' : '#777' }}>Research Mode</button>
            <button onClick={() => setDebateMode(true)} style={{ padding: '11px 26px', borderRadius: '30px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: debateMode ? 'rgba(255,50,100,0.12)' : 'rgba(255,255,255,0.04)', border: debateMode ? '1px solid rgba(255,50,100,0.4)' : '1px solid rgba(255,255,255,0.08)', color: debateMode ? '#ff3264' : '#777' }}>Debate Mode</button>
          </div>

          {/* AGENT PROGRESS */}
          {loading && agentProgress.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '14px 20px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, marginBottom: '10px', letterSpacing: '1px' }}>AGENTS WORKING</div>
              {agentProgress.map((step, i) => (<div key={i} style={{ color: '#00ff0f', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}><span>✓</span> {step.message}</div>))}
              <div style={{ color: '#f093fb', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}><span>   </span> {agentStatus}</div>
            </div>
          )}

          {/* CHAT AREA */}
          <div id="chat" style={{ background: 'rgba(255,255,255,0.015)', borderRadius: '20px', padding: '24px', minHeight: '420px', maxHeight: '520px', overflowY: 'auto', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>.</div>
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
                <div style={{ maxWidth: '85%', padding: '18px 22px', borderRadius: '18px', background: msg.role === 'user' ? 'rgba(0,255,15,0.08)' : msg.isError ? 'rgba(255,50,50,0.1)' : 'rgba(255,255,255,0.025)', border: '1px solid ' + (msg.role === 'user' ? 'rgba(0,255,15,0.25)' : msg.isError ? 'rgba(255,50,50,0.4)' : 'rgba(255,255,255,0.06)'), backdropFilter: 'blur(10px)', color: '#e0e0e0', borderBottomRightRadius: msg.role === 'user' ? '6px' : '18px', borderBottomLeftRadius: msg.role === 'assistant' ? '6px' : '18px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{msg.role === 'user' ? 'You' : 'POLYNOUS'}</span>
                    {msg.role === 'assistant' && msg.content && !msg.isError && (<button onClick={() => copyToClipboard(msg.content, i)} style={{ background: 'none', border: 'none', color: copied === i ? '#00ff0f' : '#555', cursor: 'pointer', fontSize: '11px' }}>{copied === i ? 'Copied!' : 'Copy'}</button>)}
                  </div>
                  <div style={{ lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  {msg.confidence > 0 && (() => { const c = confColor(msg.confidence); return (<div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: c.bg, border: '1px solid ' + c.border, color: c.text, fontSize: '13px', fontWeight: 600 }}>Confidence: {msg.confidence}%<div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }}><div style={{ width: msg.confidence + '%', height: '100%', borderRadius: '2px', background: c.border }} /></div></div>)})()}
                  {msg.debate_verdict && msg.debate_verdict.winner && (<div style={{ marginTop: '14px', padding: '16px', borderRadius: '14px', background: 'rgba(255,50,100,0.06)', border: '1px solid rgba(255,50,100,0.25)' }}><div style={{ fontWeight: 700, color: '#ff3264', fontSize: '12px', marginBottom: '8px' }}>DEBATE VERDICT</div><div style={{ fontSize: '20px', fontWeight: 800, color: msg.debate_verdict.winner === 'FOR' ? '#00ff0f' : '#ff3264', marginBottom: '10px' }}>Winner: {msg.debate_verdict.winner}</div><div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#ccc' }}><span>FOR: {msg.debate_verdict.for_score}/10</span><span>AGAINST: {msg.debate_verdict.against_score}/10</span></div></div>)}
                  {msg.sources && msg.sources.length > 0 && (<div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}><div style={{ fontWeight: 600, marginBottom: '8px', opacity: 0.5 }}>SOURCES</div>{msg.sources.map((src, j) => (<div key={j} style={{ margin: '5px 0', opacity: 0.45, lineHeight: 1.4 }}>[{j + 1}] {src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ccff', textDecoration: 'none' }}>{src.title || 'Source'}</a> : (src.title || src)}</div>))}</div>)}
                </div>
              </div>
            ))}
            {loading && (<div style={{ textAlign: 'center', padding: '24px' }}><div style={{ color: '#00ff0f', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>{agentStatus || 'Researching...'}</div><div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>{[0, 1, 2].map((i) => (<div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff0f', animation: 'pulse 1.4s infinite ' + (i * 0.2) + 's' }} />))}</div></div>)}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <form onSubmit={send} style={{ display: 'flex', gap: '12px' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={debateMode ? 'Enter proposition...' : 'Ask any research question...'} style={{ flex: 1, padding: '15px 22px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', color: '#fff', fontSize: '14px', outline: 'none' }} disabled={loading} />
            <button type="submit" disabled={loading} style={{ width: '52px', height: '52px', borderRadius: '50%', border: 'none', background: loading ? '#222' : debateMode ? '#ff3264' : '#00ff0f', color: loading ? '#555' : '#0a0a1a', fontSize: '20px', fontWeight: 700, cursor: 'pointer', boxShadow: loading ? 'none' : '0 0 20px ' + (debateMode ? 'rgba(255,50,100,0.4)' : 'rgba(0,255,15,0.4)') }}>{loading ? '..' : '>'}</button>
          </form>

          <div style={{ textAlign: 'center', color: '#333', fontSize: '10px', marginTop: '24px' }}>
            POLYNOUS v3.0 | 7 AI Agents | Claude + Tavily + LangGraph
          </div>
        </div>
      </div>
    </div>
  )
}