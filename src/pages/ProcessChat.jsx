import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllEntries, saveEntry } from '../lib/storage';
import { callAI } from '../lib/apiClient';
import { retrieveBankMatches } from '../lib/retrieval';
import wounds from '../data/wounds.json';
import emotions from '../data/emotions.json';
import needs from '../data/needs.json';
import defaults from '../data/defaults.json';
import ShowAllSheet from '../components/ShowAllSheet';
import EvidenceCard from '../components/EvidenceCard';

const STEP_LABELS = {
  1: 'the situation',
  2: 'the meaning',
  3: 'questioning the story',
  4: 'opposing proofs',
  5: 'the unmet need',
  6: 'a healthy strategy',
};

export default function ProcessChat() {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const messagesEndRef = useRef(null);

  const [entry, setEntry] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stepData, setStepData] = useState({
    emotions: [],
    wounds: [],
    needs: [],
    proofs: [],
    strategy: '',
  });

  const [activeChips, setActiveChips] = useState({ type: null, suggestions: null });
  const [showAllSheet, setShowAllSheet] = useState(null);
  const [apiHistory, setApiHistory] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  const allWoundsList = useMemo(() => wounds.map((w) => w.wound), []);
  const allEmotionsList = useMemo(() => emotions.map((e) => e.emotion), []);
  const allNeedsList = useMemo(() => needs.map((n) => n.need), []);

  const getWoundData = (woundText) => wounds.find((w) => w.wound === woundText);

  // Initial load — restore saved chat state if it exists
  useEffect(() => {
    if (hasInitialized) return;

    const allEntries = getAllEntries();
    const found = allEntries.find((e) => e.id === entryId);

    if (!found) {
      navigate('/process');
      return;
    }

    setEntry(found);
    setHasInitialized(true);

    // If we have saved chat state, restore everything silently — no re-greeting
    if (found.chatState) {
      const cs = found.chatState;
      setMessages(cs.messages || []);
      setApiHistory(cs.apiHistory || []);
      setCurrentStep(cs.currentStep || 1);
      setStepData(cs.stepData || { emotions: [], wounds: [], needs: [], proofs: [], strategy: '' });
      setActiveChips(cs.activeChips || { type: null, suggestions: null });
      return;
    }

    // No saved chat state — set up a fresh session
    const hasWound = (found.wounds || []).length > 0;
    const hasEmotion = (found.emotions || []).length > 0;
    const hasSituation = found.situation && found.situation.trim().length > 0;

    setStepData((prev) => ({
      ...prev,
      emotions: found.emotions || [],
      wounds: found.wounds || [],
    }));

    if (hasWound && hasEmotion) {
      // Full capture — skip ahead to Step 3 (after the AI acknowledges Step 2)
      setCurrentStep(2);
      const seedMessage = `I just captured this trigger and want to process it now. Situation: "${found.situation}". I named the wounds as: ${found.wounds.join(', ')}. I'm feeling: ${found.emotions.join(', ')}.${found.contextNote ? ` Context: ${found.contextNote}.` : ''}`;

      const initialHistory = [{ role: 'user', content: seedMessage }];
      setApiHistory(initialHistory);
      requestAIResponse(initialHistory, { currentStep: 2, entryData: found });
    } else if (hasSituation && hasEmotion) {
      // Situation + emotions, no wound — AI should help identify the wound at Step 2
      setCurrentStep(2);
      const seedMessage = `I just captured this trigger and want to process it now. Situation: "${found.situation}". I'm feeling: ${found.emotions.join(', ')}.${found.contextNote ? ` Context: ${found.contextNote}.` : ''} I haven't named the belief underneath yet — help me find it.`;

      const initialHistory = [{ role: 'user', content: seedMessage }];
      setApiHistory(initialHistory);
      requestAIResponse(initialHistory, { currentStep: 2, entryData: found });
    } else if (hasSituation) {
      // Just situation — AI should start with emotions at Step 1
      setCurrentStep(1);
      const seedMessage = `I just captured this trigger and want to process it now. Situation: "${found.situation}".${found.contextNote ? ` Context: ${found.contextNote}.` : ''} I haven't named the emotions or belief yet — let's work through it.`;

      const initialHistory = [{ role: 'user', content: seedMessage }];
      setApiHistory(initialHistory);
      requestAIResponse(initialHistory, { currentStep: 1, entryData: found });
    } else {
      // Nothing captured — start completely fresh
      setCurrentStep(1);
      setMessages([
        { role: 'ai', text: "What's sitting with you? Take me back to the moment." },
      ]);
    }
  }, [entryId, hasInitialized, navigate]);

  // Persist chat state whenever it changes — this is the auto-save
  useEffect(() => {
    if (!hasInitialized || !entry) return;
    // Don't save if the entry is already complete
    if (entry.status === 'processed') return;
    // Don't save the empty initial state before any interaction
    if (messages.length === 0) return;

    saveEntry({
      ...entry,
      status: 'processing',
      chatState: {
        messages,
        apiHistory,
        currentStep,
        stepData,
        activeChips,
      },
    });
  }, [messages, apiHistory, currentStep, stepData, activeChips, hasInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const requestAIResponse = async (history, contextData) => {
    setIsLoading(true);
    setError(null);

    try {
      const enrichedContext = {
        ...contextData,
        canonicalLists: {
          wounds: allWoundsList,
          emotions: allEmotionsList,
          needs: allNeedsList,
          defaultEmotionChips: defaults.defaultEmotionChips,
          defaultWoundChips: defaults.defaultWoundChips,
          defaultNeedChips: defaults.defaultNeedChips,
        },
      };

      const aiResponse = await callAI(history, enrichedContext);

      // If we passed evidenceCards to attach, include them on the AI message
      const aiMessage = {
        role: 'ai',
        text: aiResponse.message,
        evidenceCards: contextData.attachEvidenceCards || null,
      };

      setMessages((prev) => [...prev, aiMessage]);

      setApiHistory((prev) => [
        ...prev,
        { role: 'assistant', content: JSON.stringify(aiResponse) },
      ]);

      // If evidence was surfaced, set up the response chips for "These help" / "Generate my own"
      if (contextData.attachEvidenceCards) {
        setActiveChips({
          type: 'evidenceResponse',
          suggestions: ['These help', 'Generate my own'],
        });
      } else if (aiResponse.chipType && aiResponse.chipSuggestions) {
        setActiveChips({
          type: aiResponse.chipType,
          suggestions: aiResponse.chipSuggestions,
        });
      } else {
        setActiveChips({ type: null, suggestions: null });
      }

      if (aiResponse.advanceToStep) {
        setCurrentStep(aiResponse.advanceToStep);
      }

      if (aiResponse.isComplete) {
        finishProcessing(aiResponse.finalEntry);
      }
    } catch (err) {
      console.error('AI request failed:', err);
      setError(err.message || 'Something went wrong reaching the AI. Try again?');
    } finally {
      setIsLoading(false);
    }
  };

  const finishProcessing = (finalEntry) => {
    if (!entry) return;

    // Use the AI's structured finalEntry if available, fall back to stepData
    const entryToSave = {
      ...entry,
      status: 'processed',
      situation: entry.situation,
      wounds: finalEntry?.wounds || stepData.wounds,
      emotions: finalEntry?.emotions || stepData.emotions,
      proofs: finalEntry?.proofs || stepData.proofs,
      needs: finalEntry?.needs || stepData.needs,
      strategy: finalEntry?.strategy || stepData.strategy,
      processedAt: new Date().toISOString(),
      // Preserve the chat history with the processed entry for future reference
      chatHistory: messages,
      // Clear the in-flight chat state since we're done
      chatState: null,
    };

    saveEntry(entryToSave);
  };

  const toggleSelection = (type, value) => {
    setStepData((prev) => {
      const current = prev[type] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const confirmSelection = (type) => {
    const selected = stepData[type];
    if (!selected || selected.length === 0) return;

    const userText = selected.join(', ');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    const newHistory = [...apiHistory, { role: 'user', content: userText }];
    setApiHistory(newHistory);
    setActiveChips({ type: null, suggestions: null });

    requestAIResponse(newHistory, { currentStep, entryData: entry });
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInputText('');

    const newHistory = [...apiHistory, { role: 'user', content: trimmed }];
    setApiHistory(newHistory);

    // Note: we no longer auto-save proofs/strategy on user input.
    // The AI judges step completion via advanceToStep / isComplete flags.
    // We track proofs in the conversation history; AI will surface them when ready.

    requestAIResponse(newHistory, { currentStep, entryData: entry });
  };

  const handleEvidenceResponse = (action) => {
    if (isLoading) return;

    if (action === 'accept') {
      // User accepted the surfaced evidence as their proofs
      setMessages((prev) => [...prev, { role: 'user', text: 'These help' }]);
      const newHistory = [...apiHistory, { role: 'user', content: 'These help. Use these as my opposing proofs.' }];
      setApiHistory(newHistory);
      setActiveChips({ type: null, suggestions: null });
      requestAIResponse(newHistory, { currentStep: 4, entryData: entry });
    } else {
      // User wants to generate their own
      setMessages((prev) => [...prev, { role: 'user', text: 'Generate my own' }]);
      const newHistory = [...apiHistory, { role: 'user', content: "I'd rather generate my own proofs." }];
      setApiHistory(newHistory);
      setActiveChips({ type: null, suggestions: null });
      requestAIResponse(newHistory, { currentStep: 4, entryData: entry });
    }
  };

  const handleNeedHelp = () => {
    if (isLoading) return;

    const primaryWound = stepData.wounds[0];
    const woundData = getWoundData(primaryWound);
    const gentlePrompt = woundData?.gentlePrompts?.[0];

    // Retrieve matching bank entries for this wound
    const matches = retrieveBankMatches(primaryWound, 3);

    setMessages((prev) => [...prev, { role: 'user', text: 'Need help' }]);

    const helpMessage = "I'm stuck. Can you help me find an opposing proof?";
    const newHistory = [...apiHistory, { role: 'user', content: helpMessage }];
    setApiHistory(newHistory);

    // Pass matches to AI so it can frame the surfacing properly
    requestAIResponse(newHistory, {
      currentStep: 4,
      entryData: entry,
      bankMatches: matches.length > 0 ? matches : null,
      gentlePrompt: matches.length === 0 ? gentlePrompt : null,
      // Tell the requestAIResponse to attach matches to the AI's next message
      attachEvidenceCards: matches.length > 0 ? matches : null,
    });
  };

  if (!entry) {
    return <div className="app-content">Loading...</div>;
  }

  const chipOptions = activeChips.suggestions;
  const chipSelected = activeChips.type ? stepData[activeChips.type] || [] : [];
  const promptType = activeChips.type;

  const mergedChipOptions = chipOptions
    ? [...chipSelected.filter((s) => !chipOptions.includes(s)), ...chipOptions]
    : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="top-bar" style={{ flexShrink: 0 }}>
        <button className="top-bar-action" onClick={() => navigate('/process')}>←</button>
        <div style={{ textAlign: 'center' }}>
          <p className="top-bar-title">Process</p>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Step {currentStep} of 6 · {STEP_LABELS[currentStep]}
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
          paddingBottom: '160px',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: msg.evidenceCards ? 'var(--space-3)' : 0,
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
            {msg.evidenceCards && msg.evidenceCards.length > 0 && (
              <div className="fade-in">
                {msg.evidenceCards.map((card, cardIdx) => (
                  <EvidenceCard key={cardIdx} entry={card} />
                ))}
              </div>
            )}
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

        {!isLoading && chipOptions && promptType === 'evidenceResponse' && (
          <div className="fade-in" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleEvidenceResponse('accept')}
                className="chip selected-good"
                style={{ fontWeight: 500 }}
              >
                These help
              </button>
              <button
                onClick={() => handleEvidenceResponse('decline')}
                className="chip"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-subtle)' }}
              >
                Generate my own
              </button>
            </div>
          </div>
        )}

        {!isLoading && chipOptions && promptType !== 'evidenceResponse' && (
          <div className="fade-in" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            <div className="chip-row" style={{ marginBottom: 'var(--space-3)' }}>
              {mergedChipOptions.map((opt) => {
                const isSelected = chipSelected.includes(opt);
                return (
                  <button
                    key={opt}
                    className={`chip ${isSelected ? 'selected-wound' : ''}`}
                    onClick={() => toggleSelection(promptType, opt)}
                    style={{
                      background: isSelected ? undefined : 'var(--bg-card)',
                      border: '0.5px solid var(--border-subtle)',
                    }}
                  >
                    {opt}{isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAllSheet(promptType)}
                style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}
              >
                Show all {promptType}
              </button>
              {chipSelected.length > 0 && (
                <button
                  onClick={() => confirmSelection(promptType)}
                  style={{
                    fontSize: '14px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 500,
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && currentStep === 4 && !chipOptions && (
          <div className="fade-in" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            {stepData.proofs.length > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                {stepData.proofs.length} proof{stepData.proofs.length === 1 ? '' : 's'} so far
              </p>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                onClick={handleNeedHelp}
                className="chip"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-subtle)' }}
              >
                Need help
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: 0,
          right: 0,
          maxWidth: '480px',
          margin: '0 auto',
          background: 'var(--bg-primary)',
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '0.5px solid var(--border-subtle)',
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        <input
          className="text-input"
          placeholder={currentStep === 4 ? 'Type a proof...' : 'Type freely...'}
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

      {showAllSheet && (
        <ShowAllSheet
          title={`All ${showAllSheet}`}
          options={
            showAllSheet === 'wounds' ? allWoundsList :
            showAllSheet === 'emotions' ? allEmotionsList :
            allNeedsList
          }
          selected={chipSelected}
          onToggle={(v) => toggleSelection(showAllSheet, v)}
          onClose={() => setShowAllSheet(null)}
          variant="wound"
        />
      )}
    </div>
  );
}
