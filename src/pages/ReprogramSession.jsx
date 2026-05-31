import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import wounds from '../data/wounds.json';
import { saveEntry } from '../lib/storage';
import { getSessionCountByWound } from '../lib/streaks';

// Calls the dedicated /api/reprogram endpoint
async function callReprogrammingAI({ history, wound, opposite, teaching, sessionNumber, requestType }) {
  const response = await fetch('/api/reprogram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history,
      wound,
      opposite,
      teaching,
      sessionNumber,
      requestType: requestType || 'session',
    }),
  });
  if (!response.ok) {
    throw new Error('AI call failed');
  }
  const data = await response.json();

  // Strip markdown code fences that the model sometimes wraps JSON in,
  // even when instructed not to. Match ```json ... ``` or ``` ... ```
  let cleaned = (data.message || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
    cleaned = cleaned.trim();
  }

  // Parse the JSON response
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response as JSON. Raw:', cleaned);
    // Fallback: show whatever text came back as a message
    return {
      message: cleaned || data.message,
      currentArea: null,
      recordedExample: null,
      isComplete: false,
      finalStatements: null,
    };
  }
}

export default function ReprogramSession() {
  const navigate = useNavigate();
  const { woundId } = useParams();
  const messagesEndRef = useRef(null);

  const [woundData, setWoundData] = useState(null);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [messages, setMessages] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);
  const [chipsApplicable, setChipsApplicable] = useState(false);
  const [recordedExamples, setRecordedExamples] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Find the wound data on mount + compute session number
  useEffect(() => {
    const w = wounds.find((x) => x.id === woundId);
    if (!w) {
      navigate('/reprogram');
      return;
    }
    setWoundData(w);
    // Session number = previous sessions for this wound + 1
    const counts = getSessionCountByWound();
    setSessionNumber((counts[w.wound] || 0) + 1);
  }, [woundId, navigate]);

  // Start the session — send opening message to AI
  useEffect(() => {
    if (!woundData || hasStarted) return;
    setHasStarted(true);
    const seedMessage = `I'm ready to start a reprogramming session for the wound "${woundData.wound}" and rewire toward "${woundData.opposite}".`;
    const initialHistory = [{ role: 'user', content: seedMessage }];
    setApiHistory(initialHistory);
    requestAIResponse(initialHistory, 'session');
  }, [woundData, hasStarted]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const requestAIResponse = async (history, requestType = 'session') => {
    if (!woundData) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await callReprogrammingAI({
        history,
        wound: woundData.wound,
        opposite: woundData.opposite,
        teaching: woundData.teaching,
        sessionNumber,
        requestType,
      });

      setMessages((prev) => [...prev, { role: 'ai', text: result.message }]);
      setApiHistory((prev) => [...prev, { role: 'assistant', content: JSON.stringify(result) }]);

      // Only update currentArea for actual area transitions — NOT for qa or teaching_summary
      // This prevents Q&A questions from advancing the session
      if (result.currentArea && result.currentArea !== 'qa' && result.currentArea !== 'teaching_summary') {
        setCurrentArea(result.currentArea);
      }

      // Track whether chips should show — only true when AI just asked a fresh area prompt
      setChipsApplicable(result.chipsApplicable === true);

      if (result.recordedExample) {
        setRecordedExamples((prev) => ({
          ...prev,
          [result.recordedExample.area]: result.recordedExample.text,
        }));
      }

      if (result.isComplete && result.finalStatements) {
        finishSession(result.finalStatements);
      }
    } catch (err) {
      console.error('Reprogramming AI failed:', err);
      setError('Something went wrong. Tap retry to try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = (finalStatements) => {
    if (isFinished) return;
    setIsFinished(true);

    const completedAreas = Object.keys(recordedExamples).length;

    // Save the reprogramming session as a single entry
    const sessionEntry = {
      status: 'reprogramming',
      wound: woundData.wound,
      opposite: woundData.opposite,
      statements: finalStatements || Object.values(recordedExamples),
      completedAreas,
      chatHistory: messages,
    };
    saveEntry(sessionEntry);

    // Also save each statement as a bank entry (good_moment) so they show up
    // in Step 4 retrieval during future processing sessions
    (finalStatements || Object.values(recordedExamples)).forEach((statement) => {
      saveEntry({
        status: 'good_moment',
        source: 'reprogramming',
        situation: statement,
        woundOpposites: [woundData.opposite],
        emotions: [],
      });
    });
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInputText('');
    setChipsApplicable(false);
    const newHistory = [...apiHistory, { role: 'user', content: trimmed }];
    setApiHistory(newHistory);
    requestAIResponse(newHistory);
  };

  const handleSkipArea = () => {
    if (isLoading) return;
    setMessages((prev) => [...prev, { role: 'user', text: 'Skip this area' }]);
    setChipsApplicable(false);
    const newHistory = [...apiHistory, { role: 'user', content: 'skip' }];
    setApiHistory(newHistory);
    requestAIResponse(newHistory);
  };

  const handleNeedPrompt = () => {
    if (isLoading || !woundData) return;
    const prompts = woundData.gentlePrompts || [];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)] || 'Take your time.';
    setMessages((prev) => [...prev, { role: 'user', text: 'Need more help' }]);
    setChipsApplicable(false);
    const newHistory = [...apiHistory, {
      role: 'user',
      content: `I'm stuck. Can you offer a gentle prompt or come at this from a different angle? Reference: "${prompt}"`,
    }];
    setApiHistory(newHistory);
    requestAIResponse(newHistory);
  };

  const handleDone = () => {
    if (isFinished) {
      navigate('/');
    }
  };

  if (!woundData) {
    return <div className="app-content">Loading...</div>;
  }

  const completedCount = Object.keys(recordedExamples).length;
  // Chips show only when AI explicitly signals it just asked a fresh area prompt
  const showChips = chipsApplicable && !isLoading && !isFinished;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div className="top-bar" style={{ flexShrink: 0 }}>
        <button className="top-bar-action" onClick={() => navigate('/reprogram')}>←</button>
        <div style={{ textAlign: 'center' }}>
          <p className="top-bar-title">Reprogramming</p>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {woundData.opposite} · {completedCount} of 7
          </p>
        </div>
        <span style={{ width: '24px' }}></span>
      </div>

      <div
        style={{
          flex: 1,
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--bg-secondary)',
          overflowY: 'auto',
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
                  background: msg.role === 'user' ? 'rgba(120, 145, 175, 0.15)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? 'rgb(80, 105, 140)' : 'var(--text-primary)',
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

        {/* Helper chips — only show when AI just asked a fresh area prompt */}
        {showChips && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              onClick={handleSkipArea}
              className="chip"
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border-subtle)',
                fontSize: '13px',
              }}
            >
              Skip this area
            </button>
            <button
              onClick={handleNeedPrompt}
              className="chip"
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border-subtle)',
                fontSize: '13px',
              }}
            >
              Need more help
            </button>
          </div>
        )}

        {/* Done button — only when session is complete */}
        {isFinished && (
          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <button
              className="btn-primary"
              onClick={handleDone}
              style={{ maxWidth: '200px', margin: '0 auto' }}
            >
              Done
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — hidden when session is complete */}
      {!isFinished && (
        <div
          style={{
            flexShrink: 0,
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(); }}
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
