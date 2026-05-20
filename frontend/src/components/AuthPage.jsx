import { useState } from 'react'

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const body = isLogin 
        ? { email, password }
        : { email, username, password }

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Something went wrong')
        return
      }

      // Save token
      localStorage.setItem('polynous_token', data.token)
      localStorage.setItem('polynous_user', JSON.stringify({
        username: data.username || username,
        email: email
      }))

      // Call parent callback
      if (onLogin) onLogin(data)
    } catch (err) {
      setError('Connection error. Is backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'radial-gradient(ellipse at center, #0a0a2e 0%, #0a0a1a 100%)',
      fontFamily: 'Inter, Segoe UI, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🧠</div>
          <h1 style={{ color: '#fff', fontSize: '1.8em', margin: '0 0 4px' }}>POLYNOUS</h1>
          <p style={{ color: '#888', fontSize: '13px' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: isLogin ? '#00ff0f' : 'transparent',
              color: isLogin ? '#0a0a1a' : '#888',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.3s'
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: !isLogin ? '#00ff0f' : 'transparent',
              color: !isLogin ? '#0a0a1a' : '#888',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.3s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,50,50,0.1)',
            border: '1px solid rgba(255,50,50,0.3)', color: '#ff4444', fontSize: '13px', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
              style={inputStyle}
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {/* OAuth Buttons - Added Here */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#666', fontSize: '12px' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Google Button */}
              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:8000/oauth/google'}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:8000/oauth/github'}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? '#333' : '#00ff0f',
              color: loading ? '#888' : '#0a0a1a',
              fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px', transition: 'all 0.3s'
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Skip */}
        <button
          onClick={() => onLogin({ skip: true })}
          style={{
            width: '100%', padding: '10px', background: 'transparent', border: 'none',
            color: '#666', cursor: 'pointer', fontSize: '12px', marginTop: '16px'
          }}
        >
          Skip for now → Continue as guest
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  marginBottom: '12px',
  display: 'block'
}