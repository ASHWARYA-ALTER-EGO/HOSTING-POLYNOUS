import { useRef, useEffect } from 'react'

export default function InterestGraph({ interests, onTopicClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !interests.length) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Create nodes from interests
    const nodes = interests.map((interest, i) => {
      const angle = (i / interests.length) * Math.PI * 2
      const radius = Math.min(canvas.width, canvas.height) * 0.35
      return {
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        baseX: canvas.width / 2 + Math.cos(angle) * radius,
        baseY: canvas.height / 2 + Math.sin(angle) * radius,
        r: Math.min(interest.strength * 6 + 15, 45),
        label: interest.topic,
        strength: interest.strength,
        color: `hsl(${120 + i * 40}, 70%, 55%)`,
        vx: 0, vy: 0
      }
    })

    let mouseX = -1000, mouseY = -1000
    let animationId

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 200) {
            ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - d / 200)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        // Mouse repulsion
        const mdx = n.x - mouseX, mdy = n.y - mouseY
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < 150) {
          n.vx += (mdx / mdist) * 1.5
          n.vy += (mdy / mdist) * 1.5
        }

        // Spring back
        n.vx += (n.baseX - n.x) * 0.02
        n.vy += (n.baseY - n.y) * 0.02
        n.vx *= 0.9; n.vy *= 0.9
        n.x += n.vx; n.y += n.vy

        // Glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 1.8)
        g.addColorStop(0, n.color + '40')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 1.8, 0, Math.PI * 2); ctx.fill()

        // Node circle
        ctx.fillStyle = n.color + '30'
        ctx.strokeStyle = n.color
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()

        // Label
        ctx.fillStyle = '#fff'
        ctx.font = `${Math.max(10, n.r / 3.5)}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + n.r + 16)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    const handleMouseLeave = () => { mouseX = -1000; mouseY = -1000 }
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top
      for (const n of nodes) {
        const d = Math.sqrt((cx - n.x) ** 2 + (cy - n.y) ** 2)
        if (d < n.r + 10 && onTopicClick) {
          onTopicClick(n.label)
          return
        }
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('click', handleClick)
    }
  }, [interests])

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>
        . Your Interest Graph
      </h3>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer'
        }}
      />
      <p style={{ color: '#555', fontSize: '10px', textAlign: 'center', marginTop: '8px' }}>
        Click a node to research that topic
      </p>
    </div>
  )
}