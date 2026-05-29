import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { callAI } from '../lib/apiClient';
import wounds from '../data/wounds.json';
import { WOUND_KNOWLEDGE } from '../data/woundKnowledge';
import { buildReprogramSystemPrompt } from '../data/reprogramSystemPrompt';

const STAGE_LABELS = {
  1: 'Belief',
  2: 'Thought',
  3: 'Emotion',
  4: 'Action',
};

const STORAGE_KEY_PREFIX = 'reprogram_session_';

export default function ReprogramChat() {
  const navigate = useNavigate();
  const { woundId } = useParams();
  const messagesEndRef = useRef(null);

  const woundData = wounds.find((w) => w.id === woundId);
  const knowledge = WOUND_KNOWLEDGE[woundId];

  const [currentStage, setCurrentStage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!woundData || !knowledge) {
      navigate('/reprogram');
    }
  }, [woundData, knowledge, navigate]);

  useEffect(() => {
    if (hasInitialized || !woundData || !knowledge) return;
    setHasInitialized(true);

    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + woundId);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setMessages(state.messages || []);
        setApiHistory(state.apiHistory || []);
        setCurrentStage(state.currentStage || 0);
        setIsComplete(state.isComplete || false);
        return;
      } catch {
        // corrupt saved state — start fresh
      }
    }

    requestAIResponse([], 0);
  }, [hasInitialized, woundData, knowledge, woundId]);

  useEffect(() => {
    if (!hasInitialized || messages.length === 0) return;
    localStorage.setItem(
      STORAGE_KEY_PREFIX + woundId,
      JSON.stringify({ messages, apiHistory, currentStage, isComplete })
    );
  }, [messages, apiHistory, currentStage, isComplete, hasInitialized, woundId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const requestAIResponse = async (history, stage) => {
    if (!woundData || !knowledge) return;
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = buildReprogramSystemPrompt(woundData, knowledge);
      const contextData = { systemPrompt, currentStage: stage };

      const aiResponse = await callAI(history, contextData);

      setMessages((prev) => [...prev, { role: 'ai', text: aiResponse.message }]);
      setApiHistory((prev) => [...prev, { role: 'assistant', content: JSON.stringify(aiResponse) }]);

      if (aiResponse.advanceToStage) {
        setCurrentStage(aiResponse.advanceToStage);
      }

      if (aiResponse.isComplete) {
        setIsComplete(true);
        localStorage.removeItem(STORAGE_KEY_PREFIX + woundId);
      }
    } catch (err) {
      console.error('AI request failed:', err);
      setError(err.message || 'Something went wrong reaching the AI. Try again?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading || isComplete) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInputText('');

    const newHistory = [...apiHistory, { role: 'user', content: trimmed }];
    setApiHistory(newHistory);

    requestAIResponse(newHistory, currentStage);
  };

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + woundId);
    setMessages([]);
    setApiHistory([]);
    setCurrentStage(0);
    setIsComplete(false);
    setHasInitialized(false);
  };

  if (!woundData || !knowledge) return null;

  const stageLabel = currentStage > 0 ? `Stage ${currentStage} of 4 · ${STAGE_LABELS[currentStage]}` : 'Opening';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div className="top-bar" style={{ flexShrink: 0 }}>
        <button className="top-bar-action" onClick={() => navigate('/reprogram')}>←</button>
        <div style={{ textAlign: 'center' }}>
          <p className="top-bar-title" style={{ fontSize: '14px' }}>{woundData.wound}</p>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {isComplete ? 'Complete' : stageLabel}
          </p>
        </div>
        <span style={{ width: '24px' }} />
      </div>

      <div
        style={{
          flex: 1,
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--bg-secondary)',
          overflowY: 'auto',
          paddingBottom: '100px',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  background: msg.role === 'user' ? 'var(--accent-info-bg)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? 'var(--accent-info)' : 'var(--text-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3) var(--space-4)',
                  maxWidth: '85%',
                  fontSize: '16px',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            <div
              style={{
                display: 'inline-block',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '15px',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              ...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'rgba(184, 122, 82, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-warm)',
              fontSize: '15px',
            }}
          >
            {error}
          </div>
        )}

        {isComplete && (
          <div className="fade-in" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <button
              onClick={handleStartOver}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
                display: 'block',
                margin: '0 auto var(--space-3)',
              }}
            >
              Work on this wound again
            </button>
            <button
              onClick={() => navigate('/reprogram')}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
              }}
            >
              Choose a different wound
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isComplete && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: '480px',
            margin: '0 auto',
            background: 'var(--bg-primary)',
            padding: 'var(--space-3) var(--space-5) calc(var(--space-3) + env(safe-area-inset-bottom))',
            borderTop: '0.5px solid var(--border-subtle)',
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center',
          }}
        >
          <input
            className="text-input"
            placeholder="Type freely..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) handleSend();
            }}
            disabled={isLoading}
            style={{ borderRadius: 'var(--radius-pill)', minHeight: '48px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            style={{
              width: '48px',
              height: '48px',
              background: inputText.trim() && !isLoading ? 'var(--text-primary)' : 'var(--bg-tertiary)',
              color: 'var(--bg-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
            }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  );
}
