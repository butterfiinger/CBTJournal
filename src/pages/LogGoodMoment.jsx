import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ChipRow from '../components/ChipRow';
import ShowAllSheet from '../components/ShowAllSheet';
import PhotoUploadButton from '../components/PhotoUploadButton';
import { saveEntry } from '../lib/storage';
import wounds from '../data/wounds.json';
import defaults from '../data/defaults.json';

export default function LogGoodMoment() {
  const navigate = useNavigate();
  const [situation, setSituation] = useState('');
  const [selectedOpposites, setSelectedOpposites] = useState([]);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [senseDetail, setSenseDetail] = useState('');
  const [showAllOpposites, setShowAllOpposites] = useState(false);
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // Build the wound-opposites list from wounds data
  const allWoundOpposites = useMemo(() => {
    return [...new Set(wounds.map((w) => w.opposite))];
  }, []);

  // Use the curated positive emotions list — only positive feelings appear here
  const allEmotions = defaults.positiveEmotions;

  const oppositeChipOptions = defaults.defaultWoundOppositeChips;
  const emotionChipOptions = defaults.defaultGoodMomentEmotionChips;

  const toggleOpposite = (o) => {
    setSelectedOpposites((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  };

  const toggleEmotion = (e) => {
    setSelectedEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const canSave =
    situation.trim().length > 0 && selectedOpposites.length > 0 && selectedEmotions.length > 0;

  const bankIt = () => {
    if (!canSave) return;
    saveEntry({
      status: 'good_moment',
      situation: situation.trim(),
      woundOpposites: selectedOpposites,
      emotions: selectedEmotions,
      senseDetail: senseDetail.trim() || null,
    });
    navigate('/bank');
  };

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/')}>
          ← Cancel
        </button>
        <span className="top-bar-title">Log positive memory</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-5)' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 'var(--space-5)' }}>
          A moment that felt right. Future-you will draw on this when something hurts.
        </p>

        <div className="section">
          <label className="field-label">What happened</label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="text-input"
              placeholder="A sentence is enough. Whatever made the moment land..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={3}
              style={{ paddingRight: '52px' }}
            />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
              <PhotoUploadButton
                size="sm"
                onExtracted={(text) => {
                  setSituation((prev) => (prev ? `${prev}\n\n${text}` : text));
                  setPhotoError(null);
                }}
                onError={(msg) => setPhotoError(msg)}
              />
            </div>
          </div>
          {photoError && (
            <p style={{ fontSize: '13px', color: 'var(--accent-warm)', marginTop: '8px' }}>
              {photoError}
            </p>
          )}
        </div>

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>This is evidence of · pick one or more</label>
            <button
              onClick={() => setShowAllOpposites(true)}
              style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}
            >
              Show all
            </button>
          </div>
          <ChipRow
            options={oppositeChipOptions}
            selected={selectedOpposites}
            onToggle={toggleOpposite}
            variant="good"
          />
        </div>

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>Emotions · pick any</label>
            <button
              onClick={() => setShowAllEmotions(true)}
              style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}
            >
              Show all
            </button>
          </div>
          <ChipRow
            options={emotionChipOptions}
            selected={selectedEmotions}
            onToggle={toggleEmotion}
            variant="good"
          />
        </div>

        <div className="section">
          <label className="field-label">Optional · sense detail</label>
          <input
            className="text-input"
            placeholder="how it felt in your body, what you saw..."
            value={senseDetail}
            onChange={(e) => setSenseDetail(e.target.value)}
          />
          <p className="field-helper">Sense detail anchors the moment more deeply.</p>
        </div>
      </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: 'var(--space-4) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom))',
          borderTop: '0.5px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}
      >
        <button
          className="btn-primary"
          onClick={bankIt}
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.4 }}
        >
          Save this moment
        </button>
      </div>

      {showAllOpposites && (
        <ShowAllSheet
          title="All wound-opposites"
          options={allWoundOpposites}
          selected={selectedOpposites}
          onToggle={toggleOpposite}
          onClose={() => setShowAllOpposites(false)}
          variant="good"
        />
      )}

      {showAllEmotions && (
        <ShowAllSheet
          title="All emotions"
          options={allEmotions}
          selected={selectedEmotions}
          onToggle={toggleEmotion}
          onClose={() => setShowAllEmotions(false)}
          variant="good"
        />
      )}
    </div>
  );
}
