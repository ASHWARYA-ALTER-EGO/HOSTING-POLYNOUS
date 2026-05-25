import LandingPage2 from './components/LandingPage2';
import PdfLabPage from './components/PdfLabPage';
import SemanticSearchPage from './components/SemanticSearchPage'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import OAuthCallback from './components/OAuthCallback';
import MainApp from './components/MainApp';
import MemoryBank from './components/MemoryBank';
import ResearchInterface from './components/ResearchInterface';
import DebateInterface from './components/DebateInterface';
import KnowledgeGraphPage from './components/KnowledgeGraphPage';

// ========== MAIN APP WRAPPER (for pages with sidebar) ==========
function DashboardWrapper({ user, onLogout }) {
  return <MainApp user={user} onLogout={onLogout} currentPage="dashboard" />
}

function MemoryWrapper({ user }) {
  return <MemoryBank user={user} />
}

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
    } else {
      localStorage.clear()
    }
    
    setInitialCheckDone(true)
  }, [])

  // Login handler
  const handleLogin = (data) => {
    console.log('🔑 handleLogin called with:', data)

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

  // Logout handler
  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setUser(null)
  }

  // ========== HANDLE GET STARTED - CHECKS TOKEN FIRST ==========
  const handleGetStarted = () => {
    const token = localStorage.getItem('polynous_token');
    if (token) {
      window.location.href = '/research';
    } else {
      window.location.href = '/auth';
    }
  };

  // Don't render until initial check is done
  if (!initialCheckDone) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a' }}>
        <div style={{ textAlign: 'center', color: '#00ff0f', fontSize: '24px' }}>🧠</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page - Using new LandingPage2 with integrated get started handler */}
        <Route 
          path="/" 
          element={
            isLoggedIn 
              ? <Navigate to="/research" /> 
              : <LandingPage2 
                  onNavigate={(path) => window.location.href = path} 
                  onGetStarted={handleGetStarted}
                />
          } 
        />
        
        {/* Auth Page */}
        <Route 
          path="/auth" 
          element={
            isLoggedIn 
              ? <Navigate to="/research" /> 
              : <AuthPage onLogin={handleLogin} />
          } 
        />
        
        {/* OAuth Callback */}
        <Route 
          path="/auth/callback" 
          element={<OAuthCallback onLogin={handleLogin} />} 
        />
        
        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn 
              ? <DashboardWrapper user={user} onLogout={handleLogout} /> 
              : <Navigate to="/auth" />
          } 
        />

        {/* Research Interface */}
        <Route 
          path="/research" 
          element={
            isLoggedIn 
              ? <ResearchInterface user={user} onNavigate={(path) => window.location.href = path} />
              : <Navigate to="/auth" />
          } 
        />

        {/* Debate Interface */}
        <Route 
          path="/debate" 
          element={
            isLoggedIn 
              ? <DebateInterface 
                  user={user} 
                  onNavigate={(path) => window.location.href = path} 
                />
              : <Navigate to="/auth" />
          } 
        />

        {/* Knowledge Graph - UPDATED with all props */}
        <Route 
          path="/graph" 
          element={
            isLoggedIn 
              ? <KnowledgeGraphPage 
                  user={user} 
                  onStartResearch={(topic) => window.location.href = `/research?query=${encodeURIComponent(topic)}`}
                  onNavigate={(path) => window.location.href = path}
                  onLogout={handleLogout}
                />
              : <Navigate to="/auth" />
          } 
        />

        {/* Memory Bank */}
        <Route 
          path="/memory" 
          element={
            isLoggedIn 
              ? <MemoryWrapper user={user} /> 
              : <Navigate to="/auth" />
          } 
        />

        {/* Semantic Search */}
        <Route 
          path="/search" 
          element={
            isLoggedIn 
              ? <SemanticSearchPage 
                  user={user} 
                  onStartResearch={(topic) => window.location.href = `/research?query=${encodeURIComponent(topic)}`}
                  onNavigate={(path) => window.location.href = path}
                />
              : <Navigate to="/auth" />
          } 
        />

        {/* PDF Lab - Research Paper Processing */}
        <Route 
          path="/pdf-lab" 
          element={
            isLoggedIn 
              ? <PdfLabPage 
                  user={user} 
                  onNavigate={(p) => window.location.href = p} 
                  onLogout={handleLogout} 
                />
              : <Navigate to="/auth" />
          } 
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}