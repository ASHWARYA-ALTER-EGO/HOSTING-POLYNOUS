import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/ask', {
        query: userMessage.content
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error: Cannot connect to backend. Make sure it is running on http://localhost:8000',
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      paddingTop: '20px'
    },
    title: {
      fontSize: '2.5em',
      margin: '0',
      color: '#1a1a1a'
    },
    subtitle: {
      color: '#666',
      fontSize: '1.1em',
      marginTop: '5px'
    },
    chatBox: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
    welcomeTitle: {
      color: '#333',
      marginBottom: '10px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: '20px'
    },
    suggestionBtn: {
      padding: '12px 18px',
      backgroundColor: '#f8f9fa',
      border: '2px solid #e0e0e0',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333'
    },
    messageRow: {
      marginBottom: '16px',
      display: 'flex'
    },
    userBubble: {
      maxWidth: '75%',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      marginLeft: 'auto',
      borderBottomRightRadius: '4px'
    },
    assistantBubble: {
      maxWidth: '75%',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      marginRight: 'auto',
      borderBottomLeftRadius: '4px'
    },
    errorBubble: {
      maxWidth: '75%',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: '#ff4444',
      color: 'white',
      marginRight: 'auto',
      borderBottomLeftRadius: '4px'
    },
    messageRole: {
      fontSize: '0.85em',
      fontWeight: 'bold',
      marginBottom: '5px',
      opacity: 0.8
    },
    messageContent: {
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap'
    },
    sources: {
      marginTop: '10px',
      paddingTop: '10px',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      fontSize: '0.85em'
    },
    sourcesTitle: {
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    sourceItem: {
      margin: '3px 0',
      opacity: 0.7
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: '#999'
    },
    inputForm: {
      display: 'flex',
      gap: '10px'
    },
    input: {
      flex: 1,
      padding: '14px 18px',
      borderRadius: '12px',
      border: '2px solid #e0e0e0',
      fontSize: '16px',
      outline: 'none'
    },
    sendBtn: {
      padding: '14px 28px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    sendBtnDisabled: {
      padding: '14px 28px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#ccc',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'not-allowed'
    },
    footer: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#999',
      fontSize: '0.85em'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 Research Assistant</h1>
        <p style={styles.subtitle}>Powered by Claude AI + Real-time Web Search</p>
      </div>

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <h2 style={styles.welcomeTitle}>Welcome! 👋</h2>
            <p style={{ fontSize: '1.1em', marginBottom: '10px' }}>
              Ask me any research question and I will search the web for answers...
            </p>
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => setInput("What is artificial intelligence?")}
                style={styles.suggestionBtn}
              >
                🤖 What is AI?
              </button>
              <button 
                onClick={() => setInput("How does machine learning work?")}
                style={styles.suggestionBtn}
              >
                🧠 Machine Learning
              </button>
              <button 
                onClick={() => setInput("Latest breakthroughs in quantum computing")}
                style={styles.suggestionBtn}
              >
                ⚛️ Quantum Computing
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const bubbleStyle = msg.role === 'user' 
            ? styles.userBubble 
            : msg.isError 
              ? styles.errorBubble 
              : styles.assistantBubble

          return (
            <div key={idx} style={styles.messageRow}>
              <div style={bubbleStyle}>
                <div style={styles.messageRole}>
                  {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </div>
                <div style={styles.messageContent}>
                  {msg.content}
                </div>
                {msg.sources?.length > 0 && (
                  <div style={styles.sources}>
                    <div style={styles.sourcesTitle}>📚 Sources:</div>
                    {msg.sources.map((s, i) => (
                      <div key={i} style={styles.sourceItem}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {loading && (
          <div style={styles.loading}>
            <div style={{ fontSize: '1.5em', marginBottom: '5px' }}>🤔</div>
            Researching...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a research question..."
          style={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          style={loading ? styles.sendBtnDisabled : styles.sendBtn}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>

      <div style={styles.footer}>
        Backend: http://localhost:8000 | Frontend: http://localhost:5173
      </div>
    </div>
  )
}

export default App