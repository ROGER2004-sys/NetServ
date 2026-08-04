import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = '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';
const MODEL_NAME = 'llama-3.1-8b-instant';
const SYSTEM_PROMPT = "Tu es un assistant virtuel général, utile et poli. Tu réponds de manière claire et concise aux questions de l'utilisateur.";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Messages pour l'affichage (sans le prompt système)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Bonjour ! Je suis votre assistant IA NetServ. Comment puis-je vous aider ?' }
  ]);
  
  // Historique complet pour l'API (inclut le prompt système)
  const [apiHistory, setApiHistory] = useState([
    { role: 'system', content: SYSTEM_PROMPT }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    const userMsg = { role: 'user', content: userText };
    
    // Mettre à jour l'interface utilisateur
    setMessages(prev => [...prev, userMsg]);
    
    // Mettre à jour l'historique de l'API
    const newApiHistory = [...apiHistory, userMsg];
    setApiHistory(newApiHistory);
    
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: newApiHistory
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errData}`);
      }

      const data = await response.json();
      const botReply = data.choices[0].message.content;

      // Ajouter la réponse à l'historique de l'API
      setApiHistory(prev => [...prev, { role: 'assistant', content: botReply }]);
      
      // Afficher la réponse dans l'interface
      setMessages(prev => [...prev, { role: 'assistant', content: botReply }]);
    } catch (error) {
      console.error("Groq API Error:", error);
      const errorMsg = `❌ Désolé, je n'arrive pas à joindre le serveur d'IA (Groq Cloud). Détail: ${error.message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      // En cas d'erreur, on n'ajoute pas le message d'erreur à apiHistory pour ne pas perturber le contexte LLM.
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text) => {
    // Formatage basique pour le texte en gras entre **
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen(prev => !prev)}
        id="chatbot-toggle-btn"
        aria-label="Ouvrir l'assistant IA"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="chatbot-window">
          {/* En-tête */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={18} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Assistant IA NetServ</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  En ligne (Groq)
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={msg.role === 'assistant' ? 'msg-bot' : 'msg-user'}>
                {msg.role === 'assistant'
                  ? msg.content.split('\n').map((line, i) => (
                    <div key={i}>{formatText(line)}</div>
                  ))
                  : msg.content
                }
              </div>
            ))}
            {isTyping && (
              <div className="msg-bot" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
                    animation: `pulse-dot 1s ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Posez une question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              id="chatbot-input-field"
            />
            <button
              onClick={sendMessage}
              className="btn-primary"
              style={{ padding: '8px 12px', minWidth: 'auto' }}
              id="chatbot-send-btn"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
