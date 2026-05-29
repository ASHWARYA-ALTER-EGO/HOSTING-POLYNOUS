import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Page imports
import GraphFeatureShowcase from './components/GraphFeatureShowcase'
import KnowledgeGraph3D from './components/KnowledgeGraph3D'
import LandingPage2 from './components/LandingPage2';
import AuthPage from './components/AuthPage';
import OAuthCallback from './components/OAuthCallback';
import MainApp from './components/MainApp';
import MemoryBank from './components/MemoryBank';
import ResearchInterface from './components/ResearchInterface';
import DebateInterface from './components/DebateInterface';
import KnowledgeGraphPage from './components/KnowledgeGraphPage';
import SemanticSearchPage from './components/SemanticSearchPage';
import PdfLabPage from './components/PdfLabPage';
import PolynousDashboard from './components/PolynousDashboard';

// ========== GLOBAL AUTH STATE ==========
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  // Check for existing login on mount
  useEffect(() => {
    const token = localStorage.getItem('polynous_token')
    const userData = localStorage.getItem('polynous_user')
    
    if (token && token !== 'guest_token' && userData) {
      try {
        const parsed = JSON.parse(userData)
        if (parsed.email && parsed.email !== 'guest@polynous.ai') {
          setIsLoggedIn(true)
          setUser(parsed)
        } else {
          localStorage.clear()
        }
      } catch (e) {
        localStorage.clear()
      }
    }
    
    setInitialCheckDone(true)
  }, [])

  // ========== AUTH HANDLERS ==========
  const handleLogin = (data) => {
    if (data?.skip) {
      const guestUser = { username: 'Guest', email: 'guest@polynous.ai', isGuest: true }
      localStorage.setItem('polynous_token', 'guest_' + Date.now())
      localStorage.setItem('polynous_user', JSON.stringify(guestUser))
      setIsLoggedIn(true)
      setUser(guestUser)
    } else if (data?.token) {
      const userData = { username: data.username || 'User', email: data.email || '', isGuest: false }
      localStorage.setItem('polynous_token', data.token)
      localStorage.setItem('polynous_user', JSON.stringify(userData))
      setIsLoggedIn(true)
      setUser(userData)
    } else if (data?.username) {
      const userData = { username: data.username, email: data.email || '', isGuest: false }
      if (data.token) localStorage.setItem('polynous_token', data.token)
      localStorage.setItem('polynous_user', JSON.stringify(userData))
      setIsLoggedIn(true)
      setUser(userData)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setUser(null)
    window.location.href = '/'
  }

  const handleGetStarted = () => {
    const token = localStorage.getItem('polynous_token')
    if (token) {
      window.location.href = '/research'
    } else {
      window.location.href = '/auth'
    }
  }

  // ========== NAVIGATION HELPERS ==========
  const navigateTo = (path) => {
    window.location.href = path
  }

  const startResearch = (topic) => {
    window.location.href = `/research?query=${encodeURIComponent(topic)}`
  }

  // ========== LOADING STATE ==========
  if (!initialCheckDone) {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', background: '#0a0a1e', flexDirection: 'column', gap: 16 
      }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: '50%', 
          border: '3px solid rgba(0,255,15,0.15)', borderTop: '3px solid #00ff0f',
          animation: 'spin 1s linear infinite' 
        }} />
        <div style={{ color: '#00ff0f', fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 14 }}>
          Initializing POLYNOUS
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            isLoggedIn 
              ? <Navigate to="/research" replace /> 
              : <LandingPage2 onNavigate={navigateTo} onGetStarted={handleGetStarted} />
          } 
        />
        
        {/* Auth Page */}
        <Route 
          path="/auth" 
          element={
            isLoggedIn 
              ? <Navigate to="/research" replace /> 
              : <AuthPage onLogin={handleLogin} />
          } 
        />
        
        {/* OAuth Callback */}
        <Route 
          path="/auth/callback" 
          element={<OAuthCallback onLogin={handleLogin} />} 
        />

        {/* ========== PROTECTED ROUTES ========== */}
        
        {/* Research Interface */}
        <Route 
          path="/research" 
          element={
            isLoggedIn 
              ? <ResearchInterface 
                  user={user} 
                  onNavigate={navigateTo} 
                  onStartResearch={startResearch}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* Debate Interface */}
        <Route 
          path="/debate" 
          element={
            isLoggedIn 
              ? <DebateInterface 
                  user={user} 
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* Knowledge Graph */}
        <Route 
          path="/graph" 
          element={
            isLoggedIn 
              ? <KnowledgeGraphPage 
                  user={user} 
                  onStartResearch={startResearch}
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* 3D Knowledge Graph */}
        <Route 
          path="/graph3d" 
          element={
            isLoggedIn 
              ? <KnowledgeGraph3D 
                  onSwitchTo2D={() => window.location.href = '/graph'} 
                />
              : <Navigate to="/auth" />
          } 
        />

        {/* Graph Feature Showcase */}
        <Route 
          path="/graph-lab" 
          element={
            isLoggedIn 
              ? <GraphFeatureShowcase />
              : <Navigate to="/auth" />
          } 
        />

        {/* Memory Bank */}
        <Route 
          path="/memory" 
          element={
            isLoggedIn 
              ? <MemoryBank 
                  user={user}
                  onNavigate={navigateTo}
                  onStartResearch={startResearch}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* Semantic Search */}
        <Route 
          path="/search" 
          element={
            isLoggedIn 
              ? <SemanticSearchPage 
                  user={user} 
                  onStartResearch={startResearch}
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* PDF Lab */}
        <Route 
          path="/pdf-lab" 
          element={
            isLoggedIn 
              ? <PdfLabPage 
                  user={user} 
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* Analytics Dashboard */}
        <Route 
          path="/analytics" 
          element={
            isLoggedIn 
              ? <PolynousDashboard 
                  user={user} 
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" replace />
          } 
        />

        {/* ========== CATCH-ALL ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}