import { useEffect } from 'react'

export default function OAuthCallback({ onLogin }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const username = params.get('username')
    const email = params.get('email')

    if (token) {
      localStorage.setItem('polynous_token', token)
      localStorage.setItem('polynous_user', JSON.stringify({ username, email }))
      onLogin({ token, username, email })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0a0a1a', color: '#fff', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
        <h2>Logging you in...</h2>
        <p style={{ color: '#888' }}>Please wait while we set up your account.</p>
      </div>
    </div>
  )
}