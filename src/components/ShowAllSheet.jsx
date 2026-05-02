import { useState } from 'react';

export default function ShowAllSheet({ title, options, selected, onToggle, onClose, variant = 'wound' }) {
  const [search, setSearch] = useState('');

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClass = variant === 'good' ? 'selected-good' : 'selected-wound';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-primary)',
        zIndex: 100,
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="top-bar">
        <button className="top-bar-action" onClick={onClose}>
          Cancel
        </button>
        <span className="top-bar-title">{title}</span>
        <button className="top-bar-action" onClick={onClose} style={{ fontWeight: 500, color: 'var(--accent-info)' }}>
          Done · {selected.length}
        </button>
      </div>

      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <input
          className="text-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selected.length > 0 && (
        <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
          <p className="field-label">Selected · {selected.length}</p>
          <div className="chip-row">
            {selected.map((opt) => (
              <button
                key={opt}
                className={`chip ${selectedClass}`}
                onClick={() => onToggle(opt)}
              >
                {opt} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '0 var(--space-5) var(--space-8)',
          flex: 1,
          overflowY: 'auto',
          borderTop: '0.5px solid var(--border-subtle)',
          paddingTop: 'var(--space-4)',
        }}
      >
        <p className="field-label">All · {filtered.length}</p>
        <div className="chip-row">
          {filtered.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                className={`chip ${isSelected ? selectedClass : ''}`}
                onClick={() => onToggle(opt)}
              >
                {opt}
                {isSelected && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
