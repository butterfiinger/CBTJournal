import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ChipRow from '../components/ChipRow';
import ShowAllSheet from '../components/ShowAllSheet';
import { saveEntry } from '../lib/storage';
import wounds from '../data/wounds.json';
import emotions from '../data/emotions.json';
import defaults from '../data/defaults.json';

export default function Capture() {
  const navigate = useNavigate();
  const [situation, setSituation] = useState('');
  const [selectedWounds, setSelectedWounds] = useState([]);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [contextNote, setContextNote] = useState('');
  const [showAllWounds, setShowAllWounds] = useState(false);
  const [showAllEmotions, setShowAllEmotions] = useState(false);

  const woundChipOptions = defaults.defaultWoundChips;
  const emotionChipOptions = defaults.defaultEmotionChips;

  const allWounds = useMemo(() => wounds.map((w) => w.wound), []);
  const allEmotions = useMemo(() => emotions.map((e) => e.emotion), []);

  const toggleWound = (w) => {
    setSelectedWounds((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  };

  const toggleEmotion = (e) => {
    setSelectedEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  // Only the situation is required now — wounds and emotions are both optional
  const canSave = situation.trim().length > 0;

  const saveForLater = () => {
    if (!canSave) return;
    saveEntry({
      status: 'captured',
      situation: situation.trim(),
      wounds: selectedWounds,
      emotions: selectedEmotions,
      contextNote: contextNote.trim() || null,
    });
    navigate('/');
  };

  const processNow = () => {
    if (!canSave) return;
    const saved = saveEntry({
      status: 'captured',
      situation: situation.trim(),
      wounds: selectedWounds,
      emotions: selectedEmotions,
      contextNote: contextNote.trim() || null,
    });
    navigate(`/process/${saved.id}`);
  };

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/')}>
          ← Cancel
        </button>
        <span className="top-bar-title">Capture trigger</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-5)' }}>
        <div className="section">
          <label className="field-label">What happened</label>
          <textarea
            className="text-input"
            placeholder="A sentence or two. Just enough to remember the moment..."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={3}
          />
        </div>

        {/* Emotions now appear BEFORE wounds — easier to identify in the moment */}
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>
              Emotions · <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--text-tertiary)' }}>optional</span>
            </label>
            <button onClick={() => setShowAllEmotions(true)} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Show all
            </button>
          </div>
          <ChipRow
            options={emotionChipOptions}
            selected={selectedEmotions}
            onToggle={toggleEmotion}
            variant="wound"
          />
        </div>

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>
              Wound · <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--text-tertiary)' }}>optional, you can identify this later</span>
            </label>
            <button onClick={() => setShowAllWounds(true)} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Show all
            </button>
          </div>
          <ChipRow
            options={woundChipOptions}
            selected={selectedWounds}
            onToggle={toggleWound}
            variant="wound"
          />
        </div>

        <div className="section">
          <label className="field-label">Optional · who or what</label>
          <input
            className="text-input"
            placeholder="e.g. mom, work, partner"
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
          />
        </div>
      </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: 'var(--space-4) var(--space-5) calc(var(--space-4) + env(safe-area-inset-bottom))',
          borderTop: '0.5px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={saveForLater}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.4, flex: 1 }}
          >
            Save for later
          </button>
          <button
            className="btn-primary"
            onClick={processNow}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.4, flex: 1 }}
          >
            Process now →
          </button>
        </div>
      </div>

      {showAllWounds && (
        <ShowAllSheet
          title="All wounds"
          options={allWounds}
          selected={selectedWounds}
          onToggle={toggleWound}
          onClose={() => setShowAllWounds(false)}
          variant="wound"
        />
      )}

      {showAllEmotions && (
        <ShowAllSheet
          title="All emotions"
          options={allEmotions}
          selected={selectedEmotions}
          onToggle={toggleEmotion}
          onClose={() => setShowAllEmotions(false)}
          variant="wound"
        />
      )}
    </div>
  );
}
