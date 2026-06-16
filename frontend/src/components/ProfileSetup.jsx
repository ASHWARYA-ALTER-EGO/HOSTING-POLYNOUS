import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Keyframe injection (runs once) ──────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap');

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 5px #00ff0f); }
    50%       { opacity: 1;   filter: drop-shadow(0 0 14px #00ff0f); }
  }
  @keyframes blink {
    from, to { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .polynous-input::placeholder { color: #555555; }
  .polynous-input:focus        { outline: none; }

  .polynous-btn {
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }
  .polynous-btn:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 32px rgba(0,255,15,0.65);
  }
  .polynous-btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .polynous-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

function injectStyles() {
  if (document.getElementById('polynous-profile-styles')) return
  const tag = document.createElement('style')
  tag.id = 'polynous-profile-styles'
  tag.textContent = STYLES
  document.head.appendChild(tag)
}

// ─── Neural Canvas (ported from LoginCard) ────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let particles = [], animId

    const N = 120, maxDist = 150

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    class P {
      constructor() {
        this.x  = Math.random() * canvas.width
        this.y  = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.r  = Math.random() * 2 + 1
      }
      update() {
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > canvas.width)  this.vx *= -1
        if (this.y < 0 || this.y > canvas.height)  this.vy *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,255,15,0.4)'
        ctx.fill()
      }
    }

    const init = () => { particles = Array.from({ length: N }, () => new P()) }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.update(); p.draw()
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x, dy = p.y - q.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0,204,255,${0.1 * (1 - dist / maxDist)})`
            ctx.lineWidth = 1
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
          }
        }
      })
      animId = requestAnimationFrame(animate)
    }

    const onResize = () => { resize(); init() }
    const onMove   = (e) => {
      particles.forEach(p => {
        const dx = e.clientX - p.x, dy = e.clientY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) { p.vx += dx * 0.00005; p.vy += dy * 0.00005 }
      })
    }

    resize(); init(); animate()
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SynapseDot({ style }) {
  return (
    <div style={{
      width: 4, height: 4,
      background: '#00ff0f',
      borderRadius: '50%',
      position: 'absolute',
      boxShadow: '0 0 8px #00ff0f',
      ...style,
    }} />
  )
}

function BrainIcon() {
  return (
    <div style={{
      width: 64, height: 64,
      background: 'rgba(30,30,50,0.8)',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(0,255,15,0.3)',
      animation: 'pulseGlow 3s infinite ease-in-out',
    }}>
      <span
        className="material-symbols-outlined"
        style={{ color: '#00ff0f', fontSize: 36 }}
      >
        psychology
      </span>
    </div>
  )
}

function StatusDot({ state }) {
  const colors = { idle: 'transparent', checking: '#f59e0b', valid: '#00ff0f', invalid: '#ff2040' }
  const labels = { idle: '', checking: 'CHECKING', valid: 'AVAILABLE', invalid: 'TOO SHORT' }
  if (state === 'idle') return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'fadeIn 0.2s ease' }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, letterSpacing: '0.06em',
        color: colors[state],
      }}>
        {labels[state]}
      </span>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[state],
        boxShadow: `0 0 8px ${colors[state]}`,
      }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileSetup({ onComplete, email }) {
  const [username, setUsername]    = useState('')
  const [loading, setLoading]      = useState(false)
  const [error, setError]          = useState('')
  const [inputFocused, setFocused] = useState(false)
  const [btnLabel, setBtnLabel]    = useState('INITIALIZE →')
  const inputRef = useRef(null)

  useEffect(() => {
    injectStyles()
    inputRef.current?.focus()
  }, [])

  const charCount   = username.length
  const MAX         = 24
  const MIN         = 3
  const isValid     = charCount >= MIN && charCount <= MAX
  const statusState = charCount === 0 ? 'idle' : isValid ? 'valid' : 'invalid'

  const charFeedback = (() => {
    if (charCount === 0) return `MIN. ${MIN} CHARACTERS`
    if (charCount < MIN) return 'REQUIRES MORE INPUT'
    return 'COGNITIVE MARK VALID'
  })()

  const feedbackColor = isValid ? '#00ff0f' : '#555555'

  const handleChange = useCallback((e) => {
    const val = e.target.value.replace(/\s/g, '').slice(0, MAX)
    setUsername(val)
    setError('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (loading) return
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Neural handle cannot be empty.')
      inputRef.current?.focus()
      return
    }
    if (trimmed.length < MIN) {
      setError(`Username must be at least ${MIN} characters.`)
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    setError('')
    setBtnLabel('SYNCHRONIZING...')
    try {
      if (onComplete) await onComplete(trimmed)
    } catch (err) {
      setError(err?.message || 'Failed to initialize. Try again.')
      setLoading(false)
      setBtnLabel('INITIALIZE →')
    }
  }, [loading, username, onComplete])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  const borderColor = inputFocused
    ? '#00ff0f'
    : error
      ? 'rgba(255,32,64,0.5)'
      : 'rgba(255,255,255,0.1)'

  const inputGlow = inputFocused ? '0 0 20px rgba(0,255,15,0.15)' : 'none'

  return (
    // ⚠ position:fixed + inset:0 breaks out of any parent container constraints
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a1e',
      fontFamily: "'Sora', 'Inter', sans-serif",
      overflow: 'hidden',
      zIndex: 9999,
    }}>

      {/* Neural particle canvas */}
      <NeuralCanvas />

      {/* Grid dot overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,255,15,0.04) 1px, transparent 0)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 500,
        padding: '0 24px',
      }}>
        <div style={{
          background: 'rgba(10,10,30,0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>

          <SynapseDot style={{ top: 14, left: 14 }} />
          <SynapseDot style={{ top: 14, right: 14 }} />
          <SynapseDot style={{ bottom: 14, left: 14 }} />
          <SynapseDot style={{ bottom: 14, right: 14 }} />

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <BrainIcon />
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 22, fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Initialize Neural Identity
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 500,
              color: '#b9ccb0',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0, maxWidth: 320, lineHeight: 1.6,
            }}>
              Set a unique identifier for your cognitive profile
            </p>
          </div>

          {/* Form */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Input */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 22px', borderRadius: 999,
                background: 'rgba(12,12,32,0.6)',
                border: `1px solid ${borderColor}`,
                boxShadow: inputGlow,
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14, color: 'rgba(0,255,15,0.7)', letterSpacing: '0.04em',
                  }}>
                    @
                  </span>
                  <div style={{
                    width: 2, height: 16,
                    background: '#00ff0f',
                    animation: 'blink 1s step-end infinite',
                  }} />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="neural_handle"
                  disabled={loading}
                  autoComplete="off"
                  className="polynous-input"
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#ffffff',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 15, letterSpacing: '0.04em',
                    padding: 0, caretColor: '#00ff0f',
                  }}
                />

                <StatusDot state={statusState} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 8, padding: '0 22px',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.08em',
                  color: feedbackColor,
                  textTransform: 'uppercase',
                  transition: 'color 0.2s ease',
                }}>
                  {charFeedback}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.08em',
                  color: '#555555', textTransform: 'uppercase',
                }}>
                  {charCount} / {MAX}
                </span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                padding: '10px 18px', borderRadius: 10,
                background: 'rgba(255,32,64,0.08)',
                border: '1px solid rgba(255,32,64,0.35)',
                borderLeft: '3px solid #ff2040',
                color: '#ff2040',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                animation: 'fadeIn 0.2s ease',
              }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="polynous-btn"
              style={{
                width: '100%', padding: '16px',
                borderRadius: 999, border: 'none',
                background: '#00ff0f', color: '#0a0a1e',
                fontFamily: "'Sora', sans-serif",
                fontSize: 16, fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 0 24px rgba(0,255,15,0.4)',
              }}
            >
              {btnLabel}
            </button>
          </div>

          {/* Footer */}
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#555555', margin: 0,
          }}>
            You can modify this later in Settings
          </p>

          {/* Status cluster */}
          <div style={{
            position: 'absolute', bottom: 14, left: 28,
            display: 'flex', alignItems: 'center', gap: 5,
            pointerEvents: 'none',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ccff' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: '0.1em',
              color: '#00ccff', opacity: 0.4, textTransform: 'uppercase',
            }}>
              UPLINK_READY
            </span>
          </div>

          <div style={{
            position: 'absolute', bottom: 14, right: 28,
            display: 'flex', alignItems: 'center', gap: 5,
            pointerEvents: 'none',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: '0.1em',
              color: '#77ff62', opacity: 0.4, textTransform: 'uppercase',
            }}>
              SYNC_V.02.9
            </span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#77ff62' }} />
          </div>

        </div>
      </div>
    </div>
  )
}