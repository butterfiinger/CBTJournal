import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEntries, getGoodMoments, deleteEntry } from '../lib/storage';
import SwipeableCard from '../components/SwipeableCard';

export default function Bank() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('good_moments');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState([]);

  const loadEntries = () => {
    if (filter === 'good_moments') {
      setEntries(getGoodMoments());
    } else if (filter === 'processed') {
      setEntries(getAllEntries().filter((e) => e.status === 'processed'));
    } else if (filter === 'reprogramming') {
      setEntries(
        getAllEntries()
          .filter((e) => e.status === 'reprogramming')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } else {
      // 'all'
      setEntries(getAllEntries().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  };

  useEffect(() => {
    loadEntries();
  }, [filter]);

  const handleDelete = (id) => {
    deleteEntry(id);
    loadEntries();
  };

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const haystack = [
      e.situation || '',
      e.wound || '',
      e.opposite || '',
      ...(e.wounds || []),
      ...(e.woundOpposites || []),
      ...(e.emotions || []),
      ...(e.statements || []),
      e.contextNote || '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const formatDate = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="app-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Journal</h1>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button
          className={`chip ${filter === 'good_moments' ? 'selected-good' : ''}`}
          onClick={() => setFilter('good_moments')}
        >
          Positive memories
        </button>
        <button
          className={`chip ${filter === 'processed' ? 'selected-wound' : ''}`}
          onClick={() => setFilter('processed')}
        >
          Processed
        </button>
        <button
          className={`chip ${filter === 'reprogramming' ? 'selected-wound' : ''}`}
          onClick={() => setFilter('reprogramming')}
          style={filter === 'reprogramming' ? { background: 'rgba(120, 145, 175, 0.18)', color: 'rgb(80, 105, 140)' } : {}}
        >
          Reprogramming
        </button>
        <button
          className={`chip ${filter === 'all' ? 'selected-wound' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      <input
        className="text-input"
        placeholder="Filter by wound, emotion, or text..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-message">
            {filter === 'good_moments' && 'No positive memories banked yet.'}
            {filter === 'processed' && 'No processed entries yet.'}
            {filter === 'reprogramming' && 'No reprogramming sessions yet.'}
            {filter === 'all' && 'Nothing banked yet.'}
          </p>
          <p className="empty-state-helper">
            {filter === 'reprogramming'
              ? 'When you complete a reprogramming session, it lands here.'
              : 'When you log a positive memory or process a trigger, it lands here.'}
          </p>
          {filter === 'reprogramming' && (
            <button
              className="btn-primary"
              onClick={() => navigate('/reprogram')}
              style={{ marginTop: 'var(--space-4)', maxWidth: '240px' }}
            >
              Start a session
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className="field-label" style={{ marginBottom: 'var(--space-3)' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((entry) => (
              <SwipeableCard key={entry.id} onDelete={() => handleDelete(entry.id)}>
                {entry.status === 'reprogramming' ? (
                  <ReprogrammingCard entry={entry} formatDate={formatDate} />
                ) : (
                  <RegularCard entry={entry} formatDate={formatDate} />
                )}
              </SwipeableCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RegularCard({ entry, formatDate }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
        {formatDate(entry.createdAt)}
        {entry.contextNote && ` · ${entry.contextNote}`}
        {entry.source === 'reprogramming' && ' · from reprogramming'}
      </p>
      <p style={{ fontSize: '16px', marginBottom: 'var(--space-2)', lineHeight: 1.5 }}>
        {entry.situation}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {(entry.woundOpposites || []).map((tag) => (
          <span key={tag} className="tag-mini good">{tag}</span>
        ))}
        {(entry.wounds || []).map((tag) => (
          <span key={tag} className="tag-mini wound">{tag}</span>
        ))}
        {(entry.emotions || []).map((tag) => (
          <span key={tag} className="tag-mini emotion">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function ReprogrammingCard({ entry, formatDate }) {
  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-4)',
        border: '0.5px solid rgba(120, 145, 175, 0.25)',
        background: 'rgba(120, 145, 175, 0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          {formatDate(entry.createdAt)} · Reprogramming
        </p>
        <span style={{
          fontSize: '11px',
          color: 'rgb(80, 105, 140)',
          background: 'rgba(120, 145, 175, 0.12)',
          padding: '2px 8px',
          borderRadius: '10px',
        }}>
          {entry.completedAreas || (entry.statements || []).length} of 7
        </span>
      </div>
      <p style={{ fontSize: '15px', marginBottom: 'var(--space-3)', fontWeight: 500 }}>
        {entry.wound} → {entry.opposite}
      </p>
      {entry.statements && entry.statements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entry.statements.slice(0, 3).map((statement, idx) => (
            <p key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              · {statement}
            </p>
          ))}
          {entry.statements.length > 3 && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              + {entry.statements.length - 3} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
