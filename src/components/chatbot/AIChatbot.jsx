import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const AI_RESPONSES = {
  status: "🟢 Statut global : **14/15 équipements en ligne**. 1 équipement hors ligne (Web-Server-04). Uptime moyen : 99.87%.",
  cpu: "📊 Charge CPU actuelle : **moyenne de 38% sur 15 nœuds**. NY-CORE-SVR-04 est en alerte critique à 92%. Recommandation : vérification immédiate.",
  alerte: "🚨 **3 alertes critiques actives** :\n• NY-CORE-SVR-04 — Packet Loss 24.5%\n• DB-CLUSTER-P01 — Réplique unresponsive\n• ASIA-HK-EDGE — DDoS mitigation active",
  ram: "💾 RAM Utilisation globale : **68.2 GB utilisés**. Système 45%, Cache 25%. Aucun dépassement de seuil détecté.",
  latence: "⚡ Latence réseau globale : **moyenne 42ms**. Peak détecté : 67ms (03:00 AM). Seuils configurés à 150ms.",
  maintenance: "🔧 Mode Maintenance disponible depuis la page Inventory (Admin requis). Sélectionnez un équipement et cliquez sur l'icône pause.",
  rapport: "📄 Les rapports sont générés depuis la page Reports. Format PDF Pro disponible. SLA actuel : 99.9% (objectif 99.95%).",
  sla: "✅ SLA Disponibilité : **99.9%** ce trimestre. Objectif : 99.95%. Léger écart détecté en Mars. Rapport complet disponible.",
  help: "🤖 Je peux répondre à vos questions sur :\n• **status** — état du réseau\n• **cpu** — charge processeur\n• **ram** — mémoire\n• **latence** — délais réseau\n• **alerte** — incidents actifs\n• **sla** — disponibilité\n• **rapport** — exports",
  default: "❓ Je n'ai pas compris votre requête. Tapez **help** pour voir les commandes disponibles, ou posez une question sur le statut réseau."
};

const getResponse = (message) => {
  const m = message.toLowerCase();
  if (m.includes('status') || m.includes('état') || m.includes('etat') || m.includes('online')) return AI_RESPONSES.status;
  if (m.includes('cpu') || m.includes('charge') || m.includes('processeur')) return AI_RESPONSES.cpu;
  if (m.includes('alerte') || m.includes('alert') || m.includes('incident') || m.includes('critique')) return AI_RESPONSES.alerte;
  if (m.includes('ram') || m.includes('mémoire') || m.includes('memoire')) return AI_RESPONSES.ram;
  if (m.includes('latence') || m.includes('latency') || m.includes('délai') || m.includes('ping')) return AI_RESPONSES.latence;
  if (m.includes('maintenance')) return AI_RESPONSES.maintenance;
  if (m.includes('rapport') || m.includes('report') || m.includes('pdf')) return AI_RESPONSES.rapport;
  if (m.includes('sla') || m.includes('disponibilité') || m.includes('uptime')) return AI_RESPONSES.sla;
  if (m.includes('help') || m.includes('aide') || m.includes('?')) return AI_RESPONSES.help;
  return AI_RESPONSES.default;
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '👋 Bonjour ! Je suis votre assistant IA NetServ. Comment puis-je vous aider ? Tapez **help** pour les commandes disponibles.', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

    const botResponse = getResponse(input);
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'bot',
      text: botResponse,
      time: new Date()
    }]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text) => {
    // Bold text between **
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen(prev => !prev)}
        id="chatbot-toggle-btn"
        aria-label="Ouvrir l'assistant IA"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
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
                  En ligne
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={msg.type === 'bot' ? 'msg-bot' : 'msg-user'}>
                {msg.type === 'bot'
                  ? msg.text.split('\n').map((line, i) => (
                    <div key={i}>{formatText(line)}</div>
                  ))
                  : msg.text
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
