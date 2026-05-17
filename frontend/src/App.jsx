import { useState, useRef, useEffect } from 'react'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [debateMode, setDebateMode] = useState(false)
  const [currentAgent, setCurrentAgent] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input, mode: debateMode ? '🗣️ Debate' : '🔬 Research' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setCurrentAgent('Searching...')

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content, debate_mode: debateMode })
      })
      
      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence || 0,
        contradictions: data.contradictions || [],
        debate_verdict: data.debate_verdict || null,
        isDebate: debateMode
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error connecting to backend. Is it running?',
        isError: true
      }])
    } finally {
      setLoading(false)
      setCurrentAgent('')
    }
  }

  const getConfidenceColor = (score) => {
    if (score >= 80) return '#4CAF50'
    if (score >= 60) return '#FF9800'
    if (score >= 40) return '#FF5722'
    return '#f44336'
  }

  const getConfidenceEmoji = (score) => {
    if (score >= 80) return '🟢'
    if (score >= 60) return '🟡'
    if (score >= 40) return '🟠'
    return '🔴'
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 Multi-Agent Research Assistant</h1>
        <p style={styles.subtitle}>7 AI Agents Working Together</p>
      </div>

      {/* Debate Toggle */}
      <div style={styles.toggleContainer}>
        <button
          onClick={() => setDebateMode(false)}
          style={{
            ...styles.toggleBtn,
            backgroundColor: !debateMode ? '#007bff' : '#f0f0f0',
            color: !debateMode ? 'white' : '#333'
          }}
        >
          🔬 Research Mode
        </button>
        <button
          onClick={() => setDebateMode(true)}
          style={{
            ...styles.toggleBtn,
            backgroundColor: debateMode ? '#9C27B0' : '#f0f0f0',
            color: debateMode ? 'white' : '#333'
          }}
        >
          🗣️ Debate Mode
        </button>
      </div>

      {/* Chat Area */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <h2>Welcome! 👋</h2>
            <p>Select mode and ask a research question</p>
            <div style={styles.suggestions}>
              <button onClick={() => setInput("What is artificial intelligence?")} style={styles.suggestionBtn}>
                🤖 What is AI?
              </button>
              <button onClick={() => setInput("Is nuclear energy safe?")} style={styles.suggestionBtn}>
                ⚛️ Nuclear Energy?
              </button>
              <button onClick={() => setInput("Should we colonize Mars?")} style={styles.suggestionBtn}>
                🚀 Colonize Mars?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={{
            ...styles.messageRow,
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              ...styles.bubble,
              backgroundColor: msg.role === 'user' ? '#007bff' : 
                             msg.isError ? '#ff4444' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
              border: msg.role === 'assistant' && !msg.isError ? '1px solid #e0e0e0' : 'none'
            }}>
              <div style={styles.messageHeader}>
                {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                {msg.mode && <span style={styles.modeBadge}>{msg.mode}</span>}
              </div>
              <div style={styles.messageContent}>{msg.content}</div>
              
              {/* Confidence Badge */}
              {msg.confidence > 0 && (
                <div style={{
                  ...styles.confidenceBadge,
                  backgroundColor: getConfidenceColor(msg.confidence) + '20',
                  borderColor: getConfidenceColor(msg.confidence)
                }}>
                  {getConfidenceEmoji(msg.confidence)} Confidence: {msg.confidence}%
                </div>
              )}

              {/* Debate Verdict */}
              {msg.debate_verdict && (
                <div style={styles.verdictBox}>
                  <div style={styles.verdictTitle}>⚖️ DEBATE RESULT</div>
                  <div style={{
                    ...styles.verdictWinner,
                    color: msg.debate_verdict.winner === 'FOR' ? '#4CAF50' : 
                           msg.debate_verdict.winner === 'AGAINST' ? '#f44336' : '#FF9800'
                  }}>
                    Winner: {msg.debate_verdict.winner}
                  </div>
                  <div style={styles.verdictScores}>
                    <span>🟢 FOR: {msg.debate_verdict.for_score}/10</span>
                    <span>🔴 AGAINST: {msg.debate_verdict.against_score}/10</span>
                  </div>
                  <div style={styles.verdictReasoning}>
                    {msg.debate_verdict.reasoning}
                  </div>
                </div>
              )}

              {/* Sources */}
              {msg.sources?.length > 0 && (
                <div style={styles.sources}>
                  <strong>📚 Sources:</strong>
                  {msg.sources.map((s, i) => (
                    <div key={i} style={styles.sourceItem}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}>⚡</div>
            <div style={styles.loadingText}>{currentAgent}</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={debateMode ? "Enter a proposition to debate..." : "Ask a research question..."}
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{
          ...styles.sendBtn,
          backgroundColor: loading ? '#ccc' : (debateMode ? '#9C27B0' : '#007bff')
        }}>
          {loading ? '⏳' : 'Send'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '850px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    paddingTop: '10px'
  },
  title: {
    fontSize: '2em',
    margin: '0',
    color: '#1a1a1a'
  },
  subtitle: {
    color: '#666',
    margin: '5px 0 0 0'
  },
  toggleContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  toggleBtn: {
    padding: '10px 20px',
    borderRadius: '25px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  chatBox: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '20px',
    minHeight: '400px',
    maxHeight: '500px',
    overflowY: 'auto',
    marginBottom: '20px'
  },
  welcome: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  suggestions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '20px'
  },
  suggestionBtn: {
    padding: '10px 16px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  messageRow: {
    display: 'flex',
    marginBottom: '16px'
  },
  bubble: {
    maxWidth: '80%',
    padding: '14px 18px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  messageHeader: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '6px',
    opacity: 0.7,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  modeBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: '#e0e0e0'
  },
  messageContent: {
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    fontSize: '14px'
  },
  confidenceBadge: {
    marginTop: '10px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block'
  },
  verdictBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8f4ff',
    borderRadius: '8px',
    border: '1px solid #e0d0f0'
  },
  verdictTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '8px'
  },
  verdictWinner: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '6px'
  },
  verdictScores: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    marginBottom: '6px'
  },
  verdictReasoning: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic'
  },
  sources: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
    fontSize: '12px'
  },
  sourceItem: {
    margin: '3px 0',
    color: '#666'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '20px'
  },
  loadingSpinner: {
    fontSize: '24px',
    animation: 'spin 1s infinite'
  },
  loadingText: {
    color: '#666',
    fontSize: '13px',
    marginTop: '5px'
  },
  inputForm: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: '25px',
    border: '2px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none'
  },
  sendBtn: {
    padding: '14px 28px',
    borderRadius: '25px',
    border: 'none',
    color: 'white',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
}

export default App