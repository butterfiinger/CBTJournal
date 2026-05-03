import { useState, useEffect } from 'react';
import { getAllEntries, getGoodMoments } from '../lib/storage';

export default function Bank() {
  const [filter, setFilter] = useState('good_moments');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (filter === 'good_moments') {
      setEntries(getGoodMoments());
    } else if (filter === 'processed') {
      setEntries(getAllEntries().filter((e) => e.status === 'processed'));
    } else {
      // 'all'
      setEntries(getAllEntries().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  }, [filter]);

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const haystack = [
      e.situation || '',
      ...(e.wounds || []),
      ...(e.woundOpposites || []),
      ...(e.emotions || []),
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

      <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
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
            {filter === 'all' && 'Nothing banked yet.'}
          </p>
          <p className="empty-state-helper">
            When you log a positive memory or process a trigger, it lands here.
          </p>
        </div>
      ) : (
        <div>
          <p className="field-label" style={{ marginBottom: 'var(--space-3)' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((entry) => (
              <div key={entry.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                  {formatDate(entry.createdAt)}
                  {entry.contextNote && ` · ${entry.contextNote}`}
                </p>
                <p style={{ fontSize: '16px', marginBottom: 'var(--space-2)', lineHeight: 1.5 }}>
                  {entry.situation}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(entry.woundOpposites || []).map((tag) => (
                    <span key={tag} className="tag-mini good">
                      {tag}
                    </span>
                  ))}
                  {(entry.wounds || []).map((tag) => (
                    <span key={tag} className="tag-mini wound">
                      {tag}
                    </span>
                  ))}
                  {(entry.emotions || []).map((tag) => (
                    <span key={tag} className="tag-mini emotion">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
