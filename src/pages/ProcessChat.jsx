import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllEntries, saveEntry } from '../lib/storage';
import wounds from '../data/wounds.json';
import emotions from '../data/emotions.json';
import needs from '../data/needs.json';
import defaults from '../data/defaults.json';
import ShowAllSheet from '../components/ShowAllSheet';

// Step labels for the header
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

  // Load the entry we're processing
  const [entry, setEntry] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Selected tags accumulated through the conversation
  const [stepData, setStepData] = useState({
    emotions: [],
    wounds: [],
    needs: [],
    proofs: [],
    strategy: '',
  });

  // UI state for the active prompt — what kind of response is the AI waiting for
  const [activePrompt, setActivePrompt] = useState(null);
  // activePrompt can be: { type: 'emotions' | 'wounds' | 'needs' | 'text' | 'proofs' | 'help_offered' | null }

  const [showAllSheet, setShowAllSheet] = useState(null); // null | 'emotions' | 'wounds' | 'needs'

  const allWoundsList = useMemo(() => wounds.map((w) => w.wound), []);
  const allEmotionsList = useMemo(() => emotions.map((e) => e.emotion), []);
  const allNeedsList = useMemo(() => needs.map((n) => n.need), []);

  // Find the wound's AI phrasing for Step 4
  const getWoundData = (woundText) => {
    return wounds.find((w) => w.wound === woundText);
  };

  // Initial load: find the entry and set up the conversation
  useEffect(() => {
    const allEntries = getAllEntries();
    const found = allEntries.find((e) => e.id === entryId);

    if (!found) {
      navigate('/process');
      return;
    }

    setEntry(found);

    // Pre-populate stepData if the capture had data
    setStepData((prev) => ({
      ...prev,
      emotions: found.emotions || [],
      wounds: found.wounds || [],
    }));

    // Build the opening message based on whether this was pre-captured
    const hasCapture = (found.wounds || []).length > 0 && (found.emotions || []).length > 0;

    if (hasCapture) {
      // Skip Step 1 (already have situation, wounds, emotions) — start at Step 2
      setCurrentStep(2);
      const openingText = `I see what just happened${found.contextNote ? ` with ${found.contextNote}` : ''}. You've named ${formatList(found.wounds)} as what came up. You're feeling ${formatList(found.emotions)}.\n\nLet's stay with this. What did you make this mean about you?`;

      setMessages([
        { role: 'ai', text: openingText },
      ]);
      setActivePrompt({ type: 'wounds' });
    } else {
      // Start at Step 1
      setCurrentStep(1);
      setMessages([
        { role: 'ai', text: "What's sitting with you? Take me back to the moment." },
      ]);
      setActivePrompt({ type: 'text' });
    }
  }, [entryId, navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatList = (items) => {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return `'${items[0]}'`;
    if (items.length === 2) return `'${items[0]}' and '${items[1]}'`;
    return items.slice(0, -1).map((i) => `'${i}'`).join(', ') + `, and '${items[items.length - 1]}'`;
  };

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  // Handler for chip tap during a multi-select moment
  const toggleSelection = (type, value) => {
    setStepData((prev) => {
      const current = prev[type] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  // User confirms their chip selection and moves forward
  const confirmSelection = (type) => {
    const selected = stepData[type];
    if (!selected || selected.length === 0) return;

    // Echo the user's selection as a message
    addMessage('user', selected.join(', '));

    // Advance to next step based on current step
    setTimeout(() => advanceFlow(type, selected), 400);
  };

  // The state machine for advancing through the 6 steps
  const advanceFlow = (justAnsweredType, selected) => {
    if (currentStep === 1 && justAnsweredType === 'emotions') {
      // After emotions, go to Step 2 (wound identification)
      setCurrentStep(2);
      addMessage('ai', "What did you make this mean about you?");
      setActivePrompt({ type: 'wounds' });
    } else if (currentStep === 2 && justAnsweredType === 'wounds') {
      // Mirror the wound, move to Step 3
      const primaryWound = selected[0];
      setCurrentStep(3);
      addMessage('ai', `There it is. Can you know with certainty that this is true?`);
      setActivePrompt({ type: 'text' });
    } else if (currentStep === 3) {
      // After Step 3, move to Step 4
      const primaryWound = stepData.wounds[0] || selected[0];
      const woundData = getWoundData(primaryWound);
      const phrasing = woundData?.aiPhrasing || `times the opposite has been true`;

      setCurrentStep(4);
      addMessage(
        'ai',
        `Now — find three proofs that oppose '${primaryWound}.' ${phrasing}. Take your time.`
      );
      setActivePrompt({ type: 'proofs' });
    } else if (currentStep === 4 && justAnsweredType === 'proofs') {
      setCurrentStep(5);
      addMessage('ai', "What's your need in this situation to create relief?");
      setActivePrompt({ type: 'needs' });
    } else if (currentStep === 5 && justAnsweredType === 'needs') {
      setCurrentStep(6);
      addMessage('ai', "What's a healthy strategy to get this need met?");
      setActivePrompt({ type: 'text', isStrategy: true });
    }
  };

  // Handle text input send
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    addMessage('user', trimmed);
    setInputText('');

    // Different handling based on current step and activePrompt
    if (currentStep === 1 && activePrompt?.type === 'text') {
      // User just typed the situation — store it and move to emotions
      setEntry((prev) => ({ ...prev, situation: trimmed }));
      setTimeout(() => {
        addMessage('ai', "What are you feeling right now?");
        setActivePrompt({ type: 'emotions' });
      }, 400);
    } else if (currentStep === 3) {
      // User answered the certainty question — move to Step 4
      setTimeout(() => advanceFlow('certainty', null), 400);
    } else if (currentStep === 4 && activePrompt?.type === 'proofs') {
      // User typed a proof
      setStepData((prev) => ({ ...prev, proofs: [...prev.proofs, trimmed] }));
      // Stay at Step 4 — no AI response, let user keep adding or proceed
    } else if (currentStep === 6) {
      // Final strategy
      setStepData((prev) => ({ ...prev, strategy: trimmed }));
      setTimeout(() => {
        addMessage('ai', "This is yours now. The work is in the small choices that follow.");
        setActivePrompt(null);
        // Save the processed entry
        finishProcessing(trimmed);
      }, 600);
    }
  };

  const finishProcessing = (finalStrategy) => {
    if (!entry) return;
    saveEntry({
      ...entry,
      status: 'processed',
      situation: entry.situation,
      wounds: stepData.wounds,
      emotions: stepData.emotions,
      proofs: stepData.proofs,
      needs: stepData.needs,
      strategy: finalStrategy,
      processedAt: new Date().toISOString(),
    });
  };

  // User finished their proofs at Step 4, ready to advance to Step 5
  const finishProofs = () => {
    if (stepData.proofs.length === 0) return;
    advanceFlow('proofs', stepData.proofs);
  };

  // User taps "Need help" at Step 4
  const handleNeedHelp = () => {
    const primaryWound = stepData.wounds[0];
    const woundData = getWoundData(primaryWound);
    const oppositeText = woundData?.opposite || 'the opposite';

    // For 2b, no actual retrieval — just acknowledge and offer scripted prompt
    addMessage(
      'ai',
      `Your bank is still thin for this wound — that's just where you are right now. Let me try a different angle.\n\n${woundData?.gentlePrompts?.[0] || 'Think of when the opposite was quietly true.'}\n\nSee what comes up.`
    );
    setActivePrompt({ type: 'proofs' });
  };

  // Determine what chip options to show right now
  const getChipOptions = () => {
    if (activePrompt?.type === 'emotions') return defaults.defaultEmotionChips;
    if (activePrompt?.type === 'wounds') return defaults.defaultWoundChips;
    if (activePrompt?.type === 'needs') return defaults.defaultWoundChips; // placeholder — real needs suggestion via AI later
    return null;
  };

  const getChipSelected = () => {
    if (activePrompt?.type === 'emotions') return stepData.emotions;
    if (activePrompt?.type === 'wounds') return stepData.wounds;
    if (activePrompt?.type === 'needs') return stepData.needs;
    return [];
  };

  if (!entry) {
    return <div className="app-content">Loading...</div>;
  }

  const chipOptions = getChipOptions();
  const chipSelected = getChipSelected();
  const promptType = activePrompt?.type;

  // Merge defaults with selected items not in defaults (same logic as ChipRow)
  const mergedChipOptions = chipOptions
    ? [...chipSelected.filter((s) => !chipOptions.includes(s)), ...chipOptions]
    : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="top-bar">
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
          padding: 'var(--space-4) var(--space-5) var(--space-4)',
          background: 'var(--bg-secondary)',
          overflowY: 'auto',
          paddingBottom: '120px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 'var(--space-4)',
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
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Inline chip row when activePrompt expects chip selection */}
        {chipOptions && (
          <div className="fade-in" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            <div className="chip-row" style={{ marginBottom: 'var(--space-3)' }}>
              {mergedChipOptions.map((opt) => {
                const isSelected = chipSelected.includes(opt);
                return (
                  <button
                    key={opt}
                    className={`chip ${isSelected ? 'selected-wound' : ''}`}
                    onClick={() => toggleSelection(promptType, opt)}
                    style={{ background: isSelected ? undefined : 'var(--bg-card)', border: '0.5px solid var(--border-subtle)' }}
                  >
                    {opt}{isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAllSheet(promptType)}
                style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'underline' }}
              >
                Show all {promptType}
              </button>
              {chipSelected.length > 0 && (
                <button
                  onClick={() => confirmSelection(promptType)}
                  style={{
                    fontSize: '12px',
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

        {/* Need help button at Step 4 */}
        {currentStep === 4 && activePrompt?.type === 'proofs' && (
          <div className="fade-in" style={{ marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
            {stepData.proofs.length > 0 && (
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
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
              {stepData.proofs.length > 0 && (
                <button
                  onClick={finishProofs}
                  className="chip"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 500 }}
                >
                  Done with proofs →
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Text input — always available */}
      <div
        style={{
          position: 'fixed',
          bottom: '60px',
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
          placeholder={
            currentStep === 4 ? 'Type a proof...' : 'Type freely...'
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          style={{ borderRadius: 'var(--radius-pill)', minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          style={{
            width: '40px',
            height: '40px',
            background: inputText.trim() ? 'var(--text-primary)' : 'var(--bg-tertiary)',
            color: 'var(--bg-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s ease',
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
