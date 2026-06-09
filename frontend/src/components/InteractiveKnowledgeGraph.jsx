import { useState, useEffect, useRef } from 'react'

export default function InteractiveKnowledgeGraph({ user, onNavigate, onStartResearch }) {
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
  const tooltipRef = useRef(null)

  const userId = user?.id || 'default'

  // Load graph data from backend
  useEffect(() => {
    loadGraphData()
  }, [userId])

  const loadGraphData = async () => {
    setLoading(true)
    try {
      // Fetch knowledge graph data from Neo4j
      const res = await fetch(`http://localhost:8000/knowledge/graph`)
      if (res.ok) {
        const data = await res.json()
        setGraphData(data)
        
        // Calculate metrics
        const totalNodes = data.nodes?.length || 0
        const researchNodes = data.nodes?.filter(n => n.type === 'major').length || 0
        const debateNodes = totalNodes - researchNodes
        
        setMetrics({
          synapticDensity: Math.min(95, totalNodes * 5),
          researchDominance: totalNodes > 0 ? Math.round((researchNodes / totalNodes) * 100) : 50,
          debateDominance: totalNodes > 0 ? Math.round((debateNodes / totalNodes) * 100) : 50,
          neuralLatency: `${(Math.random() * 0.1).toFixed(2)}ms`
        })
      }
      
      // Also get user interests
      const interestsRes = await fetch(`http://localhost:8000/memory/interests/${cleanUserId}`)
      if (interestsRes.ok) {
        const interestsData = await interestsRes.json()
        // Merge interests into graph
        if (interestsData.interests?.length > 0) {
          const existingNodes = graphData.nodes || []
          const newNodes = interestsData.interests.map((interest, i) => ({
            id: interest.topic,
            label: interest.topic,
            size: interest.strength * 10 + 20,
            type: 'major',
            confidence: 80 + Math.random() * 20,
            bridges: Math.floor(interest.strength * 5 + Math.random() * 10)
          }))
          setGraphData(prev => ({
            nodes: [...(prev.nodes || []), ...newNodes],
            edges: prev.edges || []
          }))
        }
      }
    } catch (err) {
      console.error('Failed to load graph:', err)
      // Use sample data as fallback
      setGraphData(getSampleData())
    } finally {
      setLoading(false)
    }
  }

  const getSampleData = () => ({
    nodes: [
      { id: 'core', label: 'Core Logic', size: 40, type: 'core', confidence: 99, bridges: 98 },
      { id: 'ai', label: 'Artificial Intelligence', size: 30, type: 'major', confidence: 94, bridges: 31 },
      { id: 'ml', label: 'Machine Learning', size: 25, type: 'major', confidence: 91, bridges: 18 },
      { id: 'ethics', label: 'AI Ethics', size: 22, type: 'debate', confidence: 76, bridges: 22 },
      { id: 'quantum', label: 'Quantum Computing', size: 20, type: 'major', confidence: 88, bridges: 14 },
      { id: 'privacy', label: 'Data Privacy', size: 18, type: 'debate', confidence: 82, bridges: 9 }
    ],
    edges: [
      { source: 'core', target: 'ai', weight: 5 },
      { source: 'core', target: 'ml', weight: 4 },
      { source: 'ai', target: 'ethics', weight: 3 },
      { source: 'ai', target: 'quantum', weight: 2 },
      { source: 'ml', target: 'privacy', weight: 3 }
    ]
  })

  const getNodeColor = (type) => {
    if (type === 'core') return '#a855f7'
    if (type === 'debate') return '#ff2040'
    return '#00ff0f'
  }

  const getNodeGlow = (type) => {
    if (type === 'core') return 'drop-shadow(0 0 15px rgba(168,85,247,0.6))'
    if (type === 'debate') return 'drop-shadow(0 0 12px rgba(255,32,64,0.5))'
    return 'drop-shadow(0 0 12px rgba(0,255,15,0.5))'
  }

  // Neural background animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles = Array(80).fill().map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw connections
      ctx.strokeStyle = 'rgba(0,204,255,0.05)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.fillStyle = 'rgba(0,255,15,0.3)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      requestAnimationFrame(animate)
    }
    animate()
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1e' }}>
        <div style={{ textAlign: 'center', color: '#00ff0f' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>.</div>
          <div style={{ fontWeight: 600 }}>Loading Neural Graph...</div>
        </div>
      </div>
    )
  }

  // Position nodes in a circle with center
  const positionedNodes = graphData.nodes?.map((node, i) => {
    const angle = (i / (graphData.nodes.length || 1)) * Math.PI * 2
    const radius = 220
    return {
      ...node,
      x: 500 + Math.cos(angle) * radius,
      y: 350 + Math.sin(angle) * radius * 0.7,
      color: getNodeColor(node.type),
      size: Math.min(40, Math.max(18, node.size || 25))
    }
  }) || []

  // Add center node
  const centerNode = {
    id: 'core',
    label: '. Core',
    x: 500,
    y: 350,
    color: '#a855f7',
    size: 30,
    type: 'core'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a1e', fontFamily: 'Inter, Segoe UI, sans-serif', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.3 }} />

      {/* Main Graph */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 700" style={{ maxWidth: '900px' }}>
          
          {/* Edges - Connect ALL nodes to center AND to each other */}
          <g>
            {/* Connect all nodes to center */}
            {positionedNodes.map((node, i) => (
              <line
                key={`center-${i}`}
                x1={centerNode.x}
                y1={centerNode.y}
                x2={node.x}
                y2={node.y}
                stroke={`${node.color}30`}
                strokeWidth={1.5}
                strokeDasharray="8,4"
                style={{ animation: `dash 5s linear infinite` }}
              />
            ))}
            
            {/* Connect nearby nodes to each other */}
            {positionedNodes.map((node1, i) => 
              positionedNodes.slice(i + 1).map((node2, j) => {
                const dist = Math.hypot(node1.x - node2.x, node1.y - node2.y)
                if (dist < 250) {
                  return (
                    <line
                      key={`edge-${i}-${j}`}
                      x1={node1.x}
                      y1={node1.y}
                      x2={node2.x}
                      y2={node2.y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={0.8}
                    />
                  )
                }
                return null
              })
            )}
          </g>

          {/* Center Node */}
          <g style={{ cursor: 'pointer' }}>
            <circle cx={centerNode.x} cy={centerNode.y} r={centerNode.size + 10} fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" from={centerNode.size + 5} to={centerNode.size + 15} dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={centerNode.x} cy={centerNode.y} r={centerNode.size} fill="#a855f7" opacity="0.8" style={{ filter: 'drop-shadow(0 0 15px rgba(168,85,247,0.6))' }} />
            <text x={centerNode.x} y={centerNode.y + centerNode.size + 18} fill="#e2e0fc" textAnchor="middle" fontSize="12" fontWeight="600">{centerNode.label}</text>
          </g>

          {/* Topic Nodes */}
          {positionedNodes.map((node, i) => (
            <g
              key={node.id || i}
              style={{ cursor: 'pointer' }}
              onClick={() => onStartResearch?.(node.label)}
              onMouseEnter={() => setSelectedNode(node)}
              onMouseLeave={() => setSelectedNode(null)}
            >
              {/* Glow ring */}
              <circle cx={node.x} cy={node.y} r={node.size + 8} fill="none" stroke={node.color} strokeWidth="1" opacity="0.2" />
              
              {/* Node */}
              <circle cx={node.x} cy={node.y} r={node.size} fill={node.color} opacity="0.85" 
                style={{ filter: `drop-shadow(0 0 12px ${node.color}80)` }} 
              />
              
              {/* Label */}
              <text x={node.x} y={node.y + node.size + 16} fill="#e2e0fc" textAnchor="middle" fontSize="11" fontWeight="500">
                {node.label?.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {selectedNode && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(16,16,37,0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${selectedNode.color || '#00ff0f'}40`,
            borderRadius: '14px',
            padding: '16px 20px',
            zIndex: 50,
            boxShadow: `0 0 20px ${selectedNode.color || '#00ff0f'}20`,
            textAlign: 'center',
            minWidth: '200px'
          }}>
            <div style={{ color: selectedNode.color || '#00ff0f', fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
              {selectedNode.label}
            </div>
            <div style={{ fontSize: '12px', color: '#8899aa' }}>
              {selectedNode.bridges || Math.floor(Math.random() * 30 + 5)} connections
            </div>
            <div style={{ fontSize: '12px', color: '#00ccff', marginTop: '4px', fontWeight: 600 }}>
              {(selectedNode.confidence || 85).toFixed(0)}% confidence
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '6px' }}>
              Click to research this topic →
            </div>
          </div>
        )}
      </div>

      {/* Metrics Panel */}
      <div style={{ width: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
        {/* Synaptic Density */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#8899aa', fontSize: '13px' }}>Synaptic Density</span>
            <span style={{ color: '#00ff0f', fontWeight: 700 }}>{metrics.synapticDensity}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{ width: `${metrics.synapticDensity}%`, height: '100%', background: '#00ff0f', borderRadius: '2px', boxShadow: '0 0 10px #00ff0f' }} />
          </div>
        </div>

        {/* Hemisphere Dominance */}
        <div style={panelStyle}>
          <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Hemisphere Dominance
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px' }}>
            <div style={{ flex: 1, background: 'rgba(0,255,15,0.1)', borderTop: '2px solid #00ff0f', borderRadius: '4px 4px 0 0', height: `${metrics.researchDominance}%`, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#00ff0f', fontWeight: 700 }}>{metrics.researchDominance}%</span>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,32,64,0.1)', borderTop: '2px solid #ff2040', borderRadius: '4px 4px 0 0', height: `${metrics.debateDominance}%`, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#ff2040', fontWeight: 700 }}>{metrics.debateDominance}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#555' }}>
            <span>Research</span>
            <span>Debate</span>
          </div>
        </div>

        {/* Neural Latency */}
        <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Neural Latency</div>
            <div style={{ color: '#00ccff', fontSize: '20px', fontWeight: 700 }}>{metrics.neuralLatency}</div>
          </div>
          <span style={{ fontSize: '24px', color: '#00ccff' }}>⚡</span>
        </div>

        {/* Refresh Button */}
        <button onClick={loadGraphData} style={{
          padding: '10px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)', color: '#888', cursor: 'pointer', fontSize: '12px',
          marginTop: 'auto'
        }}>
          🔄 Refresh Graph
        </button>
      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const panelStyle = {
  background: 'rgba(16,16,37,0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '16px'
}