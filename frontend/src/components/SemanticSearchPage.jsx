import React, { useState, useRef, useEffect, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  green:              "#00ff0f",
  cyan:               "#00ccff",
  crimson:            "#ff2040",
  void:               "#0a0a1e",
  surface:            "#111125",
  surfaceContainer:   "#1e1e32",
  onSurface:          "#e2e0fc",
  onSurfaceVariant:   "#b9ccb0",
  textSecondary:      "#8899aa",
  white10:            "rgba(255,255,255,0.10)",
  white5:             "rgba(255,255,255,0.05)",
}

// ═══════════════════════════════════════════════════════════════
// ICON
// ═══════════════════════════════════════════════════════════════
function Icon({ name, style }) {
  return (
    <span
      style={{
        fontFamily: "Material Symbols Outlined",
        fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
        lineHeight: 1,
        userSelect: "none",
        ...(style || {}),
      }}
    >
      {name}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// INFO TABLE — Constellation vs Knowledge Graph
// ═══════════════════════════════════════════════════════════════
function InfoTable({ collapsed: defaultCollapsed = true }) {
  const [expanded, setExpanded] = useState(defaultCollapsed)

  return (
    <div style={{
      marginBottom: 24,
      background: "rgba(10,10,30,0.6)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${C.white10}`,
      borderRadius: 16,
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}>
      {/* Header — click to expand/collapse */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", cursor: "pointer",
          background: expanded ? "rgba(0,204,255,0.06)" : "transparent",
          transition: "background 0.2s",
        }}
      >
        
        <span style={{
          color: C.cyan, fontSize: 18,
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease",
        }}>▼</span>
      </div>

      {/* Expandable content */}
      <div style={{
        maxHeight: expanded ? "600px" : "0px",
        overflow: "hidden",
        transition: "max-height 0.4s ease",
      }}>
        <div style={{ padding: "0 20px 20px" }}>
          {/* Comparison Table */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            background: C.white5,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
            fontSize: 12,
          }}>
            
            

            
          </div>

          {/* Bottom tip */}
          
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CORNER INFO CARD — Constellation vs Knowledge Graph
// ═══════════════════════════════════════════════════════════════
function CornerInfoCard() {
  const [show, setShow] = useState(false)

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 50,
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(10,10,30,0.85)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,204,255,0.3)",
          color: C.cyan, cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 15px rgba(0,204,255,0.2)",
        }}
        title="How is this different from Knowledge Graph?"
      >
        ?
      </button>
    )
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 50,
      width: 280,
      background: "rgba(10,8,22,0.95)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(0,204,255,0.25)",
      borderRadius: 14, padding: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {/* Close button */}
      <button
        onClick={() => setShow(false)}
        style={{
          position: "absolute", top: 8, right: 10,
          background: "none", border: "none",
          color: "#666", cursor: "pointer", fontSize: 14,
        }}
      >
        ✕
      </button>

      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
        🌌 vs .
      </div>

      {[
        ["This page (Constellation)", "Knowledge Graph"],
        ["Shows search results for a query", "Shows all your research topics"],
        ["Stars = search matches", "Nodes = topics/claims/arguments"],
        ["Brighter = better match", "Bigger = more researched"],
        ["Click → see that research", "Click → explore connections"],
        ["Data: Pinecone vectors", "Data: Neo4j relationships"],
      ].map((row, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          padding: i === 0 ? "6px 0" : "5px 0",
          borderBottom: i === 0 ? `1px solid ${C.white5}` : "none",
          marginBottom: i === 0 ? 6 : 0,
        }}>
          <span style={{
            fontFamily: i === 0 ? "'JetBrains Mono',monospace" : "'Hanken Grotesk',sans-serif",
            fontSize: i === 0 ? 10 : 11,
            color: i === 0 ? C.cyan : "#c8d6e5",
            fontWeight: i === 0 ? 700 : 400,
            textTransform: i === 0 ? "uppercase" : "none",
            letterSpacing: i === 0 ? "0.05em" : "0",
          }}>
            {row[0]}
          </span>
          <span style={{
            fontFamily: i === 0 ? "'JetBrains Mono',monospace" : "'Hanken Grotesk',sans-serif",
            fontSize: i === 0 ? 10 : 11,
            color: i === 0 ? "#a855f7" : "#8899aa",
            fontWeight: i === 0 ? 700 : 400,
            textTransform: i === 0 ? "uppercase" : "none",
            letterSpacing: i === 0 ? "0.05em" : "0",
          }}>
            {row[1]}
          </span>
        </div>
      ))}

      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: `1px solid ${C.white5}`,
        fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 10,
        color: "#667788", lineHeight: 1.5,
      }}>
        💡 <strong style={{ color: C.cyan }}>Search</strong> to find past research.{" "}
        <strong style={{ color: "#a855f7" }}>Graph</strong> to explore connections.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}
function lerp(a, b, t) { return a + (b - a) * t }
function easeOut(t) { return 1 - Math.pow(1 - t, 3) }

// ═══════════════════════════════════════════════════════════════
// NEURAL CONSTELLATION
// ═══════════════════════════════════════════════════════════════
function NeuralConstellation({ results = [], filter = "all", onStarClick, onFilterChange }) {
  const canvasRef   = useRef(null)
  const stateRef    = useRef({
    stars: [], bgStars: [], particles: [],
    hoveredStar: null, selectedStar: null,
    animTime: 0, burstProgress: 1, burstActive: false,
    W: 0, H: 0, cx: 0, cy: 0,
    mouseX: 0, mouseY: 0,
    rafId: null,
  })
  const [tooltip,      setTooltip]      = useState(null)
  const [detail,       setDetail]       = useState(null)
  const [activeFilter, setActiveFilter] = useState(filter)

  // ── resize ──
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s   = stateRef.current
    const rect = canvas.getBoundingClientRect()
    const dpr  = window.devicePixelRatio || 1
    canvas.width  = rect.width  * dpr
    canvas.height = rect.height * dpr
    canvas.getContext("2d").scale(dpr, dpr)
    s.W = rect.width
    s.H = rect.height
    s.cx = rect.width  / 2
    s.cy = rect.height / 2
    // regenerate background stars
    s.bgStars = Array.from({ length: 45 }, () => ({
      x:      Math.random() * s.W,
      y:      Math.random() * s.H,
      r:      0.5 + Math.random() * 1.2,
      op:     0.1 + Math.random() * 0.3,
      twinkle: Math.random() * Math.PI * 2,
    }))
  }, [])

  // ── build stars from results ──
  const makeStars = useCallback((res, fil) => {
    const s        = stateRef.current
    const filtered = res.filter(r => fil === "all" || r.mode === fil)

    s.stars = filtered.map((r, i) => {
      const color      = r.mode === "research" ? C.green : C.crimson
      const radius     = 8  + (r.confidence / 100) * 20
      const brightness = 0.35 + (r.score    / 100) * 0.65
      const angle      = i * 2.39996
      const rad        = 60 + (i / Math.max(filtered.length, 1)) * Math.min(s.cx, s.cy) * 1.5
      return {
        ...r,
        color, radius, brightness,
        tx: s.cx + Math.cos(angle) * rad,
        ty: s.cy + Math.sin(angle) * rad * 0.7,
        x: s.cx, y: s.cy,
        phase: Math.random() * Math.PI * 2,
        drift: { x: 0, y: 0, vx: (Math.random() - 0.5) * 0.015, vy: (Math.random() - 0.5) * 0.015 },
        hovered: false, selected: false,
        rings: [{ r: 0, op: 1 }, { r: 0, op: 0.6 }],
      }
    })

    // edge particles
    s.particles = []
    for (let a = 0; a < s.stars.length; a++) {
      for (let b = a + 1; b < s.stars.length; b++) {
        const dx = s.stars[a].tx - s.stars[b].tx
        const dy = s.stars[a].ty - s.stars[b].ty
        if (Math.sqrt(dx * dx + dy * dy) < 180) {
          for (let p = 0; p < 2; p++) {
            s.particles.push({ a, b, t: Math.random(), speed: 0.0003 + Math.random() * 0.0004 })
          }
        }
      }
    }

    s.selectedStar  = null
    setDetail(null)
    s.burstProgress = 0
    s.burstActive   = true
  }, [])

  // ── draw helpers ──
  function drawGrid(ctx, s) {
    ctx.save()
    ctx.strokeStyle = "rgba(0,204,255,0.08)"
    ctx.lineWidth   = 0.5
    ;[80, 160, 240].forEach(r => { ctx.beginPath(); ctx.arc(s.cx, s.cy, r, 0, Math.PI * 2); ctx.stroke() })
    ctx.beginPath(); ctx.moveTo(0, s.cy);  ctx.lineTo(s.W, s.cy);  ctx.stroke()
    ctx.beginPath(); ctx.moveTo(s.cx, 0);  ctx.lineTo(s.cx, s.H);  ctx.stroke()
    ctx.restore()
  }

  function drawNebula(ctx, s) {
    const g = ctx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, 160)
    g.addColorStop(0,   "rgba(0,100,200,0.06)")
    g.addColorStop(0.5, "rgba(100,0,200,0.04)")
    g.addColorStop(1,   "transparent")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s.W, s.H)
  }

  function drawBgStars(ctx, s) {
    s.bgStars.forEach(bs => {
      const twink = bs.op + Math.sin(s.animTime * 0.001 + bs.twinkle) * 0.05
      ctx.beginPath()
      ctx.arc(bs.x, bs.y, bs.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${twink})`
      ctx.fill()
    })
  }

  function drawConnections(ctx, s) {
    const prog = easeOut(s.burstProgress)
    for (let a = 0; a < s.stars.length; a++) {
      for (let b = a + 1; b < s.stars.length; b++) {
        const sa = s.stars[a], sb = s.stars[b]
        const dx = sa.x - sb.x, dy = sa.y - sb.y
        if (Math.sqrt(dx * dx + dy * dy) >= 180) continue
        const hov = sa.hovered || sb.hovered || sa === s.selectedStar || sb === s.selectedStar
        ctx.beginPath()
        ctx.moveTo(sa.x, sa.y)
        ctx.lineTo(sb.x, sb.y)
        ctx.strokeStyle = hov ? "rgba(0,204,255,0.35)" : "rgba(0,204,255,0.12)"
        ctx.lineWidth   = hov ? 1.5 : 0.8
        ctx.globalAlpha = prog
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }
  }

  function drawParticles(ctx, s) {
    const prog = easeOut(s.burstProgress)
    s.particles.forEach(p => {
      p.t += p.speed * 16
      if (p.t > 1) p.t = 0
      const sa = s.stars[p.a], sb = s.stars[p.b]
      if (!sa || !sb) return
      const dx = sa.x - sb.x, dy = sa.y - sb.y
      if (Math.sqrt(dx * dx + dy * dy) > 180) return
      const px = lerp(sa.x, sb.x, p.t)
      const py = lerp(sa.y, sb.y, p.t)
      ctx.beginPath()
      ctx.arc(px, py, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200,240,255,${0.7 * prog})`
      ctx.fill()
    })
  }

  function drawStarShape(ctx, s, star) {
    const pulse  = Math.sin(s.animTime * 0.003 + star.phase) * 2
    const r      = star.radius + (star.hovered ? star.radius * 0.35 : 0) + pulse
    const glowR  = r * (star.hovered ? 3 : 2.5)
    const prog   = easeOut(s.burstProgress)
    const alpha  = star.brightness * prog
    const { r: cr, g: cg, b: cb } = hexToRgb(star.color)

    // glow
    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR)
    glow.addColorStop(0, `rgba(${cr},${cg},${cb},${0.4 * alpha})`)
    glow.addColorStop(1, "transparent")
    ctx.beginPath(); ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2)
    ctx.fillStyle = glow; ctx.fill()

    // outer ring
    ctx.beginPath(); ctx.arc(star.x, star.y, r + 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.7 * alpha})`; ctx.fill()

    // body
    ctx.beginPath(); ctx.arc(star.x, star.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`; ctx.fill()

    // core
    const coreR = star.hovered ? 4 : 2.5
    ctx.beginPath(); ctx.arc(star.x, star.y, coreR, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`; ctx.fill()

    // selection rings
    if (star === s.selectedStar) {
      star.rings.forEach(ring => {
        ring.r   += 0.4
        ring.op  -= 0.008
        if (ring.op <= 0) { ring.r = 0; ring.op = 0.8 }
        ctx.beginPath(); ctx.arc(star.x, star.y, r + ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ring.op})`
        ctx.lineWidth   = 1.5
        ctx.stroke()
      })
    }
  }

  // ── animation loop ──
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const s   = stateRef.current

    function frame() {
      ctx.clearRect(0, 0, s.W, s.H)
      ctx.fillStyle = C.void
      ctx.fillRect(0, 0, s.W, s.H)

      drawNebula(ctx, s)
      drawGrid(ctx, s)
      drawBgStars(ctx, s)

      // burst animation
      if (s.burstActive && s.burstProgress < 1) {
        s.burstProgress = Math.min(1, s.burstProgress + 0.018)
        if (s.burstProgress >= 1) s.burstActive = false
      }

      const ep = easeOut(s.burstProgress)
      s.stars.forEach(star => {
        star.x = lerp(s.cx, star.tx + star.drift.x, ep)
        star.y = lerp(s.cy, star.ty + star.drift.y, ep)
        if (!s.burstActive) {
          star.drift.x += star.drift.vx
          star.drift.y += star.drift.vy
          if (Math.abs(star.drift.x) > 3) star.drift.vx *= -1
          if (Math.abs(star.drift.y) > 3) star.drift.vy *= -1
        }
      })

      drawConnections(ctx, s)
      drawParticles(ctx, s)
      s.stars.forEach(star => drawStarShape(ctx, s, star))

      s.animTime += 16
      s.rafId = requestAnimationFrame(frame)
    }

    if (s.rafId) cancelAnimationFrame(s.rafId)
    s.rafId = requestAnimationFrame(frame)
  }, [])

  useEffect(() => {
    resize()
    startLoop()
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId)
    }
  }, [resize, startLoop])

  useEffect(() => {
    const s = stateRef.current
    if (s.W > 0) makeStars(results, activeFilter)
  }, [results, activeFilter, makeStars])

  // ── events ──
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s    = stateRef.current
    const rect = canvas.getBoundingClientRect()
    s.mouseX = e.clientX - rect.left
    s.mouseY = e.clientY - rect.top

    s.hoveredStar = null
    s.stars.forEach(st => (st.hovered = false))

    for (let i = s.stars.length - 1; i >= 0; i--) {
      const st = s.stars[i]
      const dx = st.x - s.mouseX, dy = st.y - s.mouseY
      if (Math.sqrt(dx * dx + dy * dy) < st.radius + 12) {
        st.hovered    = true
        s.hoveredStar = st
        setTooltip({ star: st, cx: e.clientX, cy: e.clientY })
        return
      }
    }
    setTooltip(null)
  }, [])

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s    = stateRef.current
    const rect = canvas.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top
    let clicked = null

    for (let i = s.stars.length - 1; i >= 0; i--) {
      const st = s.stars[i]
      const dx = st.x - mx, dy = st.y - my
      if (Math.sqrt(dx * dx + dy * dy) < st.radius + 12) {
        clicked = st
        break
      }
    }

    s.stars.forEach(st => (st.selected = false))
    if (clicked && clicked !== s.selectedStar) {
      s.selectedStar      = clicked
      clicked.selected    = true
      clicked.rings       = [{ r: 0, op: 1 }, { r: 0, op: 0.6 }]
      setDetail(clicked)
      onStarClick?.(clicked)
    } else {
      s.selectedStar = null
      setDetail(null)
    }
  }, [onStarClick])

  const handleMouseLeave = useCallback(() => {
    const s = stateRef.current
    s.hoveredStar = null
    s.stars.forEach(st => (st.hovered = false))
    setTooltip(null)
  }, [])

  const handleFilter = (f) => {
    setActiveFilter(f)
    onFilterChange?.(f)
  }

  // ── filter button style ──
  const filterBtnStyle = (f) => {
    const active = activeFilter === f
    const accent = f === "all" ? C.cyan : f === "research" ? C.green : C.crimson
    return {
      padding:         "5px 16px",
      borderRadius:    20,
      fontSize:        12,
      cursor:          "pointer",
      fontFamily:      "inherit",
      transition:      "all 0.2s",
      background:      active ? `${accent}22` : "transparent",
      border:          `1px solid ${active ? accent + "80" : accent + "33"}`,
      color:           active ? accent : `${accent}66`,
    }
  }

  return (
    <div style={{ background: C.void, borderRadius: 16, overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: 420, cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", alignItems: "center" }}>
        {["all", "research", "debate"].map(f => (
          <button key={f} style={filterBtnStyle(f)} onClick={() => handleFilter(f)}>
            {f === "all" ? "All" : f === "research" ? "🔬 Research" : "🗣️ Debates"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "#4a5568", fontSize: 11, fontFamily: "monospace" }}>
          {stateRef.current.stars.length} results
        </span>
      </div>

      {/* Inline detail panel (shows on star click inside canvas) */}
      {detail && (
        <div style={{
          margin: "0 14px 14px",
          background: "rgba(10,8,22,0.95)",
          border: "1px solid rgba(0,204,255,0.25)",
          borderRadius: 10,
          padding: "12px 16px",
          color: "#ccd",
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: detail.color, display: "inline-block" }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{detail.score}% match</span>
            <span style={{
              fontSize: 11, padding: "2px 10px", borderRadius: 10, marginLeft: "auto",
              background: `${detail.color}22`, color: detail.color, border: `1px solid ${detail.color}44`,
              textTransform: "capitalize",
            }}>
              {detail.mode}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#aabbcc", marginBottom: 4, lineHeight: 1.4 }}>{detail.query}</div>
          <div style={{ fontSize: 12, color: "#667788", lineHeight: 1.5 }}>{detail.content_preview}</div>
        </div>
      )}

      {/* Fixed tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.cx + 16,
          top:  tooltip.cy - 20,
          pointerEvents: "none",
          zIndex: 999,
          background: "rgba(10,8,22,0.95)",
          border: "1px solid rgba(0,204,255,0.3)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
          color: "#ccd",
          maxWidth: 200,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ color: tooltip.star.color, fontWeight: 600, marginBottom: 4 }}>
            {tooltip.star.score}% match
          </div>
          <div style={{ color: "#aabbcc", lineHeight: 1.4 }}>
            {tooltip.star.query.length > 35 ? tooltip.star.query.slice(0, 35) + "…" : tooltip.star.query}
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: "#556677", textTransform: "uppercase", letterSpacing: 1 }}>
            {tooltip.star.mode}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { icon: "travel_explore", label: "Research",        path: "/research" },
  { icon: "forum",          label: "Debate Chamber",  path: "/debate" },
  { icon: "account_tree",   label: "Knowledge Graph", path: "/graph" },
  { icon: "search",         label: "Semantic Search", path: "/search", active: true },
  { icon: "database",       label: "Memory Bank",     path: "/memory" },
  { icon: "picture_as_pdf", label: "PDF Lab",         path: "/pdf-lab" },
  { icon: "analytics",      label: "Analytics",       path: "/analytics" },
]

function NavItem({ icon, label, path, active, collapsed, onNavigate }) {
  const [hovered, setHovered] = useState(false)
  const handleNav = () => onNavigate ? onNavigate(path) : (window.location.href = path)

  if (collapsed) {
    return (
      <div
        onClick={handleNav}
        title={label}
        style={{
          padding: "12px 0", cursor: "pointer",
          color: active ? C.cyan : C.onSurfaceVariant,
          width: "100%", display: "flex", justifyContent: "center",
        }}
      >
        <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
      </div>
    )
  }

  return (
    <div
      onClick={handleNav}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", borderRadius: 9999, cursor: "pointer",
        color:       active || hovered ? C.cyan : C.onSurfaceVariant,
        background:  active ? "rgba(0,204,255,0.08)" : hovered ? C.white5 : "transparent",
        fontFamily:  "'JetBrains Mono',monospace",
        fontSize: 13, fontWeight: active ? 700 : 400,
        transition: "all 0.2s",
        whiteSpace: "nowrap", overflow: "hidden",
      }}
    >
      <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </div>
  )
}

function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const handleNav    = (path) => onNavigate ? onNavigate(path) : (window.location.href = path)
  const handleLogout = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = "/")

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width:   collapsed ? 56 : 320,
      background:    "rgba(10,10,30,0.6)",
      backdropFilter: "blur(24px)",
      borderRight:   `1px solid ${C.white10}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "16px 8px" : 24,
      zIndex: 20,
      transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
    }}>
      {collapsed ? (
        <>
          <button
            onClick={() => setCollapsed(false)}
            style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", marginBottom: 32, display: "flex", justifyContent: "center" }}
          >
            <Icon name="chevron_right" style={{ fontSize: 22 }} />
          </button>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.label} {...item} collapsed onNavigate={onNavigate} />
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div
              onClick={() => handleNav("/research")}
              style={{ width: 34, height: 34, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon name="add" style={{ fontSize: 16, color: C.void }} />
            </div>
            <div
              title={user?.username || "Guest"}
              style={{ width: 30, height: 30, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,204,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="face" style={{ color: C.cyan, fontSize: 14 }} />
            </div>
            <div onClick={handleLogout} style={{ cursor: "pointer", color: C.crimson }}>
              <Icon name="logout" style={{ fontSize: 14 }} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: C.cyan, letterSpacing: "-0.03em", whiteSpace: "nowrap", margin: 0 }}>POLYNOUS</h1>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.7, whiteSpace: "nowrap", margin: "4px 0 0" }}>
                Cerebral Vitality Engine
              </p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = C.textSecondary)}
            >
              <Icon name="chevron_left" style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
            {NAV_ITEMS.map(item => (
              <NavItem key={item.label} {...item} collapsed={false} onNavigate={onNavigate} />
            ))}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.white5}`, paddingTop: 24, marginTop: 24 }}>
            <button
              onClick={() => handleNav("/research")}
              style={{
                width: "100%", padding: "12px", background: C.cyan, color: C.void,
                fontWeight: 700, borderRadius: 9999, border: "none", cursor: "pointer",
                fontFamily: "'Sora',sans-serif", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Icon name="add" style={{ fontSize: 18, color: C.void, flexShrink: 0 }} />
              New Research
            </button>

            {/* User */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainer, border: "1px solid rgba(0,204,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="face" style={{ color: C.cyan, fontSize: 22 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                  {user?.username || "Guest"}
                </p>
                <button
                  onClick={handleLogout}
                  style={{ fontSize: 10, color: C.crimson, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", padding: 0 }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════════════════
function ParticleCanvas() {
  const ref   = useRef(null)
  const mouse = useRef({ x: null, y: null })

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext("2d")
    let particles = [], animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", resize)
    resize()

    for (let i = 0; i < 150; i++) {
      particles.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        size:    Math.random() * 2 + 1,
        vx:      Math.random() * 0.5 - 0.25,
        vy:      Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5 + 0.1,
      })
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        if (mouse.current.x != null && mouse.current.y != null) {
          const dx = mouse.current.x - p.x
          const dy = mouse.current.y - p.y
          if (Math.sqrt(dx * dx + dy * dy) < 100) { p.x -= dx / 15; p.y -= dy / 15 }
        }
        ctx.fillStyle = `rgba(0,204,255,${p.opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      animId = requestAnimationFrame(loop)
    }
    loop()

    const mm = e => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener("mousemove", mm)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", mm)
    }
  }, [])

  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }} />
}

// ═══════════════════════════════════════════════════════════════
// QUICK SUGGESTION CHIP
// ═══════════════════════════════════════════════════════════════
const QUICK_TOPICS = ["AI Safety", "Quantum Computing", "Neuroethics", "Deep Space Habitat", "CRISPR Ethics"]

function QuickChip({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "8px 20px", borderRadius: "50px",
        background: hovered ? "rgba(0,204,255,0.08)" : "rgba(10,10,30,0.6)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${hovered ? "rgba(0,204,255,0.3)" : C.white10}`,
        color:   hovered ? C.cyan : C.textSecondary,
        cursor:  "pointer",
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 12, transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// SELECTED RESULT PANEL
// ═══════════════════════════════════════════════════════════════
function ResultPanel({ result, onClose, onStartResearch }) {
  if (!result) return null
  const isResearch = result.mode !== "debate"

  return (
    <div style={{
      background: "rgba(10,10,30,0.8)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${isResearch ? "rgba(0,255,15,0.3)" : "rgba(255,32,64,0.3)"}`,
      borderRadius: 20, padding: 28,
      position: "relative",
      boxShadow: `0 0 30px ${isResearch ? "rgba(0,255,15,0.15)" : "rgba(255,32,64,0.15)"}`,
      animation: "fadeSlideUp 0.4s ease",
      marginTop: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            background: isResearch ? "rgba(0,255,15,0.1)" : "rgba(255,32,64,0.1)",
            color:  isResearch ? C.green   : C.crimson,
            border: `1px solid ${isResearch ? "rgba(0,255,15,0.3)" : "rgba(255,32,64,0.3)"}`,
            padding: "4px 12px", borderRadius: 20,
            fontSize: 11, textTransform: "uppercase",
            display: "inline-block", marginBottom: 12,
          }}>
            {isResearch ? "🔬 Research Node" : "🗣️ Debate Node"}
          </span>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.3em", color: "#fff", margin: 0 }}>
            {result.query}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = C.textSecondary)}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 20 }}>
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: "#c8d6e5", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          {result.answer || "No additional details available."}
        </p>
        <div style={{ background: C.white5, borderRadius: 12, padding: 16, border: `1px solid ${C.white10}` }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#555", textTransform: "uppercase", marginBottom: 4 }}>Similarity</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.4em", fontWeight: 800, color: C.green }}>{result.score}%</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#555", textTransform: "uppercase", marginBottom: 4 }}>Confidence</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.2em", fontWeight: 700, color: C.cyan }}>{result.confidence ?? "N/A"}%</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => result && onStartResearch?.(result.query)}
        style={{
          fontFamily: "'Sora',sans-serif",
          background: C.green, color: C.void,
          padding: "14px 32px", borderRadius: "50px",
          border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        Initiate Stream →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function SemanticSearchPage({ user, onStartResearch, onNavigate, onLogout }) {
  const [query,           setQuery]           = useState("")
  const [results,         setResults]         = useState([])
  const [suggestions,     setSuggestions]     = useState([])
  const [loading,         setLoading]         = useState(false)
  const [searched,        setSearched]        = useState(false)
  const [selectedResult,  setSelectedResult]  = useState(null)
  const [filter,          setFilter]          = useState("all")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false)
  const suggestionsRef = useRef(null)

  // close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setSelectedResult(null)
    setShowSuggestions(false)

    try {
      const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(q)}&top_k=12`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      } else {
        setResults([])
      }
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = async (value) => {
    setQuery(value)
    if (value.length > 2) {
      setShowSuggestions(true)
      try {
        const res = await fetch(`http://localhost:8000/search/suggestions?query=${encodeURIComponent(value)}&limit=5`)
        if (res.ok) {
          const d = await res.json()
          setSuggestions(d.suggestions || [])
        }
      } catch {}
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const handleQuickSuggestion = (topic) => {
    setQuery(topic)
    handleSearch(topic)
  }

  const sidebarW = sidebarCollapsed ? 56 : 320

  return (
    <div style={{ minHeight: "100vh", background: C.void, fontFamily: "'Hanken Grotesk',sans-serif", position: "relative", overflow: "auto", color: C.onSurface }}>
      <ParticleCanvas />

      <Sidebar
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main style={{
        marginLeft: sidebarW,
        padding: "30px 20px 60px",
        position: "relative", zIndex: 10,
        transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
        width: `calc(100% - ${sidebarW}px)`,
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* ── Header ── */}
<div style={{ textAlign: "center", marginBottom: 36, paddingTop: 10, animation: "fadeSlideUp 0.6s ease both" }}>
  <h1 style={{
    fontFamily: "'Sora',sans-serif",
    fontSize: "clamp(2rem,4.5vw,3rem)",
    fontWeight: 800,
    color: "#00ccff",
    margin: "0 0 10px",
    letterSpacing: "-0.03em",
    textShadow: "0 0 40px rgba(0,204,255,0.3)",
  }}>🔍 Neural Semantic Search</h1>
  <p style={{
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 14,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "3px",
  }}>Mapping the conceptual geometry of your research space.</p>
</div>

          {/* ── INFO TABLE ── */}
          <InfoTable collapsed={true} />

          {/* ── SEARCH BAR ── */}
          <div style={{ position: "relative", marginBottom: 20 }} ref={suggestionsRef}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "rgba(25,25,46,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,204,255,0.3)",
              borderRadius: 50, padding: "16px 24px",
              boxShadow: "0 0 20px rgba(0,204,255,0.1)",
            }}>
              <span style={{ color: C.cyan, marginRight: 16, fontSize: 20 }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Enter a research hypothesis or query..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16,
                }}
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                style={{
                  background: loading ? "rgba(0,204,255,0.5)" : C.cyan,
                  color: C.void, padding: "12px 24px", borderRadius: 50,
                  border: "none", fontFamily: "'Sora',sans-serif",
                  fontWeight: 700, fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Scanning…" : "Scan"}
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8,
                background: "rgba(10,10,30,0.95)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${C.white10}`,
                borderRadius: 16, overflow: "hidden", zIndex: 30,
              }}>
                {suggestions.map((s, i) => (
                  <SuggestionRow
                    key={i}
                    text={s}
                    isLast={i === suggestions.length - 1}
                    onClick={() => { setQuery(s); handleSearch(s) }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── QUICK CHIPS ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {QUICK_TOPICS.map(t => (
              <QuickChip key={t} label={t} onClick={() => handleQuickSuggestion(t)} />
            ))}
          </div>

          {/* ── CONSTELLATION ── */}
          {searched && results.length > 0 && !loading && (
            <div style={{ marginBottom: 24 }}>
              <NeuralConstellation
                results={results}
                filter={filter}
                onStarClick={setSelectedResult}
                onFilterChange={setFilter}
              />
            </div>
          )}

          {/* ── LOADING ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: C.cyan, opacity: 0.5,
                animation: "pulse 2s infinite",
                boxShadow: "0 0 40px rgba(0,204,255,0.6)",
                margin: "0 auto 20px",
              }} />
              <p style={{ fontFamily: "'Sora',sans-serif", color: C.cyan, fontWeight: 600, margin: 0 }}>
                Analyzing conceptual overlaps…
              </p>
            </div>
          )}

          {/* ── EMPTY / IDLE STATE ── */}
          {!loading && (!searched || (searched && results.length === 0)) && (
            <div style={{
              textAlign: "center", padding: "60px 20px", borderRadius: 30,
              background: "rgba(10,10,30,0.4)", backdropFilter: "blur(20px)",
              border: `1px solid ${C.white5}`,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "2px dashed rgba(0,204,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <span style={{ color: C.cyan, fontSize: 24 }}>🔮</span>
              </div>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,204,255,0.6)", fontSize: 14, marginBottom: 8 }}>
                Query the neural void to generate constellation
              </p>
              {searched && results.length === 0 && (
                <p style={{ color: "#555", fontSize: 13, margin: 0 }}>No neural matches found. Try different keywords.</p>
              )}
            </div>
          )}

          {/* ── SELECTED RESULT ── */}
          <ResultPanel
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
            onStartResearch={onStartResearch}
          />
        </div>
      </main>

      {/* ── CORNER INFO CARD ── */}
      <CornerInfoCard />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: .5; transform: scale(1); }
          50%       { opacity:  1; transform: scale(1.1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(136,153,170,0.6); }
      `}</style>
    </div>
  )
}

// ─── tiny sub-component kept out of render ───────────────────
function SuggestionRow({ text, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 20px", cursor: "pointer",
        color:      hovered ? "#fff" : "#ccc",
        background: hovered ? "rgba(0,204,255,0.08)" : "transparent",
        fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13,
        borderBottom: isLast ? "none" : `1px solid ${C.white5}`,
        transition: "all 0.15s",
      }}
    >
      🔍 {text}
    </div>
  )
}