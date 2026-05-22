import { useState, useRef, useEffect } from 'react'

export default function KnowledgeGraphPage({ user, onStartResearch }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    synapticDensity: 0,
    researchDominance: 50,
    debateDominance: 50,
    neuralLatency: '0ms'
  })
  const canvasRef = useRef(null)
  const graphCanvasRef = useRef(null)

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

    for (let i = 0; i < 100; i++) particles.push(new Particle())

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
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  // Load graph data
  useEffect(() => {
    loadGraphData()
  }, [])

  const loadGraphData = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/knowledge/graph')
      if (res.ok) {
        const data = await res.json()
        setGraphData(data)
        
        const totalNodes = data.nodes?.length || 0
        const researchNodes = data.nodes?.filter(n => n.type !== 'debate').length || 0
        const debateNodes = totalNodes - researchNodes
        
        setMetrics({
          synapticDensity: Math.min(95, totalNodes * 8),
          researchDominance: totalNodes > 0 ? Math.round((researchNodes / totalNodes) * 100) : 50,
          debateDominance: totalNodes > 0 ? Math.round((debateNodes / totalNodes) * 100) : 50,
          neuralLatency: `${(Math.random() * 0.05).toFixed(2)}ms`
        })
      }
    } catch (err) {
      console.error('Failed to load graph:', err)
      // Sample fallback data
      setGraphData({
        nodes: [
          { id: 'core', label: 'Core Logic', size: 35, type: 'core' },
          { id: 'ai', label: 'AI', size: 28, type: 'major' },
          { id: 'ml', label: 'Machine Learning', size: 24, type: 'major' },
          { id: 'ethics', label: 'AI Ethics', size: 22, type: 'debate' },
          { id: 'quantum', label: 'Quantum', size: 20, type: 'major' },
          { id: 'privacy', label: 'Data Privacy', size: 18, type: 'debate' },
          { id: 'space', label: 'Space Tech', size: 16, type: 'major' }
        ],
        edges: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getNodeColor = (type) => {
    if (type === 'core') return '#a855f7'
    if (type === 'debate') return '#ff2040'
    return '#00ff0f'
  }

  const positionedNodes = graphData.nodes?.map((node, i) => {
    const angle = (i / (graphData.nodes.length || 1)) * Math.PI * 2
    const radius = 180
    return {
      ...node,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius * 0.7,
      color: getNodeColor(node.type),
      size: Math.min(35, Math.max(16, node.size || 22))
    }
  }) || []

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a1e',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: 'relative', overflow: 'hidden', color: '#e2e0fc'
    }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', height: '100vh' }}>
        
        {/* Main Graph Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '1.8em', fontWeight: 800, color: '#00ff0f', margin: '0' }}>🧠 Neural Knowledge Graph</h1>
            <p style={{ fontSize: '11px', color: '#00ccff', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Synaptic Topology</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,255,15,0.2)', borderTop: '3px solid #00ff0f', animation: 'spin 1s infinite', margin: '0 auto 16px' }} />
              <div style={{ color: '#00ff0f' }}>Loading neural topology...</div>
            </div>
          ) : (
            <svg width="800" height="600" viewBox="0 0 800 600" style={{ maxWidth: '100%' }}>
              {/* Center Core */}
              <circle cx="400" cy="300" r="40" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" from="35" to="45" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="300" r="25" fill="#a855f7" opacity="0.8" style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))' }} />
              <text x="400" y="340" fill="#e2e0fc" textAnchor="middle" fontSize="11" fontWeight="600">Core</text>

              {/* Connections from center to all nodes */}
              {positionedNodes.map((node, i) => (
                <line key={`edge-${i}`} x1="400" y1="300" x2={node.x} y2={node.y}
                  stroke={`${node.color}25`} strokeWidth="1" strokeDasharray="6,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
                </line>
              ))}

              {/* Nodes */}
              {positionedNodes.map((node, i) => (
                <g key={i} style={{ cursor: 'pointer' }}
                  onClick={() => onStartResearch?.(node.label)}
                  onMouseEnter={() => setSelectedNode(node)}
                  onMouseLeave={() => setSelectedNode(null)}>
                  <circle cx={node.x} cy={node.y} r={node.size + 8} fill="none" stroke={node.color} strokeWidth="1" opacity="0.2" />
                  <circle cx={node.x} cy={node.y} r={node.size} fill={node.color} opacity="0.85"
                    style={{ filter: `drop-shadow(0 0 12px ${node.color}80)` }} />
                  <text x={node.x} y={node.y + node.size + 14} fill="#e2e0fc" textAnchor="middle" fontSize="10" fontWeight="500">
                    {node.label?.length > 15 ? node.label.substring(0,15)+'..' : node.label}
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* Tooltip */}
          {selectedNode && (
            <div style={{
              position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(20px)',
              border: `1px solid ${selectedNode.color}40`, borderRadius: '14px',
              padding: '14px 20px', zIndex: 50, textAlign: 'center',
              boxShadow: `0 0 20px ${selectedNode.color}20`
            }}>
              <div style={{ color: selectedNode.color, fontWeight: 700, fontSize: '14px' }}>{selectedNode.label}</div>
              <div style={{ color: '#8899aa', fontSize: '11px', marginTop: '4px' }}>Click to research this topic</div>
            </div>
          )}

          <button onClick={loadGraphData} style={{
            marginTop: '10px', padding: '8px 20px', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
            color: '#888', cursor: 'pointer', fontSize: '11px'
          }}>
            🔄 Refresh Graph
          </button>
        </div>

        {/* Metrics Panel */}
        <div style={{ width: '260px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ ...panelStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#8899aa', fontSize: '12px' }}>Synaptic Density</span>
              <span style={{ color: '#00ff0f', fontWeight: 700 }}>{metrics.synapticDensity}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
              <div style={{ width: `${metrics.synapticDensity}%`, height: '100%', background: '#00ff0f', borderRadius: '2px', boxShadow: '0 0 10px #00ff0f' }} />
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Hemisphere Dominance</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '50px' }}>
              <div style={{ flex: 1, background: 'rgba(0,255,15,0.1)', borderTop: '2px solid #00ff0f', borderRadius: '3px 3px 0 0', height: `${metrics.researchDominance}%` }} />
              <div style={{ flex: 1, background: 'rgba(255,32,64,0.1)', borderTop: '2px solid #ff2040', borderRadius: '3px 3px 0 0', height: `${metrics.debateDominance}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: '#555' }}>
              <span>Research</span><span>Debate</span>
            </div>
          </div>

          <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Neural Latency</div>
              <div style={{ color: '#00ccff', fontSize: '18px', fontWeight: 700 }}>{metrics.neuralLatency}</div>
            </div>
            <span style={{ fontSize: '20px', color: '#00ccff' }}>⚡</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const panelStyle = {
  background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px'
}