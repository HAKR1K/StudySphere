import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5001';

// ── Quick Start Suggestions ──
const SUGGESTIONS = [
    { label: 'Explain React Hooks', icon: '⚓' },
    { label: 'Summarize my DSA Roadmap', icon: '📂' },
    { label: 'Give me a Quiz on Physics', icon: '📝' },
    { label: 'Debug my Python Code', icon: '🐍' }
];

export default function AIAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    // Initial greeting from backend
    useEffect(() => {
        fetch(`${API_BASE}/api/ai-chat`)
            .then(res => res.json())
            .then(data => {
                setMessages([
                    { 
                        sender: 'ai', 
                        text: `Hello! I'm your StudySphere AI Tutor. ${data.message || ''} I'm connected to your subjects. How can I assist you today?`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                setLoading(false);
            })
            .catch(() => {
                setMessages([{ sender: 'ai', text: "Offline: I'm having trouble connecting to the brain center. Please check your backend." }]);
                setLoading(false);
            });
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (textOverride) => {
        const messageText = textOverride || input;
        if (!messageText.trim()) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add user message
        const userMsg = { sender: 'user', text: messageText, time: timestamp };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Real API Call to your Node.js backend
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                sender: 'ai', 
                text: data.reply || "I'm sorry, I couldn't process that.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'ai', text: "⚠️ Connection Error. Ensure your server is running on port 5001." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="module-page" style={layoutStyle}>
            {/* Header */}
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>AI Tutor</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Personalized intelligence for your study journey.</p>
                </div>
                <button 
                    onClick={() => setMessages([messages[0]])} 
                    style={clearButtonStyle}
                >
                    Clear Chat
                </button>
            </header>

            <div style={chatContainerStyle}>
                {/* Chat History */}
                <div style={historyStyle}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{ 
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
                            maxWidth: '80%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            animation: 'slideUp 0.3s ease'
                        }}>
                            <div style={{
                                padding: '14px 18px',
                                background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-base)',
                                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                                borderRadius: '18px',
                                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
                                borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '18px',
                                border: msg.sender === 'ai' ? '1px solid var(--border)' : 'none',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.text}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                {msg.time}
                            </span>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div style={typingIndicatorStyle}>
                            <span></span><span></span><span></span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Suggestions Bar */}
                {messages.length < 3 && (
                    <div style={suggestionsBarStyle}>
                        {SUGGESTIONS.map((s, i) => (
                            <button key={i} onClick={() => handleSend(s.label)} style={suggestionChipStyle}>
                                {s.icon} {s.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={inputAreaStyle}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Describe what you're struggling with..."
                        style={inputFieldStyle}
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={isTyping || !input.trim()} style={sendButtonStyle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Styles ──
const layoutStyle = { height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto' };
const chatContainerStyle = { flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' };
const historyStyle = { flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' };
const inputAreaStyle = { padding: '20px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '15px', alignItems: 'center' };
const inputFieldStyle = { flex: 1, padding: '16px 24px', borderRadius: '15px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' };
const sendButtonStyle = { width: '50px', height: '50px', borderRadius: '14px', background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const suggestionChipStyle = { padding: '8px 16px', borderRadius: '99px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' };
const suggestionsBarStyle = { display: 'flex', gap: '10px', padding: '10px 24px', overflowX: 'auto', borderTop: '1px solid var(--border)' };
const clearButtonStyle = { padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' };
const typingIndicatorStyle = { display: 'flex', gap: '4px', padding: '12px 18px', background: 'var(--bg-base)', borderRadius: '15px', width: 'fit-content' };